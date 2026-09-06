from rest_framework import serializers
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

# ================== ÖNCE TÜM SERIALIZER'LARI TANIMLA ==================
class TestSessionPlanRevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSessionPlanRevision
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class TestSessionParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSessionParticipant
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class TestSessionTestItemSerializer(serializers.ModelSerializer):
    # protocol_version_ref alanını açıkça required=False, allow_null=True yap
    protocol_version_ref = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = TestSessionTestItem
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class ParticipantTestAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParticipantTestAssignment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class TestSessionStationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSessionStation
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class TestSessionSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSessionSlot
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class TestSessionStaffAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSessionStaffAssignment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class TestSessionResourceRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSessionResourceRequirement
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class TestSessionGateEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSessionGateEvaluation
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class ExecutionHandoffSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutionHandoff
        fields = '__all__'
        read_only_fields = ('id', 'created_at')

# ================== SONRA ANA SERIALIZER ==================
class TestSessionSerializer(serializers.ModelSerializer):
    revisions = serializers.SerializerMethodField()
    handoffs = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    test_items = serializers.SerializerMethodField()

    class Meta:
        model = TestSession
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_revisions(self, obj):
        revisions = obj.revisions.all()
        return TestSessionPlanRevisionSerializer(revisions, many=True).data

    def get_handoffs(self, obj):
        revision = obj.revisions.filter(is_current=True).first()
        if revision:
            handoffs = revision.handoffs.all()
            return [{'id': str(h.id), 'expires_at': h.expires_at} for h in handoffs]
        return []

    def get_participants(self, obj):
        revision = obj.revisions.filter(is_current=True).first()
        if revision:
            from .models import TestSessionParticipant
            participants = TestSessionParticipant.objects.filter(revision=revision)
            return list(participants.values('id', 'athlete_ref'))
        return []

    def get_test_items(self, obj):
        revision = obj.revisions.filter(is_current=True).first()
        if revision:
           # 📌 DOĞRUDAN TestSessionTestItem modelinden sorgula
           from .models import TestSessionTestItem
           test_items = TestSessionTestItem.objects.filter(revision=revision)
           return list(test_items.values('id', 'test_definition_version_ref', 'protocol_version_ref', 'sequence_order'))
        return []