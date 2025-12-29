import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  subtext?: string;
  generated?: boolean;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
