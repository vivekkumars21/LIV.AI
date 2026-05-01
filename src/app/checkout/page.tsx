'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Truck, CreditCard, Package, Receipt, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const { items, cartTotal, clearCart, isInitialized } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        city: '',
        zip: '',
        card: '4242 4242 4242 4242',
        expiry: '12/25',
        cvc: '123'
    });

    useEffect(() => {
        if (isInitialized && items.length === 0) {
            router.push('/shop');
        }
    }, [isInitialized, items, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Success
        clearCart();
        toast({
            title: "Order Placed Successfully",
            description: "Thank you for your purchase! You will receive an email shortly.",
        });
        router.push('/checkout/success');
    };

    // Show nothing while initializing or if redirecting
    if (!isInitialized || items.length === 0) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-muted/30">
            <Header />
            <main className="flex-1 container mx-auto py-12 px-4 max-w-6xl">
                <div className="mb-8">
                    <Link href="/shop" className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Shop
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight">Checkout</h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card p-8 rounded-3xl border shadow-sm space-y-8">
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold">Shipping Information</h2>
                                </div>
                                
                                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" name="name" required placeholder="John Doe" value={formData.name} onChange={handleInputChange} className="rounded-xl h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" name="email" type="email" required placeholder="john@example.com" value={formData.email} onChange={handleInputChange} className="rounded-xl h-12" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input id="address" name="address" required placeholder="123 Design St" value={formData.address} onChange={handleInputChange} className="rounded-xl h-12" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" name="city" required placeholder="New York" value={formData.city} onChange={handleInputChange} className="rounded-xl h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zip">ZIP Code</Label>
                                            <Input id="zip" name="zip" required placeholder="10001" value={formData.zip} onChange={handleInputChange} className="rounded-xl h-12" />
                                        </div>
                                    </div>
                                </form>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold">Payment Details</h2>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="card">Card Number</Label>
                                        <div className="relative">
                                            <Input id="card" name="card" readOnly value={formData.card} className="bg-muted rounded-xl h-12 pl-12" />
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expiry">Expiry</Label>
                                            <Input id="expiry" name="expiry" readOnly value={formData.expiry} className="bg-muted rounded-xl h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cvc">CVC</Label>
                                            <Input id="cvc" name="cvc" readOnly value={formData.cvc} className="bg-muted rounded-xl h-12" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <Button form="checkout-form" type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px]" disabled={isProcessing}>
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processing Order...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="mr-2 h-5 w-5" />
                                        Complete Purchase - ₹{cartTotal.toLocaleString('en-IN')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        <div className="bg-card p-8 rounded-3xl border shadow-sm sticky top-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Receipt className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold">Order Summary</h2>
                            </div>
                            
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6 scrollbar-thin">
                                {items.map(item => (
                                    <div key={item.id} className="flex justify-between items-start text-sm group">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0 border">
                                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold line-clamp-1">{item.name}</p>
                                                <p className="text-muted-foreground text-xs">{item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 border-t pt-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">₹{cartTotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                        <Truck className="w-4 h-4" />
                                        <span>FREE</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xl font-bold border-t pt-4 mt-2">
                                    <span>Total</span>
                                    <span className="text-primary">₹{cartTotal.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                                <div className="flex items-center gap-2 text-primary">
                                    <ShieldCheck className="w-5 h-5" />
                                    <span className="font-bold text-sm uppercase tracking-wider">Secure Payment</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Your security is our priority. This is a secure SSL encrypted payment. No real payment will be processed in this demo.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
