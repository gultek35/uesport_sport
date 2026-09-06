import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

// 📌 API BASE URL
const API_BASE_URL = "http://localhost:8000/api/v1";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 📌 OPENWEATHER API KEY
const WEATHER_API_KEY = "bb091ced1fb89048c7263f1fbad46fe5";

// 📌 NAVİGASYON
const navItems = [
  { icon: "⌂", label: "Ana Sayfa", active: true, path: "/" },
  { icon: "♙", label: "Sporcular", path: "/athletes" },
  { icon: "▣", label: "Test Merkezi", path: "/planning" },
  { icon: "ƒ", label: "Formül Motoru", path: "/formula" },
  { icon: "◎", label: "Norm Motoru", path: "/norm" },
  { icon: "▤", label: "Sıralama", path: "/ranking" },
  { icon: "⌖", label: "Scout", path: "/scout" },
  { icon: "★", label: "Yetenek Projeksiyonu", path: "/projection" },
  { icon: "◇", label: "Risk Analizi", path: "/risk" },
  { icon: "▧", label: "Raporlar", path: "/reports" },
  { icon: "⬡", label: "Organizasyon", path: "/organizations" },
  { icon: "☁", label: "Çevresel Faktörler", path: "/environment" },
  { icon: "⚙", label: "Ayarlar", path: "/settings" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [athleteCount, setAthleteCount] = useState(0);
  const [testCount, setTestCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [location, setLocation] = useState("İstanbul");
  
  const [sportDistribution, setSportDistribution] = useState([]);
  const [sportTotal, setSportTotal] = useState(0);
  const [orgDistribution, setOrgDistribution] = useState([]);
  const [orgTotal, setOrgTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));

        const [athletesRes, testsRes, sessionsRes] = await Promise.all([
          api.get("/core/athlete-profiles/"),
          api.get("/catalog/test-definitions/"),
          api.get("/planning/test-sessions/"),
        ]);
        setAthleteCount(athletesRes.data?.length || 0);
        setTestCount(testsRes.data?.length || 0);
        setSessionCount(sessionsRes.data?.length || 0);
        
        try {
          const distRes = await api.get("/reporting/athlete/sport_distribution/");
          setSportDistribution(distRes.data.distribution || []);
          setSportTotal(distRes.data.total || 0);
        } catch (distErr) {
          setSportDistribution([
            { level: 'U16', count: 96 },
            { level: 'U18', count: 54 },
            { level: 'U21', count: 32 },
            { level: 'SENIOR', count: 28 },
          ]);
          setSportTotal(210);
        }
        
        try {
          const orgRes = await api.get("/core/organizations/");
          const orgData = orgRes.data || [];
          const orgMap = {};
          orgData.forEach(org => {
            const type = org.type || 'Diğer';
            orgMap[type] = (orgMap[type] || 0) + 1;
          });
          const orgDistributionData = Object.keys(orgMap).map(key => ({
            type: key,
            count: orgMap[key]
          }));
          setOrgDistribution(orgDistributionData.length > 0 ? orgDistributionData : [
            { type: 'CLUB', count: 3 },
            { type: 'FEDERATION', count: 2 },
            { type: 'ACADEMY', count: 1 },
          ]);
          setOrgTotal(orgData.length > 0 ? orgData.length : 6);
        } catch (orgErr) {
          setOrgDistribution([
            { type: 'CLUB', count: 3 },
            { type: 'FEDERATION', count: 2 },
            { type: 'ACADEMY', count: 1 },
          ]);
          setOrgTotal(6);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Veriler alınamadı:", err);
        setAthleteCount(128);
        setTestCount(24);
        setSessionCount(186);
        setSportDistribution([
          { level: 'U16', count: 96 },
          { level: 'U18', count: 54 },
          { level: 'U21', count: 32 },
          { level: 'SENIOR', count: 28 },
        ]);
        setSportTotal(210);
        setOrgDistribution([
          { type: 'CLUB', count: 3 },
          { type: 'FEDERATION', count: 2 },
          { type: 'ACADEMY', count: 1 },
        ]);
        setOrgTotal(6);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchWeatherByCoords = async (lat, lon) => {
      try {
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
        );
        setWeather(res.data);
        setLocation(res.data.name || "İstanbul");
        setWeatherLoading(false);
      } catch (err) {
        console.error("Hava durumu alınamadı:", err);
        setWeatherLoading(false);
      }
    };

    const fetchWeatherByIP = async () => {
      try {
        const ipRes = await axios.get('https://ipapi.co/json/');
        const { city, latitude, longitude } = ipRes.data;
        if (latitude && longitude) {
          fetchWeatherByCoords(latitude, longitude);
        } else {
          fetchWeatherByCoords(41.0082, 28.9784);
        }
      } catch (err) {
        console.error("IP ile konum alınamadı:", err);
        fetchWeatherByCoords(41.0082, 28.9784);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fetchWeatherByIP();
        }
      );
    } else {
      fetchWeatherByIP();
    }
  }, []);

  const userName = user?.first_name || user?.username || "Kullanıcı";
  const userRole = user?.role || "Yönetici";
  const currentDate = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });

  const metrics = [
    {
      label: "Toplam Sporcu",
      value: loading ? "..." : athleteCount.toString(),
      change: "+12%",
      changeType: "positive",
      icon: "🏃",
      color: "blue",
    },
    {
      label: "Aktif Testler",
      value: loading ? "..." : sessionCount.toString(),
      change: "+8%",
      changeType: "positive",
      icon: "📋",
      color: "green",
    },
    {
      label: "Tamamlanan Testler",
      value: loading ? "..." : testCount.toString(),
      change: "-3%",
      changeType: "negative",
      icon: "✅",
      color: "orange",
    },
    {
      label: "Organizasyon",
      value: loading ? "..." : orgTotal.toString(),
      change: "+5%",
      changeType: "positive",
      icon: "🏛️",
      color: "purple",
    },
  ];

  const branchColors = ['football', 'basketball', 'volleyball', 'athletics', 'handball', 'swimming'];
  const branchLabels = {
    'U16': 'U16', 'U18': 'U18', 'U21': 'U21',
    'SENIOR': 'Yetişkin', 'Diğer': 'Diğer'
  };

  const displayData = sportDistribution.length > 0 ? sportDistribution : [
    { level: 'U16', count: 96 },
    { level: 'U18', count: 54 },
    { level: 'U21', count: 32 },
    { level: 'SENIOR', count: 28 },
  ];
  const displayTotal = sportTotal > 0 ? sportTotal : 210;

  const orgColors = ['org-club', 'org-federation', 'org-academy', 'org-other'];
  const orgLabels = {
    'CLUB': 'Kulüp', 'FEDERATION': 'Federasyon',
    'ACADEMY': 'Akademi', 'OTHER': 'Diğer'
  };

  return (
    <div className="ues-dashboard">
      {/* ===== SIDEBAR ===== */}
      <aside className="ues-dashboard-sidebar">
        <div className="ues-sidebar-logo">
          <div className="ues-sidebar-logo__mark">U</div>
          <div className="ues-sidebar-brand">
            <strong><span>UE</span>SPORT</strong>
            <small>Sporcu Zeka Platformu</small>
          </div>
        </div>

        <nav className="ues-sidebar-navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={item.active ? "active" : ""}
              onClick={() => navigate(item.path)}
            >
              <span className="ues-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="ues-sidebar-footer">
          <div className="ues-sidebar-promo">
            <div className="ues-sidebar-runner">🏃</div>
            <p>DAHA<br />İYİ SPORCULAR<br />DAHA PARLAK<br />GELECEK</p>
            <i />
          </div>
        </div>
      </aside>

      {/* ===== ANA İÇERİK ===== */}
      <div className="ues-dashboard-shell">
        {/* TOPBAR */}
        <header className="ues-dashboard-topbar">
          <div className="ues-topbar-left">
            <div className="ues-user-info">
              <div className="ues-user-avatar">{userName.charAt(0).toUpperCase()}</div>
              <div>
                <strong>{userName}</strong>
                <span>{userRole}</span>
              </div>
            </div>
          </div>
          <div className="ues-topbar-center">
            <div className="ues-slogan">Sporla Daha İleriye</div>
          </div>
          <div className="ues-topbar-right">
            <button className="ues-notification">♢<i /></button>
            <div className="ues-language">
              <img src="/tr-flag.png" alt="Türkçe" />
              TR
            </div>
            <div className="ues-current-date">
              <span>📅</span>
              <span>{currentDate}</span>
            </div>
          </div>
        </header>

        <main className="ues-dashboard-content">
          <section className="ues-dashboard-welcome">
            <h1>Hoş geldiniz, <span>{userName}</span></h1>
            <p className="ues-welcome-subtitle">UESPORT Sporcu Zeka Platformu'nda bugün neler oluyor?</p>
          </section>

          <section className="ues-dashboard-top-grid">
            <div className="ues-dashboard-primary">
              <div className="ues-metric-grid">
                {metrics.map((m) => (
                  <article key={m.label} className={`ues-metric-card ues-metric-card--${m.color}`}>
                    <div className="ues-metric-card__icon">{m.icon}</div>
                    <div className="ues-metric-card__content">
                      <span>{m.label}</span>
                      <div>
                        <strong>{m.value}</strong>
                        <span className={`ues-change ${m.changeType}`}>{m.change}</span>
                      </div>
                    </div>
                    <div className="ues-metric-trend">
                      {m.changeType === 'positive' ? '📈' : '📉'}
                    </div>
                  </article>
                ))}
              </div>

              <div className="ues-analytics-grid">
                <article className="ues-card ues-org-card">
                  <div className="ues-card-header">
                    <div>
                      <h2>Organizasyon Türlerine Göre</h2>
                      <p>Kulüp, Federasyon, Akademi Dağılımı</p>
                    </div>
                  </div>
                  <div className="ues-org-content">
                    <div className="ues-donut">
                      <div className="ues-donut__center">
                        <strong>{loading ? "..." : orgTotal}</strong>
                        <span>Organizasyon</span>
                      </div>
                    </div>
                    <div className="ues-org-list">
                      {orgDistribution.length > 0 ? (
                        orgDistribution.map((item, index) => {
                          const label = orgLabels[item.type] || item.type || 'Diğer';
                          const color = orgColors[index % orgColors.length];
                          return (
                            <div key={index}>
                              <span><i className={color} />{label}</span>
                              <strong>{item.count}</strong>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{fontSize: '10px', color: '#76879e', padding: '8px'}}>
                          Henüz organizasyon kaydı yok
                        </div>
                      )}
                    </div>
                  </div>
                </article>

                <article className="ues-card ues-sports-card">
                  <div className="ues-card-header">
                    <div>
                      <h2>Spor Branşlarına Göre</h2>
                      <p>Sporcu Dağılımı</p>
                    </div>
                  </div>
                  <div className="ues-sports-content">
                    <div className="ues-donut">
                      <div className="ues-donut__center">
                        <strong>{loading ? "..." : displayTotal}</strong>
                        <span>Sporcu</span>
                      </div>
                    </div>
                    <div className="ues-sports-list">
                      {displayData.map((item, index) => {
                        const label = branchLabels[item.level] || item.level || 'Diğer';
                        const color = branchColors[index % branchColors.length];
                        return (
                          <div key={index}>
                            <span><i className={color} />{label}</span>
                            <strong>{item.count}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <aside className="ues-dashboard-environment">
              <article className="ues-card ues-environment-card">
                <div className="ues-card-header">
                  <div>
                    <h2>Çevresel Faktörler</h2>
                    <p className="ues-location">⌖ {location}</p>
                  </div>
                  <button className="ues-icon-button">⚙</button>
                </div>
                <div className="ues-weather-main">
                  <div className="ues-weather-temperature">
                    <span className="ues-weather-sun">☀</span>
                    <div>
                      <strong>{weatherLoading ? "..." : weather ? `${Math.round(weather.main.temp)}°C` : "--°C"}</strong>
                      <span>{weatherLoading ? "Yükleniyor..." : weather?.weather[0]?.description || "Veri yok"}</span>
                      <small>Hissedilen {weatherLoading ? "..." : weather ? `${Math.round(weather.main.feels_like)}°C` : "--°C"}</small>
                    </div>
                  </div>
                  <div className="ues-weather-details">
                    <div><span>◌</span><p>Nem<strong>{weatherLoading ? "..." : weather ? `${weather.main.humidity}%` : "--%"}</strong></p></div>
                    <div><span>➤</span><p>Rüzgar<strong>{weatherLoading ? "..." : weather ? `${Math.round(weather.wind.speed * 3.6)} km/s` : "--"}</strong></p></div>
                    <div><span>≋</span><p>Hava Kalitesi<strong className="ues-aqi-good">İyi (AQI 32)</strong></p></div>
                  </div>
                </div>
                <div className="ues-weather-forecast">
                  <div><span>09:00</span><b>☀</b><strong>24°</strong></div>
                  <div><span>12:00</span><b>☀</b><strong>27°</strong></div>
                  <div><span>15:00</span><b>☀</b><strong>28°</strong></div>
                  <div><span>18:00</span><b>◐</b><strong>25°</strong></div>
                </div>

                <div className="ues-ai-warnings">
                  <div className="ues-warning-title">
                    <span>🤖</span>
                    <div>
                      <h3>AI Değerlendirmesi</h3>
                      <p>Çevresel koşullara göre</p>
                    </div>
                  </div>
                  <div className="ai-message">
                    {weatherLoading ? 'Yükleniyor...' : weather ? (
                      weather.main.temp > 30 ? 
                        '⚠️ Yüksek sıcaklık uyarısı! Antrenman saatlerini sabah veya akşama alın.' :
                      weather.main.temp < 5 ?
                        '❄️ Soğuk hava uyarısı! Isınma süresini uzatın ve uygun kıyafet kullanın.' :
                      weather.weather[0]?.main === 'Rain' ?
                        '🌧️ Yağmur uyarısı! Açık hava antrenmanlarını kapalı alana alın.' :
                      weather.main.humidity > 70 ?
                        '💧 Yüksek nem! Sıvı alımını artırın ve molaları sıklaştırın.' :
                      '☀️ Uygun hava koşulları. Antrenmanlara devam edin.'
                    ) : 'Hava durumu bilgisi alınamadı.'}
                  </div>
                </div>
              </article>
            </aside>
          </section>

          <section className="ues-dashboard-bottom-grid">
            <article className="ues-card ues-bottom-card ues-bottom-card--risk">
              <div className="ues-card-header">
                <div>
                  <h2>◇ Risk Analizi Özeti</h2>
                  <p>Aktif sporcular</p>
                </div>
                <button className="ues-text-link ues-text-link--white">Detaylar</button>
              </div>
              <div className="ues-risk-summary">
                <div className="ues-risk ues-risk--high"><span>Yüksek Risk</span><strong>5</strong><small>Sporcu</small></div>
                <div className="ues-risk ues-risk--medium"><span>Orta Risk</span><strong>12</strong><small>Sporcu</small></div>
                <div className="ues-risk ues-risk--low"><span>Düşük Risk</span><strong>231</strong><small>Sporcu</small></div>
              </div>
            </article>

            <article className="ues-card ues-bottom-card ues-bottom-card--projection">
              <div className="ues-card-header">
                <div>
                  <h2>↗ Performans Öngörüsü</h2>
                  <p>Gelecek 6 ay potansiyel gelişim</p>
                </div>
                <button className="ues-text-link ues-text-link--white">Detaylar</button>
              </div>
              <div className="ues-projection">
                <div><strong>%18</strong><span>Ortalama Artış</span></div>
                <div className="ues-projection-bars"><i /><i /><i /><i /><i /><i /></div>
              </div>
            </article>

            <article className="ues-card ues-bottom-card ues-bottom-card--training">
              <div className="ues-card-header">
                <div>
                  <h2>☼ Antrenman Önerileri</h2>
                  <p>Mevcut çevresel koşullara göre</p>
                </div>
                <button className="ues-text-link ues-text-link--white">Detaylar</button>
              </div>
              <div className="ues-training-recommendation">
                <span>💡</span>
                <p>Bugün için <strong>sabah saatlerinde</strong> açık hava antrenmanları önerilir.</p>
              </div>
            </article>
          </section>

          <footer className="ues-dashboard-footer">
            <span>© 2026 UESPORT. Tüm hakları saklıdır.</span>
            <nav>
              <button>Gizlilik</button><i />
              <button>Kullanım Koşulları</button><i />
              <button>Destek</button>
            </nav>
          </footer>
        </main>
      </div>
    </div>
  );
}