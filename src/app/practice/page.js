"use client";

import React from 'react';
import AITutor from '@/components/AITutor';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PracticePage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Navigation */}
                <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <Link href="/" className="font-medium">Back to Home</Link>
                </div>

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">English Practice Studio</h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                        Hone your speaking skills with our AI Tutor. Select a topic or start a free conversation.
                    </p>
                </div>

                {/* Main Interface */}
                <AITutor />

                {/* Instructions / Footer */}
                <div className="grid md:grid-cols-3 gap-4 text-center text-sm text-gray-500 mt-8">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-gray-200 mb-1">1. Tap Mic</h3>
                        <p>Click the microphone button to start listening.</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-gray-200 mb-1">2. Speak Clearly</h3>
                        <p>Ask questions or practice introductions.</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-gray-200 mb-1">3. Get Feedback</h3>
                        <p>The AI will respond to keep the conversation going.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
