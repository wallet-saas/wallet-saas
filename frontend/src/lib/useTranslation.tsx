import { useState, useEffect, useCallback } from 'react';
import translations from './i18n.json';

type Locale = 'fr' | 'en';
type TranslationKey = string;

const STORAGE_KEY = 'stamply_locale';

/**
 * Hook de traduction Stamply
 * 
 * Utilisation :
 * const { t, locale, setLocale, availableLocales } = useTranslation();
 * <h1>{t('dashboard.title')}</h1>
 * <button onClick={() => setLocale('en')}>English</button>
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('fr');

  // Charger la locale depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale;
    if (saved && translations[saved]) {
      setLocaleState(saved);
    }
  }, []);

  // Changer de langue
  const setLocale = useCallback((newLocale: Locale) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem(STORAGE_KEY, newLocale);
      // Mettre à jour l'attribut lang du HTML
      document.documentElement.lang = newLocale;
    }
  }, []);

  // Fonction de traduction
  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback sur le français
        let fallback: unknown = translations['fr'];
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in (fallback as Record<string, unknown>)) {
            fallback = (fallback as Record<string, unknown>)[fk];
          } else {
            return key; // Retourne la clé si pas de traduction
          }
        }
        value = fallback;
        break;
      }
    }

    let result = typeof value === 'string' ? value : key;

    // Remplacer les paramètres {param}
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return result;
  }, [locale]);

  return {
    t,
    locale,
    setLocale,
    availableLocales: Object.keys(translations) as Locale[],
  };
}

/**
 * Composant sélecteur de langue
 */
export function LocaleSelector() {
  const { locale, setLocale, availableLocales } = useTranslation();

  const flags: Record<Locale, string> = {
    fr: '🇫🇷',
    en: '🇬🇧',
  };

  const names: Record<Locale, string> = {
    fr: 'Français',
    en: 'English',
  };

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="locale-selector"
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        background: 'white',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      {availableLocales.map((loc) => (
        <option key={loc} value={loc}>
          {flags[loc]} {names[loc]}
        </option>
      ))}
    </select>
  );
}

export default useTranslation;
