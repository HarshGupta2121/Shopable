import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(request) {
    try {
        const { message, history, language } = await request.json();

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        // Construct the prompt context based on language and role
        let systemInstruction = "You are a helpful, patient, and encouraging English language tutor. Your goal is to help the user practice English conversation. Correct their grammar gently if needed, but focus on keeping the conversation flowing. Keep your responses concise (1-3 sentences) suitable for voice interaction.";
        
        if (language === 'hi-IN') {
             systemInstruction += " The user prefers Hindi explanation occasionally, but encourage them to speak English. You can use Hinglish for clarity.";
        }

        // Format history for Gemini
        const contents = [];
        
        if (history && Array.isArray(history)) {
            // Keep only the last 10 messages to avoid context bloat
            const recentHistory = history.slice(-10);
            recentHistory.forEach(msg => {
                contents.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            });
        }
 
        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }] 
        });
 
        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch from Gemini');
        }

        // Extract text
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I am having trouble thinking right now.";

        return NextResponse.json({ response: botResponse });

    } catch (error) {
        console.error("AI Tutor API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
