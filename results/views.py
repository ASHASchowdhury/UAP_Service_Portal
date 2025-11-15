from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Avg, Sum, Count
from django.db import models

from .models import Result, TranscriptRequest
from .serializers import ResultSerializer, TranscriptRequestSerializer

class ResultViewSet(viewsets.ModelViewSet):
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return Result.objects.all().select_related('student', 'course')
        return Result.objects.filter(student=self.request.user).select_related('course')
    
    @action(detail=False, methods=['get'])
    def my_results(self, request):
        results = self.get_queryset().filter(student=request.user)
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def semester_results(self, request):
        semester = request.query_params.get('semester')
        year = request.query_params.get('year')
        
        if not semester or not year:
            return Response(
                {'detail': 'Semester and year parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = self.get_queryset().filter(
            student=request.user,
            semester=semester,
            year=year
        )
        
        serializer = self.get_serializer(results, many=True)
        
        # Calculate semester statistics
        total_credits = sum(result.course.credits for result in results)
        total_grade_points = sum(float(result.grade_points) * result.course.credits for result in results)
        sgpa = total_grade_points / total_credits if total_credits > 0 else 0
        
        return Response({
            'results': serializer.data,
            'statistics': {
                'semester': semester,
                'year': year,
                'total_courses': len(results),
                'total_credits': total_credits,
                'sgpa': round(sgpa, 2)
            }
        })
    
    @action(detail=False, methods=['get'])
    def cgpa(self, request):
        results = self.get_queryset().filter(student=request.user)
        
        total_credits = sum(result.course.credits for result in results)
        total_grade_points = sum(float(result.grade_points) * result.course.credits for result in results)
        cgpa = total_grade_points / total_credits if total_credits > 0 else 0
        
        return Response({
            'cgpa': round(cgpa, 2),
            'total_credits_completed': total_credits,
            'total_courses': len(results)
        })

class TranscriptRequestViewSet(viewsets.ModelViewSet):
    serializer_class = TranscriptRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return TranscriptRequest.objects.all().select_related('student')
        return TranscriptRequest.objects.filter(student=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(student=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        transcript_request = self.get_object()
        if transcript_request.status == 'pending':
            transcript_request.status = 'cancelled'
            transcript_request.save()
            return Response({'detail': 'Request cancelled successfully'})
        return Response(
            {'detail': 'Cannot cancel this request'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
