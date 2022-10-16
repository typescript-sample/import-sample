import { merge } from 'config-plus';
import dotenv from 'dotenv';
import fs from 'fs';
import { createReader, ErrorHandler, ExceptionHandler, FileWriter, getFiles, getPrefix, NameChecker, timeToString } from 'import-service';
import { createLogger } from 'logger-core';
import { createPool } from 'mysql';
import { PoolManager } from 'mysql-core';
import { log } from 'query-core';
import { config, env } from './config';
import { User, UserImportService, UserTransformer, UserValidator, UserWriter } from './user';

dotenv.config();
const conf = merge(config, process.env, env, process.env.ENV);

const now = new Date();
const errorWriter = new FileWriter(getPrefix(conf.error.prefix, now) + '_' + timeToString(now) + conf.error.suffix, conf.error.directory);
const logWriter = new FileWriter(getPrefix(conf.info.prefix, now) + '_' + timeToString(now) + conf.info.suffix, conf.info.directory);

const logger = createLogger(conf.log, undefined, undefined, errorWriter.write, logWriter.write);
const pool = createPool(conf.db);
const db = log(new PoolManager(pool), conf.log.db, logger, 'sql');
const checker = new NameChecker(getPrefix(conf.file.prefix, new Date(), -1), '.csv');

const errorHandler = new ErrorHandler<User>(logger.error);
const exceptionHandler = new ExceptionHandler(logger.error);

const validator = new UserValidator();
const tranformer = new UserTransformer();
const writer = new UserWriter(db);

async function importDirectory(directory: string, check: (name: string) => boolean) {
  logger.info(`Start service ${conf.service}`);
  const allFiles = fs.readdirSync(directory);
  const files = getFiles(allFiles, check);
  for (const file of files) {
    const filename = `${directory}${file}`;
    const read = await createReader(filename);
    const importer = new UserImportService(file, read, tranformer, writer, validator, errorHandler, exceptionHandler);
    logger.info(`Import '${filename}' file`);
    const res = await importer.import();
    logger.info(`Result of '${filename}' import: total: ${res.total}; success: ${res.success}; fail: ${(res.total - res.success)}`);
  }
  logger.info(`End service ${conf.service}`);
  errorWriter.flush();
  logWriter.flush();
}

importDirectory(conf.file.path, checker.check);
