'use client';

import React, { useState, useEffect } from 'react';

interface BudgetResult {
    project_type: string;
    quality_tier: string;
    area_sqft: number;
    city_tier: string;
    city_multiplier: number;
    material_cost: number;
    labor_cost: number;
    total_estimate: number;
    gst_18_percent: number;
    grand_total: number;
    breakdown: {
        item: string;
        material_cost: number;
        labor_cost: number;
        total: number;
        description: string;
    }[];
    savings_tips: string[];
    price_range: { min: number; max: number };
}

const PROJECT_TYPES = [
    { id: 'painting', label: '🎨 Painting', icon: '🖌️' },
    { id: 'flooring', label: '🪨 Flooring', icon: '🏗️' },
    { id: 'false_ceiling', label: '✨ False Ceiling', icon: '💡' },
    { id: 'full_renovation', label: '🏠 Full Renovation', icon: '🔨' },
    { id: 'modular_kitchen', label: '🍳 Modular Kitchen', icon: '🧑‍🍳' },
    { id: 'wardrobe', label: '👔 Wardrobe', icon: '🚪' },
];

const QUALITY_TIERS = [
    { id: 'basic', label: 'Basic', color: 'from-gray-500 to-gray-600' },
    { id: 'standard', label: 'Standard', color: 'from-blue-500 to-blue-600' },
    { id: 'premium', label: 'Premium', color: 'from-purple-500 to-purple-600' },
    { id: 'luxury', label: 'Luxury', color: 'from-amber-500 to-amber-600' },
];

const CITY_TIERS = [
    { id: 'tier_1', label: 'Tier 1 (Mumbai, Delhi, Bangalore)', multiplier: '1.3×' },
    { id: 'tier_2', label: 'Tier 2 (Ahmedabad, Jaipur, Surat)', multiplier: '1.0×' },
    { id: 'tier_3', label: 'Tier 3 (Smaller cities)', multiplier: '0.8×' },
];

function formatINR(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
}

function AnimatedNumber({ value, prefix = '₹' }: { value: number; prefix?: string }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 800;
        const startTime = Date.now();
        const startValue = displayValue;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplayValue(Math.round(startValue + (value - startValue) * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [value]);

    return <span>{prefix}{displayValue.toLocaleString('en-IN')}</span>;
}

export default function BudgetCalculator({ initialAreaSqft }: { initialAreaSqft?: number }) {
    const [areaSqft, setAreaSqft] = useState(initialAreaSqft || 200);
    const [projectType, setProjectType] = useState('painting');
    const [qualityTier, setQualityTier] = useState('standard');
    const [cityTier, setCityTier] = useState('tier_2');
    const [result, setResult] = useState<BudgetResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialAreaSqft && initialAreaSqft > 0) {
            setAreaSqft(Math.round(initialAreaSqft));
        }
    }, [initialAreaSqft]);

    const calculate = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:8000/api/budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    area_sqft: areaSqft,
                    project_type: projectType,
                    quality_tier: qualityTier,
                    city_tier: cityTier,
                }),
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Budget calculation failed');
        } finally {
            setLoading(false);
        }
    };

    // Auto-calculate when inputs change
    useEffect(() => {
        if (areaSqft > 0) {
            const timer = setTimeout(calculate, 500);
            return () => clearTimeout(timer);
        }
    }, [areaSqft, projectType, qualityTier, cityTier]);

    return (
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">💰 Budget Calculator</h3>

            {/* Area Input */}
            <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Room Area (sq ft)</label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="50"
                        max="3000"
                        step="10"
                        value={areaSqft}
                        onChange={(e) => setAreaSqft(parseInt(e.target.value))}
                        className="flex-1 accent-indigo-500 h-2"
                    />
                    <input
                        type="number"
                        value={areaSqft}
                        onChange={(e) => setAreaSqft(parseInt(e.target.value) || 0)}
                        className="w-24 bg-gray-800/80 border border-white/10 rounded-xl px-3 py-2 text-white text-center text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                    <span className="text-gray-500 text-sm">sq ft</span>
                </div>
            </div>

            {/* Project Type */}
            <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Project Type</label>
                <div className="grid grid-cols-3 gap-2">
                    {PROJECT_TYPES.map((pt) => (
                        <button
                            key={pt.id}
                            onClick={() => setProjectType(pt.id)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all border ${projectType === pt.id
                                    ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                    : 'bg-gray-800/50 border-white/5 text-gray-400 hover:border-white/15'
                                }`}
                        >
                            {pt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quality Tier */}
            <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Quality</label>
                <div className="flex gap-2">
                    {QUALITY_TIERS.map((qt) => (
                        <button
                            key={qt.id}
                            onClick={() => setQualityTier(qt.id)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${qualityTier === qt.id
                                    ? `bg-gradient-to-r ${qt.color} border-transparent text-white shadow-lg`
                                    : 'bg-gray-800/50 border-white/5 text-gray-400 hover:border-white/15'
                                }`}
                        >
                            {qt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* City Tier */}
            <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">City Tier</label>
                <select
                    value={cityTier}
                    onChange={(e) => setCityTier(e.target.value)}
                    className="w-full bg-gray-800/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                >
                    {CITY_TIERS.map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.label} — {ct.multiplier}</option>
                    ))}
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {/* Results */}
            {result && !error && (
                <div className="space-y-4 pt-2">
                    {/* Grand Total */}
                    <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-5 text-center">
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Estimated Total (incl. 18% GST)</p>
                        <p className="text-3xl font-bold text-white">
                            <AnimatedNumber value={result.grand_total} />
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            Range: {formatINR(result.price_range.min)} — {formatINR(result.price_range.max)}
                        </p>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800/50 rounded-xl p-3 border border-white/5 text-center">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Material</p>
                            <p className="text-white font-semibold text-sm">{formatINR(result.material_cost)}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-3 border border-white/5 text-center">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Labor</p>
                            <p className="text-white font-semibold text-sm">{formatINR(result.labor_cost)}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-3 border border-white/5 text-center">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">GST 18%</p>
                            <p className="text-white font-semibold text-sm">{formatINR(result.gst_18_percent)}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {result.breakdown.length > 0 && (
                        <div className="bg-gray-800/30 rounded-xl p-3 border border-white/5">
                            <p className="text-gray-300 text-sm">{result.breakdown[0].description}</p>
                        </div>
                    )}

                    {/* Savings Tips */}
                    {result.savings_tips.length > 0 && (
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">💡 Savings Tips</p>
                            <div className="space-y-2">
                                {result.savings_tips.map((tip, i) => (
                                    <div key={i} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-2.5 text-emerald-300 text-xs">
                                        {tip}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Loading */}
            {loading && !result && (
                <div className="text-center py-6">
                    <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Calculating budget...</p>
                </div>
            )}
        </div>
    );
}
