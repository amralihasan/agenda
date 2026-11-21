import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

const savedLanguage = localStorage.getItem('agenda_language') || 'ar';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: savedLanguage,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

export function setAppLanguage(lang: 'en' | 'ar') {
  i18n.changeLanguage(lang);
  localStorage.setItem('agenda_language', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

// Initial direction setup
if (typeof document !== 'undefined') {
  document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = savedLanguage;
}

export default i18n;
