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
    sm: 'w-24 h-8',
    md: 'w-32 h-10',
    lg: 'w-40 h-12',
    xl: 'w-48 h-16'
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  if (variant === 'icon') {
    return (
      <div className={`${iconSizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="32" fill="url(#gradient2)"/>
          <path d="M20 42V28L32 18L44 28V42H38V34H26V42H20Z" fill="white" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
          <circle cx="32" cy="28" r="2.5" fill="#FF6B35"/>
          <rect x="28" y="36" width="8" height="6" rx="1" fill="rgba(255,255,255,0.8)"/>
          <rect x="40" y="24" width="2" height="2" rx="1" fill="#FF6B35"/>
          <rect x="40" y="36" width="2" height="2" rx="1" fill="#00D4FF"/>
          <rect x="22" y="24" width="2" height="2" rx="1" fill="#00D4FF"/>
          <circle cx="24" cy="40" r="1" fill="#00D4FF" opacity="0.8"/>
          <circle cx="40" cy="40" r="1" fill="#FF6B35" opacity="0.8"/>
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#6366f1", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#8b5cf6", stopOpacity:1}} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <IntraKartLogo variant="icon" size={size} />
        <div className="flex flex-col">
          <span className="text-xl font-bold text-foreground">IntraKart</span>
          <span className="text-xs text-muted-foreground">AI + AR Interior Design</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="200" height="60" rx="8" fill="url(#gradient1)"/>
        <rect x="8" y="8" width="44" height="44" rx="8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <path d="M18 35V25L30 17L42 25V35H35V29H25V35H18Z" fill="white"/>
        <circle cx="30" cy="25" r="2" fill="#FF6B35"/>
        <rect x="27" y="31" width="6" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
        <rect x="38" y="20" width="2" height="2" rx="1" fill="#FF6B35"/>
        <rect x="38" y="33" width="2" height="2" rx="1" fill="#00D4FF"/>
        <rect x="20" y="20" width="2" height="2" rx="1" fill="#00D4FF"/>
        <text x="60" y="25" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="700" fill="white">IntraKart</text>
        <text x="60" y="40" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="400" fill="rgba(255,255,255,0.8)">AI + AR Interior Design</text>
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#667eea", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#764ba2", stopOpacity:1}} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}