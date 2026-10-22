'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserLock,
  Clock,
  Trash2,
  RefreshCw,
  Loader2,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Fingerprint,
  User,
  Calendar,
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


interface RateLimitBlock {
  id: number;
  ip_address: string;
  device_fingerprint: string;
  blocked_until: string;
  reason: string;
  created_at: string;
}

export default function SuspendPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<RateLimitBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<RateLimitBlock | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'unblock' | 'extend' | null>(null);
  const [extendHours, setExtendHours] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const limit = 20;
  const MAX_HOURS = 8760; // 1 year

  // Check if user is admin
  useEffect(() => {
    const adminUser = sessionStorage.getItem('admin_user');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        if (user.role !== 'admin') {
          router.push('/admin');
        }
      } catch {
        router.push('/admin/login');
      }
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchBlocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/suspend?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch blocks');
      }
      const data = await res.json();
      setBlocks(data.blocks || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
      showToast(err.message || 'Failed to fetch blocks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [page, search]);

  const handleUnblock = async (id: number) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/suspend', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to unblock');
      }
      showToast('Block removed successfully!', 'success');
      setShowModal(false);
      setSelectedBlock(null);
      fetchBlocks();
    } catch (err: any) {
      showToast(err.message || 'Error removing block', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtend = async (id: number, hours: number) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/suspend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, hours }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extend block');
      }
      
      showToast(`Block extended by ${hours} hours!`, 'success');
      setShowModal(false);
      setSelectedBlock(null);
      fetchBlocks();
    } catch (err: any) {
      showToast(err.message || 'Error extending block', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (block: RateLimitBlock, action: 'unblock' | 'extend') => {
    setSelectedBlock(block);
    setModalAction(action);
    setShowModal(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (blockedUntil: string) => {
    const now = new Date();
    const until = new Date(blockedUntil);
    const diff = until.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  };

  const isExpired = (blockedUntil: string) => {
    return new Date(blockedUntil) < new Date();
  };

  const getStatusColor = (blockedUntil: string) => {
    if (isExpired(blockedUntil)) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    const remaining = new Date(blockedUntil).getTime() - new Date().getTime();
    if (remaining < 3600000) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const getStatusLabel = (blockedUntil: string) => {
    if (isExpired(blockedUntil)) return 'Expired';
    const remaining = new Date(blockedUntil).getTime() - new Date().getTime();
    if (remaining < 3600000) return 'Expiring Soon';
    return 'Active';
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

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserLock size={24} className="text-yellow" />
            Suspend Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Total: <span className="font-bold text-white dark:text-white">{totalItems}</span> blocked entries
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchBlocks}
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
          placeholder="Search by IP address or fingerprint..."
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
        ) : blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <UserLock size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">
              {search ? 'No blocks found matching your search' : 'No blocks found'}
            </p>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
              {search ? 'Try a different search term' : 'All rate limit blocks will appear here'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden md:table-cell">
                  Fingerprint
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Blocked Until
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden sm:table-cell">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden lg:table-cell">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {blocks.map((block, index) => (
                <tr key={block.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400 dark:text-white/30">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-slate-900 dark:text-white">
                      {block.ip_address || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-slate-500 dark:text-white/30 font-mono truncate max-w-[100px] block">
                      {block.device_fingerprint || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-900 dark:text-white">
                        {formatDate(block.blocked_until)}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-white/30">
                        {getTimeRemaining(block.blocked_until)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-slate-500 dark:text-white/40 truncate max-w-[150px] block">
                      {block.reason || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-400 dark:text-white/30">
                      {formatDate(block.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${getStatusColor(block.blocked_until)}`}>
                      {getStatusLabel(block.blocked_until)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openModal(block, 'extend')}
                        className="p-2 text-slate-500 hover:text-yellow hover:bg-yellow/10 transition-colors"
                        title="Extend block duration"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        onClick={() => openModal(block, 'unblock')}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Remove block"
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
            Showing {blocks.length} of {totalItems} blocked entries
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

      {/* ===== EXTEND MODAL ===== */}
      {showModal && selectedBlock && modalAction === 'extend' && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={20} className="text-yellow" />
                  Extend Duration
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-white/40">IP:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{selectedBlock.ip_address || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-200 dark:border-white/10 pt-2">
                    <span className="text-slate-500 dark:text-white/40">Fingerprint:</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-white/70 truncate max-w-[180px]">
                      {selectedBlock.device_fingerprint || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-200 dark:border-white/10 pt-2">
                    <span className="text-slate-500 dark:text-white/40">Current:</span>
                    <span className="text-slate-900 dark:text-white">{formatDate(selectedBlock.blocked_until)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/60 mb-2">
                    Extend by
                  </label>
                  
                  {/* Quick Options */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    <button
                      onClick={() => setExtendHours(24)}
                      className={`px-4 py-2 border transition-colors text-sm ${
                        extendHours === 24
                          ? 'bg-yellow text-slate-950 border-yellow'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-300 dark:border-white/10 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      1 Day
                    </button>
                    <button
                      onClick={() => setExtendHours(240)}
                      className={`px-4 py-2 border transition-colors text-sm ${
                        extendHours === 240
                          ? 'bg-yellow text-slate-950 border-yellow'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-300 dark:border-white/10 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      10 Days
                    </button>
                    <button
                      onClick={() => setExtendHours(720)}
                      className={`px-4 py-2 border transition-colors text-sm ${
                        extendHours === 720
                          ? 'bg-yellow text-slate-950 border-yellow'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-300 dark:border-white/10 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() => setExtendHours(8760)}
                      className={`px-4 py-2 border transition-colors text-sm ${
                        extendHours === 8760
                          ? 'bg-yellow text-slate-950 border-yellow'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-300 dark:border-white/10 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      1 Year
                    </button>
                  </div>

                  {/* Custom Input */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 dark:text-white/30">Custom:</span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_HOURS}
                      value={extendHours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val > MAX_HOURS) {
                          setExtendHours(MAX_HOURS);
                          showToast(`Maximum is ${MAX_HOURS} hours (1 year)`, 'error');
                        } else {
                          setExtendHours(val || 1);
                        }
                      }}
                      className="w-24 px-3 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-yellow/50 text-sm"
                    />
                    <span className="text-sm text-slate-500 dark:text-white/30">hours (max 1 year)</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-white/30 mt-2">
                    New blocked_until: {formatDate(new Date(Date.now() + extendHours * 3600000).toISOString())}
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleExtend(selectedBlock.id, extendHours)}
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-yellow text-slate-950 text-sm font-bold hover:bg-yellow/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                    {submitting ? 'Extending...' : 'Extend Duration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== UNBLOCK MODAL ===== */}
      {showModal && selectedBlock && modalAction === 'unblock' && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Remove Block</h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-2">
                  Are you sure you want to remove this block?
                </p>
                <div className="space-y-1 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-left text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-white/40">IP:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{selectedBlock.ip_address || '—'}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-white/10 pt-1">
                    <span className="text-slate-500 dark:text-white/40">Fingerprint:</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-white/70 truncate max-w-[150px]">
                      {selectedBlock.device_fingerprint || '—'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>This action cannot be undone. The user will be able to submit again.</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUnblock(selectedBlock.id)}
                    disabled={submitting}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {submitting ? 'Removing...' : 'Remove Block'}
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