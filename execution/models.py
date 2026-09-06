import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

# ================== ExecutionSession ==================
class ExecutionSession(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Beklemede')
        IN_PROGRESS = 'IN_PROGRESS', _('Devam Ediyor')
        PAUSED = 'PAUSED', _('Durduruldu')
        COMPLETED = 'COMPLETED', _('Tamamlandı')
        ABORTED = 'ABORTED', _('İptal Edildi')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    handoff_id = models.UUIDField()
    handoff_hash = models.CharField(max_length=64)
    handoff_expiry = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    session_metadata = models.JSONField(default=dict, blank=True)
    participants = models.JSONField(default=list, blank=True)
    test_items = models.JSONField(default=list, blank=True)
    schedule = models.JSONField(default=dict, blank=True)
    required_gates = models.JSONField(default=dict, blank=True)
    current_operator_id = models.UUIDField(null=True, blank=True)
    location_actual = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'execution_executionsession'


# ================== ExecutionRun ==================
class ExecutionRun(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Beklemede')
        IN_PROGRESS = 'IN_PROGRESS', _('Devam Ediyor')
        COMPLETED = 'COMPLETED', _('Tamamlandı')
        SKIPPED = 'SKIPPED', _('Atlandı')
        ABORTED = 'ABORTED', _('İptal Edildi')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    execution_session = models.ForeignKey(ExecutionSession, on_delete=models.CASCADE, related_name='runs')
    participant_ref = models.UUIDField()
    test_item_ref = models.UUIDField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    protocol_ref = models.UUIDField(null=True, blank=True)
    parameter_overrides_used = models.JSONField(default=dict, blank=True)
    adapted_protocol_ref = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'execution_executionrun'


# ================== ExecutionAttempt ==================
class ExecutionAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(ExecutionRun, on_delete=models.CASCADE, related_name='attempts')
    attempt_number = models.IntegerField()
    raw_value = models.DecimalField(max_digits=10, decimal_places=3)
    raw_unit_ref = models.UUIDField(null=True, blank=True)  # 📌 nullable yapıldı
    captured_at = models.DateTimeField()
    operator_id = models.UUIDField(null=True, blank=True)   # 📌 nullable yapıldı
    device_ref = models.UUIDField(null=True, blank=True)
    device_reading = models.TextField(blank=True)
    calibration_valid_at = models.DateTimeField(null=True, blank=True)
    is_valid = models.BooleanField(default=True)
    is_best = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    deviation_ref = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'execution_executionattempt'
        unique_together = [['run', 'attempt_number']]


# ================== ExecutionDeviation ==================
class ExecutionDeviation(models.Model):
    class Type(models.TextChoices):
        EXTRA_ATTEMPT = 'EXTRA_ATTEMPT', _('Ekstra Deneme')
        MISSING_PARTICIPANT = 'MISSING_PARTICIPANT', _('Eksik Katılımcı')
        EQUIPMENT_CHANGE = 'EQUIPMENT_CHANGE', _('Ekipman Değişikliği')
        ORDER_CHANGE = 'ORDER_CHANGE', _('Sıra Değişikliği')
        PROTOCOL_DEVIATION = 'PROTOCOL_DEVIATION', _('Protokol Sapması')
        OTHER = 'OTHER', _('Diğer')

    class Severity(models.TextChoices):
        INFO = 'INFO', _('Bilgi')
        WARNING = 'WARNING', _('Uyarı')
        CRITICAL = 'CRITICAL', _('Kritik')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    execution_session = models.ForeignKey(ExecutionSession, on_delete=models.CASCADE, related_name='deviations')
    run = models.ForeignKey(ExecutionRun, on_delete=models.CASCADE, null=True, blank=True, related_name='deviations')
    type = models.CharField(max_length=30, choices=Type.choices)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=Severity.choices)
    approved_by = models.UUIDField(null=True, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'execution_executiondeviation'