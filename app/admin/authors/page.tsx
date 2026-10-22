'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  Search,
  Check,
  X,
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
  Upload,
  Image as ImageIcon,
  Trash2 as TrashIcon,
  Camera,
  User as UserIcon,
  Tag, // ✅ Added Tag icon for Deals
} from 'lucide-react';

// ============================================================
// TOAST
// ============================================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info' | 'warning'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

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
        <div className="p-4 flex items-start gap-4 relative">
          <div className={`w-9 h-9 rounded-full ${current.iconBg} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
            {current.icon}
          </div>
          <div className="flex-1 pr-6">
            <h4 className="font-bold text-base tracking-wide mb-0.5">{current.title}</h4>
            <p className="text-sm opacity-95 leading-relaxed">{message}</p>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
        <div className={`w-full h-1.5 ${current.bar} relative overflow-hidden`}>
          <div className="absolute top-0 left-0 bottom-0 bg-white/50 animate-shrink" />
        </div>
      </div>
    </>
  );
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

// ============================================================
// MAIN PAGE
// ============================================================
export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedAuthor, setSelectedAuthor] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', bio: '', is_active: true });
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/authors?search=${search}&page=${page}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setAuthors(data.authors || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
      showToast('Failed to fetch authors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, [search, page]);

  const resetForm = () => {
    setFormData({ name: '', bio: '', is_active: true });
    setPictureFile(null);
    setPicturePreview(null);
    setRemovePicture(false);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setSelectedAuthor(null);
    setModalOpen(true);
  };

  const openEditModal = (author: any) => {
    setModalMode('edit');
    setSelectedAuthor(author);
    setFormData({
      name: author.name,
      bio: author.bio || '',
      is_active: author.is_active === 1,
    });
    setPictureFile(null);
    setPicturePreview(author.picture);
    setRemovePicture(false);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPictureFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('bio', formData.bio || '');
      formDataObj.append('is_active', String(formData.is_active));

      if (pictureFile) {
        formDataObj.append('picture', pictureFile);
      }

      if (removePicture) {
        formDataObj.append('remove_picture', 'true');
      }

      const url = modalMode === 'edit' && selectedAuthor
        ? `/api/admin/authors?id=${selectedAuthor.id}`
        : '/api/admin/authors';

      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formDataObj,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save author');
      }

      setModalOpen(false);
      fetchAuthors();

      if (modalMode === 'add') {
        showToast(`Author "${formData.name}" created successfully!`, 'success');
      } else {
        showToast(`Author "${formData.name}" updated successfully!`, 'success');
      }
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
      const res = await fetch(`/api/admin/authors?id=${deleteTarget}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const deletedAuthor = authors.find(a => a.id === deleteTarget);
        fetchAuthors();
        showToast(`Author "${deletedAuthor?.name}" deleted successfully!`, 'success');
      }
    } catch (error) {
      showToast('Failed to delete author', 'error');
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (id: number, currentStatus: number) => {
    try {
      const author = authors.find(a => a.id === id);
      if (!author) return;

      const newStatus = currentStatus === 1 ? 0 : 1;
      const formDataObj = new FormData();
      formDataObj.append('name', author.name);
      formDataObj.append('bio', author.bio || '');
      formDataObj.append('is_active', String(newStatus === 1));

      const res = await fetch(`/api/admin/authors?id=${id}`, {
        method: 'PUT',
        body: formDataObj,
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      fetchAuthors();
      showToast(`Author "${author.name}" ${newStatus === 1 ? 'activated' : 'deactivated'}!`, 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const getStatusBadge = (is_active: number) => {
    if (is_active === 1) {
      return { label: 'Active', className: 'bg-green-500/10 text-green-500 border-green-500/20' };
    }
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

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users size={24} className="text-yellow" />
            Authors
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Total: <span className="font-bold text-slate-900">{total}</span> authors
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center gap-2"
          >
            <UserPlus size={16} />
            Add Author
          </button>

          <button
            onClick={fetchAuthors}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
          placeholder="Search authors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
        />
      </div>

      {/* AUTHORS TABLE */}
      <div className="bg-white border border-slate-200 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : authors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600">No authors found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Articles
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Offers
                </th>
                {/* ✅ Added Deals Column */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Deals
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {authors.map((author) => {
                const status = getStatusBadge(author.is_active);
                return (
                  <tr key={author.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {author.picture ? (
                          <Image
                            src={author.picture}
                            alt={author.name}
                            width={36}
                            height={36}
                            className="border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
                            {author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{author.name}</p>
                          <p className="text-xs text-slate-500">ID: {author.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/articles?author=${author.id}`}
                        className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-yellow transition-colors"
                      >
                        <FileText size={14} className="text-slate-400" />
                        <span className="font-semibold">{author.article_count || 0}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/offers?author=${author.id}`}
                        className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-yellow transition-colors"
                      >
                        <Gift size={14} className="text-slate-400" />
                        <span className="font-semibold">{author.offer_count || 0}</span>
                      </Link>
                    </td>
                    {/* ✅ Added Deals Data Cell */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/deals?author=${author.id}`}
                        className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-yellow transition-colors"
                      >
                        <Tag size={14} className="text-slate-400" />
                        <span className="font-semibold">{author.deal_count || 0}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(author.id, author.is_active)}
                        className={`text-[10px] font-bold uppercase border px-2 py-1 transition-colors ${status.className}`}
                      >
                        {status.label}
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={12} />
                        {formatTimeAgo(author.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleActive(author.id, author.is_active)}
                          className={`p-2 transition-colors ${
                            author.is_active === 1
                              ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                              : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={author.is_active === 1 ? 'Deactivate' : 'Activate'}
                        >
                          {author.is_active === 1 ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => openEditModal(author)}
                          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(author.id)}
                          className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
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
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500 order-2 sm:order-1">
            Showing {authors.length} of {total} authors
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          ADD/EDIT MODAL
          ============================================================ */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">
                  {modalMode === 'add' ? 'Add New Author' : 'Edit Author'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Name *
                  </label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-900 text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Profile Picture
                  </label>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 border-2 border-dashed border-slate-300 hover:border-yellow transition-colors flex items-center justify-center bg-slate-50 overflow-hidden group">
                      {picturePreview ? (
                        <>
                          <Image
                            src={picturePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera size={20} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <ImageIcon size={24} />
                          <span className="text-[8px] mt-1 font-medium">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-medium cursor-pointer transition-colors">
                        <Upload size={16} />
                        Choose Image
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        PNG, JPG, WebP • Max 2MB
                      </p>

                      {modalMode === 'edit' && selectedAuthor?.picture && !removePicture && (
                        <button
                          type="button"
                          onClick={() => setRemovePicture(true)}
                          className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 mt-2 transition-colors"
                        >
                          <TrashIcon size={14} />
                          Remove current picture
                        </button>
                      )}
                      {removePicture && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2">
                          <CheckCircle2 size={14} />
                          Picture will be removed
                        </div>
                      )}
                    </div>
                  </div>
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
                    {actionLoading ? 'Saving...' : modalMode === 'add' ? 'Add Author' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ============================================================
          DELETE CONFIRMATION
          ============================================================ */}
      {deleteModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[60]" onClick={() => setDeleteModalOpen(false)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 max-w-md w-full shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Author</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Are you sure you want to delete this author? This action cannot be undone.
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