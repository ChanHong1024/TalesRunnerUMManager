import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import zhHK from "./zh_HK.json";
import zhTW from "./zh_TW.json";
import kr from "./kr.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh_HK: { translation: zhHK },
    zh_TW: { translation: zhTW },
    kr: { translation: kr },
  },
  lng: "zh_HK",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
