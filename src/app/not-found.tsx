'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="p-6 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 mb-6 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        <Shield className="w-16 h-16" />
      </div>
      <h1 className="text-5xl font-black tracking-wide text-white mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-300 mb-4">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mb-8">
        The target display page or route you requested could not be located on the KarateTech display server.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition"
      >
        <Home className="w-4 h-4 stroke-[2.5]" /> Return to Admin Dashboard
      </Link>
    </div>
  );
}
