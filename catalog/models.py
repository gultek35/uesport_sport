import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

# ================== TestDefinition ==================
class TestDefinition(models.Model):
    class LifecycleStatus(models.TextChoices):
        DRAFT = 'DRAFT', _('Taslak')
        REVIEW = 'REVIEW', _('İncelemede')
        REJECTED = 'REJECTED', _('Reddedildi')
        ACTIVE = 'ACTIVE', _('Aktif')
        DEPRECATED = 'DEPRECATED', _('Eski')
        RETIRED = 'RETIRED', _('Emekli')
        SUPERSEDED = 'SUPERSEDED', _('Yeni Sürüm')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    version = models.IntegerField(default=1)
    name = models.JSONField(verbose_name='Ad (9 dil)')
    description = models.JSONField(verbose_name='Açıklama (9 dil)')
    category_ref = models.UUIDField(null=True, blank=True)
    type_ref = models.UUIDField(null=True, blank=True)
    sport_context_refs = models.JSONField(default=list, blank=True)
    purpose = models.TextField(blank=True)
    target_population_refs = models.JSONField(default=list, blank=True)
    target_population_description = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    lifecycle_status = models.CharField(max_length=20, choices=LifecycleStatus.choices, default=LifecycleStatus.DRAFT, db_index=True)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    successor_test_ref = models.UUIDField(null=True, blank=True)
    source = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_testdefinition'
        indexes = [models.Index(fields=['lifecycle_status'])]

    def __str__(self):
        return f"{self.code} v{self.version}"

# ================== TestProtocol ==================
class TestProtocol(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Taslak')
        ACTIVE = 'ACTIVE', _('Aktif')
        DEPRECATED = 'DEPRECATED', _('Eski')
        RETIRED = 'RETIRED', _('Emekli')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    version = models.IntegerField(default=1)
    name = models.JSONField(verbose_name='Ad (9 dil)')
    description = models.JSONField(verbose_name='Açıklama (9 dil)')
    preparation = models.TextField(blank=True)
    execution = models.TextField(blank=True)
    termination = models.TextField(blank=True)
    recording = models.TextField(blank=True)
    equipment_names = models.JSONField(default=list, blank=True)
    equipment_refs = models.JSONField(default=list, blank=True)
    environment = models.TextField(blank=True)
    safety = models.TextField()
    duration_display = models.CharField(max_length=100, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    validity = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_testprotocol'

    def __str__(self):
        return f"{self.code} v{self.version}"

# ================== TestProtocolAssignment ==================
class TestProtocolAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test_definition = models.ForeignKey(TestDefinition, on_delete=models.CASCADE)
    test_protocol = models.ForeignKey(TestProtocol, on_delete=models.CASCADE)
    parameter_overrides = models.JSONField(default=dict, blank=True)
    is_default = models.BooleanField(default=False)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_testprotocolassignment'
        unique_together = [['test_definition', 'test_protocol']]

    def __str__(self):
        return f"{self.test_definition.code} ↔ {self.test_protocol.code}"

# ================== TestMetricBinding ==================
class TestMetricBinding(models.Model):
    class Role(models.TextChoices):
        PRIMARY = 'PRIMARY', _('Birincil')
        SECONDARY = 'SECONDARY', _('İkincil')
        DERIVED = 'DERIVED', _('Türetilmiş')
        OPTIONAL = 'OPTIONAL', _('Opsiyonel')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test_definition = models.ForeignKey(TestDefinition, on_delete=models.CASCADE)
    metric_version_id = models.UUIDField()
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PRIMARY)
    expected_unit_ref = models.UUIDField()
    is_mandatory = models.BooleanField(default=True)
    validation_rules = models.JSONField(default=list, blank=True)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_testmetricbinding'

# ================== TestMethodBinding ==================
class TestMethodBinding(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test_definition = models.ForeignKey(TestDefinition, on_delete=models.CASCADE)
    method_version_id = models.UUIDField()
    applicability = models.JSONField(default=dict, blank=True)
    is_default = models.BooleanField(default=False)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_testmethodbinding'

# ================== TestEvidenceBinding ==================
class TestEvidenceBinding(models.Model):
    class ReviewStatus(models.TextChoices):
        PENDING = 'PENDING', _('Beklemede')
        APPROVED = 'APPROVED', _('Onaylandı')
        REJECTED = 'REJECTED', _('Reddedildi')
        SUPERSEDED = 'SUPERSEDED', _('Yeni Kanıt')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test_definition = models.ForeignKey(TestDefinition, on_delete=models.CASCADE)
    evidence_ref = models.UUIDField()
    claim_ref = models.UUIDField(null=True, blank=True)
    applicability = models.TextField(blank=True)
    limitation = models.TextField(blank=True)
    review_status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_testevidencebinding'

# ================== TestNormBinding ==================
class TestNormBinding(models.Model):
    class LifecycleStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', _('Aktif')
        DEPRECATED = 'DEPRECATED', _('Eski')
        RETIRED = 'RETIRED', _('Emekli')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test_definition = models.ForeignKey(TestDefinition, on_delete=models.CASCADE)
    norm_set = models.ForeignKey('NormSet', on_delete=models.CASCADE)
    population_ref = models.UUIDField(null=True, blank=True)
    applicability = models.JSONField(default=dict, blank=True)
    applicability_text = models.TextField(blank=True)
    version = models.IntegerField(default=1)
    lifecycle_status = models.CharField(max_length=20, choices=LifecycleStatus.choices, default=LifecycleStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_testnormsbinding'

# ================== TestFormulaBinding ==================
class TestFormulaBinding(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test_definition = models.ForeignKey(TestDefinition, on_delete=models.CASCADE)
    formula_version_id = models.UUIDField()
    input_metrics = models.JSONField()
    output_metric_ref = models.UUIDField()
    applicability = models.TextField(blank=True)
    evidence_ref = models.UUIDField(null=True, blank=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_testformulabinding'

# ================== PopulationDefinition ==================
class PopulationDefinition(models.Model):
    class Gender(models.TextChoices):
        MALE = 'MALE', _('Erkek')
        FEMALE = 'FEMALE', _('Kadın')
        ALL = 'ALL', _('Tümü')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.JSONField(verbose_name='Ad (9 dil)')
    description = models.JSONField(verbose_name='Açıklama (9 dil)')
    age_min = models.IntegerField(null=True, blank=True)
    age_max = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, null=True, blank=True)
    level = models.CharField(max_length=50, blank=True)
    is_para = models.BooleanField(default=False)
    classification = models.CharField(max_length=50, blank=True)
    source = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_populationdefinition'

    def __str__(self):
        return self.code

# ================== PopulationSportContext ==================
class PopulationSportContext(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    population = models.ForeignKey(PopulationDefinition, on_delete=models.CASCADE)
    sportcontext_ref = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'catalog_population_sportcontext'
        unique_together = [['population', 'sportcontext_ref']]

# ================== NormSet ==================
class NormSet(models.Model):
    class LifecycleStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', _('Aktif')
        DEPRECATED = 'DEPRECATED', _('Eski')
        RETIRED = 'RETIRED', _('Emekli')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    data_points = models.JSONField(default=list, blank=True)
    summary_stats = models.JSONField()
    lifecycle_status = models.CharField(max_length=20, choices=LifecycleStatus.choices, default=LifecycleStatus.ACTIVE, db_index=True)
    source = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_normset'
        indexes = [models.Index(fields=['lifecycle_status'])]

    def __str__(self):
        return self.code

# ================== ValidationRule ==================
class ValidationRule(models.Model):
    class ScopeType(models.TextChoices):
        METRIC = 'METRIC', _('Metrik')
        TEST = 'TEST', _('Test')
        PROTOCOL = 'PROTOCOL', _('Protokol')

    class RuleType(models.TextChoices):
        RANGE = 'RANGE', _('Aralık')
        LOGICAL = 'LOGICAL', _('Mantıksal')
        FORMULA_CONSISTENCY = 'FORMULA_CONSISTENCY', _('Formül Tutarlılığı')

    class Severity(models.TextChoices):
        INFO = 'INFO', _('Bilgi')
        WARNING = 'WARNING', _('Uyarı')
        ERROR = 'ERROR', _('Hata')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    metric_ref = models.UUIDField()
    scope_type = models.CharField(max_length=20, choices=ScopeType.choices)
    scope_ref = models.UUIDField(null=True, blank=True)
    rule_type = models.CharField(max_length=20, choices=RuleType.choices)
    parameters = models.JSONField()
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.ERROR)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalog_validationrule'