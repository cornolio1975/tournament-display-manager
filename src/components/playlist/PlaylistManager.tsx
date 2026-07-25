'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Film, Image as ImageIcon, Video, Clock, Sparkles, X, RotateCcw, Repeat } from 'lucide-react';
import { PlaylistItem, ToastMessage } from '@/lib/types';
import { DEFAULT_PLAYLIST } from '@/lib/storage';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { MediaUploader } from '../ui/MediaUploader';

interface PlaylistManagerProps {
  playlist: PlaylistItem[];
  onSave: (items: PlaylistItem[]) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlist,
  onSave,
  addToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'image'>('video');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState<number>(10);
  const [order, setOrder] = useState<number>(1);
  const [active, setActive] = useState(true);

  const activeItems = playlist.filter((p) => !p.isDeleted).sort((a, b) => a.order - b.order);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle('');
    setType('video');
    setUrl('');
    setDuration(15);
    setOrder(activeItems.length + 1);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PlaylistItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setType(item.type);
    setUrl(item.url);
    setDuration(item.duration);
    setOrder(item.order);
    setActive(item.active);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please provide media title and select/upload media content.',
      });
      return;
    }

    try {
      if (editingId) {
        const updated = playlist.map((p) =>
          p.id === editingId
            ? {
                ...p,
                title: title.trim(),
                type,
                url,
                duration: Number(duration),
                order: Number(order),
                active,
              }
            : p
        );
        onSave(updated);
        addToast({
          type: 'success',
          title: 'Media Updated',
          message: `"${title}" configuration saved.`,
        });
      } else {
        const newItem: PlaylistItem = {
          id: `media-${Date.now()}`,
          title: title.trim(),
          type,
          url,
          duration: Number(duration),
          order: Number(order),
          active,
        };
        onSave([...playlist, newItem]);
        addToast({
          type: 'success',
          title: 'Media Added',
          message: `"${title}" added to broadcast playlist.`,
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving playlist item:', err);
      addToast({
        type: 'error',
        title: 'Save Exception',
        message: 'Unable to update playlist due to storage constraint.',
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    const target = playlist.find((p) => p.id === deletingId);
    const updated = playlist.map((p) => (p.id === deletingId ? { ...p, isDeleted: true } : p));
    onSave(updated);
    addToast({
      type: 'info',
      title: 'Media Removed',
      message: `"${target?.title}" removed from playlist.`,
    });
    setDeletingId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newList = [...activeItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;

    const tempOrder = newList[index].order;
    newList[index].order = newList[targetIndex].order;
    newList[targetIndex].order = tempOrder;

    const updatedMap = new Map(newList.map((p) => [p.id, p]));
    const updatedMain = playlist.map((p) => updatedMap.get(p.id) || p);

    onSave(updatedMain);
    addToast({ type: 'info', title: 'Playlist Reordered', message: 'Loop sequence updated.' });
  };

  const handleResetDefaults = () => {
    onSave(DEFAULT_PLAYLIST);
    addToast({
      type: 'info',
      title: 'Playlist Reset',
      message: 'Restored default playlist including 20s SP SPORTDATA intro video.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Display Playlist Module</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage videos (MP4 / WebM) and image slides (JPG / PNG), set display timers, and reorder rotation sequence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open('/display', '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 font-bold text-xs border border-cyan-500/40 shadow-lg shadow-cyan-500/10 transition"
            title="Launch Public Display in Loop All Mode"
          >
            <Repeat className="w-3.5 h-3.5 text-cyan-400" /> Loop All Display
          </button>
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition"
            title="Reset Playlist to Default Media"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restore Default Playlist
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Media
          </button>
        </div>
      </div>

      {/* Playlist Grid / Table */}
      {activeItems.length === 0 ? (
        <EmptyState
          title="Playlist is Empty"
          description="Add videos or promo slides to play on the public screen."
          actionText="Add Media Item"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Preview</th>
                  <th className="px-6 py-4">Title & Type</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    {/* Order */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
                          #{item.order}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMove(index, 'up')}
                            className="p-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={index === activeItems.length - 1}
                            onClick={() => handleMove(index, 'down')}
                            className="p-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Thumbnail preview */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative group">
                        {item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute bottom-1 right-1 p-0.5 rounded bg-black/80 text-[10px] text-cyan-400">
                          {item.type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                        </span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{item.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {item.type}
                        </span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{item.duration}s</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge active={item.active} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700 transition"
                          title="Edit Media"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition"
                          title="Delete Media"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg max-h-[90vh] glass-panel rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-6 pb-4 shrink-0 bg-slate-950/60">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                {editingId ? 'Modify Media Asset' : 'Add New Media Asset'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form id="playlistForm" onSubmit={handleSaveForm} className="space-y-4 p-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Media Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karate Finals Opening Promo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Media Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('video')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      type === 'video'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Video className="w-4 h-4" /> MP4 / WebM Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('image')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      type === 'image'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" /> JPG / PNG Image Slide
                  </button>
                </div>
              </div>

              <MediaUploader
                value={url}
                onChange={(newUrl) => setUrl(newUrl)}
                type={type}
                label={`${type.toUpperCase()} File / Asset URL`}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Display Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="600"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {type === 'image' ? 'Slide display time' : 'Video max play limit'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 relative" />
                    <span className="text-xs font-semibold text-slate-300">
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-800 shrink-0 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="playlistForm"
                className="px-5 py-2.5 text-sm font-bold text-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 transition transform hover:-translate-y-0.5"
              >
                {editingId ? 'Save Changes' : 'Save Media'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Media Item"
        message="Are you sure you want to remove this media item from the playlist rotation?"
        confirmText="Confirm Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
