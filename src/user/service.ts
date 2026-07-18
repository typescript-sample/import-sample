import { ExceptionHandler, ImportService } from "import-service"
import { UserErrorHandler, UserTransformer, UserValidator, UserWriter } from "./port"
import { User } from "./user"

export class UserImportService extends ImportService<User, string> {
  constructor(
    filename: string,
    read: AsyncIterable<string>,
    transformer: UserTransformer,
    writer: UserWriter,
    validator: UserValidator,
    errorHandler: UserErrorHandler,
    exceptionHandler: ExceptionHandler<string>,
  ) {
    super(1, filename, read, transformer, writer, exceptionHandler, validator, errorHandler)
  }
}
