from planning.models import TestSession, ExecutionHandoff
from django.utils import timezone
from datetime import timedelta

session = TestSession.objects.get(code='TS-2026-010')
revision = session.revisions.filter(is_current=True).first()

if revision:
    participants = list(revision.participants.all().values('id', 'athlete_ref'))
    test_items = list(revision.test_items.all().values('id', 'test_definition_version_ref', 'protocol_version_ref'))

    # Mevcut handoff'u kontrol et
    handoff = revision.handoffs.first()
    if handoff:
        # Mevcut handoff'u güncelle
        handoff.snapshot_payload['participants'] = participants
        handoff.snapshot_payload['test_items'] = test_items
        handoff.save()
        print(f"✅ Handoff güncellendi! ID: {handoff.id}")
    else:
        # Yeni handoff oluştur
        handoff = ExecutionHandoff.objects.create(
            revision=revision,
            semantic_hash=revision.semantic_hash,
            snapshot_payload={
                'session_id': str(session.id),
                'revision_id': str(revision.id),
                'participants': participants,
                'test_items': test_items
            },
            issued_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=7)
        )
        print(f"✅ Yeni handoff oluşturuldu! ID: {handoff.id}")
else:
    print("❌ Revision yok!")