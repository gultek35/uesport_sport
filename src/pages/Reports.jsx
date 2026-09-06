import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Reports.css";

const API_BASE_URL = "http://localhost:8000/api/v1";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function Reports() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await api.get("/core/athlete-profiles/");
        setAthletes(response.data);
      } catch (err) {
        console.error("Sporcu listesi alınamadı:", err);
      }
    };
    fetchAthletes();
  }, []);

  const generateReport = async () => {
    if (!selectedAthlete) {
      alert("Lütfen bir sporcu seçin!");
      return;
    }

    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const response = await api.get(`/reporting/athlete/${selectedAthlete}/`);
      setReportData(response.data);
    } catch (err) {
      setError("Rapor oluşturulamadı: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 📌 PDF İndir Fonksiyonu
  const downloadPDF = async () => {
    if (!selectedAthlete) {
      alert("Lütfen bir sporcu seçin!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/reporting/athlete/pdf/?athlete_id=${selectedAthlete}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapor_${selectedAthlete.slice(0,8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("PDF indirilemedi: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getLabelColor = (label) => {
    const labels = {
      "Mükemmel": "#28a745",
      "Çok İyi": "#20c997",
      "İyi": "#17a2b8",
      "Ortalama": "#ffc107",
      "Zayıf": "#fd7e14",
      "Çok Zayıf": "#dc3545"
    };
    return labels[label] || "#6c757d";
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>📊 Raporlama</h2>
        <button className="back-btn" onClick={() => navigate("/")}>← Dashboard</button>
      </div>

      <div className="report-controls">
        <div className="control-group">
          <label>Sporcu Seç</label>
          <select
            value={selectedAthlete}
            onChange={(e) => setSelectedAthlete(e.target.value)}
            className="athlete-select"
          >
            <option value="">Sporcu seçin</option>
            {athletes.map((ath) => (
              <option key={ath.id} value={ath.id}>
                {ath.person?.first_name} {ath.person?.last_name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="generate-btn"
          onClick={generateReport}
          disabled={loading || !selectedAthlete}
        >
          {loading ? "Rapor oluşturuluyor..." : "📄 Rapor Oluştur"}
        </button>

        {/* 📌 PDF İndir Butonu */}
        <button
          className="download-pdf-btn"
          onClick={downloadPDF}
          disabled={loading || !selectedAthlete || !reportData}
        >
          📥 PDF İndir
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {reportData && (
        <div className="report-content">
          <div className="report-header">
            <h3>🏃 {reportData.sporcu?.ad_soyad} - Performans Raporu</h3>
            <p className="report-date">📅 {new Date(reportData.rapor_tarihi).toLocaleDateString("tr-TR")}</p>
          </div>

          <div className="athlete-info">
            <div className="info-item"><strong>Yaş:</strong> {reportData.sporcu?.yas}</div>
            <div className="info-item"><strong>Cinsiyet:</strong> {reportData.sporcu?.cinsiyet}</div>
            <div className="info-item"><strong>Seviye:</strong> {reportData.sporcu?.level}</div>
            <div className="info-item"><strong>Toplam Test:</strong> {reportData.toplam_test_sayisi}</div>
          </div>

          <h4 className="section-title">📋 Test Sonuçları</h4>
          <div className="results-grid">
            {reportData.sonuclar?.map((sonuc, index) => (
              <div key={index} className="result-card">
                <div className="result-header">
                  <span className="test-name">{sonuc.test_adi || sonuc.test_kodu}</span>
                  <span className="test-code">{sonuc.test_kodu}</span>
                </div>
                <div className="result-values">
                  <div className="value-row">
                    <span className="label">Değer:</span>
                    <span className="number">{sonuc.deger}</span>
                    <span className="unit">{sonuc.birim}</span>
                  </div>
                  {sonuc.norm_bilgisi && (
                    <>
                      <div className="norm-row">
                        <span className="label">Norm Ortalama:</span>
                        <span className="number">{sonuc.norm_bilgisi.ortalama}</span>
                      </div>
                      <div className="norm-row">
                        <span className="label">Yüzdelik Dilim:</span>
                        <span className="number">{sonuc.norm_bilgisi.yuzdelik_dilim}%</span>
                      </div>
                      <div className="norm-row">
                        <span className="label">Z-Skor:</span>
                        <span className="number">{sonuc.norm_bilgisi.z_skor}</span>
                      </div>
                      <div className="label-tag">
                        <span 
                          className="label-badge"
                          style={{ backgroundColor: getLabelColor(sonuc.norm_bilgisi.etiket) }}
                        >
                          {sonuc.norm_bilgisi.etiket || "Değerlendirme Yok"}
                        </span>
                      </div>
                    </>
                  )}
                  {sonuc.ai_yorum && (
                    <div className="ai-comment">
                      <span className="ai-icon">🤖</span>
                      <span className="ai-text">{sonuc.ai_yorum}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {reportData.ozet && (
            <div className="summary-section">
              <h4 className="section-title">📝 Performans Özeti</h4>
              <p className="summary-text">{reportData.ozet.genel_degerlendirme}</p>
              <div className="summary-grid">
                <div className="strengths">
                  <h5>💪 Güçlü Yönler</h5>
                  <ul>
                    {reportData.ozet.guclu_yonler?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="improvements">
                  <h5>📈 Gelişim Alanları</h5>
                  <ul>
                    {reportData.ozet.gelisim_alanlari?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {reportData.ai_ozet && (
                <div className="ai-summary">
                  <h5>🤖 AI Değerlendirmesi</h5>
                  <p>{reportData.ai_ozet}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;