from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'results', views.ResultViewSet, basename='result')
# Comment out the transcript router for now
# router.register(r'transcripts', views.TranscriptRequestViewSet, basename='transcript')

urlpatterns = [
    path('', include(router.urls)),
]