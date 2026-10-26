'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { Loader2 } from 'lucide-react';
import '../globals.css';

interface AdminUserSession {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'editor';
  picture: string | null;
}

interface AdminContextType {
  user: AdminUserSession | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export const useAdmin = () => useContext(AdminContext);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/admin/login';

  // ============================================================
  // MOBILE DETECTION
  // ============================================================
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // ============================================================
  // FETCH SESSION
  // ============================================================
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/admin/auth/me', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      setUser(null);
      sessionStorage.removeItem('admin_user');
      router.push('/admin/login');
    } catch {
      router.push('/admin/login');
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // ============================================================
  // ✅ BUG 1 FIXED: Only fetch session when NOT on the login page.
  // The login page renders instantly — no /me call, no hang.
  // ============================================================
  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }
    fetchSession();
  }, [pathname, isLoginPage]);

  // ============================================================
  // ✅ BUG 2 FIXED: Only redirect ONCE. No infinite loop.
  // If user is null and not on login page → redirect.
  // If already on login page → do nothing.
  // ============================================================
  useEffect(() => {
    if (loading) return;
    if (isLoginPage) return;
    if (user) return;

    // ✅ Only redirect if not already navigating there
    router.replace('/admin/login');
  }, [loading, user, isLoginPage, router]);

  // ============================================================
  // RENDER: LOADING
  // (only shown for admin pages, never for the login page)
  // ============================================================
  if (loading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-yellow mb-3" />
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Loading Admin Console...
        </p>
      </div>
    );
  }

  // ============================================================
  // RENDER: LOGIN PAGE (bare, no sidebar, no header)
  // ============================================================
  if (isLoginPage) {
    return (
      <AdminContext.Provider
        value={{ user, loading, refreshUser: fetchSession, logout }}
      >
        {children}
      </AdminContext.Provider>
    );
  }

  // ============================================================
  // RENDER: NOT AUTHENTICATED (brief — before redirect kicks in)
  // ============================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm font-medium">
        Redirecting to login...
      </div>
    );
  }

  // ============================================================
  // RENDER: AUTHENTICATED ADMIN
  // ============================================================
  return (
    <AdminContext.Provider
      value={{ user, loading, refreshUser: fetchSession, logout }}
    >
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <AdminSidebar
          userRole={user?.role || 'editor'}
          userName={user?.name || user?.username || 'User'}
          userEmail={user?.email || ''}
          onLogout={logout}
          collapsed={sidebarCollapsed}
          userPicture={user?.picture || null}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <AdminHeader
            userRole={user?.role || 'editor'}
            userName={user?.name || 'User'}
            userPicture={user?.picture || null}
            onLogout={logout}
            onRefresh={fetchSession}
            onToggleSidebar={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            notifications={{
              comments: 0,
              reviews: 0,
              testimonials: 0,
              contacts: 0,
            }}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}