import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AthletesPage.css";

// 📌 API BASE URL
const API_BASE_URL = "http://localhost:8000/api/v1";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 📌 SIDEBAR ITEMS
const sidebarItems = [
  { icon: "⌂", label: "Ana Sayfa", path: "/" },
  { icon: "♙", label: "Sporcular", path: "/athletes", active: true },
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

// 📌 SPOR İKONLARI
const sportIcons = {
  Futbol: "⚽",
  Basketbol: "🏀",
  Voleybol: "◉",
  Yüzme: "≈",
  Atletizm: "⌁",
  Hentbol: "●",
  " ": "●",
};

export default function AthletesPage() {
  const navigate = useNavigate();

  // 📌 KULLANICI BİLGİSİ - localStorage'dan al
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const userName = user?.first_name || user?.username || "Kullanıcı";
  const userRole = user?.role || user?.user_type || "Yönetici";
  const userInitial = userName?.charAt(0)?.toUpperCase() || "K";

  // 📌 STATE'LER
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [ageGroup, setAgeGroup] = useState("all");
  const [sport, setSport] = useState("all");
  const [club, setClub] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);

  // 📌 KPI VERİLERİ
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [activeAthletes, setActiveAthletes] = useState(0);
  const [passiveAthletes, setPassiveAthletes] = useState(0);
  const [followedAthletes, setFollowedAthletes] = useState(0);
  const [loadingKpi, setLoadingKpi] = useState(true);

  // 📌 DROPDOWN MENU STATE
  const [showDropdown, setShowDropdown] = useState(false);

  // 📌 GERÇEK VERİLERİ ÇEK
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // 📌 Kullanıcı verisini güncelle (API'den çek)
        try {
          const userRes = await api.get("/core/users/me/", { headers });
          if (userRes.data) {
            setUser(userRes.data);
            localStorage.setItem("user", JSON.stringify(userRes.data));
          }
        } catch (userErr) {
          console.warn("Kullanıcı verisi alınamadı, localStorage'daki kullanılıyor");
        }

        const athletesRes = await api.get("/core/athlete-profiles/", { headers });
        const athleteData = athletesRes.data?.results || athletesRes.data || [];

        const formattedAthletes = athleteData.map((item, index) => {
          const person = item.person || {};
          const name = person.full_name || person.first_name || "İsimsiz";
          const firstName = person.first_name || "";
          const lastName = person.last_name || "";

          const initials = firstName.charAt(0) + lastName.charAt(0) || name.charAt(0);

          return {
            id: item.id || index + 1,
            initials: initials.toUpperCase(),
            name: name,
            firstName: firstName,
            lastName: lastName,
            birthDate: person.birth_date || "01.01.2000",
            age: calculateAge(person.birth_date),
            sport: item.sport || "Belirtilmemiş",
            club: item.organization_name || item.team_name || "Belirtilmemiş",
            lastTest: item.last_test_date || "01.01.2026",
            trend: "up",
            risk: "Düşük",
            status: item.status || "Aktif",
            personId: person.id,
            athleteId: item.id,
          };
        });

        setAthletes(formattedAthletes);
        setTotalAthletes(formattedAthletes.length);
        setActiveAthletes(formattedAthletes.filter(a => a.status === "Aktif").length);
        setPassiveAthletes(formattedAthletes.filter(a => a.status === "Pasif").length);
        setFollowedAthletes(Math.floor(formattedAthletes.length * 0.3));

        setLoadingKpi(false);
        setLoading(false);

      } catch (err) {
        console.error("Veriler alınamadı:", err);
        loadMockData();
      }
    };

    fetchData();
  }, [navigate]);

  // 📌 YAŞ HESAPLA
  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 📌 MOCK VERİ
  const loadMockData = () => {
    const mockAthletes = [
      {
        id: 1,
        initials: "UÖ",
        name: "Uzay Ege Öztaş",
        firstName: "Uzay",
        lastName: "Öztaş",
        birthDate: "15.03.2015",
        age: 11,
        sport: "Futbol",
        club: "Beşiktaş JK",
        lastTest: "01.09.2026",
        trend: "up",
        risk: "Düşük",
        status: "Aktif",
      },
      {
        id: 2,
        initials: "AD",
        name: "Ali Demir",
        firstName: "Ali",
        lastName: "Demir",
        birthDate: "21.06.2014",
        age: 12,
        sport: "Basketbol",
        club: "Anadolu SK",
        lastTest: "28.08.2026",
        trend: "up",
        risk: "Orta",
        status: "Aktif",
      },
      {
        id: 3,
        initials: "ZK",
        name: "Zeynep Kaya",
        firstName: "Zeynep",
        lastName: "Kaya",
        birthDate: "10.01.2013",
        age: 13,
        sport: "Voleybol",
        club: "Eczacıbaşı SK",
        lastTest: "27.08.2026",
        trend: "up",
        risk: "Düşük",
        status: "Aktif",
      },
      {
        id: 4,
        initials: "MY",
        name: "Mert Yılmaz",
        firstName: "Mert",
        lastName: "Yılmaz",
        birthDate: "05.09.2012",
        age: 14,
        sport: "Futbol",
        club: "Fenerbahçe SK",
        lastTest: "26.08.2026",
        trend: "stable",
        risk: "Orta",
        status: "Aktif",
      },
      {
        id: 5,
        initials: "EA",
        name: "Elif Arslan",
        firstName: "Elif",
        lastName: "Arslan",
        birthDate: "18.12.2013",
        age: 12,
        sport: "Yüzme",
        club: "Galatasaray SK",
        lastTest: "24.08.2026",
        trend: "up",
        risk: "Düşük",
        status: "Aktif",
      },
    ];

    setAthletes(mockAthletes);
    setTotalAthletes(mockAthletes.length);
    setActiveAthletes(mockAthletes.filter(a => a.status === "Aktif").length);
    setPassiveAthletes(0);
    setFollowedAthletes(Math.floor(mockAthletes.length * 0.3));
    setLoadingKpi(false);
    setLoading(false);
  };

  // 📌 KPI KARTLARI
  const summaryCards = [
    {
      label: "Toplam Sporcu",
      value: loadingKpi ? "..." : totalAthletes,
      change: "+12%",
      changeType: "positive",
      icon: "🏃",
      color: "blue",
    },
    {
      label: "Aktif Sporcu",
      value: loadingKpi ? "..." : activeAthletes,
      change: "+8%",
      changeType: "positive",
      icon: "✓",
      color: "green",
    },
    {
      label: "Pasif Sporcu",
      value: loadingKpi ? "..." : passiveAthletes,
      change: "-4%",
      changeType: "negative",
      icon: "Ⅱ",
      color: "orange",
    },
    {
      label: "Takip Edilen",
      value: loadingKpi ? "..." : followedAthletes,
      change: "+14%",
      changeType: "positive",
      icon: "★",
      color: "purple",
    },
  ];

  // 📌 FİLTRELEME
  const filteredAthletes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return athletes.filter((athlete) => {
      const queryMatch =
        !normalizedQuery ||
        athlete.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        athlete.club.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        athlete.sport.toLocaleLowerCase("tr-TR").includes(normalizedQuery);

      const ageMatch = ageGroup === "all" || String(athlete.age) === ageGroup;
      const sportMatch = sport === "all" || athlete.sport === sport;
      const clubMatch = club === "all" || athlete.club === club;
      const statusMatch = status === "all" || athlete.status === status;

      return queryMatch && ageMatch && sportMatch && clubMatch && statusMatch;
    });
  }, [query, ageGroup, sport, club, status, athletes]);

  const allVisibleSelected =
    filteredAthletes.length > 0 && filteredAthletes.every((a) => selectedIds.includes(a.id));

  // 📌 SEÇİM FONKSİYONLARI
  function toggleAthlete(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((sid) => sid !== id)
        : [...current, id]
    );
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredAthletes.map((a) => a.id));
      setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }
    setSelectedIds((current) => [
      ...new Set([...current, ...filteredAthletes.map((a) => a.id)]),
    ]);
  }

  function resetFilters() {
    setQuery("");
    setAgeGroup("all");
    setSport("all");
    setClub("all");
    setStatus("all");
  }

  // =========================================================
  // 📌 BUTON İŞLEMLERİ
  // =========================================================

  function handleNewAthlete() {
    navigate("/athlete/register");
  }

  function handleExport() {
    const headers = ["ID", "Ad Soyad", "Doğum Tarihi", "Yaş", "Spor Dalı", "Kulüp", "Son Test", "Risk", "Durum"];
    const rows = filteredAthletes.map(a => [
      a.id,
      a.name,
      a.birthDate,
      a.age,
      a.sport,
      a.club,
      a.lastTest,
      a.risk,
      a.status
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sporcular_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`${filteredAthletes.length} sporcu başarıyla dışa aktarıldı!`);
  }

  function handleDropdownAction(action) {
    setShowDropdown(false);
    switch (action) {
      case 'export':
        handleExport();
        break;
      case 'import':
        alert("İçe aktarma sayfasına yönlendiriliyorsunuz...");
        break;
      case 'bulkDelete':
        if (selectedIds.length === 0) {
          alert("Lütfen önce silmek istediğiniz sporcuları seçin.");
          return;
        }
        if (window.confirm(`${selectedIds.length} sporcuyu silmek istediğinizden emin misiniz?`)) {
          setAthletes((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
          setSelectedIds([]);
          alert(`${selectedIds.length} sporcu başarıyla silindi!`);
        }
        break;
      case 'bulkStatus':
        if (selectedIds.length === 0) {
          alert("Lütfen önce durumunu değiştirmek istediğiniz sporcuları seçin.");
          return;
        }
        setAthletes((prev) =>
          prev.map((a) =>
            selectedIds.includes(a.id)
              ? { ...a, status: a.status === "Aktif" ? "Pasif" : "Aktif" }
              : a
          )
        );
        alert(`${selectedIds.length} sporcunun durumu güncellendi!`);
        setSelectedIds([]);
        break;
      case 'print':
        window.print();
        break;
      default:
        break;
    }
  }

  function handleViewAthlete(athlete) {
    navigate(`/athlete/${athlete.id}`);
  }

  function handleEditAthlete(athlete) {
    navigate(`/athlete/register?edit=${athlete.id}`);
  }

  function handleDeleteAthlete(athlete) {
    if (window.confirm(`"${athlete.name}" adlı sporcuyu silmek istediğinizden emin misiniz?`)) {
      setAthletes((prev) => prev.filter((a) => a.id !== athlete.id));
      alert(`${athlete.name} başarıyla silindi!`);
    }
  }

  return (
    <div className="ath-page">
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
          {sidebarItems.map((item) => (
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
      <div className="ath-shell">
        {/* TOPBAR - GERÇEK KULLANICI VERİSİ */}
        <header className="ues-dashboard-topbar">
          <div className="ues-topbar-left">
            <div className="ues-user-info">
              <div className="ues-user-avatar">{userInitial}</div>
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
              <span>{new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}</span>
            </div>
          </div>
        </header>

        {/* İÇERİK */}
        <main className="ath-content">
          {/* PAGE HEADER */}
          <section className="ath-page-header">
            <div>
              <h1>Sporcular</h1>
              <p>Sporcu kayıtlarını yönetin, arayın ve analiz edin.</p>
            </div>
            <div className="ath-page-actions">
              <button className="ath-button ath-button--secondary" onClick={handleExport}>
                <span>⇩</span> Dışa Aktar
              </button>
              <button className="ath-button ath-button--primary" onClick={handleNewAthlete}>
                <span>＋</span> Yeni Sporcu Ekle
              </button>
              <div className="ath-dropdown-wrapper">
                <button
                  className="ath-more-button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-label="Diğer işlemler"
                >
                  ⋮
                </button>
                {showDropdown && (
                  <div className="ath-dropdown-menu">
                    <button onClick={() => handleDropdownAction('export')}>
                      <span>📥</span> Dışa Aktar (CSV)
                    </button>
                    <button onClick={() => handleDropdownAction('import')}>
                      <span>📤</span> İçe Aktar
                    </button>
                    <hr />
                    <button onClick={() => handleDropdownAction('bulkStatus')}>
                      <span>🔄</span> Seçililerin Durumunu Değiştir
                    </button>
                    <button onClick={() => handleDropdownAction('bulkDelete')} className="ath-dropdown-danger">
                      <span>🗑️</span> Seçilileri Sil
                    </button>
                    <hr />
                    <button onClick={() => handleDropdownAction('print')}>
                      <span>🖨️</span> Yazdır
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* KPI KARTLARI */}
          <section className="ues-metric-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className={`ues-metric-card ues-metric-card--${card.color}`}>
                <div className="ues-metric-card__icon">{card.icon}</div>
                <div className="ues-metric-card__content">
                  <span>{card.label}</span>
                  <div>
                    <strong>{card.value}</strong>
                    <span className={`ues-change ${card.changeType}`}>{card.change}</span>
                  </div>
                </div>
                <div className="ues-metric-trend">
                  {card.changeType === 'positive' ? '📈' : '📉'}
                </div>
              </article>
            ))}
          </section>

          {/* FİLTRE ÇUBUĞU */}
          <section className="ath-filter-card">
            <div className="ath-filter-search">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sporcu adı, spor dalı veya kulüp ara..."
              />
            </div>

            <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
              <option value="all">Tüm Yaş Grupları</option>
              {[...new Set(athletes.map(a => a.age))].sort().map(age => (
                <option key={age} value={age}>{age} Yaş</option>
              ))}
            </select>

            <select value={sport} onChange={(e) => setSport(e.target.value)}>
              <option value="all">Tüm Spor Dalları</option>
              {[...new Set(athletes.map(a => a.sport))].filter(s => s && s !== " ").map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select value={club} onChange={(e) => setClub(e.target.value)}>
              <option value="all">Tüm Kulüpler</option>
              {[...new Set(athletes.map(a => a.club))].filter(c => c && c !== " ").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Tüm Durumlar</option>
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
            </select>

            <button className="ath-filter-button"><span>▽</span> Filtreler</button>
            <button className="ath-reset-button" onClick={resetFilters}>↻ Sıfırla</button>
          </section>

          {/* TABLO */}
          <section className="ath-table-card">
            <div className="ath-table-heading">
              <div>
                <h2>Sporcu Listesi</h2>
                <p>Toplam {filteredAthletes.length} sporcu kaydı</p>
              </div>
              {selectedIds.length > 0 && (
                <div className="ath-selected">{selectedIds.length} sporcu seçildi</div>
              )}
            </div>

            <div className="ath-table-scroll">
              <table className="ath-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></th>
                    <th>Fotoğraf</th>
                    <th>Ad Soyad <span className="ath-sort">↑</span></th>
                    <th>Doğum Tarihi</th>
                    <th>Yaş</th>
                    <th>Spor Dalı</th>
                    <th>Kulüp / Kurum</th>
                    <th>Son Test</th>
                    <th>Gelişim Trendi</th>
                    <th>Risk</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={12} className="ath-empty"><strong>Yükleniyor...</strong><span>Sporcu verileri alınıyor.</span></td></tr>
                  ) : filteredAthletes.length === 0 ? (
                    <tr><td colSpan={12} className="ath-empty"><strong>Sporcu bulunamadı</strong><span>Arama veya filtrelerinizi değiştirin.</span></td></tr>
                  ) : (
                    filteredAthletes.map((athlete) => (
                      <tr key={athlete.id}>
                        <td><input type="checkbox" checked={selectedIds.includes(athlete.id)} onChange={() => toggleAthlete(athlete.id)} /></td>
                        <td><div className="ath-photo">{athlete.initials}</div></td>
                        <td>
                          <button className="ath-athlete-name" onClick={() => handleViewAthlete(athlete)}>{athlete.name}</button>
                          <span className="ath-athlete-id">ID #{String(athlete.id).padStart(5, "0")}</span>
                        </td>
                        <td>{athlete.birthDate}</td>
                        <td><strong className="ath-age">{athlete.age}</strong></td>
                        <td><span className="ath-sport"><i>{sportIcons[athlete.sport] || "●"}</i>{athlete.sport}</span></td>
                        <td><span className="ath-club">{athlete.club}</span></td>
                        <td><span className="ath-last-test">{athlete.lastTest}</span></td>
                        <td>
                          <svg className={`ath-trend ath-trend--${athlete.trend}`} viewBox="0 0 74 26">
                            <polyline points={athlete.trend === "stable" ? "2,14 14,13 26,14 38,12 50,13 62,12 72,12" : "2,21 14,18 26,19 38,12 50,14 62,7 72,4"} />
                          </svg>
                        </td>
                        <td><span className={`ath-risk ath-risk--${athlete.risk.toLowerCase()}`}><i />{athlete.risk}</span></td>
                        <td><span className="ath-status"><i />{athlete.status}</span></td>
                        <td>
                          <div className="ath-row-actions">
                            <button title="Sporcu profili" onClick={() => handleViewAthlete(athlete)}>▤</button>
                            <button title="Düzenle" onClick={() => handleEditAthlete(athlete)}>✎</button>
                            <button title="Sil" onClick={() => handleDeleteAthlete(athlete)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* SAYFALAMA */}
            <footer className="ath-table-footer">
              <div>
                Toplam <strong>{filteredAthletes.length}</strong> sporcu
                <span className="ath-footer-separator" />
                Sayfa <strong>1</strong>
              </div>
              <div className="ath-pagination">
                <button disabled>‹</button>
                <button className="active">1</button>
                <button>›</button>
                <select defaultValue="10">
                  <option value="10">10 / sayfa</option>
                  <option value="25">25 / sayfa</option>
                  <option value="50">50 / sayfa</option>
                </select>
              </div>
            </footer>
          </section>

          {/* FOOTER */}
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