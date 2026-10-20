import { Offer, Article, FAQ, LegalPage } from '@/types';
import { isDbConfigured, getMysqlPool } from '@/lib/mysql';

// Persistent contact messages inside our mock database (in memory)
let persistentContactMessages: any[] = [];
let persistentCookieConsents: any[] = [];
let persistentTestimonials: any[] = [];
let persistentComments: any[] = [
  { id: 1, article_slug: 'avoid-online-scams-guide', author: 'Liam S.', content: 'This guide saved me from a sketchy "data entry" gig yesterday! Thank you so much for outlining these red flags.', created_at: '2026-07-16T12:00:00Z' },
  { id: 2, article_slug: 'avoid-online-scams-guide', author: 'Sophia K.', content: 'Great tips about the upfront payment scam. I encountered one that asked for $50 for a training manual. Avoided it completely.', created_at: '2026-07-17T09:30:00Z' },
  { id: 3, article_slug: 'avoid-online-scams-guide', author: 'David M.', content: 'Are there any other platforms besides the ones on this site that you have verified?', created_at: '2026-07-17T14:15:00Z' },
  { id: 4, article_slug: 'avoid-online-scams-guide', author: 'Emma G.', content: 'Yes, David, their Freecash recommendations are incredible, highly recommend trying that one out.', created_at: '2026-07-17T15:00:00Z' }
];

export const pool = {
  async execute(query: string, params: any[] = []): Promise<[any[], any]> {
    // ONLY USE REAL DATABASE
    if (!isDbConfigured()) {
      throw new Error('MySQL Database is not configured. Please define DB_HOST, DB_USER, and DB_NAME in your environment.');
    }

    try {
      const mysqlPool = getMysqlPool();
      const [rows, fields] = await mysqlPool.execute(query, params);
      return [rows as any[], fields];
    } catch (error) {
      console.error('MySQL query failed:', error);
      throw error;
    }
  }
};

export default pool;