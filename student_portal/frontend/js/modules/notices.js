class NoticesModule {
    static async loadNotices() {
        try {
            console.log('Loading notices data...');
            const notices = await api.getNotices().catch(() => []);
            this.renderNotices(notices);
        } catch (error) {
            console.error('Failed to load notices:', error);
        }
    }

    static renderNotices(notices) {
        const container = document.getElementById('all-notices');
        if (!container) return;
        
        if (!notices || notices.length === 0) {
            container.innerHTML = '<div class="loading">No notices available</div>';
            return;
        }

        // Sort by date (newest first)
        const sortedNotices = notices.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );

        container.innerHTML = sortedNotices.map(notice => `
            <div class="notice-item ${notice.is_important ? 'important' : ''}">
                <div class="notice-header">
                    <div class="notice-title">${this.escapeHtml(notice.title || 'No Title')}</div>
                    <div class="notice-meta">
                        <span class="notice-date">${this.formatDate(notice.created_at)}</span>
                        ${notice.is_important ? 
                            '<span class="important-badge"><i class="fas fa-exclamation-circle"></i> Important</span>' : ''
                        }
                    </div>
                </div>
                <div class="notice-content">
                    ${this.escapeHtml(notice.content || notice.description || 'No content available')}
                </div>
                <div class="notice-footer">
                    <small>Posted by: ${notice.created_by_name || notice.author || 'Administration'}</small>
                    <small>Audience: ${notice.target_audience || 'All Students'}</small>
                </div>
            </div>
        `).join('');
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }
}
window.NoticesModule = NoticesModule;