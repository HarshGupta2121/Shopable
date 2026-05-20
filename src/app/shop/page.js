"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import ProductCard from '@/components/ProductCard';
import { useVoice } from '@/context/VoiceContext';

import { products as PRODUCTS } from '@/data/products';

function ShopContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const category = searchParams.get('cat');
    const sort = searchParams.get('sort');
    
    // Local filter state
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [filterColor, setFilterColor] = useState('');
    const [applyFilters, setApplyFilters] = useState(false); // Trigger refetch

    const [filteredProducts, setFilteredProducts] = useState(PRODUCTS);
    const { speak } = useVoice();

    useEffect(() => {
        const loadProducts = async () => {
            let results = [];
            let useStatic = false;

            try {
                const params = new URLSearchParams();
                if (query) params.append('q', query);
                if (category) params.append('cat', category);
                if (sort) params.append('sort', sort);
                if (minPrice) params.append('minPrice', minPrice);
                if (maxPrice) params.append('maxPrice', maxPrice);
                if (filterColor) params.append('color', filterColor);

                // Add a small timeout to not hang if DB is completely unresponsive
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const res = await fetch(`/api/products?${params.toString()}`, {
                    signal: controller.signal,
                    cache: 'no-store'
                });
                clearTimeout(timeoutId);

                if (!res.ok) throw new Error('API Error');
                results = await res.json();
            } catch (e) {
                console.warn("API fetch failed, falling back to static data:", e);
                useStatic = true;
            }

            if (useStatic) {
                results = [...PRODUCTS];

                // Filter by Category
                if (category) {
                    results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
                }

                // Filter by Query (Search)
                if (query) {
                    const lowerQuery = query.toLowerCase();
                    results = results.filter(p =>
                        p.name.toLowerCase().includes(lowerQuery) ||
                        p.description.toLowerCase().includes(lowerQuery) ||
                        (p.category && p.category.toLowerCase().includes(lowerQuery))
                    );
                }

                // Filter by Price
                if (minPrice) results = results.filter(p => p.price >= Number(minPrice));
                if (maxPrice) results = results.filter(p => p.price <= Number(maxPrice));

                // Filter by Color
                if (filterColor) {
                    const targetColor = filterColor.toLowerCase();
                    results = results.filter(p => p.colors && p.colors.some(c => c.toLowerCase() === targetColor));
                }

                // Sort
                if (sort) {
                    if (sort === 'price_asc') {
                        results.sort((a, b) => a.price - b.price);
                    } else if (sort === 'price_desc') {
                        results.sort((a, b) => b.price - a.price);
                    } else if (sort === 'newest') {
                        results.sort((a, b) => b.id - a.id);
                    }
                }
            }

            setFilteredProducts(results);

            if (query || category) {
                // Optional: Debounced speak could go here
            }
        };

        loadProducts();

    }, [query, category, sort, applyFilters]);

    const handleApplyFilters = () => {
        setApplyFilters(prev => !prev);
    };

    const clearFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setFilterColor('');
        setApplyFilters(prev => !prev);
    };

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-8">
                {category ? `${category} Products` : (query ? `Search Results for "${query}"` : "All Products")}
            </h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Filters</h3>
                            <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear</button>
                        </div>
                        
                        {/* Price Range */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-sm mb-3">Price Range (₹)</h4>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={minPrice} 
                                    onChange={(e) => setMinPrice(e.target.value)} 
                                    placeholder="Min" 
                                    className="w-full h-9 rounded-md border border-input px-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                                />
                                <span>-</span>
                                <input 
                                    type="number" 
                                    value={maxPrice} 
                                    onChange={(e) => setMaxPrice(e.target.value)} 
                                    placeholder="Max" 
                                    className="w-full h-9 rounded-md border border-input px-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                                />
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-sm mb-3">Colors</h4>
                            <div className="flex flex-wrap gap-2">
                                {['Black', 'White', 'Blue', 'Silver', 'Red'].map(color => (
                                    <button 
                                        key={color}
                                        onClick={() => setFilterColor(color === filterColor ? '' : color)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${filterColor === color ? 'bg-primary text-white border-primary' : 'bg-secondary border-border hover:border-primary'}`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleApplyFilters} className="w-full btn btn-primary py-2 text-sm">
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1">
                    {filteredProducts.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-border text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 text-2xl">🔍</div>
                            <h3 className="text-xl font-bold mb-2">No products found</h3>
                            <p className="text-muted-foreground mb-4">Try adjusting your filters or search query to find what you're looking for.</p>
                            <button onClick={clearFilters} className="btn btn-outline">Clear All Filters</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Shop() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ShopContent />
        </Suspense>
    );
}
