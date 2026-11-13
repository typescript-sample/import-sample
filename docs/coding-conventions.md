# Coding Conventions Observed in This Project

This document records conventions visible in the supplied repository. Prefer consistency with these conventions over introducing a new style.

## Formatting

The repository's `.prettierrc.json` specifies:

- `printWidth`: 160
- `tabWidth`: 2
- `trailingComma`: `"all"`
- `semi`: `false`
- `singleQuote`: `false`

Therefore, use two spaces, double-quoted strings, no semicolons, and trailing commas where applicable. Keep lines within the configured width where practical.

## Naming

- Classes and interfaces use `PascalCase`: `UserImportService`, `UserTransformer`, `UserWriter`, `UserValidator`, `User`.
- Variables, parameters, functions, and properties use `camelCase`: `importDirectory`, `filename`, `createdDate`, `progressSize`.
- Files are lowercase and use descriptive names: `service.ts`, `transformer.ts`, `validator.ts`, `writer.ts`, `user.ts`, `port.ts`.
- A feature-specific module groups related files under a directory such as `src/user/`.

## Imports and exports

- Use ES module `import`/`export` syntax.
- Keep third-party package imports before relative project imports, following `src/app.ts`.
- Use relative imports without `.ts` extensions.
- Use a module `index.ts` as a barrel for the public exports intended by that module.
- The current `src/user/index.ts` exports service, model, validator, and writer. `port.ts` and `transformer.ts` are imported directly where needed and are not currently barrel-exported.

## Types and asynchronous code

- `tsconfig.json` enables `strict` mode. Preserve explicit types and avoid `any`.
- Use interfaces to define domain records and collaborator contracts.
- Use `Promise<T>` for asynchronous interface methods, as in `UserValidator`, `UserTransformer`, `UserWriter`, and `UserService`.
- Use `async`/`await` for asynchronous orchestration.
- Prefer the existing generic package abstractions and subclass adapters when building a component that fits the same role.

## Class and adapter pattern

The user module uses small subclasses that configure reusable package implementations:

```ts
export class UserTransformer extends FixedLengthTransformer<User> {
  constructor() {
    super(userModel)
  }
}
```

```ts
export class UserWriter extends MySQLWriter<User> {
  constructor(pool: Pool) {
    super(pool, "userimport", userModel, true)
  }
}
```

Follow this pattern when the new component is genuinely an adapter to an existing package class. Keep domain-specific rules in the domain layer and avoid unnecessary wrappers that add no behavior or configuration.

## Error and log style

- Log operational events through the configured `logger` in `app.ts`.
- Use `logger.info(...)` for service start/end, file start, and import result messages.
- Use `logger.error(...)` for caught file and service errors.
- The current application formats caught errors with `toString(err)` from `import-service`.
- Preserve enough context in error messages to identify the service or file involved.

## Comments and tests

- The supplied source contains few comments; keep code self-explanatory and add comments for non-obvious behavior or constraints.
- No test files or test framework are present in the supplied archive.
- The package's `test` script is a placeholder (`echo ... && exit 1`), not a functioning test suite.
- Add tests only when a test framework and project convention have been selected; do not claim tests passed by running the placeholder script.
