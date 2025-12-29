import React from 'react';

interface IntraKartLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function IntraKartLogo({
  variant = 'full',
  size = 'md',
  className = ''
}: IntraKartLogoProps) {
  const sizeClasses = {
    sm: 'h-8 text-lg',
    md: 'h-10 text-xl',
    lg: 'h-12 text-2xl',
    xl: 'h-16 text-4xl'
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 56
  };

  const currentIconSize = iconSizes[size];

  // Minimalist Geometric 'K' / Abstract Shape
  // A clean vertical line interacting with a chevron, representing structure (interior) and guidance (AI).
  const LogoIcon = () => (
    <svg
      width={currentIconSize}
      height={currentIconSize}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      <rect x="8" y="4" width="6" height="32" className="fill-current" />
      <path d="M32 4L16 20L32 36" stroke="currentColor" strokeWidth="6" strokeLinecap="square" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <LogoIcon />
        <div className="flex flex-col justify-center">
          <span className={`font-light tracking-[0.2em] uppercase ${sizeClasses[size].split(' ')[1]}`}>
            IntraKart
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className} ${sizeClasses[size]}`}>
      <LogoIcon />
      <div className="flex flex-col justify-center">
        <span className="font-light tracking-[0.25em] uppercase leading-none">
          IntraKart
        </span>
        <span className="text-[10px] tracking-[0.4em] text-muted-foreground uppercase mt-1">
          Studio
        </span>
      </div>
    </div>
  );
}