'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/admin/layout';

// ✅ CKEditor imports
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  List,
  BlockQuote,
  Link,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageInsert,
  Table,
  TableToolbar,
  Alignment,
  Undo,
  RemoveFormat,
  Paragraph,
} from 'ckeditor5';

// ✅ CKEditor styles
import 'ckeditor5/ckeditor5.css';

import {
  FileText,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  Search,
  X,
  Check,
  Save,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  AlertCircle,
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


interface LegalPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  updated_at: string;
}

export default function LegalPagesPage() {
  const { user } = useAdmin();
  const userRole = user?.role || 'editor';
  const isAdmin = userRole === 'admin';

  const [pages, setPages] = useState<LegalPage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [formData, setFormData] = useState<{ title: string; slug: string; is_published: boolean }>({
    title: '',
    slug: '',
    is_published: true,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/legal-pages?search=${search}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching legal pages:', error);
      showToast('Failed to fetch legal pages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [search]);

  useEffect(() => {
    if (ClassicEditor) {
      setIsEditorReady(true);
    }
  }, []);

  const resetForm = () => {
    setFormData({ title: '', slug: '', is_published: true });
    setEditorContent('');
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setSelectedPage(null);
    setModalOpen(true);
  };

  const openEditModal = (page: LegalPage) => {
    setModalMode('edit');
    setSelectedPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      is_published: page.is_published,
    });
    setEditorContent(page.content || '');
    setFormError(null);
    setModalOpen(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // ✅ CUSTOM UPLOAD ADAPTER - WORKS 100%
  function CustomUploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return {
        upload: () => {
          return new Promise(async (resolve, reject) => {
            try {
              const file = await loader.file;
              
              if (!file) {
                reject('No file selected');
                return;
              }

              if (!file.type.startsWith('image/')) {
                reject('Please upload an image file');
                return;
              }

              if (file.size > 5 * 1024 * 1024) {
                reject('Image too large. Max 5MB allowed');
                return;
              }

              setIsUploading(true);

              const formData = new FormData();
              formData.append('file', file);

              const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
              });

              const data = await response.json();

              if (!response.ok) {
                reject(data.error || 'Upload failed');
                return;
              }

              setIsUploading(false);
              resolve({
                default: data.url,
              });
            } catch (error) {
              setIsUploading(false);
              reject('Upload failed');
            }
          });
        },
        abort: () => {
          setIsUploading(false);
        },
      };
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError(null);

    const content = editorContent;

    if (!content || content === '<p>&nbsp;</p>' || content.trim() === '' || content === '<p></p>') {
      setFormError('Content is required');
      setActionLoading(false);
      return;
    }

    try {
      const body = {
        ...formData,
        content,
        id: selectedPage?.id,
      };

      const res = await fetch('/api/admin/legal-pages', {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save page');

      setModalOpen(false);
      fetchPages();
      showToast(
        modalMode === 'add' ? `Page "${formData.title}" created successfully!` : `Page "${formData.title}" updated successfully!`,
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
      const res = await fetch('/api/admin/legal-pages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget }),
      });

      if (res.ok) {
        const deletedPage = pages.find((p) => p.id === deleteTarget);
        fetchPages();
        showToast(`Page "${deletedPage?.title}" deleted successfully!`, 'success');
      }
    } catch (error) {
      showToast('Failed to delete page', 'error');
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const togglePublish = async (page: LegalPage) => {
    try {
      const res = await fetch('/api/admin/legal-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...page,
          is_published: !page.is_published,
        }),
      });

      if (res.ok) {
        fetchPages();
        showToast(
          page.is_published ? `Page "${page.title}" unpublished` : `Page "${page.title}" published`,
          'info'
        );
      }
    } catch (error) {
      showToast('Failed to toggle publish status', 'error');
    }
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

  // ✅ EDITOR CONFIG WITH CUSTOM UPLOAD ADAPTER
  const editorConfig = {
    licenseKey: 'GPL',
    plugins: [
      Essentials,
      Bold,
      Italic,
      Underline,
      Strikethrough,
      Heading,
      List,
      BlockQuote,
      Link,
      Image,
      ImageToolbar,
      ImageCaption,
      ImageStyle,
      ImageInsert,
      CustomUploadAdapterPlugin, // ✅ CUSTOM UPLOAD ADAPTER
      Table,
      TableToolbar,
      Alignment,
      Undo,
      RemoveFormat,
      Paragraph,
    ],
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'bulletedList',
        'numberedList',
        '|',
        'blockQuote',
        'link',
        '|',
        'insertImage',
        'insertTable',
        '|',
        'alignment',
        '|',
        'undo',
        'redo',
        '|',
        'removeFormat',
      ],
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
      ] as any,
    },
    alignment: {
      options: ['left', 'center', 'right', 'justify'] as any,
    },
    image: {
      toolbar: ['imageStyle:block', 'imageStyle:side', '|', 'imageTextAlternative'],
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
    },
    placeholder: 'Write your legal page content here...',
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <Shield size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-white/40 mt-2">
          You don't have permission to access this page. Admin access required.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText size={24} className="text-yellow" />
            Legal Pages
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Total: <span className="font-bold text-white dark:text-white">{total}</span> pages
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
            onClick={openAddModal}
            className="px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            New Page
          </button>

          <button
            onClick={fetchPages}
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
          placeholder="Search legal pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
        />
      </div>

      {/* PAGES LIST */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <FileText size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">No legal pages found</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors"
            >
              Create your first page
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden sm:table-cell">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{page.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500 dark:text-white/40">/{page.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase border px-2 py-1 ${
                      page.is_published
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}>
                      {page.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-slate-500 dark:text-white/40">
                      {formatDate(page.updated_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => togglePublish(page)}
                        className={`p-2 transition-colors ${
                          page.is_published
                            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                            : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10'
                        }`}
                        title={page.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {page.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => openEditModal(page)}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        title="Edit page"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete page"
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

      {/* ===== ADD/EDIT MODAL ===== */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">
              
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === 'add' ? 'Create Legal Page' : 'Edit Legal Page'}
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
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          title: e.target.value,
                          slug: modalMode === 'add' ? generateSlug(e.target.value) : formData.slug,
                        });
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      Slug *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-white/30 shrink-0">/</span>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Content *
                  </label>
                  <div className="border border-slate-200 dark:border-white/10 overflow-hidden min-h-[350px] sm:min-h-[400px]">
                    {isEditorReady ? (
                      <CKEditor
                        editor={ClassicEditor}
                        config={editorConfig}
                        data={editorContent}
                        onChange={(event: any, editor: any) => {
                          const data = editor.getData();
                          setEditorContent(data);
                        }}
                      />
                    ) : (
                      <div className="h-[350px] sm:h-[400px] bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                        <Loader2 size={24} className="animate-spin text-yellow mr-2" />
                        Loading editor...
                      </div>
                    )}
                  </div>
                  {isUploading && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-yellow">
                      <Loader2 size={16} className="animate-spin" />
                      Uploading image...
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="w-4 h-4 accent-yellow"
                    />
                    Published
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
                    disabled={actionLoading}
                    className="w-full sm:flex-1 py-2.5 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {actionLoading ? 'Saving...' : modalMode === 'add' ? 'Create Page' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ===== DELETE CONFIRMATION ===== */}
      {deleteModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[60]" onClick={() => setDeleteModalOpen(false)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Legal Page</h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Are you sure you want to delete this page? This action cannot be undone.
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