class Auth {
    constructor() {
        this.isAuthenticated = this.checkAuth();
        console.log('Auth initialized - isAuthenticated:', this.isAuthenticated);
    }

    checkAuth() {
        const token = localStorage.getItem('access_token');
        const user = localStorage.getItem('user');
        console.log('Auth check - Token:', !!token, 'User:', !!user);
        return !!token && !!user;
    }

    getToken() {
        return localStorage.getItem('access_token');
    }

    getUser() {
        const userStr = localStorage.getItem('user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }

    // In auth.js - Fix the login method
async login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();
        
        // Store tokens and user data
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user || { username }));
        
        this.isAuthenticated = true;
        return { success: true, user: data.user };

    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}
    logout() {
        console.log('Logging out...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        this.isAuthenticated = false;
        
        // Show login page
        document.getElementById('login-page').classList.add('active');
        document.getElementById('app-page').classList.remove('active');
        
        console.log('Logout complete');
    }

    requireAuth() {
        if (!this.isAuthenticated) {
            this.logout();
            return false;
        }
        return true;
    }
}

// Create global Auth instance
const auth = new Auth();