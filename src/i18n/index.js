import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import trTranslation from "./locales/tr/translation.json";
import enTranslation from "./locales/en/translation.json";
import deTranslation from "./locales/de/translation.json";
import frTranslation from "./locales/fr/translation.json";
import esTranslation from "./locales/es/translation.json";
import itTranslation from "./locales/it/translation.json";
import ptTranslation from "./locales/pt/translation.json";
import ruTranslation from "./locales/ru/translation.json";
import arTranslation from "./locales/ar/translation.json";

const resources = {
  tr: { translation: trTranslation },
  en: { translation: enTranslation },
  de: { translation: deTranslation },
  fr: { translation: frTranslation },
  es: { translation: esTranslation },
  it: { translation: itTranslation },
  pt: { translation: ptTranslation },
  ru: { translation: ruTranslation },
  ar: { translation: arTranslation },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("uesport_lang") || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
