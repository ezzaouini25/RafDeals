import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

// ✅ GET - Fetch single offer by ID (for edit page)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }

    const [rows] = await pool.execute('SELECT * FROM offers WHERE id = ?', [id]);

    const offer = (rows as any[])[0];

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Error fetching offer:', error);
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 });
  }
}

// ✅ PUT - Update offer
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    const id = parseInt(formData.get('id') as string);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [rows] = await pool.execute('SELECT * FROM offers WHERE id = ?', [id]);
    const currentOffer = (rows as any[])[0];

    if (!currentOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    const title = formData.get('title');
    const slug = formData.get('slug');
    const content = formData.get('content');
    const offer_link = formData.get('offer_link');
    const payout_amount = formData.get('payout_amount');
    const pay_name = formData.get('pay_name');
    const brand_name = formData.get('brand_name');
    const category_id = formData.get('category_id');
    const author_id = formData.get('author_id');
    const rating = formData.get('rating');
    const withdraw_method = formData.get('withdraw_method');
    const country = formData.get('country') as string || '';
    const verified_date = formData.get('verified_date');
    const meta_title = formData.get('meta_title');
    const meta_description = formData.get('meta_description');
    const meta_keywords = formData.get('meta_keywords');
    const is_active = formData.get('is_active');
    const is_boosted = formData.get('is_boosted');
    const cover_image = formData.get('cover_image') as string || null;
    const remove_image = formData.get('remove_image') === 'true';

    // ✅ Safely handle text fields
    if (title !== null && title !== '') { updates.push('title = ?'); values.push(title); }
    if (slug !== null && slug !== '') { updates.push('slug = ?'); values.push(slug); }
    if (content !== null && content !== '') { updates.push('content = ?'); values.push(content); }
    if (offer_link !== null && offer_link !== '') { updates.push('offer_link = ?'); values.push(offer_link); }
    if (payout_amount !== null) { updates.push('payout_amount = ?'); values.push(payout_amount === '' ? null : payout_amount); }
    if (pay_name !== null) { updates.push('pay_name = ?'); values.push(pay_name === '' ? null : pay_name); }
    if (brand_name !== null) { updates.push('brand_name = ?'); values.push(brand_name === '' ? null : brand_name); }
    
    // ✅ Safely handle numbers (convert empty strings to null)
    if (category_id !== null) {
      const cid = parseInt(category_id as string);
      updates.push('category_id = ?');
      values.push(isNaN(cid) ? null : cid);
    }
    if (author_id !== null) {
      const aid = parseInt(author_id as string);
      updates.push('author_id = ?');
      values.push(isNaN(aid) ? null : aid);
    }
    if (rating !== null) {
      const r = parseFloat(rating as string);
      updates.push('rating = ?');
      values.push(isNaN(r) ? null : r);
    }
    
    if (withdraw_method !== null) { updates.push('withdraw_method = ?'); values.push(withdraw_method === '' ? null : withdraw_method); }
    if (country !== null) { updates.push('country = ?'); values.push(country); }
    
    if (verified_date !== null) {
      updates.push('verified_date = ?');
      values.push(verified_date === '' ? null : verified_date);
    }

    if (meta_title !== null) { updates.push('meta_title = ?'); values.push(meta_title === '' ? null : meta_title); }
    if (meta_description !== null) { updates.push('meta_description = ?'); values.push(meta_description === '' ? null : meta_description); }
    if (meta_keywords !== null) { updates.push('meta_keywords = ?'); values.push(meta_keywords === '' ? null : meta_keywords); }

    if (is_active !== null) { updates.push('is_active = ?'); values.push(is_active === 'true' || is_active === '1' ? 1 : 0); }
    if (is_boosted !== null) { updates.push('is_boosted = ?'); values.push(is_boosted === 'true' || is_boosted === '1' ? 1 : 0); }

    let finalCoverImage = currentOffer.cover_image;

    // ✅ Handle Image Removal safely without crashing
    if (remove_image && finalCoverImage) {
      try {
        const filePath = path.join(process.cwd(), 'public', finalCoverImage);
        await unlink(filePath);
      } catch (err) {
        console.warn('Physical image not found or could not be deleted:', err);
      }
      finalCoverImage = null;
      updates.push('cover_image = ?');
      values.push(null);
    }

    // ✅ Handle New Image Upload safely
    if (cover_image && !remove_image) {
      if (finalCoverImage && finalCoverImage !== cover_image) {
        try {
          const filePath = path.join(process.cwd(), 'public', finalCoverImage);
          await unlink(filePath);
        } catch (err) {
          console.warn('Old physical image not found:', err);
        }
      }
      finalCoverImage = cover_image;
      updates.push('cover_image = ?');
      values.push(cover_image);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    await pool.execute(
      `UPDATE offers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Offer updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    // ✅ Return actual error message so the frontend shows it
    return NextResponse.json({ error: error.message || 'Failed to update offer' }, { status: 500 });
  }
}