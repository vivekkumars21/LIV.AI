'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { roomAnalyzer, type RoomAnalysis } from '@/lib/room-analyzer';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from './image-uploader';
import { ImagePreview } from './image-preview';
import { AnalysisResults } from './analysis-results';
import ColorPredictions from './color-predictions';
import SizeEstimator from './size-estimator';
import BudgetCalculator from './budget-calculator';
import { motion, AnimatePresence } from 'framer-motion';

interface RoomAnalyzerProps {
  onAnalysisComplete?: (analysis: RoomAnalysis) => void;
}

export function RoomAnalyzer({ onAnalysisComplete }: RoomAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const [ceilingHeight, setCeilingHeight] = useState<number>(2.8);
  const [backendData, setBackendData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    roomAnalyzer.initializeModel();
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Call Python backend for depth-based analysis when image is uploaded
  useEffect(() => {
    if (!selectedImage) return;

    const analyzeWithBackend = async () => {
      try {
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('ceiling_height_m', String(ceilingHeight));

        const res = await fetch('/api/python/analyze', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setBackendData(data);
          
          if (data?.measurement?.room) {
            setAnalysis(prev => {
              if (!prev) return prev;
              const room = data.measurement.room;
              const areaSqft = room.area_sqft || (room.width * room.length * 10.764);
              return {
                ...prev,
                space: {
                  ...prev.space,
                  dimensions: {
                    estimatedWidth: room.width * 3.28084,
                    estimatedLength: room.length * 3.28084,
                    estimatedArea: areaSqft
                  }
                }
              };
            });
          }
        }
      } catch (err) {
        console.log('Python backend not available, using frontend-only analysis');
      }
    };

    analyzeWithBackend();
  }, [selectedImage, ceilingHeight]);

  const analyzeRoom = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setProgress(10);

    try {
      const loadingInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 500);

      const result = await roomAnalyzer.analyzeRoom(selectedImage, ceilingHeight);

      clearInterval(loadingInterval);
      setProgress(100);

      // Merge backend data if it already arrived
      setBackendData((currentBackendData: any) => {
        const finalResult = { ...result };
        if (currentBackendData?.measurement?.room) {
          const room = currentBackendData.measurement.room;
          const areaSqft = room.area_sqft || (room.width * room.length * 10.764);
          finalResult.space.dimensions.estimatedWidth = room.width * 3.28084;
          finalResult.space.dimensions.estimatedLength = room.length * 3.28084;
          finalResult.space.dimensions.estimatedArea = areaSqft;
        }
        setAnalysis(finalResult);
        onAnalysisComplete?.(finalResult);
        return currentBackendData;
      });

      toast({
        title: 'Analysis Complete!',
        description: 'Room vectors mapped out smoothly.',
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Failed to map room vectors. Please try again.',
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
    setBackendData(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Extract room data from backend response for SizeEstimator
  const roomData = backendData?.measurement?.room || null;
  const confidence = backendData?.measurement?.confidence ?? undefined;
  const areaSqft = roomData?.area_sqft || 0;

  return (
    <div className="space-y-8 w-full">
      <AnimatePresence mode="wait">
        {!selectedImage ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ImageUploader
              onImageSelected={handleImageUpload}
              fileInputRef={fileInputRef}
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview-analysis"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-8 w-full"
          >
            {imagePreview && (
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

            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <AnalysisResults
                  analysis={analysis}
                  ceilingHeight={ceilingHeight}
                  imageFile={selectedImage}
                  defaultTab="measurement"
                />
              </motion.div>
            )}

            {/* Python-Powered Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Color Predictions — from Python K-Means */}
              <ColorPredictions imageFile={selectedImage} />

              {/* Size Estimator — from Python depth map */}
              <SizeEstimator roomData={roomData} confidence={confidence} />
            </motion.div>

            {/* Budget Calculator — full width */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <BudgetCalculator initialAreaSqft={areaSqft} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
