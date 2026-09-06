import math
from decimal import Decimal
from django.utils import timezone
from measurement.models import MeasurementResult, DerivedMeasurementResult, ResultBatch
from catalog.models import TestNormBinding, PopulationDefinition, NormSet, PopulationSportContext
from core.models import AthleteProfile
from .models import NormResult

class NormEngine:
    """Norm Engine servis katmanı."""

    LABEL_RANGES = {
        'EXCELLENT': (2.0, float('inf')),
        'GOOD': (1.0, 2.0),
        'AVERAGE': (-1.0, 1.0),
        'POOR': (-2.0, -1.0),
        'VERY_POOR': (float('-inf'), -2.0),
    }

    @classmethod
    def calculate_for_batch(cls, batch_id):
        try:
            batch = ResultBatch.objects.get(id=batch_id)
        except ResultBatch.DoesNotExist:
            raise ValueError(f"Batch {batch_id} bulunamadı")

        batch.status = 'PROCESSING'
        batch.save()

        try:
            results = list(MeasurementResult.objects.filter(batch=batch, is_valid=True))
            derived_results = list(DerivedMeasurementResult.objects.filter(batch=batch, is_valid=True))
            all_results = results + derived_results

            if not all_results:
                batch.status = 'COMPLETED'
                batch.save()
                return {'status': 'COMPLETED', 'message': 'No valid results to process'}

            norm_results = []
            failed_norms = []

            for result in all_results:
                try:
                    athlete_profile = cls._get_athlete_profile(result.participant_ref)
                    if not athlete_profile:
                        failed_norms.append({
                            'participant_id': str(result.participant_ref),
                            'metric_ref': str(result.metric_ref),
                            'error': 'Athlete profile not found'
                        })
                        continue

                    # Person üzerinden yaş hesapla
                    person = athlete_profile.person
                    age = cls._calculate_age(person.date_of_birth, timezone.now())

                    norm_bindings = TestNormBinding.objects.filter(
                        test_definition_id=result.test_definition_ref,
                        norm_set__lifecycle_status='ACTIVE'
                    )

                    if not norm_bindings.exists():
                        failed_norms.append({
                            'participant_id': str(result.participant_ref),
                            'metric_ref': str(result.metric_ref),
                            'error': 'No norm binding found'
                        })
                        continue

                    selected_binding = cls._select_best_binding(norm_bindings, athlete_profile, person, age)

                    if not selected_binding:
                        failed_norms.append({
                            'participant_id': str(result.participant_ref),
                            'metric_ref': str(result.metric_ref),
                            'error': 'No matching norm binding found'
                        })
                        continue

                    norm_set = selected_binding.norm_set
                    mean = float(norm_set.summary_stats.get('mean', 0))
                    sd = float(norm_set.summary_stats.get('sd', 1))
                    min_val = float(norm_set.summary_stats.get('min', 0))
                    max_val = float(norm_set.summary_stats.get('max', 0))

                    input_value = float(result.canonical_value if hasattr(result, 'canonical_value') else result.value)
                    z_score = (input_value - mean) / sd if sd != 0 else 0

                    percentile = cls._calculate_percentile(norm_set, input_value, z_score)
                    t_score = (z_score * 10) + 50
                    label_code, label = cls._get_label(z_score)
                    comparison_code, comparison_text = cls._get_comparison(input_value, mean)

                    norm_result = NormResult.objects.create(
                        batch_id=batch.id,
                        participant_id=result.participant_ref,
                        metric_ref=result.metric_ref,
                        input_value=Decimal(str(input_value)),
                        input_unit_ref=result.canonical_unit_ref if hasattr(result, 'canonical_unit_ref') else result.unit_ref,
                        norm_binding_id=selected_binding.id,
                        population_id=selected_binding.population_ref,
                        norm_mean=Decimal(str(mean)),
                        norm_sd=Decimal(str(sd)),
                        norm_min=Decimal(str(min_val)),
                        norm_max=Decimal(str(max_val)),
                        norm_percentile=Decimal(str(percentile)) if percentile is not None else None,
                        norm_z_score=Decimal(str(z_score)),
                        norm_t_score=Decimal(str(t_score)),
                        norm_label_code=label_code,
                        norm_label=label,
                        comparison_code=comparison_code,
                        comparison_text=comparison_text,
                        status='PUBLISHED'
                    )
                    norm_results.append(norm_result.id)

                except Exception as e:
                    failed_norms.append({
                        'participant_id': str(result.participant_ref),
                        'metric_ref': str(result.metric_ref),
                        'error': str(e)
                    })

            batch.total_results = len(norm_results)
            batch.status = 'COMPLETED'
            batch.completed_at = timezone.now()
            batch.save()

            return {
                'status': 'COMPLETED',
                'total_norms': len(norm_results),
                'failed_norms': failed_norms,
                'norm_result_ids': norm_results
            }

        except Exception as e:
            batch.status = 'FAILED'
            batch.save()
            raise e

    @classmethod
    def _get_athlete_profile(cls, participant_id):
        try:
            return AthleteProfile.objects.get(person_id=participant_id)
        except AthleteProfile.DoesNotExist:
            return None

    @classmethod
    def _calculate_age(cls, date_of_birth, reference_date):
        # reference_date'i date'e çevir
        if hasattr(reference_date, 'date'):
             reference_date = reference_date.date()
        delta = reference_date - date_of_birth
        return delta.days / 365.25

    @classmethod
    def _select_best_binding(cls, norm_bindings, athlete_profile, person, age):
        best_binding = None
        best_score = -1
        best_age_distance = float('inf')

        for binding in norm_bindings:
            population_id = binding.population_ref
            if not population_id:
                continue

            try:
                pop = PopulationDefinition.objects.get(id=population_id)
            except PopulationDefinition.DoesNotExist:
                continue

            score = 0

            # 1. Engel durumu (ZORUNLU)
            if pop.is_para != athlete_profile.is_para_athlete:
                continue
            score += 100

            # 2. Cinsiyet
            if pop.gender == 'ALL':
                score += 50
            elif pop.gender == person.gender:
                score += 100
            else:
                continue
            score += 50

            # 3. Yaş aralığı
            age_min = pop.age_min or 0
            age_max = pop.age_max or 150
            if age_min <= age <= age_max:
                score += 100
                age_distance = 0
            else:
                center = (age_min + age_max) / 2
                age_distance = abs(age - center)

            # 4. Spor dalı (many-to-many kontrolü)
            sport_contexts = PopulationSportContext.objects.filter(population=pop).values_list('sportcontext_ref', flat=True)
            if sport_contexts and athlete_profile.sport_context_ref:
                if athlete_profile.sport_context_ref in sport_contexts:
                    score += 80

            # 5. Seviye
            if pop.level and pop.level == athlete_profile.level:
                score += 60

            # 6. Klasman (para sporcular için)
            if athlete_profile.is_para_athlete and pop.classification:
                if pop.classification == athlete_profile.classification:
                    score += 70

            if score > best_score or (score == best_score and age_distance < best_age_distance):
                best_score = score
                best_age_distance = age_distance
                best_binding = binding

        return best_binding

    @classmethod
    def _calculate_percentile(cls, norm_set, input_value, z_score):
        data_points = norm_set.data_points
        if data_points and len(data_points) > 0:
            sorted_data = sorted(data_points)
            count = len(sorted_data)
            import bisect
            pos = bisect.bisect_left(sorted_data, input_value)
            percentile = (pos / count) * 100
            return percentile
        else:
            percentile = 50 + (z_score * 10)
            return max(0, min(100, percentile))

    @classmethod
    def _get_label(cls, z_score):
        for code, (lower, upper) in cls.LABEL_RANGES.items():
            if lower <= z_score < upper:
                label_map = {
                    'EXCELLENT': 'Çok İyi',
                    'GOOD': 'İyi',
                    'AVERAGE': 'Ortalama',
                    'POOR': 'Zayıf',
                    'VERY_POOR': 'Çok Zayıf'
                }
                return code, label_map[code]
        return 'AVERAGE', 'Ortalama'

    @classmethod
    def _get_comparison(cls, input_value, mean):
        if input_value > mean:
            return 'ABOVE_AVERAGE', 'Sporcu, popülasyon ortalamasının üzerinde.'
        elif input_value < mean:
            return 'BELOW_AVERAGE', 'Sporcu, popülasyon ortalamasının altında.'
        else:
            return 'EQUAL', 'Sporcu, popülasyon ortalamasına eşit.'