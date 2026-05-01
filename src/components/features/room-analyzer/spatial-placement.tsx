'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Ruler,
    Target,
    CheckCircle2,
    XCircle,
    Loader2,
    Crosshair,
    RotateCw,
    Sparkles,
    AlertCircle,
    Maximize,
    IndianRupee,
    Eye,
} from 'lucide-react';
import { products, parseDimensionsMetric } from '@/lib/products';
import type { RoomAnalysis } from '@/lib/room-analyzer';

// Types

interface MeasuredObject {
    name: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    depth: number;
    height: number;
    distance: number;
    bbox: { x1: number; y1: number; x2: number; y2: number };
}

interface AnalysisResult {
    measurement: {
        room: { width: number; length: number; height: number };
        objects: MeasuredObject[];
        scale: number;
        image_width: number;
        image_height: number;
    };
    depth_map: string;
    detection_overlay: string;
    calibrated: boolean;
}

interface PlacementResult {
    fits: boolean;
    recommended_position: { x: number; y: number; rotation_degrees: number };
    clearance_ok: boolean;
    budget_analysis: {
        estimated_cost: number;
        remaining_budget: number;
        suggestions?: string[];
    };
    reasoning: string;
    alternatives?: {
        name: string;
        estimatedCost: number;
        dimensions: { width: number; depth: number; height: number };
        style: string[];
    }[];
}

interface SpatialPlacementProps {
    analysis?: RoomAnalysis | null;
    imageFile?: File | null;
}

const BACKEND_URL = '/api/python';

// Component

export function SpatialPlacement({ analysis, imageFile }: SpatialPlacementProps) {
    // State
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    // Calibration state
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calPoint1, setCalPoint1] = useState<{ x: number; y: number } | null>(null);
    const [calPoint2, setCalPoint2] = useState<{ x: number; y: number } | null>(null);
    const [calDistance, setCalDistance] = useState('');
    const [isCalibrated, setIsCalibrated] = useState(false);

    // Placement state
    const [selectedProductId, setSelectedProductId] = useState('');
    const [userStyle, setUserStyle] = useState('modern');
    const [userBudget, setUserBudget] = useState('50000');
    const [placementResult, setPlacementResult] = useState<PlacementResult | null>(null);
    const [isCheckingPlacement, setIsCheckingPlacement] = useState(false);

    // Manual room dimensions (fallback)
    const [manualWidth, setManualWidth] = useState(
        analysis?.space?.dimensions?.estimatedWidth ? (analysis.space.dimensions.estimatedWidth / 3.28084).toFixed(2).toString() : ''
    );
    const [manualLength, setManualLength] = useState(
        analysis?.space?.dimensions?.estimatedLength ? (analysis.space.dimensions.estimatedLength / 3.28084).toFixed(2).toString() : ''
    );
    const [manualHeight, setManualHeight] = useState('2.8');

    useEffect(() => {
        if (analysis?.space?.dimensions) {
            setManualWidth((analysis.space.dimensions.estimatedWidth / 3.28084).toFixed(2).toString());
            setManualLength((analysis.space.dimensions.estimatedLength / 3.28084).toFixed(2).toString());
        }
    }, [analysis?.space?.dimensions?.estimatedWidth, analysis?.space?.dimensions?.estimatedLength]);

    // View toggle
    const [viewMode, setViewMode] = useState<'original' | 'depth' | 'detection'>('original');

    // Refs
    const calCanvasRef = useRef<HTMLCanvasElement>(null);
    const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
    const imagePreviewRef = useRef<string | null>(null);

    // Backend health check
    useEffect(() => {
        checkBackend();
    }, []);

    const checkBackend = async () => {
        setBackendStatus('checking');
        try {
            const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                setBackendStatus('online');
            } else {
                setBackendStatus('offline');
            }
        } catch {
            setBackendStatus('offline');
        }
    };

    // Analyze image via Python backend
    const analyzeImage = async () => {
        if (!imageFile) return;
        setIsAnalyzing(true);

        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('ceiling_height_m', manualHeight || '2.8');
            formData.append('session_id', 'default');

            const res = await fetch(`${BACKEND_URL}/analyze`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Analysis failed');
            const data: AnalysisResult = await res.json();
            setAnalysisResult(data);

            // Pre-fill manual fields from results
            setManualWidth(data.measurement.room.width.toString());
            setManualLength(data.measurement.room.length.toString());
            setManualHeight(data.measurement.room.height.toString());

            // Create image preview for calibration canvas
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreviewRef.current = e.target?.result as string;
            };
            reader.readAsDataURL(imageFile);
        } catch (error) {
            console.error('Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Calibration
    const handleCalibrationClick = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!isCalibrating) return;

            const canvas = calCanvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.round((e.clientX - rect.left) * scaleX);
            const y = Math.round((e.clientY - rect.top) * scaleY);

            if (!calPoint1) {
                setCalPoint1({ x, y });
            } else if (!calPoint2) {
                setCalPoint2({ x, y });
            }
        },
        [isCalibrating, calPoint1, calPoint2]
    );

    // Draw calibration overlay
    useEffect(() => {
        const canvas = calCanvasRef.current;
        if (!canvas || !imagePreviewRef.current) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Draw calibration points
            if (calPoint1) {
                ctx.beginPath();
                ctx.arc(calPoint1.x, calPoint1.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#00ff88';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText('A', calPoint1.x - 4, calPoint1.y + 5);
            }

            if (calPoint2) {
                ctx.beginPath();
                ctx.arc(calPoint2.x, calPoint2.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#ff4488';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText('B', calPoint2.x - 4, calPoint2.y + 5);
            }

            // Draw line between points
            if (calPoint1 && calPoint2) {
                ctx.beginPath();
                ctx.moveTo(calPoint1.x, calPoint1.y);
                ctx.lineTo(calPoint2.x, calPoint2.y);
                ctx.strokeStyle = '#ffcc00';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        };
        img.src = imagePreviewRef.current;
    }, [calPoint1, calPoint2, isCalibrating]);

    const submitCalibration = async () => {
        if (!calPoint1 || !calPoint2 || !calDistance) return;

        try {
            const res = await fetch(`${BACKEND_URL}/calibrate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    point1: [calPoint1.x, calPoint1.y],
                    point2: [calPoint2.x, calPoint2.y],
                    real_distance_m: parseFloat(calDistance),
                    session_id: 'default',
                }),
            });

            if (res.ok) {
                setIsCalibrated(true);
                setIsCalibrating(false);
            }
        } catch (error) {
            console.error('Calibration error:', error);
        }
    };

    const resetCalibration = () => {
        setCalPoint1(null);
        setCalPoint2(null);
        setCalDistance('');
        setIsCalibrated(false);
        setIsCalibrating(false);
    };

    // Placement check
    const checkPlacement = async () => {
        const product = products.find((p) => p.id === selectedProductId);
        if (!product) return;

        const dims = parseDimensionsMetric(product.dimensions);
        if (!dims) return;

        const room = analysisResult?.measurement.room || {
            width: parseFloat(manualWidth) || 4,
            length: parseFloat(manualLength) || 5,
            height: parseFloat(manualHeight) || 2.8,
        };

        const existingObjects = (analysisResult?.measurement.objects || []).map((obj) => ({
            name: obj.name,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            depth: obj.depth,
        }));

        setIsCheckingPlacement(true);

        try {
            const endpoint = backendStatus === 'online'
                ? `${BACKEND_URL}/placement`
                : '/api/spatial-reasoning';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room,
                    existing_objects: existingObjects,
                    existingObjects: existingObjects,
                    selected_object: {
                        name: product.name,
                        width: dims.width,
                        depth: dims.depth,
                        height: dims.height,
                        estimated_cost: product.price,
                        estimatedCost: product.price,
                    },
                    selectedObject: {
                        name: product.name,
                        width: dims.width,
                        depth: dims.depth,
                        height: dims.height,
                        estimatedCost: product.price,
                    },
                    style: userStyle,
                    budget: parseFloat(userBudget) || 50000,
                }),
            });

            if (res.ok) {
                const data: PlacementResult = await res.json();
                setPlacementResult(data);
            }
        } catch (error) {
            console.error('Placement error:', error);
        } finally {
            setIsCheckingPlacement(false);
        }
    };

    // Mini-map canvas
    useEffect(() => {
        drawMinimap();
    }, [analysisResult, placementResult]);

    const drawMinimap = () => {
        const canvas = minimapCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const room = analysisResult?.measurement.room || {
            width: parseFloat(manualWidth) || 4,
            length: parseFloat(manualLength) || 5,
            height: 2.8,
        };

        const padding = 30;
        const canvasW = canvas.width;
        const canvasH = canvas.height;
        const scaleX = (canvasW - padding * 2) / room.width;
        const scaleY = (canvasH - padding * 2) / room.length;
        const scale = Math.min(scaleX, scaleY);

        const offsetX = (canvasW - room.width * scale) / 2;
        const offsetY = (canvasH - room.length * scale) / 2;

        // Clear
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Room boundary
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(offsetX, offsetY, room.width * scale, room.length * scale);

        // Grid
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= room.width; x += 0.5) {
            ctx.beginPath();
            ctx.moveTo(offsetX + x * scale, offsetY);
            ctx.lineTo(offsetX + x * scale, offsetY + room.length * scale);
            ctx.stroke();
        }
        for (let y = 0; y <= room.length; y += 0.5) {
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY + y * scale);
            ctx.lineTo(offsetX + room.width * scale, offsetY + y * scale);
            ctx.stroke();
        }

        // Dimension labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${room.width}m`, offsetX + (room.width * scale) / 2, offsetY - 8);
        ctx.save();
        ctx.translate(offsetX - 12, offsetY + (room.length * scale) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${room.length}m`, 0, 0);
        ctx.restore();

        // Existing objects
        const objects = analysisResult?.measurement.objects || [];
        const objColors = ['#f472b6', '#fb923c', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa'];

        objects.forEach((obj, i) => {
            const color = objColors[i % objColors.length];
            const rx = offsetX + obj.x * scale;
            const ry = offsetY + obj.y * scale;
            const rw = obj.width * scale;
            const rh = obj.depth * scale;

            ctx.fillStyle = color + '30';
            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(rx, ry, rw, rh);

            // Label
            ctx.fillStyle = color;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'left';
            const label = obj.name.length > 10 ? obj.name.substring(0, 10) + '…' : obj.name;
            ctx.fillText(label, rx + 2, ry + 11);
        });

        // Placement result
        if (placementResult?.fits) {
            const pos = placementResult.recommended_position;
            const product = products.find((p) => p.id === selectedProductId);
            const dims = product ? parseDimensionsMetric(product.dimensions) : null;

            if (dims) {
                const isRotated = pos.rotation_degrees === 90;
                const pw = isRotated ? dims.depth : dims.width;
                const pd = isRotated ? dims.width : dims.depth;

                const rx = offsetX + pos.x * scale;
                const ry = offsetY + pos.y * scale;
                const rw = pw * scale;
                const rh = pd * scale;

                // Glow effect
                ctx.shadowColor = '#22c55e';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#22c55e30';
                ctx.fillRect(rx, ry, rw, rh);
                ctx.shadowBlur = 0;

                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                ctx.strokeRect(rx, ry, rw, rh);
                ctx.setLineDash([]);

                // Label
                ctx.fillStyle = '#22c55e';
                ctx.font = 'bold 10px sans-serif';
                ctx.fillText((product?.name || 'New'), rx + 3, ry + 12);
            }
        }
    };

    // Render

    const productsWithDims = products.filter((p) => parseDimensionsMetric(p.dimensions));

    return (
        <div className="space-y-6">
            {/* Backend Status */}
            <div className="flex items-center gap-3 flex-wrap">
                <Badge
                    variant={backendStatus === 'online' ? 'default' : 'destructive'}
                    className="gap-1.5"
                >
                    <span
                        className={`w-2 h-2 rounded-full ${backendStatus === 'online'
                            ? 'bg-green-400 animate-pulse'
                            : backendStatus === 'checking'
                                ? 'bg-yellow-400 animate-pulse'
                                : 'bg-red-400'
                            }`}
                    />
                    {backendStatus === 'online'
                        ? 'Python Backend Online (GPU)'
                        : backendStatus === 'checking'
                            ? 'Checking...'
                            : 'Python Backend Offline'}
                </Badge>
                {backendStatus === 'offline' && (
                    <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground">
                            Using JS fallback engine
                        </span>
                        <Button variant="ghost" size="sm" onClick={checkBackend}>
                            <RotateCw className="h-3 w-3 mr-1" />
                            Retry
                        </Button>
                    </div>
                )}
                {isCalibrated && (
                    <Badge variant="outline" className="gap-1 border-green-500/50 text-green-400">
                        <CheckCircle2 className="h-3 w-3" /> Calibrated
                    </Badge>
                )}
            </div>

            {/* AI Analysis Section */}
            {backendStatus === 'online' && imageFile && (
                <Card className="border-blue-500/20 bg-blue-950/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-blue-400" />
                            AI Depth & Object Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!analysisResult ? (
                            <Button
                                onClick={analyzeImage}
                                disabled={isAnalyzing}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing with ZoeDepth + YOLO...
                                    </>
                                ) : (
                                    <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Run Advanced Analysis (GPU)
                                    </>
                                )}
                            </Button>
                        ) : (
                            <>
                                {/* View Mode Tabs */}
                                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
                                    {(['original', 'depth', 'detection'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === mode
                                                ? 'bg-background shadow text-foreground'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {mode === 'original' ? 'Original' : mode === 'depth' ? 'Depth Map' : 'Detections'}
                                        </button>
                                    ))}
                                </div>

                                {/* Image Viewer */}
                                <div className="relative rounded-lg overflow-hidden border border-border/50">
                                    {viewMode === 'depth' && analysisResult.depth_map && (
                                        <img
                                            src={analysisResult.depth_map}
                                            alt="Depth map"
                                            className="w-full h-auto"
                                        />
                                    )}
                                    {viewMode === 'detection' && analysisResult.detection_overlay && (
                                        <img
                                            src={analysisResult.detection_overlay}
                                            alt="Object detections"
                                            className="w-full h-auto"
                                        />
                                    )}
                                    {viewMode === 'original' && imageFile && (
                                        <img
                                            src={URL.createObjectURL(imageFile)}
                                            alt="Original room"
                                            className="w-full h-auto"
                                        />
                                    )}
                                </div>

                                {/* Detected Objects */}
                                {analysisResult.measurement.objects.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-muted-foreground">
                                            Detected Objects ({analysisResult.measurement.objects.length})
                                        </h4>
                                        <div className="grid gap-2">
                                            {analysisResult.measurement.objects.map((obj, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/30"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{
                                                                background: ['#f472b6', '#fb923c', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa'][i % 6],
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium capitalize">{obj.name}</span>
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {(obj.confidence * 100).toFixed(0)}%
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {obj.width}m × {obj.depth}m × {obj.height}m
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Estimated Room Dimensions */}
                                <Alert>
                                    <Maximize className="h-4 w-4" />
                                    <AlertDescription>
                                        <span className="font-semibold">Estimated Room:</span>{' '}
                                        {analysisResult.measurement.room.width}m × {analysisResult.measurement.room.length}m × {analysisResult.measurement.room.height}m
                                        {!isCalibrated && (
                                            <span className="text-yellow-400 ml-2 text-xs">
                                                (calibrate for better accuracy)
                                            </span>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Calibration Tool */}
            {backendStatus === 'online' && imageFile && analysisResult && (
                <Card className="border-purple-500/20 bg-purple-950/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Crosshair className="h-5 w-5 text-purple-400" />
                            Calibration Tool
                            {isCalibrated && (
                                <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                                    ✓ Active
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                            Mark two points on a known reference (door frame ≈ 2.1m, standard tile ≈ 0.6m) for accurate measurements.
                        </p>

                        {!isCalibrating && !isCalibrated && (
                            <Button
                                variant="outline"
                                onClick={() => setIsCalibrating(true)}
                                className="w-full border-purple-500/30 hover:border-purple-500/60"
                            >
                                <Target className="mr-2 h-4 w-4" />
                                Start Calibration
                            </Button>
                        )}

                        {isCalibrating && (
                            <div className="space-y-3">
                                <canvas
                                    ref={calCanvasRef}
                                    onClick={handleCalibrationClick}
                                    className="w-full rounded-lg cursor-crosshair border border-purple-500/30"
                                    style={{ maxHeight: 300 }}
                                />

                                <div className="flex items-center gap-2 text-xs">
                                    <Badge variant={calPoint1 ? 'default' : 'outline'} className="gap-1">
                                        {calPoint1 ? <CheckCircle2 className="h-3 w-3" /> : '1.'}
                                        Point A {calPoint1 ? `(${calPoint1.x}, ${calPoint1.y})` : '— click image'}
                                    </Badge>
                                    <Badge variant={calPoint2 ? 'default' : 'outline'} className="gap-1">
                                        {calPoint2 ? <CheckCircle2 className="h-3 w-3" /> : '2.'}
                                        Point B {calPoint2 ? `(${calPoint2.x}, ${calPoint2.y})` : '— click image'}
                                    </Badge>
                                </div>

                                {calPoint1 && calPoint2 && (
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground mb-1 block">Real distance (metres)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="e.g. 2.1"
                                                value={calDistance}
                                                onChange={(e) => setCalDistance(e.target.value)}
                                                className="w-full px-3 py-1.5 bg-muted/50 border border-border rounded-md text-sm"
                                            />
                                        </div>
                                        <Button
                                            onClick={submitCalibration}
                                            disabled={!calDistance}
                                            className="mt-5 bg-purple-600 hover:bg-purple-500"
                                        >
                                            Calibrate
                                        </Button>
                                    </div>
                                )}

                                <Button variant="ghost" size="sm" onClick={resetCalibration}>
                                    Reset
                                </Button>
                            </div>
                        )}

                        {isCalibrated && (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={resetCalibration}>
                                    Recalibrate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={analyzeImage}
                                    disabled={isAnalyzing}
                                >
                                    <RotateCw className="mr-1 h-3 w-3" />
                                    Re-analyze with calibration
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Room Dimensions (Manual / Override) */}
            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-orange-400" />
                        Room Dimensions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Width (m)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="3.5"
                                value={manualWidth}
                                onChange={(e) => setManualWidth(e.target.value)}
                                className="w-full px-3 py-1.5 bg-muted/50 border border-border rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Length (m)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="4.0"
                                value={manualLength}
                                onChange={(e) => setManualLength(e.target.value)}
                                className="w-full px-3 py-1.5 bg-muted/50 border border-border rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Height (m)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="2.8"
                                value={manualHeight}
                                onChange={(e) => setManualHeight(e.target.value)}
                                className="w-full px-3 py-1.5 bg-muted/50 border border-border rounded-md text-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Placement Configuration ── */}
            <Card className="border-green-500/20 bg-green-950/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-400" />
                        Furniture Placement
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Product Picker */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Select Furniture</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => {
                                setSelectedProductId(e.target.value);
                                setPlacementResult(null);
                            }}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-sm"
                        >
                            <option value="">Choose a product...</option>
                            {productsWithDims.map((p) => {
                                const dims = parseDimensionsMetric(p.dimensions);
                                return (
                                    <option key={p.id} value={p.id}>
                                        {p.name} — ₹{p.price.toLocaleString('en-IN')} ({dims?.width}m × {dims?.depth}m × {dims?.height}m)
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Style & Budget */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Style</label>
                            <select
                                value={userStyle}
                                onChange={(e) => setUserStyle(e.target.value)}
                                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-sm"
                            >
                                <option value="modern">Modern</option>
                                <option value="minimal">Minimal</option>
                                <option value="traditional">Traditional</option>
                                <option value="luxury">Luxury</option>
                                <option value="any">Any Style</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Budget (₹)</label>
                            <input
                                type="number"
                                step="1000"
                                value={userBudget}
                                onChange={(e) => setUserBudget(e.target.value)}
                                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-sm"
                            />
                        </div>
                    </div>

                    {/* Check Placement Button */}
                    <Button
                        onClick={checkPlacement}
                        disabled={!selectedProductId || isCheckingPlacement || (!manualWidth && !analysisResult)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    >
                        {isCheckingPlacement ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking spatial fit...
                            </>
                        ) : (
                            <>
                                <Ruler className="mr-2 h-4 w-4" />
                                Check Placement
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* ── Results ── */}
            {placementResult && (
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Result Card */}
                    <Card
                        className={`border-2 ${placementResult.fits
                            ? 'border-green-500/40 bg-green-950/10'
                            : 'border-red-500/40 bg-red-950/10'
                            }`}
                    >
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                {placementResult.fits ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                                        <span className="text-green-400">Placement Possible</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-red-400" />
                                        <span className="text-red-400">Does Not Fit</span>
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {placementResult.fits && (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 rounded-md bg-muted/30">
                                        <div className="text-xs text-muted-foreground">X</div>
                                        <div className="text-lg font-bold">
                                            {placementResult.recommended_position.x}m
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-md bg-muted/30">
                                        <div className="text-xs text-muted-foreground">Y</div>
                                        <div className="text-lg font-bold">
                                            {placementResult.recommended_position.y}m
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-md bg-muted/30">
                                        <div className="text-xs text-muted-foreground">Rotation</div>
                                        <div className="text-lg font-bold">
                                            {placementResult.recommended_position.rotation_degrees}°
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Badge variant={placementResult.clearance_ok ? 'default' : 'destructive'}>
                                    Clearance {placementResult.clearance_ok ? '≥ 0.6m ✓' : '< 0.6m ✗'}
                                </Badge>
                            </div>

                            {/* Budget */}
                            <div className="p-3 rounded-md bg-muted/20 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Estimated Cost</span>
                                    <span className="font-semibold flex items-center gap-0.5">
                                        <IndianRupee className="h-3 w-3" />
                                        {placementResult.budget_analysis.estimated_cost.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Remaining Budget</span>
                                    <span
                                        className={`font-semibold flex items-center gap-0.5 ${placementResult.budget_analysis.remaining_budget > 0
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                            }`}
                                    >
                                        <IndianRupee className="h-3 w-3" />
                                        {placementResult.budget_analysis.remaining_budget.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            {/* Suggestions */}
                            {placementResult.budget_analysis.suggestions &&
                                placementResult.budget_analysis.suggestions.length > 0 && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs whitespace-pre-wrap">
                                            {placementResult.budget_analysis.suggestions.join('\n')}
                                        </AlertDescription>
                                    </Alert>
                                )}

                            {/* Reasoning */}
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {placementResult.reasoning}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Mini-map */}
                    <Card className="border-border/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Maximize className="h-5 w-5 text-blue-400" />
                                Room Layout (Top View)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <canvas
                                ref={minimapCanvasRef}
                                width={400}
                                height={400}
                                className="w-full rounded-lg border border-border/30"
                                style={{ background: '#0a0a0f' }}
                            />
                            <div className="flex gap-3 mt-2 flex-wrap">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/50 border border-blue-500" />
                                    Room boundary
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-pink-500/30 border border-pink-500" />
                                    Existing objects
                                </span>
                                {placementResult?.fits && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-sm bg-green-500/30 border border-green-500" />
                                        Suggested placement
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
