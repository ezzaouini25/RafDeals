import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const size = searchParams.get('size') || '';
    const boosted = searchParams.get('boosted') === 'true';

    console.log('🔍 Fetching ad for size:', size, 'boosted:', boosted);

    let query = 'SELECT id, name, ad_data, size, is_active, is_boosted FROM advertisements WHERE is_active = 1';
    const params: any[] = [];

    if (size) {
      query += ' AND size = ?';
      params.push(size);
    }

    if (boosted) {
      query += ' AND is_boosted = 1';
    }

    query += ' ORDER BY is_boosted DESC, RAND() LIMIT 1';

    console.log('📝 Query:', query);
    console.log('📝 Params:', params);

    const [rows] = await pool.execute(query, params);
    
    console.log('📦 Rows found:', (rows as any[]).length);

    if ((rows as any[]).length === 0) {
      // Try to get any ad if size specific fails
      if (size) {
        console.log('⚠️ No ad for size:', size, 'trying without size filter');
        const [fallbackRows] = await pool.execute(
          'SELECT id, name, ad_data, size, is_active, is_boosted FROM advertisements WHERE is_active = 1 ORDER BY is_boosted DESC, RAND() LIMIT 1'
        );
        
        if ((fallbackRows as any[]).length > 0) {
          return NextResponse.json({ 
            success: true, 
            ad: (fallbackRows as any[])[0],
            fallback: true
          });
        }
        
        return NextResponse.json({ 
          success: false, 
          ad: null,
          message: 'No ads found'
        });
      }

      return NextResponse.json({ 
        success: false, 
        ad: null,
        message: 'No ads found'
      });
    }

    const ad = (rows as any[])[0];
    console.log('✅ Ad found:', ad.name, 'Size:', ad.size);

    return NextResponse.json({ 
      success: true, 
      ad: ad
    });

  } catch (error) {
    console.error('❌ Error fetching advertisements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advertisement', ad: null },
      { status: 500 }
    );
  }
}