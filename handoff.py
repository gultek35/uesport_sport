from planning.models import TestSession, ExecutionHandoff
from django.utils import timezone
from datetime import timedelta

try:
    session = TestSession.objects.get(code='TS-2026-07')
    revision = session.revisions.filter(is_current=True).first()

    if revision:
        participants = revision.participants.all().values('id', 'athlete_ref')
        test_items = revision.test_items.all().values('id', 'test_definition_version_ref', 'protocol_version_ref')

        handoff = ExecutionHandoff.objects.create(
            revision=revision,
            semantic_hash=revision.semantic_hash,
            snapshot_payload={
                'session_id': str(session.id),
                'revision_id': str(revision.id),
                'participants': list(participants),
                'test_items': list(test_items)
            },
            issued_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=7)
        )
        print(f"Handoff olusturuldu! ID: {handoff.id}")
    else:
        print("Revision bulunamadi")
except Exception as e:
    print(f"Hata: {e}")