'use client';

import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  Play,
  X,
  ShieldCheck,
  Share2,
  Tv,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Tournament, Sponsor } from '@/lib/types';
import { SpLogo } from '../ui/SpLogo';
import { KarateMascotAnimation } from './KarateMascotAnimation';

interface TournamentBannerModalProps {
  tournament: Tournament | null;
  sponsors: Sponsor[];
  onClose: () => void;
  autoCloseSeconds?: number;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const TournamentBannerModal: React.FC<TournamentBannerModalProps> = ({
  tournament,
  sponsors,
  onClose,
  autoCloseSeconds = 0,
  onToggleFullscreen,
  isFullscreen = false,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!autoCloseSeconds || autoCloseSeconds <= 0) return;

    const totalMs = autoCloseSeconds * 1000;
    const intervalMs = 100;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percentLeft = Math.max(0, 100 - (elapsed / totalMs) * 100);
      setProgress(percentLeft);

      if (elapsed >= totalMs) {
        clearInterval(timer);
        onClose();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoCloseSeconds, onClose]);

  if (!tournament) return null;

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen bg-slate-950/95 backdrop-blur-2xl p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden select-none animate-fade-in relative">
      {/* Ambient background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* REALISTIC ANIMATED KARATE ATHLETES DOING COMBAT MOVES */}
      <KarateMascotAnimation position="both" />

      {/* SINGLE PAGE CONTAINER (100% Viewport Height - ZERO Scrolling) */}
      <div className="w-full max-w-6xl mx-auto h-full flex flex-col justify-between relative z-40">
        
        {/* TOP STATUS BAR */}
        <div className="flex items-center justify-between shrink-0 py-2 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              ACTIVE DISPLAY TARGET
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Tv className="w-4 h-4 text-cyan-400" /> Live Broadcast Screen
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-2 transition"
                title={isFullscreen ? 'Exit Fullscreen Mode' : 'Enter Fullscreen Mode'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Close & Enter Live Presentation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HERO HEADER SECTION (Logo + Title + Organizer) */}
        <div className="my-auto flex flex-col justify-center gap-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden bg-slate-900/80">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-black border-2 border-cyan-500/60 p-2 shrink-0 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              <img
                src={tournament.logo}
                alt={tournament.name}
                className="max-w-full max-h-full object-contain filter drop-shadow-lg"
              />
            </div>

            <div className="flex-1 text-center md:text-left min-w-0">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-tight leading-none drop-shadow-md">
                {tournament.name}
              </h1>

              {tournament.organizer && (
                <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-cyan-400 font-bold text-sm sm:text-base tracking-wide">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>Organized by {tournament.organizer}</span>
                </div>
              )}

              {/* Quick Info Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-xs sm:text-sm font-semibold text-slate-200">
                <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  {tournament.date}
                </span>
                <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  {tournament.venue}
                </span>
                {tournament.facebookInstagram && (
                  <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 font-mono">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    {tournament.facebookInstagram}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3-COLUMN DETAILS GRID (VENUE, CONTACTS, HIGHLIGHTS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Venue & Location */}
            <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block mb-1">
                  VENUE & LOCATION ARENA
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  {tournament.venue}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tournament.address || 'Full address available upon check-in.'}
                </p>
              </div>
            </div>

            {/* Event Summary */}
            <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block mb-1">
                  EVENT HIGHLIGHTS
                </span>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {tournament.description || 'Official Karate Competition & Championship Showcase.'}
                </p>
              </div>
            </div>

            {/* Coordination Contacts */}
            <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block mb-1">
                  CONTACT & COORDINATION
                </span>
                <div className="space-y-1 text-xs text-slate-300">
                  {tournament.contactPerson && (
                    <p className="font-semibold text-white truncate">Contact: {tournament.contactPerson}</p>
                  )}
                  {tournament.phoneNumber && (
                    <p className="flex items-center gap-1.5 text-slate-400 truncate">
                      <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> {tournament.phoneNumber}
                    </p>
                  )}
                  {tournament.email && (
                    <p className="flex items-center gap-1.5 text-slate-400 truncate">
                      <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> {tournament.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SPONSOR WALL ROW (SINGLE ROW, NO SCROLLING) */}
          {sponsors.length > 0 && (
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> OFFICIAL EVENT SPONSORS
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">{sponsors.length} Active Partners</span>
              </div>
              <div className="flex items-center justify-start gap-4 overflow-hidden">
                {sponsors.slice(0, 6).map((sp) => (
                  <div
                    key={sp.id}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0"
                  >
                    <img src={sp.logo} alt={sp.name} className="h-6 max-w-[90px] object-contain" />
                    <span className="text-xs font-semibold text-slate-300 truncate max-w-[110px]">
                      {sp.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION FOOTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <SpLogo size="sm" />
            <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
              SP SportData Solution Live Presentation System
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 transition"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Display'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current stroke-none" />
              <span>START LIVE PRESENTATION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
