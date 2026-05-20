"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const { user } = useAuth();

    // Initial Load: DB for User, LocalStorage for Guest
    useEffect(() => {
        const loadWishlist = async () => {
            if (user) {
                // Fetch from DB
                try {
                    const res = await fetch('/api/wishlist');
                    if (res.ok) {
                        const data = await res.json();
                        // Transform weird ObjectIds if needed, but Mongoose returns _id. 
                        // Our app uses 'id' string sometimes. Let's normalize to checking _id vs id.
                        // Assuming products have _id from DB. Static products have id.
                        // We will standardise on checking both or mapping.
                        const formatted = data.map(item => ({ ...item, id: item._id || item.id }));
                        setWishlist(formatted);
                    }
                } catch (err) {
                    console.error("Failed to load wishlist from DB", err);
                }
            } else {
                // Load from Local Storage
                const storedWishlist = localStorage.getItem('wishlist');
                if (storedWishlist) {
                    setWishlist(JSON.parse(storedWishlist));
                }
            }
        };

        loadWishlist();
    }, [user]);

    // Save to LocalStorage only if Guest
    useEffect(() => {
        if (!user) {
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
    }, [wishlist, user]);

    const addToWishlist = async (product) => {
        if (isInWishlist(product.id || product._id)) return;

        // Optimistic Update
        setWishlist((prev) => [...prev, product]);

        if (user) {
            // Sync with DB
            try {
                await fetch('/api/wishlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: product._id || product.id })
                });
            } catch (err) {
                console.error("Failed to add to DB wishlist", err);
                // Revert if failed
                setWishlist((prev) => prev.filter(p => (p.id || p._id) !== (product.id || product._id)));
            }
        }
    };

    const removeFromWishlist = async (productId) => {
        // Optimistic Update
        const previousWishlist = [...wishlist];
        setWishlist((prev) => prev.filter((item) => (item.id || item._id) !== productId));

        if (user) {
            // Sync with DB
            try {
                await fetch('/api/wishlist', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId })
                });
            } catch (err) {
                console.error("Failed to remove from DB wishlist", err);
                // Revert
                setWishlist(previousWishlist);
            }
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.some((item) => (item.id || item._id) === productId);
    };

    const toggleWishlist = (product) => {
        const pId = product.id || product._id;
        if (isInWishlist(pId)) {
            removeFromWishlist(pId);
            return false; // Removed
        } else {
            addToWishlist(product);
            return true; // Added
        }
    };

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
