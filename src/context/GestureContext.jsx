"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs-backend-webgl';

// Configuration
const SMOOTHING_FACTOR = 0.35; // increased for faster response
const CLICK_THRESHOLD = 45; // reduced so you have to pinch closer to trigger
const SENSITIVITY = 1.8; // reduced to prevent it flying off screen too easily

const GestureContext = createContext();

export const GestureProvider = ({ children }) => {
    const [isGestureEnabled, setIsGestureEnabled] = useState(false);
    const [status, setStatus] = useState('offline'); // offline | loading | active | error
    const [cursor, setCursor] = useState({ x: 0, y: 0, isClicking: false, pinchDistance: 0 });

    // Refs for persistent values without re-renders
    const videoRef = useRef(null);
    const modelRef = useRef(null);
    const requestRef = useRef(null);
    const previousCursor = useRef({ x: 0, y: 0 });

    // Initialize Webcam
    const setupCamera = async () => {
        if (!videoRef.current) return null;

        // If stream already exists, reuse it
        if (videoRef.current.srcObject) return videoRef.current;

        try {
            console.log("Requesting camera access...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            console.log("Camera access granted.");

            videoRef.current.srcObject = stream;

            return new Promise((resolve, reject) => {
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play().then(() => resolve(videoRef.current)).catch(e => {
                        console.error("Error playing video:", e);
                        // Try to resolve anyway if play fails (e.g. autoplay policy), though unlikely for muted video
                        resolve(videoRef.current);
                    });
                };
                // Fallback timeout if metadata doesn't load
                setTimeout(() => {
                    if (videoRef.current.videoWidth > 0) {
                        resolve(videoRef.current);
                    } else {
                        // Don't reject, just try to proceed or log
                        console.warn("Metadata load timeout, proceeding implicitly.");
                        videoRef.current.play().then(() => resolve(videoRef.current)).catch(resolve);
                    }
                }, 3000);
            });
        } catch (err) {
            console.warn("Camera setup failed:", err.name, err.message);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert("Camera permission denied. Please enable camera access to use hand gestures.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                alert("No camera found. Please connect a webcam.");
            } else if (err.name === 'AbortError') {
                console.warn("Camera setup aborted or timed out.");
            }
            setStatus('error');
            throw err;
        }
    };

    // Load Model
    const loadModel = async () => {
        try {
            console.log("Loading Handpose model...");
            const model = await handpose.load();
            modelRef.current = model;
            console.log("Handpose model loaded.");
        } catch (err) {
            console.error("Failed to load model:", err);
            setStatus('error');
        }
    };

    // Main Detection Loop
    const detect = async () => {
        if (!isGestureEnabled || !modelRef.current || !videoRef.current) return;

        // Check if video is ready
        if (videoRef.current.readyState !== 4) {
            requestRef.current = requestAnimationFrame(detect);
            return;
        }

        try {
            const predictions = await modelRef.current.estimateHands(videoRef.current);

            if (predictions.length > 0) {
                const hand = predictions[0];
                const landmarks = hand.landmarks;

                // Index Finger Tip (Index 8) for pointing
                // Thumb Tip (Index 4) for clicking check
                const [indexX, indexY] = landmarks[8];
                const [thumbX, thumbY] = landmarks[4];

                // --- 1. Coordinate Mapping ---
                // Mirror the X axis for natural feel
                const videoWidth = videoRef.current.videoWidth;
                const videoHeight = videoRef.current.videoHeight;

                // Normalized coordinates (0 to 1)
                const normX = 1 - (indexX / videoWidth); // Mirror
                const normY = indexY / videoHeight;

                // Map to Screen (with sensitivity multiplier to reach corners easily)
                // Center the sensitive area: (norm - 0.5) * sensitivity + 0.5
                const screenX = Math.max(0, Math.min(window.innerWidth, (normX - 0.5) * SENSITIVITY * window.innerWidth + window.innerWidth / 2));
                const screenY = Math.max(0, Math.min(window.innerHeight, (normY - 0.5) * SENSITIVITY * window.innerHeight + window.innerHeight / 2));

                // --- 2. Smoothing ---
                // LERP: current = prev + (target - prev) * factor
                const smoothX = previousCursor.current.x + (screenX - previousCursor.current.x) * SMOOTHING_FACTOR;
                const smoothY = previousCursor.current.y + (screenY - previousCursor.current.y) * SMOOTHING_FACTOR;

                previousCursor.current = { x: smoothX, y: smoothY };

                // --- 3. Click Detection (Pinch) ---
                // Simple Euclidean distance between thumb and index (2D is enough for this)
                const dist = Math.sqrt(Math.pow(indexX - thumbX, 2) + Math.pow(indexY - thumbY, 2));
                const isClicking = dist < CLICK_THRESHOLD;

                setCursor({ x: smoothX, y: smoothY, isClicking, pinchDistance: Math.round(dist) });
            }
        } catch (err) {
            console.warn("Detection error:", err);
        }

        requestRef.current = requestAnimationFrame(detect);
    };

    // Toggle Function
    const toggleGestures = () => {
        setIsGestureEnabled(prev => !prev);
    };

    // Lifecycle Management
    useEffect(() => {
        let active = true;

        const startSystem = async () => {
            if (isGestureEnabled && status !== 'active') {
                setStatus('loading');
                try {
                    await setupCamera();
                    if (!modelRef.current) await loadModel();
                    setStatus('active');
                    detect();
                } catch (e) {
                    console.warn("Failed to start gesture system", e);
                    setStatus('error');
                    setIsGestureEnabled(false);
                }
            } else if (!isGestureEnabled) {
                // Cleanup
                if (videoRef.current && videoRef.current.srcObject) {
                    const tracks = videoRef.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
                if (requestRef.current) {
                    cancelAnimationFrame(requestRef.current);
                }
                setStatus('offline');
            }
        };

        startSystem();

        return () => {
            active = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isGestureEnabled]);

    // Restart loop if it stops but enabled (e.g. after loading)
    useEffect(() => {
        if (isGestureEnabled && status === 'active') {
            detect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, isGestureEnabled]);


    return (
        <GestureContext.Provider value={{ isGestureEnabled, toggleGestures, status, cursor }}>
            {children}
            {/* Hidden Video Element for Processing */}
            <video
                ref={videoRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    opacity: 0, // Hide it, we only need data. Optionally show small preview.
                    pointerEvents: 'none',
                    zIndex: -1,
                    width: 640,
                    height: 480
                }}
                playsInline
                muted
                autoPlay
            />
        </GestureContext.Provider>
    );
};

export const useGesture = () => useContext(GestureContext);
