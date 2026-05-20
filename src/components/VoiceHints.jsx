"use client";

import { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

const hints = [
    "Try saying 'Show trending products'",
    "Try saying 'Dark mode on'",
    "Try saying 'Go to cart'",
    "Try saying 'Search for watches'",
    "Try saying 'Open offers'",
    "Try saying 'Track my order'",
    "Try saying 'Help'",
    "Try saying 'Show new arrivals'"
];

export default function VoiceHints() {
    const [index, setIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % hints.length);
                setIsVisible(true);
            }, 500); // Wait for fade out before changing text
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-8 right-8 z-[9999] pointer-events-none">
            <div className={`bg-primary text-primary-foreground backdrop-blur-md px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-500 transform border border-white/20 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="bg-white/20 p-2 rounded-full animate-pulse shadow-inner">
                    <Mic className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold whitespace-nowrap drop-shadow-sm">
                    {hints[index]}
                </p>
            </div>
        </div>
    );
}
