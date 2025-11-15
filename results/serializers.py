from rest_framework import serializers
from .models import Result, TranscriptRequest

class ResultSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = Result
        fields = ['id', 'course', 'course_code', 'course_name', 'marks', 'grade', 'grade_points', 'semester', 'year', 'published']

class TranscriptRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranscriptRequest
        fields = ['id', 'purpose', 'status', 'request_date', 'processed_date', 'download_url']
