from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    TestDefinition,
    TestProtocol,
    TestProtocolAssignment,
    TestMetricBinding,
    TestMethodBinding,
    TestEvidenceBinding,
    TestNormBinding,
    TestFormulaBinding,
    PopulationDefinition,
    PopulationSportContext,
    NormSet,
    ValidationRule
)
from .serializers import (
    TestDefinitionSerializer,
    TestProtocolSerializer,
    TestProtocolAssignmentSerializer,
    TestMetricBindingSerializer,
    TestMethodBindingSerializer,
    TestEvidenceBindingSerializer,
    TestNormBindingSerializer,
    TestFormulaBindingSerializer,
    PopulationDefinitionSerializer,
    PopulationSportContextSerializer,
    NormSetSerializer,
    ValidationRuleSerializer
)

# ================== TestDefinition ViewSet ==================
class TestDefinitionViewSet(viewsets.ModelViewSet):
    queryset = TestDefinition.objects.all()
    serializer_class = TestDefinitionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        lifecycle_status = self.request.query_params.get('lifecycle_status')
        if lifecycle_status:
            queryset = queryset.filter(lifecycle_status=lifecycle_status)
        return queryset

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        instance = self.get_object()
        if instance.lifecycle_status == 'DRAFT':
            instance.lifecycle_status = 'ACTIVE'
            instance.save()
            return Response({'status': 'published'})
        return Response({'error': 'Only DRAFT can be published'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def deprecate(self, request, pk=None):
        instance = self.get_object()
        if instance.lifecycle_status == 'ACTIVE':
            instance.lifecycle_status = 'DEPRECATED'
            instance.save()
            return Response({'status': 'deprecated'})
        return Response({'error': 'Only ACTIVE can be deprecated'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def retire(self, request, pk=None):
        instance = self.get_object()
        if instance.lifecycle_status == 'DEPRECATED':
            instance.lifecycle_status = 'RETIRED'
            instance.save()
            return Response({'status': 'retired'})
        return Response({'error': 'Only DEPRECATED can be retired'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def new_version(self, request, pk=None):
        instance = self.get_object()
        version_type = request.data.get('version_type', 'minor')
        if version_type == 'major':
            instance.version += 1
        else:
            instance.version += 0.1
        instance.save()
        return Response({'new_version': instance.version})

# ================== TestProtocol ViewSet ==================
class TestProtocolViewSet(viewsets.ModelViewSet):
    queryset = TestProtocol.objects.all()
    serializer_class = TestProtocolSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        instance = self.get_object()
        if instance.status == 'DRAFT':
            instance.status = 'ACTIVE'
            instance.save()
            return Response({'status': 'published'})
        return Response({'error': 'Only DRAFT can be published'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def deprecate(self, request, pk=None):
        instance = self.get_object()
        if instance.status == 'ACTIVE':
            instance.status = 'DEPRECATED'
            instance.save()
            return Response({'status': 'deprecated'})
        return Response({'error': 'Only ACTIVE can be deprecated'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def retire(self, request, pk=None):
        instance = self.get_object()
        if instance.status == 'DEPRECATED':
            instance.status = 'RETIRED'
            instance.save()
            return Response({'status': 'retired'})
        return Response({'error': 'Only DEPRECATED can be retired'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def new_version(self, request, pk=None):
        instance = self.get_object()
        version_type = request.data.get('version_type', 'minor')
        if version_type == 'major':
            instance.version += 1
        else:
            instance.version += 0.1
        instance.save()
        return Response({'new_version': instance.version})

# ================== Diğer ViewSet'ler (CRUD için basit) ==================
class TestProtocolAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TestProtocolAssignment.objects.all()
    serializer_class = TestProtocolAssignmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TestMetricBindingViewSet(viewsets.ModelViewSet):
    queryset = TestMetricBinding.objects.all()
    serializer_class = TestMetricBindingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TestMethodBindingViewSet(viewsets.ModelViewSet):
    queryset = TestMethodBinding.objects.all()
    serializer_class = TestMethodBindingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TestEvidenceBindingViewSet(viewsets.ModelViewSet):
    queryset = TestEvidenceBinding.objects.all()
    serializer_class = TestEvidenceBindingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TestNormBindingViewSet(viewsets.ModelViewSet):
    queryset = TestNormBinding.objects.all()
    serializer_class = TestNormBindingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TestFormulaBindingViewSet(viewsets.ModelViewSet):
    queryset = TestFormulaBinding.objects.all()
    serializer_class = TestFormulaBindingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class PopulationDefinitionViewSet(viewsets.ModelViewSet):
    queryset = PopulationDefinition.objects.all()
    serializer_class = PopulationDefinitionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class PopulationSportContextViewSet(viewsets.ModelViewSet):
    queryset = PopulationSportContext.objects.all()
    serializer_class = PopulationSportContextSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class NormSetViewSet(viewsets.ModelViewSet):
    queryset = NormSet.objects.all()
    serializer_class = NormSetSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        instance = self.get_object()
        if instance.lifecycle_status == 'DRAFT':
            instance.lifecycle_status = 'ACTIVE'
            instance.save()
            return Response({'status': 'published'})
        return Response({'error': 'Only DRAFT can be published'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def deprecate(self, request, pk=None):
        instance = self.get_object()
        if instance.lifecycle_status == 'ACTIVE':
            instance.lifecycle_status = 'DEPRECATED'
            instance.save()
            return Response({'status': 'deprecated'})
        return Response({'error': 'Only ACTIVE can be deprecated'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def retire(self, request, pk=None):
        instance = self.get_object()
        if instance.lifecycle_status == 'DEPRECATED':
            instance.lifecycle_status = 'RETIRED'
            instance.save()
            return Response({'status': 'retired'})
        return Response({'error': 'Only DEPRECATED can be retired'}, status=status.HTTP_400_BAD_REQUEST)

class ValidationRuleViewSet(viewsets.ModelViewSet):
    queryset = ValidationRule.objects.all()
    serializer_class = ValidationRuleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]