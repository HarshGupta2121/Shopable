/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SearchBar from './SearchBar';
import { useGesture } from '../context/GestureContext';
import { Mic, MicOff, ShoppingCart, Search, User, Globe, LogIn, UserPlus, Heart, Hand, Sun, Moon, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';

const Layout = ({ children }) => {
    const { isListening, startListening, stopListening, transcript, lastCommand, isSpeaking, language, changeLanguage, isSupported } = useVoice();
    const { isAuthenticated } = useAuth();
    const { cart } = useCart();
    const { isGestureEnabled, toggleGestures } = useGesture();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground p-4 z-50">
                Skip to content
            </a>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/images/shopable_logo.jpg" alt="Shopable" className="h-10 w-auto rounded-md" />
                        <span className="text-xl font-bold tracking-tight hidden sm:block">Shopable</span>
                    </Link>

                    {/* Search Bar - Centered */}
                    <div className="hidden md:flex flex-1 max-w-md mx-auto relative">
                        <SearchBar />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
                            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Gesture Toggle */}
                        <button
                            onClick={toggleGestures}
                            className={`p-2 rounded-full transition-colors ${isGestureEnabled ? 'bg-primary text-white' : 'hover:bg-secondary text-muted-foreground'}`}
                            title={isGestureEnabled ? "Disable Hand Gestures" : "Enable Hand Gestures"}
                        >
                            <Hand className="w-5 h-5" />
                        </button>

                        {/* Language Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
                                aria-label="Select Language"
                            >
                                <Globe className="w-5 h-5" />
                            </button>

                            {showLangMenu && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-scaleIn origin-top-right">
                                    {[
                                        { code: 'en-US', label: 'English (US)' },
                                        { code: 'hi-IN', label: 'Hindi (India)' },
                                    ].map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                changeLanguage(lang.code);
                                                setShowLangMenu(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors ${language === lang.code ? 'font-bold text-primary' : 'text-foreground'}`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {isAuthenticated ? (
                            <Link href="/account" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                <User className="w-5 h-5" />
                                <span className="hidden sm:inline">Account</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href="/signin" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sign In</span>
                                </Link>
                                <Link href="/signup" className="flex items-center gap-2 text-sm font-medium btn btn-primary px-4 py-2 h-9 rounded-full transition-colors">
                                    <UserPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sign Up</span>
                                </Link>
                            </div>
                        )}

                        {isAuthenticated && (
                            <Link href="/admin" className="p-2 hover:bg-secondary rounded-full transition-colors flex items-center justify-center text-muted-foreground hover:text-primary" aria-label="Admin Dashboard">
                                <Settings className="w-5 h-5" />
                            </Link>
                        )}

                        <Link href="/wishlist" className="relative p-2 hover:bg-secondary rounded-full transition-colors group" aria-label="Wishlist">
                            <Heart className="w-5 h-5 group-hover:text-red-500 transition-colors" />
                        </Link>

                        <Link href="/cart" className="relative p-2 hover:bg-secondary rounded-full transition-colors" aria-label="Cart">
                            <ShoppingCart className="w-5 h-5" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-background">
                                    {cart.reduce((stat, item) => stat + item.quantity, 0)}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Voice Feedback Bar - Subtle */}
                {(transcript || lastCommand || isSpeaking) && (
                    <div className="bg-primary/5 border-b border-primary/10 py-1">
                        <div className="container text-center text-xs font-medium truncate">
                            {isSpeaking ? (
                                <span className="text-primary">Assistant speaking...</span>
                            ) : (
                                <span className="text-muted-foreground">
                                    {transcript ? `Hearing: "${transcript}"` : `Last command: "${lastCommand}"`}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <main id="main-content" className="flex-1">
                {children}
            </main>

            <footer className="bg-secondary py-12 mt-auto border-t border-border">
                <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">Shopable</h3>
                        <p className="text-sm text-muted-foreground">Refined essentials for modern living.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Shop</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/shop">All Products</Link></li>
                            <li><Link href="/shop?cat=apparel">Apparel</Link></li>
                            <li><Link href="/shop?cat=tech">Tech</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/help">Help Center</Link></li>
                            <li><Link href="/returns">Returns</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Newsletter</h4>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Enter your email" className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm" />
                            <button className="btn btn-primary text-sm px-4">Subscribe</button>
                        </div>
                    </div>
                </div>
            </footer>
            {/* Floating Voice Button */}
            {isSupported && (
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`fixed bottom-6 left-6 p-4 rounded-full shadow-lg z-50 transition-all duration-300 hover:scale-110 ${isListening
                        ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-300'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                    aria-label={isListening ? "Stop listening" : "Start voice assistant"}
                >
                    {isListening ? <Mic className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
            )}
        </div>
    );
};

export default Layout;
