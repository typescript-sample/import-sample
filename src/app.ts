import { merge } from "config-plus"
import dotenv from "dotenv"
import fs from "fs"
import {
  createReader,
  ErrorHandler,
  ExceptionHandler,
  FixedLengthTransformer,
  getFiles,
  getPrefix,
  ImportService,
  LogWriter,
  NameChecker,
  timeToString,
} from "import-service"
import { createLogger } from "logger-core"
import { createPool } from "mysql2"
import { PoolManager } from "mysql2-core"
import { SqlInserter } from "sql-core"
import { Validator } from "validation-core"
import { config, environments } from "./config"
import { User, userModel } from "./user"

dotenv.config()
const conf = merge(config, process.env, environments, process.env.ENV)

const now = new Date()
const errorWriter = new LogWriter(getPrefix(conf.error.prefix, now) + "_" + timeToString(now) + conf.error.suffix, conf.error.directory)
const logWriter = new LogWriter(getPrefix(conf.info.prefix, now) + "_" + timeToString(now) + conf.info.suffix, conf.info.directory)

const logger = createLogger(conf.log, undefined, undefined, errorWriter.write, logWriter.write)
const pool = createPool(conf.db)
const db = new PoolManager(pool)
const checker = new NameChecker(getPrefix(conf.file.prefix, new Date(), -1), ".txt")

const errorHandler = new ErrorHandler<User>(logger.error)
const exceptionHandler = new ExceptionHandler<string>(logger.error)

const validator = new Validator<User>(userModel)
const tranformer = new FixedLengthTransformer<User>(userModel)
const writer = new SqlInserter<User>(db.execute, "userimport", userModel, db.param, true)

async function importDirectory(directory: string, check: (name: string) => boolean) {
  logger.info(`Start service ${conf.service}`)
  const allFiles = fs.readdirSync(directory)
  const files = getFiles(allFiles, check)
  for (const file of files) {
    console.log("file name " + file)
    const filename = `${directory}${file}`
    const read = await createReader(filename)
    const importer = new ImportService<User, string>(1, file, read, tranformer, writer, exceptionHandler, validator, errorHandler)
    logger.info(`Import '${filename}' file`)
    const res = await importer.import()
    logger.info(`Result of '${filename}' import: total: ${res.total}; success: ${res.success}; fail: ${res.total - res.success}`)
    console.log(`Result of '${filename}' import: total: ${res.total}; success: ${res.success}; fail: ${res.total - res.success}`)
  }
  logger.info(`End service ${conf.service}`)
  errorWriter.flush()
  logWriter.flush()
}

importDirectory(conf.file.path, checker.check)
