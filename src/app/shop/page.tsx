'use client';

import { useState } from 'react';
import { products } from '@/lib/products';
import { ProductCard } from '@/components/features/shop/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export default function ShopPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [priceSort, setPriceSort] = useState<'asc' | 'desc' | null>(null);

    const categories = Array.from(new Set(products.map((p) => p.category)));

    const filteredProducts = products
        .filter((product) => {
            const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        })
        .sort((a, b) => {
            if (priceSort === 'asc') return a.price - b.price;
            if (priceSort === 'desc') return b.price - a.price;
            return 0;
        });

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto py-8 px-4">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full md:w-64 space-y-6">
                        <div>
                            <h3 className="font-semibold mb-4 text-lg">Filters</h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-3">Categories</h4>
                            <div className="space-y-2">
                                <Button
                                    variant={selectedCategory === null ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    All Products
                                </Button>
                                {categories.map((category) => (
                                    <Button
                                        key={category}
                                        variant={selectedCategory === category ? "secondary" : "ghost"}
                                        className="w-full justify-start"
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-3">Sort By</h4>
                            <select
                                className="w-full p-2 rounded-md border text-sm"
                                onChange={(e) => setPriceSort(e.target.value as 'asc' | 'desc' | null)}
                            >
                                <option value="">Featured</option>
                                <option value="asc">Price: Low to High</option>
                                <option value="desc">Price: High to Low</option>
                            </select>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold">Shop Furniture</h1>
                            <p className="text-muted-foreground mt-1">
                                {filteredProducts.length} results found
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No products found for your filters.</p>
                                <Button
                                    variant="link"
                                    onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
