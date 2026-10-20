'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  User,
  Mail,
  UserCircle,
  Lock,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
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
    success: <CheckCircle size={20} className="text-green-500" />,
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

function X({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean | number;
  is_blocked: boolean | number;
  created_at: string;
}

const getRoleIcon = (role: string) => {
  const icons: Record<string, any> = {
    admin: ShieldAlert,
    editor: ShieldCheck,
    user: Shield,
  };
  return icons[role] || Shield;
};

const getRoleBadgeColor = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    editor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    user: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };
  return colors[role] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }
      
      const data = await res.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || '',
        username: data.user.username || '',
        email: data.user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Validate
    if (!formData.name || !formData.username || !formData.email) {
      setFormError('Name, username, and email are required');
      setSaving(false);
      return;
    }

    // Validate password if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setFormError('Current password is required to change password');
        setSaving(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setFormError('New password must be at least 6 characters');
        setSaving(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setFormError('New passwords do not match');
        setSaving(false);
        return;
      }
    }

    try {
      const body: any = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
      };

      if (formData.newPassword) {
        body.currentPassword = formData.currentPassword;
        body.newPassword = formData.newPassword;
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data.user);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      setFormError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-yellow" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 dark:text-white/40">
        <UserCircle size={48} className="mb-3 opacity-30" />
        <p className="text-sm font-medium text-slate-600 dark:text-white/60">User not found</p>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings size={24} className="text-yellow" />
            Profile Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            Manage your account information
          </p>
        </div>

        <button
          onClick={fetchProfile}
          className="p-2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Refresh profile"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* MAIN CONTENT - FULL WIDTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-yellow/10 border border-yellow/20 rounded-full flex items-center justify-center mb-4">
                <UserCircle size={48} className="text-yellow" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.name}
              </h2>
              <p className="text-sm text-slate-500 dark:text-white/40">
                @{user.username}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                  <RoleIcon size={12} />
                  {getRoleDisplay(user.role)}
                </span>
                <span className={`inline-flex items-center px-3 py-1 text-xs font-medium border ${
                  user.is_active === 1 || user.is_active === true
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {user.is_active === 1 || user.is_active === true ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="w-full mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
                <p className="text-xs text-slate-500 dark:text-white/30">
                  Member since {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Profile Form (takes 2/3 of space) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 space-y-5">
            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                {formError}
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-4 flex items-center gap-2">
                <User size={16} className="text-yellow" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Username *
                  </label>
                  <div className="relative">
                    <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Your username"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-5">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-4 flex items-center gap-2">
                <Key size={16} className="text-yellow" />
                Change Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/40 mb-4">
                Leave fields empty to keep current password
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto px-8 py-3 bg-yellow text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}