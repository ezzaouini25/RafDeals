'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import {
  Star,
  Search,
  CheckCircle2,
  Edit2,
  Loader2,
} from 'lucide-react';

interface ReviewItem {
  id: number;
  author_name: string;
  author_email: string;
  title: string | null;
  content: string;
  rating: number | null;
  is_approved: boolean | number;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApprove = async (id: number, currentApproved: boolean) => {
    try {
      await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_approved: !currentApproved }),
      });
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (r: ReviewItem) => {
    setEditingReview(r);
    setEditContent(r.content);
    setEditRating(r.rating || 5);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    try {
      await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingReview.id, content: editContent, rating: editRating }),
      });
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.author_name.toLowerCase().includes(search.toLowerCase()) ||
      r.author_email.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'pending') return matchesSearch && !r.is_approved;
    if (statusFilter === 'approved') return matchesSearch && r.is_approved;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Star className="text-sky-500 fill-sky-500" size={24} />
            <span>Offer Reviews Moderation</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Approve user star ratings and offer reviews. (Reviews are retained for historical logs).
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
            <span className="text-xs font-semibold uppercase">Loading Reviews...</span>
          </div>
        ) : paginatedReviews.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold">No reviews found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Reviewer</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Review Text</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Approve / Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-400">#{r.id}</td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{r.author_name}</div>
                      <div className="text-[11px] text-slate-400">{r.author_email}</div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1 font-bold text-amber-500">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span>{r.rating || 5}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-800 dark:text-slate-200 max-w-md line-clamp-2">{r.content}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          r.is_approved
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {r.is_approved ? 'Approved' : 'Pending Review'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleApprove(r.id, Boolean(r.is_approved))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            r.is_approved
                              ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                              : 'bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400'
                          }`}
                        >
                          {r.is_approved ? 'Reject / Hide' : 'Approve'}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Review"
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
          totalItems={filteredReviews.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={editingReview !== null}
        onClose={() => setEditingReview(null)}
        title={editingReview ? `Edit Review #${editingReview.id}` : ''}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Rating Stars</label>
            <input
              type="number"
              min="1"
              max="5"
              value={editRating}
              onChange={(e) => setEditRating(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-yellow"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Review Text</label>
            <textarea
              rows={5}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-yellow"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setEditingReview(null)}
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
