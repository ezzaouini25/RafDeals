import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get('placement') || 'home';
    const size = searchParams.get('size') || '';
    const all = searchParams.get('all') === 'true';

    console.log('🔍 Fetching sponsors:', { placement, size, all });

    let sizeCondition = '';
    const params: any[] = [];

    if (size) {
      sizeCondition = 'AND size = ?';
      params.push(size);
    }

    // If all=true, fetch ALL active sponsors with this size
    if (all) {
      const [rows] = await pool.execute(
        `SELECT 
          id, name, size, code, is_active, is_boosted, impressions, clicks
         FROM sponsors 
         WHERE is_active = 1
         ${sizeCondition}
         ORDER BY 
           is_boosted DESC,
           impressions ASC`,
        params
      );

      const sponsors = (rows as any[]) || [];
      console.log(`✅ Found ${sponsors.length} sponsors for size: ${size}`);

      return NextResponse.json({ sponsors });
    }

    // Otherwise, return single sponsor (fallback)
    const [rows] = await pool.execute(
      `SELECT 
        id, name, size, code, is_active, is_boosted, impressions, clicks
       FROM sponsors 
       WHERE is_active = 1
       ${sizeCondition}
       ORDER BY 
         is_boosted DESC,
         impressions ASC,
         RAND()
       LIMIT 1`,
      params
    );

    const sponsor = (rows as any[])[0] || null;

    if (sponsor) {
      console.log('✅ Sponsor found:', sponsor.name, sponsor.size);
    } else {
      console.log('❌ No sponsor for size:', size);
    }

    return NextResponse.json({ sponsor });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsors' },
      { status: 500 }
    );
  }
}