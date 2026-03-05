'use client';

import { RoomAnalyzer } from '@/components/features/room-analyzer';
import { Button } from '@/components/ui/button';
import { IntraKartLogo } from '@/components/ui/intrakart-logo';
import { ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { type RoomAnalysis } from '@/lib/room-analyzer';

export default function RoomAnalyzerPage() {
  const handleAnalysisComplete = (analysis: RoomAnalysis) => {
    console.log('Room analysis completed:', analysis);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
            <Button
              variant="outline"
              asChild
              className="group"
            >
              <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back
              </Link>
            </Button>

            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight inline-flex items-center gap-3">
                AI Room Analyzer
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
                Upload a photo of your room and get AI-powered design insights
              </p>
            </div>

            <div className="hidden sm:block">
              <IntraKartLogo variant="icon" size="lg" />
            </div>
          </div>
        </header>

        {/* Room Analyzer Component */}
        <main>
          <RoomAnalyzer onAnalysisComplete={handleAnalysisComplete} />
        </main>
      </div>
    </div>
  );
}