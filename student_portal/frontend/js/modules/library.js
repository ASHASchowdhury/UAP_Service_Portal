class LibraryModule {
    static async loadLibrary() {
        try {
            console.log('Loading library data...');
            
            // Show loading states
            this.showLoadingStates();
            
            // Load data
            const [books, loans, reservations] = await Promise.all([
                api.getBooks().catch(() => []),
                api.getBorrowedBooks().catch(() => []),
                api.getMyReservations().catch(() => [])
            ]);

            this.renderBooks(books);
            this.renderBorrowedBooks(loans);
            this.renderReservations(reservations);
            this.setupSearch();
            
        } catch (error) {
            console.error('Failed to load library data:', error);
            this.showError('Failed to load library data');
        }
    }

    static showLoadingStates() {
        const containers = [
            'book-results',
            'borrowed-books-list', 
            'reservations-list'
        ];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<div class="loading">Loading...</div>';
            }
        });
    }

    static renderBooks(books) {
        const container = document.getElementById('book-results');
        if (!container) return;
        
        if (!books || books.length === 0) {
            container.innerHTML = '<div class="loading">No books found in the library</div>';
            return;
        }

        container.innerHTML = books.map(book => this.createBookCard(book)).join('');
    }

    static createBookCard(book) {
        const availableCopies = book.available_copies || 0;
        const totalCopies = book.total_copies || 0;
        const canBorrow = availableCopies > 0;
        const availabilityClass = availableCopies === 0 ? 'unavailable' : 
                                 availableCopies < 3 ? 'limited' : 'available';

        return `
            <div class="book-card ${availableCopies === 0 ? 'unavailable' : ''}" data-book-id="${book.id}">
                ${book.cover_image ? 
                    `<div class="book-cover">
                        <img src="${book.cover_image}" alt="${book.title}" onerror="this.style.display='none'">
                    </div>` : 
                    `<div class="book-cover">
                        <i class="fas fa-book"></i>
                    </div>`
                }
                
                <div class="book-content">
                    <div class="book-header">
                        <h3 class="book-title">${this.escapeHtml(book.title) || 'Untitled Book'}</h3>
                        <span class="book-isbn">ISBN: ${book.isbn || 'No ISBN'}</span>
                    </div>
                    
                    <div class="book-meta">
                        <p><strong>Author:</strong> ${this.escapeHtml(book.author) || 'Unknown'}</p>
                        <p><strong>Publisher:</strong> ${this.escapeHtml(book.publisher) || 'Unknown'} (${book.publication_year || 'N/A'})</p>
                        <p><strong>Category:</strong> ${this.escapeHtml(book.category) || 'General'}</p>
                        <p><strong>Location:</strong> ${this.escapeHtml(book.location) || 'Main Library'}</p>
                        <p><strong>Available:</strong> 
                            <span class="availability-badge availability-${availabilityClass}">
                                <i class="fas ${availableCopies > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                ${availableCopies}/${totalCopies}
                            </span>
                        </p>
                    </div>
                    
                    ${book.description ? 
                        `<div class="book-description">${this.escapeHtml(book.description)}</div>` : ''}
                    
                    <div class="book-actions">
                        ${canBorrow ? 
                            `<button class="btn btn-success" onclick="LibraryModule.borrowBook(${book.id})">
                                <i class="fas fa-book"></i> Borrow Book
                            </button>` :
                            `<button class="btn btn-warning" onclick="LibraryModule.reserveBook(${book.id})">
                                <i class="fas fa-clock"></i> Reserve
                            </button>`
                        }
                        <button class="btn btn-outline" onclick="LibraryModule.showBookDetails(${book.id})">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    static renderBorrowedBooks(loans) {
        const container = document.getElementById('borrowed-books-list');
        if (!container) return;
        
        if (!loans || loans.length === 0) {
            container.innerHTML = '<div class="loading">No borrowed books</div>';
            return;
        }

        container.innerHTML = loans.map(loan => this.createLoanCard(loan)).join('');
    }

    static createLoanCard(loan) {
        const dueDate = new Date(loan.due_date);
        const today = new Date();
        const isOverdue = loan.is_overdue || (dueDate < today && loan.status === 'borrowed');
        const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const canRenew = !isOverdue && loan.renewal_count < 2 && loan.status === 'borrowed';

        return `
            <div class="loan-card ${isOverdue ? 'overdue' : ''}">
                <div class="loan-header">
                    <h4 class="loan-title">${this.escapeHtml(loan.book_title || loan.book_details?.title || 'Unknown Book')}</h4>
                    <span class="status-badge ${loan.status === 'borrowed' ? 'status-borrowed' : 'status-returned'}">
                        ${loan.status.toUpperCase()}
                    </span>
                </div>
                
                <div class="loan-details">
                    <p><strong>Author:</strong> ${this.escapeHtml(loan.book_author || loan.book_details?.author || 'Unknown')}</p>
                    <p><strong>Borrowed:</strong> ${this.formatDate(loan.borrow_date)}</p>
                    <p><strong>Due Date:</strong> ${this.formatDate(loan.due_date)}</p>
                    <p><strong>Renewals Used:</strong> ${loan.renewal_count || 0}/2</p>
                </div>
                
                ${loan.status === 'borrowed' ? `
                    <div class="loan-status ${isOverdue ? 'overdue' : daysRemaining < 3 ? 'warning' : 'good'}">
                        <i class="fas ${isOverdue ? 'fa-exclamation-circle' : 'fa-clock'}"></i>
                        ${isOverdue ? 
                            `OVERDUE! ${Math.abs(daysRemaining)} days late` :
                            `${daysRemaining} days remaining`
                        }
                    </div>
                ` : ''}
                
                <div class="book-actions">
                    ${canRenew ? 
                        `<button class="btn btn-primary btn-sm" onclick="LibraryModule.renewBook(${loan.id})">
                            <i class="fas fa-redo"></i> Renew (${2 - (loan.renewal_count || 0)} left)
                        </button>` : ''
                    }
                    ${loan.status === 'borrowed' ? 
                        `<button class="btn btn-success btn-sm" onclick="LibraryModule.returnBook(${loan.id})">
                            <i class="fas fa-check"></i> Return Book
                        </button>` : ''
                    }
                </div>
            </div>
        `;
    }

    static renderReservations(reservations) {
        const container = document.getElementById('reservations-list');
        if (!container) return;
        
        if (!reservations || reservations.length === 0) {
            container.innerHTML = '<div class="loading">No active reservations</div>';
            return;
        }

        container.innerHTML = reservations.map(reservation => this.createReservationCard(reservation)).join('');
    }

    static createReservationCard(reservation) {
        const expiryDate = new Date(reservation.expiry_date);
        const today = new Date();
        const isExpired = expiryDate < today;

        return `
            <div class="reservation-card ${isExpired ? 'expired' : ''}">
                <div class="reservation-header">
                    <h4 class="reservation-title">${this.escapeHtml(reservation.book_title || reservation.book_details?.title || 'Unknown Book')}</h4>
                    <span class="status-badge status-${reservation.status}">
                        ${reservation.status.toUpperCase()}
                    </span>
                </div>
                
                <div class="reservation-details">
                    <p><strong>Author:</strong> ${this.escapeHtml(reservation.book_author || reservation.book_details?.author || 'Unknown')}</p>
                    <p><strong>Reserved:</strong> ${this.formatDate(reservation.reservation_date)}</p>
                    <p><strong>Expires:</strong> ${this.formatDate(reservation.expiry_date)}</p>
                    ${isExpired ? 
                        '<p class="text-error"><i class="fas fa-exclamation-triangle"></i> This reservation has expired</p>' : ''}
                </div>
                
                ${(reservation.status === 'pending' || reservation.status === 'available') && !isExpired ? `
                    <div class="book-actions">
                        <button class="btn btn-danger btn-sm" onclick="LibraryModule.cancelReservation(${reservation.id})">
                            <i class="fas fa-times"></i> Cancel Reservation
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // CRUD Operations
    static async borrowBook(bookId) {
        if (!confirm('Are you sure you want to borrow this book?')) return;
        
        try {
            const result = await api.borrowBook(bookId);
            alert(result.detail || 'Book borrowed successfully!');
            this.loadLibrary();
        } catch (error) {
            console.error('Failed to borrow book:', error);
            alert(error.detail || 'Failed to borrow book');
        }
    }

    static async returnBook(loanId) {
        if (!confirm('Mark this book as returned?')) return;
        
        try {
            const result = await api.returnBook(loanId);
            alert(result.detail || 'Book returned successfully!');
            this.loadLibrary();
        } catch (error) {
            console.error('Failed to return book:', error);
            alert(error.detail || 'Failed to return book');
        }
    }

    static async renewBook(loanId) {
        if (!confirm('Renew this book for another 14 days?')) return;
        
        try {
            const result = await api.renewBook(loanId);
            alert(`${result.detail}\nNew due date: ${result.new_due_date}`);
            this.loadLibrary();
        } catch (error) {
            console.error('Failed to renew book:', error);
            alert(error.detail || 'Failed to renew book');
        }
    }

    static async reserveBook(bookId) {
        if (!confirm('Reserve this book? You will be notified when it becomes available.')) return;
        
        try {
            const result = await api.reserveBook(bookId);
            alert(result.detail || 'Book reserved successfully!');
            this.loadLibrary();
        } catch (error) {
            console.error('Failed to reserve book:', error);
            alert(error.detail || 'Failed to reserve book');
        }
    }

    static async cancelReservation(reservationId) {
        if (!confirm('Cancel this reservation?')) return;
        
        try {
            const result = await api.cancelReservation(reservationId);
            alert(result.detail || 'Reservation cancelled successfully!');
            this.loadLibrary();
        } catch (error) {
            console.error('Failed to cancel reservation:', error);
            alert(error.detail || 'Failed to cancel reservation');
        }
    }

    // Utility Methods
    static escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    static formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    static setupSearch() {
        const searchInput = document.getElementById('book-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const bookCards = document.querySelectorAll('.book-card');
                
                bookCards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(searchTerm) ? 'block' : 'none';
                });
            });
        }
    }

    static showBookDetails(bookId) {
        alert('Book details for ID: ' + bookId);
    }

    static showError(message) {
        alert('Error: ' + message);
    }
}
window.LibraryModule = LibraryModule;