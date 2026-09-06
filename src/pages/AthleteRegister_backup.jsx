import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./AthleteRegister.css";

// 📌 API BASE URL
const API_BASE_URL = "http://localhost:8000/api/v1";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 📌 SIDEBAR ITEMS
const sidebarItems = [
  { icon: "⌂", label: "Ana Sayfa", path: "/" },
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

// 📌 BÖLÜMLER
const sections = [
  { id: "basic", icon: "♙", title: "Temel Bilgiler", count: "0 / 8", tone: "blue" },
  { id: "license", icon: "▣", title: "Lisans Bilgileri", count: "0 / 4", tone: "green" },
  { id: "contact", icon: "☎", title: "İletişim Bilgileri", count: "0 / 4", tone: "purple" },
  { id: "guardian", icon: "♙", title: "Veli Bilgileri", count: "0 / 4", tone: "orange" },
  { id: "school", icon: "▤", title: "Okul Bilgileri", count: "0 / 4", tone: "blue" },
  { id: "health", icon: "♥", title: "Sağlık Bilgileri", count: "0 / 6", tone: "red" },
  { id: "physical", icon: "⌁", title: "Fiziksel Donanım", count: "0 / 4", tone: "teal" },
  { id: "international", icon: "◎", title: "Uluslararası Bilgiler", count: "0 / 6", tone: "purple" },
  { id: "notes", icon: "▧", title: "Notlar", count: "0 / 2", tone: "yellow" },
];

// 📌 FORM VERİLERİ
const initialForm = {
  first_name: "",
  last_name: "",
  gender: "MALE",
  date_of_birth: "",
  branch: "",
  club: "",
  academy: "",
  age_group: "",
  team: "",
  height_cm: "",
  weight_kg: "",
  license_number: "",
  phone: "",
  email: "",
  address: "",
  emergency_phone: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  school_name: "",
  school_class: "",
  health_notes: "",
  allergies: "",
  medications: "",
  physical_notes: "",
  international_notes: "",
  notes: "",
  is_para_athlete: false,
  level: "Elit",
  organization_ref: "",
  team_ref: "",
};

export default function AthleteRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = new URLSearchParams(location.search).get("edit");

  // 📌 KULLANICI BİLGİSİ
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
  const [formData, setFormData] = useState(initialForm);
  const [activeSection, setActiveSection] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [teams, setTeams] = useState([]);

  // 📌 ORGANİZASYON VE TAKIM LİSTELERİNİ ÇEK
  useEffect(() => {
    const fetchOrgAndTeams = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        const [orgRes, teamRes] = await Promise.all([
          api.get("/core/organizations/", { headers }),
          api.get("/core/teams/", { headers }),
        ]);
        setOrganizations(orgRes.data?.results || orgRes.data || []);
        setTeams(teamRes.data?.results || teamRes.data || []);
      } catch (err) {
        console.error("Organizasyon/Takım listesi alınamadı:", err);
      }
    };
    fetchOrgAndTeams();
  }, []);

  // 📌 KULLANICI VERİSİNİ GÜNCELLE
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        const userRes = await api.get("/core/users/me/", { headers });
        if (userRes.data) {
          setUser(userRes.data);
          localStorage.setItem("user", JSON.stringify(userRes.data));
        }
      } catch (err) {
        console.warn("Kullanıcı verisi alınamadı");
      }
    };
    fetchUser();
  }, []);

  // 📌 DÜZENLEME MODUNDA VERİ ÇEK
  useEffect(() => {
    const fetchAthleteData = async () => {
      if (!editId) return;
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        const res = await api.get(`/core/athlete-profiles/${editId}/`, { headers });
        const data = res.data;
        const person = data.person || {};
        const extended = data.extended || {};

        setFormData({
          first_name: person.first_name || "",
          last_name: person.last_name || "",
          gender: person.gender || "MALE",
          date_of_birth: person.date_of_birth || "",
          branch: extended.branch || "",
          club: extended.club || "",
          academy: extended.academy || "",
          age_group: extended.age_group || "",
          team: extended.team || "",
          height_cm: extended.height_cm || "",
          weight_kg: extended.weight_kg || "",
          license_number: data.license_number || "",
          phone: extended.phone || "",
          email: extended.email || "",
          address: extended.address || "",
          emergency_phone: extended.emergency_phone || "",
          parent_name: extended.parent_name || "",
          parent_phone: extended.parent_phone || "",
          parent_email: extended.parent_email || "",
          school_name: extended.school_name || "",
          school_class: extended.school_class || "",
          health_notes: extended.health_notes || "",
          allergies: extended.allergies || "",
          medications: extended.medications || "",
          physical_notes: extended.physical_notes || "",
          international_notes: extended.international_notes || "",
          notes: extended.notes || "",
          is_para_athlete: data.is_para_athlete || false,
          level: data.level || "Elit",
          organization_ref: extended.organization_ref || "",
          team_ref: extended.team_ref || "",
        });
      } catch (err) {
        console.error("Sporcu verisi alınamadı:", err);
      }
    };
    fetchAthleteData();
  }, [editId]);

  // 📌 FORM GÜNCELLEME
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 📌 YAŞ HESAPLA
  const calculateAge = (birthDate) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 📌 KAYDETME İŞLEMLERİ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        person: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
        },
        is_para_athlete: formData.is_para_athlete,
        level: formData.level,
        license_number: formData.license_number,
        extended: {
          branch: formData.branch,
          club: formData.club,
          academy: formData.academy,
          age_group: formData.age_group,
          team: formData.team,
          height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          emergency_phone: formData.emergency_phone,
          parent_name: formData.parent_name,
          parent_phone: formData.parent_phone,
          parent_email: formData.parent_email,
          school_name: formData.school_name,
          school_class: formData.school_class,
          health_notes: formData.health_notes,
          allergies: formData.allergies,
          medications: formData.medications,
          physical_notes: formData.physical_notes,
          international_notes: formData.international_notes,
          notes: formData.notes,
          organization_ref: formData.organization_ref || null,
          team_ref: formData.team_ref || null,
        },
      };

      let response;
      if (editId) {
        response = await api.put(`/core/athlete-profiles/${editId}/`, payload, { headers });
        setMessage({
          type: "success",
          text: `✅ Sporcu ${response.data.person.first_name} ${response.data.person.last_name} başarıyla güncellendi!`,
        });
      } else {
        response = await api.post("/core/athlete-profiles/", payload, { headers });
        setMessage({
          type: "success",
          text: `✅ Sporcu ${response.data.person.first_name} ${response.data.person.last_name} başarıyla kaydedildi!`,
        });
        setFormData(initialForm);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "❌ Kayıt başarısız: " + (err.response?.data?.detail || err.message),
      });
    }
    setLoading(false);
  };

  const handleSaveDraft = async () => {
    alert("📝 Taslak olarak kaydedildi!");
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Değişiklikler kaydedilmeden çıkılmak isteniyor. Devam etmek istediğinize emin misiniz?"
      )
    ) {
      navigate("/athletes");
    }
  };

  // 📌 FULL NAME
  const fullName = `${formData.first_name} ${formData.last_name}`.trim() || "Yeni Sporcu";
  const age = calculateAge(formData.date_of_birth);

  // 📌 PROGRESS HESAPLAMA
  const totalFields = sections.reduce((acc, s) => {
    const count = parseInt(s.count.split(" / ")[1]) || 0;
    return acc + count;
  }, 0);

  const filledFields = sections.reduce((acc, s) => {
    const count = parseInt(s.count.split(" / ")[0]) || 0;
    return acc + count;
  }, 0);

  const progressPercent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  const completedSections = sections.filter(
    (s) => parseInt(s.count.split(" / ")[0]) === parseInt(s.count.split(" / ")[1])
  ).length;

  return (
    <div className="reg-page">
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
              className={item.label === "Sporcular" ? "active" : ""}
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
      <div className="reg-shell">
        {/* TOPBAR */}
        <header className="reg-topbar">
          <div className="reg-topbar-left">
            <button className="reg-back" onClick={handleCancel}>
              ‹
            </button>
            <div>
              <h1>{editId ? "Sporcu Düzenle" : "Yeni Sporcu Kaydı"}</h1>
              <p>
                Sporcu bilgilerini girerek kaydedin. Dilediğiniz zaman kaydedip daha sonra devam
                edebilirsiniz.
              </p>
            </div>
          </div>
          <div className="reg-top-actions">
            <button onClick={handleCancel}>Vazgeç</button>
            <button className="outline" onClick={handleSaveDraft}>
              ▣ Taslak Olarak Kaydet
            </button>
            <button className="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Kaydediliyor..." : editId ? "Güncelle" : "Sporcuyu Kaydet"}
            </button>
          </div>
        </header>

        {/* İÇERİK */}
        <main className="reg-content">
          {/* PROGRESS CARD */}
          <section className="reg-progress-card">
            <div className="reg-progress-circle">
              <strong>{progressPercent}%</strong>
            </div>
            <div className="reg-progress-info">
              <strong>Kayıt Tamamlanma Oranı</strong>
              <span>Tüm zorunlu alanları doldurduktan sonra kaydedebilirsiniz.</span>
            </div>
            <div className="reg-progress-right">
              <strong>
                {completedSections} bölümden {sections.length}'i tamamlandı
              </strong>
              <div className="reg-progress-bar">
                {sections.map((s, index) => (
                  <i
                    key={index}
                    className={
                      parseInt(s.count.split(" / ")[0]) === parseInt(s.count.split(" / ")[1])
                        ? ""
                        : "empty"
                    }
                  />
                ))}
              </div>
            </div>
          </section>

          {/* 3 KOLON LAYOUT */}
          <div className="reg-layout">
            {/* SOL - STEP NAVIGATION */}
            <aside className="reg-steps">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={activeSection === section.id ? "active" : ""}
                >
                  <div className={`reg-step-icon ${section.tone}`}>{section.icon}</div>
                  <div>
                    <strong>
                      {index + 1}. {section.title}
                    </strong>
                    <span>{section.count} alan dolduruldu</span>
                  </div>
                  <i className="reg-step-state">
                    {parseInt(section.count.split(" / ")[0]) ===
                    parseInt(section.count.split(" / ")[1])
                      ? "✓"
                      : "○"}
                  </i>
                </button>
              ))}
            </aside>

            {/* ORTA - FORM */}
            <div className="reg-center">
              <form onSubmit={handleSubmit}>
                {/* TEMEL BİLGİLER - Aktif bölüm */}
                <section className="reg-form-card">
                  <header className="reg-form-card-header">
                    <div>
                      <span className="reg-section-number">1</span>
                      <div>
                        <h2>Temel Bilgiler</h2>
                        <p>Sporcunun temel kimlik ve spor bilgileri</p>
                      </div>
                    </div>
                    <button type="button">⌃</button>
                  </header>

                  <div className="reg-form-body">
                    {/* FOTOĞRAF */}
                    <div className="reg-photo-column">
                      <span className="reg-label">Fotoğraf</span>
                      <div className="reg-photo-preview">
                        <div className="reg-photo-placeholder">
                          {formData.first_name?.[0]}
                          {formData.last_name?.[0] || "?"}
                        </div>
                      </div>
                      <button type="button" className="reg-photo-button">
                        ⇧ Fotoğraf Yükle
                      </button>
                      <button type="button" className="reg-photo-button secondary">
                        ◉ Fotoğraf Çek
                      </button>
                      <small>
                        JPG veya PNG
                        <br />
                        Maksimum 5 MB
                      </small>
                    </div>

                    {/* ALANLAR */}
                    <div className="reg-fields">
                      <div className="reg-field-grid two">
                        <label className="reg-field">
                          <span>Ad <b>*</b></span>
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                          />
                        </label>
                        <label className="reg-field">
                          <span>Soyad <b>*</b></span>
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                          />
                        </label>
                      </div>

                      <div className="reg-field-grid four">
                        <label className="reg-field">
                          <span>Doğum Tarihi <b>*</b></span>
                          <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            required
                          />
                        </label>
                        <label className="reg-field">
                          <span>Cinsiyet <b>*</b></span>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                          >
                            <option value="MALE">Erkek</option>
                            <option value="FEMALE">Kadın</option>
                            <option value="OTHER">Diğer</option>
                          </select>
                        </label>
                        <label className="reg-field">
                          <span>Uyruk</span>
                          <select name="nationality" value={formData.nationality || "T.C."} onChange={handleChange}>
                            <option value="T.C.">T.C.</option>
                            <option value="Diğer">Diğer</option>
                          </select>
                        </label>
                        <label className="reg-field">
                          <span>T.C. Kimlik No</span>
                          <input
                            type="text"
                            name="identity_no"
                            placeholder="11 haneli"
                            value={formData.identity_no || ""}
                            onChange={handleChange}
                          />
                        </label>
                      </div>

                      <div className="reg-divider" />

                      <h3>Spor Bilgileri</h3>

                      <div className="reg-field-grid three">
                        <label className="reg-field">
                          <span>Branş <b>*</b></span>
                          <input
                            type="text"
                            name="branch"
                            value={formData.branch}
                            onChange={handleChange}
                            placeholder="örn: Futbol"
                            required
                          />
                        </label>
                        <label className="reg-field">
                          <span>Kulüp</span>
                          <input
                            type="text"
                            name="club"
                            value={formData.club}
                            onChange={handleChange}
                            placeholder="Kulüp adı"
                          />
                        </label>
                        <label className="reg-field">
                          <span>Akademi</span>
                          <input
                            type="text"
                            name="academy"
                            value={formData.academy}
                            onChange={handleChange}
                            placeholder="Akademi adı"
                          />
                        </label>
                      </div>

                      <div className="reg-field-grid four">
                        <label className="reg-field">
                          <span>Yaş Grubu</span>
                          <select name="age_group" value={formData.age_group} onChange={handleChange}>
                            <option value="">Seçiniz</option>
                            <option value="U15 (2009-2010)">U15 (2009-2010)</option>
                            <option value="U14">U14</option>
                            <option value="U13">U13</option>
                            <option value="U12">U12</option>
                          </select>
                        </label>
                        <label className="reg-field">
                          <span>Takım</span>
                          <input
                            type="text"
                            name="team"
                            value={formData.team}
                            onChange={handleChange}
                            placeholder="Takım adı"
                          />
                        </label>
                        <label className="reg-field">
                          <span>Boy (cm)</span>
                          <input
                            type="number"
                            name="height_cm"
                            value={formData.height_cm}
                            onChange={handleChange}
                            placeholder="örn: 172"
                          />
                        </label>
                        <label className="reg-field">
                          <span>Kilo (kg)</span>
                          <input
                            type="number"
                            name="weight_kg"
                            value={formData.weight_kg}
                            onChange={handleChange}
                            placeholder="örn: 62"
                          />
                        </label>
                      </div>

                      <div className="reg-section-save">
                        <button type="button">▣ Bu Bölümü Kaydet</button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* DİĞER BÖLÜMLER - KAPALI */}
                <div className="reg-accordions">
                  {sections.slice(1).map((section, index) => (
                    <button key={section.id} onClick={() => setActiveSection(section.id)}>
                      <span className={`reg-accordion-icon ${section.tone}`}>{section.icon}</span>
                      <strong>{index + 2}. {section.title}</strong>
                      <small>{section.count} alan dolduruldu</small>
                      <span>⌄</span>
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {/* SAĞ - ÖZET PANELİ */}
            <aside className="reg-right-column">
              {/* SPORCU ÖZETİ */}
              <section className="reg-summary-card">
                <header>
                  <h3>Sporcu Özeti</h3>
                  <button type="button">✎</button>
                </header>
                <div className="reg-summary-profile">
                  <div className="reg-summary-avatar">
                    {formData.first_name?.[0]}
                    {formData.last_name?.[0] || "?"}
                  </div>
                  <div>
                    <strong>{fullName}</strong>
                    <span>{formData.age_group || "Yaş Grubu Yok"}</span>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Yaş</dt>
                    <dd>{age}</dd>
                  </div>
                  <div>
                    <dt>Branş</dt>
                    <dd>{formData.branch || "-"}</dd>
                  </div>
                  <div>
                    <dt>Kulüp</dt>
                    <dd>{formData.club || "-"}</dd>
                  </div>
                  <div>
                    <dt>Takım</dt>
                    <dd>{formData.team || "-"}</dd>
                  </div>
                  <div>
                    <dt>Boy / Kilo</dt>
                    <dd>
                      {formData.height_cm || "-"} cm / {formData.weight_kg || "-"} kg
                    </dd>
                  </div>
                  <div>
                    <dt>Kayıt Durumu</dt>
                    <dd>
                      <span className="reg-badge draft">Taslak</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Lisans Durumu</dt>
                    <dd>
                      <span className="reg-badge license">Oluşturulmadı</span>
                    </dd>
                  </div>
                </dl>
              </section>

              {/* AI ÖN ANALİZ */}
              <section className="reg-ai-card">
                <header>
                  <span>✦</span>
                  <h3>AI Ön Analiz</h3>
                </header>
                <dl>
                  <div>
                    <dt>Yaş Kategorisi</dt>
                    <dd>{formData.age_group || "-"}</dd>
                  </div>
                  <div>
                    <dt>Potansiyel Skor</dt>
                    <dd>-</dd>
                  </div>
                  <div>
                    <dt>Performans Tahmini</dt>
                    <dd>-</dd>
                  </div>
                  <div>
                    <dt>Gelişim Trendi</dt>
                    <dd>-</dd>
                  </div>
                  <div>
                    <dt>Sakatlık Riski</dt>
                    <dd>-</dd>
                  </div>
                  <div>
                    <dt>Scout İlgi Skoru</dt>
                    <dd>-</dd>
                  </div>
                </dl>
                <div className="reg-ai-notice">
                  <span>✦</span>
                  <p>Daha fazla veri ile AI analizleri otomatik olarak güncellenecektir.</p>
                </div>
              </section>
            </aside>
          </div>

          {/* MESAJ */}
          {message && <div className={`reg-message ${message.type}`}>{message.text}</div>}
        </main>

        {/* BOTTOM BAR */}
        <footer className="reg-bottom-actions">
          <button className="cancel" onClick={handleCancel}>
            İptal
          </button>
          <div>
            <span className="reg-draft-status">{fullName} · Taslak</span>
            <button type="button" className="secondary" onClick={() => navigate("/athlete/register")}>
              ♙ Kaydet ve Yeni Sporcu Ekle
            </button>
            <button type="submit" className="primary" onClick={handleSubmit}>
              Kaydet ve İlerle →
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}