import { Delimiter } from 'import-service';
import { DB, SqlInserter } from 'query-core';
import { Validator } from 'xvalidators';
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
    super(db.exec, 'users1', userModel, db.param);
  }
}
