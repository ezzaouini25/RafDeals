'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/admin/layout';
import AccessDenied from '@/components/admin/AccessDenied';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import { Megaphone, Plus, Edit2, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';

interface AdItem {
  id: number;
  placement_location: string;
  title: string;
  ad_code: string;
  is_active: boolean | number;
  created_at: string;
}

export default function AdminAdsPage() {
  const { user } = useAdmin();
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [deletingAdId, setDeletingAdId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    placement_location: 'header_banner',
    ad_code: '<div className="ad-box">Ad Banner Content</div>',
    is_active: true,
  });

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ads');
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAds();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return <AccessDenied message="Advertisement management is restricted to Administrators." />;
  }

  const handleOpenAdd = () => {
    setEditingAd(null);
    setFormData({
      title: '',
      placement_location: 'header_banner',
      ad_code: '<!-- Insert Google AdSense or Custom Banner HTML here -->',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ad: AdItem) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      placement_location: ad.placement_location,
      ad_code: ad.ad_code,
      is_active: Boolean(ad.is_active),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        const res = await fetch('/api/admin/ads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingAd.id, ...formData }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchAds();
        }
      } else {
        const res = await fetch('/api/admin/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchAds();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (ad: AdItem) => {
    try {
      await fetch('/api/admin/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ad.id, is_active: !ad.is_active }),
      });
      fetchAds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/admin/ads?id=${id}`, { method: 'DELETE' });
      setDeletingAdId(null);
      fetchAds();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone className="text-amber-500" size={24} />
            <span>Advertisements & Banners</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Configure header banners, sidebar ads, and article in-feed advertisement placements.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow text-slate-950 font-black rounded-xl text-xs hover:bg-amber-300 transition-all shadow-md shadow-yellow/10 min-h-[42px]"
        >
          <Plus size={16} />
          <span>New Ad Unit</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow mb-2" />
            <span className="text-xs font-semibold uppercase">Loading Ad Units...</span>
          </div>
        ) : ads.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold">No advertisements configured.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Ad Title</th>
                  <th className="p-4">Placement Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-400">#{ad.id}</td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{ad.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{ad.ad_code}</div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                        {ad.placement_location}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(ad)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase transition-colors ${
                          ad.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {ad.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{ad.is_active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(ad)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Ad Unit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingAdId(ad.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete Ad Unit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAd ? `Edit Ad Unit #${editingAd.id}` : 'Create New Ad Unit'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Ad Unit Name</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Top Header Banner 728x90"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-yellow"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Placement Location</label>
            <select
              value={formData.placement_location}
              onChange={(e) => setFormData({ ...formData, placement_location: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-yellow"
            >
              <option value="header_banner">Header Top Banner</option>
              <option value="sidebar">Sidebar Widget</option>
              <option value="article_infeed">Article In-Feed Banner</option>
              <option value="footer_banner">Footer Banner</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">HTML / JavaScript Ad Code</label>
            <textarea
              rows={6}
              value={formData.ad_code}
              onChange={(e) => setFormData({ ...formData, ad_code: e.target.value })}
              placeholder="<script>... AdSense or Custom HTML ...</script>"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-yellow"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-yellow focus:ring-yellow"
              />
              <span>Ad Unit Enabled</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-yellow text-slate-950 text-xs font-black hover:bg-amber-300"
            >
              Save Ad Unit
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deletingAdId !== null}
        onClose={() => setDeletingAdId(null)}
        title="Confirm Delete Ad Unit"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm">
          <p>Are you sure you want to delete this ad unit? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeletingAdId(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => deletingAdId && handleDelete(deletingAdId)}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
