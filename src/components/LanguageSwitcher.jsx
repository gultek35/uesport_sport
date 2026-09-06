import React from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("uesport_lang", langCode);
    const dir = langCode === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = langCode;
  };

  return (
    <select
      className="language-switcher"
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
      style={{
        padding: "8px 12px",
        borderRadius: "8px",
        border: "1px solid #e9ecef",
        backgroundColor: "white",
        fontSize: "14px",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}

export default LanguageSwitcher;
