import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';
import {
  dbGetArticles,
  dbGetOffers,
  dbGetCommentsTestimonials,
  dbGetContactMessages,
  dbGetUsers,
  dbGetAds,
  dbGetCounters,
} from '@/lib/admin-db';
import { isDbConfigured } from '@/lib/mysql';

export async function GET() {
  try {
    const session = await requireAdminSession();

    const [articles, offers, commentsAndAll, contacts, users, ads, counters] = await Promise.all([
      dbGetArticles(),
      dbGetOffers(),
      dbGetCommentsTestimonials(),
      dbGetContactMessages(),
      dbGetUsers(),
      dbGetAds(),
      dbGetCounters(),
    ]);

    const comments = commentsAndAll.filter((item) => item.type === 'comment');
    const reviews = commentsAndAll.filter((item) => item.type === 'review');
    const testimonials = commentsAndAll.filter((item) => item.type === 'testimonial');

    return NextResponse.json({
      stats: {
        totalArticles: articles.length,
        activeArticles: articles.filter((a) => a.is_active).length,
        totalOffers: offers.length,
        activeOffers: offers.filter((o) => o.is_active).length,
        totalComments: comments.length,
        pendingComments: comments.filter((c) => !c.is_approved).length,
        totalReviews: reviews.length,
        pendingReviews: reviews.filter((r) => !r.is_approved).length,
        totalTestimonials: testimonials.length,
        pendingTestimonials: testimonials.filter((t) => !t.is_approved).length,
        totalContacts: contacts.length,
        unreadContacts: contacts.filter((c) => !c.is_read).length,
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.is_active).length,
        totalAds: ads.length,
        activeAds: ads.filter((a) => a.is_active).length,
        counters,
        isRealDbConnected: isDbConfigured(),
      },
      currentUserRole: session.ok ? session.user.role : undefined,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
