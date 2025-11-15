from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('courses', views.CourseViewSet, basename='course')
router.register('registrations', views.CourseRegistrationViewSet, basename='registration')
router.register('schedules', views.ClassScheduleViewSet, basename='schedule')
router.register('notices', views.NoticeViewSet, basename='notice')

urlpatterns = [
    path('', include(router.urls)),
]