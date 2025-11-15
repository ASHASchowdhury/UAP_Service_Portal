from django.db import models
from users.models import User

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=13, unique=True)
    category = models.CharField(max_length=100, blank=True)
    publisher = models.CharField(max_length=100, blank=True)
    publication_year = models.IntegerField(null=True, blank=True)
    total_copies = models.IntegerField(default=1)
    available_copies = models.IntegerField(default=1)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title

class Loan(models.Model):
    LOAN_STATUS = (
        ('borrowed', 'Borrowed'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
    )
    
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    borrowed_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    returned_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=LOAN_STATUS, default='borrowed')
    renewal_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-borrowed_date']

    def __str__(self):
        return f"{self.user.username} - {self.book.title}"

    @property
    def book_title(self):
        return self.book.title

    @property
    def overdue(self):
        from django.utils import timezone
        return self.due_date < timezone.now() and self.status == 'borrowed'

class Reservation(models.Model):
    RESERVATION_STATUS = (
        ('pending', 'Pending'),
        ('available', 'Available'),
        ('cancelled', 'Cancelled'),
        ('fulfilled', 'Fulfilled'),
    )
    
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reserved_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField()
    status = models.CharField(max_length=10, choices=RESERVATION_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['reserved_date']

    def __str__(self):
        return f"{self.user.username} - {self.book.title}"

    @property
    def book_title(self):
        return self.book.title
