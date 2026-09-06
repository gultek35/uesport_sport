from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ResultBatch, MeasurementResult, DerivedMeasurementResult
from .serializers import (
    ResultBatchSerializer,
    MeasurementResultSerializer,
    DerivedMeasurementResultSerializer
)

class ResultBatchViewSet(viewsets.ModelViewSet):
    queryset = ResultBatch.objects.all()
    serializer_class = ResultBatchSerializer
    permission_classes = [permissions.AllowAny]  # Değiştirildi

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        batch = self.get_object()
        if batch.status == 'PENDING':
            batch.status = 'PROCESSING'
            batch.save()
            # TODO: Celery task'ini burada tetikle
            return Response({'status': 'processing_started'})
        return Response({'error': 'Only PENDING can be processed'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        batch = self.get_object()
        if batch.status in ['COMPLETED', 'FAILED']:
            batch.status = 'RECALCULATING'
            batch.save()
            # TODO: Yeniden hesaplama mantığını burada tetikle
            return Response({'status': 'recalculating'})
        return Response({'error': 'Only COMPLETED/FAILED can be recalculated'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        batch = self.get_object()
        return Response({
            'batch_id': batch.id,
            'status': batch.status,
            'total_results': batch.total_results,
            'total_derived': batch.total_derived,
            'validation_errors_count': batch.validation_errors_count,
            'completed_at': batch.completed_at,
        })

class MeasurementResultViewSet(viewsets.ModelViewSet):
    queryset = MeasurementResult.objects.all()
    serializer_class = MeasurementResultSerializer
    permission_classes = [permissions.AllowAny]  # Değiştirildi

    @action(detail=True, methods=['post'])
    def retract(self, request, pk=None):
        result = self.get_object()
        if result.status == 'PUBLISHED':
            result.status = 'RETRACTED'
            result.retraction_reason = request.data.get('retraction_reason', '')
            result.save()
            return Response({'status': 'retracted'})
        return Response({'error': 'Only PUBLISHED can be retracted'}, status=status.HTTP_400_BAD_REQUEST)

class DerivedMeasurementResultViewSet(viewsets.ModelViewSet):
    queryset = DerivedMeasurementResult.objects.all()
    serializer_class = DerivedMeasurementResultSerializer
    permission_classes = [permissions.AllowAny]  # Değiştirildi

    @action(detail=True, methods=['post'])
    def retract(self, request, pk=None):
        result = self.get_object()
        if result.status == 'PUBLISHED':
            result.status = 'RETRACTED'
            result.retraction_reason = request.data.get('retraction_reason', '')
            result.save()
            return Response({'status': 'retracted'})
        return Response({'error': 'Only PUBLISHED can be retracted'}, status=status.HTTP_400_BAD_REQUEST)