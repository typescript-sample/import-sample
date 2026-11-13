# Architecture

## Overview

The application is a batch-oriented TypeScript service with one domain area, `user`. The application composes small packages for configuration, logging, file import, validation, and MySQL access.

```text
src/app.ts
  ├─ load .env and merge configuration
  ├─ create log writers and logger
  ├─ create MySQL pool
  ├─ select matching files in cfg.file.path
  └─ process files sequentially
       ├─ createReader(file) -> AsyncIterable<string>
       └─ UserImportService
            ├─ UserTransformer -> User
            ├─ UserValidator -> ErrorMessage[]
            ├─ UserErrorHandler / ExceptionHandler
            └─ UserWriter -> MySQL table: userimport
```

The diagram describes the dependencies visible in this repository. The internal execution details of `ImportService`, `FixedLengthTransformer`, `Validator`, and `MySQLWriter` are implemented in dependencies and are not reproduced here.

## Source layout

| File | Responsibility |
| --- | --- |
| `src/app.ts` | Composition root: loads configuration, creates logger/pool/handlers, discovers files, wires user components, runs imports, and closes resources. |
| `src/config.ts` | Default service, file, database, and log configuration plus `sit` and `prd` overrides. |
| `src/user/user.ts` | `User` interface and shared `userModel` fixed-width metadata. |
| `src/user/transformer.ts` | User-specific `FixedLengthTransformer<User>` adapter. |
| `src/user/validator.ts` | User-specific `Validator<User>` adapter. |
| `src/user/writer.ts` | User-specific `MySQLWriter<User>` adapter for table `userimport`. |
| `src/user/service.ts` | User-specific `ImportService<User, string>` subclass. |
| `src/user/port.ts` | Interfaces for the user import collaborators. |
| `src/user/index.ts` | Barrel exports for the user service, model, validator, and writer. |

## Responsibility boundaries

- **Application composition:** `app.ts` decides which files to process and wires implementations together. It should not become the home for field-level parsing or SQL mapping.
- **Configuration:** `config.ts` contains defaults and named environment overrides. Avoid scattering environment reads through domain classes.
- **Record contract and metadata:** `user.ts` owns the TypeScript shape and the shared fixed-width `userModel` object.
- **Transformation:** `transformer.ts` adapts the generic fixed-width transformer to the `User` model.
- **Validation:** `validator.ts` adapts the generic validator to the same model metadata.
- **Persistence:** `writer.ts` adapts `MySQLWriter` to the `userimport` table.
- **Import coordination:** `service.ts` adapts the generic `ImportService` to `User` records and string input records.

## Dependency direction

The application entry point depends on concrete user components. User-specific adapters depend on package abstractions and the user model. The model itself does not import the database pool, logger, or application entry point.

Keep this dependency direction when adding features. Do not make a domain model depend on `app.ts` or perform application startup from an entity module.

## Runtime and resource lifecycle

`app.ts` creates a MySQL pool once for the run and reuses it for all selected files. Files are processed in a `for...of` loop with `await`, so the current implementation processes them one at a time. The pool is closed from the `finally` block inside `importDirectory`; the error and info file writers are ended in the outer promise chain's `finally` block.

The importer package controls record-level processing details. Do not claim transaction boundaries, retry policy, batching semantics, or exact progress-report behavior based solely on this application's constructor calls; verify the installed dependency API first.
