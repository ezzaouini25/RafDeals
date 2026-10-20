import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Get popular offer types
    const [offerTypes] = await pool.execute(
      `SELECT type, COUNT(*) as count 
       FROM offers 
       WHERE is_active = 1 AND type IS NOT NULL 
       GROUP BY type 
       ORDER BY count DESC 
       LIMIT 3`
    );

    // Get popular article categories
    const [articleCategories] = await pool.execute(
      `SELECT category, COUNT(*) as count 
       FROM articles 
       WHERE is_active = 1 AND category IS NOT NULL 
       GROUP BY category 
       ORDER BY count DESC 
       LIMIT 3`
    );

    // Get popular search terms from page_views
    const [popularSearches] = await pool.execute(
      `SELECT 
         CASE 
           WHEN page_path LIKE '%offers%' THEN 'offer'
           WHEN page_path LIKE '%blog%' THEN 'article'
           ELSE 'general'
         END as type,
         SUBSTRING_INDEX(SUBSTRING_INDEX(page_path, '/', -1), '?', 1) as term,
         COUNT(*) as views
       FROM page_views 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
         AND page_path NOT LIKE '%admin%'
         AND page_path != '/'
       GROUP BY type, term
       ORDER BY views DESC
       LIMIT 6`
    );

    const searches: any[] = [];

    // Add offer types
    (offerTypes as any[]).forEach((item: any) => {
      const label = item.type.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      searches.push({
        term: item.type,
        label: `${label} Offers`,
        type: 'offer'
      });
    });

    // Add article categories
    (articleCategories as any[]).forEach((item: any) => {
      const label = item.category.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      searches.push({
        term: item.category,
        label: `${label} Guides`,
        type: 'article'
      });
    });

    // Add popular searches
    (popularSearches as any[]).forEach((item: any) => {
      if (item.term && item.term.length > 2) {
        searches.push({
          term: item.term,
          label: item.term.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          type: item.type || 'general'
        });
      }
    });

    // Remove duplicates and limit
    const unique = searches.filter((item, index, self) => 
      index === self.findIndex((t) => t.term === item.term)
    );

    return NextResponse.json({ 
      searches: unique.slice(0, 10),
      total: unique.length
    });

  } catch (error) {
    console.error('Error fetching popular searches:', error);
    // Return fallback static data
    return NextResponse.json({
      searches: [
        { term: 'Freecash', label: 'Freecash Review', type: 'offer' },
        { term: 'scams', label: 'Avoid Online Scams', type: 'article' },
        { term: 'surveys', label: 'Paid Surveys', type: 'offer' },
        { term: 'passive', label: 'Passive Income', type: 'article' },
        { term: 'testing', label: 'Website Testing', type: 'offer' },
        { term: 'side hustles', label: 'Side Hustles Guide', type: 'article' },
      ]
    });
  }
}