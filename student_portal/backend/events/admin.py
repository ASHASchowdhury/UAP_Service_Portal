from django.contrib import admin
from .models import Event, EventRegistration

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'start_date', 'end_date', 'location', 'current_participants', 'max_participants', 'is_active']
    list_filter = ['event_type', 'is_active', 'start_date']
    search_fields = ['title', 'description', 'location']
    date_hierarchy = 'start_date'

@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ['student', 'event', 'registration_date', 'status']
    list_filter = ['status', 'registration_date']
    search_fields = ['student__username', 'event__title']