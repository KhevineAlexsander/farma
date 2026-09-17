import React from 'react';

interface DnaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
}

export const DnaLogo: React.FC<DnaLogoProps> = ({
  className = '',
  size = 'md',
  withText = true,
}) => {
  const iconSizes = {
    sm: 'w-6 h-8',
    md: 'w-8 h-10',
    lg: 'w-10 h-12',
    xl: 'w-12 h-16',
  };

  const textSizes = {
    sm: { title: 'text-sm tracking-wider', sub: 'text-[9px] tracking-[0.25em]' },
    md: { title: 'text-lg tracking-widest font-extrabold', sub: 'text-[10px] tracking-[0.3em] font-semibold' },
    lg: { title: 'text-2xl tracking-widest font-extrabold', sub: 'text-xs tracking-[0.35em] font-bold' },
    xl: { title: 'text-3xl tracking-widest font-extrabold', sub: 'text-sm tracking-[0.4em] font-bold' },
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Stylized Glowing DNA Helix */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 48 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]"
        >
          <defs>
            <linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#0066FF" />
            </linearGradient>
            <linearGradient id="dnaGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="rungGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#0088FF" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* DNA Ladder Rungs */}
          <line x1="14" y1="12" x2="34" y2="12" stroke="url(#rungGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="18" y1="22" x2="30" y2="22" stroke="url(#rungGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <line x1="22" y1="32" x2="26" y2="32" stroke="url(#rungGrad)" strokeWidth="3" strokeLinecap="round" />
          <line x1="18" y1="42" x2="30" y2="42" stroke="url(#rungGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <line x1="14" y1="52" x2="34" y2="52" stroke="url(#rungGrad)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Left Strand Wave */}
          <path
            d="M 14 8 C 8 20, 8 24, 24 32 C 40 40, 40 44, 34 56"
            stroke="url(#dnaGrad1)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Right Strand Wave */}
          <path
            d="M 34 8 C 40 20, 40 24, 24 32 C 8 40, 8 44, 14 56"
            stroke="url(#dnaGrad2)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Glowing Nodes / Base Pairs */}
          <circle cx="14" cy="8" r="3" fill="#00E5FF" className="animate-pulse" />
          <circle cx="34" cy="8" r="3" fill="#38BDF8" />
          <circle cx="14" cy="12" r="2.5" fill="#00E5FF" />
          <circle cx="34" cy="12" r="2.5" fill="#0088FF" />
          <circle cx="24" cy="32" r="3" fill="#FFFFFF" />
          <circle cx="14" cy="52" r="2.5" fill="#0088FF" />
          <circle cx="34" cy="52" r="2.5" fill="#00E5FF" />
          <circle cx="14" cy="56" r="3" fill="#00E5FF" />
          <circle cx="34" cy="56" r="3" fill="#38BDF8" className="animate-pulse" />
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col leading-none">
          <span className={`font-tech text-white uppercase font-bold tracking-wider ${textSizes[size].title}`}>
            PEPTIDE
          </span>
          <span className={`font-tech text-cyan-400 uppercase tracking-widest font-semibold ${textSizes[size].sub}`}>
            IMPORTS <span className="text-slate-400 font-normal">FARMA</span>
          </span>
        </div>
      )}
    </div>
  );
};
