from django.contrib import admin
from .models import Result, TranscriptRequest

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'semester', 'year', 'grade', 'published']
    list_filter = ['semester', 'year', 'grade', 'published']
    search_fields = ['student__username', 'course__code', 'course__name']

@admin.register(TranscriptRequest)
class TranscriptRequestAdmin(admin.ModelAdmin):
    list_display = ['student', 'request_date', 'status', 'processed_date']
    list_filter = ['status', 'request_date']
    search_fields = ['student__username', 'purpose']
