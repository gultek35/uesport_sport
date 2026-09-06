from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserSetupViewSet

router = DefaultRouter()
router.register(r'user-setup', UserSetupViewSet, basename='user-setup')
router.register(r'user-profile', UserProfileViewSet, basename='user-profile')

urlpatterns = [
    path('', include(router.urls)),
]