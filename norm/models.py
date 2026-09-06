import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

class NormResult(models.Model):
    class Status(models.TextChoices):
        PUBLISHED = 'PUBLISHED', _('Yayınlandı')
        RETRACTED = 'RETRACTED', _('Geri Çekildi')

    class LabelCode(models.TextChoices):
        EXCELLENT = 'EXCELLENT', _('Çok İyi')
        GOOD = 'GOOD', _('İyi')
        AVERAGE = 'AVERAGE', _('Ortalama')
        POOR = 'POOR', _('Zayıf')
        VERY_POOR = 'VERY_POOR', _('Çok Zayıf')

    class ComparisonCode(models.TextChoices):
        ABOVE_AVERAGE = 'ABOVE_AVERAGE', _('Ortalamanın Üzerinde')
        BELOW_AVERAGE = 'BELOW_AVERAGE', _('Ortalamanın Altında')
        EQUAL = 'EQUAL', _('Ortalamaya Eşit')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_id = models.UUIDField()
    participant_id = models.UUIDField()
    metric_ref = models.UUIDField()
    input_value = models.DecimalField(max_digits=10, decimal_places=3)
    input_unit_ref = models.UUIDField()
    norm_binding_id = models.UUIDField()
    population_id = models.UUIDField()
    norm_mean = models.DecimalField(max_digits=10, decimal_places=3)
    norm_sd = models.DecimalField(max_digits=10, decimal_places=3)
    norm_min = models.DecimalField(max_digits=10, decimal_places=3)
    norm_max = models.DecimalField(max_digits=10, decimal_places=3)
    norm_percentile = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    norm_z_score = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    norm_t_score = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    norm_label_code = models.CharField(max_length=20, choices=LabelCode.choices)
    norm_label = models.CharField(max_length=50, blank=True)
    comparison_code = models.CharField(max_length=20, choices=ComparisonCode.choices)
    comparison_text = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED)
    calculated_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'norm_normresult'
        indexes = [
            models.Index(fields=['batch_id', 'participant_id', 'metric_ref']),
        ]