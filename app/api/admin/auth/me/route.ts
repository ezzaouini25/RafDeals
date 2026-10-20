import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/admin-auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    console.log('🔍 Checking session, token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found in cookies');
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }

    const user = verifySessionToken(token);
    
    if (!user) {
      console.log('❌ Invalid token');
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.username);
    return NextResponse.json({ user, authenticated: true });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
  }
}