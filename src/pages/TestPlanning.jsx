import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TestPlanning.css';

// 📌 BASE URL AYARI
const API_BASE_URL = 'http://localhost:8000/api/v1';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

function TestPlanning() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [testDefinitions, setTestDefinitions] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newSession, setNewSession] = useState({
    code: '',
    name_tr: '',
    name_en: '',
    participation_mode: 'GROUP',
  });

  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);

  const [newParticipant, setNewParticipant] = useState({
    athlete_ref: '',
    source_type: 'INDIVIDUAL'
  });

  const [newTestItem, setNewTestItem] = useState({
    test_definition_version_ref: '',
    sequence_order: 1,
    is_mandatory: true
  });

  const [newAssignment, setNewAssignment] = useState({
    participant_id: '',
    test_item_id: '',
    inclusion_status: 'PLANNED'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, testsRes, athletesRes] = await Promise.all([
          api.get('/planning/test-sessions/'),
          api.get('/catalog/test-definitions/'),
          api.get('/core/athlete-profiles/')
        ]);
        setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
        setTestDefinitions(Array.isArray(testsRes.data) ? testsRes.data : []);
        setAthletes(Array.isArray(athletesRes.data) ? athletesRes.data : []);
        setLoading(false);
      } catch (err) {
        setError('Veriler yüklenirken hata oluştu.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: newSession.code,
        name: { tr: newSession.name_tr, en: newSession.name_en },
        participation_mode: newSession.participation_mode
      };
      const response = await api.post('/planning/test-sessions/', payload);
      setSessions([...sessions, response.data]);
      setNewSession({ code: '', name_tr: '', name_en: '', participation_mode: 'GROUP' });
      alert('✅ Test oturumu oluşturuldu!');
    } catch (err) {
      alert('❌ Oturum oluşturulamadı: ' + (err.response?.data?.detail || err.message));
    }
  };

  const fetchSessionDetail = async (sessionCode) => {
    try {
      const response = await api.get(`/planning/test-sessions/${sessionCode}/`);
      console.log('📋 Session Detail:', response.data);
      setSessionDetail(response.data);
      setSelectedSession(sessionCode);
      if (response.data.revisions && response.data.revisions.length > 0) {
        const revId = response.data.revisions[0].id;
        setSelectedRevision(revId);
        return revId;
      } else {
        setSelectedRevision(null);
        return null;
      }
    } catch (err) {
      alert('❌ Oturum detayı alınamadı.');
      return null;
    }
  };

  const getRevisionId = async (sessionCode) => {
    if (selectedRevision) return selectedRevision;
    const revId = await fetchSessionDetail(sessionCode);
    return revId;
  };

  // ================== KATILIMCI EKLE + OTOMATİK EŞLEŞTİRME ==================
  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!selectedSession) {
      alert('❌ Lütfen önce bir oturum seçin.');
      return;
    }
    let revId = selectedRevision;
    if (!revId) {
      revId = await getRevisionId(selectedSession);
      if (!revId) {
        alert('❌ Revision bulunamadı.');
        return;
      }
    }
    try {
      // 1. Katılımcıyı ekle
      const participantPayload = {
        revision: revId,
        athlete_ref: newParticipant.athlete_ref,
        source_type: newParticipant.source_type,
        inclusion_status: 'PLANNED'
      };
      const participantRes = await api.post('/planning/test-session-participants/', participantPayload);
      const newParticipantId = participantRes.data.id;

      // 2. Önce sessionDetail'i güncelle (test_items'leri almak için)
      await fetchSessionDetail(selectedSession);
      
      // 3. Oturumdaki tüm test item'larını al (güncel sessionDetail'den)
      const testItems = sessionDetail?.test_items || [];
      
      // 4. Her test item için otomatik assignment oluştur
      for (const testItem of testItems) {
        await api.post('/planning/participant-test-assignments/', {
          revision: revId,
          participant: newParticipantId,
          test_item: testItem.id,
          inclusion_status: 'PLANNED'
        });
      }

      // 5. Son durumu güncelle
      await fetchSessionDetail(selectedSession);
      setNewParticipant({ athlete_ref: '', source_type: 'INDIVIDUAL' });
      alert(`✅ Katılımcı eklendi ve ${testItems.length} test ile eşleştirildi!`);
    } catch (err) {
      alert('❌ Katılımcı eklenemedi: ' + (err.response?.data?.detail || err.message));
    }
  };

  // ================== TEST EKLE ==================
  const handleAddTestItem = async (e) => {
    e.preventDefault();
    if (!selectedSession) {
      alert('❌ Lütfen önce bir oturum seçin.');
      return;
    }
    let revId = selectedRevision;
    if (!revId) {
      revId = await getRevisionId(selectedSession);
      if (!revId) {
        alert('❌ Revision bulunamadı.');
        return;
      }
    }
    try {
      const payload = {
        revision: revId,
        test_definition_version_ref: newTestItem.test_definition_version_ref,
        protocol_version_ref: null,
        sequence_order: newTestItem.sequence_order,
        is_mandatory: newTestItem.is_mandatory
      };
      
      console.log('📤 Gönderilen payload:', payload);
      
      const url = '/planning/test-session-test-items/';
      const response = await api.post(url, payload);
      
      console.log('✅ Yanıt:', response.data);
      
      await fetchSessionDetail(selectedSession);
      setNewTestItem({
        test_definition_version_ref: '',
        sequence_order: 1,
        is_mandatory: true
      });
      alert('✅ Test item eklendi!');
    } catch (err) {
      console.error('❌ Hata:', err.response?.data || err.message);
      alert('❌ Test item eklenemedi: ' + (err.response?.data?.detail || err.response?.data || err.message));
    }
  };

  // ================== ASSIGNMENT (OTOMATİK YAPILIYOR, BU BUTON KALKIYOR) ==================
  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!selectedSession) {
      alert('❌ Lütfen önce bir oturum seçin.');
      return;
    }
    let revId = selectedRevision;
    if (!revId) {
      revId = await getRevisionId(selectedSession);
      if (!revId) {
        alert('❌ Revision bulunamadı.');
        return;
      }
    }
    try {
      const payload = {
        revision: revId,
        participant: newAssignment.participant_id,
        test_item: newAssignment.test_item_id,
        inclusion_status: newAssignment.inclusion_status
      };
      const url = '/planning/participant-test-assignments/';
      await api.post(url, payload);
      await fetchSessionDetail(selectedSession);
      setNewAssignment({
        participant_id: '',
        test_item_id: '',
        inclusion_status: 'PLANNED'
      });
      alert('✅ Assignment oluşturuldu!');
    } catch (err) {
      alert('❌ Assignment oluşturulamadı: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleLockSession = async () => {
    if (!selectedSession) return;
    try {
      await api.post(`/planning/test-sessions/${selectedSession}/lock/`);
      alert('🔒 Oturum lock\'landı! ExecutionHandoff oluşturuldu.');
      await fetchSessionDetail(selectedSession);
    } catch (err) {
      alert('❌ Lock işlemi başarısız: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCancelSession = async () => {
    if (!selectedSession) return;
    if (!window.confirm('Bu oturumu iptal etmek istediğinize emin misiniz?')) return;
    try {
      await api.post(`/planning/test-sessions/${selectedSession}/cancel/`);
      alert('✅ Oturum iptal edildi.');
      await fetchSessionDetail(selectedSession);
    } catch (err) {
      alert('❌ İptal işlemi başarısız: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="planning-container">
      <div className="planning-header">
        <h2>📋 Test Planlama</h2>
        <button className="back-btn" onClick={() => navigate('/')}>← Dashboard</button>
      </div>

      <div className="card">
        <h3>➕ Yeni Test Oturumu</h3>
        <form onSubmit={handleCreateSession} className="form-grid">
          <div className="form-group">
            <label>Kod *</label>
            <input
              type="text"
              placeholder="örn: TS-2026-001"
              value={newSession.code}
              onChange={(e) => setNewSession({ ...newSession, code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Ad (TR) *</label>
            <input
              type="text"
              placeholder="Türkçe ad"
              value={newSession.name_tr}
              onChange={(e) => setNewSession({ ...newSession, name_tr: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Ad (EN) *</label>
            <input
              type="text"
              placeholder="English name"
              value={newSession.name_en}
              onChange={(e) => setNewSession({ ...newSession, name_en: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Katılım Modu</label>
            <select
              value={newSession.participation_mode}
              onChange={(e) => setNewSession({ ...newSession, participation_mode: e.target.value })}
            >
              <option value="INDIVIDUAL">Bireysel</option>
              <option value="GROUP">Grup</option>
              <option value="MIXED">Karma</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="submit-btn">Oluştur</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>📂 Mevcut Oturumlar</h3>
        {sessions.length === 0 ? (
          <p className="empty-text">Henüz test oturumu bulunmuyor.</p>
        ) : (
          <div className="session-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="session-item"
                onClick={() => fetchSessionDetail(session.code)}
              >
                <span className="session-code">{session.code}</span>
                <span className="session-name">{session.name?.tr || session.name}</span>
                <span className={`session-status status-${session.lifecycle_status?.toLowerCase()}`}>
                  {session.lifecycle_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {sessionDetail && selectedSession && (
        <div className="card detail-card">
          <div className="detail-header">
            <h3>📄 Oturum Detayı: {sessionDetail.code}</h3>
            <div>
              <span className={`session-status status-${sessionDetail.lifecycle_status?.toLowerCase()}`}>
                {sessionDetail.lifecycle_status}
              </span>
            </div>
          </div>

          <div className="detail-grid">
            <div><strong>Katılım Modu:</strong> {sessionDetail.participation_mode}</div>
            <div><strong>Durum:</strong> {sessionDetail.lifecycle_status}</div>
          </div>

          {sessionDetail.revisions && sessionDetail.revisions.length > 0 && (
            <div className="revision-info">
              <h4>📌 Revision #{sessionDetail.revisions[0].revision_no}</h4>
              <div className="detail-grid">
                <div><strong>Başlangıç:</strong> {sessionDetail.revisions[0].planned_start || 'Belirtilmemiş'}</div>
                <div><strong>Bitiş:</strong> {sessionDetail.revisions[0].planned_end || 'Belirtilmemiş'}</div>
                <div><strong>Zaman Dilimi:</strong> {sessionDetail.revisions[0].timezone || 'UTC'}</div>
              </div>
            </div>
          )}

          {/* 📌 KATILIMCI EKLE (Otomatik eşleştirme ile) */}
          <div className="sub-section">
            <h4>➕ Katılımcı Ekle (Otomatik Eşleştirme)</h4>
            <form onSubmit={handleAddParticipant} className="form-row">
              <select
                value={newParticipant.athlete_ref}
                onChange={(e) => setNewParticipant({ ...newParticipant, athlete_ref: e.target.value })}
                required
                className="form-select"
              >
                <option value="">Sporcu Seç</option>
                {athletes.map((ath) => (
                  <option key={ath.id} value={ath.person.id}>
                    {ath.person.first_name} {ath.person.last_name}
                  </option>
                ))}
              </select>
              <button type="submit" className="small-btn">Ekle</button>
            </form>
            {sessionDetail.participants && sessionDetail.participants.length > 0 && (
              <div className="mini-list">
                {sessionDetail.participants.map((p) => {
                  const athlete = athletes.find(a => a.person.id === p.athlete_ref);
                  return (
                    <span key={p.id} className="mini-tag">
                      {athlete ? `${athlete.person.first_name} ${athlete.person.last_name}` : p.athlete_ref}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* 📌 TEST EKLE (Protokol dropdown'ı kaldırıldı) */}
          <div className="sub-section">
            <h4>➕ Test Ekle</h4>
            <form onSubmit={handleAddTestItem} className="form-row">
              <select
                value={newTestItem.test_definition_version_ref}
                onChange={(e) => setNewTestItem({ ...newTestItem, test_definition_version_ref: e.target.value })}
                required
                className="form-select"
              >
                <option value="">Test Seç</option>
                {testDefinitions.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.code} - {test.name?.tr || test.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Sıra"
                value={newTestItem.sequence_order}
                onChange={(e) => setNewTestItem({ ...newTestItem, sequence_order: parseInt(e.target.value) || 1 })}
                className="form-input"
                style={{ width: '80px' }}
              />
              <button type="submit" className="small-btn">Ekle</button>
            </form>
            {sessionDetail.test_items && sessionDetail.test_items.length > 0 && (
              <div className="mini-list">
                {sessionDetail.test_items.map((t) => {
                  const test = testDefinitions.find(td => td.id === t.test_definition_version_ref);
                  return (
                    <span key={t.id} className="mini-tag">
                      {test ? test.code : t.test_definition_version_ref}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* 📌 KATILIMCI-TEST EŞLEŞTİRME (Şu an kullanılmıyor, ama dursun) */}
          <div className="sub-section">
            <h4>🔗 Katılımcı-Test Eşleştir (Manuel)</h4>
            <form onSubmit={handleAddAssignment} className="form-row">
              <select
                value={newAssignment.participant_id}
                onChange={(e) => setNewAssignment({ ...newAssignment, participant_id: e.target.value })}
                required
                className="form-select"
              >
                <option value="">Katılımcı Seç</option>
                {sessionDetail.participants?.map((p) => {
                  const athlete = athletes.find(a => a.person.id === p.athlete_ref);
                  return (
                    <option key={p.id} value={p.id}>
                      {athlete ? `${athlete.person.first_name} ${athlete.person.last_name}` : p.athlete_ref}
                    </option>
                  );
                })}
              </select>
              <select
                value={newAssignment.test_item_id}
                onChange={(e) => setNewAssignment({ ...newAssignment, test_item_id: e.target.value })}
                required
                className="form-select"
              >
                <option value="">Test Seç</option>
                {sessionDetail.test_items?.map((t) => {
                  const test = testDefinitions.find(td => td.id === t.test_definition_version_ref);
                  return (
                    <option key={t.id} value={t.id}>
                      {test ? test.code : t.test_definition_version_ref}
                    </option>
                  );
                })}
              </select>
              <button type="submit" className="small-btn">Eşleştir</button>
            </form>
            {sessionDetail.assignments && sessionDetail.assignments.length > 0 && (
              <div className="mini-list">
                {sessionDetail.assignments.map((a) => {
                  const participant = sessionDetail.participants?.find(p => p.id === a.participant_id);
                  const testItem = sessionDetail.test_items?.find(t => t.id === a.test_item_id);
                  const athlete = athletes.find(at => at.person.id === participant?.athlete_ref);
                  const test = testDefinitions.find(td => td.id === testItem?.test_definition_version_ref);
                  return (
                    <span key={a.id} className="mini-tag">
                      {athlete ? `${athlete.person.first_name} ${athlete.person.last_name}` : '?'} → {test ? test.code : '?'}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="action-row">
            {sessionDetail.lifecycle_status !== 'LOCKED' && sessionDetail.lifecycle_status !== 'CANCELLED' && (
              <>
                <button className="lock-btn" onClick={handleLockSession}>
                  🔒 Oturumu Lock'la
                </button>
                <button className="cancel-btn" onClick={handleCancelSession}>
                  ❌ Oturumu İptal Et
                </button>
              </>
            )}
            {sessionDetail.lifecycle_status === 'LOCKED' && (
              <p className="locked-info">🔒 Bu oturum lock'lanmıştır. Değişiklik yapılamaz.</p>
            )}
            {sessionDetail.lifecycle_status === 'CANCELLED' && (
              <p className="cancelled-info">⛔ Bu oturum iptal edilmiştir.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TestPlanning;