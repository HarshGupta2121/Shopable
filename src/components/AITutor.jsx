"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useVoice } from '@/context/VoiceContext';
import { Mic, MicOff, Send, Bot, User, Volume2, StopCircle } from 'lucide-react';
import { processTutorCommand } from '@/services/aiTutorService';

export default function AITutor() {
    const {
        isListening,
        startListening,
        stopListening,
        transcript,
        lastCommand,
        lastResponse,
        isSpeaking,
        stopSpeaking,
        speak,
        language
    } = useVoice();

    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I am your AI Tutor. I can help you practice English conversation. Pick a topic or just start talking!", sender: 'ai' }
    ]);
    const [textInput, setTextInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // To avoid duplicate messages due to strict mode or rapid updates
    const lastCommandRef = useRef(lastCommand);
    const lastResponseRef = useRef(lastResponse);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    // Keep global history context updated for the API
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.tutorHistory = messages;
        }
    }, [messages]);

    // Track User Spoken Commands
    useEffect(() => {
        if (lastCommand && lastCommand !== lastCommandRef.current) {
            setMessages(prev => [...prev, { id: Date.now(), text: lastCommand, sender: 'user' }]);
            lastCommandRef.current = lastCommand;
        }
    }, [lastCommand]);

    // Track AI Spoken Responses
    useEffect(() => {
        if (lastResponse && lastResponse !== lastResponseRef.current) {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: lastResponse, sender: 'ai' }]);
            lastResponseRef.current = lastResponse;
            setIsThinking(false); // Stop thinking if we got a response via voice
        }
    }, [lastResponse]);

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleSendText = async (textToSend) => {
        const text = textToSend || textInput;
        if (!text.trim()) return;

        // Stop listening if we were listening
        if (isListening) stopListening();

        const userMsg = { id: Date.now(), text: text, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setTextInput('');
        setIsThinking(true);

        try {
            // Update history ref immediately so processTutorCommand uses it
            if (typeof window !== 'undefined') {
                window.tutorHistory = [...messages, userMsg];
            }

            const response = await processTutorCommand(text, language);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: 'ai' }]);
            
            // Speak the response out loud
            speak(response);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sorry, I encountered an error. Please try again.", sender: 'ai' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const suggestions = [
        "Introduce myself",
        "Order food at a restaurant",
        "Talk about travel",
        "Is my grammar correct?"
    ];

    const handleSuggestion = (text) => {
        handleSendText(text);
    };

    return (
        <div className="flex flex-col h-[600px] border dark:border-slate-800 rounded-xl overflow-hidden bg-background shadow-lg relative transition-colors duration-300">
            {/* Custom Keyframe Animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes tutor-wave {
                    0%, 100% { transform: scaleY(0.3); }
                    50% { transform: scaleY(1.3); }
                }
                @keyframes tutor-speech {
                    0%, 100% { transform: scaleY(0.4); }
                    50% { transform: scaleY(1.6); }
                }
                .animate-wave {
                    animation: tutor-wave 1s ease-in-out infinite;
                    transform-origin: center;
                }
                .animate-speech {
                    animation: tutor-speech 0.8s ease-in-out infinite;
                    transform-origin: center;
                }
            `}} />

            {/* Header */}
            <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center transition-colors duration-300 shadow-md">
                <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 animate-pulse" />
                    <div>
                        <h2 className="font-bold text-lg leading-tight">AI Tutor</h2>
                        <p className="text-[10px] opacity-75">Interactive English practice partner</p>
                    </div>
                </div>

                {/* Animated Waveform */}
                {(isListening || isSpeaking || isThinking) && (
                    <div className="flex items-center gap-1.5 h-6 px-3 bg-primary-foreground/10 rounded-full">
                        {[...Array(6)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-0.5 bg-white rounded-full transition-all duration-300 ${
                                    isThinking ? 'animate-pulse h-1.5' : 
                                    isListening ? 'animate-wave h-4' : 
                                    'animate-speech h-4'
                                }`}
                                style={{
                                    animationDelay: `${i * 0.12}s`,
                                    height: isThinking ? '6px' : '16px'
                                }}
                            />
                        ))}
                    </div>
                )}

                {isSpeaking && (
                    <button 
                        onClick={stopSpeaking} 
                        className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors ml-2" 
                        title="Stop speaking"
                    >
                        <StopCircle className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-300">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-start gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm ${
                                msg.sender === 'user' 
                                    ? 'bg-primary/20 text-primary dark:bg-teal-500/20 dark:text-teal-400' 
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            
                            <div className={`p-3 rounded-2xl ${
                                msg.sender === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
                            }`}>
                                <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {isThinking && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 max-w-[85%]">
                            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                                <Bot className="w-4 h-4 text-slate-700 dark:text-slate-300 animate-spin" />
                            </div>
                            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {isListening && transcript && (
                    <div className="flex justify-end">
                        <div className="max-w-[80%] p-3 rounded-2xl bg-primary/20 text-primary dark:text-teal-400 rounded-br-none border border-primary/20 dark:border-teal-500/20 italic animate-pulse">
                            <p>{transcript}...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <div className="p-2.5 bg-background border-t border-border overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2 transition-colors duration-300">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSuggestion(s)}
                        disabled={isThinking}
                        className="px-3.5 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full hover:bg-secondary/80 transition-colors border border-border disabled:opacity-50 shrink-0"
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Controls */}
            <div className="p-4 bg-background border-t border-border flex flex-col sm:flex-row items-center gap-3 transition-colors duration-300">
                <div className="flex-1 w-full flex items-center gap-2">
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                        placeholder={isListening ? "Listening to your voice..." : "Type a message to practice..."}
                        disabled={isThinking}
                        className="flex-1 min-w-0 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                        onClick={() => handleSendText()}
                        disabled={isThinking || !textInput.trim()}
                        className="btn btn-primary p-2.5 rounded-lg flex items-center justify-center shadow disabled:opacity-50 transition-all shrink-0"
                        title="Send message"
                    >
                        <Send className="w-4.5 h-4.5" />
                    </button>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={toggleListening}
                        disabled={isThinking}
                        className={`h-11 w-11 rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-105 ${
                            isListening
                                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        } disabled:opacity-50`}
                        title={isListening ? "Stop listening" : "Start speaking"}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
