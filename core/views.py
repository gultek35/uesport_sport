from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AthleteProfile, Organization, Team, User
from .serializers import AthleteProfileSerializer, OrganizationSerializer, TeamSerializer

# ================== MEVCUT VIEWSET'LER ==================
class AthleteProfileViewSet(viewsets.ModelViewSet):
    queryset = AthleteProfile.objects.all()
    serializer_class = AthleteProfileSerializer
    permission_classes = [permissions.AllowAny]

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.AllowAny]

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.AllowAny]

# ================== USER SETUP VIEWSET ==================
class UserSetupViewSet(viewsets.ViewSet):
    """
    Kullanıcı kurulum işlemleri için ViewSet
    """
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        """
        Kullanıcının dil ve ülke tercihlerini kaydeder
        """
        try:
            user = request.user
            
            # 📌 Kullanıcı bilgilerini güncelle
            preferred_language = request.data.get('preferred_language')
            preferred_country = request.data.get('preferred_country')
            is_setup_completed = request.data.get('is_setup_completed', True)

            if preferred_language:
                user.preferred_language = preferred_language
            if preferred_country:
                user.preferred_country = preferred_country
            user.is_setup_completed = is_setup_completed
            user.save()

            return Response({
                'message': 'Kurulum başarıyla tamamlandı!',
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'preferred_language': user.preferred_language,
                    'preferred_country': user.preferred_country,
                    'is_setup_completed': user.is_setup_completed,
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        Kullanıcının kurulum durumunu kontrol eder
        """
        user = request.user
        return Response({
            'is_setup_completed': user.is_setup_completed,
            'preferred_language': user.preferred_language,
            'preferred_country': user.preferred_country,
        })

# ================== USER PROFILE VIEWSET (YENİ) ==================
class UserProfileViewSet(viewsets.ViewSet):
    """
    Kullanıcı profil bilgilerini getirir
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """
        Kullanıcı profil bilgilerini getir
        """
        user = request.user
        return Response({
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'preferred_language': user.preferred_language,
            'preferred_country': user.preferred_country,
            'is_setup_completed': user.is_setup_completed,
            'is_staff': user.is_staff,
        })