from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login
from .models import User, StudentProfile
from .serializers import UserSerializer, StudentProfileSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"Login attempt for user: {username}")  # Debug log
    
    if not username or not password:
        return Response(
            {'detail': 'Username and password are required'}, 
            status=400
        )
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        update_last_login(None, user)
        
        user_data = UserSerializer(user).data
        
        print(f"Login successful for user: {username}")  # Debug log
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_data
        })
    else:
        print(f"Login failed for user: {username}")  # Debug log
        return Response(
            {'detail': 'Invalid credentials'}, 
            status=401
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_token_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        return Response({
            'access': str(token.access_token),
        })
    except Exception as e:
        return Response(
            {'detail': 'Invalid refresh token'},
            status=401
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_profile_view(request):
    try:
        profile = StudentProfile.objects.get(user=request.user)
        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data)
    except StudentProfile.DoesNotExist:
        return Response(
            {'detail': 'Student profile not found'},
            status=404
        )
