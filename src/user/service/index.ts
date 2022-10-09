import { ImportService } from 'import-service';
import { ExceptionHandler } from 'onecore';
import readline from 'readline';
import { User } from '../domain';
import { UserErrorHandler, UserService, UserTransformer, UserValidator, UserWriter } from '../port';

export class UserImportService extends ImportService<User> implements UserService {
  constructor(
    filename: string,
    read: readline.Interface,
    transformer: UserTransformer,
    writer: UserWriter,
    validator: UserValidator,
    errorHandler: UserErrorHandler,
    exceptionHandler: ExceptionHandler,
  ) {
    super(1, filename, read, transformer, writer, validator, errorHandler, exceptionHandler);
  }
}
