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
    let color = 'bg-red-500/20 text-red-400 border-red-500/30';
    let label = 'Low';

    if (confidence >= 0.7) {
        color = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        label = 'High';
    } else if (confidence >= 0.4) {
        color = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
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
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">📐 Room Size</h3>
                <p className="text-gray-400 text-sm mt-2">Upload a room image to estimate size in sq ft</p>
            </div>
        );
    }

    const areaSqft = roomData.area_sqft || (roomData.width * roomData.length * 10.764);
    const areaSqm = roomData.area_sqm || (roomData.width * roomData.length);
    const wallSqft = roomData.wall_area_sqft || ((2 * roomData.width + 2 * roomData.length) * roomData.height * 10.764);
    const wallSqm = roomData.wall_area_sqm || ((2 * roomData.width + 2 * roomData.length) * roomData.height);

    return (
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">📐 Room Size Estimate</h3>
                {confidence !== undefined && <ConfidenceBadge confidence={confidence} />}
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-indigo-600/15 to-purple-600/15 border border-indigo-500/20 rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Floor Area</p>
                    <p className="text-white font-bold text-2xl">{areaSqft.toFixed(0)}</p>
                    <p className="text-indigo-400 text-xs">sq ft ({areaSqm.toFixed(1)} m²)</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-600/15 to-teal-600/15 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Wall Area</p>
                    <p className="text-white font-bold text-2xl">{wallSqft.toFixed(0)}</p>
                    <p className="text-emerald-400 text-xs">sq ft ({wallSqm.toFixed(1)} m²)</p>
                </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-800/50 rounded-xl p-3 border border-white/5 text-center">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Width</p>
                    <p className="text-white font-semibold text-sm">{roomData.width.toFixed(1)}m</p>
                    <p className="text-gray-500 text-[10px]">{(roomData.width * 3.281).toFixed(1)} ft</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 border border-white/5 text-center">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Length</p>
                    <p className="text-white font-semibold text-sm">{roomData.length.toFixed(1)}m</p>
                    <p className="text-gray-500 text-[10px]">{(roomData.length * 3.281).toFixed(1)} ft</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 border border-white/5 text-center">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Height</p>
                    <p className="text-white font-semibold text-sm">{roomData.height.toFixed(1)}m</p>
                    <p className="text-gray-500 text-[10px]">{(roomData.height * 3.281).toFixed(1)} ft</p>
                </div>
            </div>

            {/* Tip */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-2.5 text-amber-300 text-xs flex items-start gap-2">
                <span>💡</span>
                <span>For best accuracy, calibrate with a known reference (door frame = 2.1m / 6.9 ft)</span>
            </div>
        </div>
    );
}
