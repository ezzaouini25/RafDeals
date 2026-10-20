'use server';

import pool from '@/lib/db';

export async function getStats() {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM homepage_counters WHERE is_live = 1 LIMIT 1'
    );
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}