"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVoice } from '@/context/VoiceContext';
import { useAuth } from '@/context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function SignUp() {
    const { speak, lastCommand, lastCommandId } = useVoice();
    const { login, register, googleLogin } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        speak("Creating your account.");

        try {
            await register(name, email, password);
            speak("Account created. Please log in.");
            router.push('/signin');
        } catch (err) {
            console.error(err);
            speak("Registration failed.");
            alert(err.message);
        }
    }, [name, email, password, speak, register, router]);

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await googleLogin(credentialResponse.credential);
            router.push('/account'); 
        } catch (err) {
            console.error(err);
            speak("Google sign in failed.");
            alert(err.message);
        }
    };

    useEffect(() => {
        if (!lastCommand) return;

        const lowerCommand = lastCommand.toLowerCase();

        // Name
        const nameMatch = lowerCommand.match(/(?:my|set|enter)?\s*name\s*(?:is|to)?\s+(.+)/i);
        if (nameMatch && nameMatch[1]) {
            const cleanName = nameMatch[1].replace(/[.,]$/, '');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName(cleanName);
            speak(`Name set to ${cleanName}`);
        }

        // Email
        const emailMatch = lowerCommand.match(/(?:my|set|enter)?\s*email\s*(?:is|to)?\s+(.+)/i);
        if (emailMatch && emailMatch[1]) {
            let cleanEmail = emailMatch[1]
                .replace(/\s+at\s+/g, '@')
                .replace(/\s+dot\s+/g, '.')
                .replace(/[.,]$/, '')
                .replace(/\s+/g, '')
                .toLowerCase();

            setEmail(cleanEmail);
            speak(`Email set to ${cleanEmail}`);
        }

        // Password
        const passwordMatch = lowerCommand.match(/(?:my|set|enter)?\s*password\s*(?:is|to)?\s+(.+)/i);
        if (passwordMatch && passwordMatch[1]) {
            let cleanPassword = passwordMatch[1]
                .replace(/[.,]$/, '');

            setPassword(cleanPassword);
            speak("Password set.");
        }

        // Submit
        if (lowerCommand.includes('create account') || lowerCommand.includes('sign up') || lowerCommand.includes('submit')) {
            if (name && email && password) {
                handleSubmit({ preventDefault: () => { } });
            } else {
                speak("Please provide your name, email, and password first.");
            }
        }
    }, [lastCommandId, name, email, password, lastCommand, speak, handleSubmit]);

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-2xl border border-border shadow-sm">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
                    <p className="text-muted-foreground">Enter your information to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                    </div>

                    <button type="submit" className="w-full btn btn-primary">
                        Sign Up
                    </button>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-center flex-col items-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                console.log('Login Failed');
                                speak("Google login was unsuccessful.");
                            }}
                        />
                    </div>
                </form>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <Link href="/signin" className="font-semibold text-primary hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
