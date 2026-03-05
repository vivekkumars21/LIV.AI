import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Scan, RotateCcw } from 'lucide-react';
import { type RoomAnalysis } from '@/lib/room-analyzer';
import { motion } from 'framer-motion';

interface ImagePreviewProps {
    imagePreview: string;
    isAnalyzing: boolean;
    analysis: RoomAnalysis | null;
    progress: number;
    ceilingHeight: number;
    onCeilingHeightChange: (height: number) => void;
    onReset: () => void;
    onAnalyze: () => void;
}

export function ImagePreview({
    imagePreview,
    isAnalyzing,
    analysis,
    progress,
    ceilingHeight,
    onCeilingHeightChange,
    onReset,
    onAnalyze
}: ImagePreviewProps) {
    return (
        <Card className="bg-white/50 backdrop-blur-sm border-white/20 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
                        <Scan className="w-5 h-5 text-primary" />
                        Analysis Preview
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="transition-colors"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border border-border shadow-inner">
                    <Image
                        src={imagePreview}
                        alt="Room to analyze"
                        fill
                        className="object-cover opacity-90"
                    />

                    {/* Scanning Overlay Effect */}
                    {isAnalyzing && (
                        <motion.div
                            initial={{ top: "-10%" }}
                            animate={{ top: "110%" }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                            className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-primary/20 to-transparent border-b border-primary/50 shadow-[0_0_20px_rgba(0,0,0,0.1)] pointer-events-none"
                        />
                    )}
                </div>

                {/* Settings Input Grid */}
                {!isAnalyzing && !analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-3 bg-white/30 backdrop-blur-sm p-4 rounded-2xl border border-white/20"
                    >
                        <Label htmlFor="ceiling-height" className="font-medium tracking-wide">
                            Reference Ceiling Height (m) <span className="text-muted-foreground font-normal ml-1">— Optional calibration</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="ceiling-height"
                                type="number"
                                step="0.1"
                                value={ceilingHeight}
                                onChange={(e) => onCeilingHeightChange(Number(e.target.value))}
                                min={2.0}
                                max={5.0}
                                className="bg-white/50 backdrop-blur-sm border-white/20"
                            />
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-sm">
                                meters
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Analysis Loading State */}
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4 bg-primary/5 backdrop-blur-sm p-5 rounded-2xl border border-primary/20"
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                            <span className="text-sm font-semibold tracking-wide">
                                Analyzing room layout...
                            </span>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden border border-border">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "easeOut" }}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Init Action */}
                {!analysis && !isAnalyzing && (
                    <Button
                        onClick={onAnalyze}
                        className="w-full h-12 text-base font-semibold tracking-wide"
                        size="lg"
                    >
                        <Scan className="mr-2 h-5 w-5" />
                        Analyze Room with AI
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
