'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone,
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
  Save,
} from 'lucide-react';

// Toast Component
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

interface Sponsor {
  id: number;
  name: string;
  size: string;
  code: string;
  is_active: boolean | number;
  is_boosted: boolean | number;
  created_at: string;
  updated_at: string;
}

// ✅ UNIQUE SIZES ONLY - Algorithm handles placement
const BANNER_SIZES = [
  { value: '300x250', label: '300x250 - Home Mobile' },
  { value: '728x90', label: '728x90 - Leaderboard' },
  { value: '970x250', label: '970x250 - Billboard' },
  { value: '320x100', label: '320x100 - Large Mobile Banner' },
  { value: '970x90', label: '970x90 - Super Leaderboard' },
  { value: '200x300', label: '200x300 - Small Rectangle' },
  { value: '240x400', label: '240x400 - Medium Rectangle' },
  { value: '350x600', label: '350x600 - Large Skyscraper' },
  { value: 'popup', label: 'Popup - Full Screen' },
];

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    size: '728x90',
    code: '',
    is_active: true,
    is_boosted: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const limit = 10;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchSponsors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/sponsors?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch sponsors');
      }
      const data = await res.json();
      setSponsors(data.sponsors || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
      showToast(err.message || 'Failed to fetch sponsors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, [page, search]);

  // ✅ Toggle Active Status
  const toggleActive = async (sponsor: Sponsor) => {
    setTogglingId(sponsor.id);
    try {
      const newStatus = sponsor.is_active === 1 || sponsor.is_active === true ? 0 : 1;
      
      const res = await fetch('/api/admin/sponsors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sponsor.id,
          name: sponsor.name,
          size: sponsor.size,
          code: sponsor.code,
          is_active: newStatus === 1,
          is_boosted: sponsor.is_boosted === 1 || sponsor.is_boosted === true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle active status');
      }

      showToast(
        `Sponsor ${newStatus === 1 ? 'activated' : 'deactivated'} successfully!`,
        'success'
      );
      await fetchSponsors();
    } catch (err: any) {
      showToast(err.message || 'Error toggling active status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // ✅ Toggle Boost Status
  const toggleBoost = async (sponsor: Sponsor) => {
    setTogglingId(sponsor.id);
    try {
      const newStatus = sponsor.is_boosted === 1 || sponsor.is_boosted === true ? 0 : 1;
      
      const res = await fetch('/api/admin/sponsors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sponsor.id,
          name: sponsor.name,
          size: sponsor.size,
          code: sponsor.code,
          is_active: sponsor.is_active === 1 || sponsor.is_active === true,
          is_boosted: newStatus === 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle boost status');
      }

      showToast(
        `Sponsor ${newStatus === 1 ? 'featured' : 'unfeatured'} successfully!`,
        'success'
      );
      await fetchSponsors();
    } catch (err: any) {
      showToast(err.message || 'Error toggling boost status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete');
      }
      showToast('Sponsor deleted successfully!', 'success');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchSponsors();
    } catch (err: any) {
      showToast(err.message || 'Error deleting sponsor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Open Add Modal
  const openAddModal = () => {
    setFormData({
      id: '',
      name: '',
      size: '728x90',
      code: '',
      is_active: true,
      is_boosted: false,
    });
    setModalMode('add');
    setSelectedSponsor(null);
    setFormError(null);
    setModalOpen(true);
  };

  // ✅ Open Edit Modal
  const openEditModal = (sponsor: Sponsor) => {
    setModalMode('edit');
    setSelectedSponsor(sponsor);
    setFormData({
      id: String(sponsor.id),
      name: sponsor.name,
      size: sponsor.size,
      code: sponsor.code,
      is_active: sponsor.is_active === 1 || sponsor.is_active === true,
      is_boosted: sponsor.is_boosted === 1 || sponsor.is_boosted === true,
    });
    setFormError(null);
    setModalOpen(true);
  };

  // ✅ Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (!formData.name || !formData.size || !formData.code) {
      setFormError('Name, size, and code are required');
      setSubmitting(false);
      return;
    }

    try {
      const body = {
        id: modalMode === 'edit' ? parseInt(formData.id) : undefined,
        name: formData.name,
        size: formData.size,
        code: formData.code,
        is_active: formData.is_active,
        is_boosted: formData.is_boosted,
      };

      const res = await fetch('/api/admin/sponsors', {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save sponsor');

      setModalOpen(false);
      fetchSponsors();
      showToast(
        modalMode === 'add' ? `Sponsor "${formData.name}" created successfully!` : `Sponsor "${formData.name}" updated successfully!`,
        'success'
      );
    } catch (error: any) {
      setFormError(error.message);
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
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

  // ✅ Updated size badge colors
  const getSizeColor = (size: string) => {
    const colors: Record<string, string> = {
      '300x250': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      '728x90': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      '970x250': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      '320x100': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      '970x90': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      '200x300': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      '240x400': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      '350x600': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      'popup': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    };
    return colors[size] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone size={24} className="text-yellow" />
            Sponsors
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Total: <span className="font-bold text-white dark:text-white">{totalItems}</span> sponsors
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-yellow/90 transition-colors"
          >
            <Plus size={16} />
            New Sponsor
          </button>
          <button
            onClick={fetchSponsors}
            className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search sponsors..."
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

      {/* TABLE */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : sponsors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <Megaphone size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">
              {search ? 'No sponsors found matching your search' : 'No sponsors yet'}
            </p>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
              {search ? 'Try a different search term' : 'Create your first sponsor to get started'}
            </p>
            {!search && (
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-yellow/90 transition-colors"
              >
                Create Sponsor
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden sm:table-cell">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden xl:table-cell">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {sponsor.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium border ${
                          sponsor.is_active === 1 || sponsor.is_active === true
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}>
                          {sponsor.is_active === 1 || sponsor.is_active === true ? 'Active' : 'Inactive'}
                        </span>
                        {sponsor.is_boosted === 1 || sponsor.is_boosted === true ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-yellow uppercase tracking-wider border border-yellow/30 bg-yellow/10">
                            <Sparkles size={10} />
                            Featured
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium border ${getSizeColor(sponsor.size)}`}>
                      {sponsor.size}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs text-slate-400 dark:text-white/30">
                      {formatDate(sponsor.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle Active */}
                      <button
                        onClick={() => toggleActive(sponsor)}
                        disabled={togglingId === sponsor.id}
                        className={`p-2 transition-colors ${
                          sponsor.is_active === 1 || sponsor.is_active === true
                            ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                        title={sponsor.is_active === 1 || sponsor.is_active === true ? 'Deactivate' : 'Activate'}
                      >
                        {sponsor.is_active === 1 || sponsor.is_active === true ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>

                      {/* Toggle Boost */}
                      <button
                        onClick={() => toggleBoost(sponsor)}
                        disabled={togglingId === sponsor.id}
                        className={`p-2 transition-colors ${
                          sponsor.is_boosted === 1 || sponsor.is_boosted === true
                            ? 'text-yellow hover:text-yellow/80 hover:bg-yellow/10'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                        title={sponsor.is_boosted === 1 || sponsor.is_boosted === true ? 'Remove Featured' : 'Make Featured'}
                      >
                        {sponsor.is_boosted === 1 || sponsor.is_boosted === true ? (
                          <Sparkles size={16} />
                        ) : (
                          <StarOff size={16} />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(sponsor)}
                        className="p-2 text-slate-500 hover:text-yellow hover:bg-yellow/10 transition-colors"
                        title="Edit sponsor"
                      >
                        <Edit size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          setDeleteTarget(sponsor.id);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete sponsor"
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

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-4">
          <p className="text-xs text-slate-500 dark:text-white/30 order-2 sm:order-1">
            Showing {sponsors.length} of {totalItems} sponsors
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

      {/* ===== ADD/EDIT MODAL ===== */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
              
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === 'add' ? 'Create Sponsor' : 'Edit Sponsor'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      Sponsor Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Google Ads"
                      className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      Ad Size *
                    </label>
                    {/* ✅ SIMPLE DROPDOWN - UNIQUE SIZES ONLY */}
                    <select
                      required
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    >
                      {BANNER_SIZES.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-400 dark:text-white/30">
                      Select the banner size - algorithm handles placement
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Embed Code *
                  </label>
                  <textarea
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    rows={8}
                    placeholder="HTML, JavaScript, or iframe embed code..."
                    className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors resize-y"
                  />
                  <p className="mt-1 text-xs text-slate-400 dark:text-white/30">
                    Paste your ad HTML, JavaScript, or iframe code here
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-yellow"
                    />
                    Active
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_boosted}
                      onChange={(e) => setFormData({ ...formData, is_boosted: e.target.checked })}
                      className="w-4 h-4 accent-yellow"
                    />
                    <Sparkles size={14} className="text-yellow" />
                    Featured (Boosted)
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-full sm:flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10 order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:flex-1 py-2.5 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {submitting ? 'Saving...' : modalMode === 'add' ? 'Create Sponsor' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ===== DELETE CONFIRMATION ===== */}
      {deleteModalOpen && deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[60]" onClick={() => setDeleteModalOpen(false)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Sponsor</h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Are you sure you want to delete this sponsor? This action cannot be undone.
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
                    {actionLoading ? 'Deleting...' : 'Delete Sponsor'}
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