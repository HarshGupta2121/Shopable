"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useVoice } from '@/context/VoiceContext';
import { Mic, MicOff, Send, Bot, User, Volume2, StopCircle } from 'lucide-react';

export default function AITutor() {
    const {
        isListening,
        startListening,
        stopListening,
        transcript,
        lastCommand,
        lastResponse,
        isSpeaking,
        stopSpeaking
    } = useVoice();

    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I am your AI Tutor. I can help you practice English conversation. Pick a topic or just start talking!", sender: 'ai' }
    ]);

    // To avoid duplicate messages due to strict mode or rapid updates
    const lastCommandRef = useRef(lastCommand);
    const lastResponseRef = useRef(lastResponse);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Track User Commands
    useEffect(() => {
        if (lastCommand && lastCommand !== lastCommandRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMessages(prev => [...prev, { id: Date.now(), text: lastCommand, sender: 'user' }]);
            lastCommandRef.current = lastCommand;
        }
    }, [lastCommand]);

    // Track AI Responses
    useEffect(() => {
        if (lastResponse && lastResponse !== lastResponseRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMessages(prev => [...prev, { id: Date.now() + 1, text: lastResponse, sender: 'ai' }]);
            lastResponseRef.current = lastResponse;
        }
    }, [lastResponse]);

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const suggestions = [
        "Introduce myself",
        "Order food at a restaurant",
        "Talk about travel",
        "Is my grammar correct?"
    ];

    const handleSuggestion = (text) => {
        // Since we can't easily injection text into the voice stream as if spoken,
        // we might just encourage the user to say it, or we could potentially
        // expose a manual 'process' method in VoiceContext later.
        // For now, let's just show it as a hint.
        alert(`Say: "${text}"`);
    };

    return (
        <div className="flex flex-col h-[600px] border rounded-xl overflow-hidden bg-background shadow-lg">

            {/* Header */}
            <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6" />
                    <h2 className="font-bold text-lg">AI Tutor</h2>
                </div>
                {isSpeaking && (
                    <button onClick={stopSpeaking} className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors" title="Stop speaking">
                        <StopCircle className="w-5 h-5 animate-pulse" />
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                            }`}>
                            <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isListening && transcript && (
                    <div className="flex justify-end">
                        <div className="max-w-[80%] p-3 rounded-2xl bg-primary/50 text-primary-foreground/70 rounded-br-none italic blink">
                            <p>{transcript}...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <div className="p-2 bg-background border-t border-border overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSuggestion(s)}
                        className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-full hover:bg-secondary/80 transition-colors border border-border"
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Controls */}
            <div className="p-4 bg-background border-t border-border flex items-center justify-center gap-4">
                <div className="text-xs text-muted-foreground absolute left-4 hidden md:block">
                    Status: {isListening ? 'Listening...' : 'Idle'}
                </div>

                <button
                    onClick={toggleListening}
                    className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 ${isListening
                            ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                >
                    {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
            </div>
        </div>
    );
}
