import uuid
from django.db import models

class FormulaExecutionLog(models.Model):
    """Formül hesaplama log'ları (Audit)"""
    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', 'Başarılı'
        FAILED = 'FAILED', 'Başarısız'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_id = models.UUIDField()
    execution_id = models.UUIDField(null=True, blank=True)  # Düzeltildi
    participant_id = models.UUIDField()
    formula_binding_id = models.UUIDField()
    input_snapshot = models.JSONField()
    output_value = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    output_unit = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices)
    error_trace = models.TextField(blank=True)
    executed_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'formula_executionlog'