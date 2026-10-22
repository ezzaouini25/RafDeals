'use client';

import { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Code,
} from 'lucide-react';

// ============================================================
// TOAST (Sharp 0px corners, solid colors, and pure CSS countdown)
// ============================================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info' | 'warning'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Color schemes matching your layout
  const styles = {
    success: {
      bg: 'bg-[#2ecc71]',
      bar: 'bg-emerald-700/30',
      title: 'Success!',
      iconBg: 'bg-white text-[#2ecc71]',
      icon: <Check size={18} strokeWidth={3} />,
    },
    error: {
      bg: 'bg-[#e74c3c]',
      bar: 'bg-rose-900/30',
      title: 'Error!',
      iconBg: 'bg-white text-[#e74c3c]',
      icon: <X size={18} strokeWidth={3} />,
    },
    info: {
      bg: 'bg-[#3498db]',
      bar: 'bg-blue-900/30',
      title: 'Info!',
      iconBg: 'bg-white text-[#3498db]',
      icon: <span className="font-bold text-lg italic">i</span>,
    },
    warning: {
      bg: 'bg-[#f1c40f]',
      bar: 'bg-amber-950/20',
      title: 'Warning!',
      iconBg: 'bg-white text-[#f1c40f]',
      icon: <span className="font-bold text-lg">!</span>,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <>
      <style jsx>{`
        @keyframes shrinkBar {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-shrink {
          animation: shrinkBar 5s linear forwards;
        }
      `}</style>
      <div className={`fixed top-20 right-6 z-50 w-full max-w-md ${current.bg} text-white rounded-none shadow-2xl overflow-hidden flex flex-col`}>
        {/* Main Content Area */}
        <div className="p-4 flex items-start gap-4 relative">
          {/* White circular icon container on the left */}
          <div className={`w-9 h-9 rounded-full ${current.iconBg} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
            {current.icon}
          </div>

          {/* Text Content */}
          <div className="flex-1 pr-6">
            <h4 className="font-bold text-base tracking-wide mb-0.5">{current.title}</h4>
            <p className="text-sm opacity-95 leading-relaxed">{message}</p>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Bottom Countdown Line (Pure CSS Keyframe Animation) */}
        <div className={`w-full h-1.5 ${current.bar} relative overflow-hidden`}>
          <div className="absolute top-0 left-0 bottom-0 bg-white/50 animate-shrink" />
        </div>
      </div>
    </>
  );
}

interface Advertisement {
  id: number;
  name: string;
  ad_data: string;
  size: string;
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}

// ✅ UNIQUE SIZES ONLY - Same as sponsors
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

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
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
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    ad_data: '',
    size: '728x90',
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const limit = 10;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/advertisements?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch advertisements');
      }
      const data = await res.json();
      setAds(data.advertisements || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
      showToast(err.message || 'Failed to fetch advertisements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [page, search]);

  // ✅ Toggle Active Status
  const toggleActive = async (ad: Advertisement) => {
    setTogglingId(ad.id);
    try {
      const newStatus = ad.is_active === 1 || ad.is_active === true ? 0 : 1;
      
      const res = await fetch('/api/admin/advertisements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ad.id,
          name: ad.name,
          ad_data: ad.ad_data,
          size: ad.size,
          is_active: newStatus === 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle active status');
      }

      showToast(
        `Advertisement ${newStatus === 1 ? 'activated' : 'deactivated'} successfully!`,
        'success'
      );
      await fetchAds();
    } catch (err: any) {
      showToast(err.message || 'Error toggling active status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/advertisements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete');
      }
      showToast('Advertisement deleted successfully!', 'success');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchAds();
    } catch (err: any) {
      showToast(err.message || 'Error deleting advertisement', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Open Add Modal
  const openAddModal = () => {
    setFormData({
      id: '',
      name: '',
      ad_data: '',
      size: '728x90',
      is_active: true,
    });
    setModalMode('add');
    setSelectedAd(null);
    setFormError(null);
    setModalOpen(true);
  };

  // ✅ Open Edit Modal
  const openEditModal = (ad: Advertisement) => {
    setModalMode('edit');
    setSelectedAd(ad);
    setFormData({
      id: String(ad.id),
      name: ad.name,
      ad_data: ad.ad_data,
      size: ad.size,
      is_active: ad.is_active === 1 || ad.is_active === true,
    });
    setFormError(null);
    setModalOpen(true);
  };

  // ✅ Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (!formData.name || !formData.ad_data || !formData.size) {
      setFormError('Name, ad data, and size are required');
      setSubmitting(false);
      return;
    }

    try {
      const body = {
        id: modalMode === 'edit' ? parseInt(formData.id) : undefined,
        name: formData.name,
        ad_data: formData.ad_data,
        size: formData.size,
        is_active: formData.is_active,
      };

      const res = await fetch('/api/admin/advertisements', {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save advertisement');

      setModalOpen(false);
      fetchAds();
      showToast(
        modalMode === 'add' ? `Advertisement "${formData.name}" created successfully!` : `Advertisement "${formData.name}" updated successfully!`,
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

  // ✅ Size badge colors
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

  // ✅ Truncate ad_data preview
  const truncateAdData = (data: string) => {
    const clean = data.replace(/<[^>]*>/g, '').trim();
    if (clean.length <= 60) return clean;
    return clean.substring(0, 60) + '...';
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
            <LayoutGrid size={24} className="text-yellow" />
            Advertisements
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Total: <span className="font-bold text-white dark:text-white">{totalItems}</span> advertisements
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-yellow/90 transition-colors"
          >
            <Plus size={16} />
            New Advertisement
          </button>
          <button
            onClick={fetchAds}
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
          placeholder="Search advertisements..."
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
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <LayoutGrid size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">
              {search ? 'No advertisements found matching your search' : 'No advertisements yet'}
            </p>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
              {search ? 'Try a different search term' : 'Create your first advertisement to get started'}
            </p>
            {!search && (
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-yellow/90 transition-colors"
              >
                Create Advertisement
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden lg:table-cell">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden sm:table-cell">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden xl:table-cell">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {ad.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium border ${
                          ad.is_active === 1 || ad.is_active === true
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}>
                          {ad.is_active === 1 || ad.is_active === true ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium border text-slate-400 bg-slate-500/10 border-slate-500/20">
                          <Code size={10} />
                          HTML
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs text-slate-500 dark:text-white/40 max-w-[200px] truncate">
                      {truncateAdData(ad.ad_data)}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium border ${getSizeColor(ad.size)}`}>
                      {ad.size}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs text-slate-400 dark:text-white/30">
                      {formatDate(ad.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle Active */}
                      <button
                        onClick={() => toggleActive(ad)}
                        disabled={togglingId === ad.id}
                        className={`p-2 transition-colors ${
                          ad.is_active === 1 || ad.is_active === true
                            ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                        title={ad.is_active === 1 || ad.is_active === true ? 'Deactivate' : 'Activate'}
                      >
                        {ad.is_active === 1 || ad.is_active === true ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(ad)}
                        className="p-2 text-slate-500 hover:text-yellow hover:bg-yellow/10 transition-colors"
                        title="Edit advertisement"
                      >
                        <Edit size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          setDeleteTarget(ad.id);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete advertisement"
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
            Showing {ads.length} of {totalItems} advertisements
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
                  {modalMode === 'add' ? 'Create Advertisement' : 'Edit Advertisement'}
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
                      Ad Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Home Mobile Ad"
                      className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      Ad Size *
                    </label>
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
                    Ad HTML Code *
                  </label>
                  <textarea
                    required
                    value={formData.ad_data}
                    onChange={(e) => setFormData({ ...formData, ad_data: e.target.value })}
                    rows={12}
                    placeholder="Paste your ad HTML code here..."
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
                    {submitting ? 'Saving...' : modalMode === 'add' ? 'Create Advertisement' : 'Save Changes'}
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Advertisement</h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Are you sure you want to delete this advertisement? This action cannot be undone.
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
                    {actionLoading ? 'Deleting...' : 'Delete Advertisement'}
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