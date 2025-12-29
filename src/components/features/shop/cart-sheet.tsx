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
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function CartSheet() {
    const { items, removeFromCart, updateQuantity, cartTotal, itemCount } = useCart();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
                        >
                            {itemCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="text-xl font-bold">Your Cart ({itemCount})</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
                            <p className="text-muted-foreground text-lg">Your cart is empty.</p>
                            <SheetClose asChild>
                                <Button variant="link" asChild>
                                    <Link href="/shop">Continue Shopping</Link>
                                </Button>
                            </SheetClose>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                                        <p className="text-sm text-muted-foreground">{item.category}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2 border rounded-md p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-1 hover:bg-neutral-100 rounded"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-1 hover:bg-neutral-100 rounded"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-sm">
                                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                            </span>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-red-500 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <SheetFooter className="flex-col sm:flex-col gap-4 border-t pt-6 bg-background">
                        <div className="flex justify-between items-center w-full mb-2">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-xl font-bold">₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <SheetClose asChild>
                            <Button className="w-full" size="lg" asChild>
                                <Link href="/checkout">Checkout</Link>
                            </Button>
                        </SheetClose>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
