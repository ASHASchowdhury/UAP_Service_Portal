from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('token/refresh/', views.refresh_token_view, name='token_refresh'),
    path('profile/', views.profile_view, name='profile'),
    path('student-profile/', views.student_profile_view, name='student-profile'),
]
