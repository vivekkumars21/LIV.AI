import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type RoomAnalysis } from '@/lib/room-analyzer';
import { SpatialPlacement } from './spatial-placement';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Palette,
    Lightbulb,
    Box,
    MessageSquare,
    Cuboid
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AnalysisResultsProps {
    analysis: RoomAnalysis;
    ceilingHeight: number;
    imageFile?: File | null;
    defaultTab?: string;
}

export function AnalysisResults({ analysis, ceilingHeight, imageFile, defaultTab = 'overview' }: AnalysisResultsProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateDesign = async () => {
        if (!imageFile) return;
        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('style', 'modern');
            formData.append('roomType', 'living room');

            const response = await fetch('/api/generate-design', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            // Handle generation response handling natively here
            console.log("Design Gen:", data);
        } catch (error) {
            console.error('Design generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-700">
            <Tabs defaultValue={defaultTab} className="w-full">

                {/* Custom Glass-Morphic Tabs Navigation */}
                <TabsList className="flex flex-wrap lg:grid lg:grid-cols-5 w-full h-auto p-1.5 gap-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl mb-8">

                    <TabsTrigger value="overview" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/10">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Overview
                    </TabsTrigger>

                    <TabsTrigger value="suggestions" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/10">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Suggestions
                    </TabsTrigger>

                    <TabsTrigger value="colors" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/10">
                        <Palette className="mr-2 h-4 w-4" />
                        Colors
                    </TabsTrigger>

                    <TabsTrigger value="design" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/10">
                        <Lightbulb className="mr-2 h-4 w-4" />
                        AI Design
                    </TabsTrigger>

                    <TabsTrigger value="measurement" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/10">
                        <Box className="mr-2 h-4 w-4" />
                        📐 Measure
                    </TabsTrigger>

                </TabsList>

                {/* Tab Containers */}
                <div className="relative">

                    <TabsContent value="overview">
                        <Card className="bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl min-h-[400px]">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center opacity-80 pt-20">
                                <Cuboid className="w-16 h-16 text-slate-500 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                                <h3 className="text-2xl font-bold text-white mb-2">Room Overview Data</h3>
                                <p className="text-slate-400 max-w-md">Overview stats and fundamental geometry insights are rendered here. Switch to Measure for active AI metrics.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="suggestions">
                        <Card className="bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl min-h-[400px]">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center opacity-80 pt-20">
                                <MessageSquare className="w-16 h-16 text-blue-400 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                                <h3 className="text-2xl font-bold text-white mb-2">Intelligent Suggestions</h3>
                                <p className="text-slate-400 max-w-md">Lighting, placement, and architectural layout advice provided natively by the AI engine.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="colors">
                        <Card className="bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl min-h-[400px]">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center opacity-80 pt-20">
                                <Palette className="w-16 h-16 text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                                <h3 className="text-2xl font-bold text-white mb-2">Palette Mapping</h3>
                                <p className="text-slate-400 max-w-md">Color recommendations matching the spatial lighting nodes captured from your environment upload.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="design">
                        <Card className="bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl min-h-[400px]">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center pt-20">
                                <Lightbulb className="w-16 h-16 text-rose-400 mb-6 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)] mx-auto" />
                                <h3 className="text-2xl font-bold text-white mb-4">Generative Layout Design</h3>
                                <p className="text-slate-400 max-w-md mx-auto mb-8">Re-imagine your exact space utilizing cutting edge generative aesthetic filters and setups.</p>

                                <Button
                                    onClick={handleGenerateDesign}
                                    disabled={isGenerating}
                                    className="bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] px-8 py-6 text-lg rounded-xl transition-all"
                                >
                                    {isGenerating ? 'Rendering Neural Frame...' : 'Compute AI Design'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="measurement" className="m-0 mt-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <SpatialPlacement
                                analysis={analysis}
                                imageFile={imageFile}
                            />
                        </motion.div>
                    </TabsContent>

                </div>
            </Tabs>
        </div>
    );
}
