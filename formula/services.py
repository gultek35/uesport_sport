import ast
import math
import operator
from decimal import Decimal
from django.utils import timezone
from measurement.models import MeasurementResult, DerivedMeasurementResult, ResultBatch
from catalog.models import TestFormulaBinding
from .models import FormulaExecutionLog  # Doğru import

class FormulaEngine:
    """Formula Engine servis katmanı."""

    SAFE_FUNCTIONS = {
        'sqrt': math.sqrt,
        'abs': abs,
        'round': round,
        'min': min,
        'max': max,
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'log': math.log,
        'log10': math.log10,
        'exp': math.exp,
    }

    SAFE_OPERATORS = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.FloorDiv: operator.floordiv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
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
            results = MeasurementResult.objects.filter(batch=batch, is_valid=True)
            if not results.exists():
                batch.status = 'COMPLETED'
                batch.save()
                return {'status': 'COMPLETED', 'message': 'No valid results to process'}

            participant_data = {}
            for result in results:
                key = result.participant_ref
                if key not in participant_data:
                    participant_data[key] = {}
                participant_data[key][result.metric_ref] = float(result.canonical_value)

            test_definition_refs = results.values_list('test_definition_ref', flat=True).distinct()
            formula_bindings = TestFormulaBinding.objects.filter(
                test_definition__id__in=test_definition_refs
            )

            if not formula_bindings.exists():
                batch.status = 'COMPLETED'
                batch.save()
                return {'status': 'COMPLETED', 'message': 'No formulas found'}

            derived_results = []
            failed_formulas = []

            for formula in formula_bindings:
                for participant_id, metrics in participant_data.items():
                    try:
                        input_values = {}
                        for input_metric in formula.input_metrics:
                            metric_ref = input_metric.get('metric_ref')
                            if metric_ref not in metrics:
                                raise ValueError(f"Eksik girdi: {metric_ref}")
                            input_values[metric_ref] = metrics[metric_ref]

                        result_value = cls._evaluate_expression(formula.expression, input_values)

                        derived = DerivedMeasurementResult.objects.create(
                            batch=batch,
                            participant_ref=participant_id,
                            test_item_ref=None,
                            test_definition_ref=formula.test_definition.id,
                            protocol_ref=None,
                            metric_ref=formula.output_metric_ref,
                            value=Decimal(str(result_value)),
                            unit_ref=None,
                            formula_version_ref=formula.id,
                            input_metric_results=list(input_values.keys()),
                            is_valid=True,
                            status='PUBLISHED'
                        )
                        derived_results.append(derived.id)

                    except Exception as e:
                        failed_formulas.append({
                            'participant_id': str(participant_id),
                            'formula_binding_id': str(formula.id),
                            'error': str(e)
                        })
                        cls._log_execution(
                            batch_id=str(batch.id),
                            participant_id=str(participant_id),
                            formula_binding_id=str(formula.id),
                            input_snapshot=input_values,
                            output_value=None,
                            status='FAILED',
                            error_trace=str(e)
                        )

            batch.total_derived = len(derived_results)
            batch.status = 'COMPLETED'
            batch.completed_at = timezone.now()
            batch.save()

            return {
                'status': 'COMPLETED',
                'total_derived': len(derived_results),
                'failed_formulas': failed_formulas,
                'derived_result_ids': derived_results
            }

        except Exception as e:
            batch.status = 'FAILED'
            batch.save()
            raise e

    @classmethod
    def _evaluate_expression(cls, expression, variables):
        safe_namespace = {
            '__builtins__': {},
            **cls.SAFE_FUNCTIONS,
            **variables
        }
        try:
            tree = ast.parse(expression, mode='eval')
            code = compile(tree, '<string>', 'eval')
            result = eval(code, safe_namespace)
            return result
        except Exception as e:
            raise ValueError(f"Expression error: {str(e)}")

    @classmethod
    def _log_execution(cls, batch_id, participant_id, formula_binding_id,
                       input_snapshot, output_value, status, error_trace=''):
        FormulaExecutionLog.objects.create(
            batch_id=batch_id,
            execution_id=None,
            participant_id=participant_id,
            formula_binding_id=formula_binding_id,
            input_snapshot=input_snapshot,
            output_value=output_value,
            output_unit='',
            status=status,
            error_trace=error_trace
        )