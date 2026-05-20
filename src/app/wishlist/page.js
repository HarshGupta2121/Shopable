"use client";

import React from 'react';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function WishlistPage() {
    const { wishlist } = useWishlist();

    return (
        <div className="container py-8 min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">My Wishlist ({wishlist.length})</h1>
                <Link href="/shop" className="text-primary hover:underline">
                    Continue Shopping
                </Link>
            </div>

            {/* Empty State */}
            {wishlist.length === 0 ? (
                <div className="text-center py-20 bg-secondary/20 rounded-xl">
                    <p className="text-6xl mb-4">💔</p>
                    <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
                    <p className="text-muted-foreground mb-6">Explore our products and find something you love!</p>
                    <Link href="/shop" className="btn btn-primary px-8">
                        Explore Shop
                    </Link>
                </div>
            ) : (
                /* Wishlist Grid */
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {wishlist.map((product) => (
                        <div key={product.id}>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
