import React from 'react';

interface DnaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
}

// Brand assets live in /public/brand (generated from the original Glow Slim logo, background removed).
// Intrinsic sizes: logo-mark 256x193, logo-wordmark 720x168.
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

  const wordmarkHeights = {
    sm: 'h-6',
    md: 'h-7 sm:h-8',
    lg: 'h-10',
    xl: 'h-12',
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <img
        src="/brand/logo-mark.webp"
        alt={withText ? '' : 'Glow Slim Peptide Imports'}
        width={256}
        height={193}
        decoding="async"
        draggable={false}
        className={`w-auto shrink-0 ${markHeights[size]}`}
      />

      {withText && (
        <img
          src="/brand/logo-wordmark.webp"
          alt="Glow Slim Peptide Imports"
          width={720}
          height={168}
          decoding="async"
          draggable={false}
          className={`w-auto ${wordmarkHeights[size]}`}
        />
      )}
    </div>
  );
};
