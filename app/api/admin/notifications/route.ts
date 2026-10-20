import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // ✅ Get page from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 15;
    const offset = (page - 1) * limit;

    // GET ALL COMMENTS - WITH is_read AND is_approved
    const [comments] = await pool.execute(
      `SELECT 
        id, 
        'comment' as type,
        author_name as name,
        author_email as email,
        content as message,
        created_at as time,
        is_read,
        is_approved
      FROM comments_testimonials 
      WHERE type = 'comment'
      ORDER BY created_at DESC`
    );

    // GET ALL TESTIMONIALS - WITH is_read AND is_approved
    const [testimonials] = await pool.execute(
      `SELECT 
        id, 
        'testimonial' as type,
        author_name as name,
        author_email as email,
        content as message,
        created_at as time,
        is_read,
        is_approved
      FROM comments_testimonials 
      WHERE type = 'testimonial'
      ORDER BY created_at DESC`
    );

    // GET ALL REVIEWS - WITH is_read AND is_approved
    const [reviews] = await pool.execute(
      `SELECT 
        id, 
        'review' as type,
        author_name as name,
        author_email as email,
        content as message,
        created_at as time,
        is_read,
        is_approved
      FROM comments_testimonials 
      WHERE type = 'review'
      ORDER BY created_at DESC`
    );

    // GET ALL CONTACTS - WITH is_read
    const [contacts] = await pool.execute(
      `SELECT 
        id, 
        'contact' as type,
        name,
        email,
        message,
        created_at as time,
        is_read
      FROM contact_messages 
      ORDER BY created_at DESC`
    );

    // ✅ GET TOTAL COUNT FOR PAGINATION
    const [totalResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM (
        (SELECT id FROM comments_testimonials WHERE type = 'comment')
        UNION ALL
        (SELECT id FROM comments_testimonials WHERE type = 'testimonial')
        UNION ALL
        (SELECT id FROM comments_testimonials WHERE type = 'review')
        UNION ALL
        (SELECT id FROM contact_messages)
      ) as combined
    `);

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // GET COUNTS
    const [commentsCount] = await pool.execute(
      `SELECT COUNT(*) as count FROM comments_testimonials WHERE type = 'comment'`
    );
    const [testimonialsCount] = await pool.execute(
      `SELECT COUNT(*) as count FROM comments_testimonials WHERE type = 'testimonial'`
    );
    const [reviewsCount] = await pool.execute(
      `SELECT COUNT(*) as count FROM comments_testimonials WHERE type = 'review'`
    );
    const [contactsCount] = await pool.execute(
      `SELECT COUNT(*) as count FROM contact_messages`
    );

    // GET UNREAD COUNTS
    const [unreadComments] = await pool.execute(
      `SELECT COUNT(*) as count FROM comments_testimonials WHERE type = 'comment' AND is_read = 0`
    );
    const [unreadTestimonials] = await pool.execute(
      `SELECT COUNT(*) as count FROM comments_testimonials WHERE type = 'testimonial' AND is_read = 0`
    );
    const [unreadReviews] = await pool.execute(
      `SELECT COUNT(*) as count FROM comments_testimonials WHERE type = 'review' AND is_read = 0`
    );
    const [unreadContacts] = await pool.execute(
      `SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0`
    );

    // ✅ FORMAT NOTIFICATIONS WITH REAL DATA FROM DATABASE
    const notifications: any[] = [];

    // Comments - using REAL is_read and is_approved from DB
    for (const item of comments as any[]) {
      notifications.push({
        id: `comment_${item.id}`,
        type: 'comment',
        title: 'New Comment',
        name: item.name || 'Anonymous',
        email: item.email || '',
        message: item.message || 'No message',
        time: item.time,
        link: '/admin/comments',
        read: item.is_read === 1,
        approved: item.is_approved === 1,
      });
    }

    // Testimonials - using REAL is_read and is_approved from DB
    for (const item of testimonials as any[]) {
      notifications.push({
        id: `testimonial_${item.id}`,
        type: 'testimonial',
        title: 'New Testimonial',
        name: item.name || 'Anonymous',
        email: item.email || '',
        message: item.message || 'No message',
        time: item.time,
        link: '/admin/testimonials',
        read: item.is_read === 1,
        approved: item.is_approved === 1,
      });
    }

    // Reviews - using REAL is_read and is_approved from DB
    for (const item of reviews as any[]) {
      notifications.push({
        id: `review_${item.id}`,
        type: 'review',
        title: 'New Review',
        name: item.name || 'Anonymous',
        email: item.email || '',
        message: item.message || 'No message',
        time: item.time,
        link: '/admin/reviews',
        read: item.is_read === 1,
        approved: item.is_approved === 1,
      });
    }

    // Contacts - using REAL is_read from DB (no is_approved column)
    for (const item of contacts as any[]) {
      notifications.push({
        id: `contact_${item.id}`,
        type: 'contact',
        title: 'New Contact Message',
        name: item.name || 'Anonymous',
        email: item.email || '',
        message: item.message || 'No message',
        time: item.time,
        link: '/admin/contacts',
        read: item.is_read === 1,
        approved: true,
      });
    }

    // SORT BY TIME (NEWEST FIRST)
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // ✅ APPLY PAGINATION AFTER SORTING
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    const totalUnread = (unreadComments[0]?.count || 0) + (unreadTestimonials[0]?.count || 0) + 
                        (unreadReviews[0]?.count || 0) + (unreadContacts[0]?.count || 0);

    return NextResponse.json({
      counts: {
        comments: commentsCount[0]?.count || 0,
        testimonials: testimonialsCount[0]?.count || 0,
        reviews: reviewsCount[0]?.count || 0,
        contacts: contactsCount[0]?.count || 0,
      },
      unreadCounts: {
        comments: unreadComments[0]?.count || 0,
        testimonials: unreadTestimonials[0]?.count || 0,
        reviews: unreadReviews[0]?.count || 0,
        contacts: unreadContacts[0]?.count || 0,
      },
      totalUnread,
      total,
      notifications: paginatedNotifications,
      page,
      totalPages,
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}