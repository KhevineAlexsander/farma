import React from 'react';

interface PeptideVialProps {
  capColor?: string; // hex color or preset
  name?: string;
  dosage?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  glow?: boolean;
}

export const PeptideVial: React.FC<PeptideVialProps> = ({
  capColor = '#0088FF',
  name = 'PEPTIDE',
  dosage = '',
  size = 'md',
  className = '',
  glow = false,
}) => {
  // Dimensions based on size
  const dimensions = {
    sm: { w: 90, h: 140, scale: 0.7 },
    md: { w: 120, h: 180, scale: 0.9 },
    lg: { w: 150, h: 220, scale: 1.1 },
    hero: { w: 200, h: 300, scale: 1.5 },
  };

  const currentDim = dimensions[size];
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: currentDim.w,
        height: currentDim.h,
      }}
    >
      {/* Ambient Floor Shadow */}
      <div
        className="absolute -bottom-1 w-3/4 h-3 bg-black/40 rounded-full blur-sm"
        style={{
          boxShadow: glow ? `0 0 24px ${capColor}55` : undefined,
        }}
      />

      <svg
        viewBox="0 0 120 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-md transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Cap Gradient */}
          <linearGradient id={`capGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={capColor} stopOpacity="0.8" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="60%" stopColor={capColor} stopOpacity="1" />
            <stop offset="100%" stopColor="#0B132B" stopOpacity="0.9" />
          </linearGradient>

          {/* Aluminum Crimp Gradient */}
          <linearGradient id={`metalCrimp-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="25%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="85%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Glass Specular Reflection */}
          <linearGradient id={`glassGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="15%" stopColor="#E2E8F0" stopOpacity="0.1" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="90%" stopColor="#94A3B8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.4" />
          </linearGradient>

          {/* Glass Highlight Line */}
          <linearGradient id={`sheen-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>

          {/* Dark Metallic Label Gradient */}
          <linearGradient id={`labelGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0A0E17" />
            <stop offset="20%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="80%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0A0E17" />
          </linearGradient>

          {/* Lyophilized Cake / Powder Gradient */}
          <linearGradient id={`powderGrad-${uniqueId}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F1F5F9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* --- 1. TOP CAP (Colored Plastic Flip-off Ring) --- */}
        <rect
          x="38"
          y="8"
          width="44"
          height="9"
          rx="4.5"
          fill={`url(#capGrad-${uniqueId})`}
        />
        {/* Cap top rim button */}
        <ellipse cx="60" cy="9.5" rx="14" ry="2" fill="#FFFFFF" fillOpacity="0.6" />

        {/* --- 2. ALUMINUM CRIMP SEAL RING --- */}
        <rect
          x="42"
          y="16"
          width="36"
          height="12"
          rx="1"
          fill={`url(#metalCrimp-${uniqueId})`}
        />
        {/* Crimp Horizontal Indents / Grooves */}
        <line x1="42" y1="20" x2="78" y2="20" stroke="#475569" strokeWidth="0.8" opacity="0.6" />
        <line x1="42" y1="24" x2="78" y2="24" stroke="#334155" strokeWidth="0.8" opacity="0.7" />

        {/* --- 3. GLASS VIAL BODY --- */}
        {/* Glass Neck */}
        <path
          d="M 44 28 L 44 36 C 44 42, 28 46, 28 56 L 28 152 C 28 160, 34 166, 44 166 L 76 166 C 86 166, 92 160, 92 152 L 92 56 C 92 46, 76 42, 76 36 L 76 28 Z"
          fill={`url(#glassGrad-${uniqueId})`}
          stroke="#94A3B8"
          strokeWidth="1.2"
        />

        {/* Bottom Glass Thickness (Base) */}
        <path
          d="M 30 148 C 30 162, 90 162, 90 148 L 90 152 C 90 164, 30 164, 30 152 Z"
          fill="#64748B"
          fillOpacity="0.4"
        />

        {/* Lyophilized Peptide Powder Cake inside bottom */}
        <path
          d="M 30 134 Q 60 130 90 134 L 90 154 Q 60 162 30 154 Z"
          fill={`url(#powderGrad-${uniqueId})`}
        />
        <ellipse cx="60" cy="134" rx="28" ry="3" fill="#FFFFFF" fillOpacity="0.7" />

        {/* --- 4. PRODUCT LABEL (Dark metallic wrap) --- */}
        <rect
          x="28.5"
          y="62"
          width="63"
          height="66"
          rx="2"
          fill={`url(#labelGrad-${uniqueId})`}
          stroke="#334155"
          strokeWidth="0.6"
        />

        {/* Label Content: Glow DNA Helix Logo & Brand */}
        <g transform="translate(60, 84)">
          {/* Mini DNA Helix */}
          <circle cx="-5" cy="-10" r="1.5" fill="#00E5FF" />
          <circle cx="5" cy="-10" r="1.5" fill="#38BDF8" />
          <line x1="-5" y1="-10" x2="5" y2="-10" stroke="#00E5FF" strokeWidth="1" strokeOpacity="0.7" />

          <circle cx="0" cy="-6" r="1.2" fill="#FFFFFF" />

          <circle cx="5" cy="-2" r="1.5" fill="#00E5FF" />
          <circle cx="-5" cy="-2" r="1.5" fill="#38BDF8" />
          <line x1="-5" y1="-2" x2="5" y2="-2" stroke="#00E5FF" strokeWidth="1" strokeOpacity="0.7" />

          {/* DNA Waves */}
          <path
            d="M -5 -10 Q 0 -6 5 -2"
            stroke="#00E5FF"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M 5 -10 Q 0 -6 -5 -2"
            stroke="#38BDF8"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Brand Name on Label */}
          <text
            x="0"
            y="11"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="5.2"
            fontWeight="bold"
            fontFamily="Space Grotesk, sans-serif"
            letterSpacing="0.8"
          >
            PEPTIDE
          </text>
          <text
            x="0"
            y="18"
            textAnchor="middle"
            fill="#00E5FF"
            fontSize="3.8"
            fontWeight="600"
            fontFamily="Space Grotesk, sans-serif"
            letterSpacing="1.2"
          >
            IMPORTS
          </text>

          {/* Subtle Dosage Indicator on Label */}
          {dosage && (
            <text
              x="0"
              y="32"
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="3.2"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.5"
            >
              {dosage}
            </text>
          )}
        </g>

        {/* --- 5. GLASS SPECULAR HIGHLIGHT REFLECTIONS --- */}
        {/* Left vertical glass highlight line */}
        <path
          d="M 32 54 L 32 156"
          stroke="url(#sheen-${uniqueId})"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Right subtle secondary highlight */}
        <path
          d="M 87 56 L 87 154"
          stroke="#FFFFFF"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Shoulder glass curve shine */}
        <path
          d="M 34 46 C 42 42, 50 40, 56 40"
          stroke="#FFFFFF"
          strokeOpacity="0.5"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
