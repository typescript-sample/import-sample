import { merge } from 'config-plus';
import dotenv from 'dotenv';
import fs from 'fs';
import { createReader, getFiles, getPrefix, ImportManager, NameChecker } from 'import-service';
import { createLogger } from 'logger-core';
import { createPool } from 'mysql';
import { PoolManager } from 'mysql-core';
import { log } from 'query-core';
import { config, env } from './config';
import { useContext } from './context';

dotenv.config();
const conf = merge(config, process.env, env, process.env.ENV);

const logger = createLogger(conf.log);
const pool = createPool(conf.db);
const db = log(new PoolManager(pool), conf.log.db, logger, 'sql');
const checker = new NameChecker(getPrefix(conf.file.prefix, new Date(), -1), '.csv');

const ctx = useContext(db, logger);

export async function importDirectory(directory: string, importer: ImportManager, check: (name: string) => boolean) {
  logger.info(`Start service ${conf.service}`);
  const allFiles = fs.readdirSync(directory);
  const files = getFiles(allFiles, check);
  for (const file of files) {
    const filename = `${directory}${file}`;
    const read = await createReader(filename);
    importer.filename = file;
    importer.read = read;
    logger.info(`Import '${filename}' file`);
    const res = await importer.import();
    logger.info(`Result of '${filename}' import: total: ${res.total}; success: ${res.success}; fail: ${(res.total - res.success)}`);
  }
  logger.info(`End service ${conf.service}`);
}

importDirectory(conf.file.path, ctx.importer, checker.check);
