const API_BASE_URL = 'http://127.0.0.1:8000';

class API {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.isRefreshing = false;
        this.failedQueue = [];
        this.requestTimeout = 30000; // 30 seconds timeout
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        const config = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            signal: controller.signal,
            ...options
        };

        // Get current token
        let token = localStorage.getItem('access_token');
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Handle request body
        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        try {
            console.log(`🔄 API ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            console.log(`📡 Response: ${response.status} for ${url}`);

            // Handle token expiration
            if (response.status === 401 && token) {
                console.log('🔑 Token expired, attempting refresh...');
                return this.handleTokenRefresh(url, config, endpoint);
            }

            if (!response.ok) {
                throw await this.createError(response);
            }

            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else if (contentType && contentType.includes('text/')) {
                data = await response.text();
            } else {
                data = await response.blob();
            }

            console.log(`✅ API Success for ${url}`);
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please check your connection and try again.');
            }
            
            console.error('💥 API request failed:', error);
            throw error;
        }
    }

    async handleTokenRefresh(originalUrl, originalConfig, endpoint) {
        if (this.isRefreshing) {
            console.log('⏳ Refresh already in progress, waiting...');
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
            });
        }
        
        this.isRefreshing = true;
        
        try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
                console.log('✅ Token refreshed successfully, retrying request...');
                
                // Update token in headers
                const newToken = localStorage.getItem('access_token');
                originalConfig.headers['Authorization'] = `Bearer ${newToken}`;
                
                // Retry the original request
                const retryResponse = await fetch(originalUrl, originalConfig);
                
                if (!retryResponse.ok) {
                    throw await this.createError(retryResponse);
                }
                
                const data = await retryResponse.json();
                
                // Resolve all queued requests
                this.failedQueue.forEach(({ resolve }) => resolve(data));
                this.failedQueue = [];
                
                this.isRefreshing = false;
                return data;
            } else {
                console.log('❌ Token refresh failed, logging out...');
                this.handleAuthError();
                throw new Error('Authentication failed');
            }
        } catch (refreshError) {
            console.error('💥 Token refresh error:', refreshError);
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            this.isRefreshing = false;
            this.handleAuthError();
            throw refreshError;
        }
    }

    async createError(response) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            try {
                errorData = { detail: await response.text() };
            } catch {
                errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
            }
        }
        
        const error = new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        
        return error;
    }

    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            console.log('🔄 Refreshing token...');
            
            const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.access) {
                    localStorage.setItem('access_token', data.access);
                    console.log('✅ New access token saved');
                    return true;
                }
            }
            
            console.error('❌ Token refresh failed');
            return false;
            
        } catch (error) {
            console.error('💥 Token refresh failed:', error);
            return false;
        }
    }

    handleAuthError() {
        console.log('🔒 Authentication error, clearing tokens...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Show login page
        const loginPage = document.getElementById('login-page');
        const appPage = document.getElementById('app-page');
        
        if (loginPage && appPage) {
            loginPage.classList.add('active');
            appPage.classList.remove('active');
        }
        
        // Show error message
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = 'Your session has expired. Please login again.';
            errorDiv.classList.remove('hidden');
        }
    }

   async login(username, password) {
    // Don't use this.request() for login - it adds Authorization header
    const url = `${this.baseURL}/api/auth/login/`;
    
    try {
        console.log('🔐 Attempting login...');
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
                username: username, 
                password: password 
            })
        });

        console.log(`📡 Login Response: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.message || 'Login failed');
        }

        const data = await response.json();
        
        if (data.access && data.refresh) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            console.log('✅ Login successful, tokens saved');
        }
        
        return data;
    } catch (error) {
        console.error('💥 Login failed:', error);
        throw error;
    }
}

    async getStudentProfile() {
        return this.request('/api/auth/student-profile/');
    }

    // 📚 LIBRARY ENDPOINTS
    async getBooks(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/api/library/books/?${queryString}` : '/api/library/books/';
        return this.request(endpoint);
    }

    async getBook(bookId) {
        return this.request(`/api/library/books/${bookId}/`);
    }

    async borrowBook(bookId) {
        return this.request(`/api/library/books/${bookId}/borrow/`, {
            method: 'POST'
        });
    }

    async reserveBook(bookId) {
        return this.request(`/api/library/books/${bookId}/reserve/`, {
            method: 'POST'
        });
    }

    async getBorrowedBooks() {
        return this.request('/api/library/loans/my_loans/');
    }

    async returnBook(loanId) {
        return this.request(`/api/library/loans/${loanId}/return_book/`, {
            method: 'POST'
        });
    }

    async renewBook(loanId) {
        return this.request(`/api/library/loans/${loanId}/renew/`, {
            method: 'POST'
        });
    }

    async getMyReservations() {
        return this.request('/api/library/reservations/my_reservations/');
    }

    async cancelReservation(reservationId) {
        return this.request(`/api/library/reservations/${reservationId}/cancel/`, {
            method: 'POST'
        });
    }

    // 📖 COURSE ENDPOINTS
    async getCourses() {
        return this.request('/api/courses/courses/');
    }

    async getRegisteredCourses() {
        return this.request('/api/courses/registrations/');
    }

    async registerCourse(courseId) {
        return this.request(`/api/courses/courses/${courseId}/register/`, {
            method: 'POST'
        });
    }

    // Add this method to your API class to debug responses
async debugAPIResponses() {
    console.log('🔍 DEBUG: Checking API responses...');
    
    try {
        const endpoints = [
            '/api/courses/registrations/',
            '/api/results/results/', 
            '/api/library/loans/my_loans/',
            '/api/courses/notices/',
            '/api/auth/student-profile/'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.request(endpoint);
                console.log(`📊 ${endpoint}:`, response);
            } catch (error) {
                console.error(`❌ ${endpoint}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Debug failed:', error);
    }
}
      
    async getTodos() {
    return this.request('/api/todos/todos/');
}

async createTodo(todoData) {
    return this.request('/api/todos/todos/', {
        method: 'POST',
        body: todoData
    });
}

async updateTodo(todoId, updates) {
    return this.request(`/api/todos/todos/${todoId}/`, {
        method: 'PATCH',
        body: updates
    });
}

    async dropCourse(courseId) {
        return this.request(`/api/courses/courses/${courseId}/drop/`, {
            method: 'POST'
        });
    }

    // 📊 RESULTS ENDPOINTS
    async getResults() {
        return this.request('/api/results/results/');
    }

    // 📅 SCHEDULE ENDPOINTS
    async getSchedule() {
        return this.request('/api/courses/schedules/');
    }

    // 📢 NOTICES ENDPOINTS
    async getNotices() {
        return this.request('/api/courses/notices/');
    }

    // 🛠️ UTILITY METHODS
    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    }

    clearAuth() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }
}

// Global instance
const api = new API();