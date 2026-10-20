import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';
import { dbGetCommentsTestimonials, dbUpdateCommentStatus, dbEditCommentTestimonial } from '@/lib/admin-db';

export async function GET() {
  try {
    await requireAdminSession();
    const reviews = await dbGetCommentsTestimonials('review');
    return NextResponse.json({ reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminSession();
    const { id, is_approved, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    if (is_approved !== undefined) {
      await dbUpdateCommentStatus(Number(id), is_approved);
    }

    if (Object.keys(data).length > 0) {
      await dbEditCommentTestimonial(Number(id), data);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update review' }, { status: 400 });
  }
}

// NOTE: Reviews CANNOT be permanently deleted as per strict requirements!
