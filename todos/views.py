from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Todo
from .serializers import TodoSerializer

class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        todo = self.get_object()
        todo.status = 'completed'
        todo.save()
        serializer = self.get_serializer(todo)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_in_progress(self, request, pk=None):
        todo = self.get_object()
        todo.status = 'in_progress'
        todo.save()
        serializer = self.get_serializer(todo)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_pending(self, request, pk=None):
        todo = self.get_object()
        todo.status = 'pending'
        todo.save()
        serializer = self.get_serializer(todo)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        todos = self.get_queryset().filter(status='completed')
        serializer = self.get_serializer(todos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        todos = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(todos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        todos = self.get_queryset().filter(status='in_progress')
        serializer = self.get_serializer(todos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        todos = self.get_queryset().filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        )
        serializer = self.get_serializer(todos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def high_priority(self, request):
        todos = self.get_queryset().filter(priority='high')
        serializer = self.get_serializer(todos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        todos = self.get_queryset()
        total = todos.count()
        completed = todos.filter(status='completed').count()
        pending = todos.filter(status='pending').count()
        in_progress = todos.filter(status='in_progress').count()
        overdue = todos.filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        ).count()
        
        return Response({
            'total': total,
            'completed': completed,
            'pending': pending,
            'in_progress': in_progress,
            'overdue': overdue,
            'completion_rate': round((completed / total * 100) if total > 0 else 0, 2)
        })
