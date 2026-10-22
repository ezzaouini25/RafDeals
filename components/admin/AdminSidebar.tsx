'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  FileText,
  Users,
  MessageSquare,
  Handshake,
  MessageCircle,
  Megaphone,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  userRole: 'admin' | 'editor';
  userName: string;
  userEmail: string;
  userPicture?: string | null; // ✅ Added
  onLogout: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AdminSidebar({ 
  userRole, 
  userName, 
  userPicture, // ✅ Added
  onLogout,
  isMobileOpen = false,
  onMobileClose,
  collapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [subMenuOpen, setSubMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // ✅ Under 1024px (Tablets & Mobile) uses the Drawer
      setIsMobile(window.innerWidth < 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const isInSubMenu = pathname?.startsWith('/admin/members') || 
                        pathname?.startsWith('/admin/reviews') || 
                        pathname?.startsWith('/admin/testimonials');
    if (isInSubMenu) {
      setSubMenuOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  }, [pathname, isMobile, onMobileClose]);

  const menuItems = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, adminOnly: false },
    { title: 'Offers', href: '/admin/offers', icon: Boxes, adminOnly: false },
    { title: 'Deals', href: '/admin/deals', icon: ShoppingCart, adminOnly: false },
    { title: 'Articles', href: '/admin/articles', icon: FileText, adminOnly: false },
    { title: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
    { title: 'Contacts', href: '/admin/contacts', icon: MessageSquare, adminOnly: false },
    { title: 'Members Area', href: '/admin/members', icon: MessageCircle, adminOnly: false },
    { title: 'Advertisements', href: '/admin/advertisements', icon: Megaphone, adminOnly: true },
    { title: 'Sponsors', href: '/admin/sponsors', icon: Handshake, adminOnly: true },
  ];

  const visibleItems = menuItems.filter((item) => !item.adminOnly || userRole === 'admin');

  const renderNavItem = (item: any) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-yellow text-slate-950'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title={collapsed ? item.title : undefined}
      >
        <Icon size={collapsed ? 20 : 18} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate text-sm">{item.title}</span>
            {item.adminOnly && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-yellow/20 text-yellow border border-yellow/20">
                ADMIN
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  // ===== MOBILE & TABLET SIDEBAR (Drawer Overlay) =====
  if (isMobile && isMobileOpen) {
    return (
      <>
        <div 
          className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40"
          onClick={onMobileClose}
        />
        <aside className="fixed top-16 left-0 bottom-0 w-[280px] max-w-[85vw] bg-slate-950 border-r border-slate-800 z-40 flex flex-col animate-slide-in overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/50">
            <div className="flex items-center gap-3">
              {/* ✅ Mobile Avatar */}
              {userPicture ? (
                <Image
                  src={userPicture}
                  alt={userName}
                  width={40}
                  height={40}
                  className="w-10 h-10 border border-white/70 object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-slate-800 border border-slate-700 text-yellow font-bold flex items-center justify-center text-sm shrink-0">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{userName || 'User'}</p>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border mt-0.5 ${
                  userRole === 'admin'
                    ? 'bg-yellow/10 text-yellow border-yellow/20'
                    : 'bg-slate-700/50 text-slate-300 border-slate-600'
                }`}>
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {visibleItems.map((item) => renderNavItem(item))}
          </nav>

          <div className="p-3 border-t border-slate-800 space-y-1.5 bg-slate-950/50">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 hover:text-white hover:bg-slate-800 transition-colors rounded w-full"
            >
              <ExternalLink size={15} />
              View Website
            </Link>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors rounded w-full text-left"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </aside>
      </>
    );
  }

  // ===== DESKTOP SIDEBAR =====
  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 bg-slate-950 border-r border-slate-800 text-slate-300 h-full z-10 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="h-16 flex items-center justify-center px-3 border-b border-slate-800 bg-slate-950/80 relative">
        {!collapsed ? (
          // ✅ When expanded: Show Logo + Close Button
          <>
            <span className="flex items-center gap-2 font-bold text-white">
              <Image 
                src="/img/banner.png" 
                alt="RafDeals" 
                width={140} 
                height={35} 
                className="h-8 w-auto object-contain"
              />
            </span>
            <button
              onClick={onToggleCollapse}
              className="absolute right-3 p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors shrink-0 rounded"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          // ✅ When collapsed: Hide Logo, Show ONLY Open Button in Center
          <button
            onClick={onToggleCollapse}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded"
            title="Expand Sidebar"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <div className="p-3 border-b border-slate-800/80 bg-slate-950/50">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          {/* ✅ Desktop Avatar */}
          {userPicture ? (
            <Image
              src={userPicture}
              alt={userName}
              width={36}
              height={36}
              className="w-9 h-9 border border-white/70 object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 bg-slate-800 border border-slate-700 text-yellow font-bold flex items-center justify-center text-sm shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{userName || 'User'}</p>
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border mt-0.5 ${
                userRole === 'admin'
                  ? 'bg-yellow/10 text-yellow border-yellow/20'
                  : 'bg-slate-700/50 text-slate-300 border-slate-600'
              }`}>
                {userRole}
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {visibleItems.map((item) => renderNavItem(item))}
      </nav>

      <div className={`p-3 border-t border-slate-800 space-y-1.5 bg-slate-950/50 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <Link
          href="/"
          target="_blank"
          className={`flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 hover:text-white hover:bg-slate-800 transition-colors rounded w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <ExternalLink size={15} className="shrink-0" />
          {!collapsed && <span>View Website</span>}
        </Link>
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors rounded w-full text-left ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}