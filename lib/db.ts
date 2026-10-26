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