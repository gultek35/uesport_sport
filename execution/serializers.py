from rest_framework import serializers
from .models import ExecutionSession, ExecutionRun, ExecutionAttempt, ExecutionDeviation
from planning.models import ExecutionHandoff

class ExecutionSessionSerializer(serializers.ModelSerializer):
    handoff_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ExecutionSession
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'handoff_hash', 'handoff_expiry')

    def create(self, validated_data):
        handoff_id = validated_data.pop('handoff_id')

        try:
            handoff = ExecutionHandoff.objects.get(id=handoff_id)
        except ExecutionHandoff.DoesNotExist:
            raise serializers.ValidationError({'handoff_id': 'Geçersiz handoff ID'})

        validated_data['handoff_hash'] = handoff.semantic_hash
        validated_data['handoff_expiry'] = handoff.expires_at

        # BURASI ÖNEMLİ: handoff_id'yi TEKRAR EKLE (NOT NULL constraint için)
        validated_data['handoff_id'] = handoff_id

        return ExecutionSession.objects.create(**validated_data)

class ExecutionRunSerializer(serializers.ModelSerializer):
    execution_session = serializers.PrimaryKeyRelatedField(queryset=ExecutionSession.objects.all())

    class Meta:
        model = ExecutionRun
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class ExecutionAttemptSerializer(serializers.ModelSerializer):
    run = serializers.PrimaryKeyRelatedField(queryset=ExecutionRun.objects.all())

    class Meta:
        model = ExecutionAttempt
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class ExecutionDeviationSerializer(serializers.ModelSerializer):
    execution_session = serializers.PrimaryKeyRelatedField(queryset=ExecutionSession.objects.all())
    run = serializers.PrimaryKeyRelatedField(queryset=ExecutionRun.objects.all(), required=False, allow_null=True)

    class Meta:
        model = ExecutionDeviation
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'logged_at')