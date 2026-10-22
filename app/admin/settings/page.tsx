'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
  Camera,
  Upload,
  Trash2 as TrashIcon,
  Image as ImageIcon,
  X,
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

interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean | number;
  is_blocked: boolean | number;
  created_at: string;
  picture: string | null; // ✅ Added
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
  const [user, setUser] = useState<UserProfile | null>(null);
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
  
  // ✅ Image State
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPicturePreview(data.user.picture || null);
      setPictureFile(null);
      setRemovePicture(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ✅ Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large. Max 5MB allowed', 'error');
        return;
      }
      setPictureFile(file);
      setRemovePicture(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Handle Image Removal
  const handleRemoveImage = () => {
    setPictureFile(null);
    setPicturePreview(null);
    setRemovePicture(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
      // ✅ Use FormData instead of JSON to support file upload
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('username', formData.username);
      formDataObj.append('email', formData.email);

      if (formData.newPassword) {
        formDataObj.append('currentPassword', formData.currentPassword);
        formDataObj.append('newPassword', formData.newPassword);
      }

      if (pictureFile) {
        formDataObj.append('picture', pictureFile);
      }

      if (removePicture) {
        formDataObj.append('remove_picture', 'true');
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        body: formDataObj, // ✅ Send FormData
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
      setPicturePreview(data.user.picture || null);
      setPictureFile(null);
      setRemovePicture(false);
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

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
            <div className="flex flex-col items-center text-center">
              
              {/* ✅ Profile Picture with Upload Overlay */}
              <div className="relative w-24 h-24 mb-4 group">
                <div className="w-24 h-24 bg-yellow/10 border border-yellow/20 rounded-full flex items-center justify-center overflow-hidden">
                  {picturePreview ? (
                    <Image
                      src={picturePreview}
                      alt={user.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <UserCircle size={48} className="text-yellow" />
                  )}
                </div>
                
                {/* Hover Overlay for Upload */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={24} className="text-white" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Quick Image Controls */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <Upload size={12} /> Change
                </button>
                {picturePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
                  >
                    <TrashIcon size={12} /> Remove
                  </button>
                )}
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

        {/* RIGHT COLUMN - Profile Form */}
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