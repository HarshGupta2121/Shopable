"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { processCommand } from '../services/aiAssistant';

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [lastCommandId, setLastCommandId] = useState(0);
  const [lastResponse, setLastResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);

  // Use refs to access latest state/functions inside the immutable useEffect closure
  const router = useRouter();
  const pathname = usePathname();
  const latestHandlerRef = useRef(null);
  const debounceRef = useRef(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      shouldListenRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [language, stopSpeaking]);



  // Keep latestHandlerRef up to date with the latest env (router, pathname, etc)
  useEffect(() => {
    latestHandlerRef.current = async (text) => {
      setLastCommand(text);
      setLastCommandId(prev => prev + 1);
      console.log("Command processing:", text);

      const lowerText = text.toLowerCase();
      // Global commands
      // specific handling for "sign in" and "sign up"
      if (lowerText.includes('sign in') || lowerText.includes('log in') || lowerText.includes('login')) {
        speak("Navigating to sign in page.");
        router.push('/signin');
        return;
      }

      if (lowerText.includes('sign up') || lowerText.includes('create account') || lowerText.includes('create my account') || lowerText.includes('register')) {
        speak("Navigating to sign up page.");
        router.push('/signup');
        return;
      }

      if (lowerText.includes('my account') || lowerText.includes('profile') || lowerText.includes('account details')) {
        speak("Opening your account details.");
        router.push('/account');
        return;
      }

      // Explicit stop commands
      if (lowerText.includes('stop') && (lowerText.includes('listening') || lowerText.includes('voice'))) {
        speak("Stopping voice assistant.");
        stopListening();
        return;
      }
      if (lowerText.includes('stop') || lowerText.includes('quiet')) {
        stopSpeaking();
        return;
      }
      if (lowerText.includes('go home')) {
        router.push('/');
        speak("Going home.");
        return;
      }
      if (lowerText.includes('turn off voice assistant') || lowerText.includes('voice assistant band')) {
        speak("Turning off voice assistant. Goodbye.");
        stopListening();
        return;
      }

      // AI Processing
      const result = await processCommand(text, router, pathname, language);

      // Handle Object Response (Action + Text)
      if (typeof result === 'object' && result !== null) {
        if (result.text) {
          setLastResponse(result.text);
          speak(result.text);
        }
        if (result.action) {
          console.log("Dispatching Voice Action:", result.action);
          window.dispatchEvent(new CustomEvent(result.action));
        }
      }
      // Handle String Response (Legacy/Simple)
      else if (typeof result === 'string') {
        setLastResponse(result);
        speak(result);
      }
    };
  }, [router, pathname, language, speak, stopListening, stopSpeaking]); // Update whenever dependencies change

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true; // Enabled for faster response
        recognition.lang = language;

        recognition.onstart = () => {
          console.log("Voice recognition started");
          setIsListening(true);
          shouldListenRef.current = true;
        };

        recognition.onend = () => {
          console.log("Voice recognition ended. Should restart?", shouldListenRef.current);
          setIsListening(false);
          if (shouldListenRef.current) {
            // Attempt restart
            try {
              recognition.start();
            } catch (e) {
              console.warn("Restart failed, retrying in 1s...", e);
              setTimeout(() => {
                if (shouldListenRef.current) {
                  try { recognition.start(); } catch (err) { console.error("Retry failed", err); }
                }
              }, 1000);
            }
          }
        };

        recognition.onerror = (event) => {
          if (event.error === 'no-speech') {
            return;
          }
          console.error("Speech recognition error:", event.error);

          if (event.error === 'audio-capture') {
            shouldListenRef.current = false;
            setIsListening(false);
            console.warn("Microphone not found or busy.");
          }

          if (event.error === 'not-allowed') {
            shouldListenRef.current = false;
            setIsListening(false);
          }
        };

        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const result = event.results[current];
          const transcriptText = result[0].transcript;
          const isFinal = result.isFinal;

          setTranscript(transcriptText);

          if (transcriptText.trim()) {
            if (debounceRef.current) clearTimeout(debounceRef.current);

            // Execute immediately if final, or wait 500ms if interim to catch pause
            const delay = isFinal ? 0 : 800;

            debounceRef.current = setTimeout(() => {
              if (latestHandlerRef.current) {
                // Only process matches that seem like complete commands or if final
                if (transcriptText.length > 3) {
                  latestHandlerRef.current(transcriptText);
                }
              }
            }, delay);
          }
        };

        recognitionRef.current = recognition;

        return () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          recognition.onend = null;
          recognition.stop();
        };

      } else {
        console.warn("Speech Recognition not supported in this browser.");
        setIsSupported(false);
      }
    }
  }, [language]); // Only re-create if language changes.

  const changeLanguage = (lang) => {
    setLanguage(lang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        shouldListenRef.current = true;
        recognitionRef.current.start();
      } catch (e) {
        if (e.name === 'InvalidStateError') {
          console.warn("Recognition already started, ignoring.");
        } else {
          console.error("Error starting recognition:", e);
        }
      }
    }
  };


  return (
    <VoiceContext.Provider value={{
      isListening,
      isSupported,
      transcript,
      lastCommand,
      lastCommandId,
      lastResponse,
      isSpeaking,
      startListening,
      stopListening,
      speak,
      stopSpeaking,
      language,
      changeLanguage
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
