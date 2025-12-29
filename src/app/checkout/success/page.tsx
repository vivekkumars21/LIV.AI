'use client';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function CheckoutSuccessPage() {
    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                    <CheckCircle2 className="w-12 h-12" />
                </div>

                <h1 className="text-4xl font-light mb-4">Order Confirmed!</h1>
                <p className="text-xl text-muted-foreground max-w-md mb-8">
                    Thank you for shopping with IntraKart. Your premium furniture is being prepared for shipment.
                </p>

                <div className="flex gap-4">
                    <Button asChild size="lg">
                        <Link href="/">Return Home</Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                        <Link href="/shop" className="flex items-center">
                            Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
