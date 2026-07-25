'use client';

import React from 'react';

interface SpLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

/**
 * Official SP SportData Solution Logo Component
 * Renders the exact authentic logo image provided.
 */
export const SpLogo: React.FC<SpLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return 'h-7 sm:h-8 max-w-[200px]';
      case 'lg':
        return 'h-14 sm:h-16 max-w-[380px]';
      case 'xl':
        return 'h-20 sm:h-24 max-w-[500px]';
      default:
        return 'h-10 sm:h-12 max-w-[280px]';
    }
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/sp_logo.jpg"
        alt="SP SportData Solution"
        className={`${getDimensions()} object-contain filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]`}
      />
    </div>
  );
};
