// WebSocket connection handler
class WSConnection {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = new Map();
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}/ws/stats`);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.listeners.forEach(callback => callback(data));
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    this.connect();
                }, 1000 * Math.pow(2, this.reconnectAttempts));
            }
        };
    }

    addListener(id, callback) {
        this.listeners.set(id, callback);
    }

    removeListener(id) {
        this.listeners.delete(id);
    }
}

// Authentication handler
class Auth {
    static async login(username, password) {
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            
            window.location.href = '/dashboard/';
        } catch (error) {
            throw error;
        }
    }

    static async logout() {
        try {
            await fetch('/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
}

// Initialize login form handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            try {
                await Auth.login(username, password);
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.classList.remove('hidden');
            }
        });
    }
});

// Export globals
window.wsConnection = new WSConnection();
window.Auth = Auth;