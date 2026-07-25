'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Trophy,
  Film,
  MonitorPlay,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import { getSponsors, saveSponsors, getTournaments, saveTournaments, getPlaylist, savePlaylist } from '@/lib/storage';
import { Sponsor, Tournament, PlaylistItem, ActiveTab, ToastMessage } from '@/lib/types';
import { SponsorManager } from '@/components/sponsors/SponsorManager';
import { TournamentManager } from '@/components/tournaments/TournamentManager';
import { PlaylistManager } from '@/components/playlist/PlaylistManager';
import { ToastContainer } from '@/components/ui/Toast';
import { OpenTournamentDisplayButton } from '@/components/karatetech/OpenTournamentDisplayButton';
import { SpLogo } from '@/components/ui/SpLogo';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load initial storage state
  useEffect(() => {
    setSponsors(getSponsors());
    setTournaments(getTournaments());
    setPlaylist(getPlaylist());
  }, []);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for storage updates
  const handleSaveSponsors = (updated: Sponsor[]) => {
    setSponsors(updated);
    saveSponsors(updated);
  };

  const handleSaveTournaments = (updated: Tournament[]) => {
    setTournaments(updated);
    saveTournaments(updated);
  };

  const handleSavePlaylist = (updated: PlaylistItem[]) => {
    setPlaylist(updated);
    savePlaylist(updated);
  };

  const handleLaunchDisplay = () => {
    window.open('/display', '_blank', 'noopener,noreferrer');
  };

  // Active counts for dashboard cards
  const activeSponsorsCount = sponsors.filter((s) => !s.isDeleted && s.active).length;
  const activeTournamentObj = tournaments.find((t) => !t.isDeleted && t.active);
  const playlistItemsCount = playlist.filter((p) => !p.isDeleted && p.active).length;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Branding */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer group hover:opacity-90 transition"
          >
            <SpLogo size="md" />
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <OpenTournamentDisplayButton variant="glass" />
            <button
              onClick={handleLaunchDisplay}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <MonitorPlay className="w-4 h-4 stroke-[2.5]" /> Launch Display Screen
            </button>
          </div>
        </div>
      </header>

      {/* TOP SUB-NAV BAR */}
      <div className="bg-slate-950/60 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 py-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" /> Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'sponsors'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Sponsor Management ({activeSponsorsCount})
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'tournaments'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" /> Tournament Details
          </button>
          <button
            onClick={() => setActiveTab('playlist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'playlist'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Film className="w-4 h-4" /> Display Playlist ({playlistItemsCount})
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* PAGE TITLE & SUBTITLE */}
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> Sports-Tech Control Center
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Tournament Display Management
                  </h1>
                  <p className="mt-2 text-base text-slate-300 leading-relaxed">
                    Manage tournament display content, sponsors, videos, and public presentation screens.
                  </p>
                </div>
              </div>

              {/* 4 LARGE DASHBOARD CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD 1: Sponsor Management */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  onClick={() => setActiveTab('sponsors')}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] cursor-pointer group transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-4 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 font-bold">
                      {activeSponsorsCount} Active
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                      Sponsor Management
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Upload sponsor logos, manage external URLs, sequence display orders, and soft-delete items.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400">
                    <span>Configure Sponsors</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </motion.div>

                {/* CARD 2: Tournament Details */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  onClick={() => setActiveTab('tournaments')}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] cursor-pointer group transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-4 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 font-bold truncate max-w-[140px]">
                      {activeTournamentObj ? activeTournamentObj.name : 'No Active Event'}
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                      Tournament Details
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Set up event info, venues, date ranges, organizer profiles, and enforce single active tournament.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400">
                    <span>Manage Tournament</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </motion.div>

                {/* CARD 3: Display Playlist */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  onClick={() => setActiveTab('playlist')}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] cursor-pointer group transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-4 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition">
                      <Film className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 font-bold">
                      {playlistItemsCount} Media Items
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                      Display Playlist
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Upload MP4/WebM videos, JPG/PNG slide images, set custom slideshow durations, and reorder.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400">
                    <span>Edit Playlist</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </motion.div>

                {/* CARD 4: Launch Public Display */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  onClick={handleLaunchDisplay}
                  className="glass-panel p-6 rounded-2xl border border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.15)] cursor-pointer group transition-all relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-4 rounded-2xl bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition">
                      <MonitorPlay className="w-8 h-8 stroke-[2.5]" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-400 text-black text-xs font-bold tracking-wider uppercase">
                      Live Presentation
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                      Launch Public Display
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      Open borderless public screen at <code className="text-cyan-400 font-mono">/display</code> with continuous loop, video playback, and floating controls.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-cyan-500/30 flex items-center justify-between text-xs font-extrabold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      Launch Screen Window <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </motion.div>
              </div>

              {/* INTEGRATION SECTION DEMO */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-white">KarateTech Integration Component</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Standalone Ready
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  This component opens the active tournament presentation screen directly:
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <code className="text-xs font-mono text-cyan-300">
                    window.open("/display", "_blank", "noopener,noreferrer");
                  </code>
                  <OpenTournamentDisplayButton />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sponsors' && (
            <motion.div
              key="sponsors"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <SponsorManager
                sponsors={sponsors}
                onSave={handleSaveSponsors}
                addToast={addToast}
              />
            </motion.div>
          )}

          {activeTab === 'tournaments' && (
            <motion.div
              key="tournaments"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <TournamentManager
                tournaments={tournaments}
                onSave={handleSaveTournaments}
                addToast={addToast}
              />
            </motion.div>
          )}

          {activeTab === 'playlist' && (
            <motion.div
              key="playlist"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <PlaylistManager
                playlist={playlist}
                onSave={handleSavePlaylist}
                addToast={addToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SP SportData Solution</span>
            <span>&bull;</span>
            <span>Tournament Display Management</span>
          </div>
          <div>Precision. Speed. Results.</div>
        </div>
      </footer>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
