import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import './SetupWizard.css';

// 📌 DİL SEÇENEKLERİ
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

// 📌 ÜLKE SEÇENEKLERİ
const COUNTRIES = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
];

function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedCountry, setSelectedCountry] = useState('TR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
  };

  const handleCountrySelect = (countryCode) => {
    setSelectedCountry(countryCode);
  };

  const completeSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/v1/core/user-setup/', {
        preferred_language: selectedLanguage,
        preferred_country: selectedCountry,
        is_setup_completed: true,
      });

      console.log('✅ Setup tamamlandı:', response.data);
      
      // 📌 Kullanıcı bilgilerini güncelle
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      navigate('/');
    } catch (err) {
      console.error('❌ Setup hatası:', err.response?.data || err.message);
      setError('Kurulum tamamlanamadı. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const goNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  // 📌 Adım 1: Dil Seçimi
  const renderStep1 = () => (
    <div className="step">
      <h2>🌍 Dil Seçin</h2>
      <p>UESPORT'u hangi dilde kullanmak istersiniz?</p>
      <div className="language-grid">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            className={`lang-btn ${selectedLanguage === lang.code ? 'selected' : ''}`}
            onClick={() => handleLanguageSelect(lang.code)}
          >
            <span className="flag">{lang.flag}</span>
            <span className="name">{lang.name}</span>
          </button>
        ))}
      </div>
      <button className="next-btn" onClick={goNext}>
        Devam →
      </button>
    </div>
  );

  // 📌 Adım 2: Ülke Seçimi
  const renderStep2 = () => (
    <div className="step">
      <h2>📍 Ülke Seçin</h2>
      <p>Bulunduğunuz ülkeyi seçin.</p>
      <div className="country-grid">
        {COUNTRIES.map((country) => (
          <button
            key={country.code}
            className={`country-btn ${selectedCountry === country.code ? 'selected' : ''}`}
            onClick={() => handleCountrySelect(country.code)}
          >
            {country.name}
          </button>
        ))}
      </div>
      <div className="step-actions">
        <button className="back-btn" onClick={goBack}>← Geri</button>
        <button className="next-btn" onClick={goNext}>Devam →</button>
      </div>
    </div>
  );

  // 📌 Adım 3: Özet ve Tamamlama
  const renderStep3 = () => {
    const selectedLang = LANGUAGES.find(l => l.code === selectedLanguage);
    const selectedCountryObj = COUNTRIES.find(c => c.code === selectedCountry);

    return (
      <div className="step">
        <h2>✅ Kurulumu Tamamlayın</h2>
        <p>Seçimlerinizi kontrol edin ve UESPORT'a başlayın.</p>
        <div className="summary">
          <div className="summary-item">
            <span className="summary-label">🌍 Dil:</span>
            <span className="summary-value">{selectedLang?.flag} {selectedLang?.name}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">📍 Ülke:</span>
            <span className="summary-value">{selectedCountryObj?.name}</span>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="step-actions">
          <button className="back-btn" onClick={goBack}>← Geri</button>
          <button 
            className="complete-btn" 
            onClick={completeSetup}
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : '🚀 UESPORT\'a Başla'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-logo">
          <h1>🏃 UESPORT</h1>
          <p>Athlete Intelligence Platform</p>
        </div>

        <div className="setup-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Dil</span>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Ülke</span>
          </div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Tamamla</span>
          </div>
        </div>

        <div className="setup-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
}

export default SetupWizard;