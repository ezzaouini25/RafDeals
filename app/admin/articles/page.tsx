'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  StarOff,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Users,
  FolderOpen,
  Eye as EyeIcon,
} from 'lucide-react';

// ============================================================
// TOAST COMPONENT
// ============================================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  };

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-rose-500" />,
    info: <AlertCircle size={20} className="text-blue-500" />,
  };

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-sm p-4 border ${colors[type]} flex items-start gap-3 shadow-lg animate-in slide-in-from-top-5 duration-300`}>
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}

// ============================================================
// VIEWS EDIT MODAL
// ============================================================
function ViewsEditModal({
  article,
  isOpen,
  onClose,
  onSave,
  loading,
}: {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, views: number) => void;
  loading: boolean;
}) {
  const [views, setViews] = useState<string>('');

  useEffect(() => {
    if (article) {
      setViews(String(article.views_raw || 0));
    }
  }, [article]);

  if (!isOpen || !article) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Views</h3>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-white/60 mb-4 truncate">
              Article: <span className="font-medium text-white">{article.title}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1.5">
                View Count
              </label>
              <input
                type="number"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                placeholder="Enter view count"
                min="0"
              />
              <p className="text-xs text-slate-400 mt-1">Current: {article.views_formatted || '0'} views</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const numViews = parseInt(views);
                  if (!isNaN(numViews) && numViews >= 0) {
                    onSave(article.id, numViews);
                  }
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-bold bg-yellow text-slate-950 hover:bg-yellow/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {loading ? 'Saving...' : 'Save Views'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// INTERFACES
// ============================================================
interface Article {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  cover_image: string | null;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  author_id: number | null;
  author_name: string | null;
  author_picture: string | null;
  read_time: number;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  is_active: boolean | number;
  is_boosted: boolean | number;
  views: number;
  views_formatted: string;
  views_raw: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  type: 'offers' | 'articles' | 'both';
}

interface Author {
  id: number;
  name: string;
}

// ============================================================
// SORT CONFIG
// ============================================================
type SortField = 'title' | 'category_name' | 'author_name' | 'read_time' | 'views_raw' | 'created_at';
type SortOrder = 'asc' | 'desc';

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ArticlesPage() {
  // ============================================================
  // STATE
  // ============================================================
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter options
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [filterLoading, setFilterLoading] = useState(true);

  // Views edit modal
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [viewsTarget, setViewsTarget] = useState<Article | null>(null);
  const [viewsSaving, setViewsSaving] = useState(false);

  const limit = 10;

  // ============================================================
  // TOAST
  // ============================================================
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // ============================================================
  // FETCH FILTER OPTIONS (categories & authors)
  // ============================================================
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setFilterLoading(true);

        // ============================================================
        // FETCH ALL CATEGORIES (same as authors approach)
        // ============================================================
        const catRes = await fetch('/api/admin/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          // ✅ FILTER: Only show categories with type 'articles' or 'both'
          const filteredCategories = (catData.categories || []).filter(
            (cat: Category) => cat.type === 'articles' || cat.type === 'both'
          );
          setAllCategories(filteredCategories);
          console.log('✅ Categories loaded:', filteredCategories.length);
        } else {
          console.error('Failed to fetch categories:', await catRes.text());
        }

        // ============================================================
        // FETCH AUTHORS (already working)
        // ============================================================
        const authRes = await fetch('/api/admin/authors');
        if (authRes.ok) {
          const authData = await authRes.json();
          setAuthors(authData.authors || []);
          console.log('✅ Authors loaded:', (authData.authors || []).length);
        } else {
          console.error('Failed to fetch authors:', await authRes.text());
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setFilterLoading(false);
      }
    };
    fetchFilterOptions();
  }, []);

  // ============================================================
  // FETCH ARTICLES
  // ============================================================
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (selectedCategory !== 'all') params.set('category_id', selectedCategory);
      if (selectedAuthor !== 'all') params.set('author_id', selectedAuthor);
      params.set('sort', sortField);
      params.set('order', sortOrder);

      const res = await fetch(`/api/admin/articles?${params.toString()}`, { cache: 'no-store' });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch articles');
      }

      const data = await res.json();

      setArticles(data.articles || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
      showToast(err.message || 'Failed to fetch articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on page, search, filters, sort change
  useEffect(() => {
    fetchArticles();
  }, [page, search, selectedCategory, selectedAuthor, sortField, sortOrder]);

  // ============================================================
  // HANDLE SORT
  // ============================================================
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="opacity-40" />;
    }
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  // ============================================================
  // TOGGLE PUBLISH
  // ============================================================
  const togglePublish = async (article: Article) => {
    setTogglingId(article.id);
    try {
      const currentStatus = article.is_active === 1 || article.is_active === true;
      const newStatus = currentStatus ? 0 : 1;

      const formData = new FormData();
      formData.append('id', String(article.id));
      formData.append('is_active', String(newStatus));

      const res = await fetch('/api/admin/articles', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle publish status');
      }

      showToast(`Article ${newStatus === 1 ? 'published' : 'unpublished'} successfully!`, 'success');
      await fetchArticles();
    } catch (err: any) {
      showToast(err.message || 'Error toggling publish status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // ============================================================
  // TOGGLE BOOST
  // ============================================================
  const toggleBoost = async (article: Article) => {
    setTogglingId(article.id);
    try {
      const currentStatus = article.is_boosted === 1 || article.is_boosted === true;
      const newStatus = currentStatus ? 0 : 1;

      const formData = new FormData();
      formData.append('id', String(article.id));
      formData.append('is_boosted', String(newStatus));

      const res = await fetch('/api/admin/articles', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle boost status');
      }

      showToast(`Article ${newStatus === 1 ? 'featured' : 'unfeatured'} successfully!`, 'success');
      await fetchArticles();
    } catch (err: any) {
      showToast(err.message || 'Error toggling boost status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // ============================================================
  // UPDATE VIEWS
  // ============================================================
  const handleUpdateViews = async (id: number, views: number) => {
    setViewsSaving(true);
    try {
      const formData = new FormData();
      formData.append('id', String(id));
      formData.append('views', String(views));

      const res = await fetch('/api/admin/articles', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update views');
      }

      showToast(`Views updated to ${views} successfully!`, 'success');
      setViewsModalOpen(false);
      setViewsTarget(null);
      await fetchArticles();
    } catch (err: any) {
      showToast(err.message || 'Error updating views', 'error');
    } finally {
      setViewsSaving(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================
  const handleDelete = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete');
      }
      showToast('Article deleted successfully!', 'success');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchArticles();
    } catch (err: any) {
      showToast(err.message || 'Error deleting article', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // PAGINATION HELPERS
  // ============================================================
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > maxVisible) {
      const half = Math.floor(maxVisible / 2);
      if (page <= half + 1) {
        startPage = 1;
        endPage = maxVisible;
      } else if (page >= totalPages - half) {
        startPage = totalPages - maxVisible + 1;
        endPage = totalPages;
      } else {
        startPage = page - half;
        endPage = page + half;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ============================================================
  // SORTABLE TABLE HEADER CELL
  // ============================================================
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hover:text-slate-700 dark:hover:text-white transition-colors"
    >
      {children}
      {getSortIcon(field)}
    </button>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Views Edit Modal */}
      <ViewsEditModal
        article={viewsTarget}
        isOpen={viewsModalOpen}
        onClose={() => {
          setViewsModalOpen(false);
          setViewsTarget(null);
        }}
        onSave={handleUpdateViews}
        loading={viewsSaving}
      />

      {/* ============================================================
          HEADER
          ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText size={24} className="text-yellow" />
            Articles
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Total: <span className="font-bold text-white dark:text-white">{totalItems}</span> articles
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-2 px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-yellow/90 transition-colors"
          >
            <Plus size={16} />
            New Article
          </Link>
          <button
            onClick={fetchArticles}
            className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ============================================================
          FILTERS BAR
          ============================================================ */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter - USING SAME APPROACH AS AUTHORS */}
        <div className="relative min-w-[160px] w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 pr-10 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors appearance-none"
          >
            <option value="all">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name} {cat.type === 'both' && <span className="text-xs text-slate-400"></span>}
              </option>
            ))}
          </select>
          <FolderOpen size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Author Filter - WORKING */}
        <div className="relative min-w-[160px] w-full sm:w-auto">
          <select
            value={selectedAuthor}
            onChange={(e) => {
              setSelectedAuthor(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 pr-10 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors appearance-none"
          >
            <option value="all">All Authors</option>
            {authors.map((author) => (
              <option key={author.id} value={String(author.id)}>
                {author.name}
              </option>
            ))}
          </select>
          <Users size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Clear Filters */}
        {(selectedCategory !== 'all' || selectedAuthor !== 'all' || search) && (
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedAuthor('all');
              setSearch('');
              setPage(1);
            }}
            className="px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ============================================================
          TABLE - Same as before
          ============================================================ */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <FileText size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">
              {search || selectedCategory !== 'all' || selectedAuthor !== 'all'
                ? 'No articles found matching your filters'
                : 'No articles yet'}
            </p>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
              {search || selectedCategory !== 'all' || selectedAuthor !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first article to get started'}
            </p>
            {!search && selectedCategory === 'all' && selectedAuthor === 'all' && (
              <Link
                href="/admin/articles/new"
                className="mt-4 px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-yellow/90 transition-colors"
              >
                Create Article
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <th className="px-4 py-3 text-left">
                  <SortableHeader field="title">Title</SortableHeader>
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <SortableHeader field="category_name">Category</SortableHeader>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <SortableHeader field="author_name">Author</SortableHeader>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <SortableHeader field="read_time">Read Time</SortableHeader>
                </th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">
                  <SortableHeader field="views_raw">Views</SortableHeader>
                </th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">
                  <SortableHeader field="created_at">Created</SortableHeader>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {article.cover_image && (
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          className="w-12 h-12 object-cover border border-slate-200 dark:border-white/10"
                        />
                      )}
                      <div>
                        <Link
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          className="font-medium text-slate-900 dark:text-white truncate max-w-[200px] block hover:text-yellow hover:underline transition-colors cursor-pointer"
                        >
                          {article.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium border ${
                            article.is_active === 1 || article.is_active === true
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          }`}>
                            {article.is_active === 1 || article.is_active === true ? 'Published' : 'Draft'}
                          </span>
                          {article.is_boosted === 1 || article.is_boosted === true ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-yellow uppercase tracking-wider border border-yellow/30 bg-yellow/10">
                              <Sparkles size={10} />
                              Featured
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-slate-500 dark:text-white/40">
                      {article.category_name || 'Uncategorized'}
                    </span>
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-500 dark:text-white/40">
                      {article.author_name || 'Unknown'}
                    </span>
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-500 dark:text-white/40">
                      {article.read_time || '—'} min
                    </span>
                  </td>

                  <td className="px-4 py-3 hidden xl:table-cell">
                    <button
                      onClick={() => {
                        setViewsTarget(article);
                        setViewsModalOpen(true);
                      }}
                      className="text-xs text-slate-500 dark:text-white/40 font-medium hover:text-yellow hover:underline transition-colors flex items-center gap-1"
                      title="Click to edit views"
                    >
                      <EyeIcon size={12} />
                      {article.views_formatted || '0'}
                    </button>
                  </td>

                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs text-slate-400 dark:text-white/30">
                      {formatDate(article.created_at)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => togglePublish(article)}
                        disabled={togglingId === article.id}
                        className={`p-2 transition-colors ${
                          article.is_active === 1 || article.is_active === true
                            ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                        title={article.is_active === 1 || article.is_active === true ? 'Unpublish' : 'Publish'}
                      >
                        {article.is_active === 1 || article.is_active === true ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>

                      <button
                        onClick={() => toggleBoost(article)}
                        disabled={togglingId === article.id}
                        className={`p-2 transition-colors ${
                          article.is_boosted === 1 || article.is_boosted === true
                            ? 'text-yellow hover:text-yellow/80 hover:bg-yellow/10'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                        title={article.is_boosted === 1 || article.is_boosted === true ? 'Remove Featured' : 'Make Featured'}
                      >
                        {article.is_boosted === 1 || article.is_boosted === true ? (
                          <Sparkles size={16} />
                        ) : (
                          <StarOff size={16} />
                        )}
                      </button>

                      <Link
                        href={`/admin/articles/edit/${article.id}`}
                        className="p-2 text-slate-500 hover:text-yellow hover:bg-yellow/10 transition-colors"
                        title="Edit article"
                      >
                        <Edit size={16} />
                      </Link>

                      <button
                        onClick={() => {
                          setDeleteTarget(article.id);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete article"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ============================================================
          PAGINATION
          ============================================================ */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-4">
          <p className="text-xs text-slate-500 dark:text-white/30 order-2 sm:order-1">
            Showing {articles.length} of {totalItems} articles
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-[32px] h-8 px-2 text-xs font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-yellow text-slate-950'
                      : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              {totalPages > 5 && page < totalPages - 2 && (
                <span className="px-1 text-slate-500 dark:text-white/30">...</span>
              )}
              {totalPages > 5 && page < totalPages - 2 && (
                <button
                  onClick={() => setPage(totalPages)}
                  className={`min-w-[32px] h-8 px-2 text-xs font-medium transition-colors ${
                    page === totalPages
                      ? 'bg-yellow text-slate-950'
                      : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {totalPages}
                </button>
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          DELETE MODAL
          ============================================================ */}
      {deleteModalOpen && deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setDeleteModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Article</h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Are you sure you want to delete this article? This action cannot be undone.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteTarget)}
                    disabled={actionLoading}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {actionLoading ? 'Deleting...' : 'Delete Article'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}