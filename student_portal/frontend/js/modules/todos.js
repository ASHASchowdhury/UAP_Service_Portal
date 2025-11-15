// todos.js - Todo List Module (Non-module version)
class TodosModule {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        console.log('TodosModule initialized');
    }

    async loadTodos() {
        console.log('Loading todos data...');
        
        try {
            // Show loading state
            this.showLoading();
            
            // Use mock data since we don't have a backend Todo API
            await this.loadMockData();
            
            this.renderStats();
            this.renderTodos();
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error loading todos:', error);
            this.showError('Failed to load tasks');
        }
    }

    async loadMockData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.todos = [
            {
                id: 1,
                title: "Complete Math Assignment",
                description: "Finish chapter 5 problems by Friday",
                due_date: "2025-11-20",
                priority: "high",
                status: "pending",
                created_at: "2025-11-15",
                is_overdue: false
            },
            {
                id: 2,
                title: "Study for Midterm Exam",
                description: "Review chapters 1-4 for Computer Science midterm",
                due_date: "2025-11-25",
                priority: "high",
                status: "in_progress",
                created_at: "2025-11-10",
                is_overdue: false
            },
            {
                id: 3,
                title: "Return Library Books",
                description: "Return Python Programming book to library before due date",
                due_date: "2025-11-18",
                priority: "medium",
                status: "pending",
                created_at: "2025-11-12",
                is_overdue: false
            },
            {
                id: 4,
                title: "Complete Project Proposal",
                description: "Write and submit project proposal document for CSE401",
                due_date: "2025-11-15",
                priority: "medium",
                status: "completed",
                created_at: "2025-11-05",
                completed_at: "2025-11-14",
                is_overdue: false
            },
            {
                id: 5,
                title: "Prepare Presentation Slides",
                description: "Create slides for next week's team presentation",
                due_date: "2025-11-22",
                priority: "low",
                status: "pending",
                created_at: "2025-11-13",
                is_overdue: false
            }
        ];
        
        console.log('Mock todos data loaded:', this.todos.length, 'todos');
    }

    setupEventListeners() {
        console.log('Setting up todo event listeners');
        
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                console.log('Filter clicked:', filter);
                this.setFilter(filter);
            });
        });

        // Add todo form
        const addForm = document.getElementById('add-todo-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => this.handleAddTodo(e));
            console.log('Add todo form event listener added');
        } else {
            console.error('Add todo form not found');
        }
    }

    renderStats() {
        const container = document.getElementById('todo-stats');
        if (!container) {
            console.error('Todo stats container not found');
            return;
        }
        
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.status === 'completed').length;
        const pending = this.todos.filter(todo => todo.status === 'pending').length;
        const inProgress = this.todos.filter(todo => todo.status === 'in_progress').length;
        
        // Calculate overdue (due date passed but not completed)
        const now = new Date();
        const overdue = this.todos.filter(todo => {
            if (todo.status === 'completed') return false;
            if (!todo.due_date) return false;
            return new Date(todo.due_date) < now;
        }).length;

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon bg-primary">
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="stat-info">
                    <h3>${total}</h3>
                    <p>Total Tasks</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon bg-success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-info">
                    <h3>${completed}</h3>
                    <p>Completed</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon bg-warning">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-info">
                    <h3>${pending}</h3>
                    <p>Pending</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon bg-info">
                    <i class="fas fa-spinner"></i>
                </div>
                <div class="stat-info">
                    <h3>${inProgress}</h3>
                    <p>In Progress</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-info">
                    <h3>${overdue}</h3>
                    <p>Overdue</p>
                </div>
            </div>
        `;
        
        console.log('Stats rendered');
    }

    renderTodos() {
        const container = document.getElementById('todos-container');
        if (!container) {
            console.error('Todos container not found');
            return;
        }

        const filteredTodos = this.getFilteredTodos();
        console.log('Rendering todos, filtered count:', filteredTodos.length);

        if (filteredTodos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #6b7280;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No tasks found for this filter</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.status === 'completed' ? 'completed' : ''} priority-${todo.priority}">
                <div class="todo-header">
                    <h3 class="todo-title">${this.escapeHtml(todo.title)}</h3>
                    <div class="todo-actions">
                        <span class="status-badge status-${todo.status}">
                            ${this.formatStatus(todo.status)}
                        </span>
                        <span class="priority-badge priority-${todo.priority}">
                            <i class="fas fa-flag"></i> ${todo.priority.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                ${todo.description ? `
                    <div class="todo-description">${this.escapeHtml(todo.description)}</div>
                ` : ''}
                
                <div class="todo-footer">
                    <span class="due-date">
                        <i class="fas fa-calendar"></i> 
                        Due: ${new Date(todo.due_date).toLocaleDateString()}
                    </span>
                    <div class="action-buttons">
                        ${todo.status !== 'completed' ? `
                            <button class="btn btn-success btn-sm" onclick="window.todosModule.updateTodoStatus(${todo.id}, 'completed')">
                                <i class="fas fa-check"></i> Complete
                            </button>
                        ` : `
                            <button class="btn btn-warning btn-sm" onclick="window.todosModule.updateTodoStatus(${todo.id}, 'pending')">
                                <i class="fas fa-redo"></i> Reopen
                            </button>
                        `}
                        <button class="btn btn-error btn-sm" onclick="window.todosModule.deleteTodo(${todo.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                
                ${todo.status === 'completed' && todo.completed_at ? `
                    <div class="todo-completed">
                        <small>Completed on: ${new Date(todo.completed_at).toLocaleDateString()}</small>
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        console.log('Todos rendered successfully');
    }

    getFilteredTodos() {
        const now = new Date();
        
        switch (this.currentFilter) {
            case 'pending':
                return this.todos.filter(todo => todo.status === 'pending');
            case 'in_progress':
                return this.todos.filter(todo => todo.status === 'in_progress');
            case 'completed':
                return this.todos.filter(todo => todo.status === 'completed');
            case 'overdue':
                return this.todos.filter(todo => 
                    todo.due_date && 
                    new Date(todo.due_date) < now && 
                    todo.status !== 'completed'
                );
            case 'high_priority':
                return this.todos.filter(todo => todo.priority === 'high');
            default:
                return this.todos;
        }
    }

    setFilter(filter) {
        console.log('Setting filter to:', filter);
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTodos();
    }

    handleAddTodo(event) {
        event.preventDefault();
        console.log('Handling add todo');
        
        const titleInput = document.getElementById('todo-title');
        const descriptionInput = document.getElementById('todo-description');
        const prioritySelect = document.getElementById('todo-priority');
        const dueDateInput = document.getElementById('todo-due-date');
        
        const newTodo = {
            id: Date.now(), // Simple ID generation
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            priority: prioritySelect.value,
            due_date: dueDateInput.value || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days from now
            status: 'pending',
            created_at: new Date().toISOString(),
            is_overdue: false
        };
        
        if (!newTodo.title) {
            this.showMessage('Please enter a task title', 'error');
            return;
        }
        
        this.todos.unshift(newTodo); // Add to beginning
        this.renderStats();
        this.renderTodos();
        
        // Reset form
        titleInput.value = '';
        descriptionInput.value = '';
        prioritySelect.value = 'medium';
        dueDateInput.value = '';
        
        this.showMessage('Task added successfully!', 'success');
    }

    updateTodoStatus(todoId, newStatus) {
        console.log('Updating todo status:', todoId, newStatus);
        const todoIndex = this.todos.findIndex(todo => todo.id === todoId);
        if (todoIndex === -1) return;
        
        this.todos[todoIndex].status = newStatus;
        
        if (newStatus === 'completed') {
            this.todos[todoIndex].completed_at = new Date().toISOString();
        } else {
            this.todos[todoIndex].completed_at = null;
        }
        
        this.renderStats();
        this.renderTodos();
        this.showMessage('Task updated successfully!', 'success');
    }

    deleteTodo(todoId) {
        console.log('Deleting todo:', todoId);
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        
        this.todos = this.todos.filter(todo => todo.id !== todoId);
        this.renderStats();
        this.renderTodos();
        this.showMessage('Task deleted successfully!', 'success');
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'PENDING',
            'in_progress': 'IN PROGRESS', 
            'completed': 'COMPLETED'
        };
        return statusMap[status] || status.toUpperCase();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        const container = document.getElementById('todos-container');
        if (container) {
            container.innerHTML = '<div class="loading">Loading tasks...</div>';
        }
    }

    showMessage(message, type = 'success') {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = type === 'success' ? 'success-message' : 'error-message';
        messageEl.style.marginTop = '1rem';
        messageEl.style.marginBottom = '1rem';
        messageEl.textContent = message;
        
        const container = document.querySelector('.todos-container');
        if (container) {
            container.insertBefore(messageEl, container.firstChild);
            
            // Remove message after 3 seconds
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 3000);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing TodosModule...');
    window.todosModule = new TodosModule();
});