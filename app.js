// ========================
// Configuration
// ========================

// Using Cloudflare Worker for CORS handling
// Your custom worker handles the API call and adds CORS headers
const API_URL = "https://ams-fabric-proxy.sudhakarn-in.workers.dev";

// ========================
// State Management
// ========================

let state = {
    conversations: [],
    currentConversationId: null,
    theme: 'light',
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
    clearBtn: document.getElementById('clear-btn'),
    newChatBtn: document.getElementById('new-chat-btn'),
    searchInput: document.getElementById('search-input'),
    chatTitle: document.getElementById('chat-title'),
    loadingIndicator: document.getElementById('loading-indicator'),
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.querySelector('.theme-icon'),
    themeLabel: document.querySelector('.theme-label')
};

// ========================
// Initialization
// ========================

function init() {
    loadState();
    applyTheme();
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
    
    // Clear input
    elements.clearBtn.addEventListener('click', clearInput);
    
    // New chat
    elements.newChatBtn.addEventListener('click', handleNewChat);
    
    // Search conversations
    elements.searchInput.addEventListener('input', (e) => {
        filterConversations(e.target.value);
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Message input handling
    elements.messageInput.addEventListener('keydown', handleInputKeydown);
    elements.messageInput.addEventListener('input', autoResizeTextarea);
    
    // Track user scrolling
    elements.messagesContainer.addEventListener('scroll', handleScroll);
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        elements.searchInput.focus();
        elements.searchInput.select();
    }
    
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
        elements.chatTitle.textContent = conversation.title;
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

function renderConversations(filteredList = null) {
    const conversationsToRender = filteredList || state.conversations;
    
    if (conversationsToRender.length === 0) {
        elements.conversationList.innerHTML = `
            <div style="padding: 2rem 1rem; text-align: center; color: var(--text-tertiary); font-size: 0.875rem;">
                ${filteredList ? 'No conversations found' : 'No conversations yet'}
            </div>
        `;
        return;
    }
    
    elements.conversationList.innerHTML = conversationsToRender.map(conv => {
        const isActive = conv.id === state.currentConversationId;
        const date = formatDate(new Date(conv.updatedAt));
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" data-id="${conv.id}">
                <div class="conversation-title">${escapeHtml(conv.title)}</div>
                <div class="conversation-meta">${date}</div>
            </div>
        `;
    }).join('');
    
    // Attach click handlers
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            switchConversation(item.dataset.id);
        });
    });
}

function filterConversations(query) {
    if (!query.trim()) {
        renderConversations();
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = state.conversations.filter(conv => 
        conv.title.toLowerCase().includes(lowerQuery) ||
        conv.messages.some(msg => msg.text.toLowerCase().includes(lowerQuery))
    );
    
    renderConversations(filtered);
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
        elements.messagesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <h3>Start the conversation</h3>
                <p>Type a message below to begin chatting</p>
            </div>
        `;
        return;
    }
    
    elements.messagesContainer.innerHTML = conversation.messages.map(msg => {
        const time = formatTime(new Date(msg.timestamp));
        
        if (msg.role === 'thinking') {
            return `
                <div class="message thinking" data-id="${msg.id}">
                    <div class="message-bubble">
                        <div class="message-text">Thinking...</div>
                    </div>
                </div>
            `;
        }
        
        if (msg.role === 'error') {
            return `
                <div class="message bot error" data-id="${msg.id}">
                    <div class="message-bubble">
                        <div class="message-text">${escapeHtml(msg.text)}</div>
                        <button class="retry-btn" onclick="handleRetry()">Retry</button>
                        <span class="message-timestamp">${time}</span>
                    </div>
                </div>
            `;
        }
        
        const formattedText = formatMessageText(msg.text);
        
        return `
            <div class="message ${msg.role}" data-id="${msg.id}">
                <div class="message-bubble">
                    <div class="message-text">${formattedText}</div>
                    <span class="message-timestamp">${time}</span>
                </div>
            </div>
        `;
    }).join('');
    
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
    if (!state.userHasScrolled) {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
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
// Theme Management
// ========================

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveState();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    
    if (state.theme === 'dark') {
        elements.themeIcon.textContent = '☀️';
        elements.themeLabel.textContent = 'Light Mode';
    } else {
        elements.themeIcon.textContent = '🌙';
        elements.themeLabel.textContent = 'Dark Mode';
    }
}

// ========================
// Persistence (localStorage)
// ========================

function saveState() {
    try {
        const dataToSave = {
            conversations: state.conversations,
            currentConversationId: state.currentConversationId,
            theme: state.theme
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
            state.theme = data.theme || 'light';
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
