"use client";

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', isVisible, onClose }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShow(true);
        } else {
            // Small delay to allow exit animation
            const timer = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!show && !isVisible) return null;

    const bgColors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-amber-500'
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
        warning: <AlertCircle className="w-5 h-5" />
    };

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 flex items-center md:min-w-[300px] p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-in-out ${bgColors[type] || bgColors.info} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
            role="alert"
        >
            <div className="mr-3">
                {icons[type] || icons.info}
            </div>
            <div className="flex-1 mr-2 font-medium">
                {message}
            </div>
            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
