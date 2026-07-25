'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, ExternalLink, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Sponsor, ToastMessage } from '@/lib/types';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { MediaUploader } from '../ui/MediaUploader';

interface SponsorManagerProps {
  sponsors: Sponsor[];
  onSave: (sponsors: Sponsor[]) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const SponsorManager: React.FC<SponsorManagerProps> = ({
  sponsors,
  onSave,
  addToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [website, setWebsite] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [active, setActive] = useState(true);

  const activeSponsors = sponsors.filter((s) => !s.isDeleted).sort((a, b) => a.order - b.order);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setLogo('');
    setWebsite('');
    setOrder(activeSponsors.length + 1);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sponsor: Sponsor) => {
    setEditingId(sponsor.id);
    setName(sponsor.name);
    setLogo(sponsor.logo);
    setWebsite(sponsor.website);
    setOrder(sponsor.order);
    setActive(sponsor.active);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({ type: 'error', title: 'Name Required', message: 'Please enter a sponsor name.' });
      return;
    }

    try {
      if (editingId) {
        const updated = sponsors.map((s) =>
          s.id === editingId
            ? { ...s, name: name.trim(), logo, website: website.trim(), order: Number(order), active }
            : s
        );
        onSave(updated);
        addToast({ type: 'success', title: 'Sponsor Updated', message: `${name} has been updated successfully.` });
      } else {
        const newSponsor: Sponsor = {
          id: `sp-${Date.now()}`,
          name: name.trim(),
          logo: logo || 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=300&auto=format&fit=crop&q=80',
          website: website.trim(),
          order: Number(order),
          active,
        };
        onSave([...sponsors, newSponsor]);
        addToast({ type: 'success', title: 'Sponsor Created', message: `${name} added to display rotation.` });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving sponsor:', err);
      addToast({ type: 'error', title: 'Save Exception', message: 'Unable to update sponsor due to storage constraint.' });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    const target = sponsors.find((s) => s.id === deletingId);
    // Soft delete preferred as requested
    const updated = sponsors.map((s) => (s.id === deletingId ? { ...s, isDeleted: true } : s));
    onSave(updated);
    addToast({
      type: 'info',
      title: 'Sponsor Removed',
      message: `${target?.name || 'Sponsor'} has been soft-deleted.`,
    });
    setDeletingId(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newList = [...activeSponsors];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;

    // Swap order values
    const tempOrder = newList[index].order;
    newList[index].order = newList[targetIndex].order;
    newList[targetIndex].order = tempOrder;

    // Update main list
    const updatedMap = new Map(newList.map((s) => [s.id, s]));
    const updatedMain = sponsors.map((s) => updatedMap.get(s.id) || s);

    onSave(updatedMain);
    addToast({ type: 'info', title: 'Order Updated', message: 'Sponsor rotation sequence changed.' });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Sponsor Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure partner logos, websites, order priorities, and active display visibility.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Sponsor
        </button>
      </div>

      {/* Sponsor List / Table */}
      {activeSponsors.length === 0 ? (
        <EmptyState
          title="No Sponsors Found"
          description="You currently have no active sponsors in the system. Add your first sponsor logo to display on public screen rotation."
          actionText="Add Sponsor"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Logo</th>
                  <th className="px-6 py-4">Sponsor Name</th>
                  <th className="px-6 py-4">Website</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeSponsors.map((sponsor, index) => (
                  <tr key={sponsor.id} className="hover:bg-slate-800/40 transition">
                    {/* Order Controls */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
                          #{sponsor.order}
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
                            disabled={index === activeSponsors.length - 1}
                            onClick={() => handleMove(index, 'down')}
                            className="p-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Logo Preview */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-28 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5">
                        <img
                          src={sponsor.logo}
                          alt={sponsor.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4 font-semibold text-white">{sponsor.name}</td>

                    {/* Website */}
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {sponsor.website ? (
                        <a
                          href={sponsor.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline"
                        >
                          {sponsor.website.replace(/^https?:\/\//, '')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600">N/A</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge active={sponsor.active} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(sponsor)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700 transition"
                          title="Edit Sponsor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(sponsor.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition"
                          title="Delete Sponsor"
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

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg max-h-[90vh] glass-panel rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-6 pb-4 shrink-0 bg-slate-950/60">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                {editingId ? 'Modify Sponsor' : 'Add New Sponsor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form id="sponsorForm" onSubmit={handleSaveForm} className="space-y-4 p-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Sponsor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nike Sports Global"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <MediaUploader
                value={logo}
                onChange={(url) => setLogo(url)}
                type="image"
                label="Sponsor Logo Upload / Image URL"
              />

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://sponsorwebsite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
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
                form="sponsorForm"
                className="px-5 py-2.5 text-sm font-bold text-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 transition transform hover:-translate-y-0.5"
              >
                {editingId ? 'Save Changes' : 'Save Sponsor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Sponsor"
        message="Are you sure you want to delete this sponsor? The item will be soft-deleted and removed from the active public display screen."
        confirmText="Confirm Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
