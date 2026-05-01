'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ShoppingBag, Minus, Plus, Trash2, ArrowRight, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function CartSheet() {
    const { items, removeFromCart, updateQuantity, cartTotal, itemCount } = useCart();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="relative text-muted-foreground hover:text-primary px-3 flex items-center gap-2 font-semibold tracking-tight transition-all">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="hidden sm:inline">CART</span>
                    {itemCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-background animate-in zoom-in"
                        >
                            {itemCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md border-l shadow-2xl">
                <SheetHeader className="border-b pb-4">
                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-primary" />
                        Your Cart
                        <Badge variant="secondary" className="ml-2 font-mono">{itemCount}</Badge>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
                                <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold">Your cart is empty</h3>
                            <p className="text-muted-foreground">Looks like you haven&apos;t added any beautiful furniture to your space yet.</p>
                            <SheetClose asChild>
                                <Button variant="outline" className="mt-4 rounded-full px-8" asChild>
                                    <Link href="/shop">Start Shopping</Link>
                                </Button>
                            </SheetClose>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4 group animate-in slide-in-from-right duration-300">
                                <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border shadow-sm">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-110"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h4>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                                title="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{item.category}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-1 bg-secondary/50 rounded-full p-1 border">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-background rounded-full transition-all disabled:opacity-30"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-bold w-6 text-center tabular-nums">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-background rounded-full transition-all"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="font-bold text-sm text-foreground">
                                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <SheetFooter className="flex-col sm:flex-col gap-4 border-t pt-6 bg-background mt-auto">
                        <div className="grid grid-cols-3 gap-2 w-full mb-2">
                            <div className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground">
                                <Truck className="w-4 h-4 text-primary" />
                                <span>Free Shipping</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground border-x">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                <span>Secure Checkout</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground">
                                <CreditCard className="w-4 h-4 text-primary" />
                                <span>EMI Available</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center w-full px-2">
                            <span className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Subtotal</span>
                            <span className="text-2xl font-bold text-primary">₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <SheetClose asChild>
                            <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px] active:translate-y-[0px]" asChild>
                                <Link href="/checkout">
                                    Proceed to Checkout
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </Button>
                        </SheetClose>
                        <p className="text-[10px] text-center text-muted-foreground pb-2">
                            Shipping and taxes calculated at checkout.
                        </p>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
