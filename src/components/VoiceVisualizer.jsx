"use client";

import { useVoice } from "@/context/VoiceContext";
import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceVisualizer() {
    const { isListening, transcript, lastCommand } = useVoice();
    const [bars, setBars] = useState(new Array(5).fill(10));

    useEffect(() => {
        if (!isListening) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBars(new Array(5).fill(10));
            return;
        }

        const interval = setInterval(() => {
            setBars(prev => prev.map(() => 10 + Math.random() * 30));
        }, 100);

        return () => clearInterval(interval);
    }, [isListening]);

    if (!isListening) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Transcript Bubble */}
            {transcript && (
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-primary/20 mb-2 max-w-sm text-center">
                    <p className="text-sm font-medium text-gray-800">
                        {transcript}
                        <span className="animate-pulse">|</span>
                    </p>
                </div>
            )}

            {/* Visualizer */}
            <div className="flex items-center gap-1 h-12 px-6 py-2 bg-black/80 backdrop-blur-xl rounded-full shadow-2xl border border-white/10">
                <Mic className="w-4 h-4 text-primary mr-2 animate-pulse" />
                <div className="flex items-center gap-1 h-full">
                    {bars.map((height, i) => (
                        <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-primary to-purple-400 rounded-full transition-all duration-100 ease-in-out"
                            style={{ height: `${height}px` }}
                        />
                    ))}
                </div>
                <span className="text-xs font-semibold text-white ml-3 tracking-wide">LISTENING</span>
            </div>
        </div>
    );
}
