'use client';

import React from 'react';

interface SizeEstimatorProps {
    roomData?: {
        width: number;
        length: number;
        height: number;
        area_sqm?: number;
        area_sqft?: number;
        wall_area_sqm?: number;
        wall_area_sqft?: number;
    };
    confidence?: number;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
    let color = 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30';
    let label = 'Low';

    if (confidence >= 0.7) {
        color = 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30';
        label = 'High';
    } else if (confidence >= 0.4) {
        color = 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
        label = 'Medium';
    }

    return (
        <span className={`${color} text-xs px-2.5 py-1 rounded-full border font-medium`}>
            {label} Confidence ({Math.round(confidence * 100)}%)
        </span>
    );
}

export default function SizeEstimator({ roomData, confidence }: SizeEstimatorProps) {
    if (!roomData) {
        return (
            <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg flex items-center gap-2">📐 Room Size</h3>
                <p className="text-muted-foreground text-sm mt-2">Upload a room image to estimate size in sq ft</p>
            </div>
        );
    }

    const areaSqft = roomData.area_sqft || (roomData.width * roomData.length * 10.764);
    const areaSqm = roomData.area_sqm || (roomData.width * roomData.length);
    const wallSqft = roomData.wall_area_sqft || ((2 * roomData.width + 2 * roomData.length) * roomData.height * 10.764);
    const wallSqm = roomData.wall_area_sqm || ((2 * roomData.width + 2 * roomData.length) * roomData.height);

    return (
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">📐 Room Size Estimate</h3>
                {confidence !== undefined && <ConfidenceBadge confidence={confidence} />}
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Floor Area</p>
                    <p className="font-bold text-2xl">{areaSqft.toFixed(0)}</p>
                    <p className="text-primary text-xs">sq ft ({areaSqm.toFixed(1)} m²)</p>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Wall Area</p>
                    <p className="font-bold text-2xl">{wallSqft.toFixed(0)}</p>
                    <p className="text-primary text-xs">sq ft ({wallSqm.toFixed(1)} m²)</p>
                </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Width</p>
                    <p className="font-semibold text-sm">{roomData.width.toFixed(1)}m</p>
                    <p className="text-muted-foreground text-[10px]">{(roomData.width * 3.281).toFixed(1)} ft</p>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Length</p>
                    <p className="font-semibold text-sm">{roomData.length.toFixed(1)}m</p>
                    <p className="text-muted-foreground text-[10px]">{(roomData.length * 3.281).toFixed(1)} ft</p>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Height</p>
                    <p className="font-semibold text-sm">{roomData.height.toFixed(1)}m</p>
                    <p className="text-muted-foreground text-[10px]">{(roomData.height * 3.281).toFixed(1)} ft</p>
                </div>
            </div>

            {/* Tip */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <span>💡</span>
                <span>For best accuracy, calibrate with a known reference (door frame = 2.1m / 6.9 ft)</span>
            </div>
        </div>
    );
}
