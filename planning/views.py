from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import (
    TestSession,
    TestSessionPlanRevision,
    TestSessionParticipant,
    TestSessionTestItem,
    ParticipantTestAssignment,
    TestSessionStation,
    TestSessionSlot,
    TestSessionStaffAssignment,
    TestSessionResourceRequirement,
    TestSessionGateEvaluation,
    ExecutionHandoff
)
from .serializers import (
    TestSessionSerializer,
    TestSessionPlanRevisionSerializer,
    TestSessionParticipantSerializer,
    TestSessionTestItemSerializer,
    ParticipantTestAssignmentSerializer,
    TestSessionStationSerializer,
    TestSessionSlotSerializer,
    TestSessionStaffAssignmentSerializer,
    TestSessionResourceRequirementSerializer,
    TestSessionGateEvaluationSerializer,
    ExecutionHandoffSerializer
)

# ================== TestSession ViewSet ==================
class TestSessionViewSet(viewsets.ModelViewSet):
    queryset = TestSession.objects.all()
    serializer_class = TestSessionSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'code'

    def get_queryset(self):
        queryset = super().get_queryset()
        lifecycle_status = self.request.query_params.get('lifecycle_status')
        if lifecycle_status:
            queryset = queryset.filter(lifecycle_status=lifecycle_status)
        return queryset

    def perform_create(self, serializer):
        session = serializer.save()
        TestSessionPlanRevision.objects.create(
            session=session,
            revision_no=1,
            semantic_hash='initial',
            planned_start=timezone.now(),
            planned_end=timezone.now() + timedelta(days=1),
            timezone='UTC',
            status='DRAFT',
            created_by=self.request.user.id if self.request.user.is_authenticated else None,
            is_current=True
        )

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None, code=None):
        try:
            # 📌 code veya pk ile oturumu bul
            if code:
                session = TestSession.objects.get(code=code)
            else:
                session = self.get_object()
                
            if session.lifecycle_status == 'LOCKED':
                return Response({'error': 'Session already locked'}, status=status.HTTP_400_BAD_REQUEST)

            current_revision = session.revisions.filter(is_current=True).first()
            if not current_revision:
                current_revision = TestSessionPlanRevision.objects.create(
                    session=session,
                    revision_no=1,
                    semantic_hash='initial',
                    planned_start=timezone.now(),
                    planned_end=timezone.now() + timedelta(days=1),
                    timezone='UTC',
                    status='DRAFT',
                    created_by=self.request.user.id if self.request.user.is_authenticated else None,
                    is_current=True
                )

            # 📌 Participant ve test item'larını al
            participants = TestSessionParticipant.objects.filter(revision=current_revision)
            test_items = TestSessionTestItem.objects.filter(revision=current_revision)

            # 📌 UUID'leri string'e çevir - JSON serializable yap
            participants_data = []
            for p in participants:
                participants_data.append({
                    'id': str(p.id),
                    'athlete_ref': str(p.athlete_ref)
                })

            test_items_data = []
            for t in test_items:
                test_items_data.append({
                    'id': str(t.id),
                    'test_definition_version_ref': str(t.test_definition_version_ref),
                    'protocol_version_ref': str(t.protocol_version_ref) if t.protocol_version_ref else None
                })

            snapshot_payload = {
                'session_id': str(session.id),
                'revision_id': str(current_revision.id),
                'participants': participants_data,
                'test_items': test_items_data
            }

            session.lifecycle_status = 'LOCKED'
            session.save()

            # 📌 Handoff oluştur - semantic_hash None ise 'initial' kullan
            handoff = ExecutionHandoff.objects.create(
                revision=current_revision,
                semantic_hash=current_revision.semantic_hash or 'initial',
                snapshot_payload=snapshot_payload,
                issued_at=timezone.now(),
                expires_at=timezone.now() + timedelta(days=7)
            )

            return Response({
                'status': 'LOCKED',
                'handoff_id': str(handoff.id),
                'message': 'Test session locked successfully. Execution handoff created.',
                'handoff_expires_at': handoff.expires_at
            })

        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e),
                'detail': traceback.format_exc(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None, code=None):
        try:
            if code:
                session = TestSession.objects.get(code=code)
            else:
                session = self.get_object()
                
            if session.lifecycle_status in ['COMPLETED', 'CANCELLED']:
                return Response({'error': 'Session already completed or cancelled'}, status=status.HTTP_400_BAD_REQUEST)
            session.lifecycle_status = 'CANCELLED'
            session.save()
            return Response({'status': 'CANCELLED'})
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None, code=None):
        try:
            if code:
                session = TestSession.objects.get(code=code)
            else:
                session = self.get_object()
                
            if session.lifecycle_status != 'LOCKED':
                return Response({'error': 'Only locked sessions can be reopened'}, status=status.HTTP_400_BAD_REQUEST)

            current_revision = session.revisions.filter(is_current=True).first()
            if not current_revision:
                return Response({'error': 'No current revision found'}, status=status.HTTP_400_BAD_REQUEST)

            new_revision = TestSessionPlanRevision.objects.create(
                session=session,
                revision_no=current_revision.revision_no + 1,
                semantic_hash=current_revision.semantic_hash,
                planned_start=current_revision.planned_start,
                planned_end=current_revision.planned_end,
                timezone=current_revision.timezone,
                local_start_intent=current_revision.local_start_intent,
                planning_organization_ref=current_revision.planning_organization_ref,
                location_ref=current_revision.location_ref,
                sport_context_ref=current_revision.sport_context_ref,
                status='DRAFT',
                created_by=request.user.id if request.user.is_authenticated else None,
                reason=request.data.get('reason', ''),
                is_current=True
            )
            current_revision.is_current = False
            current_revision.save()

            session.lifecycle_status = 'DRAFT'
            session.save()

            return Response({
                'status': 'DRAFT',
                'new_revision_id': str(new_revision.id),
                'message': 'Session reopened successfully.'
            })
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def readiness(self, request, pk=None, code=None):
        try:
            if code:
                session = TestSession.objects.get(code=code)
            else:
                session = self.get_object()
                
            current_revision = session.revisions.filter(is_current=True).first()
            if not current_revision:
                return Response({'error': 'No current revision found'}, status=status.HTTP_400_BAD_REQUEST)

            gates = current_revision.gate_evaluations.all()
            overall_status = 'PASS' if not gates.filter(outcome__in=['FAIL', 'UNKNOWN']).exists() else 'BLOCKED'
            blocking_gates = [g.gate_type for g in gates if g.outcome in ['FAIL', 'UNKNOWN']]

            return Response({
                'overall_status': overall_status,
                'gates': [
                    {
                        'gate_type': g.gate_type,
                        'outcome': g.outcome,
                        'gatekeeper_role': g.gatekeeper_role
                    } for g in gates
                ],
                'blocking_gates': blocking_gates,
                'evaluated_at': timezone.now()
            })
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ================== Diğer ViewSet'ler (Tümü AllowAny) ==================
class TestSessionPlanRevisionViewSet(viewsets.ModelViewSet):
    queryset = TestSessionPlanRevision.objects.all()
    serializer_class = TestSessionPlanRevisionSerializer
    permission_classes = [permissions.AllowAny]

class TestSessionParticipantViewSet(viewsets.ModelViewSet):
    queryset = TestSessionParticipant.objects.all()
    serializer_class = TestSessionParticipantSerializer
    permission_classes = [permissions.AllowAny]

class TestSessionTestItemViewSet(viewsets.ModelViewSet):
    queryset = TestSessionTestItem.objects.all()
    serializer_class = TestSessionTestItemSerializer
    permission_classes = [permissions.AllowAny]

class ParticipantTestAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ParticipantTestAssignment.objects.all()
    serializer_class = ParticipantTestAssignmentSerializer
    permission_classes = [permissions.AllowAny]

class TestSessionStationViewSet(viewsets.ModelViewSet):
    queryset = TestSessionStation.objects.all()
    serializer_class = TestSessionStationSerializer
    permission_classes = [permissions.AllowAny]

class TestSessionSlotViewSet(viewsets.ModelViewSet):
    queryset = TestSessionSlot.objects.all()
    serializer_class = TestSessionSlotSerializer
    permission_classes = [permissions.AllowAny]

class TestSessionStaffAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TestSessionStaffAssignment.objects.all()
    serializer_class = TestSessionStaffAssignmentSerializer
    permission_classes = [permissions.AllowAny]

class TestSessionResourceRequirementViewSet(viewsets.ModelViewSet):
    queryset = TestSessionResourceRequirement.objects.all()
    serializer_class = TestSessionResourceRequirementSerializer
    permission_classes = [permissions.AllowAny]

class TestSessionGateEvaluationViewSet(viewsets.ModelViewSet):
    queryset = TestSessionGateEvaluation.objects.all()
    serializer_class = TestSessionGateEvaluationSerializer
    permission_classes = [permissions.AllowAny]

class ExecutionHandoffViewSet(viewsets.ModelViewSet):
    queryset = ExecutionHandoff.objects.all()
    serializer_class = ExecutionHandoffSerializer
    permission_classes = [permissions.AllowAny]