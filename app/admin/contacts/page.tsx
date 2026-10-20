'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/admin/layout';
import {
  Mail,
  User,
  MessageCircle,
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
  Calendar,
  AlertCircle,
  FileText,
  Filter,
  ChevronDown,
} from 'lucide-react';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
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

export default function ContactsPage() {
  const { user } = useAdmin();
  const userRole = user?.role || 'editor';
  const isAdmin = userRole === 'admin';

  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contacts?search=${search}&filter=${filter}&page=${page}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [search, filter, page]);

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/admin/contacts/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setContacts((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, is_read: true } : c
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) return;
    setDeleteTarget(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/contacts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget }),
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== deleteTarget));
        if (selectedContact?.id === deleteTarget) {
          setModalOpen(false);
          setSelectedContact(null);
        }
        fetchContacts();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const openModal = (contact: ContactMessage) => {
    setSelectedContact(contact);
    setModalOpen(true);
    if (!contact.is_read) {
      markAsRead(contact.id);
    }
  };

  const getFilterCount = () => {
    if (filter === 'all') return total;
    if (filter === 'unread') return contacts.filter(c => !c.is_read).length;
    if (filter === 'read') return contacts.filter(c => c.is_read).length;
    return total;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Contact Messages
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Total: <span className="font-bold text-white dark:text-white">{total}</span> messages
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
            onClick={fetchContacts}
            className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
          />
        </div>

        <div className="flex border border-slate-200 dark:border-white/10">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
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
            className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-yellow text-slate-950'
                : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Eye size={14} />
            Unread ({contacts.filter(c => !c.is_read).length})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === 'read'
                ? 'bg-yellow text-slate-950'
                : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <EyeOff size={14} />
            Read ({contacts.filter(c => c.is_read).length})
          </button>
        </div>
      </div>

      {/* CONTACTS LIST */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <Mail size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">
              {filter === 'all' && 'No contact messages'}
              {filter === 'unread' && 'No unread messages'}
              {filter === 'read' && 'No read messages'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-white/5">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => openModal(contact)}
                className={`flex items-start gap-4 px-4 py-4 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 ${
                  !contact.is_read ? 'border-l-4 border-yellow bg-yellow/5' : ''
                }`}
              >
                <div className="mt-1">
                  <Mail size={18} className={!contact.is_read ? 'text-yellow' : 'text-slate-400'} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {contact.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-white/70 mt-0.5 font-medium">
                        {contact.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500 dark:text-white/40">
                          {contact.email}
                        </span>
                        {contact.is_read ? (
                          <span className="text-[10px] font-medium text-blue-500 uppercase border border-blue-500/20 px-1.5 py-0.5 bg-blue-500/5">
                            Read
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-yellow uppercase border border-yellow/20 px-1.5 py-0.5 bg-yellow/5">
                            Unread
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-white/30 mt-2 flex items-center gap-1">
                        <Clock size={12} />
                        {formatTimeAgo(contact.created_at)}
                      </p>
                    </div>
                    {!contact.is_read && (
                      <span className="w-2 h-2 bg-yellow rounded-full shrink-0 mt-1.5 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ PAGINATION WITH PAGE NUMBERS */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-4">
          <p className="text-xs text-slate-500 dark:text-white/30 order-2 sm:order-1">
            Showing {contacts.length} of {total} messages
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            
            {/* Page numbers */}
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

      {/* ===== CONTACT DETAIL MODAL ===== */}
      {modalOpen && selectedContact && (
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
                  <Mail size={18} className={!selectedContact.is_read ? 'text-yellow' : 'text-slate-400'} />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Contact Message
                  </span>
                  {selectedContact.is_read ? (
                    <span className="text-[10px] font-medium text-blue-500 uppercase border border-blue-500/20 px-2 py-0.5 bg-blue-500/5">
                      Read
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-yellow uppercase border border-yellow/20 px-2 py-0.5 bg-yellow/5">
                      Unread
                    </span>
                  )}
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
                {/* Sender Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">From:</span>
                    <span className="font-medium text-slate-900 dark:text-white truncate">
                      {selectedContact.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Email:</span>
                    <span className="text-slate-900 dark:text-white truncate">
                      {selectedContact.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Received:</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatTimeAgo(selectedContact.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-white/60">Subject:</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {selectedContact.subject}
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
                      {selectedContact.message}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-slate-200 dark:border-white/10 pt-4 flex flex-wrap gap-2">
                  {!selectedContact.is_read && (
                    <button
                      onClick={() => {
                        markAsRead(selectedContact.id);
                        setSelectedContact({ ...selectedContact, is_read: true });
                      }}
                      className="px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors border border-blue-500/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      Mark as Read
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(selectedContact.id)}
                      className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors border border-rose-500/20 flex items-center gap-1.5 ml-auto"
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
                  Delete Message
                </h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Are you sure you want to delete this message? This action cannot be undone.
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