from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import transaction
from django.utils import timezone

from .models import Event, EventRegistration
from .serializers import EventSerializer, EventRegistrationSerializer

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Event.objects.filter(is_active=True)
        
        # Filter by event type
        event_type = self.request.query_params.get('type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(start_date__gte=start_date, end_date__lte=end_date)
        
        return queryset.order_by('-start_date')
    
    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        event = self.get_object()
        student = request.user
        
        if student.user_type != 'student':
            return Response(
                {'detail': 'Only students can register for events'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if EventRegistration.objects.filter(student=student, event=event).exists():
            return Response(
                {'detail': 'Already registered for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if event.is_full:
            registration = EventRegistration(
                student=student,
                event=event,
                status='waiting'
            )
            registration.save()
            return Response(
                {'detail': 'Added to waiting list - event is full'},
                status=status.HTTP_200_OK
            )
        
        with transaction.atomic():
            registration = EventRegistration(student=student, event=event)
            registration.save()
            event.current_participants += 1
            event.save()
        
        serializer = EventRegistrationSerializer(registration)
        return Response(
            {'detail': 'Successfully registered for event', 'registration': serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def unregister(self, request, pk=None):
        event = self.get_object()
        student = request.user
        
        try:
            registration = EventRegistration.objects.get(student=student, event=event)
            
            with transaction.atomic():
                if registration.status == 'registered':
                    event.current_participants -= 1
                    event.save()
                
                # Move first waiting list participant to registered
                waiting_registration = EventRegistration.objects.filter(
                    event=event, status='waiting'
                ).first()
                
                if waiting_registration:
                    waiting_registration.status = 'registered'
                    waiting_registration.save()
                    event.current_participants += 1
                    event.save()
                
                registration.delete()
                
            return Response({'detail': 'Successfully unregistered from event'})
            
        except EventRegistration.DoesNotExist:
            return Response(
                {'detail': 'Not registered for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def my_events(self, request):
        registrations = EventRegistration.objects.filter(
            student=request.user,
            status='registered'
        ).select_related('event')
        
        events = [reg.event for reg in registrations]
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

class EventRegistrationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return EventRegistration.objects.all()
        return EventRegistration.objects.filter(student=self.request.user)