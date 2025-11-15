from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Q
from .models import Course, CourseRegistration, Notice, ClassSchedule
from .serializers import CourseSerializer, CourseRegistrationSerializer, NoticeSerializer, ClassScheduleSerializer

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        course = self.get_object()
        
        # Check if already registered
        existing_registration = CourseRegistration.objects.filter(
            student=request.user,
            course=course,
            status='registered'
        ).exists()
        
        if existing_registration:
            return Response(
                {'detail': 'Already registered for this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check course capacity
        if course.current_students >= course.max_students:
            return Response(
                {'detail': 'Course is full'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Register the course
        registration = CourseRegistration.objects.create(
            student=request.user,
            course=course,
            status='registered'
        )
        
        # Update course enrollment
        course.current_students += 1
        course.save()
        
        return Response({'detail': 'Course registered successfully'})

    @action(detail=True, methods=['post'])
    def drop(self, request, pk=None):
        course = self.get_object()
        try:
            registration = CourseRegistration.objects.get(
                student=request.user, 
                course=course, 
                status='registered'
            )
            registration.status = 'dropped'
            registration.save()
            
            # Update course enrollment
            course.current_students -= 1
            course.save()
            
            return Response({'detail': 'Course dropped successfully'})
        except CourseRegistration.DoesNotExist:
            return Response(
                {'detail': 'Not registered for this course'},
                status=status.HTTP_400_BAD_REQUEST
            )

class CourseRegistrationViewSet(viewsets.ModelViewSet):
    serializer_class = CourseRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return CourseRegistration.objects.all().select_related('student', 'course')
        return CourseRegistration.objects.filter(student=self.request.user).select_related('course')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

class NoticeViewSet(viewsets.ModelViewSet):
    queryset = Notice.objects.all().order_by('-created_at')
    serializer_class = NoticeSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

class ClassScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassSchedule.objects.all().order_by('day_of_week', 'start_time')
    serializer_class = ClassScheduleSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
