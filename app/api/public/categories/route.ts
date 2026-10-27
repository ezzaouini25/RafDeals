import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const revalidate = 600;

export async function GET() {
  try {
    const [categories] = await pool.execute(
      `SELECT id, name, slug, type
       FROM categories
       WHERE is_active = 1
       ORDER BY name ASC`
    );
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching public categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}