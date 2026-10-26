// lib/db.ts
//
// Thin wrapper around lib/mysql.ts for backward compatibility.
// Every existing `import pool from './db'` continues to work unchanged.
//
// All pool configuration (connectionLimit, idleTimeout, enableKeepAlive, SSL)
// lives in lib/mysql.ts. Do NOT add a second mysql.createPool() here — that
// would create a duplicate pool to Aiven and slow every page load.

import { getMysqlPool } from './mysql';
import type { Pool } from 'mysql2/promise';

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = getMysqlPool();
    const value = (real as any)[prop];
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

export default pool;