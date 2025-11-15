from rest_framework import serializers
from .models import Book, Loan, Reservation

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'isbn', 'category', 
                 'publisher', 'publication_year', 'total_copies', 
                 'available_copies', 'description']

class LoanSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    
    class Meta:
        model = Loan
        fields = ['id', 'book', 'book_title', 'borrowed_date', 
                 'due_date', 'returned_date', 'status', 'overdue']

class ReservationSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    
    class Meta:
        model = Reservation
        fields = ['id', 'book', 'book_title', 'reserved_date', 
                 'expiry_date', 'status']
