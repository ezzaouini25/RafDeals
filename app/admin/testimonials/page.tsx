'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import {
  Quote,
  Search,
  CheckCircle2,
  Edit2,
  Loader2,
} from 'lucide-react';

interface TestimonialItem {
  id: number;
  author_name: string;
  author_email: string;
  title: string | null;
  content: string;
  rating: number | null;
  is_approved: boolean | number;
  created_at: string;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/testimonials');
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data.testimonials || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleToggleApprove = async (id: number, currentApproved: boolean) => {
    try {
      await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_approved: !currentApproved }),
      });
      fetchTestimonials();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (t: TestimonialItem) => {
    setEditingTestimonial(t);
    setEditContent(t.content);
  };

  const handleSaveEdit = async () => {
    if (!editingTestimonial) return;
    try {
      await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTestimonial.id, content: editContent }),
      });
      setEditingTestimonial(null);
      fetchTestimonials();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTestimonials = testimonials.filter((t) => {
    const matchesSearch =
      t.author_name.toLowerCase().includes(search.toLowerCase()) ||
      t.author_email.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'pending') return matchesSearch && !t.is_approved;
    if (statusFilter === 'approved') return matchesSearch && t.is_approved;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredTestimonials.length / pageSize) || 1;
  const paginatedTestimonials = filteredTestimonials.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Quote className="text-purple-500" size={24} />
            <span>Earning Testimonials Moderation</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Approve or edit earnings proof & user testimonials displayed on the homepage.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search author, email, or content..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-yellow"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter:</span>
          {(['all', 'pending', 'approved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-yellow dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow mb-2" />
            <span className="text-xs font-semibold uppercase">Loading Testimonials...</span>
          </div>
        ) : paginatedTestimonials.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold">No testimonials found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Testimonial Story</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Approve / Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedTestimonials.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-400">#{t.id}</td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{t.author_name}</div>
                      <div className="text-[11px] text-slate-400">{t.author_email}</div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-800 dark:text-slate-200 max-w-md line-clamp-2">{t.content}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          t.is_approved
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {t.is_approved ? 'Approved' : 'Pending Review'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleApprove(t.id, Boolean(t.is_approved))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            t.is_approved
                              ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                              : 'bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400'
                          }`}
                        >
                          {t.is_approved ? 'Reject / Hide' : 'Approve'}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Testimonial"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTestimonials.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={editingTestimonial !== null}
        onClose={() => setEditingTestimonial(null)}
        title={editingTestimonial ? `Edit Testimonial #${editingTestimonial.id}` : ''}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Testimonial Story</label>
            <textarea
              rows={5}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-yellow"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setEditingTestimonial(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-5 py-2 rounded-xl bg-yellow text-slate-950 text-xs font-black hover:bg-amber-300"
            >
              Save Text
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
