import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-2xl border border-slate-800/80 my-4">
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 mb-4 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        {icon || <FolderOpen className="w-10 h-10" />}
      </div>
      <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          {actionText}
        </button>
      )}
    </div>
  );
};
