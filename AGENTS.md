# AI Project Guide

## Purpose

This repository is a small TypeScript/Node.js batch importer. It scans a configured directory for matching files, reads each file as an asynchronous stream of strings, transforms fixed-width records into `User` objects, validates them, and writes accepted records to the MySQL table `userimport`.

The project is intentionally built by composing focused `core-ts` packages. Preserve this composition style; do not turn the application into a large framework or move package-level responsibilities into unrelated layers.

## Read these documents before changing code

1. [`docs/architecture.md`](docs/architecture.md) — components, dependencies, and runtime flow.
2. [`docs/import-pipeline.md`](docs/import-pipeline.md) — how the file-import pipeline is assembled.
3. [`docs/data-model.md`](docs/data-model.md) — the supplied MySQL schema, TypeScript model, fixed-width layout, and unresolved mismatches.
4. [`docs/coding-conventions.md`](docs/coding-conventions.md) — observed TypeScript and formatting conventions.
5. [`docs/operations.md`](docs/operations.md) — configuration, directories, logging, and build/run commands.
6. [`docs/feature-development.md`](docs/feature-development.md) — a safe workflow for adding features in the existing style.

## Source-of-truth rules

- Treat the current source code as authoritative for existing implementation behavior.
- Treat the supplied `userimport` DDL in `docs/data-model.md` as the database schema for this project.
- Treat `userModel` in `src/user/user.ts` as the current fixed-width import/validation metadata. Its `length` values describe the import record layout; do **not** assume they are MySQL column sizes.
- Treat the TypeScript `User` interface as the current compile-time shape, but do not assume it agrees with the runtime transformer, validator, or database writer. The known discrepancies are recorded in `docs/data-model.md` and must be considered before changing the affected fields.
- Third-party package implementation details are not included in this repository. Do not guess the meaning of positional boolean/number arguments or undocumented callback behavior. Preserve existing calls unless the package API has been verified from its installed version's typings, source, or documentation.

## Architectural rules

- Keep the application entry point and orchestration in `src/app.ts`.
- Keep user-specific model and import components under `src/user/`.
- Follow the existing adapter/subclass pattern where appropriate: user-specific classes extend the relevant package class and pass the shared `userModel` metadata.
- Keep file reading, transformation, validation, import orchestration, database writing, logging, and configuration as separate responsibilities.
- Reuse the existing `import-service`, `mysql2-core`, `validation-core`, `onecore`, and logging abstractions when they fit. Do not replace them with a new framework or a second database abstraction without a concrete requirement.
- Keep the per-file processing loop sequential unless a feature explicitly requires concurrency and its database, ordering, and error-handling implications have been designed.
- Do not add application-specific SQL or data conversion to the wrong layer. Database writes belong in a writer; fixed-width parsing belongs in a transformer/model definition; validation belongs in a validator; orchestration belongs in the service or entry point as appropriate.

## TypeScript and style rules

- Use strict TypeScript. Avoid `any`; define or reuse interfaces for data passed between components.
- Use the existing import style, double-quoted strings, no semicolons, two-space indentation, and trailing commas where Prettier applies them.
- Use `PascalCase` for classes and interfaces, and `camelCase` for variables, functions, and properties.
- Use `async`/`await` and explicit Promise/return types in the style already present.
- Prefer relative imports without file extensions, as in the current source.
- Export public user-domain components through `src/user/index.ts` when they are intended to be imported from the user module. Keep internal-only components out of the barrel unless needed.
- Do not introduce a new formatting, linting, or test framework merely to add one feature.

## Adding a feature

Before editing:

1. Identify the input contract and whether the feature belongs to file selection, reading, transformation, validation, import orchestration, persistence, configuration, or logging.
2. Read the relevant source files and the corresponding reference document above.
3. Check whether the feature changes the fixed-width file layout, the `User` object, the MySQL table, or more than one of them. Keep those contracts aligned deliberately.
4. Check the actual installed package API before changing calls to external `core-ts` packages.

While editing:

1. Make the smallest cohesive change in the existing layer.
2. Reuse `userModel` when the same field metadata is needed by transformer, validator, and writer.
3. Update `src/user/index.ts` only for intended public exports.
4. Update the appropriate docs when behavior, schema, configuration, or conventions change.
5. Do not invent status values, date formats, import-file record lengths, or error semantics that are not specified by code or requirements.

After editing:

1. Run the build/type checks supported by the available dependencies.
2. Review the generated diff for accidental changes to existing behavior.
3. Do not report `npm test` as successful: the current `test` script is a placeholder that intentionally exits with an error.
4. The current `lint` script points to `.eslintrc.js`, which is not present in the supplied project archive. Confirm the configuration exists before claiming lint passed.
5. Report any checks that could not be run and any unresolved schema or package-API assumptions.

## Known issues to preserve as explicit questions

- `User.id` is typed as `string`, while `userModel.id` declares `type: "number"`; the SQL column is `varchar(45)`.
- `User.status` is typed as `boolean`, while `userModel.status` declares no conversion type and the SQL column is `varchar(45)`.
- `User.email` is optional in TypeScript, while `userModel.email` is marked `required: true`.
- `createdDate` in TypeScript/model differs in casing from the SQL column `createddate`; verify the actual `mysql2-core` column mapping before introducing a rename.
- The meanings of `new UserImportService(..., 3, ...)`, `super(1, ...)`, and the final `true` arguments passed to `Validator` and `MySQLWriter` are not defined in this repository. Do not infer their meaning.
