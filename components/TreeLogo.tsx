import React from 'react';

export const TreeLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Handle */}
      <rect 
        x="130" 
        y="130" 
        width="20" 
        height="60" 
        rx="10" 
        transform="rotate(-45 130 130)" 
        fill="#1e293b" 
      />

      {/* Outer Ring (Dark Blue) */}
      <circle cx="90" cy="90" r="70" stroke="#1e293b" strokeWidth="12" />
      
      {/* Inner Ring (Emerald Green) */}
      <circle cx="90" cy="90" r="60" stroke="#10b981" strokeWidth="4" strokeOpacity="0.8" />
      
      {/* Innermost Ring (Light Blue) */}
      <circle cx="90" cy="90" r="54" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.6" />

      {/* Financial Bar Graph */}
      <g transform="translate(50, 55)">
        <rect x="0" y="35" width="12" height="35" rx="2" fill="#3b82f6" />
        <rect x="22" y="20" width="12" height="50" rx="2" fill="#10b981" />
        <rect x="44" y="5" width="12" height="65" rx="2" fill="#1e293b" />
        
        {/* Ascending Arrow */}
        <path 
            d="M65 55 L75 45 L85 55" 
            stroke="#10b981" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
        />
        <path 
            d="M65 40 L75 30 L85 40" 
            stroke="#3b82f6" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
        />
      </g>
    </svg>
  );
};