from celery import shared_task
from .services import OutboxService

@shared_task
def process_outbox():
    OutboxService.process_pending()