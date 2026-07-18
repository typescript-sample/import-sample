import { Validator } from "validation-core"
import { User, userModel } from "./user"

export class UserValidator extends Validator<User> {
  constructor() {
    super(userModel, true)
  }
}
