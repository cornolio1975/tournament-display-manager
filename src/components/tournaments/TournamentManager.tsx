'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Trophy, MapPin, Calendar, Mail, Phone, Globe, CheckCircle2, Sparkles, X } from 'lucide-react';
import { Tournament, ToastMessage } from '@/lib/types';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { MediaUploader } from '../ui/MediaUploader';

interface TournamentManagerProps {
  tournaments: Tournament[];
  onSave: (tournaments: Tournament[]) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({
  tournaments,
  onSave,
  addToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [facebookInstagram, setFacebookInstagram] = useState('');
  const [active, setActive] = useState(false);

  const activeTournaments = tournaments.filter((t) => !t.isDeleted);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setOrganizer('');
    setDate('');
    setVenue('');
    setAddress('');
    setDescription('');
    setLogo('');
    setContactPerson('');
    setPhoneNumber('');
    setEmail('');
    setWebsite('');
    setFacebookInstagram('');
    setActive(activeTournaments.length === 0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Tournament) => {
    setEditingId(t.id);
    setName(t.name);
    setOrganizer(t.organizer);
    setDate(t.date);
    setVenue(t.venue);
    setAddress(t.address);
    setDescription(t.description);
    setLogo(t.logo);
    setContactPerson(t.contactPerson);
    setPhoneNumber(t.phoneNumber);
    setEmail(t.email);
    setWebsite(t.website);
    setFacebookInstagram(t.facebookInstagram || '');
    setActive(t.active);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !venue.trim() || !date.trim()) {
      addToast({
        type: 'error',
        title: 'Required Fields Missing',
        message: 'Please complete tournament name, venue, and date.',
      });
      return;
    }

    let updatedTournaments = [...tournaments];

    // Enforce SINGLE ACTIVE tournament rule
    if (active) {
      updatedTournaments = updatedTournaments.map((t) => ({ ...t, active: false }));
    }

    if (editingId) {
      updatedTournaments = updatedTournaments.map((t) =>
        t.id === editingId
          ? {
              ...t,
              name: name.trim(),
              organizer: organizer.trim(),
              date: date.trim(),
              venue: venue.trim(),
              address: address.trim(),
              description: description.trim(),
              logo,
              contactPerson: contactPerson.trim(),
              phoneNumber: phoneNumber.trim(),
              email: email.trim(),
              website: website.trim(),
              facebookInstagram: facebookInstagram.trim(),
              active,
            }
          : t
      );
      addToast({
        type: 'success',
        title: 'Tournament Saved',
        message: `${name} details updated successfully.`,
      });
    } else {
      const newTournament: Tournament = {
        id: `tourn-${Date.now()}`,
        name: name.trim(),
        organizer: organizer.trim(),
        date: date.trim(),
        venue: venue.trim(),
        address: address.trim(),
        description: description.trim(),
        logo: logo || 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&auto=format&fit=crop&q=80',
        contactPerson: contactPerson.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        website: website.trim(),
        facebookInstagram: facebookInstagram.trim(),
        active,
      };
      updatedTournaments.push(newTournament);
      addToast({
        type: 'success',
        title: 'Tournament Created',
        message: `${name} has been added.`,
      });
    }

    onSave(updatedTournaments);
    setIsModalOpen(false);
  };

  const handleSetActive = (targetId: string) => {
    // Single active rule
    const updated = tournaments.map((t) => ({
      ...t,
      active: t.id === targetId,
    }));
    onSave(updated);
    const activeObj = tournaments.find((t) => t.id === targetId);
    addToast({
      type: 'info',
      title: 'Active Tournament Changed',
      message: `"${activeObj?.name}" is now the active event on display.`,
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    const target = tournaments.find((t) => t.id === deletingId);
    const updated = tournaments.map((t) => (t.id === deletingId ? { ...t, isDeleted: true } : t));
    onSave(updated);
    addToast({
      type: 'info',
      title: 'Tournament Removed',
      message: `${target?.name || 'Tournament'} soft-deleted.`,
    });
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Tournament Details Module</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage tournament events, venues, schedules, and active broadcast display target.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Tournament
        </button>
      </div>

      {/* List / Cards */}
      {activeTournaments.length === 0 ? (
        <EmptyState
          title="No Tournaments Configured"
          description="Create your first tournament entry with venue, schedule, and organizer information."
          actionText="Add Tournament"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTournaments.map((t) => (
            <div
              key={t.id}
              className={`glass-panel p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                t.active
                  ? 'border-cyan-500/60 shadow-[0_0_25px_rgba(0,240,255,0.15)] bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {t.active && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-black text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-bl-xl shadow-md">
                  Active Display Target
                </div>
              )}

              <div>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 p-1 flex items-center justify-center">
                    <img src={t.logo} alt={t.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white tracking-wide truncate">{t.name}</h3>
                    <p className="text-xs text-cyan-400 font-semibold mt-0.5">{t.organizer}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{t.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.venue}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  {t.description || 'No additional description provided.'}
                </p>

                {/* Contact details */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{t.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleSetActive(t.id)}
                  disabled={t.active}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                    t.active
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 cursor-default'
                      : 'bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.active ? 'Active Target' : 'Set as Active'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700 transition"
                    title="Edit Tournament"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(t.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition"
                    title="Delete Tournament"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] glass-panel rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-6 pb-4 shrink-0 bg-slate-950/60">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                {editingId ? 'Modify Tournament' : 'Add New Tournament'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form id="tournamentForm" onSubmit={handleSaveForm} className="space-y-4 p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Tournament Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. World Karate Cup 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SP SportData Solution"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Date Range *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aug 15 - Aug 18, 2026"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Venue Arena *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stadium Axiata Arena"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Full Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bukit Jalil Sports City, 57000 Kuala Lumpur"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Tournament summary, rules, or spectator instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <MediaUploader
                value={logo}
                onChange={(url) => setLogo(url)}
                type="image"
                label="Tournament Logo Upload / Image URL"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Grandmaster Tan"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+60 12-345 6789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="info@tournament.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Official Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://tournament.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Facebook / Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@tournamentofficial"
                    value={facebookInstagram}
                    onChange={(e) => setFacebookInstagram(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Active Tournament Checkbox */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-5 h-5 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Set as Active Tournament
                    </span>
                    <span className="text-xs text-slate-400">
                      Checking this automatically sets all other tournaments to inactive (Single Active Rule).
                    </span>
                  </div>
                </label>
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
                form="tournamentForm"
                className="px-5 py-2.5 text-sm font-bold text-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 transition transform hover:-translate-y-0.5"
              >
                {editingId ? 'Save Changes' : 'Save Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Tournament"
        message="Are you sure you want to delete this tournament entry?"
        confirmText="Confirm Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
