import { Delimiter } from 'import-service';
import { DB, SqlInserter } from 'sql-core';
import { Validator } from 'validation-core';
import { User, userModel } from '../domain';

export class UserValidator extends Validator<User> {
  constructor() {
    super(userModel, true);
  }
}

export class UserTransformer extends Delimiter<User> {
  constructor() {
    super(',', userModel);
  }
}

export class UserWriter extends SqlInserter<User> {
  constructor(db: DB) {
    super(db.execute, 'users1', userModel, db.param);
  }
}
