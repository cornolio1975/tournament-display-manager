'use client';

import React, { useState, useEffect } from 'react';

interface KarateMascotAnimationProps {
  position?: 'left' | 'right' | 'both';
}

export const KarateMascotAnimation: React.FC<KarateMascotAnimationProps> = ({
  position = 'both',
}) => {
  const [poseIndex, setPoseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPoseIndex((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* LEFT SIDE: MALE KARATE FIGHTER IN BLUE GI (ANTIGRAVITY STRIKE) - SMALL SIZE IN FRONT OF BANNER */}
      {(position === 'left' || position === 'both') && (
        <div className="absolute -left-4 sm:-left-8 -top-8 sm:-top-10 z-50 pointer-events-none transition-all duration-700">
          {/* Glowing Cyan Aura Swirl */}
          <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-2xl animate-pulse" />

          <div className="relative flex flex-col items-center animate-bounce-slow">
            {/* Small Action Tag */}
            <div className="mb-1 px-2.5 py-0.5 bg-slate-950/95 border border-cyan-400 text-cyan-300 font-mono font-extrabold text-[9px] tracking-wider rounded-full shadow-[0_0_12px_rgba(0,240,255,0.6)] uppercase flex items-center gap-1 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              BLUE GI: STRIKE 🥋
            </div>

            {/* HIGH QUALITY COMPACT BLUE GI MALE KARATE FIGHTER SVG */}
            <svg
              width="110"
              height="130"
              viewBox="0 0 200 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="filter drop-shadow-[0_8px_20px_rgba(0,240,255,0.6)] transition-all duration-500 transform hover:scale-105"
            >
              {/* Cyan Energy Swirl Ring */}
              <circle cx="100" cy="120" r="80" stroke="url(#cyanSwirl)" strokeWidth="6" strokeDasharray="12 6" fill="none" className="animate-spin-slow" />
              <circle cx="100" cy="120" r="60" fill="url(#cyanGlowCore)" opacity="0.35" />

              {/* Headband Ribbon */}
              <path d="M130 45 C150 30 170 35 185 20 C170 45 155 50 135 48 Z" fill="#00F0FF" className="animate-pulse" />

              {/* Male Head */}
              <ellipse cx="100" cy="50" rx="16" ry="19" fill="#E2A782" />
              <path d="M84 38 Q100 18 116 38 Q108 28 100 30 Q92 28 84 38 Z" fill="#1E1B18" />
              <path d="M82 40 Q100 36 118 40 L120 48 Q100 44 80 48 Z" fill="#00F0FF" />

              {/* Facial expression */}
              <path d="M92 52 Q100 55 108 52" stroke="#4A2612" strokeWidth="2" strokeLinecap="round" />

              {/* BLUE KARATE GI (PROJECT: ANTIGRAVITY STRIKE UNIFORM) */}
              <path d="M60 78 L140 78 L155 135 L45 135 Z" fill="url(#blueGiGrad)" stroke="#38BDF8" strokeWidth="2" />
              <path d="M80 78 L100 120 L120 78" stroke="#0284C7" strokeWidth="4" fill="none" />
              <path d="M72 78 L100 125 L128 78" stroke="#BAE6FD" strokeWidth="2" fill="none" />

              {/* BLACK BELT (KURO-OBI) */}
              <rect x="58" y="128" width="84" height="13" rx="2" fill="#0F172A" stroke="#000000" strokeWidth="2" />
              <path d="M90 133 L80 175 L70 172 L86 133 Z" fill="#0F172A" />
              <path d="M110 133 L122 170 L132 168 L116 133 Z" fill="#0F172A" />

              {/* DYNAMIC COMBAT POSES */}
              {poseIndex === 0 && (
                /* SIDE KICK & PUNCH */
                <g>
                  <path d="M75 140 L65 220" stroke="#0284C7" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="65" cy="223" rx="12" ry="6" fill="#E2A782" stroke="#4A2612" strokeWidth="2" />
                  <path d="M125 140 L175 110 L195 98" stroke="#0284C7" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="195" cy="98" rx="12" ry="7" fill="#E2A782" stroke="#4A2612" strokeWidth="2" />
                  <circle cx="195" cy="98" r="18" fill="url(#sparkGlow)" opacity="0.9" />
                  <path d="M65 88 L38 105" stroke="#38BDF8" strokeWidth="18" strokeLinecap="round" />
                  <circle cx="38" cy="105" r="9" fill="#E2A782" stroke="#4A2612" strokeWidth="2" />
                </g>
              )}

              {poseIndex === 1 && (
                /* POWER GYAKU ZUKI PUNCH */
                <g>
                  <path d="M130 88 L188 88" stroke="#38BDF8" strokeWidth="20" strokeLinecap="round" />
                  <circle cx="190" cy="88" r="12" fill="#E2A782" stroke="#4A2612" strokeWidth="2" />
                  <circle cx="190" cy="88" r="20" stroke="#00F0FF" strokeWidth="3" fill="none" className="animate-ping" />
                  <path d="M60 140 L35 215" stroke="#0284C7" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="35" cy="218" rx="12" ry="6" fill="#E2A782" stroke="#4A2612" strokeWidth="2" />
                  <path d="M135 140 L158 215" stroke="#0284C7" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="158" cy="218" rx="12" ry="6" fill="#E2A782" stroke="#4A2612" strokeWidth="2" />
                </g>
              )}

              {poseIndex === 2 && (
                /* MOUNTAIN GUARD */
                <g>
                  <path d="M130 88 L145 45 L122 35" stroke="#38BDF8" strokeWidth="18" strokeLinecap="round" />
                  <circle cx="122" cy="35" r="10" fill="#E2A782" stroke="#4A2612" strokeWidth="2" />
                  <path d="M60 140 L40 215" stroke="#0284C7" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="40" cy="218" rx="12" ry="6" fill="#E2A782" stroke="#4A2612" strokeWidth="2" />
                  <path d="M135 140 L158 215" stroke="#0284C7" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="158" cy="218" rx="12" ry="6" fill="#E2A782" stroke="#4A2612" strokeWidth="2" />
                </g>
              )}

              <defs>
                <linearGradient id="blueGiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#0369A1" />
                </linearGradient>
                <linearGradient id="cyanSwirl" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <radialGradient id="cyanGlowCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF000" opacity="1" />
                  <stop offset="100%" stopColor="#FF0000" opacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}

      {/* RIGHT SIDE: FEMALE KARATE FIGHTER IN WHITE GI (ANTIGRAVITY STRIKE) - SMALL SIZE IN FRONT OF BANNER */}
      {(position === 'right' || position === 'both') && (
        <div className="absolute -right-4 sm:-right-8 -top-8 sm:-top-10 z-50 pointer-events-none transition-all duration-700">
          {/* Glowing Purple Aura Swirl */}
          <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl animate-pulse" />

          <div className="relative flex flex-col items-center animate-bounce-slow">
            {/* Small Action Tag */}
            <div className="mb-1 px-2.5 py-0.5 bg-slate-950/95 border border-purple-400 text-purple-300 font-mono font-extrabold text-[9px] tracking-wider rounded-full shadow-[0_0_12px_rgba(168,85,247,0.6)] uppercase flex items-center gap-1 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              WHITE GI: KICK 🥋
            </div>

            {/* HIGH QUALITY COMPACT WHITE GI FEMALE KARATE FIGHTER SVG */}
            <svg
              width="110"
              height="130"
              viewBox="0 0 200 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="filter drop-shadow-[0_8px_20px_rgba(168,85,247,0.6)] transition-all duration-500 scale-x-[-1] transform hover:scale-105"
            >
              {/* Purple/Pink Energy Swirl Ring */}
              <circle cx="100" cy="120" r="80" stroke="url(#purpleSwirl)" strokeWidth="6" strokeDasharray="12 6" fill="none" className="animate-spin-slow" />
              <circle cx="100" cy="120" r="60" fill="url(#purpleGlowCore)" opacity="0.35" />

              {/* Ponytail Hair Flowing */}
              <path d="M125 40 C150 22 172 26 185 12 C172 38 155 44 130 42 Z" fill="#2E1810" className="animate-pulse" />

              {/* Female Head */}
              <ellipse cx="100" cy="50" rx="15" ry="18" fill="#F5D0B5" />
              <path d="M84 38 Q100 20 116 38 Q108 30 100 32 Q92 30 84 38 Z" fill="#2E1810" />
              <path d="M82 40 Q100 36 118 40 L120 48 Q100 44 80 48 Z" fill="#C084FC" />

              {/* Facial features */}
              <path d="M92 52 Q100 55 108 52" stroke="#4A2612" strokeWidth="2" strokeLinecap="round" />

              {/* WHITE KARATE GI (PROJECT: ANTIGRAVITY STRIKE UNIFORM) */}
              <path d="M62 78 L138 78 L150 135 L50 135 Z" fill="url(#whiteGiGrad)" stroke="#C084FC" strokeWidth="2" />
              <path d="M80 78 L100 120 L120 78" stroke="#9333EA" strokeWidth="4" fill="none" />

              {/* BLACK BELT (KURO-OBI) */}
              <rect x="58" y="128" width="84" height="13" rx="2" fill="#0F172A" stroke="#000000" strokeWidth="2" />
              <path d="M90 133 L80 175 L70 172 L86 133 Z" fill="#0F172A" />
              <path d="M110 133 L122 170 L132 168 L116 133 Z" fill="#0F172A" />

              {/* DYNAMIC COMBAT POSES */}
              {poseIndex === 0 && (
                /* HIGH FLYING KICK */
                <g>
                  <path d="M75 140 L65 220" stroke="#F8FAFC" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="65" cy="223" rx="12" ry="6" fill="#F5D0B5" stroke="#4A2612" strokeWidth="2" />
                  <path d="M125 140 L175 110 L195 98" stroke="#F8FAFC" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="195" cy="98" rx="12" ry="7" fill="#F5D0B5" stroke="#4A2612" strokeWidth="2" />
                  <circle cx="195" cy="98" r="18" fill="url(#sparkGlow)" opacity="0.9" />
                  <path d="M65 88 L40 102" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
                  <circle cx="40" cy="102" r="9" fill="#F5D0B5" stroke="#4A2612" strokeWidth="2" />
                </g>
              )}

              {poseIndex === 1 && (
                /* HIGH RISING BLOCK */
                <g>
                  <path d="M130 88 L145 42 L122 34" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
                  <circle cx="122" cy="34" r="10" fill="#F5D0B5" stroke="#4A2612" strokeWidth="2" />
                  <path d="M60 140 L40 215" stroke="#F8FAFC" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="40" cy="218" rx="12" ry="6" fill="#F5D0B5" stroke="#4A2612" strokeWidth="2" />
                  <path d="M135 140 L158 215" stroke="#F8FAFC" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="158" cy="218" rx="12" ry="6" fill="#F5D0B5" stroke="#4A2612" strokeWidth="2" />
                </g>
              )}

              {poseIndex === 2 && (
                /* ROUNDHOUSE KICK */
                <g>
                  <path d="M75 140 L62 210" stroke="#F8FAFC" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="62" cy="214" rx="12" ry="6" fill="#F5D0B5" stroke="#4A2612" strokeWidth="2" />
                  <path d="M125 140 L180 95" stroke="#F8FAFC" strokeWidth="22" strokeLinecap="round" />
                  <ellipse cx="180" cy="95" rx="12" ry="7" fill="#F5D0B5" stroke="#4A2612" strokeWidth="2" />
                  <circle cx="180" cy="95" r="20" stroke="#C084FC" strokeWidth="3" fill="none" className="animate-ping" />
                  <path d="M65 88 L42 100" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
                  <circle cx="42" cy="100" r="9" fill="#F5D0B5" stroke="#4A2612" strokeWidth="2" />
                </g>
              )}

              <defs>
                <linearGradient id="whiteGiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
                <linearGradient id="purpleSwirl" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                <radialGradient id="purpleGlowCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}
    </>
  );
};
