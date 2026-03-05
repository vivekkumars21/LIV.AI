'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    searchProfessionalsByCity,
    registerProfessional,
    getAllCities,
    Professional,
    ProfessionType,
    PROFESSION_LABELS,
    INDIAN_STATES,
    RegisterProfessionalData,
} from '@/lib/professionals';

// ─── Star Rating Component ──────────────────────────────────

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    width={size}
                    height={size}
                    viewBox="0 0 20 20"
                    fill={star <= Math.round(rating) ? '#f59e0b' : '#374151'}
                    className="transition-colors"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            <span className="text-xs text-gray-400 ml-1">({rating.toFixed(1)})</span>
        </div>
    );
}

// ─── Professional Card ──────────────────────────────────────

function ProfessionalCard({ professional }: { professional: Professional }) {
    return (
        <div className="group relative bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 hover:border-white/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Verified badge */}
            {professional.verified && (
                <div className="absolute top-4 right-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs px-2.5 py-1 rounded-full border border-green-200 dark:border-green-500/30 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Verified
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-xl shrink-0">
                    {professional.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate">{professional.name}</h3>
                    <p className="text-primary text-sm font-medium">
                        {PROFESSION_LABELS[professional.profession] || professional.profession}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-muted-foreground"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        <span className="text-muted-foreground text-sm">{professional.city}, {professional.state}</span>
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="mb-4">
                <StarRating rating={professional.rating} />
                <span className="text-gray-500 text-xs ml-1">({professional.review_count} reviews)</span>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Visiting Charge</p>
                    <p className="font-bold text-lg">₹{professional.visiting_charge_inr.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Rate / sq ft</p>
                    <p className="font-bold text-lg">₹{professional.rate_per_sqft_inr.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Experience & Bio */}
            <div className="mb-4">
                <p className="text-primary text-sm font-medium">{professional.experience_years} years experience</p>
                {professional.bio && (
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{professional.bio}</p>
                )}
            </div>

            {/* Contact */}
            <div className="flex gap-2">
                <a
                    href={`tel:${professional.phone}`}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2.5 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
                >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    Call Now
                </a>
                {professional.email && (
                    <a
                        href={`mailto:${professional.email}`}
                        className="bg-white/50 backdrop-blur-sm hover:bg-white/70 border border-white/20 text-sm font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                        Email
                    </a>
                )}
            </div>
        </div>
    );
}

// ─── Registration Form ──────────────────────────────────────

function RegistrationForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState<RegisterProfessionalData>({
        name: '',
        profession: 'interior_designer',
        city: '',
        state: 'Gujarat',
        phone: '',
        email: '',
        visiting_charge_inr: 0,
        rate_per_sqft_inr: 0,
        experience_years: 0,
        bio: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!form.name || !form.city || !form.phone) {
                throw new Error('Name, city, and phone are required');
            }
            await registerProfessional(form);
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                setSuccess(false);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-gray-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm";
    const labelClass = "block text-gray-300 text-sm font-medium mb-1.5";

    if (success) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="40" height="40" viewBox="0 0 20 20" fill="currentColor" className="text-emerald-400"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <h3 className="text-white text-2xl font-bold mb-2">Registration Successful!</h3>
                <p className="text-gray-400">Your profile is now live. Clients can find you.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>Full Name *</label>
                    <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g., Rajesh Kumar"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>Profession *</label>
                    <select
                        className={inputClass}
                        value={form.profession}
                        onChange={(e) => setForm({ ...form, profession: e.target.value as ProfessionType })}
                    >
                        {Object.entries(PROFESSION_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>City *</label>
                    <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g., Ahmedabad"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>State *</label>
                    <select
                        className={inputClass}
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                    >
                        {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>Phone *</label>
                    <input
                        type="tel"
                        className={inputClass}
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>Email</label>
                    <input
                        type="email"
                        className={inputClass}
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className={labelClass}>Visiting Charge (₹) *</label>
                    <input
                        type="number"
                        className={inputClass}
                        placeholder="e.g., 500"
                        value={form.visiting_charge_inr || ''}
                        onChange={(e) => setForm({ ...form, visiting_charge_inr: parseInt(e.target.value) || 0 })}
                        min="0"
                    />
                </div>
                <div>
                    <label className={labelClass}>Rate per sq ft (₹) *</label>
                    <input
                        type="number"
                        className={inputClass}
                        placeholder="e.g., 25"
                        value={form.rate_per_sqft_inr || ''}
                        onChange={(e) => setForm({ ...form, rate_per_sqft_inr: parseInt(e.target.value) || 0 })}
                        min="0"
                    />
                </div>
                <div>
                    <label className={labelClass}>Experience (Years)</label>
                    <input
                        type="number"
                        className={inputClass}
                        placeholder="e.g., 5"
                        value={form.experience_years || ''}
                        onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })}
                        min="0"
                    />
                </div>
            </div>

            <div>
                <label className={labelClass}>About You (Bio)</label>
                <textarea
                    className={`${inputClass} h-24 resize-none`}
                    placeholder="Describe your specialization, projects, and what makes you unique..."
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        Registering...
                    </span>
                ) : (
                    'Register as Professional'
                )}
            </button>
        </form>
    );
}

// ─── Main Page ──────────────────────────────────────────────

export default function ProfessionalsPage() {
    const [activeTab, setActiveTab] = useState<'search' | 'register'>('search');
    const [searchCity, setSearchCity] = useState('');
    const [selectedProfession, setSelectedProfession] = useState<ProfessionType | ''>('');
    const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high' | 'experience'>('rating');
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Load available cities on mount
    useEffect(() => {
        getAllCities().then(setCities).catch(console.error);
    }, []);

    const handleSearch = useCallback(async () => {
        if (!searchCity.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const results = await searchProfessionalsByCity(
                searchCity,
                selectedProfession || undefined,
                sortBy,
            );
            setProfessionals(results);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    }, [searchCity, selectedProfession, sortBy]);

    // Re-search on filter/sort changes
    useEffect(() => {
        if (searched && searchCity.trim()) {
            handleSearch();
        }
    }, [selectedProfession, sortBy]);

    return (
        <div className="min-h-screen bg-background">
            {/* Animated background - subtle */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <a href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
                        ← Back to Home
                    </a>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                        Find Professionals
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Connect with verified interior designers, contractors, painters and more in your city
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-1.5 flex gap-1 shadow-sm">
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'search'
                                    ? 'bg-white shadow-md'
                                    : 'hover:bg-white/50'
                                }`}
                        >
                            🔍 Find Professionals
                        </button>
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'register'
                                    ? 'bg-white shadow-md'
                                    : 'hover:bg-white/50'
                                }`}
                        >
                            ✨ Register as Professional
                        </button>
                    </div>
                </div>

                {/* ─── Search Tab ──────────────────────────────────── */}
                {activeTab === 'search' && (
                    <div>
                        {/* Search Bar */}
                        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* City Input */}
                                <div className="flex-1 relative">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Enter city name (e.g., Ahmedabad)"
                                        className="w-full bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                                        value={searchCity}
                                        onChange={(e) => setSearchCity(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        list="city-suggestions"
                                    />
                                    {cities.length > 0 && (
                                        <datalist id="city-suggestions">
                                            {cities.map((city) => (
                                                <option key={city} value={city} />
                                            ))}
                                        </datalist>
                                    )}
                                </div>

                                {/* Profession Filter */}
                                <select
                                    className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 transition-all min-w-[180px]"
                                    value={selectedProfession}
                                    onChange={(e) => setSelectedProfession(e.target.value as ProfessionType | '')}
                                >
                                    <option value="">All Professions</option>
                                    {Object.entries(PROFESSION_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>

                                {/* Sort */}
                                <select
                                    className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 transition-all min-w-[160px]"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                >
                                    <option value="rating">⭐ Top Rated</option>
                                    <option value="price_low">💰 Price: Low → High</option>
                                    <option value="price_high">💰 Price: High → Low</option>
                                    <option value="experience">📅 Most Experienced</option>
                                </select>

                                {/* Search Button */}
                                <button
                                    onClick={handleSearch}
                                    disabled={loading || !searchCity.trim()}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg whitespace-nowrap"
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        {searched && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-white">
                                        {loading ? 'Searching...' : `${professionals.length} professional${professionals.length !== 1 ? 's' : ''} found`}
                                        {searchCity && <span className="text-indigo-400"> in {searchCity}</span>}
                                    </h2>
                                </div>

                                {professionals.length === 0 && !loading ? (
                                    <div className="text-center py-16 bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl">
                                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor" className="text-gray-600"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                        </div>
                                        <h3 className="text-white text-lg font-semibold mb-2">No professionals found</h3>
                                        <p className="text-gray-400 text-sm">No professionals registered in &quot;{searchCity}&quot; yet. Try a different city or check back later.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {professionals.map((prof) => (
                                            <ProfessionalCard key={prof.id} professional={prof} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Initial state */}
                        {!searched && (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 bg-gray-900/60 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor" className="text-indigo-500/60"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                </div>
                                <h3 className="text-white text-xl font-semibold mb-2">Search for professionals in your city</h3>
                                <p className="text-gray-400 max-w-md mx-auto">Enter your city name above to find interior designers, contractors, painters and more near you with their prices.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Register Tab ────────────────────────────────── */}
                {activeTab === 'register' && (
                    <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-sm">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Register as a Professional</h2>
                            <p className="text-muted-foreground">Create your profile and let clients find you. Set your own rates and visiting charges.</p>
                        </div>
                        <RegistrationForm onSuccess={() => setActiveTab('search')} />
                    </div>
                )}
            </div>
        </div>
    );
}
