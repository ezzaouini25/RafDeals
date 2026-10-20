import { NextResponse } from 'next/server';
import { getAllLegalPageSlugs } from '@/lib/queries';

export async function GET() {
  try {
    const legalPages = await getAllLegalPageSlugs();
    return NextResponse.json(legalPages);
  } catch (error) {
    console.error('Error fetching legal pages:', error);
    return NextResponse.json([], { status: 500 });
  }
}