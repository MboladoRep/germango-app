import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
const connectionUrl = connectionString ? new URL(connectionString) : null
const sslMode = connectionUrl?.searchParams.get("sslmode")?.toLowerCase()

if (connectionUrl && ["prefer", "require", "verify-ca"].includes(sslMode ?? "")) {
  connectionUrl.searchParams.set("sslmode", "verify-full")
}

export const pool = new Pool({
  connectionString: connectionUrl?.toString(),
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

export const db = drizzle(pool, { schema })
