'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="p-8 max-w-lg mx-auto text-center mt-12">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
        <ShieldAlert size={32} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Access Restricted</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {message || 'You do not have Administrator permissions to view this section. Please contact your site administrator.'}
      </p>
      <div className="mt-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-yellow text-white dark:text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
