'use client';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { CheckCircle2, ArrowRight, Package, Truck, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function CheckoutSuccessPage() {
    useEffect(() => {
        // Trigger refined confetti on mount
        const duration = 2 * 1000;
        const animationEnd = Date.now() + duration;
        
        const frame = () => {
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#0f172a', '#3b82f6', '#10b981']
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#0f172a', '#3b82f6', '#10b981']
          });

          if (Date.now() < animationEnd) {
            requestAnimationFrame(frame);
          }
        };
        frame();
    }, []);

    const orderNumber = `IK-${Math.floor(100000 + Math.random() * 900000)}`;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50">
            <Header />
            <main className="flex-1 container mx-auto flex flex-col items-center justify-center p-6 py-12">
                <div className="w-full max-w-2xl bg-white/40 backdrop-blur-xl border border-white/20 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-slate-200/50 text-center animate-in fade-in zoom-in duration-700">
                    <div className="relative inline-block mb-8">
                        <div className="absolute inset-0 bg-green-400 blur-2xl opacity-20 animate-pulse"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl rotate-3">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">Order Received</h1>
                    <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                        Thank you for your trust. Your premium furniture order <span className="font-mono font-bold text-primary">{orderNumber}</span> is now being processed.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="p-4 rounded-2xl bg-white/60 border border-white/40 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                                <Package className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Status</span>
                            <span className="font-bold text-slate-900">Processing</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/60 border border-white/40 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                                <Truck className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Delivery</span>
                            <span className="font-bold text-slate-900">3-5 Days</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/60 border border-white/40 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Estimated</span>
                            <span className="font-bold text-slate-900">June 15</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="rounded-2xl h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                            <Link href="/">Back to Dashboard</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild className="rounded-2xl h-14 px-8 border-slate-200 hover:bg-white hover:border-slate-300">
                            <Link href="/shop" className="flex items-center gap-2 text-slate-600 font-semibold">
                                Continue Shopping <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
                
                <p className="mt-12 text-slate-400 text-sm">
                    A confirmation email has been sent to your registered address.
                </p>
            </main>
            <Footer />
        </div>
    );
}
