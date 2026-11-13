# Operations and Configuration

## Runtime configuration

`src/config.ts` defines the default configuration:

- Service name: `import-user`.
- Input directory: `./scan_dir/`.
- Input filename prefix: `user_`.
- MySQL defaults: host `127.0.0.1`, port `3306`, database `masterdata`, and connection limit `10`.
- Error and info log files are written under `./log/` with configured prefixes and a `.txt` suffix.
- Default log level is `DEBUG` and the default log config has `db: true`.

The `sit` and `prd` profiles override the log level to `INFO` and set `log.db` to `false`.

`app.ts` calls `dotenv.config()` and then:

```ts
const cfg = merge(config, process.env, environments, process.env.ENV)
```

The exact precedence and environment-variable-to-config mapping are determined by the installed `config-plus` package. Do not document or assume a particular override precedence without verifying that package version.

## Required runtime resources

The input directory must exist and be readable. The app passes the configured log directory to the external `createLogWriter` helper; whether that helper creates a missing directory is package-defined and is not visible in this repository. The default input directory includes a trailing slash, and `app.ts` constructs filenames by concatenating `${directory}${file}`. Any replacement input directory value must therefore retain a trailing path separator unless the code is changed to use `path.join`.

The app creates a MySQL connection pool from `cfg.db`, uses it across the selected files, and closes it after `importDirectory` completes. Database connectivity and table availability are required for successful writes.

## Commands from package.json

| Command | Current definition | Notes |
| --- | --- | --- |
| `npm run dev` | `nodemon --exec ts-node-dev src/app` | Development runner with restart behavior. |
| `npm start` | Same command as `dev` | Alias in this package. |
| `npm run build` | `webpack --config webpack.config.js` | Builds the Node-targeted bundle to `dist/app.js`. |
| `npm run prod` | `node dist/app` | Runs the built bundle. Build first. |
| `npm test` | Placeholder command that exits with code 1 | No real test suite is configured. |
| `npm run lint` | `eslint -c .eslintrc.js --ext .ts src` | `.eslintrc.js` is absent from the supplied archive, so this command may fail until the config is supplied. |

The TypeScript compiler options in `tsconfig.json` include `strict: true`, `target: "es6"`, `module: "node16"`, `moduleResolution: "node16"`, `rootDir: "./src"`, and `outDir: "./es6"`. Webpack separately emits `dist/app.js`.

## Logging and cleanup

The app creates separate error and info file writers with date/time-based names derived from `getPrefix` and `timeToString`. It creates a logger via `createFileLogger(cfg.log, errorWriter.write, logWriter.write)`.

The MySQL pool is ended in `importDirectory`'s `finally` block. The two file writers are ended in the outer promise chain's `finally` block. Preserve cleanup paths when adding early returns or new failure cases.

## Configuration and security cautions

- Do not add credentials, tokens, or other secrets to source files or documentation.
- The supplied `src/config.ts` contains a literal database password value. Treat it as a development placeholder or sensitive configuration that should be moved to environment-based configuration before production use; never copy it into generated examples or docs.
- `multipleStatements` is currently enabled in the database configuration. Do not broaden its use or build SQL by concatenating untrusted input.
- Do not assume that logging directories are automatically created; verify the behavior of the installed `createLogWriter` implementation. The application source itself does not call `fs.mkdir` or equivalent.
- The current top-level error handling logs most directory/file errors inside `importDirectory`; those caught errors do not necessarily cause a non-zero process exit. See `docs/import-pipeline.md` before changing exit-code behavior.
