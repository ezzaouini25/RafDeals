'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/admin/layout';
import {
  BarChart3,
  RefreshCw,
  Loader2,
  Save,
  X,
  Shield,
  Tag,
  FileText,
  MousePointerClick,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit,
  Eye,
  EyeOff,
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

interface CounterData {
  id: number;
  total_offers: number;
  total_deals: number;
  total_articles: number;
  total_clicks: number;
  is_live: boolean;
  updated_at: string;
}

export default function CountersPage() {
  const { user } = useAdmin();
  const userRole = user?.role || 'editor';
  const isAdmin = userRole === 'admin';

  const [data, setData] = useState<CounterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<CounterData>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchCounters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/counters', { cache: 'no-store' });
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setFormData(result);
      } else {
        showToast('Failed to fetch counters', 'error');
      }
    } catch (error) {
      console.error('Error fetching counters:', error);
      showToast('Failed to fetch counters', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounters();
  }, []);

  const handleSave = async () => {
    if (!formData.id) {
      showToast('Missing counter id — refresh the page', 'error');
      return;
    }

    setSaving(true);
    try {
      // Send ONLY the fields that exist in the DB after migration
      const payload = {
        id: formData.id,
        total_offers:    formData.total_offers    ?? 0,
        total_deals:     formData.total_deals     ?? 0,
        total_articles:  formData.total_articles  ?? 0,
        total_clicks:    formData.total_clicks    ?? 0,
        is_live:         formData.is_live ?? true,
      };

      const res = await fetch('/api/admin/counters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setData(updated);
        setFormData(updated);
        setEditMode(false);
        showToast('Counters updated successfully!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(
          err.detail ? `Failed: ${err.detail}` : 'Failed to update counters',
          'error'
        );
      }
    } catch (error) {
      showToast('Failed to update counters', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CounterData, value: number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-yellow" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-yellow" />
            Live Counters
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Publicly displayed metrics on homepage hero/stats bar
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
            onClick={fetchCounters}
            className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* STATUS */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`px-3 py-1 text-xs font-bold uppercase border flex items-center gap-2 ${
          data?.is_live
            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        }`}>
          {data?.is_live ? (
            <>
              <Eye size={14} />
              Live
            </>
          ) : (
            <>
              <EyeOff size={14} />
              Offline
            </>
          )}
        </span>
        <span className="text-xs text-slate-500 dark:text-white/30">
          Last updated: {data?.updated_at ? new Date(data.updated_at).toLocaleString() : 'Never'}
        </span>
      </div>

      {/* COUNTERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Offers */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">Offers (Active)</p>
            <Tag size={18} className="text-yellow" />
          </div>
          {editMode ? (
            <input
              type="number"
              value={formData.total_offers ?? 0}
              onChange={(e) => handleInputChange('total_offers', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-2xl font-bold focus:border-yellow focus:ring-1 focus:ring-yellow"
            />
          ) : (
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatNumber(data?.total_offers || 0)}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-white/30 mt-1">
            Auto: <code>COUNT(offers WHERE is_active=1)</code>
          </p>
        </div>

        {/* Deals */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">Deals (Active)</p>
            <FileText size={18} className="text-yellow" />
          </div>
          {editMode ? (
            <input
              type="number"
              value={formData.total_deals ?? 0}
              onChange={(e) => handleInputChange('total_deals', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-2xl font-bold focus:border-yellow focus:ring-1 focus:ring-yellow"
            />
          ) : (
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatNumber(data?.total_deals || 0)}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-white/30 mt-1">
            Auto: <code>COUNT(deals WHERE is_active=1)</code>
          </p>
        </div>

        {/* Articles */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">Articles (Active)</p>
            <FileText size={18} className="text-yellow" />
          </div>
          {editMode ? (
            <input
              type="number"
              value={formData.total_articles ?? 0}
              onChange={(e) => handleInputChange('total_articles', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-2xl font-bold focus:border-yellow focus:ring-1 focus:ring-yellow"
            />
          ) : (
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatNumber(data?.total_articles || 0)}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-white/30 mt-1">
            Auto: <code>COUNT(articles WHERE is_active=1)</code>
          </p>
        </div>

        {/* Clicks */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">Total Clicks</p>
            <MousePointerClick size={18} className="text-yellow" />
          </div>
          {editMode ? (
            <input
              type="number"
              value={formData.total_clicks ?? 0}
              onChange={(e) => handleInputChange('total_clicks', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-2xl font-bold focus:border-yellow focus:ring-1 focus:ring-yellow"
            />
          ) : (
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatNumber(data?.total_clicks || 0)}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-white/30 mt-1">
            Auto: <code>SUM(offers.clicks) + SUM(deals.clicks)</code>
          </p>
        </div>


        {/* Info card */}
        <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 p-6 flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-1">
            Info
          </p>
          <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
            All 5 counters above are <strong>auto-maintained by triggers</strong> on your offers, deals, articles and comments tables. Editing a value here will be overwritten the next time the corresponding table changes.
          </p>
        </div>
      </div>

      {/* LIVE TOGGLE */}
      {editMode && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_live ?? true}
              onChange={(e) => handleInputChange('is_live', e.target.checked)}
              className="w-5 h-5 accent-yellow"
            />
            <span className="flex items-center gap-2">
              {formData.is_live ? (
                <>
                  <Eye size={16} className="text-green-500" />
                  Live on homepage
                </>
              ) : (
                <>
                  <EyeOff size={16} className="text-amber-500" />
                  Hidden from homepage
                </>
              )}
            </span>
          </label>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 dark:border-white/10 pt-6">
        {editMode ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setEditMode(false);
                setFormData(data || {});
              }}
              className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="px-6 py-2.5 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center gap-2"
          >
            <Edit size={16} />
            Edit Counters
          </button>
        )}
      </div>

    </div>
  );
}