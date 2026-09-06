import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

# ================== ResultBatch ==================
class ResultBatch(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Beklemede')
        PROCESSING = 'PROCESSING', _('İşleniyor')
        COMPLETED = 'COMPLETED', _('Tamamlandı')
        FAILED = 'FAILED', _('Başarısız')
        RECALCULATING = 'RECALCULATING', _('Yeniden Hesaplanıyor')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    execution_session_id = models.UUIDField()
    handoff_id = models.UUIDField(unique=True)
    handoff_hash = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    received_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_results = models.IntegerField(default=0)
    total_derived = models.IntegerField(default=0)
    validation_errors_count = models.IntegerField(default=0)
    processing_log = models.JSONField(default=dict, blank=True)
    is_async = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'measurement_resultbatch'


# ================== MeasurementResult ==================
class MeasurementResult(models.Model):
    class Status(models.TextChoices):
        PUBLISHED = 'PUBLISHED', _('Yayınlandı')
        RETRACTED = 'RETRACTED', _('Geri Çekildi')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(ResultBatch, on_delete=models.CASCADE, related_name='results')
    execution_run_id = models.UUIDField()
    participant_ref = models.UUIDField()
    test_item_ref = models.UUIDField()
    test_definition_ref = models.UUIDField()
    protocol_ref = models.UUIDField()
    metric_ref = models.UUIDField()
    raw_value = models.DecimalField(max_digits=10, decimal_places=3)
    raw_unit_ref = models.UUIDField()
    raw_unit_code = models.CharField(max_length=50, blank=True)
    canonical_value = models.DecimalField(max_digits=10, decimal_places=3)
    canonical_unit_ref = models.UUIDField()
    canonical_unit_code = models.CharField(max_length=50, blank=True)
    attempt_ref = models.UUIDField(null=True, blank=True)
    operator_id = models.UUIDField(null=True, blank=True)
    captured_at = models.DateTimeField()
    is_best = models.BooleanField(default=False)
    is_valid = models.BooleanField(default=True)
    validation_errors = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED)
    retraction_reason = models.TextField(blank=True)
    conversion_trace = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'measurement_measurementresult'
        indexes = [
            models.Index(fields=['batch', 'participant_ref', 'metric_ref']),
        ]


# ================== DerivedMeasurementResult ==================
class DerivedMeasurementResult(models.Model):
    class Status(models.TextChoices):
        PUBLISHED = 'PUBLISHED', _('Yayınlandı')
        RETRACTED = 'RETRACTED', _('Geri Çekildi')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(ResultBatch, on_delete=models.CASCADE, related_name='derived_results')
    participant_ref = models.UUIDField()
    test_item_ref = models.UUIDField(null=True, blank=True)
    test_definition_ref = models.UUIDField(null=True, blank=True)
    protocol_ref = models.UUIDField(null=True, blank=True)
    metric_ref = models.UUIDField()
    value = models.DecimalField(max_digits=10, decimal_places=3)
    unit_ref = models.UUIDField()
    unit_code = models.CharField(max_length=50, blank=True)
    formula_version_ref = models.UUIDField()
    input_metric_results = models.JSONField(default=list, blank=True)
    is_valid = models.BooleanField(default=True)
    validation_errors = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED)
    retraction_reason = models.TextField(blank=True)
    calculated_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'measurement_derivedmeasurementresult'
        indexes = [
            models.Index(fields=['batch', 'participant_ref', 'metric_ref']),
        ]