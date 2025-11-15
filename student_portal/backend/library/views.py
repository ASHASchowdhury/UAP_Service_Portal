from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from datetime import timedelta
from .models import Book, Loan, Reservation
from .serializers import BookSerializer, LoanSerializer, ReservationSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return Loan.objects.all().select_related('book', 'user')
        return Loan.objects.filter(user=self.request.user).select_related('book')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_loans(self, request):
        loans = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(loans, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        loan = self.get_object()
        if loan.status == 'borrowed':
            loan.status = 'returned'
            loan.returned_date = timezone.now()
            loan.save()
            
            # Update book availability
            book = loan.book
            book.available_copies += 1
            book.save()
            
            return Response({'detail': 'Book returned successfully'})
        return Response(
            {'detail': 'Book already returned'},
            status=status.HTTP_400_BAD_REQUEST
        )

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return Reservation.objects.all().select_related('book', 'user')
        return Reservation.objects.filter(user=self.request.user).select_related('book')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_reservations(self, request):
        reservations = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(reservations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status == 'pending':
            reservation.status = 'cancelled'
            reservation.save()
            return Response({'detail': 'Reservation cancelled successfully'})
        return Response(
            {'detail': 'Cannot cancel this reservation'},
            status=status.HTTP_400_BAD_REQUEST
        )
