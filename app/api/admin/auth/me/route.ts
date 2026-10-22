import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/admin-auth';
import { dbGetUserById } from '@/lib/admin-db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }

    // ✅ Pull current values (picture, role, name…) from DB, not the stale token
    const fresh = await dbGetUserById(session.id);
    if (!fresh) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }

    const user = {
      id: fresh.id,
      name: fresh.name ?? fresh.username,
      username: fresh.username,
      email: fresh.email,
      role: fresh.role as 'admin' | 'editor',
      picture: fresh.picture ?? null,   // ✅ always current
    };

    return NextResponse.json({ user, authenticated: true });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
  }
}