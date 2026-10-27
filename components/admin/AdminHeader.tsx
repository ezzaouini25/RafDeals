'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, Bell, LogOut, Settings, ChevronDown, RefreshCw, Loader2,
  LayoutDashboard, FileText, Star, MessageSquare, Users,
  Sparkles, ShieldCheck, Zap, Grid3x3, MessageCircle, Quote,
  Clock, CheckCircle2, MailCheck, Tag, BarChart3, Megaphone, Code2, Scale, Handshake,
  UserLock, UserRoundPen, Boxes
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
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

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  link: string;
  read: boolean;
}

interface NotificationCounts {
  comments: number;
  testimonials: number;
  reviews: number;
  contacts: number;
}

interface SubscriptionNotification {
  id: number;
  email: string;
  created_at: string;
}

interface AdminHeaderProps {
  notifications?: any;
  isMobile?: boolean;
  userRole: 'admin' | 'editor';
  userName: string;
  userPicture?: string | null; // ✅ Added
  onLogout: () => void;
  onRefresh?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

function MobileSubMenuItem({ item, pathname, onClose }: { item: any; pathname: string; onClose: () => void }) {
  const [subOpen, setSubOpen] = useState(false);
  const isSubActive = item.subItems.some((subItem: any) => 
    pathname === subItem.href || pathname?.startsWith(subItem.href + '/')
  );

  useEffect(() => {
    if (isSubActive) setSubOpen(true);
  }, [isSubActive]);

  const Icon = item.icon;

  return (
    <div className="w-full">
      <button
        onClick={() => setSubOpen(!subOpen)}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
          isSubActive ? 'bg-yellow text-slate-950 font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon size={18} />
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${subOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {subOpen && (
        <div className="ml-6 space-y-0.5 border-l border-white/10 pl-3">
          {item.subItems.map((subItem: any) => {
            const isSubActive = pathname === subItem.href || pathname?.startsWith(subItem.href + '/');
            const SubIcon = subItem.icon;
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                  isSubActive ? 'bg-yellow text-slate-950 font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <SubIcon size={16} />
                <span>{subItem.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileMenuItem({ item, pathname, onClose }: { item: any; pathname: string; onClose: () => void }) {
  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
        isActive ? 'bg-yellow text-slate-950 font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      {item.label || item.title}
      {item.adminOnly && (
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 bg-yellow/20 text-yellow border border-yellow/20">
          ADMIN
        </span>
      )}
    </Link>
  );
}

export default function AdminHeader({ 
  userRole, 
  userName, 
  userPicture, // ✅ Added
  onLogout, 
  onRefresh,
  onToggleSidebar,
  sidebarCollapsed
}: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({ comments: 0, testimonials: 0, reviews: 0, contacts: 0 });
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionNotification[]>([]);
  const [subCount, setSubCount] = useState(0);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const pathname = usePathname();

  // ✅ Check if we are on the login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setSubscriptionsOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  const menuItems: Array<{
    title: string;
    href: string;
    icon: any;
    adminOnly: boolean;
    isSubMenu?: boolean;
    subItems?: any[];
  }> = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, adminOnly: false },
    { title: 'Offers', href: '/admin/offers', icon: Boxes, adminOnly: false },
    { title: 'Deals', href: '/admin/deals', icon: Tag, adminOnly: false },
    { title: 'Articles', href: '/admin/articles', icon: FileText, adminOnly: false },
    { title: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
    { title: 'Contacts', href: '/admin/contacts', icon: MessageSquare, adminOnly: false },
    { title: 'Members Area', href: '/admin/members', icon: MessageCircle, adminOnly: false },
    { title: 'Advertisements', href: '/admin/advertisements', icon: Megaphone, adminOnly: true },
    { title: 'Sponsors', href: '/admin/sponsors', icon: Handshake, adminOnly: true },
  ];

  const visibleItems = menuItems.filter((item) => !item.adminOnly || userRole === 'admin');

  // ✅ PERF: memoized so the effects below have stable identities
  const fetchNotifications = useCallback(async () => {
    // ✅ Don't fetch if on login page
    if (isLoginPage) return;

    setLoading(true);
    try {
      // ✅ cache: 'no-store' for authenticated data; removed the
      //    no-op `Cache-Control: no-cache` header (browsers ignore it).
      const res = await fetch('/api/admin/notifications?status=unread', {
        cache: 'no-store',
      });

      // ✅ Silent fail on 401/403 (logged out)
      if (res.status === 401 || res.status === 403) return;

      if (res.ok) {
        const data = await res.json();
        setNotifications((data.notifications || []).filter((n: NotificationItem) => !n.read));
        setCounts(data.counts || { comments: 0, testimonials: 0, reviews: 0, contacts: 0 });
        setTotalUnread(data.totalUnread || 0);
      }
    } catch (error) {
      // ✅ Silent fail - no console error to avoid spam
    } finally {
      setLoading(false);
    }
  }, [isLoginPage]);

  // ✅ PERF: memoized
  const fetchSubscriptions = useCallback(async () => {
    // ✅ Don't fetch if on login page
    if (isLoginPage) return;

    setLoadingSubs(true);
    try {
      const res = await fetch('/api/admin/subscriptions/notifications', {
        cache: 'no-store',
      });

      // ✅ Silent fail on 401/403
      if (res.status === 401 || res.status === 403) return;

      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.notifications || []);
        setSubCount(data.total || 0);
      }
    } catch (error) {
      // ✅ Silent fail
    } finally {
      setLoadingSubs(false);
    }
  }, [isLoginPage]);

  const markAsRead = async (notification: NotificationItem) => {
    try {
      const [type, id] = notification.id.split('_');
      const res = await fetch('/api/admin/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: parseInt(id) }),
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setTotalUnread(prev => Math.max(0, prev - 1));
      }
    } catch (error) { }
  };

  const markSubAsRead = async (id: number) => {
    try {
      const res = await fetch('/api/admin/subscriptions/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
        setSubCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) { }
  };

  const markAllAsRead = async () => {
    for (const notification of notifications) {
      if (!notification.read) await markAsRead(notification);
    }
  };

  // ============================================================
  // ✅ PERF: split polling — notifications every 5 min,
  //    subscriptions every 10 min. Pauses when tab is hidden,
  //    refetches once on visibility change.
  //    Before: 2 fetches every 30s = 240 calls/hour/tab.
  //    After:  ~30 calls/hour/tab (24 + 6).
  // ============================================================
  useEffect(() => {
    if (isLoginPage) return;

    // Initial fetch pair
    fetchNotifications();
    fetchSubscriptions();

    const notificationsInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 5 * 60 * 1000); // 5 minutes

    const subscriptionsInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSubscriptions();
      }
    }, 10 * 60 * 1000); // 10 minutes

    // ✅ Refetch immediately when the admin comes back to the tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
        fetchSubscriptions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(notificationsInterval);
      clearInterval(subscriptionsInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isLoginPage, fetchNotifications, fetchSubscriptions]);

  const displayName = userName || 'User';

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname?.startsWith('/admin/offers')) return 'Offers';
    if (pathname?.startsWith('/admin/deals')) return 'Deals';
    if (pathname?.startsWith('/admin/articles')) return 'Articles';
    if (pathname?.startsWith('/admin/testimonials')) return 'Testimonials';
    if (pathname?.startsWith('/admin/comments')) return 'Comments';
    if (pathname?.startsWith('/admin/reviews')) return 'Reviews';
    if (pathname?.startsWith('/admin/users')) return 'Users';
    if (pathname?.startsWith('/admin/members')) return 'Members Area';
    if (pathname?.startsWith('/admin/settings')) return 'Settings';
    if (pathname?.startsWith('/admin/counters')) return 'Live Counters';
    if (pathname?.startsWith('/admin/ads')) return 'Advertisements';
    if (pathname?.startsWith('/admin/sponsors')) return 'Sponsors';
    if (pathname?.startsWith('/admin/header-scripts')) return 'Header Scripts';
    if (pathname?.startsWith('/admin/legal-pages')) return 'Legal Pages';
    if (pathname?.startsWith('/admin/contacts')) return 'Contacts';
    if (pathname?.startsWith('/admin/subscriptions')) return 'Subscriptions';
    return 'Admin Panel';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare size={14} className="text-amber-400" />;
      case 'testimonial': return <Quote size={14} className="text-purple-400" />;
      case 'review': return <Star size={14} className="text-yellow-400" />;
      case 'contact': return <MessageCircle size={14} className="text-blue-400" />;
      default: return <Bell size={14} />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-14 sm:h-16">

          {/* LEFT SECTION */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* ✅ Desktop Toggle Button - ALWAYS VISIBLE */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden lg:flex p-2 -ml-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Grid3x3 size={20} />
              </button>
            )}

            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-[120px] sm:max-w-none">
                {getPageTitle()}
              </h1>
              {pathname === '/admin' && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-yellow/20 text-yellow text-[10px] font-bold uppercase tracking-wider border border-yellow/30">
                  <Sparkles size={10} />
                  Live
                </span>
              )}
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2">
            <Link
              href="/admin/categories"
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors relative"
              aria-label="Categories"
            >
              <Tag size={18} className="sm:w-[20px] sm:h-[20px]" />
            </Link>

            <Link
              href="/admin/authors"
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors relative"
              aria-label="Authors"
            >
              <UserRoundPen size={18} className="sm:w-[20px] sm:h-[20px]" />
            </Link>

            {/* Subscription Icon */}
            <div className="relative">
              <button
                onClick={() => setSubscriptionsOpen(!subscriptionsOpen)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors relative"
                aria-label="Subscriptions"
              >
                <MailCheck size={18} className="sm:w-[20px] sm:h-[20px]" />
                {subCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-navy">
                    {subCount > 9 ? '9+' : subCount}
                  </span>
                )}
              </button>

              {subscriptionsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSubscriptionsOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[400px] bg-navy border border-white/10 shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <span className="text-sm font-bold text-white">
                        New Subscribers ({subCount})
                      </span>
                      <button onClick={fetchSubscriptions} className="p-1 text-white/40 hover:text-white transition-colors">
                        <RefreshCw size={14} className={loadingSubs ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                      {loadingSubs ? (
                        <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-yellow" /></div>
                      ) : subscriptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-white/40">
                          <CheckCircle2 size={32} className="mb-2" /><span className="text-sm">No new subscribers</span><span className="text-xs">Last 12 hours</span>
                        </div>
                      ) : (
                        subscriptions.map((sub) => (
                          <Link key={sub.id} href="/admin/subscriptions" onClick={() => { markSubAsRead(sub.id); setSubscriptionsOpen(false); }} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5">
                            <MailCheck size={14} className="text-emerald-400 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white">New Subscriber</p>
                              <p className="text-xs text-white/60 truncate">{sub.email}</p>
                              <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1"><Clock size={10} />{formatTimeAgo(sub.created_at)}</p>
                            </div>
                            <div className="w-2 h-2 bg-yellow rounded-full shrink-0 mt-1" />
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-white/10 text-center">
                      <Link href="/admin/subscriptions" className="text-xs text-white/40 hover:text-white transition-colors">View all subscribers</Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell size={18} className="sm:w-[20px] sm:h-[20px]" />
                {totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-navy">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[400px] bg-navy border border-white/10 shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <span className="text-sm font-bold text-white">Unread ({totalUnread})</span>
                      <div className="flex items-center gap-2">
                        {totalUnread > 0 && <button onClick={markAllAsRead} className="text-[10px] font-bold text-yellow hover:text-yellow/80 transition-colors">Mark all read</button>}
                        <button onClick={fetchNotifications} className="p-1 text-white/40 hover:text-white transition-colors"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                      {loading ? (
                        <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-yellow" /></div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-white/40">
                          <CheckCircle2 size={32} className="mb-2" /><span className="text-sm">All caught up!</span><span className="text-xs">No unread notifications</span>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link key={notification.id} href={notification.link} onClick={() => { markAsRead(notification); setNotificationsOpen(false); }} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5">
                            <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white">{notification.title}</p>
                              <p className="text-xs text-white/60 truncate">{notification.message}</p>
                              <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1"><Clock size={10} />{formatTimeAgo(notification.time)}</p>
                            </div>
                            <div className="w-2 h-2 bg-yellow rounded-full shrink-0 mt-1" />
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-white/10 text-center">
                      <Link href="/admin/notifications" className="text-xs text-white/40 hover:text-white transition-colors">View all</Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 p-1 hover:bg-white/10 transition-colors"
              >
                {/* ✅ Avatar: picture if present, letter otherwise */}
                {userPicture ? (
                  <Image
                    src={userPicture}
                    alt={displayName}
                    width={32}
                    height={32}
                    className="w-7 h-7 sm:w-8 sm:h-8 border border-white/50 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow text-slate-950 font-bold flex items-center justify-center text-xs sm:text-sm shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <ChevronDown size={14} className="hidden sm:block text-white/50" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-navy border border-white/10 shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      {/* ✅ Dropdown header — avatar + name */}
                      <div className="flex items-center gap-3">
                        {userPicture ? (
                          <Image
                            src={userPicture}
                            alt={displayName}
                            width={40}
                            height={40}
                            className="w-10 h-10 border border-white/10 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-yellow text-slate-950 font-bold flex items-center justify-center text-sm shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{displayName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-medium text-white/60">{userRole || 'User'}</span>
                            <span className="w-1 h-1 bg-white/20" />
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow uppercase tracking-wider"><ShieldCheck size={10} />Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/admin/counters"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <BarChart3 size={16} />
                      Live Counters
                    </Link>

                    <Link
                      href="/admin/header-scripts"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Code2 size={16} />
                      Header Scripts
                    </Link>

                    <Link
                      href="/admin/legal-pages"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Scale size={16} />
                      Legal Pages
                    </Link>

                    <div className="h-px bg-white/10 my-1" />

                    <Link
                      href="/admin/suspend"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <UserLock size={16} />
                      Suspend
                    </Link>

                    <Link
                      href="/admin/subscriptions"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <MailCheck size={16} />
                      Subscriptions
                    </Link>

                    <Link
                      href="/admin/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors border-t border-white/10"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MOBILE NAVIGATION ===== */}
      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 top-14 sm:top-16 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="lg:hidden fixed top-14 sm:top-16 left-0 bottom-0 w-72 bg-navy border-r border-white/10 z-40 overflow-y-auto shadow-xl animate-slide-in [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {/* ✅ Mobile drawer avatar */}
                {userPicture ? (
                  <Image
                    src={userPicture}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="w-10 h-10 border border-white/10 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-yellow text-slate-950 font-bold flex items-center justify-center text-sm shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-white">{displayName}</p>
                  <p className="text-xs text-white/50">{userRole || 'User'}</p>
                </div>
              </div>
            </div>
            <nav className="p-3 space-y-1">
              {visibleItems.map((item) => {
                if (item.isSubMenu) {
                  return <MobileSubMenuItem key={item.title} item={item} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />;
                }
                return <MobileMenuItem key={item.href} item={item} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />;
              })}
              <div className="h-px bg-white/10 my-2" />
              <Link href="/" target="_blank" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                <Zap size={18} />View Website
              </Link>
              <button onClick={() => { setMobileMenuOpen(false); onLogout(); }} className="flex items-center gap-3 w-full px-4 py-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors mt-1">
                <LogOut size={18} />Logout
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  );
}