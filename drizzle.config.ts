import process from 'node:process'
import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

export default defineConfig({
  dialect: 'postgresql',
  casing: 'snake_case',
  schema: './server/db/schema.ts',
  out: './server/db/migrations/postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
