"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { products } from '@/data/products';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('voice-shop-cart');
        if (savedCart) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to local storage on change
    useEffect(() => {
        localStorage.setItem('voice-shop-cart', JSON.stringify(cart));
    }, [cart]);

    // Global Voice Command Listener for adding cheapest item
    useEffect(() => {
        const handleAddCheapest = () => {
            if (products.length > 0) {
                // Find cheapest product
                const cheapestProduct = [...products].sort((a,b) => a.price - b.price)[0];
                if (cheapestProduct) {
                    addToCart(cheapestProduct);
                }
            }
        };

        window.addEventListener('TRIGGER_ADD_CHEAPEST', handleAddCheapest);
        return () => window.removeEventListener('TRIGGER_ADD_CHEAPEST', handleAddCheapest);
    }, []);

    const addToCart = (product, options = {}) => {
        setCart((prev) => {
            // Create a unique ID for the cart item based on product ID and selected options
            const cartItemId = product.id +
                (options.size ? `-${options.size}` : '') +
                (options.color ? `-${options.color}` : '');

            const existing = prev.find((item) => item.cartItemId === cartItemId);

            if (existing) {
                return prev.map((item) =>
                    item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            return [...prev, {
                ...product,
                cartItemId,
                selectedOptions: options,
                quantity: 1
            }];
        });
    };

    const updateQuantity = (cartItemId, quantity) => {
        if (quantity < 1) return;
        setCart((prev) =>
            prev.map((item) =>
                item.cartItemId === cartItemId ? { ...item, quantity } : item
            )
        );
    };

    const removeFromCart = (cartItemId) => {
        setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
