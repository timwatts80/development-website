import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import { getDatabaseUrl } from './safety'

const sql = neon(getDatabaseUrl())
export const db = drizzle(sql, { schema })

export type DatabaseClient = typeof db
