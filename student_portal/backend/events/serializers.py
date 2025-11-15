from rest_framework import serializers
from .models import Event, EventRegistration

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.get_full_name', read_only=True)
    is_full = serializers.ReadOnlyField()
    current_participants_count = serializers.ReadOnlyField(source='current_participants')
    
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['organizer', 'current_participants', 'created_at', 'updated_at']

class EventRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    event_details = EventSerializer(source='event', read_only=True)
    
    class Meta:
        model = EventRegistration
        fields = '__all__'
        read_only_fields = ['student', 'registration_date']