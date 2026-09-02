import { Pool } from "mysql2"
import { MySQLWriter } from "mysql2-core"
import { User, userModel } from "./user"

export class UserWriter extends MySQLWriter<User> {
  constructor(pool: Pool) {
    super(pool, "userimport", userModel, true)
  }
}
