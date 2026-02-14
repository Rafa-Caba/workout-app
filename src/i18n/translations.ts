import type { Lang, I18nKey } from "./keys";
import { es } from "./es";
import { en } from "./en";

export const translations: Record<Lang, Record<I18nKey, string>> = { es, en };

export type { Lang, I18nKey };