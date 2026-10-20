// ============================================================
// ARTICLE TYPE
// ============================================================

export interface Article {
  id: number;
  author_id: number | null;
  author_name: string | null;
  author_picture: string | null;
  author_bio: string | null;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  cover_image: string | null;
  category_id: number | null;
  category: Category | null;
  category_name?: string | null;
  category_slug?: string | null;
  rating?: number | null;
  read_time: number | null;
  meta_keywords: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  is_boosted: boolean | number;
  views: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// OFFER TYPE
// ============================================================

export interface Offer {
  id: number;
  author_id: number | null;
  author_name: string | null;
  author_picture: string | null;
  author_bio: string | null;
  title: string;
  slug: string;
  content: string | null;
  brand_name?: string; // ✅ Make sure this is here
  pay_name: string;
  cover_image: string | null;
  meta_keywords: string | null;
  offer_link: string;
  category_id: number | null;
  category: Category | null;
  category_name?: string | null;
  category_slug?: string | null;
  type?: string | null;
  description?: string | null;
  payout_amount: string | null;
  rating: number | null;
  is_active: boolean;
  is_boosted: boolean | number;
  views: number;
  clicks: number;
  country?: string;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  withdraw_method: string | null;
  verified_date?: string | null;
}

// ============================================================
// DEAL TYPE (Similar to Offer)
// ============================================================

export interface Deal {
  id: number;
  author_id: number | null;
  author_name: string | null;
  author_picture: string | null;
  author_bio: string | null;
  title: string;
  slug: string;
  content: string | null;
  brand_name?: string; // ✅ Make sure this is here
  pay_name: string;
  cover_image: string | null;
  meta_keywords: string | null;
  offer_link: string; // Used as the destination link for the deal
  category_id: number | null;
  category: Category | null;
  category_name?: string | null;
  category_slug?: string | null;
  type?: string | null;
  description?: string | null;
  payout_amount: string | null;
  rating: number | null;
  is_active: boolean;
  is_boosted: boolean | number;
  views: number;
  clicks: number;
  country?: string;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  withdraw_method: string | null;
  verified_date?: string | null;
}

// ============================================================
// AUTHOR TYPE
// ============================================================

export interface Author {
  id: number;
  name: string;
  picture: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// FAQ TYPE
// ============================================================

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

// ============================================================
// LEGAL PAGE TYPE
// ============================================================

export interface LegalPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string | null;
  meta_description: string | null;
  updated_at: string;
}

// ============================================================
// COMMENT TYPE
// ============================================================

export interface Comment {
  id: number;
  user_id: number | null;
  article_id: number | null;
  offer_id: number | null;
  deal_id?: number | null; // ✅ Added deal_id for deal reviews
  type: 'comment' | 'testimonial' | 'review';
  author_name: string;
  author_email: string;
  content: string;
  rating: number | null;
  ip_address: string;
  device_fingerprint: string;
  is_approved: boolean;
  created_at: string;
}

// ============================================================
// SUBSCRIPTION TYPE
// ============================================================

export interface Subscription {
  id: number;
  email: string;
  ip_address: string;
  device_fingerprint: string;
  created_at: string;
}

// ============================================================
// SUBSCRIPTION LOG TYPE
// ============================================================

export interface SubscriptionLog {
  id: number;
  ip_address: string;
  device_fingerprint: string;
  email: string;
  created_at: string;
}

// ============================================================
// HOMEPAGE COUNTERS TYPE
// ============================================================

export interface HomepageCounters {
  id: number;
  total_offers: number;
  total_deals?: number;
  total_clicks?: number;
  completed_offers: number;
  payouts_completed: number;
  is_live: boolean;
  updated_at: string;
}

// ============================================================
// USER TYPES
// ============================================================

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor' | 'user';
  is_active: boolean;
  is_blocked: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserFormData {
  username: string;
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'editor' | 'user';
  is_active: boolean;
  is_blocked: boolean;
}

// ============================================================
// CATEGORY TYPE
// ============================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  type: 'offers' | 'articles' | 'both' | 'deals'; // ✅ Added 'deals'
  is_active: boolean;
  created_at: string;
  updated_at: string;
}