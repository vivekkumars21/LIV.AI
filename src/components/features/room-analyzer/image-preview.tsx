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
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            <CardHeader className="pb-4 relative z-10 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl tracking-tight text-white">
                        <Scan className="w-5 h-5 text-indigo-400" />
                        Aural Map Processing
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restart
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[#050508] border border-white/10 ring-1 ring-black/50 shadow-inner group">
                    <Image
                        src={imagePreview}
                        alt="Room to analyze"
                        fill
                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                    />

                    {/* Scanning Overlay Effect */}
                    {isAnalyzing && (
                        <motion.div
                            initial={{ top: "-10%" }}
                            animate={{ top: "110%" }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                            className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent border-b border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] pointer-events-none"
                        />
                    )}
                </div>

                {/* Settings Input Grid */}
                {!isAnalyzing && !analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-3 bg-white/5 p-4 rounded-lg border border-white/5"
                    >
                        <Label htmlFor="ceiling-height" className="text-slate-300 font-medium tracking-wide">
                            Reference Ceiling Height (m) <span className="text-slate-500 font-normal ml-1">— Improves spatial precision</span>
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
                                className="bg-black/50 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 pl-4"
                            />
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500 text-sm">
                                METERS
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Analysis Loading State */}
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4 bg-indigo-950/20 p-5 rounded-lg border border-indigo-500/20"
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                            <span className="text-sm font-semibold tracking-wide text-indigo-200">
                                COMPILING GEOMETRY VECTORS...
                            </span>
                        </div>
                        <div className="relative h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-cyan-400"
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
                        className="w-full h-12 text-base font-semibold tracking-wide bg-white text-black hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.01]"
                    >
                        <Scan className="mr-2 h-5 w-5" />
                        Initiate Machine Vision
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
