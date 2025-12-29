import React from 'react';
import { generateImageDataUrl } from '@/components/shared/generated-image';

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

// Note: SmartImage component has been moved to src/components/shared/smart-image.tsx
// This file contains helper functions for image handling