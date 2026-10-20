import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const size = searchParams.get('size') || '';

    console.log('🔍 API: Fetching ad for size:', size);

    // Test database connection first
    try {
      const [test] = await pool.execute('SELECT 1 as test');
      console.log('✅ Database connected');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed', ad: null },
        { status: 500 }
      );
    }

    // Count total ads
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM advertisements');
    const totalAds = (countResult as any[])[0]?.total || 0;
    console.log('📊 Total ads in table:', totalAds);

    if (totalAds === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No ads in database', 
        ad: null 
      });
    }

    let query = 'SELECT id, name, ad_data, size, is_active FROM advertisements WHERE is_active = 1';
    const params: any[] = [];

    if (size) {
      query += ' AND size = ?';
      params.push(size);
    }

    query += ' ORDER BY RAND() LIMIT 1';

    console.log('📝 Query:', query);
    console.log('📝 Params:', params);

    const [rows] = await pool.execute(query, params);

    if ((rows as any[]).length === 0) {
      console.log('❌ API: No ad found for size:', size);
      return NextResponse.json({ success: false, ad: null });
    }

    const ad = (rows as any[])[0];
    console.log('✅ API: Ad found:', ad.name, 'Size:', ad.size);

    return NextResponse.json({ success: true, ad: ad });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { success: false, error: String(error), ad: null },
      { status: 500 }
    );
  }
}