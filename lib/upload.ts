import fs from 'fs/promises';
import path from 'path';

// Delete image from filesystem
export async function deleteImage(imagePath: string) {
  if (!imagePath) return;
  
  try {
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const fullPath = path.join(process.cwd(), 'public', cleanPath);
    
    await fs.unlink(fullPath);
    console.log(`✅ Deleted image: ${fullPath}`);
  } catch (error) {
    // Don't throw error if file doesn't exist
    console.warn(`⚠️ Could not delete image: ${imagePath}`, error);
  }
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}