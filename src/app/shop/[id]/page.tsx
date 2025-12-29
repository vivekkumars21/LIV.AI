'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { products } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, ArrowLeft, Truck, ShieldCheck, Box } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addToCart } = useCart();

    const product = products.find(p => p.id === params.id);

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
                    <Button onClick={() => router.push('/shop')} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Shop
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto py-8 px-4">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:pl-2 transition-all"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Image Gallery (Placeholder for multi-image) */}
                    <div className="space-y-4">
                        <div className="aspect-square relative rounded-xl overflow-hidden bg-muted border">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="mb-2">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                {product.category}
                            </span>
                            <h1 className="text-4xl font-light text-foreground mt-1 mb-2">{product.name}</h1>
                            <div className="flex items-baseline gap-4">
                                <span className="text-3xl font-bold">₹{product.price.toLocaleString('en-IN')}</span>
                                {product.stock && product.stock < 5 && (
                                    <span className="text-sm font-medium text-amber-600">
                                        Only {product.stock} left!
                                    </span>
                                )}
                            </div>
                        </div>

                        <p className="text-lg text-muted-foreground leading-relaxed my-6">
                            {product.description}
                        </p>

                        <div className="flex gap-4 mb-8">
                            <Button size="lg" className="flex-1 h-12 text-base" onClick={() => addToCart(product)}>
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Add to Cart
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8 py-6 border-y">
                            <div className="text-center">
                                <Truck className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <span className="text-xs font-medium">Free Shipping</span>
                            </div>
                            <div className="text-center border-l border-r">
                                <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <span className="text-xs font-medium">2 Year Warranty</span>
                            </div>
                            <div className="text-center">
                                <Box className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <span className="text-xs font-medium">Easy Returns</span>
                            </div>
                        </div>

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="dimensions">
                                <AccordionTrigger>Dimensions & Weight</AccordionTrigger>
                                <AccordionContent>
                                    <p className="font-mono text-sm">{product.dimensions || 'Standard sizing applies.'}</p>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="materials">
                                <AccordionTrigger>Materials & Care</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm text-muted-foreground">{product.material || 'Premium materials.'}</p>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="features">
                                <AccordionTrigger>Key Features</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        {product.features?.map((feature, i) => (
                                            <li key={i}>{feature}</li>
                                        )) || <li>Premium design and finish</li>}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="shipping">
                                <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        <span className="font-semibold text-foreground">Delivery:</span> Estimated delivery within 5-7 business days. White glove delivery service included for large items.
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-foreground">Returns:</span> We accept returns within 30 days of delivery. Item must be in original condition.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="shipping">
                                <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        <span className="font-semibold text-foreground">Delivery:</span> Estimated delivery within 5-7 business days. White glove delivery service included for large items.
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-foreground">Returns:</span> We accept returns within 30 days of delivery. Item must be in original condition.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
