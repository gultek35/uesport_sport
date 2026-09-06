from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone  # EKLENDİ
from .models import ExecutionSession, ExecutionRun, ExecutionAttempt, ExecutionDeviation
from .serializers import (
    ExecutionSessionSerializer,
    ExecutionRunSerializer,
    ExecutionAttemptSerializer,
    ExecutionDeviationSerializer
)

class ExecutionSessionViewSet(viewsets.ModelViewSet):
    queryset = ExecutionSession.objects.all()
    serializer_class = ExecutionSessionSerializer
    permission_classes = [permissions.AllowAny]  # DEĞİŞTİRİLDİ

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        session = self.get_object()
        if session.status == 'IN_PROGRESS':
            session.status = 'PAUSED'
            session.save()
            return Response({'status': 'paused'})
        return Response({'error': 'Only IN_PROGRESS can be paused'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        session = self.get_object()
        if session.status == 'PAUSED':
            session.status = 'IN_PROGRESS'
            session.save()
            return Response({'status': 'resumed'})
        return Response({'error': 'Only PAUSED can be resumed'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        session = self.get_object()
        if session.status in ['IN_PROGRESS', 'PAUSED']:
            session.status = 'COMPLETED'
            session.completed_at = timezone.now()
            session.save()
            return Response({'status': 'completed'})
        return Response({'error': 'Only IN_PROGRESS/PAUSED can be completed'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def abort(self, request, pk=None):
        session = self.get_object()
        if session.status not in ['COMPLETED', 'ABORTED']:
            session.status = 'ABORTED'
            session.save()
            return Response({'status': 'aborted'})
        return Response({'error': 'Cannot abort completed session'}, status=status.HTTP_400_BAD_REQUEST)

class ExecutionRunViewSet(viewsets.ModelViewSet):
    queryset = ExecutionRun.objects.all()
    serializer_class = ExecutionRunSerializer
    permission_classes = [permissions.AllowAny]  # DEĞİŞTİRİLDİ

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        run = self.get_object()
        if run.status == 'IN_PROGRESS':
            run.status = 'COMPLETED'
            run.completed_at = timezone.now()
            run.save()
            return Response({'status': 'completed'})
        return Response({'error': 'Only IN_PROGRESS can be completed'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def skip(self, request, pk=None):
        run = self.get_object()
        if run.status == 'PENDING':
            run.status = 'SKIPPED'
            run.save()
            return Response({'status': 'skipped'})
        return Response({'error': 'Only PENDING can be skipped'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def abort(self, request, pk=None):
        run = self.get_object()
        if run.status == 'IN_PROGRESS':
            run.status = 'ABORTED'
            run.save()
            return Response({'status': 'aborted'})
        return Response({'error': 'Only IN_PROGRESS can be aborted'}, status=status.HTTP_400_BAD_REQUEST)

class ExecutionAttemptViewSet(viewsets.ModelViewSet):
    queryset = ExecutionAttempt.objects.all()
    serializer_class = ExecutionAttemptSerializer
    permission_classes = [permissions.AllowAny]  # DEĞİŞTİRİLDİ

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        attempt = self.get_object()
        is_valid = request.data.get('is_valid')
        if is_valid is not None:
            attempt.is_valid = is_valid
            attempt.save()
            return Response({'is_valid': attempt.is_valid})
        return Response({'error': 'is_valid field required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def set_best(self, request, pk=None):
        attempt = self.get_object()
        # Önce aynı run'daki diğer attempt'ların is_best'ini false yap
        ExecutionAttempt.objects.filter(run=attempt.run).update(is_best=False)
        attempt.is_best = True
        attempt.save()
        return Response({'is_best': True})

class ExecutionDeviationViewSet(viewsets.ModelViewSet):
    queryset = ExecutionDeviation.objects.all()
    serializer_class = ExecutionDeviationSerializer
    permission_classes = [permissions.AllowAny]  # DEĞİŞTİRİLDİ

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        deviation = self.get_object()
        if deviation.severity == 'CRITICAL':
            deviation.approved_by = request.user.id if request.user else None
            deviation.save()
            return Response({'approved': True})
        return Response({'error': 'Only CRITICAL deviations require approval'}, status=status.HTTP_400_BAD_REQUEST)