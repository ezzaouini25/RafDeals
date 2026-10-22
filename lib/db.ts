// lib/db.ts
import fs from 'fs';
import path from 'path';
import mysql, { type Pool } from 'mysql2/promise';

const globalForDb = globalThis as unknown as { pool?: Pool };

function buildSslOptions():
  | { rejectUnauthorized: boolean; ca?: Buffer }
  | undefined {
  if (process.env.DB_SSL !== 'true') return undefined;
  const caPath = path.join(process.cwd(), 'certs', 'aiven-ca.pem');
  try {
    return { ca: fs.readFileSync(caPath), rejectUnauthorized: true };
  } catch {
    console.warn(
      '⚠️  certs/aiven-ca.pem not found — using rejectUnauthorized: false (Aiven may reject this).'
    );
    return { rejectUnauthorized: false };
  }
}

function createPool(): Pool {
  console.log('🔎 Creating pool with DB_NAME =', JSON.stringify(process.env.DB_NAME));

  const p = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: buildSslOptions(),
    connectionLimit: 5,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = p;
  }

  return p;
}

function getPool(): Pool {
  if (!globalForDb.pool) {
    globalForDb.pool = createPool();
  }
  return globalForDb.pool;
}

// Proxy that forwards every property access to the lazily-created pool.
// This keeps `import pool from './db'` working exactly as before —
// queries.ts needs no changes.
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = getPool();
    const value = (real as any)[prop];
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

export default pool;