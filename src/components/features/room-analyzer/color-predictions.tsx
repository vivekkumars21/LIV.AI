'use client';

import React, { useState } from 'react';

interface ColorInfo {
    hex: string;
    rgb: number[];
    percentage: number;
}

interface ColorAnalysis {
    dominant_colors: ColorInfo[];
    wall_colors: ColorInfo[];
    floor_colors: ColorInfo[];
    recommended_palette: string[];
    mood: string;
    wall_finish: string;
}

const MOOD_BADGES: Record<string, { bg: string; text: string; icon: string }> = {
    warm: { bg: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-400', icon: '🔥' },
    cool: { bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-400', icon: '❄️' },
    neutral: { bg: 'bg-gray-500/20 border-gray-500/30', text: 'text-gray-300', icon: '⚖️' },
};

function ColorSwatch({ color, percentage, size = 'md' }: { color: string; percentage?: number; size?: 'sm' | 'md' }) {
    const dim = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
    return (
        <div className="flex flex-col items-center gap-1.5 group">
            <div
                className={`${dim} rounded-xl border-2 border-white/10 shadow-lg group-hover:scale-110 transition-transform cursor-pointer`}
                style={{ backgroundColor: color }}
                title={color}
            />
            <span className="text-[10px] text-gray-400 font-mono">{color}</span>
            {percentage !== undefined && (
                <span className="text-[10px] text-gray-500">{percentage.toFixed(0)}%</span>
            )}
        </div>
    );
}

export default function ColorPredictions({ imageFile }: { imageFile?: File }) {
    const [analysis, setAnalysis] = useState<ColorAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const analyzeColors = async () => {
        if (!imageFile) return;
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const res = await fetch('http://localhost:8000/api/colors', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setAnalysis(data);
        } catch (err: any) {
            setError(err.message || 'Color analysis failed');
        } finally {
            setLoading(false);
        }
    };

    // Auto-analyze when imageFile changes
    React.useEffect(() => {
        if (imageFile) analyzeColors();
    }, [imageFile]);

    if (!imageFile) {
        return (
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">🎨 Color Predictions</h3>
                <p className="text-gray-400 text-sm">Upload a room image to get AI-powered color analysis</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">🎨 Color Predictions</h3>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-lg bg-gray-700 animate-pulse"
                                style={{ animationDelay: `${i * 150}ms` }}
                            />
                        ))}
                    </div>
                    <span className="text-gray-400 text-sm animate-pulse">Analyzing colors with K-Means...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">🎨 Color Predictions</h3>
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={analyzeColors} className="text-indigo-400 text-sm mt-2 hover:underline">Retry</button>
            </div>
        );
    }

    if (!analysis) return null;

    const mood = MOOD_BADGES[analysis.mood] || MOOD_BADGES.neutral;

    return (
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
            {/* Header with Mood Badge */}
            <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">🎨 Color Predictions</h3>
                <div className={`${mood.bg} ${mood.text} text-xs px-3 py-1.5 rounded-full border font-medium flex items-center gap-1.5`}>
                    {mood.icon} {analysis.mood.charAt(0).toUpperCase() + analysis.mood.slice(1)} Mood
                </div>
            </div>

            {/* Dominant Colors */}
            <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Dominant Colors</p>
                <div className="flex flex-wrap gap-4">
                    {analysis.dominant_colors.map((c, i) => (
                        <ColorSwatch key={i} color={c.hex} percentage={c.percentage} />
                    ))}
                </div>
            </div>

            {/* Wall & Floor Colors */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Wall Colors</p>
                    <div className="flex flex-wrap gap-3">
                        {analysis.wall_colors.map((c, i) => (
                            <ColorSwatch key={i} color={c.hex} percentage={c.percentage} size="sm" />
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Floor Colors</p>
                    <div className="flex flex-wrap gap-3">
                        {analysis.floor_colors.map((c, i) => (
                            <ColorSwatch key={i} color={c.hex} percentage={c.percentage} size="sm" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommended Palette */}
            <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Recommended Palette</p>
                <div className="flex gap-1 rounded-xl overflow-hidden border border-white/10">
                    {analysis.recommended_palette.map((color, i) => (
                        <div
                            key={i}
                            className="flex-1 h-12 hover:flex-[2] transition-all duration-300 cursor-pointer relative group"
                            style={{ backgroundColor: color }}
                            title={color}
                        >
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                {color}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wall Finish Suggestion */}
            <div className="bg-gray-800/50 rounded-xl p-3 border border-white/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Suggested Wall Finish</p>
                <p className="text-white font-medium capitalize">{analysis.wall_finish}</p>
            </div>
        </div>
    );
}
