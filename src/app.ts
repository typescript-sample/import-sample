import { merge } from "config-plus"
import dotenv from "dotenv"
import fs from "fs"
import { createLogWriter, createReader, ErrorHandler, ExceptionHandler, getFiles, getPrefix, NameChecker, timeToString, toString } from "import-service"
import { createFileLogger } from "logger-core"
import { createPool } from "mysql2"
import { config, environments } from "./config"
import { User, UserImportService, UserValidator, UserWriter } from "./user"
import { UserTransformer } from "./user/transformer"

dotenv.config()

const cfg = merge(config, process.env, environments, process.env.ENV)

const now = new Date()
const errorWriter = createLogWriter(cfg.error.directory, `${getPrefix(cfg.error.prefix, now)}_${timeToString(now)}${cfg.error.suffix}`)
const logWriter = createLogWriter(cfg.info.directory, `${getPrefix(cfg.info.prefix, now)}_${timeToString(now)}${cfg.info.suffix}`)

const logger = createFileLogger(cfg.log, errorWriter.write, logWriter.write)
const pool = createPool(cfg.db)
const checker = new NameChecker(getPrefix(cfg.file.prefix, new Date(), -1), ".txt")

const errorHandler = new ErrorHandler<User>(logger.error)
const exceptionHandler = new ExceptionHandler<string>(logger.error)

const validator = new UserValidator()
const transformer = new UserTransformer()
const writer = new UserWriter(pool)

async function importDirectory(directory: string, check: (name: string) => boolean) {
  logger.info(`Start service ${cfg.service}`)
  try {
    const allFiles = fs.readdirSync(directory)
    const files = getFiles(allFiles, check)
    for (const file of files) {
      const filename = `${directory}${file}`
      try {
        const read = await createReader(filename)
        const importer = new UserImportService(file, read, transformer, writer, exceptionHandler, logger.info, 3, validator, errorHandler)
        logger.info(`Import '${filename}' file`)
        const res = await importer.import()
        logger.info(`Result of '${filename}' import: total: ${res.total}; success: ${res.success}; fail: ${res.total - res.success}`)
      } catch (err) {
        logger.error(`Error at file '${file}'. Details: ${toString(err)}`)
      }
    }
  } catch (err) {
    logger.error(`Error at service '${cfg.service}'. Details: ${toString(err)}`)
  } finally {
    await pool.end()
    logger.info(`End service ${cfg.service}`)
  }
}

importDirectory(cfg.file.path, checker.check)
  .catch((err) => {
    logger.error(`Error at service '${cfg.service}'. Details: ${toString(err)}`)
    process.exitCode = 1
  })
  .finally(() => {
    errorWriter.end()
    logWriter.end()
  })
