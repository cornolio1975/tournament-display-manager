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
  ListOrdered,
} from 'lucide-react';
import { getSponsors, saveSponsors, getTournaments, saveTournaments, getPlaylist, savePlaylist } from '@/lib/storage';
import { Sponsor, Tournament, PlaylistItem, ActiveTab, ToastMessage } from '@/lib/types';
import { SponsorManager } from '@/components/sponsors/SponsorManager';
import { TournamentManager } from '@/components/tournaments/TournamentManager';
import { PlaylistManager } from '@/components/playlist/PlaylistManager';
import { DisplayPlaylistModal } from '@/components/playlist/DisplayPlaylistModal';
import { ToastContainer } from '@/components/ui/Toast';
import { OpenTournamentDisplayButton } from '@/components/karatetech/OpenTournamentDisplayButton';
import { KarateTechSyncPanel } from '@/components/karatetech/KarateTechSyncPanel';
import { SpLogo } from '@/components/ui/SpLogo';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDisplayPlaylistModalOpen, setIsDisplayPlaylistModalOpen] = useState(false);

  const loadData = async () => {
    setSponsors(await getSponsors());
    setTournaments(await getTournaments());
    setPlaylist(await getPlaylist());
  };

  // Load initial state & subscribe to real-time cross-platform updates
  useEffect(() => {
    loadData();

    const handleDataChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleDataChange);
    window.addEventListener('ts_sponsors_updated', handleDataChange);
    window.addEventListener('ts_tournaments_updated', handleDataChange);
    window.addEventListener('ts_playlist_updated', handleDataChange);
    window.addEventListener('ts_display_playlists_updated', handleDataChange);

    return () => {
      window.removeEventListener('storage', handleDataChange);
      window.removeEventListener('ts_sponsors_updated', handleDataChange);
      window.removeEventListener('ts_tournaments_updated', handleDataChange);
      window.removeEventListener('ts_playlist_updated', handleDataChange);
      window.removeEventListener('ts_display_playlists_updated', handleDataChange);
    };
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
  const handleSaveSponsors = async (updated: Sponsor[]) => {
    setSponsors(updated);
    await saveSponsors(updated);
  };

  const handleSaveTournaments = async (updated: Tournament[]) => {
    setTournaments(updated);
    await saveTournaments(updated);
  };

  const handleSavePlaylist = async (updated: PlaylistItem[]) => {
    setPlaylist(updated);
    await savePlaylist(updated);
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
            <button
              onClick={() => setIsDisplayPlaylistModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-cyan-400 font-extrabold text-xs tracking-wide shadow-md transition"
            >
              <ListOrdered className="w-4 h-4 stroke-[2.5]" /> Manage Playlists
            </button>
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
            <Film className="w-4 h-4" /> Media Playlist ({playlistItemsCount})
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            {/* HERO STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TOURNAMENT CARD */}
              <div
                onClick={() => setActiveTab('tournaments')}
                className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Active Tournament
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white mt-4 line-clamp-1">
                  {activeTournamentObj ? activeTournamentObj.name : 'No Active Event'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {activeTournamentObj ? activeTournamentObj.venue : 'Configure active championship event'}
                </p>
                <div className="flex items-center gap-1 text-xs font-bold text-cyan-400 mt-4 group-hover:translate-x-1 transition">
                  <span>Manage Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* SPONSOR CARD */}
              <div
                onClick={() => setActiveTab('sponsors')}
                className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Active Sponsors
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-black text-white">{activeSponsorsCount}</span>
                  <span className="text-xs text-slate-400">Logos Displaying</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Sponsor wall ticker overlay on broadcast</p>
                <div className="flex items-center gap-1 text-xs font-bold text-cyan-400 mt-4 group-hover:translate-x-1 transition">
                  <span>Manage Sponsors</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* PLAYLIST ENGINE CARD */}
              <div
                onClick={() => setIsDisplayPlaylistModalOpen(true)}
                className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-900/50 border border-cyan-500/30 hover:border-cyan-400 transition cursor-pointer group shadow-lg shadow-cyan-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 group-hover:scale-110 transition">
                    <ListOrdered className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Database Playlists
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-black text-white">Multi-Slide</span>
                  <span className="text-xs text-cyan-300 font-bold">Rotation Player</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Scoreboards, Brackets, Medals, Kata & Schedule</p>
                <div className="flex items-center gap-1 text-xs font-bold text-cyan-400 mt-4 group-hover:translate-x-1 transition">
                  <span>Open Playlist Manager</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* KARATETECH LIVE BRIDGE */}
            <KarateTechSyncPanel onSynced={loadData} />

            {/* QUICK ACTIONS BANNER */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-extrabold uppercase tracking-wider mb-3">
                  <Zap className="w-3.5 h-3.5" /> KarateTech Presentation Engine v2.5
                </div>
                <h2 className="text-2xl font-black text-white">
                  Ready to stream live tournament results?
                </h2>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">
                  Launch full-screen broadcast mode to project real-time scoreboards, WKF Kata scores, brackets, and sponsor logos onto spectator displays.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setIsDisplayPlaylistModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-extrabold text-sm flex items-center justify-center gap-2 transition"
                >
                  <ListOrdered className="w-4 h-4 text-cyan-400" /> Manage Playlists
                </button>
                <button
                  onClick={handleLaunchDisplay}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm tracking-wide shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
                >
                  <MonitorPlay className="w-5 h-5 stroke-[2.5]" /> Launch Display Screen
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sponsors' && (
          <SponsorManager
            sponsors={sponsors}
            onSave={handleSaveSponsors}
            addToast={addToast}
          />
        )}

        {activeTab === 'tournaments' && (
          <TournamentManager
            tournaments={tournaments}
            onSave={handleSaveTournaments}
            addToast={addToast}
          />
        )}

        {activeTab === 'playlist' && (
          <PlaylistManager
            playlist={playlist}
            onSave={handleSavePlaylist}
            addToast={addToast}
          />
        )}
      </main>

      {/* DISPLAY PLAYLIST MANAGEMENT MODAL */}
      <DisplayPlaylistModal
        isOpen={isDisplayPlaylistModalOpen}
        onClose={() => setIsDisplayPlaylistModalOpen(false)}
        addToast={addToast}
      />

      {/* TOAST NOTIFICATION CONTAINER */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
