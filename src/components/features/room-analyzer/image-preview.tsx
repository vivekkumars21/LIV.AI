import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { type RoomAnalysis } from '@/lib/room-analyzer';

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
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Room Analysis</CardTitle>
                    <Button variant="outline" size="sm" onClick={onReset}>
                        Upload Different Photo
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <Image
                        src={imagePreview}
                        alt="Room to analyze"
                        fill
                        className="object-cover"
                    />
                </div>

                {/* Calibration Input */}
                {!isAnalyzing && !analysis && (
                    <div className="grid gap-2">
                        <Label htmlFor="ceiling-height">Known Ceiling Height (feet) - improves accuracy</Label>
                        <Input
                            id="ceiling-height"
                            type="number"
                            value={ceilingHeight}
                            onChange={(e) => onCeilingHeightChange(Number(e.target.value))}
                            min={6}
                            max={20}
                        />
                    </div>
                )}

                {isAnalyzing && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-medium">AI is detecting objects and measuring space...</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                    </div>
                )}

                {!analysis && !isAnalyzing && (
                    <Button onClick={onAnalyze} className="w-full" size="lg">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze Room with AI
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
