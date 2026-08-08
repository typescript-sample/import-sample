import { merge } from "config-plus"
import dotenv from "dotenv"
import fs from "fs"
import { createReader, ErrorHandler, ExceptionHandler, getFiles, getPrefix, LogWriter, NameChecker, timeToString, toString } from "import-service"
import { createLogger } from "logger-core"
import { createPool } from "mysql2"
import { PoolManager } from "mysql2-core"
import { config, environments } from "./config"
import { User, UserImportService, UserValidator, UserWriter } from "./user"
import { UserTransformer } from "./user/transformer"

dotenv.config()
const cfg = merge(config, process.env, environments, process.env.ENV)

const now = new Date()
const errorWriter = new LogWriter(getPrefix(cfg.error.prefix, now) + "_" + timeToString(now) + cfg.error.suffix, cfg.error.directory)
const logWriter = new LogWriter(getPrefix(cfg.info.prefix, now) + "_" + timeToString(now) + cfg.info.suffix, cfg.info.directory)

const logger = createLogger(cfg.log, undefined, undefined, errorWriter.write, logWriter.write)
const pool = createPool(cfg.db)
const db = new PoolManager(pool)
const checker = new NameChecker(getPrefix(cfg.file.prefix, new Date(), -1), ".txt")

const errorHandler = new ErrorHandler<User>(logger.error)
const exceptionHandler = new ExceptionHandler<string>(logger.error)

const validator = new UserValidator()
const tranformer = new UserTransformer()
const writer = new UserWriter(db)

async function importDirectory(directory: string, check: (name: string) => boolean) {
  logger.info(`Start service ${cfg.service}`)
  const allFiles = fs.readdirSync(directory)
  const files = getFiles(allFiles, check)
  for (const file of files) {
    const filename = `${directory}${file}`
    try {
      const read = await createReader(filename)
      const importer = new UserImportService(file, read, tranformer, writer, exceptionHandler, logger.info, 3, validator, errorHandler)
      logger.info(`Import '${filename}' file`)
      const res = await importer.import()
      logger.info(`Result of '${filename}' import: total: ${res.total}; success: ${res.success}; fail: ${res.total - res.success}`)
    } catch (err) {
      logger.error(`Error at file '${file}. Details: ${toString(err)}'`)
    }
  }
  logger.info(`End service ${cfg.service}`)
  errorWriter.flush()
  logWriter.flush()
}

importDirectory(cfg.file.path, checker.check)
