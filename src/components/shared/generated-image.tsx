import React from 'react';

interface GeneratedImageProps {
  width?: number;
  height?: number;
  id: string;
  description: string;
  className?: string;
}

const imageConfigs = {
  'hero-background': {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    pattern: 'living-room',
    overlay: 'Modern Living Space'
  },
  'featured-living-room': {
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    pattern: 'sofa',
    overlay: 'Modern Living Room'
  },
  'featured-bedroom': {
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    pattern: 'bed',
    overlay: 'Contemporary Bedroom'
  },
  'featured-dining-room': {
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    pattern: 'table',
    overlay: 'Minimalist Dining Room'
  },
  'category-sofas': {
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    pattern: 'sofa',
    overlay: 'Sofas'
  },
  'category-dining-tables': {
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    pattern: 'table',
    overlay: 'Dining Tables'
  },
  'category-beds': {
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    pattern: 'bed',
    overlay: 'Beds'
  },
  'category-storage': {
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    pattern: 'storage',
    overlay: 'Storage'
  },
  'category-lighting': {
    gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    pattern: 'lamp',
    overlay: 'Lighting'
  },
  'category-decor': {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    pattern: 'decor',
    overlay: 'Decor'
  },
  'avatar-sophia': {
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    pattern: 'avatar',
    overlay: 'ST'
  },
  'avatar-ethan': {
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    pattern: 'avatar',
    overlay: 'EW'
  },
  'avatar-olivia': {
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    pattern: 'avatar',
    overlay: 'OR'
  },
  'ar-chair': {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    pattern: 'chair',
    overlay: 'Chair'
  },
  'ar-sofa': {
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    pattern: 'sofa',
    overlay: 'Sofa'
  },
  'ar-table': {
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    pattern: 'table',
    overlay: 'Table'
  },
  'ar-lamp': {
    gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    pattern: 'lamp',
    overlay: 'Lamp'
  },
  'ar-bookshelf': {
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    pattern: 'bookshelf',
    overlay: 'Bookshelf'
  },
  'ar-plant': {
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    pattern: 'plant',
    overlay: 'Plant'
  }
};

const PatternSVG = ({ pattern, id }: { pattern: string; id: string }) => {
  const patterns = {
    'living-room': (
      <g opacity="0.1">
        <rect x="20" y="60" width="80" height="40" rx="5" fill="currentColor" />
        <rect x="120" y="50" width="60" height="60" rx="5" fill="currentColor" />
        <circle cx="200" cy="80" r="15" fill="currentColor" />
      </g>
    ),
    'sofa': (
      <g opacity="0.15">
        <path d="M30 70 L170 70 Q180 70 180 80 L180 100 Q180 110 170 110 L30 110 Q20 110 20 100 L20 80 Q20 70 30 70 Z" fill="currentColor" />
        <rect x="25" y="50" width="15" height="30" rx="7" fill="currentColor" />
        <rect x="160" y="50" width="15" height="30" rx="7" fill="currentColor" />
      </g>
    ),
    'bed': (
      <g opacity="0.12">
        <rect x="40" y="70" width="120" height="60" rx="8" fill="currentColor" />
        <rect x="35" y="60" width="130" height="20" rx="10" fill="currentColor" />
      </g>
    ),
    'table': (
      <g opacity="0.1">
        <ellipse cx="100" cy="80" rx="60" ry="30" fill="currentColor" />
        <rect x="50" y="110" width="8" height="40" fill="currentColor" />
        <rect x="142" y="110" width="8" height="40" fill="currentColor" />
      </g>
    ),
    'chair': (
      <g opacity="0.15">
        <rect x="70" y="40" width="60" height="80" rx="5" fill="currentColor" />
        <rect x="65" y="100" width="70" height="8" rx="4" fill="currentColor" />
      </g>
    ),
    'lamp': (
      <g opacity="0.12">
        <polygon points="100,30 120,70 80,70" fill="currentColor" />
        <rect x="98" y="70" width="4" height="60" fill="currentColor" />
        <ellipse cx="100" cy="135" rx="20" ry="5" fill="currentColor" />
      </g>
    ),
    'storage': (
      <g opacity="0.1">
        <rect x="60" y="40" width="80" height="100" rx="5" fill="currentColor" />
        <line x1="60" y1="73" x2="140" y2="73" stroke="currentColor" strokeWidth="2" />
        <line x1="60" y1="106" x2="140" y2="106" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
    'bookshelf': (
      <g opacity="0.1">
        <rect x="50" y="30" width="100" height="120" rx="5" fill="currentColor" />
        <line x1="50" y1="65" x2="150" y2="65" stroke="currentColor" strokeWidth="2" />
        <line x1="50" y1="100" x2="150" y2="100" stroke="currentColor" strokeWidth="2" />
        <line x1="50" y1="135" x2="150" y2="135" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
    'plant': (
      <g opacity="0.15">
        <ellipse cx="100" cy="130" rx="25" ry="15" fill="currentColor" />
        <path d="M100 130 Q85 110 75 90 Q80 85 90 95 Q95 100 100 110" fill="currentColor" />
        <path d="M100 130 Q115 110 125 90 Q120 85 110 95 Q105 100 100 110" fill="currentColor" />
        <path d="M100 130 Q100 115 95 95 Q105 95 100 110" fill="currentColor" />
      </g>
    ),
    'decor': (
      <g opacity="0.1">
        <circle cx="80" cy="60" r="20" fill="currentColor" />
        <rect x="110" y="45" width="30" height="30" rx="3" fill="currentColor" />
        <polygon points="160,50 170,70 150,70" fill="currentColor" />
      </g>
    ),
    'avatar': (
      <g opacity="0.2">
        <circle cx="100" cy="70" r="25" fill="currentColor" />
        <path d="M75 120 Q100 100 125 120 L125 140 L75 140 Z" fill="currentColor" />
      </g>
    )
  };

  return (
    <svg width="100%" height="100%" viewBox="0 0 200 160" className="absolute inset-0">
      <defs>
        <pattern id={`pattern-${id}`} patternUnits="userSpaceOnUse" width="200" height="160">
          {patterns[pattern as keyof typeof patterns] || patterns['living-room']}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#pattern-${id})`} />
    </svg>
  );
};

export const GeneratedImage: React.FC<GeneratedImageProps> = ({
  width = 400,
  height = 300,
  id,
  description,
  className = ''
}) => {
  const config = imageConfigs[id as keyof typeof imageConfigs] || imageConfigs['hero-background'];
  
  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ 
        width: width, 
        height: height,
        background: config.gradient 
      }}
    >
      <PatternSVG pattern={config.pattern} id={id} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-lg font-semibold opacity-80 drop-shadow-lg">
            {config.overlay}
          </div>
          {id.startsWith('avatar-') && (
            <div className="text-2xl font-bold mt-2 opacity-90">
              {config.overlay}
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
};

// Data URL generator for static images
export const generateImageDataUrl = (id: string, width: number = 400, height: number = 300): string => {
  const config = imageConfigs[id as keyof typeof imageConfigs] || imageConfigs['hero-background'];
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${config.gradient.match(/#[a-fA-F0-9]{6}/g)?.[0] || '#667eea'}" />
          <stop offset="100%" style="stop-color:${config.gradient.match(/#[a-fA-F0-9]{6}/g)?.[1] || '#764ba2'}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="24" font-weight="bold" opacity="0.8">
        ${config.overlay}
      </text>
      <rect width="100%" height="100%" fill="url(data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='none' stroke='white' stroke-width='1' opacity='0.1'/%3E%3C/svg%3E)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};