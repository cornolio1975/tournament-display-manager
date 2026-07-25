'use client';

import React from 'react';
import { MonitorPlay, ExternalLink } from 'lucide-react';

interface OpenTournamentDisplayButtonProps {
  url?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'glass';
}

/**
 * Reusable KarateTech Integration / Display Button Component
 * Opens the active tournament presentation screen (/display).
 */
export const OpenTournamentDisplayButton: React.FC<OpenTournamentDisplayButtonProps> = ({
  url = '/display',
  className = '',
  variant = 'primary',
}) => {
  const handleClick = () => {
    // Open the live presentation screen (/display)
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md';
      case 'glass':
        return 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/10';
      default:
        return 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold shadow-lg shadow-cyan-500/25';
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      title="Open active tournament display screen (/display)"
      className={`inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${getVariantStyles()} ${className}`}
    >
      <MonitorPlay className="w-4 h-4 stroke-[2.5]" />
      <span className="text-sm tracking-wide">Open Tournament Display</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-0.5" />
    </button>
  );
};
