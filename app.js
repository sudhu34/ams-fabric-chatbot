// ========================
// Configuration
// ========================

// Using Cloudflare Worker for CORS handling
const API_URL = "https://ams-fabric-proxy.sudhakarn-in.workers.dev";

// ========================
// State Management
// ========================

let state = {
    conversations: [],
    currentConversationId: null,
    isRequestInProgress: false,
    userHasScrolled: false,
    lastUserMessage: null
};

// ========================
// DOM Elements
// ========================

const elements = {
    conversationList: document.getElementById('conversation-list'),
    messagesContainer: document.getElementById('messages-container'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    newChatBtn: document.getElementById('new-chat-btn'),
    loadingIndicator: document.getElementById('loading-indicator'),
    welcomeScreen: document.getElementById('welcome-screen')
};

// ========================
// Initialization
// ========================

function init() {
    loadState();
    renderConversations();
    
    if (state.currentConversationId) {
        switchConversation(state.currentConversationId);
    }
    
    attachEventListeners();
    autoResizeTextarea();
}

// ========================
// Event Listeners
// ========================

function attachEventListeners() {
    // Send message
    elements.sendBtn.addEventListener('click', handleSendMessage);
    
    // New chat
    elements.newChatBtn.addEventListener('click', handleNewChat);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Message input handling
    elements.messageInput.addEventListener('keydown', handleInputKeydown);
    elements.messageInput.addEventListener('input', autoResizeTextarea);
    
    // Track user scrolling
    elements.messagesContainer.addEventListener('scroll', handleScroll);
    
    // Prompt tile clicks
    document.querySelectorAll('.prompt-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            const prompt = tile.getAttribute('data-prompt');
            if (prompt) {
                elements.messageInput.value = prompt;
                elements.messageInput.focus();
                autoResizeTextarea();
            }
        });
    });
}

function handleKeyboardShortcuts(e) {
    // Escape: Clear input
    if (e.key === 'Escape' && document.activeElement === elements.messageInput) {
        clearInput();
    }
}

function handleInputKeydown(e) {
    // Enter: Send message
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
    
    // Shift+Enter: New line (default behavior)
}

function handleScroll() {
    const container = elements.messagesContainer;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    state.userHasScrolled = !isAtBottom;
}

// ========================
// Conversation Management
// ========================

function createConversation() {
    const conversation = {
        id: generateId(),
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
    };
    
    state.conversations.unshift(conversation);
    saveState();
    return conversation;
}

function switchConversation(id) {
    state.currentConversationId = id;
    state.userHasScrolled = false;
    
    const conversation = getConversation(id);
    if (conversation) {
        renderMessages();
    }
    
    renderConversations();
    saveState();
}

function getConversation(id) {
    return state.conversations.find(conv => conv.id === id);
}

function getCurrentConversation() {
    return getConversation(state.currentConversationId);
}

function updateConversationTitle(conversation, firstMessage) {
    const maxLength = 40;
    let title = firstMessage.trim();
    
    if (title.length > maxLength) {
        title = title.substring(0, maxLength) + '...';
    }
    
    conversation.title = title || 'New Conversation';
    conversation.updatedAt = new Date().toISOString();
}

function renderConversations() {
    const conversationsToRender = state.conversations;
    
    if (conversationsToRender.length === 0) {
        elements.conversationList.innerHTML = `
            <div style="padding: 1.5rem 0.75rem; text-align: center; color: var(--text-tertiary); font-size: 0.8rem;">
                No conversations yet
            </div>
        `;
        return;
    }
    
    elements.conversationList.innerHTML = conversationsToRender.map(conv => {
        const isActive = conv.id === state.currentConversationId;
        const date = formatDate(new Date(conv.updatedAt));
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" data-id="${conv.id}">
                <div class="conv-item-content">
                    <div class="conversation-title">${escapeHtml(conv.title)}</div>
                    <div class="conversation-meta">${date}</div>
                </div>
                <button class="conv-delete-btn" data-id="${conv.id}" title="Delete chat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
    
    // Attach click handlers
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.conv-delete-btn')) return;
            switchConversation(item.dataset.id);
        });
    });
    
    // Attach delete handlers
    document.querySelectorAll('.conv-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(btn.dataset.id);
        });
    });
}

function deleteConversation(id) {
    state.conversations = state.conversations.filter(c => c.id !== id);
    
    if (state.currentConversationId === id) {
        state.currentConversationId = state.conversations.length > 0 ? state.conversations[0].id : null;
        if (state.currentConversationId) {
            switchConversation(state.currentConversationId);
        } else {
            renderMessages();
        }
    }
    
    saveState();
    renderConversations();
}

function handleNewChat() {
    const conversation = createConversation();
    switchConversation(conversation.id);
    elements.messageInput.focus();
}

// ========================
// Message Management
// ========================

function addMessage(role, text, meta = {}) {
    const conversation = getCurrentConversation();
    if (!conversation) return;
    
    const message = {
        id: generateId(),
        role,
        text,
        timestamp: new Date().toISOString(),
        ...meta
    };
    
    conversation.messages.push(message);
    conversation.updatedAt = new Date().toISOString();
    
    // Update conversation title if this is the first user message
    if (role === 'user' && conversation.messages.filter(m => m.role === 'user').length === 1) {
        updateConversationTitle(conversation, text);
        renderConversations();
    }
    
    saveState();
    renderMessages();
    
    return message;
}

function removeMessage(messageId) {
    const conversation = getCurrentConversation();
    if (!conversation) return;
    
    conversation.messages = conversation.messages.filter(m => m.id !== messageId);
    saveState();
    renderMessages();
}

function renderMessages() {
    const conversation = getCurrentConversation();
    
    if (!conversation || conversation.messages.length === 0) {
        // Show welcome screen with tiles
        showWelcomeScreen();
        return;
    }
    
    // Hide welcome screen, show messages
    hideWelcomeScreen();
    
    // Build messages HTML but preserve welcome screen element
    const welcomeEl = document.getElementById('welcome-screen');
    const messagesHTML = conversation.messages.map(msg => {
        const time = formatTime(new Date(msg.timestamp));
        
        const userAvatar = `<div class="msg-avatar user-avatar-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
        const botAvatar = `<div class="msg-avatar bot-avatar-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"/><circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none"/><path d="M9 18c.83.67 2 1 3 1s2.17-.33 3-1"/></svg></div>`;

        if (msg.role === 'thinking') {
            return `
                <div class="message thinking" data-id="${msg.id}">
                    ${botAvatar}
                    <div class="message-bubble">
                        <div class="message-text">Thinking...</div>
                    </div>
                </div>
            `;
        }
        
        if (msg.role === 'error') {
            return `
                <div class="message bot error" data-id="${msg.id}">
                    ${botAvatar}
                    <div class="message-bubble">
                        <div class="message-text">${escapeHtml(msg.text)}</div>
                        <button class="retry-btn" onclick="handleRetry()">Retry</button>
                        <span class="message-timestamp">${time}</span>
                    </div>
                </div>
            `;
        }
        
        const formattedText = formatMessageText(msg.text);
        const avatar = msg.role === 'user' ? userAvatar : botAvatar;
        
        return `
            <div class="message ${msg.role}" data-id="${msg.id}">
                ${avatar}
                <div class="message-bubble">
                    <div class="message-text">${formattedText}</div>
                    <span class="message-timestamp">${time}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Remove old message elements (keep welcome screen hidden)
    const container = elements.messagesContainer;
    Array.from(container.children).forEach(child => {
        if (child.id !== 'welcome-screen') {
            child.remove();
        }
    });
    
    // Insert messages HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = messagesHTML;
    while (tempDiv.firstChild) {
        container.appendChild(tempDiv.firstChild);
    }
    
    scrollToBottom();
}

function formatMessageText(text) {
    // Handle code blocks (triple backticks)
    const codeBlockRegex = /```([\s\S]*?)```/g;
    
    let formatted = escapeHtml(text);
    formatted = formatted.replace(codeBlockRegex, (match, code) => {
        return `</div><div class="code-block"><code>${code.trim()}</code></div><div class="message-text">`;
    });
    
    // Clean up empty divs
    formatted = formatted.replace(/<div class="message-text"><\/div>/g, '');
    
    return formatted;
}

function scrollToBottom() {
    // Scroll to the last user message so the question stays visible at top
    const container = elements.messagesContainer;
    const userMessages = container.querySelectorAll('.message.user');
    if (userMessages.length > 0) {
        const lastUserMsg = userMessages[userMessages.length - 1];
        lastUserMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        container.scrollTop = container.scrollHeight;
    }
}

// ========================
// Send Message & API Call
// ========================

async function handleSendMessage() {
    const text = elements.messageInput.value.trim();
    
    if (!text || state.isRequestInProgress) return;
    
    // Create conversation if needed
    if (!state.currentConversationId) {
        const conversation = createConversation();
        switchConversation(conversation.id);
    }
    
    // Add user message
    addMessage('user', text);
    state.lastUserMessage = text;
    
    // Clear input
    elements.messageInput.value = '';
    autoResizeTextarea();
    
    // Add thinking indicator
    const thinkingMsg = addMessage('thinking', '');
    
    // Show loading indicator
    setLoadingState(true);
    
    try {
        const response = await callApi(text);
        
        // Remove thinking indicator
        removeMessage(thinkingMsg.id);
        
        // Add bot response
        addMessage('bot', response);
        
    } catch (error) {
        // Remove thinking indicator
        removeMessage(thinkingMsg.id);
        
        // Add error message
        addMessage('error', `Error: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

async function callApi(question) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query: question })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
            
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error) errorMessage += ` - ${errorJson.error}`;
                if (errorJson.message) errorMessage += ` - ${errorJson.message}`;
            } catch (e) {
                if (errorText && errorText.length < 200) errorMessage += ` - ${errorText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        const responseText = await response.text();
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            return responseText;
        }
        
        // Handle different response formats
        if (data.name) {
            return data.name;
        } else if (data.answer) {
            return data.answer;
        } else if (data.response) {
            return data.response;
        } else if (data.result) {
            return data.result;
        } else if (data.output) {
            return data.output;
        } else if (data.text) {
            return data.text;
        } else if (data.message) {
            return data.message;
        } else if (typeof data === 'string') {
            return data;
        } else {
            return JSON.stringify(data, null, 2);
        }
    } catch (error) {
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new Error('Network error: Unable to reach the API. Please check your connection.');
        }
        throw error;
    }
}

function handleRetry() {
    if (state.lastUserMessage && !state.isRequestInProgress) {
        elements.messageInput.value = state.lastUserMessage;
        handleSendMessage();
    }
}

function setLoadingState(isLoading) {
    state.isRequestInProgress = isLoading;
    
    if (isLoading) {
        elements.loadingIndicator.classList.add('active');
        elements.sendBtn.disabled = true;
        elements.messageInput.disabled = true;
    } else {
        elements.loadingIndicator.classList.remove('active');
        elements.sendBtn.disabled = false;
        elements.messageInput.disabled = false;
        elements.messageInput.focus();
    }
}

// ========================
// Input Handling
// ========================

function clearInput() {
    elements.messageInput.value = '';
    autoResizeTextarea();
    elements.messageInput.focus();
}

function autoResizeTextarea() {
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    
    const maxHeight = 150; // 6 lines approximately
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    
    textarea.style.height = newHeight + 'px';
}

// ========================
// Welcome Screen Management
// ========================

function showWelcomeScreen() {
    // Remove any message elements
    const container = elements.messagesContainer;
    Array.from(container.children).forEach(child => {
        if (child.id !== 'welcome-screen') {
            child.remove();
        }
    });
    
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.style.display = '';
    }
}

function hideWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
}

// ========================
// Persistence (localStorage)
// ========================

function saveState() {
    try {
        const dataToSave = {
            conversations: state.conversations,
            currentConversationId: state.currentConversationId
        };
        localStorage.setItem('ams-fabric-state', JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Failed to save state:', error);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('ams-fabric-state');
        if (saved) {
            const data = JSON.parse(saved);
            state.conversations = data.conversations || [];
            state.currentConversationId = data.currentConversationId;
        }
    } catch (error) {
        console.error('Failed to load state:', error);
    }
}

// ========================
// Utility Functions
// ========================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// ========================
// Start Application
// ========================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
