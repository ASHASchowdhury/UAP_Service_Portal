from rest_framework import serializers
from .models import Todo

class TodoSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Todo
        fields = [
            'id', 'user', 'user_name', 'title', 'description', 
            'priority', 'status', 'due_date', 'created_at', 
            'updated_at', 'completed_at', 'is_overdue'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'completed_at']
    
    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.due_date and obj.status != 'completed':
            return obj.due_date < timezone.now()
        return False
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
