"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useGesture } from '@/context/GestureContext';

export default function VirtualCursor() {
    const { isGestureEnabled, status, cursor } = useGesture();
    const [lastClickTime, setLastClickTime] = useState(0);

    const wasClicking = useRef(false);

    // Handle Clicking
    useEffect(() => {
        if (!isGestureEnabled || status !== 'active') return;
        
        // Detect a fresh click (transition from not clicking to clicking)
        if (cursor.isClicking && !wasClicking.current) {
            const now = Date.now();
            if (now - lastClickTime > 400) { // Keep a small debounce to prevent accidental double pinches
                const element = document.elementFromPoint(cursor.x, cursor.y);
                if (element) {
                    console.log("Virtual Click on:", element);
                    const interactive = element.closest('button, a, input, [role="button"], [tabindex]');
                    if (interactive) {
                        interactive.click();
                        interactive.focus();
                    } else {
                        element.click();
                    }
                }
                setLastClickTime(now);
            }
        }
        
        // Update the previous state for the next render
        wasClicking.current = cursor.isClicking;

    }, [cursor.isClicking, cursor.x, cursor.y, lastClickTime, isGestureEnabled, status]);

    if (!isGestureEnabled || status !== 'active') return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                transform: `translate(${cursor.x}px, ${cursor.y}px)`,
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: `3px solid ${cursor.isClicking ? '#22c55e' : '#ef4444'}`, // Green when clicking, Red otherwise
                backgroundColor: cursor.isClicking ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.1)',
                pointerEvents: 'none', // Critical: Let clicks pass through! But wait, we are manually clicking.
                // Actually, we use elementFromPoint, so we MUST ignore this cursor div.
                zIndex: 9999,
                transition: 'transform 0.05s linear, border-color 0.2s',
                marginTop: '-15px', // Center pointer
                marginLeft: '-15px',
                boxShadow: '0 0 10px rgba(0,0,0,0.3)'
            }}
        >
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-[10px] bg-black/50 text-white px-1 rounded whitespace-nowrap">
                {cursor.pinchDistance}px
            </span>
        </div>
    );
}
