'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/admin/layout';
import {
  Code2,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Save,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  AlertCircle,
  Hash,
  Link as LinkIcon,
  FileCode,
  Terminal,
  Tag,
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
    success: <CheckCircle2 size={20} className="text-green-500" />,
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

interface HeaderScript {
  id: number;
  name: string;
  placement: 'head_open' | 'head_close' | 'body_open' | 'body_close';
  payload: any;
  raw_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PLACEMENT_LABELS = {
  head_open: 'Head (Start)',
  head_close: 'Head (End)',
  body_open: 'Body (Start)',
  body_close: 'Body (End)',
};

const PLACEMENT_ICONS = {
  head_open: <Tag size={14} className="text-amber-400" />,
  head_close: <Tag size={14} className="text-amber-400" />,
  body_open: <Tag size={14} className="text-blue-400" />,
  body_close: <Tag size={14} className="text-blue-400" />,
};

const TYPE_ICONS = {
  meta: <Hash size={14} className="text-purple-400" />,
  script: <FileCode size={14} className="text-yellow-400" />,
  link: <LinkIcon size={14} className="text-cyan-400" />,
  noscript: <Terminal size={14} className="text-rose-400" />,
};

export default function HeaderScriptsPage() {
  const { user } = useAdmin();
  const userRole = user?.role || 'editor';
  const isAdmin = userRole === 'admin';

  const [scripts, setScripts] = useState<HeaderScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedScript, setSelectedScript] = useState<HeaderScript | null>(null);
  const [formData, setFormData] = useState<Partial<HeaderScript>>({
    name: '',
    placement: 'head_close',
    payload: null,
    raw_code: '',
    is_active: true,
  });
  const [usePayload, setUsePayload] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/header-scripts', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setScripts(data.scripts || []);
      }
    } catch (error) {
      console.error('Error fetching header scripts:', error);
      showToast('Failed to fetch header scripts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      placement: 'head_close',
      payload: null,
      raw_code: '',
      is_active: true,
    });
    setUsePayload(false);
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setSelectedScript(null);
    setModalOpen(true);
  };

  const openEditModal = (script: HeaderScript) => {
    setModalMode('edit');
    setSelectedScript(script);
    setFormData({
      name: script.name,
      placement: script.placement,
      payload: script.payload,
      raw_code: script.raw_code,
      is_active: script.is_active,
    });
    setUsePayload(!!script.payload);
    setFormError(null);
    setModalOpen(true);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setActionLoading(true);
  setFormError(null);

  // ✅ Validate: either raw_code or payload is provided
  if (!formData.raw_code && !formData.payload) {
    setFormError('Either Raw Code or Payload is required');
    setActionLoading(false);
    return;
  }

  try {
    // ✅ Prepare the data
    const body: any = {
      name: formData.name,
      placement: formData.placement || 'head_close',
      is_active: formData.is_active !== false,
    };

    // ✅ Only send raw_code if it exists
    if (formData.raw_code) {
      body.raw_code = formData.raw_code;
    }

    // ✅ Only send payload if it exists and is valid
    if (usePayload && formData.payload) {
      // If payload is a string, try to parse it
      if (typeof formData.payload === 'string') {
        try {
          JSON.parse(formData.payload);
          body.payload = formData.payload;
        } catch (e) {
          setFormError('Invalid JSON format. Please check your payload.');
          setActionLoading(false);
          return;
        }
      } else {
        body.payload = formData.payload;
      }
    }

    if (modalMode === 'edit' && selectedScript) {
      body.id = selectedScript.id;
    }

    const url = '/api/admin/header-scripts';
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to save script');
    }

    setModalOpen(false);
    fetchScripts();
    showToast(
      modalMode === 'add' ? `Script "${formData.name}" created successfully!` : `Script "${formData.name}" updated successfully!`,
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
      const res = await fetch('/api/admin/header-scripts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget }),
      });

      if (res.ok) {
        fetchScripts();
        showToast('Script deleted successfully!', 'success');
      }
    } catch (error) {
      showToast('Failed to delete script', 'error');
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (script: HeaderScript) => {
    try {
      const res = await fetch('/api/admin/header-scripts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...script,
          is_active: !script.is_active,
        }),
      });

      if (res.ok) {
        fetchScripts();
        showToast(
          script.is_active ? `Script "${script.name}" disabled` : `Script "${script.name}" enabled`,
          'info'
        );
      }
    } catch (error) {
      showToast('Failed to toggle script status', 'error');
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

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <Shield size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-white/40 mt-2">
          You dont have permission to access this page. Admin access required.
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
            <Code2 size={24} className="text-yellow" />
            Header Scripts
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Total: <span className="font-bold text-white dark:text-white">{scripts.length}</span> scripts
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
            Add Script
          </button>

          <button
            onClick={fetchScripts}
            className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* INFO BOX */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 p-4 flex items-start gap-3">
        <div className="mt-0.5 text-blue-600 dark:text-blue-400">
          <Code2 size={18} />
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold">How Header Scripts Work</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            Scripts added here will be injected into your website layout.
            Use <strong>Raw Code</strong> for direct HTML/JS or <strong>JSON Payload</strong> for structured data.
            Scripts are placed in the <strong>Head</strong> or <strong>Body</strong> based on the placement you choose.
          </p>
        </div>
      </div>

      {/* SCRIPTS LIST */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : scripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <Code2 size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">No header scripts found</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors"
            >
              Add your first script
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Placement
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Type
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
              {scripts.map((script) => (
                <tr key={script.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{script.name}</p>
                    <p className="text-xs text-slate-500 dark:text-white/30 truncate max-w-[120px]">
                      {script.raw_code ? script.raw_code.substring(0, 30) + '...' : JSON.stringify(script.payload).substring(0, 30) + '...'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {PLACEMENT_ICONS[script.placement]}
                      <span className="text-xs text-slate-500 dark:text-white/40">
                        {PLACEMENT_LABELS[script.placement] || script.placement}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {script.payload ? TYPE_ICONS.meta : TYPE_ICONS.script}
                      <span className="text-xs text-slate-500 dark:text-white/40">
                        {script.payload ? 'JSON Payload' : 'Raw Code'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase border px-2 py-1 ${
                      script.is_active
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}>
                      {script.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-slate-500 dark:text-white/40">
                      {formatDate(script.updated_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(script)}
                        className={`p-2 transition-colors ${
                          script.is_active
                            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                            : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10'
                        }`}
                        title={script.is_active ? 'Disable' : 'Enable'}
                      >
                        {script.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => openEditModal(script)}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        title="Edit script"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(script.id)}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete script"
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
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
              
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <Code2 size={20} className="text-yellow" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {modalMode === 'add' ? 'Add Header Script' : 'Edit Header Script'}
                  </h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Script Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    placeholder="e.g., Google Analytics"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      Placement
                    </label>
                    <select
                      value={formData.placement || 'head_close'}
                      onChange={(e) => setFormData({ ...formData, placement: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    >
                      <option value="head_open">Head (Start)</option>
                      <option value="head_close">Head (End)</option>
                      <option value="body_open">Body (Start)</option>
                      <option value="body_close">Body (End)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      Script Type
                    </label>
                    <div className="flex gap-4 mt-1.5">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70">
                        <input
                          type="radio"
                          checked={!usePayload}
                          onChange={() => setUsePayload(false)}
                          className="w-4 h-4 accent-yellow"
                        />
                        Raw Code
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70">
                        <input
                          type="radio"
                          checked={usePayload}
                          onChange={() => setUsePayload(true)}
                          className="w-4 h-4 accent-yellow"
                        />
                        JSON Payload
                      </label>
                    </div>
                  </div>
                </div>

                {usePayload ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      JSON Payload *
                    </label>
                    <textarea
                      required
                      value={formData.payload ? JSON.stringify(formData.payload, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setFormData({ ...formData, payload: parsed });
                          setFormError(null);
                        } catch (error) {
                          setFormData({ ...formData, payload: e.target.value });
                        }
                      }}
                      rows={8}
                      className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                      placeholder='{
  "type": "script",
  "src": "https://example.com/script.js",
  "async": true
}'
                    />
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/30 mb-1">
                        Examples:
                      </p>
                      <div className="space-y-1 text-xs text-slate-600 dark:text-white/50 font-mono">
                        <div>{"{ \"type\": \"meta\", \"name\": \"google-site-verification\", \"content\": \"xxx\" }"}</div>
                        <div>{"{ \"type\": \"script\", \"src\": \"https://example.com/script.js\", \"async\": true }"}</div>
                        <div>{"{ \"type\": \"link\", \"rel\": \"preconnect\", \"href\": \"https://fonts.googleapis.com\" }"}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      Raw Code *
                    </label>
                    <textarea
                      required
                      value={formData.raw_code || ''}
                      onChange={(e) => setFormData({ ...formData, raw_code: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                      placeholder='<meta name="google-site-verification" content="your-code" />'
                    />
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/30 mb-1">
                        Examples:
                      </p>
                      <div className="space-y-1 text-xs text-slate-600 dark:text-white/50 font-mono">
                        <div>{'<meta name="google-site-verification" content="xxx" />'}</div>
                        <div>{'<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXX"></script>'}</div>
                        <div>{'<link rel="preconnect" href="https://fonts.googleapis.com" />'}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70">
                    <input
                      type="checkbox"
                      checked={formData.is_active !== false}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-yellow"
                    />
                    Active (Script will be injected into the layout)
                  </label>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {actionLoading ? 'Saving...' : modalMode === 'add' ? 'Add Script' : 'Save Changes'}
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Script</h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Are you sure you want to delete this script? This action cannot be undone.
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