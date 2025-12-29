'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
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

    if (items.length === 0) {
        router.push('/shop');
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-muted/30">
            <Header />
            <main className="flex-1 container mx-auto py-12 px-4">
                <h1 className="text-3xl font-light mb-8 text-center">Checkout</h1>

                <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                    {/* Form */}
                    <div className="space-y-6 bg-card p-6 rounded-lg border shadow-sm h-fit">
                        <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" required placeholder="John Doe" value={formData.name} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required placeholder="john@example.com" value={formData.email} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" name="address" required placeholder="123 Design St" value={formData.address} onChange={handleInputChange} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" name="city" required placeholder="New York" value={formData.city} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zip">ZIP Code</Label>
                                    <Input id="zip" name="zip" required placeholder="10001" value={formData.zip} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h2 className="text-xl font-semibold mb-4">Payment Details (Simulated)</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="card">Card Number</Label>
                                        <Input id="card" name="card" readOnly value={formData.card} className="bg-muted" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expiry">Expiry</Label>
                                            <Input id="expiry" name="expiry" readOnly value={formData.expiry} className="bg-muted" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cvc">CVC</Label>
                                            <Input id="cvc" name="cvc" readOnly value={formData.cvc} className="bg-muted" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg mt-6" disabled={isProcessing}>
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Pay ₹${cartTotal.toLocaleString('en-IN')}`
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        <div className="bg-card p-6 rounded-lg border shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex justify-between items-start text-sm">
                                        <div className="flex gap-3">
                                            <span className="font-bold text-muted-foreground">{item.quantity}x</span>
                                            <span>{item.name}</span>
                                        </div>
                                        <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-xl font-bold border-t pt-4 mt-4">
                                <span>Total</span>
                                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                            <p className="font-semibold mb-1">Secure Checkout</p>
                            <p>This is a simulated checkout. No real payment will be processed, but your order will be "placed".</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
