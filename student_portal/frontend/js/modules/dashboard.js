class DashboardModule {
    static async loadDashboard() {
        try {
            console.log('Loading dashboard data...');
            
            // Show loading state
            this.showLoadingState();
            
            // Load all dashboard data with error handling
            const [courses, results, books, notices] = await Promise.all([
                api.getRegisteredCourses().catch(error => {
                    console.error('Failed to load courses:', error);
                    return [];
                }),
                api.getResults().catch(error => {
                    console.error('Failed to load results:', error);
                    return [];
                }),
                api.getBorrowedBooks().catch(error => {
                    console.error('Failed to load books:', error);
                    return [];
                }),
                api.getNotices().catch(error => {
                    console.error('Failed to load notices:', error);
                    return [];
                })
            ]);

            console.log('Dashboard data loaded:', {courses, results, books, notices});
            this.updateStats(courses, results, books, notices);
            this.updateRecentNotices(notices);
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    static showLoadingState() {
        // Update all stat elements to show loading
        const statIds = ['registered-courses', 'current-gpa', 'borrowed-books', 'pending-notices'];
        statIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '...';
        });
    }

    static updateStats(courses, results, books, notices) {
        const registeredCourses = courses?.length || 0;
        this.updateStatElement('registered-courses', registeredCourses);

        const currentGPA = this.calculateGPA(results);
        this.updateStatElement('current-gpa', currentGPA.toFixed(2));

        const borrowedBooks = books?.length || 0;
        this.updateStatElement('borrowed-books', borrowedBooks);

        const recentNotices = notices?.length || 0;
        this.updateStatElement('pending-notices', recentNotices);
    }

    static updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) element.textContent = value;
    }

    static calculateGPA(results) {
        if (!results || results.length === 0) return 0.00;
        
        // Simple GPA calculation
        const validResults = results.filter(result => result.grade && result.grade !== 'F');
        if (validResults.length === 0) return 0.00;
        
        const gradePoints = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'F': 0.0
        };
        
        const totalPoints = validResults.reduce((sum, result) => {
            return sum + (gradePoints[result.grade] || 0);
        }, 0);
        
        return totalPoints / validResults.length;
    }

    static updateRecentNotices(notices) {
        const container = document.getElementById('recent-notices');
        if (!container) return;
        
        if (!notices || notices.length === 0) {
            container.innerHTML = '<div class="notice-item"><div class="notice-content">No recent notices available</div></div>';
            return;
        }
        
        // Show only 3 most recent notices
        const recentNotices = notices.slice(0, 3);
        
        container.innerHTML = recentNotices.map(notice => `
            <div class="notice-item ${notice.is_important ? 'important' : ''}">
                <div class="notice-header">
                    <div class="notice-title">${this.escapeHtml(notice.title || 'No Title')}</div>
                    <div class="notice-date">${new Date(notice.created_at).toLocaleDateString()}</div>
                </div>
                <div class="notice-content">${this.escapeHtml(notice.content || 'No content available')}</div>
                ${notice.is_important ? '<div class="important-badge">Important</div>' : ''}
            </div>
        `).join('');
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static showError(message) {
        console.error('Dashboard Error:', message);
        // You can show a user-friendly error message here
    }
}

// Make it globally available
window.DashboardModule = DashboardModule;