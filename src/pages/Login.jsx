import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const API_BASE_URL = "http://localhost:8000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Kullanıcı adı ve şifre alanlarını doldurun.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post("/token/", {
        username: username.trim(),
        password,
      });
      const { access, refresh } = response.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      const userResponse = await axios.get("http://localhost:8000/api/v1/core/user-profile/", {
        headers: { Authorization: `Bearer ${access}` }
      });
      const user = userResponse.data;
      localStorage.setItem("user", JSON.stringify(user));
      if (!user.is_setup_completed) {
        navigate("/setup");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Giriş yapılamadı. Kullanıcı bilgilerinizi kontrol edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      {/* SOL PANEL */}
      <section className="login-panel">
        <div className="login-panel__inner">
          {/* Dil Seçici - PNG Bayrak ile */}
          <div className="login-language">
            <img 
              src="/tr-flag.png" 
              alt="Türkçe" 
              className="login-language__flag"
              width="24"
              height="16"
            />
            <span>TR</span>
            <span className="login-language__arrow">⌄</span>
          </div>

          {/* Logo */}
          <header className="login-brand">
            <div className="login-brand__symbol">U</div>
            <h1 className="login-brand__name">
              <span className="login-brand__ue">UE</span>SPORT
            </h1>
            <p className="login-brand__title">Sporcu Zekâ Platformu</p>
            <p className="login-brand__subtitle">Daha iyi sporcular, daha parlak gelecek.</p>
          </header>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Kullanıcı Adı */}
            <div className="login-field">
              <span className="login-field__icon">♙</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adı veya e-posta"
                autoComplete="username"
              />
            </div>

            {/* Şifre */}
            <div className="login-field">
              <span className="login-field__icon">▣</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-field__password-button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "◉" : "◎"}
              </button>
            </div>

            {/* Beni hatırla / Şifremi unuttum? */}
            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Beni hatırla</span>
              </label>
              <button
                type="button"
                className="login-text-button"
                onClick={() => alert("Şifre sıfırlama linki gönderilecek.")}
              >
                Şifremi unuttum?
              </button>
            </div>

            {/* Hata mesajı */}
            {error && <div className="login-error">{error}</div>}

            {/* Giriş Yap Butonu */}
            <button type="submit" className="login-submit" disabled={isSubmitting}>
              <span>{isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}</span>
              {!isSubmitting && <span className="login-submit__arrow">→</span>}
            </button>

            {/* veya ayracı */}
            <div className="login-divider">
              <span /><p>veya</p><span />
            </div>

            {/* SSO Butonu */}
            <button
              type="button"
              className="login-sso"
              onClick={() => alert("Kurumsal giriş (SSO) yakında geliyor.")}
            >
              <span className="login-sso__icon">▧</span>
              <span>Kurumsal Giriş (SSO)</span>
            </button>
          </form>

          {/* Slogan */}
          <p className="login-quote">
            “Veriye dayalı sporcu gelişimi,<br />daha güçlü yarınlar için.”
          </p>

          {/* Spor İkonları */}
          <div className="login-sports">
            <span title="Futbol">⚽</span>
            <span title="Basketbol">🏀</span>
            <span title="Voleybol">🏐</span>
            <span title="Atletizm">🏃</span>
            <span title="Yüzme">🏊</span>
            <span title="Performans">🏋</span>
          </div>

          {/* Footer */}
          <footer className="login-footer">
            <span>© 2026 UESPORT. Tüm hakları saklıdır.</span>
            <nav className="login-footer__links">
              <button type="button">Gizlilik</button>
              <span>|</span>
              <button type="button">Kullanım Koşulları</button>
              <span>|</span>
              <button type="button">Destek</button>
            </nav>
          </footer>
        </div>
      </section>

      {/* SAĞ PANEL - HERO */}
      <section className="login-hero">
        <img src="/sporcu.png" alt="Sporcu" className="login-hero__image" />
        <div className="login-hero__shade" />
        <div className="login-hero__left-shape" />

        <div className="login-hero__eyebrow">
          <span>HER SPORCU</span>
          <span>BİR POTANSİYELDİR</span>
          <i />
        </div>

        <div className="login-hero__message">
          <h2>VERİ<br />ANALİZ<br />GELİŞİM<br />BAŞARI</h2>
          <p>Sporcuların potansiyelini<br />veriyle ortaya çıkarıyoruz.</p>
          <div className="login-hero__blue-line" />
        </div>

        <div className="login-benefits">
          <div className="login-benefit">
            <div className="login-benefit__icon">▥</div>
            <strong>Analiz</strong>
            <p>Gerçek veriler,<br />anlamlı içgörüler</p>
          </div>
          <div className="login-benefit">
            <div className="login-benefit__icon">♟</div>
            <strong>Gelişim</strong>
            <p>Kişiye özel<br />planlama</p>
          </div>
          <div className="login-benefit">
            <div className="login-benefit__icon">♛</div>
            <strong>Başarı</strong>
            <p>Daha güçlü<br />sporcular</p>
          </div>
          <div className="login-benefit">
            <div className="login-benefit__icon">♟♟</div>
            <strong>Gelecek</strong>
            <p>Sürdürülebilir<br />spor ekosistemi</p>
          </div>
        </div>

        <div className="login-hero__signature">
          Sporla Daha İleriye
          <span />
        </div>
      </section>
    </main>
  );
}