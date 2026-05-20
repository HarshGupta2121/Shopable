/* eslint-disable @next/next/no-img-element */
"use client";

import React from 'react';
import { useCart } from '@/context/CartContext';
import { useVoice } from '@/context/VoiceContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Minus, Plus } from 'lucide-react';

export default function Cart() {
    const { cart, removeFromCart, clearCart, total, updateQuantity } = useCart();
    const { speak } = useVoice();

    const router = useRouter();

    // Voice Command Listeners
    React.useEffect(() => {
        const handleInc = () => {
            if (cart.length > 0) {
                const item = cart[0]; // Target first item for now
                updateQuantity(item.cartItemId, item.quantity + 1);
                speak(`Increased quantity for ${item.name}`);
            } else {
                speak("Cart is empty.");
            }
        };

        const handleDec = () => {
            if (cart.length > 0) {
                const item = cart[0];
                if (item.quantity > 1) {
                    updateQuantity(item.cartItemId, item.quantity - 1);
                    speak(`Decreased quantity for ${item.name}`);
                } else {
                    speak("Quantity is already at minimum. Say 'remove this' to delete.");
                }
            }
        };

        const handleClear = () => {
            if (cart.length > 0) {
                clearCart();
                speak("Cart cleared.");
            }
        };

        window.addEventListener('TRIGGER_INC_QTY', handleInc);
        window.addEventListener('TRIGGER_DEC_QTY', handleDec);
        // window.addEventListener('TRIGGER_CLEAR_CART', handleClear); // If we added this action

        return () => {
            window.removeEventListener('TRIGGER_INC_QTY', handleInc);
            window.removeEventListener('TRIGGER_DEC_QTY', handleDec);
        };
    }, [cart, updateQuantity, speak, clearCart]);

    const handleCheckout = () => {
        if (cart.length === 0) {
            speak("Your cart is empty.");
            return;
        }
        speak(`Proceeding to checkout. Your total is ₹${total.toFixed(2)}.`);
        router.push('/checkout');
    };

    const handleRemove = (item) => {
        removeFromCart(item.cartItemId);
        speak(`Removed ${item.name} from cart.`);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

            {cart.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-xl text-muted-foreground mb-6">Your cart is empty.</p>
                    <Link href="/shop" className="btn btn-primary">
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-4">
                        {cart.map((item) => (
                            <div key={item.cartItemId} className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card">
                                <div className="w-20 h-20 bg-white rounded overflow-hidden flex items-center justify-center relative border border-gray-200">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold">{item.name}</h3>
                                    <p className="text-muted-foreground">₹{item.price}</p>

                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                            className="p-1 rounded-md hover:bg-secondary border border-border"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-medium w-8 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => {
                                                updateQuantity(item.cartItemId, item.quantity + 1);
                                                speak("Quantity increased");
                                            }}
                                            className="p-1 rounded-md hover:bg-secondary border border-border"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {item.selectedOptions && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {item.selectedOptions.size && `Size: ${item.selectedOptions.size} `}
                                            {item.selectedOptions.color && `Color: ${item.selectedOptions.color}`}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleRemove(item)}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-full"
                                    aria-label={`Remove ${item.name} from cart`}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="md:col-span-1">
                        <div className="p-6 border border-border rounded-lg bg-card sticky top-24">
                            <h2 className="text-xl font-bold mb-4">Summary</h2>
                            <div className="flex justify-between mb-2">
                                <span>Subtotal</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-4 text-muted-foreground">
                                <span>Tax (Est.)</span>
                                <span>₹0.00</span>
                            </div>
                            <div className="border-t border-border my-4 pt-4 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full btn btn-primary mb-4"
                            >
                                Checkout
                            </button>

                            <button
                                onClick={clearCart}
                                className="w-full btn btn-secondary text-sm"
                            >
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
