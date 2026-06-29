import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Support DATABASE_URL (Render style) or individual vars
const pool = new Pool(
  process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
    database: process.env.POSTGRES_DB || 'zipzop',
    user: process.env.POSTGRES_USER || 'zipzop',
    password: process.env.POSTGRES_PASSWORD || 'zipzoppass'
  }
);

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

export async function runMigrations() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  if (!fs.existsSync(migrationsDir)) return;
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`Applied migration ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.warn(`Skipping or failed migration ${file}:`, err.message);
    } finally {
      client.release();
    }
  }
}

export default pool;
