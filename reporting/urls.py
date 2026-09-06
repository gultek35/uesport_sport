from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AthleteReportViewSet

router = DefaultRouter()
router.register(r'athlete', AthleteReportViewSet, basename='athlete-report')

urlpatterns = [
    path('', include(router.urls)),
]