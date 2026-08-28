'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  MonitorPlay,
  Play,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Clock,
  Check,
  Shield,
  Trophy,
  Calendar,
  Radio,
  FileText,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Info,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { db } from '@/db/dbClient';
import { DisplayPlaylist, DisplayPlaylistSlide, DisplaySlideType } from '@/db/types';
import { getPlaylist, getSponsors } from '@/lib/storage';
import { PlaylistItem, Sponsor } from '@/lib/types';
import { MediaUploader } from '../ui/MediaUploader';

interface DisplayPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchPlaylist?: (playlistId: string) => void;
  addToast?: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void;
}

const SLIDE_TYPE_OPTIONS: { type: DisplaySlideType; label: string; icon: React.ElementType; defaultDuration: number; desc: string }[] = [
  {
    type: 'kumite_scoreboard',
    label: 'Live Kumite Scoreboard',
    icon: Shield,
    defaultDuration: 20,
    desc: 'Real-time WKF Kumite scoreboard with Senshu, fouls, and match timer.',
  },
  {
    type: 'kata_scoreboard',
    label: 'WKF Kata Scoreboard',
    icon: Trophy,
    defaultDuration: 20,
    desc: '7-Judge WKF Kata scoring board showing technical & athletic performance.',
  },
  {
    type: 'category_brackets',
    label: 'Category Brackets & Draws',
    icon: Layers,
    defaultDuration: 15,
    desc: 'Live tournament bracket tree and progression table.',
  },
  {
    type: 'medal_standings',
    label: 'Medal Standings Leaderboard',
    icon: Trophy,
    defaultDuration: 12,
    desc: 'Country/Club Gold, Silver & Bronze medal tally rankings.',
  },
  {
    type: 'match_schedule',
    label: 'Match Schedule & Ring Queue',
    icon: Calendar,
    defaultDuration: 15,
    desc: 'Upcoming bouts list and athlete warm-up queue per tatami.',
  },
  {
    type: 'announcement_sponsor',
    label: 'Announcement & Sponsor Slide',
    icon: Radio,
    defaultDuration: 10,
    desc: 'Custom broadcast text message with sponsor logo banner.',
  },
  {
    type: 'video',
    label: 'Video Promo Slide',
    icon: Video,
    defaultDuration: 20,
    desc: 'Full-screen video broadcast stream or advertisement clip.',
  },
  {
    type: 'image',
    label: 'Image / Poster Showcase',
    icon: ImageIcon,
    defaultDuration: 10,
    desc: 'Full-bleed image banner or promotional poster.',
  },
  {
    type: 'officials_page',
    label: 'Officials Page',
    icon: FileText,
    defaultDuration: 15,
    desc: 'Display tournament officials and referees.',
  },
];

export const DisplayPlaylistModal: React.FC<DisplayPlaylistModalProps> = ({
  isOpen,
  onClose,
  onLaunchPlaylist,
  addToast,
}) => {
  const [playlists, setPlaylists] = useState<DisplayPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Database Saved Media State
  const [dbMediaList, setDbMediaList] = useState<PlaylistItem[]>([]);
  const [dbSponsorsList, setDbSponsorsList] = useState<Sponsor[]>([]);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTatami, setFormTatami] = useState('All Tatamis');
  const [formIsActive, setFormIsActive] = useState(false);
  const [formSlides, setFormSlides] = useState<DisplayPlaylistSlide[]>([]);

  const loadData = async () => {
    const list = await db.displayPlaylists.list();
    setPlaylists(list);

    // Load saved database media & sponsors lists
    const media = (await getPlaylist()).filter((item) => !item.isDeleted && item.active);
    const sps = (await getSponsors()).filter((s) => !s.isDeleted && s.active);
    setDbMediaList(media);
    setDbSponsorsList(sps);

    if (list.length > 0 && !selectedPlaylistId) {
      const active = list.find((p) => p.is_active) || list[0];
      setSelectedPlaylistId(active.id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const activeSelectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  const handleStartCreate = () => {
    setSelectedPlaylistId(null);
    setFormName('');
    setFormDescription('');
    setFormTatami('All Tatamis');
    setFormIsActive(playlists.length === 0);
    setFormSlides([
      {
        id: `s-${Date.now()}-1`,
        type: 'kumite_scoreboard',
        title: 'Live Kumite Scoreboard',
        duration_seconds: 20,
        tatami_filter: 'All',
        order: 1,
      },
      {
        id: `s-${Date.now()}-2`,
        type: 'category_brackets',
        title: 'Category Brackets & Draws',
        duration_seconds: 15,
        tatami_filter: 'All',
        order: 2,
      },
      {
        id: `s-${Date.now()}-3`,
        type: 'medal_standings',
        title: 'Medal Standings Leaderboard',
        duration_seconds: 12,
        order: 3,
      },
    ]);
    setIsEditing(true);
  };

  const handleStartEdit = (playlist: DisplayPlaylist) => {
    setSelectedPlaylistId(playlist.id);
    setFormName(playlist.name);
    setFormDescription(playlist.description);
    setFormTatami(playlist.tatami || 'All Tatamis');
    setFormIsActive(playlist.is_active);
    setFormSlides(playlist.slides || []);
    setIsEditing(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast?.({ type: 'error', title: 'Missing Title', message: 'Please provide a playlist title.' });
      return;
    }
    if (formSlides.length === 0) {
      addToast?.({ type: 'error', title: 'Empty Playlist', message: 'Please add at least one slide to the playlist.' });
      return;
    }

    const cleanedSlides = formSlides.map((s, idx) => ({ ...s, order: idx + 1 }));

    if (selectedPlaylistId && !selectedPlaylistId.startsWith('new-')) {
      const updated = await db.displayPlaylists.update(selectedPlaylistId, {
        name: formName.trim(),
        description: formDescription.trim(),
        tatami: formTatami,
        is_active: formIsActive,
        slides: cleanedSlides,
      });
      if (updated) {
        addToast?.({ type: 'success', title: 'Playlist Updated', message: `"${formName}" saved successfully.` });
      }
    } else {
      const created = await db.displayPlaylists.add({
        name: formName.trim(),
        description: formDescription.trim(),
        tatami: formTatami,
        is_active: formIsActive,
        slides: cleanedSlides,
      });
      if (created) {
        setSelectedPlaylistId(created.id);
        addToast?.({ type: 'success', title: 'Playlist Created', message: `"${formName}" created successfully.` });
      }
    }

    setIsEditing(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    const success = await db.displayPlaylists.delete(id);
    if (success) {
      addToast?.({ type: 'info', title: 'Playlist Removed', message: 'Display playlist deleted.' });
      setDeletingId(null);
      if (selectedPlaylistId === id) {
        setSelectedPlaylistId(null);
      }
      setIsEditing(false);
      await loadData();
    }
  };

  const handleSetActive = async (id: string) => {
    await db.displayPlaylists.setActive(id);
    addToast?.({ type: 'success', title: 'Active Playlist Changed', message: 'Selected playlist set as primary display.' });
    await loadData();
  };

  const handleAddSlide = (type: DisplaySlideType) => {
    const opt = SLIDE_TYPE_OPTIONS.find((o) => o.type === type);
    
    // Default values if media items exist in database
    let defaultVideoUrl = undefined;
    let defaultImageUrl = undefined;
    if (type === 'video') {
      const savedVideo = dbMediaList.find((m) => m.type === 'video');
      defaultVideoUrl = savedVideo ? savedVideo.url : '/sp_sportdata_promo_20s.mp4';
    } else if (type === 'image') {
      const savedImg = dbMediaList.find((m) => m.type === 'image');
      defaultImageUrl = savedImg ? savedImg.url : 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=1200&auto=format&fit=crop&q=80';
    } else if (type === 'announcement_sponsor') {
      const savedSp = dbSponsorsList[0];
      defaultImageUrl = savedSp ? savedSp.logo : 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80';
    }

    const newSlide: DisplayPlaylistSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title: opt?.label || 'New Display Slide',
      duration_seconds: opt?.defaultDuration || 15,
      tatami_filter: formTatami === 'All Tatamis' ? 'All' : formTatami,
      order: formSlides.length + 1,
      announcement_text: type === 'announcement_sponsor' ? 'Official Karate Championship Live Broadcast' : undefined,
      sponsor_image_url: defaultImageUrl,
      video_url: defaultVideoUrl,
    };
    setFormSlides([...formSlides, newSlide]);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formSlides.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...formSlides];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFormSlides(updated);
  };

  const handleRemoveSlide = (index: number) => {
    setFormSlides(formSlides.filter((_, i) => i !== index));
  };

  const handleSlideChange = (index: number, field: keyof DisplayPlaylistSlide, value: any) => {
    const updated = [...formSlides];
    updated[index] = { ...updated[index], [field]: value };
    setFormSlides(updated);
  };

  const handleSelectDatabaseMedia = (index: number, mediaId: string) => {
    const foundMedia = dbMediaList.find((m) => m.id === mediaId);
    if (!foundMedia) return;
    const updated = [...formSlides];
    const current = updated[index];
    if (foundMedia.type === 'video') {
      updated[index] = {
        ...current,
        title: foundMedia.title,
        video_url: foundMedia.url,
        duration_seconds: foundMedia.duration || 20,
      };
    } else {
      updated[index] = {
        ...current,
        title: foundMedia.title,
        sponsor_image_url: foundMedia.url,
        duration_seconds: foundMedia.duration || 10,
      };
    }
    setFormSlides(updated);
    addToast?.({ type: 'info', title: 'Media Loaded from Database', message: `"${foundMedia.title}" linked to slide #${index + 1}.` });
  };

  const handleSelectDatabaseSponsor = (index: number, sponsorId: string) => {
    const foundSp = dbSponsorsList.find((s) => s.id === sponsorId);
    if (!foundSp) return;
    const updated = [...formSlides];
    const current = updated[index];
    updated[index] = {
      ...current,
      sponsor_image_url: foundSp.logo,
    };
    setFormSlides(updated);
  };

  const handleLaunch = (id: string) => {
    if (onLaunchPlaylist) {
      onLaunchPlaylist(id);
    } else {
      window.open(`/display?playlistId=${id}`, '_blank', 'noopener,noreferrer');
    }
  };

  const calculateTotalDuration = (slides: DisplayPlaylistSlide[]) => {
    return slides.reduce((acc, s) => acc + (Number(s.duration_seconds) || 0), 0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* HEADER BAR */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-black">
                <MonitorPlay className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                  Display Playlist Management
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold uppercase tracking-wider">
                    Database Persisted
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Configure multi-screen tournament views & live overlay rotation player sequence.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MAIN MODAL BODY */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* LEFT SIDEBAR: PLAYLIST LIST */}
            <div className="lg:col-span-5 border-r border-slate-800 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-900/40">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Saved Playlists ({playlists.length})
                </span>
                <button
                  onClick={handleStartCreate}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Playlist
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {playlists.map((playlist) => {
                  const isSelected = playlist.id === selectedPlaylistId && !isEditing;
                  const totalSecs = calculateTotalDuration(playlist.slides);
                  return (
                    <div
                      key={playlist.id}
                      onClick={() => {
                        setSelectedPlaylistId(playlist.id);
                        setIsEditing(false);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-slate-100">{playlist.name}</h3>
                            {playlist.is_active && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{playlist.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-500" /> {playlist.slides.length} Slides
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {totalSecs}s Loop
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                          {playlist.tatami || 'All'}
                        </span>
                      </div>

                      {/* QUICK LAUNCH & ACTION BUTTONS */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunch(playlist.id);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-black stroke-none" /> Launch Display Screen
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(playlist);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit Playlist"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!playlist.is_active && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetActive(playlist.id);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-900/40 text-slate-400 hover:text-emerald-400 transition"
                            title="Set Active"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(playlist.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                          title="Delete Playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT MAIN PANEL: VIEW / EDIT FORM */}
            <div className="lg:col-span-7 p-6 overflow-y-auto bg-slate-950 flex flex-col gap-5">
              {isEditing ? (
                /* EDIT / CREATE FORM */
                <form onSubmit={handleSaveForm} className="flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      {selectedPlaylistId ? 'Modify Display Playlist' : 'Create New Display Playlist'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs hover:brightness-110 shadow-lg shadow-cyan-500/20 transition"
                      >
                        Save Playlist
                      </button>
                    </div>
                  </div>

                  {/* SETTINGS INPUTS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Playlist Name *
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Arena Spectator Rotation"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Tatami Ring Target
                      </label>
                      <select
                        value={formTatami}
                        onChange={(e) => setFormTatami(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                      >
                        <option value="All Tatamis">All Tatamis (Main Arena)</option>
                        <option value="Tatami 1">Tatami 1</option>
                        <option value="Tatami 2">Tatami 2</option>
                        <option value="Tatami 3">Tatami 3</option>
                        <option value="Tatami 4">Tatami 4</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Description / Purpose
                      </label>
                      <input
                        type="text"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Brief summary of views included in this rotation loop"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-slate-200">Set as Primary Active Playlist</span>
                        <p className="text-[11px] text-slate-400">Default presentation loop loaded when launching `/display`</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="w-4 h-4 accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* SLIDES SEQUENCE EDITOR */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" /> Slide Sequence Rotation ({formSlides.length})
                      </span>
                      <span className="text-xs text-slate-400">
                        Total Runtime: <strong className="text-cyan-400">{calculateTotalDuration(formSlides)}s</strong>
                      </span>
                    </div>

                    {/* ADD SLIDE DROPDOWN / BUTTONS */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap gap-2">
                      <span className="w-full text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        + Add Views to Rotation:
                      </span>
                      {SLIDE_TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => handleAddSlide(opt.type)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:border-cyan-500/50 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
                          >
                            <Icon className="w-3.5 h-3.5 text-cyan-400" /> {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* SLIDE LIST ITEMS */}
                    <div className="flex flex-col gap-3">
                      {formSlides.map((slide, idx) => {
                        const opt = SLIDE_TYPE_OPTIONS.find((o) => o.type === slide.type);
                        const Icon = opt?.icon || Layers;
                        return (
                          <div
                            key={slide.id || idx}
                            className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-xs flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <Icon className="w-4 h-4 text-cyan-400" />
                                <input
                                  type="text"
                                  value={slide.title}
                                  onChange={(e) => handleSlideChange(idx, 'title', e.target.value)}
                                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-extrabold text-white focus:outline-none focus:border-cyan-500"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSlide(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSlide(idx, 'down')}
                                  disabled={idx === formSlides.length - 1}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlide(idx)}
                                  className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 ml-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* DURATION & SPECIFIC FIELDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                  Duration (Seconds)
                                </label>
                                <input
                                  type="number"
                                  min={3}
                                  max={300}
                                  value={slide.duration_seconds}
                                  onChange={(e) => handleSlideChange(idx, 'duration_seconds', Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                  Tatami Filter
                                </label>
                                <select
                                  value={slide.tatami_filter || 'All'}
                                  onChange={(e) => handleSlideChange(idx, 'tatami_filter', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                                >
                                  <option value="All">All Tatamis</option>
                                  <option value="Tatami 1">Tatami 1</option>
                                  <option value="Tatami 2">Tatami 2</option>
                                  <option value="Tatami 3">Tatami 3</option>
                                  <option value="Tatami 4">Tatami 4</option>
                                </select>
                              </div>

                              {/* VIDEO SLIDE MEDIA INPUTS */}
                              {slide.type === 'video' && (
                                <div className="sm:col-span-3 space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                  {dbMediaList.length > 0 && (
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase text-cyan-400 mb-1">
                                        Import Saved Video from Database:
                                      </label>
                                      <select
                                        defaultValue=""
                                        onChange={(e) => handleSelectDatabaseMedia(idx, e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-cyan-500/40 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-semibold"
                                      >
                                        <option value="" disabled>-- Select Saved Database Video --</option>
                                        {dbMediaList.filter((m) => m.type === 'video').map((m) => (
                                          <option key={m.id} value={m.id}>
                                            {m.title} ({m.duration}s)
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  <MediaUploader
                                    type="video"
                                    label="Video Asset URL or File Upload"
                                    value={slide.video_url || ''}
                                    onChange={(url) => handleSlideChange(idx, 'video_url', url)}
                                  />
                                </div>
                              )}

                              {/* IMAGE & OFFICIALS SLIDE MEDIA INPUTS */}
                              {(slide.type === 'image' || slide.type === 'officials_page') && (
                                <div className="sm:col-span-3 space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                  {dbMediaList.length > 0 && (
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase text-cyan-400 mb-1">
                                        Import Saved Image/Poster from Database:
                                      </label>
                                      <select
                                        defaultValue=""
                                        onChange={(e) => handleSelectDatabaseMedia(idx, e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-cyan-500/40 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-semibold"
                                      >
                                        <option value="" disabled>-- Select Saved Database Media --</option>
                                        {dbMediaList.map((m) => (
                                          <option key={m.id} value={m.id}>
                                            {m.title} ({m.type.toUpperCase()})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  <MediaUploader
                                    type="image"
                                    label="Image Banner URL or File Upload"
                                    value={slide.sponsor_image_url || ''}
                                    onChange={(url) => handleSlideChange(idx, 'sponsor_image_url', url)}
                                  />
                                </div>
                              )}

                              {/* ANNOUNCEMENT & SPONSOR SLIDE MEDIA INPUTS */}
                              {slide.type === 'announcement_sponsor' && (
                                <div className="sm:col-span-3 space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                      Broadcast Announcement Text
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={slide.announcement_text || ''}
                                      onChange={(e) => handleSlideChange(idx, 'announcement_text', e.target.value)}
                                      placeholder="Enter announcement banner message..."
                                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                                    />
                                  </div>

                                  {dbSponsorsList.length > 0 && (
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase text-cyan-400 mb-1">
                                        Import Saved Sponsor Logo from Database:
                                      </label>
                                      <select
                                        defaultValue=""
                                        onChange={(e) => handleSelectDatabaseSponsor(idx, e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-cyan-500/40 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-semibold"
                                      >
                                        <option value="" disabled>-- Select Saved Sponsor Logo --</option>
                                        {dbSponsorsList.map((sp) => (
                                          <option key={sp.id} value={sp.id}>
                                            {sp.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  <MediaUploader
                                    type="image"
                                    label="Sponsor Logo / Image Banner"
                                    value={slide.sponsor_image_url || ''}
                                    onChange={(url) => handleSlideChange(idx, 'sponsor_image_url', url)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </form>
              ) : activeSelectedPlaylist ? (
                /* PLAYLIST DETAIL PREVIEW */
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-white">{activeSelectedPlaylist.name}</h2>
                        {activeSelectedPlaylist.is_active && (
                          <span className="px-2.5 py-0.5 text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{activeSelectedPlaylist.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(activeSelectedPlaylist)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Playlist
                      </button>
                      <button
                        onClick={() => handleLaunch(activeSelectedPlaylist.id)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
                      >
                        <Play className="w-4 h-4 fill-black stroke-none" /> Launch Display Screen
                      </button>
                    </div>
                  </div>

                  {/* SLIDES PREVIEW LIST */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Configured Slide Views ({activeSelectedPlaylist.slides.length})</span>
                      <span>Total Rotation: <strong className="text-cyan-400">{calculateTotalDuration(activeSelectedPlaylist.slides)}s</strong></span>
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {activeSelectedPlaylist.slides.map((slide, idx) => {
                        const opt = SLIDE_TYPE_OPTIONS.find((o) => o.type === slide.type);
                        const Icon = opt?.icon || Layers;
                        const mediaPreview = slide.video_url || slide.sponsor_image_url;
                        return (
                          <div
                            key={slide.id || idx}
                            className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black text-sm flex items-center justify-center">
                                {idx + 1}
                              </span>

                              {mediaPreview && (
                                <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                                  {slide.type === 'video' ? (
                                    <video src={mediaPreview} className="w-full h-full object-cover" muted />
                                  ) : (
                                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover rounded" />
                                  )}
                                </div>
                              )}

                              <div>
                                <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-cyan-400" />
                                  {slide.title}
                                </h4>
                                <p className="text-xs text-slate-400 line-clamp-1">{opt?.desc}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
                              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-cyan-400" /> {slide.duration_seconds}s
                              </span>
                              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
                                {slide.tatami_filter || 'All Tatamis'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                  <Layers className="w-12 h-12 stroke-1 mb-2" />
                  <p className="text-sm font-semibold">Select a playlist from the left or create a new one.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* CONFIRM DELETE DIALOG */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-extrabold text-white mb-2">Delete Display Playlist?</h3>
            <p className="text-xs text-slate-400 mb-5">Are you sure you want to delete this playlist configuration?</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
              >
                Delete Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
