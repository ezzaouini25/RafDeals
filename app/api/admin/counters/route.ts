import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// ------------------------------------------------------------
// GET — return the single counters row (creates one if empty)
// ------------------------------------------------------------
export async function GET() {
  try {
    const [rows] = await pool.execute('SELECT * FROM homepage_counters LIMIT 1');

    if ((rows as any[]).length === 0) {
      // New columns only — completed_offers / payouts_completed are dropped
      await pool.execute(`
        INSERT INTO homepage_counters
          (total_offers, total_deals, total_articles, total_clicks, is_live)
        VALUES (0, 0, 0, 0, 0, 1)
      `);
      const [newRows] = await pool.execute('SELECT * FROM homepage_counters LIMIT 1');
      return NextResponse.json((newRows as any[])[0]);
    }

    return NextResponse.json((rows as any[])[0]);
  } catch (error) {
    console.error('Error fetching counters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counters' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// PUT — update editable counter fields
// ------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Whitelist — only columns that exist after migration
    const editable = [
      'total_offers',
      'total_deals',
      'total_articles',
      'total_clicks',
      'is_live',
    ] as const;

    const sets: string[] = [];
    const params: any[] = [];

    for (const key of editable) {
      if (body[key] !== undefined && body[key] !== null) {
        sets.push(`\`${key}\` = ?`);
        if (key === 'is_live') {
          params.push(body[key] ? 1 : 0);
        } else {
          params.push(Number(body[key]) || 0);
        }
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(id);

    await pool.execute(
      `UPDATE homepage_counters SET ${sets.join(', ')} WHERE id = ?`,
      params
    );

    const [rows] = await pool.execute(
      'SELECT * FROM homepage_counters WHERE id = ?',
      [id]
    );

    return NextResponse.json((rows as any[])[0]);
  } catch (error: any) {
    console.error('Error updating counters:', error);
    return NextResponse.json(
      {
        error: 'Failed to update counters',
        detail: error?.sqlMessage ?? error?.message,
      },
      { status: 500 }
    );
  }
}