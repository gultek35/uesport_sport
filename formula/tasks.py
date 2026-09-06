from celery import shared_task
from .services import FormulaEngine

@shared_task
def process_formula(batch_id):
    return FormulaEngine.calculate_for_batch(batch_id)