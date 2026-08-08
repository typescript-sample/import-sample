import { ExceptionHandler, ImportService } from "import-service"
import { SimpleMap } from "onecore"
import { UserErrorHandler, UserTransformer, UserValidator, UserWriter } from "./port"
import { User } from "./user"

export class UserImportService extends ImportService<User, string> {
  constructor(
    filename: string,
    read: AsyncIterable<string>,
    transformer: UserTransformer,
    writer: UserWriter,
    exceptionHandler: ExceptionHandler<string>,
    info: (msg: string, m?: SimpleMap) => void,
    progressSize: number = 1000,
    validator: UserValidator,
    errorHandler: UserErrorHandler,
  ) {
    super(1, filename, read, transformer, writer, exceptionHandler, info, progressSize, validator, errorHandler)
  }
}
