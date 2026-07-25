'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Video as VideoIcon, Link as LinkIcon, Check, X } from 'lucide-react';

interface MediaUploaderProps {
  value: string;
  onChange: (url: string) => void;
  type?: 'image' | 'video' | 'any';
  label?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value,
  onChange,
  type = 'any',
  label = 'Media Asset',
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const isVideo = (src: string) => {
    return src.startsWith('data:video') || src.match(/\.(mp4|webm|ogg)$/i);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
        {label}
      </label>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900/60 p-2 flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-950 shrink-0 flex items-center justify-center border border-slate-800">
            {isVideo(value) ? (
              <video src={value} className="w-full h-full object-cover" muted loop autoPlay />
            ) : (
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono text-cyan-400 truncate block">
              {value.startsWith('data:') ? 'Uploaded File (Base64)' : value}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {isVideo(value) ? 'Video Asset' : 'Image Asset'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition mr-2"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                tab === 'upload'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                tab === 'url'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" /> Web URL
            </button>
          </div>

          {tab === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 bg-slate-900/40 hover:bg-cyan-950/20 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  type === 'image'
                    ? 'image/*'
                    : type === 'video'
                    ? 'video/mp4,video/webm'
                    : 'image/*,video/mp4,video/webm'
                }
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="p-3 rounded-xl bg-slate-800 group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-400 transition">
                {type === 'video' ? (
                  <VideoIcon className="w-6 h-6" />
                ) : (
                  <ImageIcon className="w-6 h-6" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-300 group-hover:text-cyan-300">
                Click to browse file
              </p>
              <p className="text-[11px] text-slate-500">
                {type === 'image'
                  ? 'Supports JPG, PNG, WEBP'
                  : type === 'video'
                  ? 'Supports MP4, WebM'
                  : 'Supports MP4, WebM, JPG, PNG'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/asset.jpg or .mp4"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-sm transition"
              >
                Apply
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
