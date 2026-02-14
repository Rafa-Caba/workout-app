import React from "react";
import { Button } from "@/components/ui/button";
import type { I18nKey } from "@/i18n/translations";

type TFn = (key: I18nKey) => string;

type Props = {
    openDefault: boolean;
    busy: boolean;

    t: TFn;
    lang: string;

    initTitle: string;
    setInitTitle: (v: string) => void;

    initSplit: string;
    setInitSplit: (v: string) => void;

    unarchive: boolean;
    setUnarchive: (v: boolean) => void;

    onInitRoutine: () => void;
    isInitializing: boolean;

    onSetArchived: (archived: boolean) => void;
};

export function RoutinesAdvancedActions({
    openDefault,
    busy,
    t,
    lang,
    initTitle,
    setInitTitle,
    initSplit,
    setInitSplit,
    unarchive,
    setUnarchive,
    onInitRoutine,
    isInitializing,
    onSetArchived,
}: Props) {
    return (
        <details className="rounded-xl border bg-background p-3" open={openDefault}>
            <summary className="cursor-pointer text-sm font-semibold select-none">
                {lang === "es"
                    ? "Acciones avanzadas (init / archivar)"
                    : "Advanced actions (init / archive)"}
            </summary>

            <div className="mt-3 space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("routines.initTitle")}</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={initTitle}
                            onChange={(e) => setInitTitle(e.target.value)}
                            placeholder={t("routines.initTitlePh")}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("routines.initSplit")}</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={initSplit}
                            onChange={(e) => setInitSplit(e.target.value)}
                            placeholder={t("routines.initSplitPh")}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("routines.unarchiveOnInit")}</label>
                        <div className="flex items-center gap-2">
                            <input
                                id="unarchive"
                                type="checkbox"
                                checked={unarchive}
                                onChange={(e) => setUnarchive(e.target.checked)}
                                disabled={busy}
                            />
                            <label htmlFor="unarchive" className="text-sm text-muted-foreground">
                                {t("routines.unarchiveHint")}
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={onInitRoutine} disabled={busy}>
                        {isInitializing ? t("routines.initializing") : t("routines.initWeekRoutine")}
                    </Button>

                    <Button variant="outline" onClick={() => onSetArchived(true)} disabled={busy}>
                        {t("routines.archive")}
                    </Button>
                    <Button variant="outline" onClick={() => onSetArchived(false)} disabled={busy}>
                        {t("routines.unarchive")}
                    </Button>
                </div>
            </div>
        </details>
    );
}
