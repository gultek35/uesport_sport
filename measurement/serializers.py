from rest_framework import serializers
from .models import ResultBatch, MeasurementResult, DerivedMeasurementResult

class ResultBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultBatch
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class MeasurementResultSerializer(serializers.ModelSerializer):
    batch = serializers.PrimaryKeyRelatedField(queryset=ResultBatch.objects.all())

    class Meta:
        model = MeasurementResult
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class DerivedMeasurementResultSerializer(serializers.ModelSerializer):
    batch = serializers.PrimaryKeyRelatedField(queryset=ResultBatch.objects.all())

    class Meta:
        model = DerivedMeasurementResult
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')