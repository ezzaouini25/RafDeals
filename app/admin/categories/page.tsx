'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  FileText,
  Gift,
  ArrowUpDown,
  Layers,
  Flame,
} from 'lucide-react';

// ============================================================
// TOAST
// ============================================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500/10 border-green-500/20 text-green-600',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
  };

  const icons = {
    success: <CheckCircle2 size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-rose-500" />,
    info: <AlertCircle size={20} className="text-blue-500" />,
  };

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-sm p-4 border ${colors[type]} flex items-start gap-3 shadow-lg`}>
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
        <X size={16} />
      </button>
    </div>
  );
}

// ============================================================
// FORMAT TIME AGO
// ============================================================
function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
}

// ============================================================
// CATEGORY TYPE LABELS + COLORS + ICONS
// ============================================================
const typeLabels: Record<string, string> = {
  offers: 'Offers',
  articles: 'Articles',
  deals: 'Deals',
  both: 'Both',
};

const typeColors: Record<string, string> = {
  offers: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  articles: 'bg-green-500/10 text-green-600 border-green-500/20',
  deals: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  both: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const typeIcons: Record<string, any> = {
  offers: Gift,
  articles: FileText,
  deals: Flame,
  both: Layers,
};

// ============================================================
// MAIN PAGE
// ============================================================
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'offers',
    is_active: true,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/categories?search=${search}&page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&type=${typeFilter}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('Failed to fetch categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search, page, sortBy, sortOrder, typeFilter]);

  const resetForm = () => {
    setFormData({ name: '', slug: '', type: 'offers', is_active: true });
    setFormError(null);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      type: category.type,
      is_active: category.is_active === 1,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError(null);

    try {
      const url = modalMode === 'edit' && selectedCategory
        ? `/api/admin/categories?id=${selectedCategory.id}`
        : '/api/admin/categories';

      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save category');

      setModalOpen(false);
      fetchCategories();

      showToast(
        `Category "${formData.name}" ${modalMode === 'add' ? 'created' : 'updated'} successfully!`,
        'success'
      );
    } catch (error: any) {
      setFormError(error.message);
      showToast(error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteTarget(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${deleteTarget}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      fetchCategories();
      const deletedCategory = categories.find(c => c.id === deleteTarget);
      showToast(`Category "${deletedCategory?.name}" deleted successfully!`, 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (id: number, currentStatus: number) => {
    try {
      const category = categories.find(c => c.id === id);
      if (!category) return;

      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.name,
          slug: category.slug,
          type: category.type,
          is_active: newStatus === 1,
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      fetchCategories();
      showToast(`Category "${category.name}" ${newStatus === 1 ? 'activated' : 'deactivated'}!`, 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const getStatusBadge = (is_active: number) => {
    if (is_active === 1) return { label: 'Active', className: 'bg-green-500/10 text-green-500 border-green-500/20' };
    return { label: 'Inactive', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  };

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

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-slate-400" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const getTotalUsage = (category: any) => {
    return (category.offer_count || 0) + (category.article_count || 0) + (category.deal_count || 0);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag size={24} className="text-yellow" />
            Categories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Total: <span className="font-bold text-slate-900">{total}</span> categories
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Category
          </button>
          <button
            onClick={fetchCategories}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-900 text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
          >
            <option value="all">All Types</option>
            <option value="offers">Offers</option>
            <option value="articles">Articles</option>
            <option value="deals">Deals</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Tag size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600">No categories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-slate-700">
                      Name {getSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <button onClick={() => toggleSort('type')} className="flex items-center gap-1 hover:text-slate-700">
                      Type {getSortIcon('type')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <button onClick={() => toggleSort('total_usage')} className="flex items-center gap-1 hover:text-slate-700">
                      Used In {getSortIcon('total_usage')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                    <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-slate-700">
                      Created {getSortIcon('created_at')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((category) => {
                  const status = getStatusBadge(category.is_active);
                  const typeLabel = typeLabels[category.type] || category.type;
                  const typeColor = typeColors[category.type] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
                  const TypeIcon = typeIcons[category.type] || Tag;
                  const totalUsage = getTotalUsage(category);

                  return (
                    <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{category.name}</p>
                          <p className="text-xs text-slate-400 sm:hidden">/{category.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <code className="text-xs text-slate-500 bg-slate-100 px-2 py-1">/{category.slug}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <TypeIcon size={14} className="text-slate-400" />
                          <span className={`text-[10px] font-bold uppercase border px-2 py-1 ${typeColor}`}>
                            {typeLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 text-xs" title="Offers">
                            <Gift size={12} className="text-blue-400" />
                            <span className="font-medium">{category.offer_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs" title="Articles">
                            <FileText size={12} className="text-green-400" />
                            <span className="font-medium">{category.article_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs" title="Deals">
                            <Flame size={12} className="text-orange-400" />
                            <span className="font-medium">{category.deal_count || 0}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium ml-1">
                            ({totalUsage} total)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock size={12} />
                          {formatTimeAgo(category.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(category.id, category.is_active)}
                          className={`text-[10px] font-bold uppercase border px-2 py-1 transition-colors ${status.className}`}
                        >
                          {status.label}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleActive(category.id, category.is_active)}
                            className={`p-2 transition-colors ${
                              category.is_active === 1
                                ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                                : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            {category.is_active === 1 ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500 order-2 sm:order-1">
            Showing {categories.length} of {total} categories
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronsLeft size={16} />
            </button>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
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
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">
                  {modalMode === 'add' ? 'Add New Category' : 'Edit Category'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: modalMode === 'add' ? generateSlug(name) : formData.slug,
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-900 text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Slug *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-900 text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                      placeholder="e.g., make-money-online"
                    />
                    {modalMode === 'add' && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, slug: generateSlug(formData.name) })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow hover:text-amber-300 font-medium"
                      >
                        Generate
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">URL-friendly name (e.g., make-money-online)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-900 text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  >
                    <option value="offers">Offers</option>
                    <option value="articles">Articles</option>
                    <option value="deals">Deals</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-yellow"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-700 cursor-pointer">
                    Active (visible on site)
                  </label>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {actionLoading ? 'Saving...' : modalMode === 'add' ? 'Add Category' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[60]" onClick={() => setDeleteModalOpen(false)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 max-w-md w-full shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Category</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Are you sure you want to delete this category? This action cannot be undone.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={actionLoading}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {actionLoading ? 'Deleting...' : 'Delete'}
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