import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface RoomAnalysis {
  walls: {
    count: number;
    dominantColor: string;
    texture: 'smooth' | 'textured' | 'painted' | 'wallpaper';
  };
  floor: {
    type: 'hardwood' | 'carpet' | 'tile' | 'concrete' | 'other';
    color: string;
    condition: 'good' | 'fair' | 'needs_update';
  };
  lighting: {
    type: 'natural' | 'artificial' | 'mixed';
    brightness: 'dim' | 'moderate' | 'bright';
    sources: string[];
  };
  space: {
    size: 'small' | 'medium' | 'large';
    layout: 'open' | 'compartmented';
    dimensions: {
      estimatedWidth: number;
      estimatedLength: number;
      estimatedArea: number;
    };
  };
  existingFurniture: {
    detected: boolean;
    items: string[];
    style: 'modern' | 'traditional' | 'mixed' | 'minimalist' | 'rustic';
  };
  colorPalette: {
    dominant: string;
    secondary: string[];
    mood: 'warm' | 'cool' | 'neutral';
  };
  recommendations: {
    style: string[];
    colors: string[];
    furniture: string[];
    improvements: string[];
  };
}

export class RoomAnalyzer {
  private model: cocoSsd.ObjectDetection | null = null;
  private isModelLoading = false;

  constructor() {
    // Lazy initialization in analyzeRoom
  }

  private async initializeModel() {
    if (this.model || this.isModelLoading) return;

    this.isModelLoading = true;
    try {
      // Load COCO-SSD model
      await tf.ready();
      this.model = await cocoSsd.load();
      console.log('Room Analyzer model initialized');
    } catch (error) {
      console.error('Error initializing room analyzer model:', error);
    } finally {
      this.isModelLoading = false;
    }
  }

  async analyzeRoom(imageFile: File, ceilingHeightFt: number = 9): Promise<RoomAnalysis> {
    try {
      // Ensure model is loaded
      if (!this.model && !this.isModelLoading) {
        await this.initializeModel();
      }

      // Wait for model if it's currently loading
      while (this.isModelLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Convert image to tensor
      const imageElement = await this.fileToImageElement(imageFile);
      const tensor = tf.browser.fromPixels(imageElement);

      // Analyze different aspects of the room
      const analysis: RoomAnalysis = {
        walls: await this.analyzeWalls(tensor, imageElement),
        floor: await this.analyzeFloor(tensor, imageElement),
        lighting: this.analyzeLighting(imageElement),
        space: this.analyzeSpace(imageElement, ceilingHeightFt),
        existingFurniture: await this.analyzeFurniture(imageElement),
        colorPalette: this.analyzeColors(imageElement),
        recommendations: {} as any
      };

      // Generate recommendations based on analysis
      analysis.recommendations = this.generateRecommendations(analysis);

      // Clean up tensor
      tensor.dispose();

      return analysis;
    } catch (error) {
      console.error('Error analyzing room:', error);
      throw new Error('Failed to analyze room. Please try again.');
    }
  }

  private async fileToImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async analyzeWalls(tensor: tf.Tensor, imageElement: HTMLImageElement) {
    // Simple wall analysis based on image properties
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Analyze vertical edges for wall detection
    const colorCounts: { [key: string]: number } = {};

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Simple wall detection based on vertical edges and color consistency
      const brightness = (r + g + b) / 3;
      if (brightness > 100 && brightness < 240) {
        const colorKey = `${Math.floor(r / 20) * 20},${Math.floor(g / 20) * 20},${Math.floor(b / 20) * 20}`;
        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
      }
    }

    // Find dominant wall color
    const dominantColor = Object.keys(colorCounts).reduce((a, b) =>
      colorCounts[a] > colorCounts[b] ? a : b, Object.keys(colorCounts)[0] || '200,200,200'
    );

    return {
      count: this.estimateWallCount(imageElement),
      dominantColor: `rgb(${dominantColor})`,
      texture: this.determineWallTexture(tensor)
    };
  }

  private async analyzeFloor(tensor: tf.Tensor, imageElement: HTMLImageElement) {
    // Analyze bottom portion of image for floor
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    // Sample bottom 25% of image
    const imageData = ctx.getImageData(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);
    const pixels = imageData.data;

    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      totalR += pixels[i];
      totalG += pixels[i + 1];
      totalB += pixels[i + 2];
      pixelCount++;
    }

    const avgR = Math.floor(totalR / pixelCount);
    const avgG = Math.floor(totalG / pixelCount);
    const avgB = Math.floor(totalB / pixelCount);

    return {
      type: this.determineFloorType(avgR, avgG, avgB),
      color: `rgb(${avgR}, ${avgG}, ${avgB})`,
      condition: 'good' as const
    };
  }

  private analyzeLighting(imageElement: HTMLImageElement): { type: "mixed" | "natural" | "artificial"; brightness: "dim" | "moderate" | "bright"; sources: string[] } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let totalBrightness = 0;
    let pixelCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }

    const avgBrightness = totalBrightness / pixelCount;

    return {
      type: 'mixed',
      brightness: avgBrightness > 150 ? 'bright' : avgBrightness > 100 ? 'moderate' : 'dim',
      sources: this.detectLightSources(imageElement)
    };
  }

  private analyzeSpace(imageElement: HTMLImageElement, ceilingHeightFt: number): { size: "small" | "medium" | "large"; layout: "open" | "compartmented"; dimensions: { estimatedWidth: number; estimatedLength: number; estimatedArea: number } } {
    // Calibrated space analysis using ceiling height reference
    const aspectRatio = imageElement.width / imageElement.height;

    // Heuristic: In a typical interior shot, the vertical height of the image often captures 
    // from floor to ceiling (or near it). If we assume the image height corresponds roughly 
    // to the ceiling height (in perspective), we can derive a pixel-per-foot ratio.
    // This is a simplification but better than random constants.

    // Let's assume the visible vertical range at the "back" of the room covers about 80% of the actual height
    // due to perspective.
    // pixels per foot approx = imageElement.height / ceilingHeightFt

    const pixelsPerFoot = imageElement.height / ceilingHeightFt;

    // Estimate width based on aspect ratio and height
    const estimatedWidth = Math.floor(imageElement.width / pixelsPerFoot);

    // Length is harder from 2D, but we can approximate based on "depth" cues or standard room ratios
    // For a standard room, length is often 1.2x width or similar. 
    // We'll use a conservative estimate derived from width.
    const estimatedLength = Math.floor(estimatedWidth * 1.2);

    const estimatedArea = estimatedWidth * estimatedLength;

    return {
      size: estimatedArea > 400 ? 'large' : estimatedArea > 200 ? 'medium' : 'small',
      layout: aspectRatio > 1.4 ? 'open' : 'compartmented',
      dimensions: {
        estimatedWidth,
        estimatedLength,
        estimatedArea
      }
    };
  }

  private async analyzeFurniture(imageElement: HTMLImageElement): Promise<{ detected: boolean; items: string[]; style: 'modern' | 'traditional' | 'mixed' | 'minimalist' | 'rustic' }> {
    if (!this.model) {
      return {
        detected: false,
        items: [],
        style: 'modern' as const
      };
    }

    const predictions = await this.model.detect(imageElement);

    // Filter for furniture-related classes in COCO dataset
    const furnitureClasses = ['chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'];

    const detectedItems = predictions
      .filter(p => furnitureClasses.includes(p.class) && p.score > 0.5)
      .map(p => p.class as string);

    const uniqueItems = Array.from(new Set(detectedItems)) as string[];

    return {
      detected: uniqueItems.length > 0,
      items: uniqueItems.length > 0 ? uniqueItems : ['No furniture detected'],
      style: 'modern' as const
    };
  }

  private analyzeColors(imageElement: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const colorCounts: { [key: string]: number } = {};

    // Sample every 40th pixel for performance
    for (let i = 0; i < pixels.length; i += 40) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      const colorKey = `${Math.floor(r / 30) * 30},${Math.floor(g / 30) * 30},${Math.floor(b / 30) * 30}`;
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }

    const sortedColors = Object.keys(colorCounts)
      .sort((a, b) => colorCounts[b] - colorCounts[a])
      .slice(0, 5);

    const dominant = sortedColors[0] || '200,200,200';
    const secondary = sortedColors.slice(1, 4);

    return {
      dominant: `rgb(${dominant})`,
      secondary: secondary.map(color => `rgb(${color})`),
      mood: this.determineMood(dominant)
    };
  }

  private generateRecommendations(analysis: RoomAnalysis) {
    const recommendations = {
      style: [] as string[],
      colors: [] as string[],
      furniture: [] as string[],
      improvements: [] as string[]
    };

    // Style recommendations based on analysis
    if (analysis.space.size === 'small') {
      recommendations.style.push('minimalist', 'scandinavian');
      recommendations.furniture.push('multi-functional furniture', 'wall-mounted storage');
    } else if (analysis.space.size === 'large') {
      recommendations.style.push('modern', 'traditional', 'eclectic');
      recommendations.furniture.push('sectional sofa', 'large dining table');
    }

    // Color recommendations
    if (analysis.lighting.brightness === 'dim') {
      recommendations.colors.push('light colors', 'warm whites', 'pastels');
      recommendations.improvements.push('Add more lighting sources');
    }

    // Lighting improvements
    if (analysis.lighting.brightness === 'dim') {
      recommendations.improvements.push('Consider adding floor lamps', 'Install brighter ceiling fixtures');
    }

    // Furniture based specific recommendations
    const detectedItems = analysis.existingFurniture.items;
    const isBlankRoom = !analysis.existingFurniture.detected || detectedItems.includes('No furniture detected');

    if (isBlankRoom) {
      // Suggest essentials for a blank canvas
      if (analysis.space.size === 'small') {
        recommendations.furniture.push('Compact Sofa', 'Wall Shelves', 'Folding Dining Table');
        recommendations.style.push('Minimalist', 'Japandi');
      } else {
        recommendations.furniture.push('Sectional Sofa', 'Statement Armchair', 'Coffee Table', 'Area Rug');
        recommendations.style.push('Modern', 'Contemporary');
      }
      recommendations.improvements.push('Room is a blank canvas - start with large furniture pieces first.');
    } else {
      // Existing logic for furnished rooms
      if (detectedItems.includes('bed')) {
        recommendations.furniture.push('Bedside Tables', 'Rug under bed');
      }
      if (detectedItems.includes('couch')) {
        recommendations.furniture.push('Coffee Table', 'Throw Pillows', 'Floor Lamp');
      }
    }

    // Suggest items from our shop catalog
    recommendations.furniture.push('Check our Shop for matching items');

    return recommendations;
  }

  // Helper methods
  private estimateWallCount(imageElement: HTMLImageElement): number {
    // Simple estimation based on image aspect ratio and content
    const aspectRatio = imageElement.width / imageElement.height;
    return aspectRatio > 1.5 ? 3 : 4; // Wide images likely show 3 walls, square/tall show 4
  }

  private determineWallTexture(tensor: tf.Tensor): 'smooth' | 'textured' | 'painted' | 'wallpaper' {
    // Simplified texture analysis
    return 'painted'; // Default assumption
  }

  private determineFloorType(r: number, g: number, b: number): 'hardwood' | 'carpet' | 'tile' | 'concrete' | 'other' {
    const brightness = (r + g + b) / 3;

    if (brightness < 80) return 'hardwood';
    if (brightness > 200) return 'tile';
    if (r > g + 20 && r > b + 20) return 'hardwood';
    return 'carpet';
  }

  private detectLightSources(imageElement: HTMLImageElement): string[] {
    // Simple light source detection
    return ['window', 'ceiling light']; // Placeholder
  }

  private determineMood(dominantColor: string): 'warm' | 'cool' | 'neutral' {
    const [r, g, b] = dominantColor.split(',').map(n => parseInt(n));

    if (r > g + 20 && r > b + 20) return 'warm';
    if (b > r + 20 && b > g + 20) return 'cool';
    return 'neutral';
  }
}

export const roomAnalyzer = new RoomAnalyzer();