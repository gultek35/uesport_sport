import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

# ================== TestSession ==================
class TestSession(models.Model):
    class ParticipationMode(models.TextChoices):
        INDIVIDUAL = 'INDIVIDUAL', _('Bireysel')
        GROUP = 'GROUP', _('Grup')
        MIXED = 'MIXED', _('Karma')

    class LifecycleStatus(models.TextChoices):
        DRAFT = 'DRAFT', _('Taslak')
        REVIEW = 'REVIEW', _('İncelemede')
        SCHEDULED = 'SCHEDULED', _('Planlandı')
        LOCKED = 'LOCKED', _('Kilitli')
        EXPIRED = 'EXPIRED', _('Zamanı Geçti')
        CANCELLED = 'CANCELLED', _('İptal Edildi')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.JSONField(verbose_name='Ad (9 dil)')
    participation_mode = models.CharField(max_length=20, choices=ParticipationMode.choices)
    lifecycle_status = models.CharField(max_length=20, choices=LifecycleStatus.choices, default=LifecycleStatus.DRAFT, db_index=True)
    optimistic_revision = models.IntegerField(default=1)
    provenance = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_testsession'


# ================== TestSessionPlanRevision ==================
class TestSessionPlanRevision(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Taslak')
        REVIEW = 'REVIEW', _('İncelemede')
        SCHEDULED = 'SCHEDULED', _('Planlandı')
        LOCKED = 'LOCKED', _('Kilitli')
        EXPIRED = 'EXPIRED', _('Zamanı Geçti')
        CANCELLED = 'CANCELLED', _('İptal Edildi')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name='revisions')
    revision_no = models.IntegerField()
    semantic_hash = models.CharField(max_length=64)
    planned_start = models.DateTimeField()
    planned_end = models.DateTimeField()
    timezone = models.CharField(max_length=50)
    local_start_intent = models.TextField(blank=True)
    planning_organization_ref = models.UUIDField(null=True, blank=True)
    location_ref = models.UUIDField(null=True, blank=True)
    sport_context_ref = models.UUIDField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    locked_at = models.DateTimeField(null=True, blank=True)
    created_by = models.UUIDField(null=True, blank=True)
    reason = models.TextField(blank=True)
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_testsessionplanrevision'
        unique_together = [['session', 'revision_no']]


# ================== TestSessionParticipant ==================
class TestSessionParticipant(models.Model):
    class SourceType(models.TextChoices):
        INDIVIDUAL = 'INDIVIDUAL', _('Bireysel')
        TEAM = 'TEAM', _('Takım')
        UNIT = 'UNIT', _('Birim')
        PRIOR_SESSION = 'PRIOR_SESSION', _('Önceki Oturum')
        IMPORT = 'IMPORT', _('İthalat')

    class InclusionStatus(models.TextChoices):
        PLANNED = 'PLANNED', _('Planlandı')
        EXCLUDED = 'EXCLUDED', _('Hariç')
        CONDITIONAL = 'CONDITIONAL', _('Koşullu')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    revision = models.ForeignKey(TestSessionPlanRevision, on_delete=models.CASCADE, related_name='participants')
    athlete_ref = models.UUIDField()
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    source_assignment_ref = models.UUIDField(null=True, blank=True)
    source_as_of = models.DateTimeField(null=True, blank=True)
    inclusion_status = models.CharField(max_length=20, choices=InclusionStatus.choices, default=InclusionStatus.PLANNED)
    inclusion_reason_ref = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_testsessionparticipant'
        unique_together = [['revision', 'athlete_ref']]


# ================== TestSessionTestItem ==================
class TestSessionTestItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    revision = models.ForeignKey(TestSessionPlanRevision, on_delete=models.CASCADE, related_name='test_items')
    test_definition_version_ref = models.UUIDField()
    protocol_version_ref = models.UUIDField(null=True, blank=True)
    protocol_assignment_id = models.UUIDField(null=True, blank=True)
    sequence_order = models.IntegerField(null=True, blank=True)
    station_ref = models.UUIDField(null=True, blank=True)
    is_mandatory = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_testsessiontestitem'


# ================== ParticipantTestAssignment ==================
class ParticipantTestAssignment(models.Model):
    class InclusionStatus(models.TextChoices):
        PLANNED = 'PLANNED', _('Planlandı')
        EXCLUDED = 'EXCLUDED', _('Hariç')
        CONDITIONAL = 'CONDITIONAL', _('Koşullu')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participant = models.ForeignKey(TestSessionParticipant, on_delete=models.CASCADE, related_name='assignments')
    test_item = models.ForeignKey(TestSessionTestItem, on_delete=models.CASCADE, related_name='assignments')
    inclusion_status = models.CharField(max_length=20, choices=InclusionStatus.choices, default=InclusionStatus.PLANNED)
    exclusion_reason_ref = models.UUIDField(null=True, blank=True)
    adapted_protocol_assignment_id = models.UUIDField(null=True, blank=True)
    slot_ref = models.UUIDField(null=True, blank=True)
    sequence_override = models.IntegerField(null=True, blank=True)
    gate_summary = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_participanttestassignment'
        unique_together = [['participant', 'test_item']]


# ================== TestSessionStation ==================
class TestSessionStation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    revision = models.ForeignKey(TestSessionPlanRevision, on_delete=models.CASCADE, related_name='stations')
    station_no = models.CharField(max_length=50, blank=True)
    name = models.CharField(max_length=100, blank=True)
    facility_ref = models.UUIDField(null=True, blank=True)
    capacity = models.IntegerField(null=True, blank=True)
    planned_window_start = models.DateTimeField(null=True, blank=True)
    planned_window_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_testsessionstation'


# ================== TestSessionSlot ==================
class TestSessionSlot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    station = models.ForeignKey(TestSessionStation, on_delete=models.CASCADE, related_name='slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    capacity = models.IntegerField(null=True, blank=True)
    participant_ids = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_testsessionslot'


# ================== TestSessionStaffAssignment ==================
class TestSessionStaffAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    revision = models.ForeignKey(TestSessionPlanRevision, on_delete=models.CASCADE, related_name='staff_assignments')
    person_ref = models.UUIDField()
    external_snapshot = models.JSONField(default=dict, blank=True)
    role_ref = models.UUIDField()
    qualification_decision_ref = models.UUIDField(null=True, blank=True)
    planned_window_start = models.DateTimeField(null=True, blank=True)
    planned_window_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_testsessionstaffassignment'


# ================== TestSessionResourceRequirement ==================
class TestSessionResourceRequirement(models.Model):
    class ResourceType(models.TextChoices):
        FACILITY = 'FACILITY', _('Tesis')
        DEVICE = 'DEVICE', _('Cihaz')
        EQUIPMENT = 'EQUIPMENT', _('Ekipman')
        CONSUMABLE = 'CONSUMABLE', _('Sarf Malzeme')

    class ReservationStatus(models.TextChoices):
        PENDING = 'PENDING', _('Beklemede')
        ACCEPTED = 'ACCEPTED', _('Kabul Edildi')
        REJECTED = 'REJECTED', _('Reddedildi')
        CANCELLED = 'CANCELLED', _('İptal Edildi')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    revision = models.ForeignKey(TestSessionPlanRevision, on_delete=models.CASCADE, related_name='resource_requirements')
    resource_type = models.CharField(max_length=20, choices=ResourceType.choices)
    resource_ref = models.UUIDField(null=True, blank=True)
    quantity = models.IntegerField(null=True, blank=True)
    capability_requirement = models.JSONField(default=dict, blank=True)
    reservation_status = models.CharField(max_length=20, choices=ReservationStatus.choices, default=ReservationStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_testsessionresourcerequirement'


# ================== TestSessionGateEvaluation ==================
class TestSessionGateEvaluation(models.Model):
    class GateType(models.TextChoices):
        DEFINITION = 'DEFINITION', _('Tanım')
        PARTICIPANT = 'PARTICIPANT', _('Katılımcı')
        SCIENTIFIC = 'SCIENTIFIC', _('Bilimsel')
        PRIVACY = 'PRIVACY', _('Gizlilik')
        GUARDIAN = 'GUARDIAN', _('Vasi')
        HEALTH_SAFETY = 'HEALTH_SAFETY', _('Sağlık')
        STAFF = 'STAFF', _('Personel')
        RESOURCE = 'RESOURCE', _('Kaynak')
        SCHEDULE = 'SCHEDULE', _('Takvim')

    class Outcome(models.TextChoices):
        PASS = 'PASS', _('Geçti')
        WARN = 'WARN', _('Uyarı')
        FAIL = 'FAIL', _('Başarısız')
        UNKNOWN = 'UNKNOWN', _('Bilinmiyor')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    revision = models.ForeignKey(TestSessionPlanRevision, on_delete=models.CASCADE, related_name='gate_evaluations')
    gate_type = models.CharField(max_length=30, choices=GateType.choices)
    scope = models.JSONField(default=dict, blank=True)
    decision_ref = models.UUIDField(null=True, blank=True)
    outcome = models.CharField(max_length=20, choices=Outcome.choices)
    evaluated_at = models.DateTimeField()
    expires_at = models.DateTimeField(null=True, blank=True)
    policy_version = models.CharField(max_length=20, blank=True)
    gatekeeper_role = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_testsessiongateevaluation'


# ================== ExecutionHandoff ==================
class ExecutionHandoff(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    revision = models.ForeignKey(TestSessionPlanRevision, on_delete=models.RESTRICT, related_name='handoffs')
    semantic_hash = models.CharField(max_length=64)
    snapshot_payload = models.JSONField()
    issued_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'planning_executionhandoff'