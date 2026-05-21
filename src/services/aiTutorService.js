export const processTutorCommand = async (command, language = 'en-US') => {
    try {
        // Prepare history context from global window object
        const history = typeof window !== 'undefined' ? window.tutorHistory || [] : [];

        const res = await fetch('/api/tutor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: command,
                language: language,
                history: history
            })
        });

        if (res.ok) {
            const data = await res.json();
            return data.response;
        } else {
            console.warn("AI Tutor API failed, falling back to mock.");
            // Fallback to mock if API fails (e.g. no key)
            return getMockResponse(command);
        }
    } catch (error) {
        console.error("AI Tutor Service Error:", error);
        return getMockResponse(command);
    }
};

// Fallback Mock Logic
const getMockResponse = (command) => {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('hello') || lowerCommand.includes('hi') || lowerCommand.includes('namaste')) {
        return "Hello! I am your English tutor. What topic would you like to practice today? (Offline Mode)";
    }
    if (lowerCommand.includes('intro') || lowerCommand.includes('myself')) {
        return "Great! Let's practice introductions. Try saying: 'My name is...'.";
    }
    if (lowerCommand.includes('travel')) {
        return "Travel is fun! Where do you want to go?";
    }
    return "I am listening. Please continue. (Offline Mode)";
};

