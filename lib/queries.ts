import { cache } from 'react';
import pool from './db';
import { Offer, Deal, Article, FAQ, LegalPage, Comment, Subscription, HomepageCounters, Author, Category } from '@/types';

// ============================================================
// CATEGORY QUERIES
// ============================================================

export const getCategories = cache(async (type?: 'offers' | 'articles' | 'deals'): Promise<Category[]> => {
  let query = 'SELECT * FROM categories WHERE is_active = 1';
  const params: any[] = [];

  if (type) {
    query += ' AND (type = ? OR type = "both")';
    params.push(type);
  }

  query += ' ORDER BY name ASC';

  const [rows] = await pool.execute(query, params);
  console.log(`✅ getCategories(${type}) returned:`, (rows as any[]).length, 'rows');
  return rows as Category[];
});


export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const [rows] = await pool.execute(
    'SELECT * FROM categories WHERE slug = ? AND is_active = 1',
    [slug]
  );
  return (rows as any[])[0] || null;
});

export const getCategoryById = cache(async (id: number): Promise<Category | null> => {
  const [rows] = await pool.execute(
    'SELECT * FROM categories WHERE id = ? AND is_active = 1',
    [id]
  );
  return (rows as any[])[0] || null;
});

// ============================================================
// OFFERS QUERIES - WITH AUTHOR & CATEGORY
// ============================================================

export const getFeaturedOffers = cache(async (limit = 6): Promise<Offer[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      o.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM offers o
     LEFT JOIN authors au ON o.author_id = au.id
     LEFT JOIN categories c ON o.category_id = c.id
     WHERE o.is_active = 1 AND o.is_boosted = 1 
     ORDER BY o.created_at DESC 
     LIMIT ?`,
    [limit]
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Offer[];
});

export const getAllOffers = cache(async (): Promise<Offer[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      o.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM offers o
     LEFT JOIN authors au ON o.author_id = au.id
     LEFT JOIN categories c ON o.category_id = c.id
     WHERE o.is_active = 1 
     ORDER BY o.is_boosted DESC, o.created_at DESC`
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Offer[];
});

// ============================================================
// getOfferBySlug - WITH ANALYTICS (One row per day)
// ============================================================

export const getOfferBySlug = cache(async (slug: string): Promise<Offer | null> => {
  const [rows] = await pool.execute(
    `SELECT 
      o.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM offers o
     LEFT JOIN authors au ON o.author_id = au.id
     LEFT JOIN categories c ON o.category_id = c.id
     WHERE o.slug = ? AND o.is_active = 1`,
    [slug]
  );
  
  const offers = rows as any[];
  if (offers.length === 0) return null;
  
  const offer = offers[0];
  
  // ✅ INCREMENT VIEWS IN OFFERS TABLE
  await pool.execute(
    'UPDATE offers SET views = views + 1 WHERE id = ?',
    [offer.id]
  );
  
  // ✅ INSERT OR UPDATE ANALYTICS - ONE ROW PER DAY
  // If record exists for today → views + 1
  // If no record for today → insert new row with views = 1
  await pool.execute(
    `INSERT INTO analytics (content_id, type, views, clicks, date)
     VALUES (?, 'offer', 1, 0, CURDATE())
     ON DUPLICATE KEY UPDATE views = views + 1`,
    [offer.id]
  );
  
  const category = offer.category_id ? {
    id: offer.category_id,
    name: offer.category_name,
    slug: offer.category_slug,
    type: offer.category_type,
    is_active: 1,
    created_at: '',
    updated_at: ''
  } : null;
  
  return {
    ...offer,
    category
  } as Offer;
});

export const getOfferById = cache(async (id: number): Promise<Offer | null> => {
  const [rows] = await pool.execute(
    `SELECT 
      o.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM offers o
     LEFT JOIN authors au ON o.author_id = au.id
     LEFT JOIN categories c ON o.category_id = c.id
     WHERE o.id = ? AND o.is_active = 1`,
    [id]
  );
  
  const offers = rows as any[];
  if (offers.length === 0) return null;
  
  const offer = offers[0];
  
  const category = offer.category_id ? {
    id: offer.category_id,
    name: offer.category_name,
    slug: offer.category_slug,
    type: offer.category_type,
    is_active: 1,
    created_at: '',
    updated_at: ''
  } : null;
  
  return {
    ...offer,
    category
  } as Offer;
});

// ============================================================
// getOfferIdBySlug (for analytics)
// ============================================================

export const getOfferIdBySlug = cache(async (slug: string): Promise<number | null> => {
  const [rows] = await pool.execute(
    'SELECT id FROM offers WHERE slug = ?',
    [slug]
  );
  const offer = (rows as any[])[0];
  return offer ? offer.id : null;
});

// ============================================================
// incrementOfferClicks - WITH ANALYTICS (One row per day)
// ============================================================

export const incrementOfferClicks = cache(async (slug: string): Promise<void> => {
  try {
    // ✅ GET OFFER ID
    const [rows] = await pool.execute(
      'SELECT id FROM offers WHERE slug = ?',
      [slug]
    );
    
    const offer = (rows as any[])[0];
    if (!offer) {
      console.error('❌ Offer not found for slug:', slug);
      return;
    }
    
    const offerId = offer.id;
    
    // ✅ UPDATE CLICKS IN OFFERS TABLE
    await pool.execute(
      'UPDATE offers SET clicks = clicks + 1 WHERE id = ?',
      [offerId]
    );
    
    // ✅ INSERT OR UPDATE ANALYTICS - ONE ROW PER DAY
    // If record exists for today → clicks + 1
    // If no record for today → insert new row with clicks = 1
    await pool.execute(
      `INSERT INTO analytics (content_id, type, views, clicks, date)
       VALUES (?, 'offer', 0, 1, CURDATE())
       ON DUPLICATE KEY UPDATE clicks = clicks + 1`,
      [offerId]
    );
    
    console.log(`✅ Click tracked for offer ${offerId} (${slug})`);
  } catch (error) {
    console.error('❌ Error tracking click:', error);
  }
});

// ============================================================
// GET OFFERS BY CATEGORY SLUG
// ============================================================

export const getOffersByCategorySlug = cache(async (categorySlug: string): Promise<Offer[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      o.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM offers o
     LEFT JOIN authors au ON o.author_id = au.id
     LEFT JOIN categories c ON o.category_id = c.id
     WHERE c.slug = ? AND o.is_active = 1
     ORDER BY o.is_boosted DESC, o.created_at DESC`,
    [categorySlug]
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Offer[];
});

// ============================================================
// GET OFFERS BY TYPE (FROM offers.type COLUMN)
// ============================================================

export const getOffersByType = cache(async (type: string): Promise<Offer[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      o.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM offers o
     LEFT JOIN authors au ON o.author_id = au.id
     LEFT JOIN categories c ON o.category_id = c.id
     WHERE o.type = ? AND o.is_active = 1
     ORDER BY o.is_boosted DESC, o.created_at DESC`,
    [type]
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Offer[];
});

// ============================================================
// ARTICLES QUERIES - WITH AUTHOR & CATEGORY
// ============================================================

export const getLatestArticles = cache(async (limit = 6): Promise<Article[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      a.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM articles a
     LEFT JOIN authors au ON a.author_id = au.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.is_active = 1 
     ORDER BY a.is_boosted DESC, a.created_at DESC
     LIMIT ?`,
    [limit]
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Article[];
});

export const getAllArticles = cache(async (): Promise<Article[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      a.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM articles a
     LEFT JOIN authors au ON a.author_id = au.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.is_active = 1 
     ORDER BY a.is_boosted DESC, a.created_at DESC`
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Article[];
});

// ============================================================
// getArticleBySlug - WITH ANALYTICS (One row per day)
// ============================================================

export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const [rows] = await pool.execute(
    `SELECT 
      a.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM articles a
     LEFT JOIN authors au ON a.author_id = au.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.slug = ? AND a.is_active = 1`,
    [slug]
  );
  
  const articles = rows as any[];
  if (articles.length === 0) return null;
  
  const article = articles[0];
  
  // ✅ INCREMENT VIEWS IN ARTICLES TABLE
  await pool.execute(
    'UPDATE articles SET views = views + 1 WHERE id = ?',
    [article.id]
  );
  
  // ✅ INSERT OR UPDATE ANALYTICS - ONE ROW PER DAY
  // If record exists for today → views + 1
  // If no record for today → insert new row with views = 1
  await pool.execute(
    `INSERT INTO analytics (content_id, type, views, clicks, date)
     VALUES (?, 'article', 1, 0, CURDATE())
     ON DUPLICATE KEY UPDATE views = views + 1`,
    [article.id]
  );
  
  const category = article.category_id ? {
    id: article.category_id,
    name: article.category_name,
    slug: article.category_slug,
    type: article.category_type,
    is_active: 1,
    created_at: '',
    updated_at: ''
  } : null;
  
  return {
    ...article,
    category
  } as Article;
});

// ============================================================
// GET ARTICLES BY CATEGORY SLUG
// ============================================================

export const getArticlesByCategorySlug = cache(async (categorySlug: string): Promise<Article[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      a.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM articles a
     LEFT JOIN authors au ON a.author_id = au.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE c.slug = ? AND a.is_active = 1
     ORDER BY a.is_boosted DESC, a.created_at DESC`,
    [categorySlug]
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Article[];
});

// ============================================================
// GET ARTICLES BY TYPE (FROM articles.type COLUMN)
// ============================================================

export const getArticlesByType = cache(async (type: string): Promise<Article[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      a.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM articles a
     LEFT JOIN authors au ON a.author_id = au.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.type = ? AND a.is_active = 1
     ORDER BY a.is_boosted DESC, a.created_at DESC`,
    [type]
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Article[];
});

// ============================================================
// AUTHOR QUERIES
// ============================================================

export const getAuthorById = cache(async (id: number): Promise<Author | null> => {
  const [rows] = await pool.execute(
    'SELECT id, name, picture, bio, is_active, created_at, updated_at FROM authors WHERE id = ? AND is_active = 1',
    [id]
  );
  const authors = rows as Author[];
  return authors[0] || null;
});

export const getAllAuthors = cache(async (): Promise<Author[]> => {
  const [rows] = await pool.execute(
    'SELECT id, name, picture, bio, is_active, created_at, updated_at FROM authors WHERE is_active = 1 ORDER BY name ASC'
  );
  return rows as Author[];
});

// ============================================================
// FAQ QUERIES
// ============================================================

export const getPublishedFAQs = cache(async (): Promise<FAQ[]> => {
  const [rows] = await pool.execute(
    'SELECT * FROM faqs WHERE is_published = 1 ORDER BY sort_order ASC'
  );
  return rows as FAQ[];
});

// ============================================================
// LEGAL PAGES QUERIES
// ============================================================

export const getLegalPageBySlug = cache(async (slug: string): Promise<LegalPage | null> => {
  const [rows] = await pool.execute(
    'SELECT * FROM legal_pages WHERE slug = ? AND is_published = 1',
    [slug]
  );
  const pages = rows as LegalPage[];
  return pages[0] || null;
});

export const getAllLegalPageSlugs = cache(async (): Promise<{slug: string}[]> => {
  const [rows] = await pool.execute(
    'SELECT slug FROM legal_pages WHERE is_published = 1'
  );
  return rows as {slug: string}[];
});

// ============================================================
// COMMENTS & REVIEWS QUERIES
// ============================================================

export const getCommentsByArticleSlug = async (slug: string): Promise<Comment[]> => {
  try {
    const [articleRows] = await pool.execute(
      'SELECT id FROM articles WHERE slug = ?',
      [slug]
    );
    
    const articles = articleRows as any[];
    if (articles.length === 0) return [];
    
    const articleId = articles[0].id;
    
    const [rows] = await pool.execute(
      `SELECT * FROM comments_testimonials 
       WHERE article_id = ? 
         AND (type = 'comment' OR type = '' OR type IS NULL)
         AND is_approved = 1 
       ORDER BY created_at DESC`,
      [articleId]
    );
    
    return rows as Comment[];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const getReviewsByOfferId = cache(async (offerId: number): Promise<Comment[]> => {
  const [rows] = await pool.execute(
    `SELECT * FROM comments_testimonials 
     WHERE offer_id = ? AND type = 'review' AND is_approved = 1 
     ORDER BY created_at DESC`,
    [offerId]
  );
  return rows as Comment[];
});

export const addReview = async (
  offerId: number,
  data: { author_name: string; author_email: string; content: string; rating?: number }
): Promise<{ id: number }> => {
  const [result] = await pool.execute(
    `INSERT INTO comments_testimonials 
     (offer_id, type, author_name, author_email, content, rating) 
     VALUES (?, 'review', ?, ?, ?, ?)`,
    [offerId, data.author_name, data.author_email, data.content, data.rating || null]
  );

  return { id: (result as any).insertId };
};

// ============================================================
// SUBSCRIPTION QUERIES
// ============================================================

export const checkEmailExists = cache(async (email: string): Promise<boolean> => {
  const [rows] = await pool.execute(
    'SELECT id FROM subscriptions WHERE email = ?',
    [email.toLowerCase().trim()]
  );
  return (rows as any[]).length > 0;
});

export const getAllSubscriptions = cache(async (limit: number = 100): Promise<Subscription[]> => {
  const [rows] = await pool.execute(
    'SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return rows as Subscription[];
});

export const countSubscriptionsInLastHour = cache(async (
  ip_address: string,
  device_fingerprint: string
): Promise<number> => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM subscription_logs 
     WHERE (ip_address = ? OR device_fingerprint = ?) 
       AND created_at >= NOW() - INTERVAL 1 HOUR`,
    [ip_address, device_fingerprint]
  );
  return (rows as any[])[0]?.count || 0;
});

export const checkSubscriptionBlock = cache(async (
  ip_address: string,
  device_fingerprint: string
): Promise<{ blocked: boolean; blocked_until?: string; reason?: string; remaining_seconds?: number }> => {
  try {
    const [rows] = await pool.execute(
      `SELECT blocked_until, reason 
       FROM rate_limit_blocks 
       WHERE (ip_address = ? OR device_fingerprint = ?) 
         AND blocked_until > NOW() 
         AND reason LIKE 'Subscription limit%'
       ORDER BY blocked_until DESC 
       LIMIT 1`,
      [ip_address, device_fingerprint]
    );

    const block = (rows as any[])[0];

    if (block) {
      const remainingSeconds = Math.floor((new Date(block.blocked_until).getTime() - Date.now()) / 1000);
      return {
        blocked: true,
        blocked_until: block.blocked_until,
        reason: block.reason,
        remaining_seconds: Math.max(0, remainingSeconds)
      };
    }

    return { blocked: false };

  } catch (error) {
    console.error('Error checking subscription block:', error);
    return { blocked: false };
  }
});

export const insertSubscription = async (
  email: string,
  ip_address: string,
  device_fingerprint: string
): Promise<{ id: number }> => {
  const [result] = await pool.execute(
    `INSERT INTO subscriptions (email, ip_address, device_fingerprint) 
     VALUES (?, ?, ?)`,
    [email.toLowerCase().trim(), ip_address, device_fingerprint]
  );
  return { id: (result as any).insertId };
};

export const logSubscriptionAttempt = async (
  email: string,
  ip_address: string,
  device_fingerprint: string
): Promise<void> => {
  await pool.execute(
    `INSERT INTO subscription_logs (email, ip_address, device_fingerprint) 
     VALUES (?, ?, ?)`,
    [email.toLowerCase().trim(), ip_address, device_fingerprint]
  );
};

// ============================================================
// HOMEPAGE COUNTERS
// ============================================================

export const getHomepageCounters = cache(async (): Promise<HomepageCounters | null> => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM homepage_counters WHERE is_live = 1 LIMIT 1'
    );
    return (rows as HomepageCounters[])[0] || null;
  } catch (error) {
    console.error('Error fetching homepage counters:', error);
    return null;
  }
});

// ============================================================
// ADMIN USERS QUERIES
// ============================================================

export const getUserByIdentifier = cache(async (identifier: string): Promise<any | null> => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, username, email, password, role, name, is_active, is_blocked, created_at 
       FROM users 
       WHERE (username = ? OR email = ?) AND is_active = 1 AND is_blocked = 0`,
      [identifier, identifier]
    );
    
    const user = (rows as any[])[0];
    return user || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
});

export const getUserById = cache(async (id: number): Promise<any | null> => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, username, email, role, name, is_active, is_blocked, created_at 
       FROM users 
       WHERE id = ? AND is_active = 1`,
      [id]
    );
    
    const user = (rows as any[])[0];
    return user || null;
  } catch (error) {
    console.error('Error fetching user by id:', error);
    return null;
  }
});

// ============================================================
// RATE LIMITING QUERIES
// ============================================================

export const checkBlockStatus = cache(async (ip: string, device_fingerprint: string) => {
  try {
    const [rows] = await pool.execute(
      `SELECT blocked_until, reason 
       FROM rate_limit_blocks 
       WHERE (ip_address = ? OR device_fingerprint = ?) 
         AND blocked_until > NOW() 
       ORDER BY blocked_until DESC 
       LIMIT 1`,
      [ip, device_fingerprint]
    );

    const block = (rows as any[])[0];

    if (block) {
      const remainingSeconds = Math.floor((new Date(block.blocked_until).getTime() - Date.now()) / 1000);
      return {
        blocked: true,
        blocked_until: block.blocked_until,
        remaining_seconds: Math.max(0, remainingSeconds),
        reason: block.reason
      };
    }

    return { blocked: false };

  } catch (error) {
    console.error('Error checking block status:', error);
    return { blocked: false };
  }
});

// ============================================================
// GET ALL OFFER SLUGS (for generateStaticParams)
// ============================================================

export const getAllOfferSlugs = cache(async (): Promise<{ slug: string }[]> => {
  const [rows] = await pool.execute(
    'SELECT slug FROM offers WHERE is_active = 1'
  );
  return rows as { slug: string }[];
});

// ============================================================
// GET ALL ARTICLE SLUGS (for generateStaticParams)
// ============================================================

export const getAllArticleSlugs = cache(async (): Promise<{ slug: string }[]> => {
  const [rows] = await pool.execute(
    'SELECT slug FROM articles WHERE is_active = 1'
  );
  return rows as { slug: string }[];
});


// ============================================================
// DEALS QUERIES - WITH AUTHOR & CATEGORY
// (mirrors offers queries 100%)
// ============================================================

export const getFeaturedDeals = cache(async (limit = 6): Promise<Deal[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      d.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM deals d
     LEFT JOIN authors au ON d.author_id = au.id
     LEFT JOIN categories c ON d.category_id = c.id
     WHERE d.is_active = 1 AND d.is_boosted = 1 
     ORDER BY d.created_at DESC 
     LIMIT ?`,
    [limit]
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Deal[];
});

export const getAllDeals = cache(async (): Promise<Deal[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      d.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM deals d
     LEFT JOIN authors au ON d.author_id = au.id
     LEFT JOIN categories c ON d.category_id = c.id
     WHERE d.is_active = 1 
     ORDER BY d.is_boosted DESC, d.created_at DESC`
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Deal[];
});

// ============================================================
// getDealBySlug - WITH ANALYTICS (One row per day)
// ============================================================

export const getDealBySlug = cache(async (slug: string): Promise<Deal | null> => {
  const [rows] = await pool.execute(
    `SELECT 
      d.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM deals d
     LEFT JOIN authors au ON d.author_id = au.id
     LEFT JOIN categories c ON d.category_id = c.id
     WHERE d.slug = ? AND d.is_active = 1`,
    [slug]
  );
  
  const deals = rows as any[];
  if (deals.length === 0) return null;
  
  const deal = deals[0];
  
  // ✅ INCREMENT VIEWS IN DEALS TABLE
  await pool.execute(
    'UPDATE deals SET views = views + 1 WHERE id = ?',
    [deal.id]
  );
  
  // ✅ INSERT OR UPDATE ANALYTICS - ONE ROW PER DAY
  await pool.execute(
    `INSERT INTO analytics (content_id, type, views, clicks, date)
     VALUES (?, 'deal', 1, 0, CURDATE())
     ON DUPLICATE KEY UPDATE views = views + 1`,
    [deal.id]
  );
  
  const category = deal.category_id ? {
    id: deal.category_id,
    name: deal.category_name,
    slug: deal.category_slug,
    type: deal.category_type,
    is_active: 1,
    created_at: '',
    updated_at: ''
  } : null;
  
  return {
    ...deal,
    category
  } as Deal;
});

export const getDealById = cache(async (id: number): Promise<Deal | null> => {
  const [rows] = await pool.execute(
    `SELECT 
      d.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM deals d
     LEFT JOIN authors au ON d.author_id = au.id
     LEFT JOIN categories c ON d.category_id = c.id
     WHERE d.id = ? AND d.is_active = 1`,
    [id]
  );
  
  const deals = rows as any[];
  if (deals.length === 0) return null;
  
  const deal = deals[0];
  
  const category = deal.category_id ? {
    id: deal.category_id,
    name: deal.category_name,
    slug: deal.category_slug,
    type: deal.category_type,
    is_active: 1,
    created_at: '',
    updated_at: ''
  } : null;
  
  return {
    ...deal,
    category
  } as Deal;
});

// ============================================================
// getDealIdBySlug (for analytics)
// ============================================================

export const getDealIdBySlug = cache(async (slug: string): Promise<number | null> => {
  const [rows] = await pool.execute(
    'SELECT id FROM deals WHERE slug = ?',
    [slug]
  );
  const deal = (rows as any[])[0];
  return deal ? deal.id : null;
});

// ============================================================
// incrementDealClicks - WITH ANALYTICS (One row per day)
// ============================================================

export const incrementDealClicks = cache(async (slug: string): Promise<void> => {
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM deals WHERE slug = ?',
      [slug]
    );
    
    const deal = (rows as any[])[0];
    if (!deal) {
      console.error('❌ Deal not found for slug:', slug);
      return;
    }
    
    const dealId = deal.id;
    
    // ✅ UPDATE CLICKS IN DEALS TABLE
    await pool.execute(
      'UPDATE deals SET clicks = clicks + 1 WHERE id = ?',
      [dealId]
    );
    
    // ✅ INSERT OR UPDATE ANALYTICS - ONE ROW PER DAY
    await pool.execute(
      `INSERT INTO analytics (content_id, type, views, clicks, date)
       VALUES (?, 'deal', 0, 1, CURDATE())
       ON DUPLICATE KEY UPDATE clicks = clicks + 1`,
      [dealId]
    );
    
    console.log(`✅ Click tracked for deal ${dealId} (${slug})`);
  } catch (error) {
    console.error('❌ Error tracking deal click:', error);
  }
});

// ============================================================
// GET DEALS BY CATEGORY SLUG
// ============================================================

export const getDealsByCategorySlug = cache(async (categorySlug: string): Promise<Deal[]> => {
  const [rows] = await pool.execute(
    `SELECT 
      d.*,
      au.name as author_name,
      au.picture as author_picture,
      au.bio as author_bio,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug,
      c.type as category_type
     FROM deals d
     LEFT JOIN authors au ON d.author_id = au.id
     LEFT JOIN categories c ON d.category_id = c.id
     WHERE c.slug = ? AND d.is_active = 1
     ORDER BY d.is_boosted DESC, d.created_at DESC`,
    [categorySlug]
  );
  
  return (rows as any[]).map(row => {
    const category = row.category_id ? {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      type: row.category_type,
      is_active: 1,
      created_at: '',
      updated_at: ''
    } : null;
    
    return {
      ...row,
      category
    };
  }) as Deal[];
});

// ============================================================
// GET ALL DEAL SLUGS (for generateStaticParams)
// ============================================================

export const getAllDealSlugs = cache(async (): Promise<{ slug: string }[]> => {
  const [rows] = await pool.execute(
    'SELECT slug FROM deals WHERE is_active = 1'
  );
  return rows as { slug: string }[];
});

// ============================================================
// REVIEWS BY DEAL ID
// ============================================================

export const getReviewsByDealId = cache(async (dealId: number): Promise<Comment[]> => {
  const [rows] = await pool.execute(
    `SELECT * FROM comments_testimonials 
     WHERE deal_id = ? AND type = 'review' AND is_approved = 1 
     ORDER BY created_at DESC`,
    [dealId]
  );
  return rows as Comment[];
});

export const addDealReview = async (
  dealId: number,
  data: { author_name: string; author_email: string; content: string; rating?: number }
): Promise<{ id: number }> => {
  const [result] = await pool.execute(
    `INSERT INTO comments_testimonials 
     (deal_id, type, author_name, author_email, content, rating) 
     VALUES (?, 'review', ?, ?, ?, ?)`,
    [dealId, data.author_name, data.author_email, data.content, data.rating || null]
  );

  return { id: (result as any).insertId };
};