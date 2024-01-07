import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { get } from '@nestled/config/lib/validate';

const pool = new Pool({
  host: get('DB_HOST').required().asString(),
  port: get('POSTGRES_PORT').required().asPortNumber() || 5433,
  user: get('POSTGRES_USER').required().asString(),
  password: get('POSTGRES_PASSWORD').required().asString(),
  database: get('POSTGRES_DB').required().asString(),
});

export const db = drizzle(pool);
