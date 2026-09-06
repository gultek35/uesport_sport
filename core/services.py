from .models import Outbox
import json
from django.utils import timezone

class OutboxService:
    @staticmethod
    def publish(event_type, payload):
        Outbox.objects.create(
            event_type=event_type,
            payload=payload
        )

    @staticmethod
    def process_pending():
        pending = Outbox.objects.filter(status='PENDING')
        for outbox in pending:
            try:
                # Event'i işle
                if outbox.event_type == 'MEASUREMENT_RESULT_BATCH_COMPLETED':
                    from formula.tasks import process_formula
                    process_formula.delay(outbox.payload['batch_id'])
                elif outbox.event_type == 'FORMULA_ENGINE_COMPLETED':
                    from norm.tasks import process_norm
                    process_norm.delay(outbox.payload['batch_id'])
                outbox.status = 'SENT'
                outbox.sent_at = timezone.now()
                outbox.save()
            except Exception as e:
                outbox.retry_count += 1
                outbox.last_error = str(e)
                if outbox.retry_count > 3:
                    outbox.status = 'FAILED'
                outbox.save()