from celery import shared_task
from .services import NormEngine

@shared_task
def process_norm(batch_id):
    return NormEngine.calculate_for_batch(batch_id)