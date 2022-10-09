import { Delimiter, ErrorHandler, ExceptionHandler, ImportManager, ImportService } from 'import-service';
import { DB, Logger, SqlInserter } from 'query-core';
import { Validator } from 'xvalidators';
import { User, userModel } from './user';

export interface ApplicationContext {
  importer: ImportManager;
}
export function useContext(db: DB, logger: Logger): ApplicationContext {
  // let reader = await createReader(fileName);
  const validator = new Validator<User>(userModel, true);
  const errorHandler = new ErrorHandler(logger.error);
  const exceptionHandler = new ExceptionHandler(logger.error);
  const tranformer = new Delimiter<User>(',', userModel);
  const writer = new SqlInserter<User>(db.exec, 'user_master', userModel, db.param);
  const importer = new ImportService<User>(1, '', undefined as any, tranformer, writer, validator, errorHandler, exceptionHandler);
  // const importer: Importer<User> = new Importer<User>(1, fileName, reader, tranform.transform, writer.write, writer.flush, validator.validate, errorHandler.handleError, exceptionHandler.handleException)
  return { importer };
}
