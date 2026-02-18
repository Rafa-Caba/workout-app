import React from "react";
import { Button } from "@/components/ui/button";
import type { I18nKey } from "@/i18n/translations";
import type { WorkoutRoutineStatus } from "@/types/workoutRoutine.types";

type TFn = (key: I18nKey) => string;

type Props = {
    openDefault: boolean;
    busy: boolean;

    t: TFn;
    lang: string;

    hasRoutine: boolean;
    routineStatus?: WorkoutRoutineStatus; // "active" | "archived"

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
    hasRoutine,
    routineStatus,
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
    const isArchived = routineStatus === "archived";
    const canInit = !hasRoutine || (isArchived && unarchive);
    const initDisabled = busy || !canInit;

    const initLabel = (() => {
        if (isInitializing) return t("routines.initializing");
        if (!hasRoutine) return t("routines.initWeekRoutine");
        if (isArchived) return lang === "es" ? "Reactivar rutina" : "Unarchive routine";
        return lang === "es" ? "Rutina iniciada" : "Routine initialized";
    })();

    // Inputs only matter when you can init (or when archived and unarchive is true)
    const initInputsDisabled = busy || (hasRoutine && !isArchived);

    return (
        <details className="rounded-xl border bg-background p-3" open={openDefault}>
            <summary className="cursor-pointer text-sm font-semibold select-none">
                {lang === "es" ? "Acciones avanzadas (init / archivar)" : "Advanced actions (init / archive)"}
            </summary>

            <div className="mt-3 space-y-3">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("routines.initTitle")}</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={initTitle}
                            onChange={(e) => setInitTitle(e.target.value)}
                            placeholder={t("routines.initTitlePh")}
                            disabled={initInputsDisabled}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("routines.initSplit")}</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={initSplit}
                            onChange={(e) => setInitSplit(e.target.value)}
                            placeholder={t("routines.initSplitPh")}
                            disabled={initInputsDisabled}
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
                                disabled={busy || (!hasRoutine ? false : !isArchived)}
                            />
                            <label htmlFor="unarchive" className="text-sm text-muted-foreground">
                                {t("routines.unarchiveHint")}
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button onClick={onInitRoutine} disabled={initDisabled} className="w-full sm:w-auto">
                        {initLabel}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => onSetArchived(true)}
                        disabled={busy || !hasRoutine || isArchived}
                        className="w-full sm:w-auto"
                    >
                        {t("routines.archive")}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => onSetArchived(false)}
                        disabled={busy || !hasRoutine || !isArchived}
                        className="w-full sm:w-auto"
                    >
                        {t("routines.unarchive")}
                    </Button>
                </div>

                {hasRoutine && !isArchived ? (
                    <div className="text-xs text-muted-foreground">
                        {lang === "es"
                            ? "Esta semana ya está inicializada. Puedes editar el plan y guardar cambios."
                            : "This week is already initialized. You can edit the plan and save changes."}
                    </div>
                ) : null}
            </div>
        </details>
    );
}
