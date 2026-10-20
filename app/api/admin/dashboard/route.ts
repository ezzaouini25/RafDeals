import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Helper to generate a full zero-filled date series array for the requested range
function generateDateSeries(daysCount: number) {
  const series: Array<{ date: string; views: number; clicks?: number }> = [];
  const today = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    series.push({ date: dateStr, views: 0, clicks: 0 });
  }
  return series;
}

// Helper to fill gaps in SQL analytics results with strict YYYY-MM-DD matching
function fillDateGaps(rows: any[], daysCount: number, includeClicks = false) {
  const baseSeries = generateDateSeries(daysCount);
  
  return baseSeries.map((defaultItem) => {
    const found = rows.find((row) => {
      if (!row.date) return false;
      const rowDateStr = new Date(row.date).toISOString().split('T')[0];
      return rowDateStr === defaultItem.date;
    });

    if (found) {
      return {
        date: defaultItem.date,
        views: Number(found.views || 0),
        ...(includeClicks ? { clicks: Number(found.clicks || 0) } : {}),
      };
    }
    return defaultItem;
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || '7d';

    let days = 7;
    switch (filter) {
      case '14d': days = 14; break;
      case '30d': days = 30; break;
      case '60d': days = 60; break;
      case '90d': days = 90; break;
      default: days = 7;
    }

    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ============================================================
    // 1. TOTAL COUNTS
    // ============================================================
    const [articlesCount] = await pool.execute('SELECT COUNT(*) as total FROM articles WHERE is_active = 1');
    const totalArticles = (articlesCount as any[])[0]?.total || 0;

    const [offersCount] = await pool.execute('SELECT COUNT(*) as total FROM offers WHERE is_active = 1');
    const totalOffers = (offersCount as any[])[0]?.total || 0;

    const [dealsCount] = await pool.execute('SELECT COUNT(*) as total FROM deals WHERE is_active = 1');
    const totalDeals = (dealsCount as any[])[0]?.total || 0;

    const [subscribersCount] = await pool.execute('SELECT COUNT(*) as total FROM subscriptions');
    const totalSubscribers = (subscribersCount as any[])[0]?.total || 0;

    const [blockedCount] = await pool.execute('SELECT COUNT(*) as total FROM rate_limit_blocks WHERE blocked_until > NOW()');
    const totalBlocked = (blockedCount as any[])[0]?.total || 0;

    // ============================================================
    // 2. BOTTOM COUNTS
    // ============================================================
    const [reviewsCount] = await pool.execute("SELECT COUNT(*) as total FROM comments_testimonials WHERE type = 'review'");
    const totalReviews = (reviewsCount as any[])[0]?.total || 0;

    const [commentsCount] = await pool.execute("SELECT COUNT(*) as total FROM comments_testimonials WHERE type = 'comment' OR type IS NULL OR type = ''");
    const totalComments = (commentsCount as any[])[0]?.total || 0;

    const [testimonialsCount] = await pool.execute("SELECT COUNT(*) as total FROM comments_testimonials WHERE type = 'testimonial'");
    const totalTestimonials = (testimonialsCount as any[])[0]?.total || 0;

    const [contactsCount] = await pool.execute('SELECT COUNT(*) as total FROM contact_messages');
    const totalContacts = (contactsCount as any[])[0]?.total || 0;

    // ============================================================
    // 3. COMPARISON (This Week vs Last Week)
    // ============================================================
    const getCountForPeriod = async (table: string, dateColumn: string, startDate: Date, endDate: Date, where?: string) => {
      const [result] = await pool.execute(
        `SELECT COUNT(*) as total FROM ${table} WHERE ${dateColumn} >= ? AND ${dateColumn} < ? ${where || ''}`,
        [startDate, endDate]
      );
      return (result as any[])[0]?.total || 0;
    };

    const articlesThisWeek = await getCountForPeriod('articles', 'created_at', thisWeekStart, now);
    const articlesLastWeek = await getCountForPeriod('articles', 'created_at', lastWeekStart, thisWeekStart);

    const offersThisWeek = await getCountForPeriod('offers', 'created_at', thisWeekStart, now);
    const offersLastWeek = await getCountForPeriod('offers', 'created_at', lastWeekStart, thisWeekStart);

    const dealsThisWeek = await getCountForPeriod('deals', 'created_at', thisWeekStart, now);
    const dealsLastWeek = await getCountForPeriod('deals', 'created_at', lastWeekStart, thisWeekStart);

    const subscribersThisWeek = await getCountForPeriod('subscriptions', 'created_at', thisWeekStart, now);
    const subscribersLastWeek = await getCountForPeriod('subscriptions', 'created_at', lastWeekStart, thisWeekStart);

    const blockedThisWeek = await getCountForPeriod('rate_limit_blocks', 'created_at', thisWeekStart, now, "AND blocked_until > NOW()");
    const blockedLastWeek = await getCountForPeriod('rate_limit_blocks', 'created_at', lastWeekStart, thisWeekStart, "AND blocked_until > NOW()");

    const reviewsThisWeek = await getCountForPeriod('comments_testimonials', 'created_at', thisWeekStart, now, "AND type = 'review'");
    const reviewsLastWeek = await getCountForPeriod('comments_testimonials', 'created_at', lastWeekStart, thisWeekStart, "AND type = 'review'");

    const commentsThisWeek = await getCountForPeriod('comments_testimonials', 'created_at', thisWeekStart, now, "AND (type = 'comment' OR type IS NULL OR type = '')");
    const commentsLastWeek = await getCountForPeriod('comments_testimonials', 'created_at', lastWeekStart, thisWeekStart, "AND (type = 'comment' OR type IS NULL OR type = '')");

    const testimonialsThisWeek = await getCountForPeriod('comments_testimonials', 'created_at', thisWeekStart, now, "AND type = 'testimonial'");
    const testimonialsLastWeek = await getCountForPeriod('comments_testimonials', 'created_at', lastWeekStart, thisWeekStart, "AND type = 'testimonial'");

    const contactsThisWeek = await getCountForPeriod('contact_messages', 'created_at', thisWeekStart, now);
    const contactsLastWeek = await getCountForPeriod('contact_messages', 'created_at', lastWeekStart, thisWeekStart);

    // ============================================================
    // 4. MONTH COMPARISON
    // ============================================================
    const offersThisMonth = await getCountForPeriod('offers', 'created_at', thisMonthStart, now);
    const offersLastMonth = await getCountForPeriod('offers', 'created_at', lastMonthStart, thisMonthStart);

    const articlesThisMonth = await getCountForPeriod('articles', 'created_at', thisMonthStart, now);
    const articlesLastMonth = await getCountForPeriod('articles', 'created_at', lastMonthStart, thisMonthStart);

    // ============================================================
    // 5. WEEKLY OFFERS ANALYTICS
    // ============================================================
    const [offersAnalytics] = await pool.execute(
      `SELECT date, SUM(views) as views, SUM(clicks) as clicks
       FROM analytics
       WHERE type = 'offer' AND date >= CURDATE() - INTERVAL ? DAY
       GROUP BY date
       ORDER BY date ASC`,
      [days]
    );
    const weeklyOffersData = fillDateGaps(offersAnalytics as any[], days, true);

    // ============================================================
    // 6. WEEKLY DEALS ANALYTICS (Handles 'deal' or 'deals')
    // ============================================================
    const [dealsAnalytics] = await pool.execute(
      `SELECT date, SUM(views) as views, SUM(clicks) as clicks
       FROM analytics
       WHERE (type = 'deal' OR type = 'deals') AND date >= CURDATE() - INTERVAL ? DAY
       GROUP BY date
       ORDER BY date ASC`,
      [days]
    );
    const weeklyDealsData = fillDateGaps(dealsAnalytics as any[], days, true);

    // ============================================================
    // 7. WEEKLY ARTICLES ANALYTICS
    // ============================================================
    const [articlesAnalytics] = await pool.execute(
      `SELECT date, SUM(views) as views
       FROM analytics
       WHERE type = 'article' AND date >= CURDATE() - INTERVAL ? DAY
       GROUP BY date
       ORDER BY date ASC`,
      [days]
    );
    const weeklyArticlesData = fillDateGaps(articlesAnalytics as any[], days, false);

    // ============================================================
    // 8-12. SUBSCRIBERS, REVIEWS, COMMENTS, TESTIMONIALS, CONTACTS
    // ============================================================
    const [subscribersAnalytics] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as views FROM subscriptions WHERE created_at >= CURDATE() - INTERVAL ? DAY GROUP BY DATE(created_at) ORDER BY date ASC`,
      [days]
    );
    const weeklySubscribersData = fillDateGaps(subscribersAnalytics as any[], days, false);

    const [reviewsAnalytics] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as views FROM comments_testimonials WHERE type = 'review' AND created_at >= CURDATE() - INTERVAL ? DAY GROUP BY DATE(created_at) ORDER BY date ASC`,
      [days]
    );
    const weeklyReviewsData = fillDateGaps(reviewsAnalytics as any[], days, false);

    const [commentsAnalytics] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as views FROM comments_testimonials WHERE (type = 'comment' OR type IS NULL OR type = '') AND created_at >= CURDATE() - INTERVAL ? DAY GROUP BY DATE(created_at) ORDER BY date ASC`,
      [days]
    );
    const weeklyCommentsData = fillDateGaps(commentsAnalytics as any[], days, false);

    const [testimonialsAnalytics] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as views FROM comments_testimonials WHERE type = 'testimonial' AND created_at >= CURDATE() - INTERVAL ? DAY GROUP BY DATE(created_at) ORDER BY date ASC`,
      [days]
    );
    const weeklyTestimonialsData = fillDateGaps(testimonialsAnalytics as any[], days, false);

    const [contactsAnalytics] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as views FROM contact_messages WHERE created_at >= CURDATE() - INTERVAL ? DAY GROUP BY DATE(created_at) ORDER BY date ASC`,
      [days]
    );
    const weeklyContactsData = fillDateGaps(contactsAnalytics as any[], days, false);

    // ============================================================
    // 13. TOP ARTICLES
    // ============================================================
    const [topArticlesToday] = await pool.execute(
      `SELECT a.id, a.title, a.cover_image, COALESCE(SUM(an.views), 0) as views
       FROM articles a
       LEFT JOIN analytics an ON an.content_id = a.id AND an.type = 'article' AND an.date = CURDATE()
       WHERE a.is_active = 1
       GROUP BY a.id, a.title, a.cover_image
       ORDER BY views DESC
       LIMIT 3`
    );

    const [topArticlesWeek] = await pool.execute(
      `SELECT a.id, a.title, a.cover_image, COALESCE(SUM(an.views), 0) as views
       FROM articles a
       LEFT JOIN analytics an ON an.content_id = a.id AND an.type = 'article' AND an.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       WHERE a.is_active = 1
       GROUP BY a.id, a.title, a.cover_image
       ORDER BY views DESC
       LIMIT 3`
    );

    const [topArticlesAllTime] = await pool.execute(
      `SELECT a.id, a.title, a.cover_image, COALESCE(SUM(an.views), 0) as views
       FROM articles a
       LEFT JOIN analytics an ON an.content_id = a.id AND an.type = 'article'
       WHERE a.is_active = 1
       GROUP BY a.id, a.title, a.cover_image
       ORDER BY views DESC
       LIMIT 3`
    );

    // ============================================================
    // 14. TOP OFFERS
    // ============================================================
    const [topOffersToday] = await pool.execute(
      `SELECT o.id, o.title, o.cover_image, COALESCE(SUM(an.views), 0) as views, COALESCE(SUM(an.clicks), 0) as clicks
       FROM offers o
       LEFT JOIN analytics an ON an.content_id = o.id AND an.type = 'offer' AND an.date = CURDATE()
       WHERE o.is_active = 1
       GROUP BY o.id, o.title, o.cover_image
       ORDER BY views DESC
       LIMIT 3`
    );

    const [topOffersWeek] = await pool.execute(
      `SELECT o.id, o.title, o.cover_image, COALESCE(SUM(an.views), 0) as views, COALESCE(SUM(an.clicks), 0) as clicks
       FROM offers o
       LEFT JOIN analytics an ON an.content_id = o.id AND an.type = 'offer' AND an.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       WHERE o.is_active = 1
       GROUP BY o.id, o.title, o.cover_image
       ORDER BY views DESC
       LIMIT 3`
    );

    const [topOffersAllTime] = await pool.execute(
      `SELECT o.id, o.title, o.cover_image, COALESCE(SUM(an.views), 0) as views, COALESCE(SUM(an.clicks), 0) as clicks
       FROM offers o
       LEFT JOIN analytics an ON an.content_id = o.id AND an.type = 'offer'
       WHERE o.is_active = 1
       GROUP BY o.id, o.title, o.cover_image
       ORDER BY views DESC
       LIMIT 3`
    );

    // ============================================================
    // 15. TOP DEALS (Handles 'deal' or 'deals')
    // ============================================================
    const [topDealsToday] = await pool.execute(
      `SELECT d.id, d.title, d.cover_image, COALESCE(SUM(an.views), 0) as views, COALESCE(SUM(an.clicks), 0) as clicks
       FROM deals d
       LEFT JOIN analytics an ON an.content_id = d.id AND (an.type = 'deal' OR an.type = 'deals') AND an.date = CURDATE()
       WHERE d.is_active = 1
       GROUP BY d.id, d.title, d.cover_image
       ORDER BY views DESC
       LIMIT 3`
    );

    const [topDealsWeek] = await pool.execute(
      `SELECT d.id, d.title, d.cover_image, COALESCE(SUM(an.views), 0) as views, COALESCE(SUM(an.clicks), 0) as clicks
       FROM deals d
       LEFT JOIN analytics an ON an.content_id = d.id AND (an.type = 'deal' OR an.type = 'deals') AND an.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       WHERE d.is_active = 1
       GROUP BY d.id, d.title, d.cover_image
       ORDER BY views DESC
       LIMIT 3`
    );

    const [topDealsAllTime] = await pool.execute(
      `SELECT d.id, d.title, d.cover_image, COALESCE(SUM(an.views), 0) as views, COALESCE(SUM(an.clicks), 0) as clicks
       FROM deals d
       LEFT JOIN analytics an ON an.content_id = d.id AND (an.type = 'deal' OR an.type = 'deals')
       WHERE d.is_active = 1
       GROUP BY d.id, d.title, d.cover_image
       ORDER BY views DESC
       LIMIT 3`
    );

    // ============================================================
    // 16. FETCH LAST 4 CONTACT MESSAGES (All Content/Columns)
    // ============================================================
    const [contactMessagesRows] = await pool.execute(
      `SELECT * 
       FROM contact_messages 
       ORDER BY id DESC 
       LIMIT 4`
    );

    // ============================================================
    // 17. CALCULATE PERCENTAGE CHANGES
    // ============================================================
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return { percent: current > 0 ? 100 : 0, isUp: current > 0 };
      const change = ((current - previous) / previous) * 100;
      return { percent: Math.round(change), isUp: change >= 0 };
    };

    // ============================================================
    // 18. RESPONSE
    // ============================================================
    return NextResponse.json({
      articles: {
        total: totalArticles,
        thisWeek: articlesThisWeek,
        lastWeek: articlesLastWeek,
        change: calcChange(articlesThisWeek, articlesLastWeek)
      },
      offers: {
        total: totalOffers,
        thisWeek: offersThisWeek,
        lastWeek: offersLastWeek,
        change: calcChange(offersThisWeek, offersLastWeek)
      },
      deals: {
        total: totalDeals,
        thisWeek: dealsThisWeek,
        lastWeek: dealsLastWeek,
        change: calcChange(dealsThisWeek, dealsLastWeek)
      },
      subscribers: {
        total: totalSubscribers,
        thisWeek: subscribersThisWeek,
        lastWeek: subscribersLastWeek,
        change: calcChange(subscribersThisWeek, subscribersLastWeek)
      },
      blocked: {
        total: totalBlocked,
        thisWeek: blockedThisWeek,
        lastWeek: blockedLastWeek,
        change: calcChange(blockedThisWeek, blockedLastWeek)
      },

      reviews: {
        total: totalReviews,
        thisWeek: reviewsThisWeek,
        lastWeek: reviewsLastWeek,
        change: calcChange(reviewsThisWeek, reviewsLastWeek)
      },
      comments: {
        total: totalComments,
        thisWeek: commentsThisWeek,
        lastWeek: commentsLastWeek,
        change: calcChange(commentsThisWeek, commentsLastWeek)
      },
      testimonials: {
        total: totalTestimonials,
        thisWeek: testimonialsThisWeek,
        lastWeek: testimonialsLastWeek,
        change: calcChange(testimonialsThisWeek, testimonialsLastWeek)
      },
      contacts: {
        total: totalContacts,
        thisWeek: contactsThisWeek,
        lastWeek: contactsLastWeek,
        change: calcChange(contactsThisWeek, contactsLastWeek)
      },

      weeklyOffers: weeklyOffersData,
      weeklyDeals: weeklyDealsData,
      weeklyArticles: weeklyArticlesData,
      weeklySubscribers: weeklySubscribersData,
      weeklyReviews: weeklyReviewsData,
      weeklyComments: weeklyCommentsData,
      weeklyTestimonials: weeklyTestimonialsData,
      weeklyContacts: weeklyContactsData,

      topArticles: {
        today: topArticlesToday,
        week: topArticlesWeek,
        allTime: topArticlesAllTime,
      },

      topOffers: {
        today: topOffersToday,
        week: topOffersWeek,
        allTime: topOffersAllTime,
      },

      topDeals: {
        today: topDealsToday,
        week: topDealsWeek,
        allTime: topDealsAllTime,
      },

      // Added the last 4 contact messages with all contents/columns here:
      contactMessages: contactMessagesRows,

      comparisons: {
        offers: {
          week: { current: offersThisWeek, previous: offersLastWeek, change: calcChange(offersThisWeek, offersLastWeek) },
          month: { current: offersThisMonth, previous: offersLastMonth, change: calcChange(offersThisMonth, offersLastMonth) },
        },
        articles: {
          week: { current: articlesThisWeek, previous: articlesLastWeek, change: calcChange(articlesThisWeek, articlesLastWeek) },
          month: { current: articlesThisMonth, previous: articlesLastMonth, change: calcChange(articlesThisMonth, articlesLastMonth) },
        },
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}