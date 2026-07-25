import React from 'react';

interface StatusBadgeProps {
  active: boolean;
  activeText?: string;
  inactiveText?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  active,
  activeText = 'Active',
  inactiveText = 'Inactive',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition-all ${
        active
          ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
          : 'bg-slate-900/80 text-slate-400 border-slate-700/60'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          active ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#00F0FF]' : 'bg-slate-500'
        }`}
      />
      {active ? activeText : inactiveText}
    </span>
  );
};
