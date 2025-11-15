class StudentPortalApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.initModules();
        this.init();
    }

    initModules() {
        // Initialize all modules
        console.log('Initializing modules...');
        
        // Check which modules are available
        window.dashboardModule = window.DashboardModule || {};
        window.coursesModule = window.CoursesModule || {};
        window.libraryModule = window.LibraryModule || {};
        window.resultsModule = window.ResultsModule || {};
        window.noticesModule = window.NoticesModule || {};
        window.scheduleModule = window.ScheduleModule || {};
        window.todosModule = window.TodosModule || {};
        
        console.log('Modules status:', {
            dashboard: !!window.DashboardModule,
            courses: !!window.CoursesModule,
            library: !!window.LibraryModule,
            results: !!window.ResultsModule,
            notices: !!window.NoticesModule,
            schedule: !!window.ScheduleModule,
            todos: !!window.TodosModule
        });
    }

    init() {
        console.log('Initializing Student Portal App...');
        
        // Check authentication first
        this.checkAuthentication();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load user info
        this.loadUserInfo();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Navigation - use event delegation
        document.addEventListener('click', (e) => this.handleNavigation(e));
        
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('Login form event listener added');
        }
        
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebarClose = document.getElementById('sidebar-close');
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar(true));
            console.log('Sidebar toggle event listener added');
        }
        
        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => this.toggleSidebar(false));
            console.log('Sidebar close event listener added');
        }
        
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
            console.log('Logout button event listener added');
        }
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = e.state ? e.state.page : 'dashboard';
            console.log('Popstate event, navigating to:', page);
            this.navigateToPage(page);
        });
        
        // Setup todo-specific event listeners
        this.setupTodoEventListeners();
        
        console.log('All event listeners set up successfully');
    }

    setupTodoEventListeners() {
        // Todo form
        const todoForm = document.getElementById('add-todo-form');
        if (todoForm) {
            todoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (window.todosModule && typeof window.todosModule.handleAddTodo === 'function') {
                    window.todosModule.handleAddTodo(e);
                } else {
                    console.error('Todo module not available for form submission');
                }
            });
            console.log('Todo form event listener added');
        }
        
        // Todo filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                if (window.todosModule && typeof window.todosModule.setFilter === 'function') {
                    window.todosModule.setFilter(filter);
                } else {
                    console.error('Todo module not available for filter');
                }
            });
        });
    }

    checkAuthentication() {
        console.log('Checking authentication...', auth.isAuthenticated);
        if (auth.isAuthenticated) {
            this.showApp();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        console.log('Showing login page');
        document.getElementById('login-page').classList.add('active');
        document.getElementById('app-page').classList.remove('active');
    }

    showApp() {
        console.log('Showing main app');
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('app-page').classList.add('active');
        this.loadCurrentPage();
    }

    async handleLogin(e) {
        if (e) e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        const successDiv = document.getElementById('login-success');

        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');

        if (!username || !password) {
            this.showMessage('Please enter both username and password', 'error');
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector('#login-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading"></div> Signing in...';
        submitBtn.disabled = true;

        try {
            console.log('Attempting login for user:', username);
            const result = await auth.login(username, password);
            
            if (result.success) {
                console.log('Login successful');
                if (successDiv) {
                    successDiv.textContent = 'Login successful! Redirecting...';
                    successDiv.classList.remove('hidden');
                }
                
                setTimeout(() => {
                    this.showApp();
                    this.loadUserInfo();
                }, 1000);
            } else {
                console.log('Login failed:', result.error);
                if (errorDiv) {
                    errorDiv.textContent = result.error;
                    errorDiv.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Login handler error:', error);
            if (errorDiv) {
                errorDiv.textContent = 'Login failed. Please try again.';
                errorDiv.classList.remove('hidden');
            }
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    logout() {
        console.log('Logging out user');
        auth.logout();
        this.showLogin();
    }

    handleNavigation(event) {
        // Use event.target to find the clicked element
        const navLink = event.target.closest('.nav-link');
        const actionBtn = event.target.closest('.action-btn');
        
        if (navLink || actionBtn) {
            event.preventDefault();
            
            let pageId;
            if (navLink) {
                pageId = navLink.dataset.page;
                console.log('Nav link clicked:', pageId);
            } else if (actionBtn) {
                pageId = actionBtn.dataset.page;
                console.log('Action button clicked:', pageId);
            }
            
            if (pageId) {
                this.navigateToPage(pageId);
            } else {
                console.warn('No page ID found for clicked element');
            }
        }
    }

    navigateToPage(pageId) {
        console.log('Navigating to page:', pageId);
        
        if (!pageId) {
            console.error('No pageId provided for navigation');
            return;
        }
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            const isActive = link.dataset.page === pageId;
            link.classList.toggle('active', isActive);
        });
        
        // Hide all page content
        document.querySelectorAll('.page-content-inner').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show current page
        const currentPage = document.getElementById(pageId + '-page');
        if (currentPage) {
            currentPage.classList.add('active');
            console.log('Page shown:', pageId + '-page');
            
            // Load page-specific data
            this.loadPageData(pageId);
        } else {
            console.error('Page not found:', pageId + '-page');
        }
        
        // Update URL without reloading page
        history.pushState({ page: pageId }, '', `#${pageId}`);
        
        // Close sidebar on mobile
        if (window.innerWidth < 1024) {
            this.toggleSidebar(false);
        }
    }

    loadPageData(pageId) {
        console.log('Loading data for page:', pageId);
        
        switch (pageId) {
            case 'dashboard':
                if (window.DashboardModule && typeof window.DashboardModule.loadDashboard === 'function') {
                    console.log('Calling DashboardModule.loadDashboard()');
                    window.DashboardModule.loadDashboard();
                } else {
                    console.error('Dashboard module or loadDashboard method not found');
                    this.showDashboardFallback();
                }
                break;
                
            case 'courses':
                if (window.CoursesModule && typeof window.CoursesModule.loadCourses === 'function') {
                    console.log('Calling CoursesModule.loadCourses()');
                    window.CoursesModule.loadCourses();
                } else {
                    console.error('Courses module or loadCourses method not found');
                    this.showMessage('Courses module not loaded', 'error');
                }
                break;
                
            case 'results':
                if (window.ResultsModule && typeof window.ResultsModule.loadResults === 'function') {
                    console.log('Calling ResultsModule.loadResults()');
                    window.ResultsModule.loadResults();
                } else {
                    console.error('Results module or loadResults method not found');
                    this.showMessage('Results module not loaded', 'error');
                }
                break;
                
            case 'todos':
                if (window.todosModule && typeof window.todosModule.loadTodos === 'function') {
                    console.log('Calling todosModule.loadTodos()');
                    window.todosModule.loadTodos();
                } else {
                    console.error('Todos module or loadTodos method not found');
                    this.showMessage('Todo module not loaded', 'error');
                }
                break;
                
            case 'library':
                if (window.LibraryModule && typeof window.LibraryModule.loadLibrary === 'function') {
                    console.log('Calling LibraryModule.loadLibrary()');
                    window.LibraryModule.loadLibrary();
                } else {
                    console.error('Library module or loadLibrary method not found');
                    this.showMessage('Library module not loaded', 'error');
                }
                break;
                
            case 'schedule':
                if (window.ScheduleModule && typeof window.ScheduleModule.loadSchedule === 'function') {
                    console.log('Calling ScheduleModule.loadSchedule()');
                    window.ScheduleModule.loadSchedule();
                } else {
                    console.error('Schedule module or loadSchedule method not found');
                    this.showMessage('Schedule module not loaded', 'error');
                }
                break;
                
            case 'notices':
                if (window.NoticesModule && typeof window.NoticesModule.loadNotices === 'function') {
                    console.log('Calling NoticesModule.loadNotices()');
                    window.NoticesModule.loadNotices();
                } else {
                    console.error('Notices module or loadNotices method not found');
                    this.showMessage('Notices module not loaded', 'error');
                }
                break;
                
            default:
                console.warn('No data loader for page:', pageId);
        }
    }

    showDashboardFallback() {
        // Basic fallback for dashboard
        const stats = document.querySelectorAll('.stat-card h3');
        stats.forEach(stat => {
            if (stat.textContent === '0') {
                stat.textContent = '--';
            }
        });
        
        const recentNotices = document.getElementById('recent-notices');
        if (recentNotices) {
            recentNotices.innerHTML = `
                <div class="notice-item">
                    <div class="notice-content">Dashboard module not loaded. Please check console for errors.</div>
                </div>
            `;
        }
    }

    loadCurrentPage() {
        // Get page from URL hash or default to dashboard
        const hash = window.location.hash.replace('#', '');
        const pageId = hash || 'dashboard';
        console.log('Loading current page from URL:', pageId);
        this.navigateToPage(pageId);
    }

    async loadUserInfo() {
        if (!auth.isAuthenticated) {
            console.log('User not authenticated, skipping user info load');
            return;
        }

        try {
            const user = auth.getUser();
            console.log('Loaded user data:', user);
            
            if (user) {
                const userNameElement = document.getElementById('user-name');
                const welcomeNameElement = document.getElementById('welcome-name');
                
                if (userNameElement) {
                    const displayName = user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user.username || 'User';
                    userNameElement.textContent = displayName;
                    console.log('Set user name to:', displayName);
                }
            }

            // Load student profile if available
            try {
                console.log('Loading student profile...');
                const profile = await api.getStudentProfile();
                if (profile) {
                    console.log('Student profile loaded:', profile);
                }
            } catch (error) {
                console.log('Student profile not available:', error.message);
            }
        } catch (error) {
            console.error('Failed to load user info:', error);
        }
    }

    toggleSidebar(forceClose = null) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            console.error('Sidebar element not found');
            return;
        }
        
        const shouldClose = forceClose !== null ? forceClose : !sidebar.classList.contains('active');
        
        if (shouldClose) {
            sidebar.classList.remove('active');
            console.log('Sidebar closed');
        } else {
            sidebar.classList.add('active');
            console.log('Sidebar opened');
        }
    }

    showMessage(message, type = 'success') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
        messageDiv.textContent = message;
        messageDiv.style.margin = '1rem 0';
        messageDiv.style.padding = '0.75rem 1rem';
        messageDiv.style.borderRadius = '0.5rem';
        messageDiv.style.zIndex = '1000';
        
        // Add to top of page content
        const pageContent = document.querySelector('.page-content');
        if (pageContent) {
            pageContent.insertBefore(messageDiv, pageContent.firstChild);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        } else {
            // Fallback to alert
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Debug method to test all modules
    debugModules() {
        console.log('=== MODULE DEBUG INFO ===');
        console.log('Available modules:', {
            DashboardModule: !!window.DashboardModule,
            CoursesModule: !!window.CoursesModule,
            LibraryModule: !!window.LibraryModule,
            ResultsModule: !!window.ResultsModule,
            NoticesModule: !!window.NoticesModule,
            ScheduleModule: !!window.ScheduleModule,
            todosModule: !!window.todosModule
        });
        
        console.log('Authentication status:', auth.isAuthenticated);
        console.log('Current page:', this.currentPage);
        console.log('User data:', auth.getUser());
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing StudentPortalApp...');
    window.studentPortalApp = new StudentPortalApp();
    
    // Add global debug method
    window.debugApp = () => {
        if (window.studentPortalApp) {
            window.studentPortalApp.debugModules();
        }
    };
    
    // Test API connectivity on load
    setTimeout(() => {
        if (auth.isAuthenticated) {
            console.log('Testing initial API connectivity...');
            // You can add initial API tests here if needed
        }
    }, 1000);
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});