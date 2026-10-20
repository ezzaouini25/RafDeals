'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/admin/layout';
import {
  MessageSquare,
  Star,
  Quote,
  Clock,
  RefreshCw,
  Loader2,
  Search,
  Inbox,
  Eye,
  EyeOff,
  CheckCircle2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  Briefcase,
  Image,
  Tag,
  Users,
  ChevronsLeft,
  ChevronsRight,
  Ban,
} from 'lucide-react';

interface MemberItem {
  id: number;
  type: 'comment' | 'testimonial' | 'review';
  author_name: string;
  gender: string | null;
  author_email: string;
  occupation: string | null;
  payout_amount: string | null;
  payout_type: string | null;
  image_path: string | null;
  content: string;
  rating: number | null;
  article_id: number | null;
  offer_id: number | null;
  is_approved: boolean;
  is_read: boolean;
  created_at: string;
}

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

export default function MembersPage() {
  const { user } = useAdmin();
  const userRole = user?.role || 'editor';
  const isAdmin = userRole === 'admin';

  const [items, setItems] = useState<MemberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'comment' | 'testimonial' | 'review'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MemberItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/members?search=${search}&type=${typeFilter}&status=${statusFilter}&page=${page}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search, typeFilter, statusFilter, page]);

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/admin/members/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'disapprove' | 'delete') => {
    if (action === 'delete') {
      setDeleteTarget(id);
      setDeleteModalOpen(true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/members/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/members/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget, action: 'delete' }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== deleteTarget));
        if (selectedItem?.id === deleteTarget) {
          setModalOpen(false);
          setSelectedItem(null);
        }
        fetchItems();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const openModal = (item: MemberItem) => {
    setSelectedItem(item);
    setModalOpen(true);
    if (!item.is_read) {
      markAsRead(item.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare size={20} className="text-amber-500" />;
      case 'review':
        return <Star size={20} className="text-yellow-500" />;
      case 'testimonial':
        return <Quote size={20} className="text-purple-500" />;
      default:
        return <MessageSquare size={20} className="text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comment':
        return 'Comment';
      case 'review':
        return 'Review';
      case 'testimonial':
        return 'Testimonial';
      default:
        return type;
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={16} className="fill-yellow text-yellow" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<Star key={i} size={16} className="fill-yellow/50 text-yellow" />);
      } else {
        stars.push(<Star key={i} size={16} className="text-slate-600" />);
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const getStatusBadge = (approved: boolean) => {
    if (approved) {
      return {
        text: 'Approved',
        className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      };
    }
    return {
      text: 'Pending',
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    };
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
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users size={24} className="text-yellow" />
            Members
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Total: <span className="font-bold text-white dark:text-white">{total}</span> submissions
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${
            isAdmin
              ? 'bg-yellow/10 text-yellow border-yellow/20'
              : 'bg-slate-700/50 text-slate-300 border-slate-600'
          }`}>
            {userRole}
          </span>

          <button
            onClick={fetchItems}
            className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('comment')}
              className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${
                typeFilter === 'comment'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <MessageSquare size={12} />
              Comments
            </button>
            <button
              onClick={() => setTypeFilter('review')}
              className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${
                typeFilter === 'review'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Star size={12} />
              Reviews
            </button>
            <button
              onClick={() => setTypeFilter('testimonial')}
              className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${
                typeFilter === 'testimonial'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Quote size={12} />
              Testimonials
            </button>
          </div>

          <div className="flex border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'approved'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <CheckCircle2 size={12} />
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'pending'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Clock size={12} />
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* ITEMS LIST - NO ROUNDED */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <Users size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">
              No members found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-white/5">
            {items.map((item) => {
              const status = getStatusBadge(item.is_approved);
              return (
                <div
                  key={item.id}
                  onClick={() => openModal(item)}
                  className={`flex flex-col sm:flex-row items-start gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 ${
                    !item.is_approved ? 'border-l-4 border-amber-500 bg-amber-500/5' : ''
                  } ${!item.is_read ? 'bg-yellow/5' : ''}`}
                >
                  <div className="mt-1 shrink-0">{getTypeIcon(item.type)}</div>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">
                          {item.author_name}
                          <span className="ml-2 text-[10px] font-medium text-slate-500 dark:text-white/30 uppercase border border-slate-200 dark:border-white/10 px-1.5 py-0.5">
                            {getTypeLabel(item.type)}
                          </span>
                          <span className={`ml-2 text-[10px] font-medium uppercase border px-1.5 py-0.5 ${status.className}`}>
                            {status.text}
                          </span>
                          {!item.is_read && (
                            <span className="ml-2 text-[10px] font-medium text-yellow uppercase border border-yellow/20 px-1.5 py-0.5 bg-yellow/5">
                              New
                            </span>
                          )}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {item.type === 'review' && item.rating && (
                            <div className="flex items-center gap-1">
                              {renderStars(item.rating)}
                              <span className="text-xs text-slate-500 dark:text-white/40">
                                {item.rating}
                              </span>
                            </div>
                          )}
                          {item.type === 'testimonial' && item.payout_amount && (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <DollarSign size={12} />
                              ${item.payout_amount}
                              {item.payout_type && ` (${item.payout_type})`}
                            </span>
                          )}
                          {item.occupation && (
                            <span className="text-xs text-slate-500 dark:text-white/40 flex items-center gap-1">
                              <Briefcase size={12} />
                              {item.occupation}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 dark:text-white/60 mt-1 line-clamp-2 break-words">
                          {item.content}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/30 mt-2 flex items-center gap-1 flex-wrap">
                          <Clock size={12} />
                          {formatTimeAgo(item.created_at)}
                          {item.author_email && (
                            <span className="ml-2 text-slate-500 dark:text-white/20">
                              • {item.author_email}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAGINATION - NO ROUNDED */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-4">
          <p className="text-xs text-slate-500 dark:text-white/30 order-2 sm:order-1">
            Showing {items.length} of {total} members
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

      {/* ===== MODAL - CENTERED, FULL SCREEN BG, NO ROUNDED ===== */}
      {modalOpen && selectedItem && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              
              {/* Modal Header - NO ROUNDED */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="p-2 bg-slate-100 dark:bg-white/5">
                    {getTypeIcon(selectedItem.type)}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {selectedItem.author_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase">
                        {getTypeLabel(selectedItem.type)}
                      </span>
                      {(() => {
                        const status = getStatusBadge(selectedItem.is_approved);
                        return (
                          <span className={`text-[10px] font-medium uppercase border px-2 py-0.5 ${status.className}`}>
                            {status.text}
                          </span>
                        );
                      })()}
                      {selectedItem.is_read ? (
                        <span className="text-[10px] font-medium text-blue-500 uppercase border border-blue-500/20 px-2 py-0.5 bg-blue-500/5">
                          Read
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-yellow uppercase border border-yellow/20 px-2 py-0.5 bg-yellow/5">
                          Unread
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body - NO ROUNDED */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Author Info Grid - NO ROUNDED */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <User size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Name:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedItem.author_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Email:</span>
                    <span className="text-slate-900 dark:text-white truncate">
                      {selectedItem.author_email || 'N/A'}
                    </span>
                  </div>
                  {selectedItem.gender && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <AlertCircle size={16} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 dark:text-white/60">Gender:</span>
                      <span className="text-slate-900 dark:text-white capitalize">
                        {selectedItem.gender}
                      </span>
                    </div>
                  )}
                  {selectedItem.occupation && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Briefcase size={16} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 dark:text-white/60">Occupation:</span>
                      <span className="text-slate-900 dark:text-white">
                        {selectedItem.occupation}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-sm">
                    <Clock size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Submitted:</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatTimeAgo(selectedItem.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Tag size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Type:</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {getTypeLabel(selectedItem.type)}
                    </span>
                  </div>
                </div>

                {/* Type-specific details - NO ROUNDED */}
                {selectedItem.type === 'review' && selectedItem.rating && (
                  <div className="p-4 sm:p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <p className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider mb-3">
                      Rating
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        {renderStars(selectedItem.rating)}
                      </div>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedItem.rating}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-white/40">/ 5.0</span>
                    </div>
                  </div>
                )}

                {selectedItem.type === 'testimonial' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    {selectedItem.payout_amount && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <DollarSign size={16} className="text-slate-400 shrink-0" />
                        <span className="text-slate-500 dark:text-white/60">Payout:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ${selectedItem.payout_amount}
                          {selectedItem.payout_type && ` (${selectedItem.payout_type})`}
                        </span>
                      </div>
                    )}
                    {selectedItem.image_path && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Image size={16} className="text-slate-400 shrink-0" />
                        <span className="text-slate-500 dark:text-white/60">Proof:</span>
                        <a
                          href={selectedItem.image_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow hover:underline font-medium"
                        >
                          View Image →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Message - NO ROUNDED */}
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare size={14} />
                    Content
                  </p>
                  <div className="p-4 sm:p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 min-h-[120px] max-h-[300px] overflow-y-auto">
                    <p className="text-sm sm:text-base text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap break-words">
                      {selectedItem.content}
                    </p>
                  </div>
                </div>

                {/* Action Buttons - NO ROUNDED */}
                <div className="border-t border-slate-200 dark:border-white/10 pt-4 sm:pt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAction(selectedItem.id, 'approve')}
                    disabled={actionLoading || selectedItem.is_approved}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                      selectedItem.is_approved
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20 cursor-not-allowed'
                        : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:shadow-lg hover:shadow-green-500/10'
                    }`}
                  >
                    <ThumbsUp size={16} />
                    {selectedItem.is_approved ? 'Approved' : 'Approve'}
                  </button>

                  <button
                    onClick={() => handleAction(selectedItem.id, 'disapprove')}
                    disabled={actionLoading || !selectedItem.is_approved}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                      !selectedItem.is_approved
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-not-allowed'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/10'
                    }`}
                  >
                    <ThumbsDown size={16} />
                    {!selectedItem.is_approved ? 'Pending' : 'Disapprove'}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleAction(selectedItem.id, 'delete')}
                      disabled={actionLoading}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold hover:bg-rose-500/20 transition-all border border-rose-500/20 hover:shadow-lg hover:shadow-rose-500/10 flex items-center gap-2 ml-auto"
                    >
                      <Ban size={16} />
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DELETE CONFIRMATION - NO ROUNDED */}
      {deleteModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-[60]"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Delete Member
                </h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Are you sure you want to delete this member submission? This action cannot be undone.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10"
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