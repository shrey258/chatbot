document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Client-side error logging
    window.onerror = function(msg, url, lineNo, columnNo, error) {
        logError('window.onerror', { msg, url, lineNo, columnNo, error: error?.stack });
        return false;
    };

    window.addEventListener('unhandledrejection', function(event) {
        logError('unhandledrejection', { 
            reason: event.reason?.stack || event.reason 
        });
    });

    function logError(type, error) {
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            type: 'client_error',
            error_type: type,
            ...error,
            userAgent: navigator.userAgent,
            location: window.location.href
        }));
    }

    function formatResponse(text) {
        try {
            // Split into paragraphs
            const paragraphs = text.split('\n').filter(p => p.trim());
            
            // Format each paragraph
            const formattedParagraphs = paragraphs.map(p => {
                // Check if it's a numbered list item
                if (p.match(/^\d+\./)) {
                    return `<div class="list-item">${p}</div>`;
                }
                return `<p>${p}</p>`;
            });
            
            return formattedParagraphs.join('');
        } catch (error) {
            logError('formatResponse', { error: error.stack });
            return '<p>Error formatting response</p>';
        }
    }

    function addMessage(content, isUser = false) {
        try {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
            
            if (isUser) {
                messageDiv.textContent = content;
            } else {
                messageDiv.innerHTML = formatResponse(content);
            }
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            logError('addMessage', { error: error.stack });
            // Fallback message display
            chatMessages.innerHTML += `<div class="message bot-message"><p>Error displaying message</p></div>`;
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        const requestStart = Date.now();
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            type: 'request_start',
            message_length: message.length
        }));

        // Clear input
        userInput.value = '';

        // Add user message to chat
        addMessage(message, true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                type: 'request_complete',
                duration: `${Date.now() - requestStart}ms`,
                status: 'success'
            }));

            addMessage(data.response);
        } catch (error) {
            logError('sendMessage', { error: error.stack });
            
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                type: 'request_error',
                duration: `${Date.now() - requestStart}ms`,
                error: error.message
            }));

            addMessage('Sorry, I encountered an error. Please try again.');
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add welcome message
    addMessage('Hello! I\'m your CDP Assistant. I can help you with questions about Segment, mParticle, Lytics, and Zeotap. How can I assist you today?');

    // Log successful initialization
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'initialization',
        status: 'success'
    }));
});
