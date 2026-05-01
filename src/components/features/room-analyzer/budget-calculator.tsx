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
    { id: 'painting', label: 'Painting', icon: '' },
    { id: 'flooring', label: 'Flooring', icon: '' },
    { id: 'false_ceiling', label: 'False Ceiling', icon: '' },
    { id: 'full_renovation', label: 'Full Renovation', icon: '' },
    { id: 'modular_kitchen', label: 'Modular Kitchen', icon: '' },
    { id: 'wardrobe', label: 'Wardrobe', icon: '' },
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
            const res = await fetch('/api/python/budget', {
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
        <div className="bg-card text-card-foreground border border-border/50 rounded-3xl p-8 space-y-7 shadow-sm">
            <h3 className="font-bold text-xl flex items-center gap-2">Budget Calculator</h3>

            {/* Area Input */}
            <div>
                <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-3 block">Room Area (sq ft)</label>
                <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-2xl border border-border/50">
                    <input
                        type="range"
                        min="50"
                        max="3000"
                        step="10"
                        value={areaSqft}
                        onChange={(e) => setAreaSqft(parseInt(e.target.value))}
                        className="flex-1 accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={areaSqft}
                            onChange={(e) => setAreaSqft(parseInt(e.target.value) || 0)}
                            className="w-24 bg-background border border-input rounded-xl px-3 py-2 text-center text-sm font-bold focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm"
                        />
                        <span className="text-muted-foreground text-xs font-semibold">sq ft</span>
                    </div>
                </div>
            </div>

            {/* Project Type */}
            <div>
                <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-3 block">Project Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PROJECT_TYPES.map((pt) => (
                        <button
                            key={pt.id}
                            onClick={() => setProjectType(pt.id)}
                            className={`py-3.5 px-3 rounded-2xl text-xs font-semibold transition-all border flex flex-col items-center gap-2 justify-center ${projectType === pt.id
                                ? 'bg-primary text-primary-foreground border-primary shadow-md transform scale-[1.02]'
                                : 'bg-secondary/50 text-foreground border-border hover:bg-secondary hover:border-border/80'
                                }`}
                        >
                            <span>{pt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quality Tier */}
            <div>
                <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-3 block">Quality</label>
                <div className="flex gap-2">
                    {QUALITY_TIERS.map((qt) => (
                        <button
                            key={qt.id}
                            onClick={() => setQualityTier(qt.id)}
                            className={`flex-1 py-3.5 rounded-2xl text-xs font-semibold transition-all border ${qualityTier === qt.id
                                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                : 'bg-secondary/50 text-foreground border-border hover:bg-secondary hover:border-border/80'
                                }`}
                        >
                            {qt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* City Tier */}
            <div>
                <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-3 block">City Tier</label>
                <select
                    value={cityTier}
                    onChange={(e) => setCityTier(e.target.value)}
                    className="w-full bg-background border border-input rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm cursor-pointer"
                >
                    {CITY_TIERS.map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.label} — {ct.multiplier}</option>
                    ))}
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {/* Results */}
            {result && !error && (
                <div className="space-y-5 pt-4">
                    {/* Grand Total */}
                    <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-3xl p-6 text-center shadow-lg transform transition-all">
                        <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-widest mb-1.5">Estimated Total (incl. 18% GST)</p>
                        <p className="text-4xl font-bold tracking-tight">
                            <AnimatedNumber value={result.grand_total} />
                        </p>
                        <p className="text-primary-foreground/60 text-xs font-medium mt-2 bg-primary-foreground/10 inline-block px-3 py-1 rounded-full">
                            Range: {formatINR(result.price_range.min)} — {formatINR(result.price_range.max)}
                        </p>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50 text-center shadow-sm">
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1.5">Material</p>
                            <p className="font-bold text-foreground">{formatINR(result.material_cost)}</p>
                        </div>
                        <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50 text-center shadow-sm">
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1.5">Labor</p>
                            <p className="font-bold text-foreground">{formatINR(result.labor_cost)}</p>
                        </div>
                        <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50 text-center shadow-sm">
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1.5">GST 18%</p>
                            <p className="font-bold text-foreground">{formatINR(result.gst_18_percent)}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {result.breakdown.length > 0 && (
                        <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50 shadow-sm">
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">{result.breakdown[0].description}</p>
                        </div>
                    )}

                    {/* Savings Tips */}
                    {result.savings_tips.length > 0 && (
                        <div className="pt-2">
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" clipRule="evenodd" /></svg>
                                Savings Tips
                            </p>
                            <div className="space-y-2.5">
                                {result.savings_tips.map((tip, i) => (
                                    <div key={i} className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-start gap-2.5 shadow-sm">
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        <span>{tip}</span>
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
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Calculating budget...</p>
                </div>
            )}
        </div>
    );
}
