import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format number with K, M abbreviations
 * 1000 → 1K
 * 1,000,000 → 1M
 * 1,500,000 → 1.5M
 * 2,500 → 2.5K
 */
export function formatNumberAbbreviated(num: number): string {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1_000_000) {
    const value = (absNum / 1_000_000);
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
    return sign + formatted + 'M';
  }
  
  if (absNum >= 1_000) {
    const value = (absNum / 1_000);
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
    return sign + formatted + 'K';
  }
  
  return sign + absNum.toString();
}

// ============================================================
// CATEGORY LABEL HELPER
// ============================================================

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'get-paid-to': 'Get Paid To',
    'no-skills': 'No Skills Required',
    'side-hustles': 'Side Hustles',
    'scam-or-legit': 'Scam or Legit',
    'passive-income': 'Passive Income',
    'freelancing': 'Freelancing',
    'surveys': 'Surveys',
    'reviews': 'Reviews',
  };
  return labels[category] || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================
// CATEGORY COLOR HELPER
// ============================================================

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'get-paid-to': 'bg-yellow/20 text-navy border-yellow/30',
    'no-skills': 'bg-blue-100 text-blue-700 border-blue-200',
    'side-hustles': 'bg-purple-100 text-purple-700 border-purple-200',
    'scam-or-legit': 'bg-red-100 text-red-700 border-red-200',
    'passive-income': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'freelancing': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'surveys': 'bg-amber-100 text-amber-700 border-amber-200',
    'reviews': 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
}