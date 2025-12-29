import React from 'react';
import { generateImageDataUrl } from '@/components/generated-image';

export const createFallbackImage = (id: string, width: number = 400, height: number = 300): string => {
  return generateImageDataUrl(id, width, height);
};

export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>, fallbackId: string) => {
  const img = event.currentTarget;
  if (!img.dataset.fallbackAttempted) {
    img.dataset.fallbackAttempted = 'true';
    img.src = createFallbackImage(fallbackId, img.width || 400, img.height || 300);
  }
};

// Enhanced Image component with automatic fallback
interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackId: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  fallbackId, 
  ...props 
}) => {
  return (
    <img
      {...props}
      src={src}
      alt={alt}
      onError={(e) => handleImageError(e, fallbackId)}
    />
  );
};