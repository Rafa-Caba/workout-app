import React from "react";
import { Button } from "@/components/ui/button";
import { RoutinesAdvancedActions } from "@/components/routines/RoutinesAdvancedActions";
import type { WorkoutRoutineStatus } from "@/types/workoutRoutine.types";
import type { I18nKey } from "@/i18n/translations";

type TFn = (key: I18nKey) => string;

type Props = {
    t: TFn;
    lang: string;

    busy: boolean;

    weekDate: string;
    onWeekDateChange: (next: string) => void;

    onPrevWeek: () => void;
    onNextWeek: () => void;

    onLoadWeek: () => void;

    derivedWeekKey: string;
    weekRangeLabel: string;
    runWeekKey: string;

    onSyncToLoadedWeek: () => void;

    initOpenDefault: boolean;

    initTitle: string;
    setInitTitle: (v: string) => void;

    initSplit: string;
    setInitSplit: (v: string) => void;

    unarchive: boolean;
    setUnarchive: (v: boolean) => void;

    onInitRoutine: () => void;
    isInitializing: boolean;

    onSetArchived: (archived: boolean) => void;

    hasRoutine: boolean;
    routineStatus?: WorkoutRoutineStatus; // "active" | "archived"
};

export function RoutinesWeekPickerCard({
    t,
    lang,
    busy,
    weekDate,
    onWeekDateChange,
    onPrevWeek,
    onNextWeek,
    onLoadWeek,
    derivedWeekKey,
    weekRangeLabel,
    runWeekKey,
    onSyncToLoadedWeek,
    initOpenDefault,
    initTitle,
    setInitTitle,
    initSplit,
    setInitSplit,
    unarchive,
    setUnarchive,
    onInitRoutine,
    isInitializing,
    onSetArchived,
    hasRoutine,
    routineStatus,
}: Props) {
    return (
        <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm">
                    {t("week.pickDateInWeek")}{" "}
                    <input
                        type="date"
                        className="sm:ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                        value={weekDate}
                        onChange={(e) => onWeekDateChange(e.target.value)}
                        disabled={busy}
                    />
                </label>

                <div className="grid gap-2 grid-cols-2">
                    <Button variant="outline" onClick={onPrevWeek} disabled={busy}>
                        {t("week.prev")}
                    </Button>
                    <Button variant="outline" onClick={onNextWeek} disabled={busy}>
                        {t("week.next")}
                    </Button>
                </div>

                <Button onClick={onLoadWeek} disabled={busy}>
                    {t("routines.useWeek")}
                </Button>

                <span className="text-xs text-muted-foreground">
                    {t("routines.selected")}: <span className="font-mono">{derivedWeekKey}</span> • {weekRangeLabel} •{" "}
                    {t("week.loaded")}: <span className="font-mono">{runWeekKey}</span>{" "}
                    <Button variant="ghost" className="h-8 px-2" onClick={onSyncToLoadedWeek} disabled={busy}>
                        (sync)
                    </Button>
                </span>
            </div>

            <RoutinesAdvancedActions
                openDefault={initOpenDefault}
                busy={busy}
                t={t}
                lang={lang}
                initTitle={initTitle}
                setInitTitle={setInitTitle}
                initSplit={initSplit}
                setInitSplit={setInitSplit}
                unarchive={unarchive}
                setUnarchive={setUnarchive}
                onInitRoutine={onInitRoutine}
                isInitializing={isInitializing}
                onSetArchived={onSetArchived}
                hasRoutine={!!hasRoutine}
                routineStatus={routineStatus}
            />
        </div>
    );
}
