from django.db import models
from users.models import User

class Course(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    credits = models.IntegerField()
    department = models.CharField(max_length=100)
    semester = models.IntegerField()
    max_students = models.IntegerField()
    current_students = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.code} - {self.name}"

class CourseRegistration(models.Model):
    STATUS_CHOICES = (
        ('registered', 'Registered'),
        ('waiting', 'Waiting List'),
        ('dropped', 'Dropped'),
    )
    
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    registration_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='registered')
    
    class Meta:
        unique_together = ['student', 'course']
    
    def __str__(self):
        return f"{self.student.username} - {self.course.code}"

class ClassSchedule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    day_of_week = models.IntegerField(choices=[(i, f'Day {i}') for i in range(1, 8)])
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=20)
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'user_type': 'faculty'})
    
    def __str__(self):
        return f"{self.course.code} - {self.get_day_of_week_display()} {self.start_time}"

class Notice(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_important = models.BooleanField(default=False)
    target_audience = models.CharField(max_length=50, choices=[('all', 'All'), ('students', 'Students'), ('faculty', 'Faculty')])
    
    def __str__(self):
        return self.title