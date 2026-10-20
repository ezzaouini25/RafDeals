import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';
import { dbGetAds, dbCreateAd, dbUpdateAd, dbDeleteAd } from '@/lib/admin-db';

export async function GET() {
  try {
    await requireAdminSession('admin');
    const ads = await dbGetAds();
    return NextResponse.json({ ads });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession('admin');
    const body = await req.json();
    const newAd = await dbCreateAd(body);
    return NextResponse.json({ success: true, ad: newAd }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to create ad' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminSession('admin');
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 });
    const updated = await dbUpdateAd(Number(id), data);
    return NextResponse.json({ success: true, ad: updated });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to update ad' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminSession('admin');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    await dbDeleteAd(Number(id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to delete ad' }, { status: 400 });
  }
}
