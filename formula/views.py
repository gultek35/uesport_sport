from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .services import FormulaEngine
from measurement.models import ResultBatch

class FormulaCalculateViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        batch_id = request.data.get('batch_id')
        if not batch_id:
            return Response({'error': 'batch_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = FormulaEngine.calculate_for_batch(batch_id)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def status(self, request):
        batch_id = request.query_params.get('batch_id')
        if not batch_id:
            return Response({'error': 'batch_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            batch = ResultBatch.objects.get(id=batch_id)
            return Response({
                'batch_id': str(batch.id),
                'status': batch.status,
                'total_derived': batch.total_derived,
                'completed_at': batch.completed_at,
            })
        except ResultBatch.DoesNotExist:
            return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)