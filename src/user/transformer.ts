import { FixedLengthTransformer } from "import-service"
import { User, userModel } from "./user"

export class UserTransformer extends FixedLengthTransformer<User> {
  constructor() {
    super(userModel)
  }
}
