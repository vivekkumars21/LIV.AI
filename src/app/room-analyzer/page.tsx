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
    <div className="relative min-h-screen bg-black text-slate-100 overflow-hidden font-sans">
      {/* Dynamic Ambient Background Mesh */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 blur-[100px] rounded-full mix-blend-screen animate-pulse duration-10000" />
      </div>
      <div className="absolute bottom-0 right-[-20%] w-[600px] h-[600px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Premium Frosted Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
            <Button
              variant="outline"
              asChild
              className="group border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl backdrop-blur-md transition-all duration-300"
            >
              <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4 text-violet-400 group-hover:-translate-x-1 transition-transform" />
                Back
              </Link>
            </Button>

            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-white to-slate-400 inline-flex items-center gap-3">
                Spatial Analyzer
                <Sparkles className="h-6 w-6 text-violet-400 animate-pulse" />
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm sm:text-base font-medium">
                Upload a space to compute real-world metric dimensions & layout physics
              </p>
            </div>

            <div className="hidden sm:block opacity-80 hover:opacity-100 transition-opacity">
              <IntraKartLogo variant="icon" size="lg" />
            </div>
          </div>
        </header>

        {/* Room Analyzer Component Mounting Point */}
        <main className="w-full">
          <RoomAnalyzer onAnalysisComplete={handleAnalysisComplete} />
        </main>
      </div>
    </div>
  );
}