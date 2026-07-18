import { DB, MySQLWriter } from "mysql2-core"
import { User, userModel } from "./user"

export class UserWriter extends MySQLWriter<User> {
  constructor(db: DB) {
    super(db.execute, "userimport", userModel, true)
  }
}
