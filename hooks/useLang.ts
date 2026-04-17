import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Lang, TranslationKey } from '../locales';

let _lang: Lang = 'uz';
let _listeners: Array<() => void> = [];

export function useLang() {
  const [lang, setLang] = useState<Lang>(_lang);

  useEffect(() => {
    AsyncStorage.getItem('lang').then(l => {
      if (l === 'uz' || l === 'ru') { _lang = l; setLang(l); }
    });
    const update = () => setLang(_lang);
    _listeners.push(update);
    return () => { _listeners = _listeners.filter(l => l !== update); };
  }, []);

  const t = (key: TranslationKey): string => translations[lang][key] || translations.uz[key];

  const changeLang = async (newLang: Lang) => {
    _lang = newLang;
    await AsyncStorage.setItem('lang', newLang);
    _listeners.forEach(l => l());
  };

  return { lang, t, changeLang };
}
