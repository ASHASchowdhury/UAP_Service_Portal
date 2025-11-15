from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('events', views.EventViewSet, basename='event')
router.register('registrations', views.EventRegistrationViewSet, basename='event-registration')

urlpatterns = [
    path('', include(router.urls)),
]