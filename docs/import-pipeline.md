# Import Pipeline

## Current flow

1. `dotenv.config()` loads values from the local environment file, if available.
2. `config-plus` `merge(...)` combines `config`, `process.env`, `environments`, and the selected `process.env.ENV` profile into `cfg`.
3. `app.ts` creates error and info file writers, then creates the structured logger with `createFileLogger`.
4. A MySQL pool is created with `createPool(cfg.db)`.
5. `NameChecker` is initialized with `getPrefix(cfg.file.prefix, new Date(), -1)` and the `.txt` extension.
6. `fs.readdirSync(directory)` reads the directory entries. `getFiles(allFiles, check)` filters them using the name checker.
7. The selected files are processed sequentially. For each file, the application builds its filename, calls `createReader(filename)`, and passes the returned `AsyncIterable<string>` to `UserImportService`.
8. The application logs the returned `total`, `success`, and derived failure count (`total - success`).
9. A file-specific exception is logged and the loop continues to the next file. A directory/service-level exception is logged by the outer catch.
10. The MySQL pool and log writers are closed in their respective `finally` blocks.

The exact filename date semantics of `getPrefix(..., -1)`, the filtering details of `NameChecker`, and the meaning of importer constructor parameters are provided by the installed `import-service` package, not by this repository. Preserve the current calls unless those semantics have been verified.

## User-specific collaborators

| Component | Implementation | Current role |
| --- | --- | --- |
| Input reader | `createReader(filename)` | Supplies asynchronous string records. |
| Transformer | `UserTransformer` | Extends `FixedLengthTransformer<User>` and receives `userModel`. |
| Validator | `UserValidator` | Extends `Validator<User>` and receives `userModel` plus the existing `true` option. |
| Writer | `UserWriter` | Extends `MySQLWriter<User>` and receives the pool, table name `userimport`, `userModel`, and the existing `true` option. |
| Import service | `UserImportService` | Extends `ImportService<User, string>` and wires the reader, transformer, writer, exception handler, logger callback, progress value, validator, and error handler. |
| Error handling | `ErrorHandler<User>` and `ExceptionHandler<string>` | Pass `logger.error` as their error callback. |

`UserImportService` calls `super(1, ...)`. `app.ts` passes `3` as the `progressSize` argument. These values are preserved as written; their detailed semantics should be checked against the installed `import-service` version before changing them.

## Error handling currently visible in the application

- Errors thrown while creating or importing one file are caught in that file's `catch` block, logged, and do not stop the loop.
- Errors thrown while listing the directory or during the outer processing block are caught by `importDirectory`'s outer `catch` and logged.
- `pool.end()` is awaited in `importDirectory`'s `finally` block.
- The outer promise chain sets `process.exitCode = 1` only when `importDirectory` rejects. Because the function catches its main directory/file-processing errors internally, those logged errors do not automatically imply a non-zero exit code. Do not change this behavior without an explicit operational requirement.
- `errorWriter.end()` and `logWriter.end()` are called in the outer promise chain's `finally` block.

## Adding another import domain

Use the existing user module as the pattern, but adapt the contracts rather than copying names blindly. A new domain may need its own model/interface, transformer, validator, writer, service, and barrel exports. Wire the new collaborators in the application composition root. Confirm the new file format, validation requirements, table schema, and error policy first.
