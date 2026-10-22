import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder') || 'articles'; // اسم المجلد المطلوب

    const dirPath = path.join(process.cwd(), 'public', 'uploads', folder);
    
    // قراءة الملفات داخل المجلد
    const files = await readdir(dirPath).catch(() => []);
    
    // تصفية الصور فقط وعمل روابط لها
    const images = files
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .map(f => `/uploads/${folder}/${f}`)
      .reverse(); // الصور الأحدث تظهر أولاً

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ images: [] });
  }
}