from rest_framework import serializers
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

# ================== TestDefinition Serializer ==================
class TestDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestDefinition
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== TestProtocol Serializer ==================
class TestProtocolSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestProtocol
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== TestProtocolAssignment Serializer ==================
class TestProtocolAssignmentSerializer(serializers.ModelSerializer):
    test_definition = serializers.PrimaryKeyRelatedField(queryset=TestDefinition.objects.all())
    test_protocol = serializers.PrimaryKeyRelatedField(queryset=TestProtocol.objects.all())

    class Meta:
        model = TestProtocolAssignment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== TestMetricBinding Serializer ==================
class TestMetricBindingSerializer(serializers.ModelSerializer):
    test_definition = serializers.PrimaryKeyRelatedField(queryset=TestDefinition.objects.all())

    class Meta:
        model = TestMetricBinding
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== TestMethodBinding Serializer ==================
class TestMethodBindingSerializer(serializers.ModelSerializer):
    test_definition = serializers.PrimaryKeyRelatedField(queryset=TestDefinition.objects.all())

    class Meta:
        model = TestMethodBinding
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== TestEvidenceBinding Serializer ==================
class TestEvidenceBindingSerializer(serializers.ModelSerializer):
    test_definition = serializers.PrimaryKeyRelatedField(queryset=TestDefinition.objects.all())

    class Meta:
        model = TestEvidenceBinding
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== TestNormBinding Serializer ==================
class TestNormBindingSerializer(serializers.ModelSerializer):
    test_definition = serializers.PrimaryKeyRelatedField(queryset=TestDefinition.objects.all())
    norm_set = serializers.PrimaryKeyRelatedField(queryset=NormSet.objects.all())

    class Meta:
        model = TestNormBinding
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== TestFormulaBinding Serializer ==================
class TestFormulaBindingSerializer(serializers.ModelSerializer):
    test_definition = serializers.PrimaryKeyRelatedField(queryset=TestDefinition.objects.all())

    class Meta:
        model = TestFormulaBinding
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== PopulationDefinition Serializer ==================
class PopulationDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PopulationDefinition
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== PopulationSportContext Serializer ==================
class PopulationSportContextSerializer(serializers.ModelSerializer):
    population = serializers.PrimaryKeyRelatedField(queryset=PopulationDefinition.objects.all())

    class Meta:
        model = PopulationSportContext
        fields = '__all__'
        read_only_fields = ('id', 'created_at')

# ================== NormSet Serializer ==================
class NormSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = NormSet
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# ================== ValidationRule Serializer ==================
class ValidationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationRule
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')