import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Home,
    Palette,
    Ruler,
    CheckCircle,
    AlertCircle,
    Armchair
} from 'lucide-react';
import { type RoomAnalysis } from '@/lib/room-analyzer';

interface AnalysisResultsProps {
    analysis: RoomAnalysis;
    ceilingHeight: number;
}

export function AnalysisResults({ analysis, ceilingHeight }: AnalysisResultsProps) {
    return (
        <div className="space-y-6">
            <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                    Analysis complete! Here's what our AI discovered about your room.
                </AlertDescription>
            </Alert>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="recommendations">Suggestions</TabsTrigger>
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Home className="h-4 w-4" />
                                    Space Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Size:</span>
                                    <Badge variant="secondary">{analysis.space.size}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Layout:</span>
                                    <Badge variant="secondary">{analysis.space.layout}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Est. Area:</span>
                                    <span className="text-sm font-medium">{analysis.space.dimensions.estimatedArea} sq ft</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Armchair className="h-4 w-4" />
                                    Furniture
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Detected:</span>
                                    <span className="text-xs font-mono max-w-[120px] text-right truncate">
                                        {analysis.existingFurniture.items.join(', ')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Style:</span>
                                    <Badge variant="secondary">{analysis.existingFurniture.style}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Ruler className="h-4 w-4" />
                                    Walls & Floor
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Wall Texture:</span>
                                    <Badge variant="secondary">{analysis.walls.texture}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Floor Type:</span>
                                    <Badge variant="secondary">{analysis.floor.type}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Palette className="h-4 w-4" />
                                    Color Mood
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Mood:</span>
                                    <Badge variant="secondary">{analysis.colorPalette.mood}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Dominant:</span>
                                    <div
                                        className="w-4 h-4 rounded-full border"
                                        style={{ backgroundColor: analysis.colorPalette.dominant }}
                                    />
                                    <span className="text-xs font-mono">{analysis.colorPalette.dominant}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detailed Measurements</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Estimated Width</label>
                                        <p className="text-lg font-semibold">{analysis.space.dimensions.estimatedWidth} ft</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Estimated Length</label>
                                        <p className="text-lg font-semibold">{analysis.space.dimensions.estimatedLength} ft</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">*Measurements calibrated based on {ceilingHeight}ft ceiling height.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Detected Objects</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.existingFurniture.items.map((item, idx) => (
                                        <Badge key={idx} variant="outline" className="capitalize">
                                            {item}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Surface Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Walls</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span>Count: {analysis.walls.count} walls</span>
                                        <span>Texture: {analysis.walls.texture}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm">Dominant Color:</span>
                                        <div
                                            className="w-4 h-4 rounded border"
                                            style={{ backgroundColor: analysis.walls.dominantColor }}
                                        />
                                        <span className="text-xs font-mono">{analysis.walls.dominantColor}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Floor</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span>Type: {analysis.floor.type}</span>
                                        <span>Condition: {analysis.floor.condition}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm">Color:</span>
                                        <div
                                            className="w-4 h-4 rounded border"
                                            style={{ backgroundColor: analysis.floor.color }}
                                        />
                                        <span className="text-xs font-mono">{analysis.floor.color}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                    <div className="grid gap-4">
                        {analysis.recommendations.style.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recommended Styles</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.recommendations.style.map((style, index) => (
                                            <Badge key={index} variant="outline">
                                                {style}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {analysis.recommendations.furniture.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Furniture Suggestions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {analysis.recommendations.furniture.map((item, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-sm">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {analysis.recommendations.improvements.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Improvement Suggestions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {analysis.recommendations.improvements.map((improvement, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm">{improvement}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Color Palette Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-3">Dominant Color</h4>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-lg border shadow-sm"
                                        style={{ backgroundColor: analysis.colorPalette.dominant }}
                                    />
                                    <div>
                                        <p className="font-mono text-sm">{analysis.colorPalette.dominant}</p>
                                        <p className="text-sm text-muted-foreground">Primary room color</p>
                                    </div>
                                </div>
                            </div>

                            {analysis.colorPalette.secondary.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-3">Secondary Colors</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {analysis.colorPalette.secondary.map((color, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded border"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <span className="font-mono text-xs">{color}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="font-medium mb-2">Color Mood</h4>
                                <Badge variant="secondary" className="text-sm">
                                    {analysis.colorPalette.mood} tones
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
