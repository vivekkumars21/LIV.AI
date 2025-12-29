'use client';

import { useState, useRef, useCallback } from 'react';
import { roomAnalyzer, type RoomAnalysis } from '@/lib/room-analyzer';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from './image-uploader';
import { ImagePreview } from './image-preview';
import { AnalysisResults } from './analysis-results';

interface RoomAnalyzerProps {
  onAnalysisComplete?: (analysis: RoomAnalysis) => void;
}

export function RoomAnalyzer({ onAnalysisComplete }: RoomAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const [ceilingHeight, setCeilingHeight] = useState<number>(9);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback((file: File) => {
    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzeRoom = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setProgress(10); // Start progress

    try {
      // Set expectation for AI model loading
      const loadingInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 500);

      console.log("Analyzing with ceiling height:", ceilingHeight);
      const result = await roomAnalyzer.analyzeRoom(selectedImage, ceilingHeight);

      clearInterval(loadingInterval);
      setProgress(100);

      setAnalysis(result);
      onAnalysisComplete?.(result);

      toast({
        title: 'Analysis Complete!',
        description: 'Your room has been successfully analyzed.',
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Failed to analyze the room. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!selectedImage && (
        <ImageUploader
          onImageSelected={handleImageUpload}
          fileInputRef={fileInputRef}
        />
      )}

      {/* Image Preview & Analysis */}
      {selectedImage && imagePreview && (
        <ImagePreview
          imagePreview={imagePreview}
          isAnalyzing={isAnalyzing}
          analysis={analysis}
          progress={progress}
          ceilingHeight={ceilingHeight}
          onCeilingHeightChange={setCeilingHeight}
          onReset={resetAnalysis}
          onAnalyze={analyzeRoom}
        />
      )}

      {/* Analysis Results */}
      {analysis && (
        <AnalysisResults
          analysis={analysis}
          ceilingHeight={ceilingHeight}
        />
      )}
    </div>
  );
}
