from django.db import models
from users.models import User
from courses.models import Course

class Result(models.Model):
    GRADE_CHOICES = (
        ('A+', 'A+ (4.0)'),
        ('A', 'A (4.0)'),
        ('A-', 'A- (3.7)'),
        ('B+', 'B+ (3.3)'),
        ('B', 'B (3.0)'),
        ('B-', 'B- (2.7)'),
        ('C+', 'C+ (2.3)'),
        ('C', 'C (2.0)'),
        ('F', 'F (0.0)'),
    )
    
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    semester = models.IntegerField()
    year = models.IntegerField()
    marks = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=2, choices=GRADE_CHOICES)
    grade_points = models.DecimalField(max_digits=3, decimal_places=2)
    published = models.BooleanField(default=True)
    published_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'course', 'semester', 'year']
        ordering = ['-year', '-semester', 'course__code']
    
    def save(self, *args, **kwargs):
        # Calculate grade points based on grade
        grade_points_map = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'F': 0.0
        }
        self.grade_points = grade_points_map.get(self.grade, 0.0)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.username} - {self.course.code} - {self.grade}"

class TranscriptRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('ready', 'Ready for Download'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    request_date = models.DateTimeField(auto_now_add=True)
    purpose = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    processed_date = models.DateTimeField(null=True, blank=True)
    download_url = models.URLField(blank=True)
    
    class Meta:
        ordering = ['-request_date']
    
    def __str__(self):
        return f"Transcript Request - {self.student.username}"
