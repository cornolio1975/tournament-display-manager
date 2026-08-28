'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Radio,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { syncFromKarateTech, subscribeKarateTechRealtime } from '@/lib/karateTechBridge';

interface KarateTechSyncPanelProps {
  /** Called after a successful sync so the parent can reload tournament data */
  onSynced?: () => void;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

const KT_SITE_URL = 'https://karatetechhybrid.spsportdatasolution.org';

export const KarateTechSyncPanel: React.FC<KarateTechSyncPanelProps> = ({ onSynced }) => {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<{ added: number; updated: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState(0);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ── Manual / auto sync handler ─────────────────────────────────────────────
  const doSync = useCallback(async () => {
    setStatus('syncing');
    setErrorMsg(null);
    const result = await syncFromKarateTech();
    if (result.error) {
      setStatus('error');
      setErrorMsg(result.error);
    } else {
      setStatus('success');
      setLastSyncedAt(new Date());
      setLastResult({ added: result.added, updated: result.updated });
      onSynced?.();
      // Reset success indicator after 4 s
      setTimeout(() => setStatus('idle'), 4000);
    }
  }, [onSynced]);

  // ── Initial auto-sync on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (autoSync) doSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!autoSync) {
      // Teardown if disabled
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setRealtimeConnected(false);
      }
      return;
    }

    setRealtimeConnected(true);
    const unsub = subscribeKarateTechRealtime((counts) => {
      setLastSyncedAt(new Date());
      setLastResult(counts);
      setRealtimeUpdates((n) => n + 1);
      onSynced?.();
    });
    unsubscribeRef.current = unsub;

    return () => {
      unsub();
      unsubscribeRef.current = null;
    };
  }, [autoSync, onSynced]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const statusColor = {
    idle: 'text-slate-400',
    syncing: 'text-cyan-400',
    success: 'text-emerald-400',
    error: 'text-red-400',
  }[status];

  return (
    <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/20 via-slate-900/80 to-slate-900/60 shadow-xl shadow-red-900/10 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-red-500/10">
        <div className="flex items-center gap-3">
          {/* KT Logo pill */}
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/20 rounded-xl px-3 py-1.5">
            <span className="text-sm font-black tracking-tight leading-none">
              <span className="text-red-500">Karate</span>
              <span className="text-sky-400">Tech</span>
            </span>
            <span className="text-[9px] font-black text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-1.5 py-0.5 leading-none tracking-widest uppercase">
              2.0
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Live Data Bridge</p>
            <p className="text-[10px] text-slate-500 leading-tight">SP SportData Solution</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Realtime indicator */}
          <div
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
              realtimeConnected && autoSync
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {realtimeConnected && autoSync ? (
              <>
                <Radio className="w-3 h-3 animate-pulse" />
                <span>LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>OFFLINE</span>
              </>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-5 py-4 space-y-4">
          {/* Status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status === 'syncing' && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
              {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
              {status === 'idle' && (
                realtimeConnected && autoSync
                  ? <Wifi className="w-4 h-4 text-emerald-400" />
                  : <WifiOff className="w-4 h-4 text-slate-500" />
              )}
              <span className={`text-xs font-bold ${statusColor}`}>
                {status === 'syncing' && 'Syncing from KarateTech...'}
                {status === 'success' && `Sync complete · +${lastResult?.added ?? 0} added, ${lastResult?.updated ?? 0} updated`}
                {status === 'error' && `Sync failed: ${errorMsg}`}
                {status === 'idle' && (
                  lastSyncedAt
                    ? `Last sync: ${formatTime(lastSyncedAt)}${realtimeUpdates > 0 ? ` · ${realtimeUpdates} live update${realtimeUpdates > 1 ? 's' : ''}` : ''}`
                    : 'Not yet synced'
                )}
              </span>
            </div>

            {/* Manual sync button */}
            <button
              onClick={doSync}
              disabled={status === 'syncing'}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          </div>

          {/* Auto-sync toggle + KT link */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setAutoSync((a) => !a)}
                className={`relative w-9 h-5 rounded-full border transition-colors cursor-pointer ${
                  autoSync
                    ? 'bg-emerald-500/30 border-emerald-500/50'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${
                    autoSync
                      ? 'translate-x-4 bg-emerald-400 shadow-lg shadow-emerald-500/40'
                      : 'bg-slate-500'
                  }`}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Auto-sync (Realtime)
              </span>
            </label>

            <a
              href={KT_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 hover:text-red-300 transition"
            >
              Open KarateTech 2.0
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Info note */}
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Tournaments are synced read-only from KarateTech 2.0. Edit details (logo, contact, active flag) here in Display Manager. Changes in KarateTech update automatically via Supabase Realtime.
          </p>
        </div>
      )}
    </div>
  );
};
