import { Result } from 'import-service';
import { ErrorMessage } from 'onecore';
import { User } from '../domain';

export interface UserErrorHandler {
  handleError(rs: User, errors: ErrorMessage[], i?: number, filename?: string): void;
}
export interface UserValidator {
  validate(user: User): Promise<ErrorMessage[]>;
}
export interface UserTransformer {
  transform(data: string): Promise<User>;
}
export interface UserWriter {
  write(user: User): Promise<number>;
}
export interface UserService {
  import(): Promise<Result>;
}
