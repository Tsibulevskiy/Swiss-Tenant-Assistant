import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import { sql } from 'drizzle-orm'

const requiredEnv = [
  'MYSQL_HOST',
  'MYSQL_PORT',
  'MYSQL_DATABASE',
  'MYSQL_USER',
  'MYSQL_PASSWORD'
]

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const db = drizzle(pool, { mode: 'default' })

const products = [
  {
    code: 'nebenkosten_check',
    name: 'Nebenkosten Check',
    type: 'check',
    priceChf: '19.00',
    currency: 'CHF',
    isActive: true,
    metadataJson: JSON.stringify({ checkType: 'nebenkosten_check' })
  },
  {
    code: 'mietvertrag_check',
    name: 'Mietvertrag Check',
    type: 'check',
    priceChf: '19.00',
    currency: 'CHF',
    isActive: true,
    metadataJson: JSON.stringify({ checkType: 'mietvertrag_check' })
  },
  {
    code: 'letter_generation',
    name: 'Letter Generation',
    type: 'letter',
    priceChf: '5.00',
    currency: 'CHF',
    isActive: true,
    metadataJson: JSON.stringify({ output: ['text', 'pdf', 'email'] })
  }
]

for (const product of products) {
  await db.execute(sql`
    INSERT INTO products (
      code,
      name,
      type,
      price_chf,
      currency,
      is_active,
      metadata_json
    ) VALUES (
      ${product.code},
      ${product.name},
      ${product.type},
      ${product.priceChf},
      ${product.currency},
      ${product.isActive},
      ${product.metadataJson}
    )
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      type = VALUES(type),
      price_chf = VALUES(price_chf),
      currency = VALUES(currency),
      is_active = VALUES(is_active),
      metadata_json = VALUES(metadata_json),
      updated_at = CURRENT_TIMESTAMP
  `)
}

const [rows] = await db.execute(sql`
  SELECT code, name, type, price_chf, currency, is_active
  FROM products
  ORDER BY id ASC
`)

console.log(JSON.stringify(rows, null, 2))

await pool.end()
