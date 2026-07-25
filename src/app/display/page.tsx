'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, X, Trophy, Shield, Film, Sparkles, MapPin, Calendar, Repeat, SkipForward, SkipBack, Scaling, ZoomIn, ZoomOut } from 'lucide-react';
import { getSponsors, getActiveTournament, getPlaylist } from '@/lib/storage';
import { Sponsor, Tournament, PlaylistItem } from '@/lib/types';
import { SpLogo } from '@/components/ui/SpLogo';
import { TournamentBannerModal } from '@/components/display/TournamentBannerModal';

export default function PublicDisplayPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Playback & UI controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoopingAll, setIsLoopingAll] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  // Screen Sizing & Zoom Controls
  const [fitMode, setFitMode] = useState<'cover' | 'contain' | 'fill'>('cover');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Load screen config from storage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('sp_display_screen_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.fitMode) setFitMode(parsed.fitMode);
        if (parsed.zoomLevel) setZoomLevel(parsed.zoomLevel);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateScreenConfig = (newFit?: 'cover' | 'contain' | 'fill', newZoom?: number) => {
    const targetFit = newFit !== undefined ? newFit : fitMode;
    const targetZoom = newZoom !== undefined ? newZoom : zoomLevel;
    if (newFit !== undefined) setFitMode(newFit);
    if (newZoom !== undefined) setZoomLevel(newZoom);
    try {
      localStorage.setItem('sp_display_screen_config', JSON.stringify({ fitMode: targetFit, zoomLevel: targetZoom }));
    } catch (e) {
      console.error(e);
    }
  };

  const cycleFitMode = () => {
    const modes: ('cover' | 'contain' | 'fill')[] = ['cover', 'contain', 'fill'];
    const nextIdx = (modes.indexOf(fitMode) + 1) % modes.length;
    updateScreenConfig(modes[nextIdx], zoomLevel);
  };

  const handleZoomIn = () => {
    if (zoomLevel < 180) updateScreenConfig(fitMode, zoomLevel + 10);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 50) updateScreenConfig(fitMode, zoomLevel - 10);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data & handle localStorage sync across tabs
  const loadData = () => {
    const activeSps = getSponsors().filter((s) => !s.isDeleted && s.active);
    const activeTourn = getActiveTournament();
    const activeMedia = getPlaylist().filter((p) => !p.isDeleted && p.active);

    setSponsors(activeSps);
    setTournament(activeTourn);
    setPlaylist(activeMedia);
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle media progression
  useEffect(() => {
    if (playlist.length === 0 || !isPlaying) return;

    const currentItem = playlist[currentIndex];

    if (!currentItem) {
      setCurrentIndex(0);
      return;
    }

    if (currentItem.type === 'image') {
      // Set timer for image slide
      const durationMs = (currentItem.duration || 10) * 1000;
      timerRef.current = setTimeout(() => {
        handleNext();
      }, durationMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, playlist, isPlaying, isLoopingAll]);

  const handleNext = () => {
    if (playlist.length === 0) return;
    if (currentIndex >= playlist.length - 1) {
      if (isLoopingAll) {
        setCurrentIndex(0);
      } else {
        setIsPlaying(false);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleVideoEnd = () => {
    if (isPlaying) {
      handleNext();
    }
  };

  // Toggle controls visibility on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.log(err));
        setIsFullscreen(false);
      }
    }
  };

  const currentMedia = playlist[currentIndex];

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen bg-black overflow-hidden font-sans text-white select-none cursor-none hover:cursor-default"
    >
      {/* BACKGROUND DISPLAY AREA */}
      {playlist.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-black">
          <div className="p-6 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 mb-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] animate-pulse">
            <Trophy className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-wide">
            {tournament?.name || 'Tournament Display Ready'}
          </h1>
          <p className="text-lg text-slate-400 mt-2 max-w-xl">
            SP SportData Solution Presentation Screen. Add active playlist items from the admin dashboard to start playback.
          </p>
        </div>
      ) : currentMedia?.type === 'video' ? (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
          <video
            ref={videoRef}
            key={currentMedia.id}
            src={currentMedia.url}
            autoPlay
            muted={isMuted}
            playsInline
            onEnded={handleVideoEnd}
            style={{ transform: `scale(${zoomLevel / 100})` }}
            className={`w-full h-full transition-all duration-300 ${
              fitMode === 'contain'
                ? 'object-contain'
                : fitMode === 'fill'
                ? 'object-fill'
                : 'object-cover'
            }`}
          />
        </div>
      ) : (
        <div key={currentMedia?.id} className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-950">
          <img
            src={currentMedia?.url}
            alt={currentMedia?.title}
            style={{ transform: `scale(${zoomLevel / 100})` }}
            className={`w-full h-full transition-all duration-300 animate-fade-in ${
              fitMode === 'contain'
                ? 'object-contain'
                : fitMode === 'fill'
                ? 'object-fill'
                : 'object-cover'
            }`}
          />
        </div>
      )}

      {/* TOP BROADCAST OVERLAY BANNER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Tournament Logo & Name */}
          <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
            {tournament?.logo ? (
              <img
                src={tournament.logo}
                alt={tournament.name}
                className="w-10 h-10 object-contain rounded-lg bg-black/60 p-1"
              />
            ) : (
              <Trophy className="w-8 h-8 text-cyan-400" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <h2 className="text-lg font-black tracking-wider text-white uppercase drop-shadow-md">
                  {tournament?.name || 'Live Tournament Display'}
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-cyan-300 font-semibold mt-0.5">
                {tournament?.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {tournament.venue}
                  </span>
                )}
                {tournament?.date && (
                  <span className="flex items-center gap-1 border-l border-slate-700 pl-3">
                    <Calendar className="w-3 h-3" /> {tournament.date}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SP SportData Branding Badge */}
          <div className="bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-800 shadow-lg">
            <SpLogo size="sm" />
          </div>
        </div>
      </div>

      {/* LOWER THIRD SPONSOR ROTATION TICKER */}
      {sponsors.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-4 pointer-events-none">
          <div className="bg-slate-900/90 border-y border-cyan-500/30 backdrop-blur-md py-2.5 overflow-hidden">
            <div className="flex items-center gap-6 animate-ticker">
              {[...sponsors, ...sponsors, ...sponsors].map((sp, idx) => (
                <div
                  key={`${sp.id}-${idx}`}
                  className="flex items-center gap-3 px-6 border-r border-slate-800/80 shrink-0"
                >
                  <img
                    src={sp.logo}
                    alt={sp.name}
                    className="h-9 max-w-[180px] object-contain filter brightness-110 drop-shadow"
                  />
                  <span className="text-xs font-bold text-slate-200 tracking-wide">{sp.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING PUBLIC DISPLAY CONTROLS (HOVER OVERLAY) */}
      {showControls && (
        <div className="absolute inset-x-0 bottom-16 z-30 flex justify-center pointer-events-auto transition-opacity duration-300">
          <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.25)]">
            {/* Skip Previous */}
            <button
              onClick={handlePrevious}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 transition"
              title="Previous Media Item"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black border border-cyan-500/40 transition"
              title={isPlaying ? 'Pause Loop' : 'Play Loop'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip Next */}
            <button
              onClick={handleNext}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 transition"
              title="Next Media Item"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* LOOP ALL PLAYLIST BUTTON */}
            <button
              onClick={() => setIsLoopingAll(!isLoopingAll)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                isLoopingAll
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={isLoopingAll ? 'Loop All Playlist Enabled (Click to Disable)' : 'Loop All Playlist Disabled (Click to Enable)'}
            >
              <Repeat className={`w-4 h-4 ${isLoopingAll ? 'animate-spin-slow text-cyan-400' : ''}`} />
              <span>Loop All: {isLoopingAll ? 'ON' : 'OFF'}</span>
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1" />

            {/* SCREEN SIZE & FIT MODE CONTROLS */}
            <button
              onClick={cycleFitMode}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition"
              title="Click to cycle screen fit: COVER (Crop) -> CONTAIN (Fit All) -> FILL (Stretch)"
            >
              <Scaling className="w-4 h-4 text-cyan-400" />
              <span>Fit: {fitMode.toUpperCase()}</span>
            </button>

            {/* ZOOM ADJUSTER BOX */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 gap-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition disabled:opacity-30"
                title="Zoom Out Video/Image"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateScreenConfig(fitMode, 100)}
                title="Reset zoom to 100%"
                className="px-2 text-xs font-mono font-bold text-cyan-400 hover:text-white transition"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 180}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition disabled:opacity-30"
                title="Zoom In Video/Image"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-700 mx-1" />

            {/* Mute / Unmute */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 transition"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {/* SHOW FULL PAGE EVENT BANNER BUTTON */}
            <button
              onClick={() => setShowBanner(true)}
              className="px-3 py-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 font-bold text-xs border border-cyan-500/40 flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(0,240,255,0.15)]"
              title="Show Full-Page Active Tournament Banner"
            >
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Event Banner</span>
            </button>

            {/* Media status indicator */}
            <div className="px-3 text-xs font-mono text-cyan-300 truncate max-w-[200px]">
              {playlist.length > 0 ? (
                <span>
                  #{currentIndex + 1}/{playlist.length}: {currentMedia?.title}
                </span>
              ) : (
                <span>No Media</span>
              )}
            </div>

            {/* Close window */}
            <button
              onClick={() => window.close()}
              className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/40 transition ml-1"
              title="Close Display Window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* FULL PAGE ANIMATED ACTIVE TOURNAMENT DISPLAY BANNER (IDLES UNTIL USER CLOSES OR ENTERS PRESENTATION) */}
      {showBanner && tournament && (
        <TournamentBannerModal
          tournament={tournament}
          sponsors={sponsors}
          onClose={() => setShowBanner(false)}
          autoCloseSeconds={0}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  );
}
