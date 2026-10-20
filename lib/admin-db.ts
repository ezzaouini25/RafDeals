import { isDbConfigured, getMysqlPool } from '@/lib/mysql';

export interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor' | 'user';
  is_active: boolean | number;
  is_blocked: boolean | number;
  created_at: string;
}

// Get user by identifier (username or email) - WITHOUT status filter
export async function dbGetUserByIdentifier(identifier: string): Promise<AdminUser | null> {
  if (!isDbConfigured()) {
    console.error('Database not configured');
    return null;
  }
  
  try {
    const mysqlPool = getMysqlPool();
    // Get user regardless of status - we'll check status in the login route
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM users WHERE (username = ? OR email = ?) LIMIT 1',
      [identifier, identifier]
    );
    
    const users = rows as any[];
    if (users.length === 0) return null;
    return users[0] as AdminUser;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Get only active users (for admin lists)
export async function dbGetActiveUsers(): Promise<AdminUser[]> {
  if (!isDbConfigured()) {
    return [];
  }
  
  try {
    const mysqlPool = getMysqlPool();
    const [rows] = await mysqlPool.execute(
      'SELECT id, name, username, email, role, is_active, is_blocked, created_at FROM users WHERE is_active = 1 AND is_blocked = 0 ORDER BY created_at DESC'
    );
    return rows as AdminUser[];
  } catch (error) {
    console.error('Error fetching active users:', error);
    return [];
  }
}

// ============================================================
// USERS (full list for admin dashboard)
// ============================================================

export async function dbGetUsers(): Promise<AdminUser[]> {
  if (!isDbConfigured()) return [];
  try {
    const mysqlPool = getMysqlPool();
    const [rows] = await mysqlPool.execute(
      'SELECT id, name, username, email, role, is_active, is_blocked, created_at FROM users ORDER BY created_at DESC'
    );
    return rows as AdminUser[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// ============================================================
// ARTICLES (full list for stats)
// ============================================================

export async function dbGetArticles(): Promise<any[]> {
  if (!isDbConfigured()) return [];
  try {
    const mysqlPool = getMysqlPool();
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM articles ORDER BY created_at DESC'
    );
    return rows as any[];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

// ============================================================
// OFFERS (full list for stats)
// ============================================================

export async function dbGetOffers(): Promise<any[]> {
  if (!isDbConfigured()) return [];
  try {
    const mysqlPool = getMysqlPool();
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM offers ORDER BY created_at DESC'
    );
    return rows as any[];
  } catch (error) {
    console.error('Error fetching offers:', error);
    return [];
  }
}

// ============================================================
// COMMENTS + TESTIMONIALS + REVIEWS (all types, for admin
// reviews page and stats page)
// ============================================================

export async function dbGetCommentsTestimonials(type?: string): Promise<any[]> {
  if (!isDbConfigured()) return [];
  try {
    const mysqlPool = getMysqlPool();
    if (type) {
      const [rows] = await mysqlPool.execute(
        `SELECT * FROM comments_testimonials WHERE type = ? ORDER BY created_at DESC`,
        [type]
      );
      return rows as any[];
    }
    const [rows] = await mysqlPool.execute(
      `SELECT * FROM comments_testimonials ORDER BY created_at DESC`
    );
    return rows as any[];
  } catch (error) {
    console.error('Error fetching comments/testimonials:', error);
    return [];
  }
}

// ============================================================
// CONTACT MESSAGES
// (verify table name — I used contact_messages)
// ============================================================

export async function dbGetContactMessages(): Promise<any[]> {
  if (!isDbConfigured()) return [];
  try {
    const mysqlPool = getMysqlPool();
    const [rows] = await mysqlPool.execute(
      `SELECT * FROM contact_messages ORDER BY created_at DESC`
    );
    return rows as any[];
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return [];
  }
}

// ============================================================
// HOMEPAGE COUNTERS
// ============================================================

export async function dbGetCounters(): Promise<any | null> {
  if (!isDbConfigured()) return null;
  try {
    const mysqlPool = getMysqlPool();
    const [rows] = await mysqlPool.execute(
      `SELECT * FROM homepage_counters WHERE is_live = 1 LIMIT 1`
    );
    const counters = (rows as any[])[0];
    return counters || null;
  } catch (error) {
    console.error('Error fetching homepage counters:', error);
    return null;
  }
}

// ============================================================
// ADS (verify table name — I used ads)
// ============================================================

export async function dbGetAds(): Promise<any[]> {
  if (!isDbConfigured()) return [];
  try {
    const mysqlPool = getMysqlPool();
    const [rows] = await mysqlPool.execute(
      `SELECT * FROM ads ORDER BY created_at DESC`
    );
    return rows as any[];
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
}

export async function dbCreateAd(data: Record<string, any>): Promise<{ id: number } | null> {
  if (!isDbConfigured()) return null;
  try {
    const mysqlPool = getMysqlPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => data[k]);
    const [result] = await mysqlPool.execute(
      `INSERT INTO ads (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    return { id: (result as any).insertId };
  } catch (error) {
    console.error('Error creating ad:', error);
    return null;
  }
}

export async function dbUpdateAd(id: number, data: Record<string, any>): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const mysqlPool = getMysqlPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return false;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...keys.map((k) => data[k]), id];
    await mysqlPool.execute(
      `UPDATE ads SET ${setClause} WHERE id = ?`,
      values
    );
    return true;
  } catch (error) {
    console.error('Error updating ad:', error);
    return false;
  }
}

export async function dbDeleteAd(id: number): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const mysqlPool = getMysqlPool();
    await mysqlPool.execute('DELETE FROM ads WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting ad:', error);
    return false;
  }
}

// ============================================================
// REVIEWS — approve / edit
// ============================================================

export async function dbUpdateCommentStatus(
  id: number,
  isApproved: boolean
): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const mysqlPool = getMysqlPool();
    await mysqlPool.execute(
      'UPDATE comments_testimonials SET is_approved = ? WHERE id = ?',
      [isApproved ? 1 : 0, id]
    );
    return true;
  } catch (error) {
    console.error('Error updating comment status:', error);
    return false;
  }
}

export async function dbEditCommentTestimonial(
  id: number,
  data: Record<string, any>
): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const mysqlPool = getMysqlPool();
    const keys = Object.keys(data);
    if (keys.length === 0) return false;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...keys.map((k) => data[k]), id];
    await mysqlPool.execute(
      `UPDATE comments_testimonials SET ${setClause} WHERE id = ?`,
      values
    );
    return true;
  } catch (error) {
    console.error('Error editing comment/testimonial:', error);
    return false;
  }
}