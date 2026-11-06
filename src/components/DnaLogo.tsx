import React from 'react';

interface DnaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
}

// Brand assets live in /public/brand (generated from the original Glow Slim logo, background removed).
// Intrinsic size: logo-mark 256x193.
export const DnaLogo: React.FC<DnaLogoProps> = ({
  className = '',
  size = 'md',
  withText = true,
}) => {
  const markHeights = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
    xl: 'h-14',
  };

  // Wordmark desenhado em texto (a imagem antiga trazia o nome anterior da marca).
  const wordmarkSizes = {
    sm: { main: 'text-[15px]', sub: 'text-[7px]' },
    md: { main: 'text-[17px] sm:text-[20px]', sub: 'text-[8px] sm:text-[9px]' },
    lg: { main: 'text-[26px]', sub: 'text-[11px]' },
    xl: { main: 'text-[32px]', sub: 'text-[13px]' },
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <img
        src="/brand/logo-mark.webp"
        alt={withText ? '' : 'Glow Imports Farma'}
        width={256}
        height={193}
        decoding="async"
        draggable={false}
        className={`w-auto shrink-0 ${markHeights[size]}`}
      />

      {withText && (
        <div
          className="flex flex-col items-center leading-none"
          role="img"
          aria-label="Glow Imports Farma"
          style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif" }}
        >
          <span className={`font-bold italic tracking-tight whitespace-nowrap ${wordmarkSizes[size].main}`} aria-hidden="true">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #d7dde4 45%, #8f99a6 55%, #eef2f6 100%)' }}
            >
              GLOW{' '}
            </span>
            <span
              className="bg-clip-text text-transparent pr-[0.12em]"
              style={{ backgroundImage: 'linear-gradient(180deg, #7fd3ff 0%, #1ea0ff 50%, #0a6fd6 100%)' }}
            >
              IMPORTS
            </span>
          </span>
          <span className="flex items-center gap-1.5 w-full mt-0.5" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-sky-400" />
            <span className={`font-bold tracking-[0.35em] text-sky-400 ${wordmarkSizes[size].sub}`}>FARMA</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-sky-400" />
          </span>
        </div>
      )}
    </div>
  );
};
