from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated  # ADD THIS

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # ADD THIS
def api_root(request):
    return Response({
        'message': 'UAP Student Portal API',
        'endpoints': {
            'authentication': '/api/auth/',
            'courses': '/api/courses/',
            'results': '/api/results/',
            'library': '/api/library/',
            'admin': '/admin/',
        }
    })