import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// ============================================================
// GET - Fetch all header scripts
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (active === 'true') {
      whereClause += ' AND is_active = 1';
    }

    const [scripts] = await pool.execute(
      `SELECT id, name, placement, payload, raw_code, is_active, created_at, updated_at
       FROM header_scripts
       ${whereClause}
       ORDER BY id ASC`,
      params
    );

    // Parse payload JSON for each script
    const parsedScripts = (scripts as any[]).map((script) => {
      let payload = null;
      if (script.payload) {
        try {
          payload = typeof script.payload === 'string' ? JSON.parse(script.payload) : script.payload;
        } catch (e) {
          payload = script.payload;
        }
      }
      return {
        ...script,
        payload,
      };
    });

    return NextResponse.json({ scripts: parsedScripts });
  } catch (error) {
    console.error('Error fetching header scripts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch header scripts' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create new header script
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, placement, payload, raw_code, is_active } = body;

    console.log('📝 Creating header script:', { name, placement, payload, raw_code, is_active });

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!raw_code && !payload) {
      return NextResponse.json(
        { error: 'Either raw_code or payload is required' },
        { status: 400 }
      );
    }

    // ✅ Handle payload - convert to JSON string or null
    let payloadJson = null;
    if (payload) {
      try {
        // If payload is already a string, use it directly
        if (typeof payload === 'string') {
          // Validate it's valid JSON
          JSON.parse(payload);
          payloadJson = payload;
        } else {
          // If it's an object, stringify it
          payloadJson = JSON.stringify(payload);
        }
      } catch (error) {
        console.error('Invalid JSON payload:', error);
        return NextResponse.json(
          { error: 'Invalid JSON payload format' },
          { status: 400 }
        );
      }
    }

    // ✅ Handle raw_code - ensure it's a string or null
    const rawCodeValue = raw_code || null;

    // ✅ Handle is_active - convert to 0 or 1
    const isActiveValue = is_active !== false ? 1 : 0;

    console.log('📝 Inserting with values:', {
      name,
      placement: placement || 'head_close',
      payloadJson,
      rawCodeValue,
      isActiveValue,
    });

    const [result] = await pool.execute(
      `INSERT INTO header_scripts (name, placement, payload, raw_code, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [name, placement || 'head_close', payloadJson, rawCodeValue, isActiveValue]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      message: 'Script created successfully',
    });
  } catch (error: any) {
    console.error('Error creating header script:', error);
    
    // Check if it's a database error with specific message
    let errorMessage = 'Failed to create header script';
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
      errorMessage = 'Invalid data format. Please check your input.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Update header script
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, placement, payload, raw_code, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // ✅ Handle payload - convert to JSON string or null
    let payloadJson = null;
    if (payload) {
      try {
        if (typeof payload === 'string') {
          JSON.parse(payload);
          payloadJson = payload;
        } else {
          payloadJson = JSON.stringify(payload);
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JSON payload format' },
          { status: 400 }
        );
      }
    }

    const rawCodeValue = raw_code || null;
    const isActiveValue = is_active !== false ? 1 : 0;

    await pool.execute(
      `UPDATE header_scripts 
       SET name = ?, placement = ?, payload = ?, raw_code = ?, is_active = ?
       WHERE id = ?`,
      [name, placement || 'head_close', payloadJson, rawCodeValue, isActiveValue, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Script updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating header script:', error);
    return NextResponse.json(
      { error: 'Failed to update header script' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Delete header script
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await pool.execute('DELETE FROM header_scripts WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Script deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting header script:', error);
    return NextResponse.json(
      { error: 'Failed to delete header script' },
      { status: 500 }
    );
  }
}