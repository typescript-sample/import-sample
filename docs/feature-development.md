# Feature Development Guide for AI-Assisted Changes

## Start with the contract

Before writing code, describe the feature in terms of:

1. Input: where the data comes from and its exact shape (fixed-width file, environment/config value, or another source).
2. Domain object: the TypeScript interface and its required/optional fields.
3. Validation: which rules apply and where they belong.
4. Transformation: how raw data becomes typed values, including date, numeric, and boolean rules.
5. Persistence: the target table/columns and the mapping from domain properties to SQL columns.
6. Failure behavior: whether a bad record fails, is reported and skipped, or aborts a file/service.
7. Observability: what should be logged and at which level.

Do not fill gaps in these requirements with invented file widths, status codes, date formats, or database behavior.

## Follow the existing module shape when appropriate

For another entity with the same fixed-width-to-MySQL flow, consider this structure:

```text
src/<entity>/
  index.ts
  <entity>.ts
  transformer.ts
  validator.ts
  writer.ts
  service.ts
  port.ts        # only when explicit collaborator interfaces are useful
```

This is a pattern, not a mandatory checklist. Add only files that have a real responsibility. Use the current user module as a reference for small package adapters and shared metadata.

Typical responsibilities:

- `<entity>.ts`: interface and shared fixed-width metadata.
- `transformer.ts`: extends `FixedLengthTransformer<T>` and uses the shared metadata when the source format is fixed-width.
- `validator.ts`: extends `Validator<T>` and uses the same metadata where appropriate.
- `writer.ts`: extends `MySQLWriter<T>` and identifies the correct table and shared metadata.
- `service.ts`: extends `ImportService<T, I>` and wires the required collaborators.
- `index.ts`: exports only the intended public API.

Do not create a writer/transformer/validator subclass if the feature does not need that behavior.

## Integrate at the composition root

`src/app.ts` currently owns runtime wiring: configuration, file discovery, logger, pool, handlers, and the user-specific collaborators. When a new import job is required, wire it there or extract a clearly named orchestration function if the application is growing. Avoid hiding process startup or filesystem scanning inside a domain model.

Keep shared infrastructure (pool, logger, handlers) shared where that is the intended lifecycle. Preserve the current sequential processing unless concurrency has been explicitly designed.

## Database changes

- Update the DDL/schema documentation and the corresponding domain representation together.
- Confirm nullability, primary/unique keys, field types, maximum lengths, and any status-value constraints.
- Check whether incoming data width differs from database width; document both independently.
- Confirm how the installed writer maps property names to database column names.
- Do not rely on implicit conversions for identifiers, booleans, or dates when the contracts disagree.

## Dependency/API changes

The application uses `config-plus`, `import-service`, `logger-core`, `mysql2`, `mysql2-core`, `onecore`, and `validation-core`. Their implementation is not part of this repository. Before changing constructor calls or relying on behavior not demonstrated here:

1. inspect the package version in `package-lock.json`;
2. inspect the installed `.d.ts` declarations or package source;
3. add a focused example or test if the behavior is important;
4. update the relevant documentation with the verified behavior.

Avoid adding a dependency for a capability already covered by the existing stack.

## Completion checklist

- [ ] The feature is implemented in the correct layer.
- [ ] Input, TypeScript, validation, and database contracts are aligned.
- [ ] Existing generic package adapters are reused appropriately.
- [ ] New public exports are added to the module barrel only when needed.
- [ ] Logging includes useful file/service context without leaking sensitive data.
- [ ] Cleanup remains correct for success and failure paths.
- [ ] TypeScript build/type-checks have been run where dependencies permit.
- [ ] Any unavailable test/lint checks are reported accurately.
- [ ] The relevant docs are updated.
