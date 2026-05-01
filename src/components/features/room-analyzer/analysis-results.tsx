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
                <TabsList className="flex flex-wrap lg:grid lg:grid-cols-4 w-full h-auto p-1.5 gap-2 bg-secondary/30 border border-border/50 rounded-2xl shadow-lg mb-8">

                    <TabsTrigger value="overview" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-semibold data-[state=active]:text-foreground">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Overview
                    </TabsTrigger>

                    <TabsTrigger value="suggestions" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-semibold data-[state=active]:text-foreground">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Suggestions
                    </TabsTrigger>

                    <TabsTrigger value="colors" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-semibold data-[state=active]:text-foreground">
                        <Palette className="mr-2 h-4 w-4" />
                        Colors
                    </TabsTrigger>

                    <TabsTrigger value="measurement" className="flex-1 lg:flex-none py-3 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all font-semibold data-[state=active]:text-foreground">
                        <Box className="mr-2 h-4 w-4" />
                        Measurements
                    </TabsTrigger>

                </TabsList>

                {/* Tab Containers */}
                <div className="relative">

                    <TabsContent value="overview">
                        <Card className="bg-card text-card-foreground border-border/50 rounded-3xl overflow-hidden shadow-sm">
                            <CardContent className="p-8 space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <LayoutDashboard className="w-6 h-6 text-primary" />
                                        Room Overview
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Space Information */}
                                    <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                            <Box className="w-5 h-5 text-primary" />
                                            Space
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Size:</span>
                                                <span className="font-medium capitalize">{analysis.space.size}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Layout:</span>
                                                <span className="font-medium capitalize">{analysis.space.layout}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Est. Area:</span>
                                                <span className="font-medium">{analysis.space.dimensions.estimatedArea.toFixed(1)} sq ft</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wall Information */}
                                    <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                        <h4 className="font-semibold text-lg mb-3">Walls</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Count:</span>
                                                <span className="font-medium">{analysis.walls.count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Texture:</span>
                                                <span className="font-medium capitalize">{analysis.walls.texture}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Color:</span>
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-6 h-6 rounded border-2 border-border/50 shadow-sm" 
                                                        style={{ backgroundColor: analysis.walls.dominantColor }}
                                                    />
                                                    <span className="font-medium text-xs">{analysis.walls.dominantColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floor Information */}
                                    <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                        <h4 className="font-semibold text-lg mb-3">Floor</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Type:</span>
                                                <span className="font-medium capitalize">{analysis.floor.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Condition:</span>
                                                <span className="font-medium capitalize">{analysis.floor.condition.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Color:</span>
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-6 h-6 rounded border-2 border-border/50 shadow-sm" 
                                                        style={{ backgroundColor: analysis.floor.color }}
                                                    />
                                                    <span className="font-medium text-xs">{analysis.floor.color}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lighting Information */}
                                    <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                                            Lighting
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Type:</span>
                                                <span className="font-medium capitalize">{analysis.lighting.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Brightness:</span>
                                                <span className="font-medium capitalize">{analysis.lighting.brightness}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground">Sources:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {analysis.lighting.sources.map((source, i) => (
                                                        <span key={i} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                                                            {source}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Existing Furniture */}
                                <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                    <h4 className="font-semibold text-lg mb-3">Existing Furniture</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Detected:</span>
                                            <span className={cn(
                                                "font-medium",
                                                analysis.existingFurniture.detected ? "text-green-600" : "text-gray-500"
                                            )}>
                                                {analysis.existingFurniture.detected ? "Yes" : "No"}
                                            </span>
                                        </div>
                                        {analysis.existingFurniture.detected && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Style:</span>
                                                    <span className="font-medium capitalize">{analysis.existingFurniture.style}</span>
                                                </div>
                                                <div className="flex flex-col gap-2 mt-3">
                                                    <span className="text-muted-foreground">Items:</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {analysis.existingFurniture.items.map((item, i) => (
                                                            <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Color Palette */}
                                <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                        <Palette className="w-5 h-5 text-primary" />
                                        Color Palette
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Mood:</span>
                                            <span className="font-medium capitalize text-sm">{analysis.colorPalette.mood}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-sm text-muted-foreground">Dominant:</span>
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-12 h-12 rounded-lg border-2 border-border/50 shadow-sm" 
                                                    style={{ backgroundColor: analysis.colorPalette.dominant }}
                                                />
                                                <span className="text-sm font-mono">{analysis.colorPalette.dominant}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-sm text-muted-foreground">Secondary Colors:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.colorPalette.secondary.map((color, i) => (
                                                    <div key={i} className="flex flex-col items-center gap-1">
                                                        <div 
                                                            className="w-10 h-10 rounded-lg border-2 border-border/50 shadow-sm" 
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        <span className="text-[10px] font-mono">{color}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="suggestions">
                        <Card className="bg-card text-card-foreground border-border/50 rounded-3xl overflow-hidden shadow-sm">
                            <CardContent className="p-8 space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-6 h-6 text-primary" />
                                        Design Suggestions
                                    </h3>
                                    <p className="text-muted-foreground text-sm">AI-powered recommendations based on your room analysis</p>
                                </div>

                                {/* Style Recommendations */}
                                {analysis.recommendations.style.length > 0 && (
                                    <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                            Recommended Styles
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.recommendations.style.map((style, i) => (
                                                <span key={i} className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                                                    {style}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Color Recommendations */}
                                {analysis.recommendations.colors.length > 0 && (
                                    <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                            <Palette className="w-5 h-5 text-primary" />
                                            Color Suggestions
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysis.recommendations.colors.map((color, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span>{color}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Furniture Recommendations */}
                                {analysis.recommendations.furniture.length > 0 && (
                                    <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                            <Box className="w-5 h-5 text-primary" />
                                            Furniture Suggestions
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {analysis.recommendations.furniture.map((item, i) => (
                                                <div key={i} className="bg-secondary/30 rounded-lg p-3 border border-border/50 text-sm">
                                                    <span className="font-medium">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Improvements */}
                                {analysis.recommendations.improvements.length > 0 && (
                                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20">
                                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-primary" />
                                            Improvement Tips
                                        </h4>
                                        <ul className="space-y-3">
                                            {analysis.recommendations.improvements.map((improvement, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm">
                                                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                                                        {i + 1}
                                                    </span>
                                                    <span className="flex-1">{improvement}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="colors">
                        <Card className="bg-card text-card-foreground border-border/50 rounded-3xl overflow-hidden shadow-sm">
                            <CardContent className="p-8 space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                        <Palette className="w-6 h-6 text-primary" />
                                        Color Analysis
                                    </h3>
                                    <p className="text-muted-foreground text-sm">Detected color palette from your room</p>
                                </div>

                                {/* Color Mood */}
                                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Color Mood</p>
                                            <p className="text-2xl font-bold capitalize">{analysis.colorPalette.mood}</p>
                                        </div>
                                        <div className="text-5xl">
                                            {analysis.colorPalette.mood}
                                        </div>
                                    </div>
                                </div>

                                {/* Dominant Color */}
                                <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                    <h4 className="font-semibold text-lg mb-4">Dominant Color</h4>
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="w-24 h-24 rounded-2xl border-4 border-border/50 shadow-md shadow-lg" 
                                            style={{ backgroundColor: analysis.colorPalette.dominant }}
                                        />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Color Code</p>
                                            <p className="text-xl font-mono font-bold">{analysis.colorPalette.dominant}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Colors */}
                                <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                    <h4 className="font-semibold text-lg mb-4">Secondary Colors</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                        {analysis.colorPalette.secondary.map((color, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 group">
                                                <div 
                                                    className="w-16 h-16 rounded-xl border-2 border-border/50 shadow-sm shadow-md group-hover:scale-110 transition-transform cursor-pointer" 
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                                <span className="text-[10px] font-mono text-center break-all">{color}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Recommendations from AI */}
                                {analysis.recommendations.colors.length > 0 && (
                                    <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50">
                                        <h4 className="font-semibold text-lg mb-3">Recommended Color Adjustments</h4>
                                        <ul className="space-y-2">
                                            {analysis.recommendations.colors.map((recommendation, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <span className="text-primary mt-1">✓</span>
                                                    <span>{recommendation}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Note about Python Color Analysis */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-500/30">
                                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                        <span>For advanced K-Means color clustering analysis, check the <strong>Color Predictions</strong> section below with wall/floor color separation.</span>
                                    </p>
                                </div>
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
