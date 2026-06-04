import type { MySql2Database } from 'drizzle-orm/mysql2'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import { schema } from './schema'

let connection: mysql.Pool | null = null
let database: MySql2Database<typeof schema> | null = null

export function getDb() {
  if (database) {
    return database
  }

  const config = useRuntimeConfig()

  connection = mysql.createPool({
    host: config.mysqlHost,
    port: Number(config.mysqlPort),
    database: config.mysqlDatabase,
    user: config.mysqlUser,
    password: config.mysqlPassword,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  })

  database = drizzle(connection, { schema, mode: 'default' })

  return database
}

export async function closeDb() {
  if (!connection) {
    return
  }

  await connection.end()
  connection = null
  database = null
}
