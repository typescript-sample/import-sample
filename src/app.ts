import { merge } from 'config-plus';
import dotenv from 'dotenv';
import fs from 'fs';
import { createReader, Delimiter, ErrorHandler, ExceptionHandler, getFiles, getPrefix, ImportManager, ImportService, NameChecker } from 'import-service';
import { createLogger } from 'logger-core';
import { createPool } from 'mysql';
import { PoolManager } from 'mysql-core';
import { exist, log, SqlInserter } from 'query-core';
import { Validator } from 'xvalidators';
import { config, env } from './config';
import { User, userModel } from './user';

dotenv.config();
const conf = merge(config, process.env, env, process.env.ENV);

const logger = createLogger(conf.log);
const pool = createPool(conf.db);
const db = log(new PoolManager(pool), conf.log.db, logger, 'sql');
const checker = new NameChecker(getPrefix(conf.file.prefix, new Date(), -1), '.csv');

db.exec('delete from users2');

const errorHandler = new ErrorHandler(logger.error);
const exceptionHandler = new ExceptionHandler(logger.error);

const validator = new Validator<User>(userModel, true);
const tranformer = new Delimiter<User>(',', userModel);
const writer = new SqlInserter<User>(db.exec, 'users2', userModel, db.param);

async function importDirectory(directory: string, check: (name: string) => boolean) {
  logger.info(`Start service ${conf.service}`);
  const allFiles = fs.readdirSync(directory);
  const files = getFiles(allFiles, check);
  for (const file of files) {
    const filename = `${directory}${file}`;
    const read = await createReader(filename);
    const importer = new ImportService<User>(1, file, read, tranformer, writer, validator, errorHandler, exceptionHandler);
    logger.info(`import '${filename}' file`);
    const res = await importer.import();
    logger.info(`Result of '${filename}' import: total: ${res.total}; success: ${res.success}; fail: ${(res.total - res.success)}`);
  }
  logger.info(`End service ${conf.service}`);
}

importDirectory(conf.file.path, checker.check);
