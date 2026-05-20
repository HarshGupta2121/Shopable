export const processTutorCommand = async (command, language = 'en-US') => {
    try {
        // Prepare simple history context (in a real app, we'd pass actual chat history from state)
        // For now, we only pass the current command.

        const res = await fetch('/api/tutor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: command,
                language: language,
                history: [] // We could pass history here if we refactor AITutor.jsx to pass it down
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

