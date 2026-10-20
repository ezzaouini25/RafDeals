import 'server-only';
import pool from './db';
import { cache } from 'react';

export interface HeaderScript {
  id: number;
  name: string;
  placement: 'head_open' | 'head_close' | 'body_open' | 'body_close';
  payload: any; // JSON data
  raw_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ✅ Get active header scripts
export const getActiveHeaderScripts = cache(async (): Promise<HeaderScript[]> => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, placement, payload, raw_code, is_active, created_at, updated_at
       FROM header_scripts
       WHERE is_active = 1
       ORDER BY id ASC`
    );
    return rows as HeaderScript[];
  } catch (error) {
    console.error('Error fetching header scripts:', error);
    return [];
  }
});

// ✅ Get scripts by placement
export async function getScriptsByPlacement(placement: string): Promise<HeaderScript[]> {
  const scripts = await getActiveHeaderScripts();
  return scripts.filter(s => s.placement === placement);
}