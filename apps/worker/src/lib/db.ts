import { createDb } from '@postari/db'
import { env } from '../env'

const { db } = createDb(env().DATABASE_URL)
export { db }
