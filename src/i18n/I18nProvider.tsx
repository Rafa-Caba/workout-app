import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { I18nKey, Lang } from "./translations";
import { translations } from "./translations";

type I18nVars = Record<string, string | number>;

type I18nContextValue = {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: I18nKey, vars?: I18nVars) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const LANG_KEY = "workout-lang";

function applyVars(template: string, vars: I18nVars): string {
    return Object.keys(vars).reduce((acc, k) => {
        const token = `{${k}}`;
        // Avoid replaceAll to support older TS lib targets
        return acc.split(token).join(String(vars[k]));
    }, template);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Lang>("es");

    useEffect(() => {
        const stored = localStorage.getItem(LANG_KEY);
        if (stored === "es" || stored === "en") setLang(stored);
    }, []);

    useEffect(() => {
        localStorage.setItem(LANG_KEY, lang);
    }, [lang]);

    const value = useMemo<I18nContextValue>(() => {
        return {
            lang,
            setLang,
            t: (key, vars) => {
                const raw = translations[lang][key] ?? translations.en[key] ?? key;
                if (!vars) return raw;
                return applyVars(raw, vars);
            },
        };
    }, [lang]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error("useI18n must be used within I18nProvider");
    return ctx;
}
