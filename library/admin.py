from django.contrib import admin
from .models import Book, Loan, Reservation

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'isbn', 'category', 'available_copies', 'total_copies']
    list_filter = ['category', 'created_at']
    search_fields = ['title', 'author', 'isbn']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ['book', 'user', 'borrowed_date', 'due_date', 'status', 'overdue']
    list_filter = ['status', 'borrowed_date', 'due_date']
    search_fields = ['book__title', 'user__username', 'user__email']
    readonly_fields = ['borrowed_date', 'created_at']

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['book', 'user', 'reserved_date', 'expiry_date', 'status']
    list_filter = ['status', 'reserved_date']
    search_fields = ['book__title', 'user__username']
    readonly_fields = ['reserved_date', 'created_at']
