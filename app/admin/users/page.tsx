'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/admin/layout';
import type { User, UserFormData } from '@/types';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  Search,
  X,
  Eye,
  EyeOff,
  Shield,
  User as UserIcon,
  Mail,
  Clock,
  Key,
  Save,
  Ban,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Unlock,
  CheckCircle2,
  AlertCircle,
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

export default function UsersPage() {
  const { user: currentUser } = useAdmin();
  const userRole = currentUser?.role || 'editor';
  const isAdmin = userRole === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'change_password'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    name: '',
    password: '',
    role: 'user',
    is_active: true,
    is_blocked: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${search}&page=${page}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, page]);

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      name: '',
      password: '',
      role: 'user',
      is_active: true,
      is_blocked: false,
    });
    setFormError(null);
    setShowPassword(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setSelectedUser(null);
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      name: user.name || '',
      password: '',
      role: user.role,
      is_active: user.is_active,
      is_blocked: user.is_blocked,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openChangePasswordModal = (user: User) => {
    setModalMode('change_password');
    setSelectedUser(user);
    setFormData({ ...formData, password: '' });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError(null);

    try {
      let url = '/api/admin/users';
      let method = 'POST';
      let body: any = { ...formData };

      if (modalMode === 'edit' && selectedUser) {
        method = 'PUT';
        body.id = selectedUser.id;
        if (!body.password) delete body.password;
      } else if (modalMode === 'change_password' && selectedUser) {
        method = 'PATCH';
        body = { id: selectedUser.id, password: formData.password };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user');

      setModalOpen(false);
      fetchUsers();
      
      if (modalMode === 'add') {
        showToast(`User "${formData.username}" created successfully!`, 'success');
      } else if (modalMode === 'edit') {
        showToast(`User "${formData.username}" updated successfully!`, 'success');
      } else if (modalMode === 'change_password') {
        showToast(`Password updated for "${selectedUser?.username}"!`, 'success');
      }
    } catch (error: any) {
      setFormError(error.message);
      showToast(error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ BLOCK USER: is_active = 0, is_blocked = 1
  const handleBlock = async (user: User) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: false,
          is_blocked: true,
        }),
      });

      if (res.ok) {
        fetchUsers();
        showToast(`User "${user.username}" has been blocked!`, 'success');
      } else {
        showToast('Failed to block user', 'error');
      }
    } catch (error) {
      showToast('Failed to block user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ UNBLOCK USER: is_active = 1, is_blocked = 0
  const handleUnblock = async (user: User) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: true,
          is_blocked: false,
        }),
      });

      if (res.ok) {
        fetchUsers();
        showToast(`User "${user.username}" has been unblocked!`, 'success');
      } else {
        showToast('Failed to unblock user', 'error');
      }
    } catch (error) {
      showToast('Failed to unblock user', 'error');
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
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget }),
      });
      if (res.ok) {
        const deletedUser = users.find(u => u.id === deleteTarget);
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget));
        fetchUsers();
        showToast(`User "${deletedUser?.username}" deleted successfully!`, 'success');
      }
    } catch (error) {
      showToast('Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; className: string }> = {
      admin: { label: 'Admin', className: 'bg-yellow/10 text-yellow border-yellow/20' },
      editor: { label: 'Editor', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      user: { label: 'User', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    };
    return roles[role] || roles.user;
  };

  const getStatusBadge = (is_active: boolean, is_blocked: boolean) => {
    if (is_blocked) {
      return { label: 'Blocked', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    }
    if (is_active) {
      return { label: 'Active', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
    }
    return { label: 'Inactive', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
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
      {/* Toast */}
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
            <Users size={24} className="text-yellow" />
            Users
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Total: <span className="font-bold text-white dark:text-white">{total}</span> users
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
            <UserPlus size={16} />
            Add User
          </button>

          <button
            onClick={fetchUsers}
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
          placeholder="Search by name, username, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
        />
      </div>

      {/* USERS TABLE */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-yellow" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-white/40">
            <Users size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-600 dark:text-white/60">
              No users found
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden sm:table-cell">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {users.map((user) => {
                const role = getRoleBadge(user.role);
                const status = getStatusBadge(user.is_active, user.is_blocked);
                const isBlocked = user.is_blocked;
                
                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                          {(user.name || user.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {user.name || user.username}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-white/40">
                            @{user.username} • {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase border px-2 py-1 ${role.className}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase border px-2 py-1 ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/40">
                        <Clock size={12} />
                        {formatTimeAgo(user.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          title="Edit user"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openChangePasswordModal(user)}
                          className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          title="Change password"
                        >
                          <Key size={16} />
                        </button>
                        
                        {/* ✅ BLOCK / UNBLOCK BUTTON */}
                        {isBlocked ? (
                          <button
                            onClick={() => handleUnblock(user)}
                            className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                            title="Unblock user"
                          >
                            <Unlock size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlock(user)}
                            className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                            title="Block user"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                        
                        {/* ✅ DELETE BUTTON */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          title="Delete user"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-4">
          <p className="text-xs text-slate-500 dark:text-white/30 order-2 sm:order-1">
            Showing {users.length} of {total} users
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

      {/* ===== ADD/EDIT USER MODAL ===== */}
      {modalOpen && (modalMode === 'add' || modalMode === 'edit') && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === 'add' ? 'Add New User' : 'Edit User'}
                </h2>
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
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Password {modalMode === 'add' ? '*' : '(leave blank to keep current)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={modalMode === 'add'}
                      className="w-full px-4 pr-12 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  >
                    <option value="user">User</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-yellow"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70">
                    <input
                      type="checkbox"
                      checked={formData.is_blocked}
                      onChange={(e) => setFormData({ ...formData, is_blocked: e.target.checked })}
                      className="w-4 h-4 accent-rose-500"
                    />
                    Blocked
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
                    {actionLoading ? 'Saving...' : modalMode === 'add' ? 'Add User' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ===== CHANGE PASSWORD MODAL ===== */}
      {modalOpen && modalMode === 'change_password' && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 max-w-md w-full shadow-2xl">
              
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key size={20} className="text-yellow" />
                  Change Password
                </h2>
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
                    User
                  </label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {selectedUser.name || selectedUser.username} ({selectedUser.email})
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 pr-12 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                    {actionLoading ? 'Updating...' : 'Update Password'}
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Delete User
                </h3>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-6">
                  Are you sure you want to delete this user? This action cannot be undone.
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