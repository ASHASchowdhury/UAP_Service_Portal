from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.conf.urls.static import static

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'message': 'Student Portal API',
        'endpoints': {
            'authentication': '/api/auth/',
            'courses': '/api/courses/',
            'results': '/api/results/',
            'library': '/api/library/',
            'events': '/api/events/',
            'admin': '/admin/',
        }
    })

def home_redirect(request):
    return redirect('/api/')

urlpatterns = [
    path('', home_redirect),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/results/', include('results.urls')),
    path('api/library/', include('library.urls')),
    path('api/events/', include('events.urls')),
    path('api/', api_root, name='api-root'),
    path('api/todos/', include('todos.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)