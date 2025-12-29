import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/products';
import { ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { toast } = useToast();
    const { addToCart } = useCart();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to product page if clicking the button
        e.stopPropagation();

        addToCart(product);
        // Toast is already handled in addToCart context, so we don't need to duplicate it here, 
        // OR we can keep it here if context doesn't handle it.
        // Looking at CartContext.tsx, it DOES handle the toast. So we should remove the manual toast here.
    };

    return (
        <div className="group relative bg-card rounded-lg border overflow-hidden transition-all hover:shadow-md">
            <div className="aspect-square relative overflow-hidden bg-muted">
                <Link href={`/shop/${product.id}`}>
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105 cursor-pointer"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </Link>
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-semibold truncate pr-2">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <span className="font-bold">₹{product.price.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">
                    {product.description}
                </p>
                <Button onClick={handleAddToCart} className="w-full" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                </Button>
            </div>
        </div>
    );
}
