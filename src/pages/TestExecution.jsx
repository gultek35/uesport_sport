import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TestExecution.css';

// 📌 BASE URL AYARI
const API_BASE_URL = 'http://localhost:8000/api/v1';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

function TestExecution() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [executionSession, setExecutionSession] = useState(null);
  const [startingExecution, setStartingExecution] = useState(false);
  
  // 📌 Attempt için state
  const [attemptValues, setAttemptValues] = useState({});
  const [attemptUnits, setAttemptUnits] = useState({});

  // 📌 Locklanmış oturumları ve sporcu listesini getir
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, athletesRes] = await Promise.all([
          api.get('/planning/test-sessions/?lifecycle_status=LOCKED'),
          api.get('/core/athlete-profiles/')
        ]);
        setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
        setAthletes(Array.isArray(athletesRes.data) ? athletesRes.data : []);
        setLoading(false);
      } catch (err) {
        setError('Veriler yüklenirken hata oluştu.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 📌 Bir oturumu seç - code kullan
  const handleSelectSession = async (session) => {
    try {
      const detailRes = await api.get(`/planning/test-sessions/${session.code}/`);
      console.log('📋 Session Detail:', detailRes.data);
      console.log('📋 Participants:', detailRes.data.participants);
      console.log('📋 Test Items:', detailRes.data.test_items);
      setSessionDetail(detailRes.data);
      setSelectedSession(session.code);
      setExecutionSession(null);
    } catch (err) {
      console.error('❌ Detay hatası:', err.response?.data || err.message);
      alert('❌ Oturum detayı alınamadı: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Execution'u manuel başlat
  const handleStartExecution = async () => {
    if (!sessionDetail) {
      alert('⚠️ Lütfen önce bir oturum seçin.');
      return;
    }
    setStartingExecution(true);

    try {
      const handoffId = sessionDetail.handoffs?.[0]?.id;
      console.log('🔑 Handoff ID:', handoffId);

      if (!handoffId) {
        alert('⚠️ Bu oturum için ExecutionHandoff bulunamadı. Lütfen oturumu lock\'layın.');
        setStartingExecution(false);
        return;
      }

      const execRes = await api.post('/execution/sessions/', {
        handoff_id: handoffId,
        current_operator_id: null,
        location_actual: 'Saha'
      });
      setExecutionSession(execRes.data);
      alert('✅ Execution başlatıldı!');
    } catch (err) {
      console.error('❌ Execution hatası:', err);
      try {
        const handoffId = sessionDetail.handoffs?.[0]?.id;
        if (handoffId) {
          const execList = await api.get(`/execution/sessions/?handoff_id=${handoffId}`);
          if (execList.data && execList.data.length > 0) {
            setExecutionSession(execList.data[0]);
            alert('✅ Mevcut execution bulundu.');
          } else {
            alert('❌ Execution başlatılamadı: ' + (err.response?.data?.detail || err.message));
          }
        } else {
          alert('❌ Execution başlatılamadı: ' + (err.response?.data?.detail || err.message));
        }
      } catch (e) {
        alert('❌ Execution başlatılamadı: ' + (e.response?.data?.detail || e.message));
      }
    }
    setStartingExecution(false);
  };

  // 📌 Run başlat - Run ID'yi kaydet
  const startRun = async (participantId, testItemId) => {
    if (!executionSession) {
      alert('⚠️ Önce execution başlatın.');
      return;
    }
    try {
      const response = await api.post('/execution/runs/', {
        execution_session: executionSession.id,
        participant_ref: participantId,
        test_item_ref: testItemId,
        status: 'PENDING'
      });
      console.log('✅ Run oluşturuldu:', response.data);
      console.log('📌 Run ID:', response.data.id);
      alert(`✅ Run başlatıldı! Run ID: ${response.data.id}`);
    } catch (err) {
      console.error('❌ Run hatası:', err.response?.data || err.message);
      alert('❌ Run başlatılamadı: ' + (err.response?.data?.detail || err.message));
    }
  };

  // 📌 Attempt ekle - raw_unit_ref null gönder
  const addAttempt = async (runId, participantId) => {
    if (!executionSession) {
      alert('⚠️ Önce execution başlatın.');
      return;
    }
    const value = attemptValues[participantId];
    
    if (!value) {
      alert('⚠️ Lütfen ölçüm değerini girin.');
      return;
    }
    
    try {
      const payload = {
        run: runId,
        attempt_number: 1,
        raw_value: parseFloat(value),
        raw_unit_ref: null,   // ✅ null gönder
        captured_at: new Date().toISOString(),
        operator_id: null,    // ✅ null gönder
        is_valid: true,
        notes: 'Manuel giriş'
      };
      
      console.log('📤 Gönderilen payload:', payload);
      
      const response = await api.post('/execution/attempts/', payload);
      console.log('✅ Attempt kaydedildi:', response.data);
      alert('✅ Attempt kaydedildi!');
      // 📌 Input alanlarını temizle
      setAttemptValues({ ...attemptValues, [participantId]: '' });
      setAttemptUnits({ ...attemptUnits, [participantId]: '' });
    } catch (err) {
      console.error('❌ Attempt hatası:', err.response?.data || err.message);
      // 📌 Detaylı hata mesajını göster
      const errorDetail = err.response?.data?.detail || 
                         err.response?.data?.operator_id?.[0] ||
                         err.response?.data?.raw_unit_ref?.[0] ||
                         err.response?.data?.run?.[0] ||
                         JSON.stringify(err.response?.data);
      alert('❌ Attempt kaydedilemedi: ' + errorDetail);
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="execution-container">
      <div className="execution-header">
        <h2>🧪 Test Execution</h2>
        <button className="back-btn" onClick={() => navigate('/')}>← Dashboard</button>
      </div>

      {/* Locklanmış Oturumlar */}
      <div className="card">
        <h3>🔒 Locklanmış Oturumlar</h3>
        {sessions.length === 0 ? (
          <p className="empty-text">Henüz locklanmış oturum bulunmuyor.</p>
        ) : (
          <div className="session-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${selectedSession === session.code ? 'active' : ''}`}
                onClick={() => handleSelectSession(session)}
              >
                <span className="session-code">{session.code}</span>
                <span className="session-name">{session.name?.tr || session.name}</span>
                <span className="session-status status-locked">LOCKED</span>
                {selectedSession === session.code && <span className="selected-badge">✓ Seçili</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Detayı */}
      {sessionDetail && (
        <div className="card detail-card">
          <h3>📄 Oturum: {sessionDetail.code}</h3>
          <div className="detail-grid">
            <div><strong>Katılım Modu:</strong> {sessionDetail.participation_mode}</div>
            <div><strong>Durum:</strong> {sessionDetail.lifecycle_status}</div>
          </div>

          {/* Execution Başlat Butonu */}
          {!executionSession ? (
            <div className="start-execution-area">
              <p>Bu oturum için execution henüz başlatılmamış.</p>
              <button
                className="start-execution-btn"
                onClick={handleStartExecution}
                disabled={startingExecution}
              >
                {startingExecution ? 'Başlatılıyor...' : '🚀 Execution Başlat'}
              </button>
            </div>
          ) : (
            <div className="execution-started">
              <p>✅ Execution aktif! (ID: {executionSession.id})</p>
              <p><strong>Durum:</strong> {executionSession.status}</p>
            </div>
          )}

          {/* 📌 Katılımcılar - Run Başlat ve Attempt Ekle */}
          <div className="execution-grid">
            <div className="execution-section">
              <h4>👤 Katılımcılar</h4>
              {sessionDetail.participants && sessionDetail.participants.length > 0 ? (
                sessionDetail.participants.map((p) => {
                  const athlete = athletes.find(a => a.person?.id === p.athlete_ref);
                  return (
                    <div key={p.id} className="participant-item">
                      <div className="participant-name">
                        <span>
                          {athlete?.person?.first_name} {athlete?.person?.last_name || 'İsimsiz Sporcu'}
                        </span>
                      </div>
                      <div className="participant-actions">
                        <button
                          className="small-btn run-btn"
                          onClick={() => startRun(p.athlete_ref, sessionDetail.test_items?.[0]?.id)}
                          disabled={!executionSession}
                        >
                          Run Başlat
                        </button>
                        <div className="attempt-inputs">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Değer *"
                            value={attemptValues[p.athlete_ref] || ''}
                            onChange={(e) => setAttemptValues({
                              ...attemptValues,
                              [p.athlete_ref]: e.target.value
                            })}
                            className="attempt-input"
                            disabled={!executionSession}
                          />
                          <input
                            type="text"
                            placeholder="Birim (opsiyonel)"
                            value={attemptUnits[p.athlete_ref] || ''}
                            onChange={(e) => setAttemptUnits({
                              ...attemptUnits,
                              [p.athlete_ref]: e.target.value
                            })}
                            className="attempt-input"
                            style={{ width: '80px' }}
                            disabled={!executionSession}
                          />
                          <button
                            className="small-btn attempt-btn"
                            onClick={() => {
                              const runId = prompt('Run ID girin (console\'dan kopyalayın):');
                              if (runId) {
                                addAttempt(runId, p.athlete_ref);
                              }
                            }}
                            disabled={!executionSession}
                          >
                            Attempt Ekle
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="empty-text">Henüz katılımcı eklenmemiş.</p>
              )}
            </div>

            <div className="execution-section">
              <h4>🧪 Testler</h4>
              {sessionDetail.test_items && sessionDetail.test_items.length > 0 ? (
                sessionDetail.test_items.map((t) => {
                  const testDef = sessionDetail.test_definitions?.find(td => td.id === t.test_definition_version_ref);
                  return (
                    <div key={t.id} className="test-item">
                      <span>{testDef?.code || t.test_definition_version_ref}</span>
                      <span className="test-order">Sıra: {t.sequence_order}</span>
                    </div>
                  );
                })
              ) : (
                <p className="empty-text">Henüz test eklenmemiş.</p>
              )}
            </div>
          </div>

          {/* Execution Kontrolleri */}
          {executionSession && (
            <div className="action-row">
              <button className="complete-btn" onClick={() => alert('Execution tamamlandı!')}>
                ✅ Execution'u Tamamla
              </button>
              <button className="abort-btn" onClick={() => alert('Execution iptal edildi!')}>
                ❌ Execution'u İptal Et
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TestExecution;