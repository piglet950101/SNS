import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined
let _client: ReturnType<typeof postgres> | undefined

export function createDb(databaseUrl: string) {
  if (_db) return { db: _db, client: _client! }
  const client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  })
  const db = drizzle(client, { schema })
  _db = db
  _client = client
  return { db, client }
}

export async function closeDb() {
  if (_client) {
    await _client.end({ timeout: 5 })
    _client = undefined
    _db = undefined
  }
}

export type DrizzleDb = ReturnType<typeof createDb>['db']
