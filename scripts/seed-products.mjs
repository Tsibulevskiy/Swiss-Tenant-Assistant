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
    code: 'mietzinserhoehung_check',
    name: 'Rent Increase Check',
    type: 'check',
    priceChf: '24.00',
    currency: 'CHF',
    isActive: true,
    metadataJson: JSON.stringify({ checkType: 'rent_increase_check' })
  },
  {
    code: 'deposit_return_check',
    name: 'Deposit Return Check',
    type: 'check',
    priceChf: '29.00',
    currency: 'CHF',
    isActive: true,
    metadataJson: JSON.stringify({ checkType: 'deposit_return_check' })
  },
  {
    code: 'letter_generator',
    name: 'Letter Generator',
    type: 'letter',
    priceChf: '9.00',
    currency: 'CHF',
    isActive: true,
    metadataJson: JSON.stringify({ output: ['text', 'pdf', 'email'] })
  },
  {
    code: 'tenant_bundle',
    name: 'Tenant Protection Bundle',
    type: 'subscription',
    priceChf: '39.00',
    currency: 'CHF',
    isActive: true,
    metadataJson: JSON.stringify({ bundle: true })
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
