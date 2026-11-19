import React from 'react';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* High-Tech Vector Logo Badge */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#020617] border border-indigo-500/40 shadow-glow-primary transition-all duration-300 group-hover:scale-105 group-hover:border-accent-primary group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] overflow-hidden`}
      >
        {/* Ambient Neon Backlight Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/20 via-purple-500/20 to-cyan-500/20 opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Custom SVG Icon Glyphs */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5 relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bracketLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="bracketRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="slashGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Left Bracket < */}
          <path
            d="M36 30L22 50L36 70"
            stroke="url(#bracketLeft)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right Bracket > */}
          <path
            d="M64 30L78 50L64 70"
            stroke="url(#bracketRight)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center Dynamic Slash / */}
          <path
            d="M58 24L42 76"
            stroke="url(#slashGrad)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* AI Sparkle Star Core */}
          <g transform="translate(50, 50)">
            <circle cx="0" cy="0" r="8" fill="#38BDF8" fillOpacity="0.4" />
            <path
              d="M0 -7C0 -2 2 0 7 0C2 0 0 2 0 7C0 2 -2 0 -7 0C-2 0 0 -2 0 -7Z"
              fill="#FFFFFF"
            />
          </g>
        </svg>

        {/* Outer Corner Accent Dot */}
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse pointer-events-none" />
      </div>

      {/* Brand Wordmark Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight font-sans text-white ${textSizes[size]}`}
            >
              Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-indigo-300">Sync</span>
            </span>

            {/* Glowing AI Pill */}
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/40 text-cyan-300 shadow-[0_0_8px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-2.5 h-2.5 text-accent-secondary animate-pulse" />
              AI
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
