'use client';

import { RoomAnalyzer } from '@/components/features/room-analyzer';
import { Button } from '@/components/ui/button';
import { IntraKartLogo } from '@/components/ui/intrakart-logo';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { type RoomAnalysis } from '@/lib/room-analyzer';

export default function RoomAnalyzerPage() {
  const handleAnalysisComplete = (analysis: RoomAnalysis) => {
    console.log('Room analysis completed:', analysis);
    // Here you could save the analysis to a database, 
    // trigger furniture recommendations, etc.
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Room Analyzer</h1>
              <p className="text-muted-foreground">
                Upload a photo of your room and get AI-powered design insights
              </p>
            </div>
          </div>
          <IntraKartLogo variant="icon" size="lg" />
        </div>

        {/* Room Analyzer Component */}
        <RoomAnalyzer onAnalysisComplete={handleAnalysisComplete} />
      </div>
    </div>
  );
}