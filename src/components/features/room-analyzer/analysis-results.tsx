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

                {/* Tabs Navigation */}
                <TabsList className="flex flex-wrap lg:grid lg:grid-cols-5 w-full h-auto p-1.5 gap-2 bg-white/30 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg mb-8">

                    <TabsTrigger value="overview" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-md data-[state=active]:shadow-md transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/30">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Overview
                    </TabsTrigger>

                    <TabsTrigger value="suggestions" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-md data-[state=active]:shadow-md transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/30">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Suggestions
                    </TabsTrigger>

                    <TabsTrigger value="colors" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-md data-[state=active]:shadow-md transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/30">
                        <Palette className="mr-2 h-4 w-4" />
                        Colors
                    </TabsTrigger>

                    <TabsTrigger value="design" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-md data-[state=active]:shadow-md transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/30">
                        <Lightbulb className="mr-2 h-4 w-4" />
                        AI Design
                    </TabsTrigger>

                    <TabsTrigger value="measurement" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-md data-[state=active]:shadow-md transition-all font-semibold data-[state=active]:border data-[state=active]:border-white/30">
                        <Box className="mr-2 h-4 w-4" />
                        Measurements
                    </TabsTrigger>

                </TabsList>

                {/* Tab Containers */}
                <div className="relative">

                    <TabsContent value="overview">
                        <Card className="bg-white/40 backdrop-blur-md border-white/30 shadow-sm min-h-[400px]">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center opacity-80 pt-20">
                                <Cuboid className="w-16 h-16 text-muted-foreground mb-6" />
                                <h3 className="text-2xl font-bold mb-2">Room Overview</h3>
                                <p className="text-muted-foreground max-w-md">Summary insights about your room layout and dimensions</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="suggestions">
                        <Card className="bg-white/40 backdrop-blur-md border-white/30 shadow-sm min-h-[400px]">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center opacity-80 pt-20">
                                <MessageSquare className="w-16 h-16 text-primary mb-6" />
                                <h3 className="text-2xl font-bold mb-2">Design Suggestions</h3>
                                <p className="text-muted-foreground max-w-md">AI-powered recommendations for furniture placement and styling</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="colors">
                        <Card className="bg-white/40 backdrop-blur-md border-white/30 shadow-sm min-h-[400px]">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center opacity-80 pt-20">
                                <Palette className="w-16 h-16 text-primary mb-6" />
                                <h3 className="text-2xl font-bold mb-2">Color Palette</h3>
                                <p className="text-muted-foreground max-w-md">Color palette analysis matching your room's aesthetic</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="design">
                        <Card className="bg-white/40 backdrop-blur-md border-white/30 shadow-sm min-h-[400px]">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center pt-20">
                                <Lightbulb className="w-16 h-16 text-primary mb-6 mx-auto" />
                                <h3 className="text-2xl font-bold mb-4">AI Design Generation</h3>
                                <p className="text-muted-foreground max-w-md mx-auto mb-8">Generate redesign concepts using advanced AI</p>

                                <Button
                                    onClick={handleGenerateDesign}
                                    disabled={isGenerating}
                                    size="lg"
                                >
                                    {isGenerating ? 'Generating...' : 'Generate Design'}
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
