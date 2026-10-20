'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/admin/layout';
import {
  MessageSquare,
  Quote,
  MessageCircle,
  Clock,
  RefreshCw,
  Loader2,
  Inbox,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Bell,
  Star,
  X,
  Trash2,
  User,
  Mail,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'comment' | 'testimonial' | 'review' | 'contact';
  title: string;
  name: string;
  email: string;
  message: string;
  time: string;
  link: string;
  read: boolean;
  approved: boolean;
}

interface NotificationCounts {
  comments: number;
  testimonials: number;
  reviews: number;
  contacts: number;
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

export default function NotificationsPage() {
  const { user } = useAdmin();
  const userRole = user?.role || 'editor';
  const isAdmin = userRole === 'admin';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    comments: 0,
    testimonials: 0,
    reviews: 0,
    contacts: 0,
  });
  const [unreadCounts, setUnreadCounts] = useState<NotificationCounts>({
    comments: 0,
    testimonials: 0,
    reviews: 0,
    contacts: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchNotifications = async (pageNum: number = 1, status: string = 'all') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications?page=${pageNum}&status=${status}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setCounts(data.counts || { comments: 0, testimonials: 0, reviews: 0, contacts: 0 });
        setUnreadCounts(data.unreadCounts || { comments: 0, testimonials: 0, reviews: 0, contacts: 0 });
        setTotal(data.total || 0);
        setTotalUnread(data.totalUnread || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page, filter);
  }, [page, filter]);

  const markAsRead = async (id: string) => {
    try {
      const [type, notificationId] = id.split('_');
      await fetch('/api/admin/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: parseInt(notificationId) }),
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'disapprove' | 'delete') => {
    if (action === 'delete') {
      setDeleteTarget(id);
      setDeleteModalOpen(true);
      return;
    }

    setActionLoading(true);
    try {
      const [type, notificationId] = id.split('_');
      const res = await fetch('/api/admin/notifications/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: parseInt(notificationId), action }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, approved: action === 'approve' ? true : false }
              : n
          )
        );
        // ✅ Refresh after action to update pagination
        fetchNotifications(page, filter);
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
      const [type, notificationId] = deleteTarget.split('_');
      const res = await fetch('/api/admin/notifications/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: parseInt(notificationId), action: 'delete' }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== deleteTarget));
        setModalOpen(false);
        setSelectedNotification(null);
        // ✅ Refresh after delete to update pagination
        fetchNotifications(page, filter);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const openModal = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setModalOpen(true);
    
    // Auto mark as read when opening modal (is_read = 0 → is_read = 1)
    if (!notification.read) {
      markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare size={18} className="text-amber-500" />;
      case 'testimonial':
        return <Quote size={18} className="text-purple-500" />;
      case 'review':
        return <Star size={18} className="text-yellow-500" />;
      case 'contact':
        return <MessageCircle size={18} className="text-blue-500" />;
      default:
        return <Bell size={18} className="text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comment':
        return 'Comment';
      case 'testimonial':
        return 'Testimonial';
      case 'review':
        return 'Review';
      case 'contact':
        return 'Contact';
      default:
        return type;
    }
  };

  const getDisplayCount = () => {
    if (filter === 'all') return total;
    if (filter === 'unread') return totalUnread;
    if (filter === 'read') return total - totalUnread;
    return total;
  };

  // ✅ Approval status: is_approved = 1 → Approved, is_approved = 0 → Disapproved
  const getApprovalBadge = (approved: boolean) => {
    if (approved) {
      return {
        text: 'Approved',
        className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      };
    }
    return {
      text: 'Disapproved',
      className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      };
  };

  // ✅ Read status: is_read = 1 → Read, is_read = 0 → Unread
  const getReadBadge = (read: boolean) => {
    if (read) {
      return {
        text: 'Read',
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      };
    }
    return {
      text: 'Unread',
      className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
    };
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            {filter === 'all' && (
              <span>Total <span className="font-bold text-white dark:text-white">{total}</span> notifications</span>
            )}
            {filter === 'unread' && (
              <span>
                You have <span className="text-yellow font-bold">{totalUnread}</span> unread notifications
              </span>
            )}
            {filter === 'read' && (
              <span>
                <span className="text-blue-500 font-bold">{total - totalUnread}</span> read notifications
              </span>
            )}
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

          <div className="flex border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filter === 'all'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Inbox size={14} />
              All ({total})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Eye size={14} />
              Unread ({totalUnread})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filter === 'read'
                  ? 'bg-yellow text-slate-950'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <EyeOff size={14} />
              Read ({total - totalUnread})
            </button>
          </div>

          <button
            onClick={() => fetchNotifications(page, filter)}
            className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.comments}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-white/50 flex items-center gap-1.5">
            <MessageSquare size={12} className="text-amber-500" />
            Comments
          </p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.testimonials}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-white/50 flex items-center gap-1.5">
            <Quote size={12} className="text-purple-500" />
            Testimonials
          </p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.reviews}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-white/50 flex items-center gap-1.5">
            <Star size={12} className="text-yellow-500" />
            Reviews
          </p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts.contacts}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-white/50 flex items-center gap-1.5">
            <MessageCircle size={12} className="text-blue-500" />
            Contacts
          </p>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <Bell size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">
              {filter === 'all' && 'No notifications'}
              {filter === 'unread' && 'No unread notifications'}
              {filter === 'read' && 'No read notifications'}
            </p>
            <p className="text-xs text-slate-500 dark:text-white/40">
              {filter === 'unread' ? 'All notifications have been read' : ''}
              {filter === 'read' ? 'You haven\'t read any notifications yet' : ''}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-white/5">
            {notifications.map((notification) => {
              const approval = getApprovalBadge(notification.approved);
              const readStatus = getReadBadge(notification.read);
              return (
                <div
                  key={notification.id}
                  onClick={() => openModal(notification)}
                  className={`flex items-start gap-4 px-4 py-4 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 ${
                    !notification.read ? 'border-l-4 border-yellow bg-yellow/5' : ''
                  }`}
                >
                  <div className="mt-1">{getTypeIcon(notification.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {notification.title}
                          <span className="ml-2 text-[10px] font-medium text-slate-500 dark:text-white/30 uppercase border border-slate-200 dark:border-white/10 px-1.5 py-0.5">
                            {getTypeLabel(notification.type)}
                          </span>
                          {/* ✅ Approval Status - based on is_approved column */}
                          <span className={`ml-2 text-[10px] font-medium uppercase border px-1.5 py-0.5 ${approval.className}`}>
                            {approval.text}
                          </span>
                          {/* ✅ Read Status - based on is_read column */}
                          <span className={`ml-2 text-[10px] font-medium uppercase border px-1.5 py-0.5 ${readStatus.className}`}>
                            {readStatus.text}
                          </span>
                        </p>
                        <p className="text-sm text-slate-600 dark:text-white/60 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/30 mt-2 flex items-center gap-1">
                          <Clock size={12} />
                          {formatTimeAgo(notification.time)}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2.5 h-2.5 bg-yellow rounded-full shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* ✅ PAGINATION */}
        {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-4">
            <p className="text-xs text-slate-500 dark:text-white/30 order-2 sm:order-1">
            Showing {notifications.length} of {getDisplayCount()} {filter === 'all' ? 'notifications' : filter === 'unread' ? 'unread' : 'read'}
            </p>
            <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* Previous Button */}
            <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
            >
                <ChevronLeft size={18} />
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {(() => {
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
                    pages.push(
                    <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`w-8 h-8 text-xs font-medium transition-colors ${
                        page === i
                            ? 'bg-yellow text-slate-950'
                            : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                        {i}
                    </button>
                    );
                }

                // Add ellipsis at start
                if (startPage > 1) {
                    pages.unshift(
                    <span key="start-ellipsis" className="px-1 text-slate-500 dark:text-white/30">
                        ...
                    </span>
                    );
                    pages.unshift(
                    <button
                        key={1}
                        onClick={() => setPage(1)}
                        className={`w-8 h-8 text-xs font-medium transition-colors ${
                        page === 1
                            ? 'bg-yellow text-slate-950'
                            : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                        1
                    </button>
                    );
                }

                // Add ellipsis at end
                if (endPage < totalPages) {
                    pages.push(
                    <span key="end-ellipsis" className="px-1 text-slate-500 dark:text-white/30">
                        ...
                    </span>
                    );
                    pages.push(
                    <button
                        key={totalPages}
                        onClick={() => setPage(totalPages)}
                        className={`w-8 h-8 text-xs font-medium transition-colors ${
                        page === totalPages
                            ? 'bg-yellow text-slate-950'
                            : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                        {totalPages}
                    </button>
                    );
                }

                return pages;
                })()}
            </div>

            {/* Next Button */}
            <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
            >
                <ChevronRight size={18} />
            </button>
            </div>
        </div>
        )}

      {/* ===== NOTIFICATION DETAIL MODAL ===== */}
      {modalOpen && selectedNotification && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
              
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3 flex-wrap">
                  {getTypeIcon(selectedNotification.type)}
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedNotification.title}
                  </span>
                  {(() => {
                    const approval = getApprovalBadge(selectedNotification.approved);
                    const readStatus = getReadBadge(selectedNotification.read);
                    return (
                      <>
                        <span className={`text-[10px] font-medium uppercase border px-2 py-0.5 ${approval.className}`}>
                          {approval.text}
                        </span>
                        <span className={`text-[10px] font-medium uppercase border px-2 py-0.5 ${readStatus.className}`}>
                          {readStatus.text}
                        </span>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors rounded hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Sender Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">From:</span>
                    <span className="font-medium text-slate-900 dark:text-white truncate">
                      {selectedNotification.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Email:</span>
                    <span className="text-slate-900 dark:text-white truncate">
                      {selectedNotification.email || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Received:</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatTimeAgo(selectedNotification.time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Type:</span>
                    <span className="text-slate-900 dark:text-white">
                      {getTypeLabel(selectedNotification.type)}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MessageCircle size={14} />
                    Message
                  </p>
                  <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded min-h-[100px] max-h-[250px] overflow-y-auto">
                    <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap break-words">
                      {selectedNotification.message}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-slate-200 dark:border-white/10 pt-4 flex flex-wrap gap-2">
                  {/* Approve Button - sets is_approved = 1 */}
                  <button
                    onClick={() => handleAction(selectedNotification.id, 'approve')}
                    disabled={actionLoading || selectedNotification.approved}
                    className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all ${
                      selectedNotification.approved
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20 cursor-not-allowed'
                        : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:shadow-lg hover:shadow-green-500/10'
                    }`}
                  >
                    <ThumbsUp size={14} />
                    {selectedNotification.approved ? 'Approved' : 'Approve'}
                  </button>

                  {/* Disapprove Button - sets is_approved = 0 */}
                  <button
                    onClick={() => handleAction(selectedNotification.id, 'disapprove')}
                    disabled={actionLoading || !selectedNotification.approved}
                    className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all ${
                      !selectedNotification.approved
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 cursor-not-allowed'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:shadow-lg hover:shadow-rose-500/10'
                    }`}
                  >
                    <ThumbsDown size={14} />
                    {!selectedNotification.approved ? 'Disapproved' : 'Disapprove'}
                  </button>

                  {/* Delete Button - Admin Only */}
                  {isAdmin && (
                    <button
                      onClick={() => handleAction(selectedNotification.id, 'delete')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all border border-rose-500/20 hover:shadow-lg hover:shadow-rose-500/10 flex items-center gap-1.5 ml-auto"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
              
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Delete Notification
                </h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Are you sure you want to delete this notification? This action cannot be undone.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-6 py-2 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors rounded border border-slate-200 dark:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={actionLoading}
                    className="px-6 py-2 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors rounded flex items-center gap-2"
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