import React from "react";
import { Button } from "@/components/ui/button";
import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";
import { startOfISOWeek, endOfISOWeek, addWeeks, format } from "date-fns";
import { useI18n } from "@/i18n/I18nProvider";

export function RoutineWeekPicker(props: {
    busy: boolean;
    weekDate: string;
    setWeekDate: (v: string) => void;
    derivedWeekKey: string;
    runWeekKey: string;
    onLoadWeek: () => void;
    onSyncToLoadedWeek: () => void;
}) {
    const { t } = useI18n();

    const weekRangeLabel = React.useMemo(() => {
        const d = new Date(`${props.weekDate}T00:00:00`);
        const start = startOfISOWeek(d);
        const end = endOfISOWeek(d);
        return `${format(start, "MMM d, yyyy")} → ${format(end, "MMM d, yyyy")}`;
    }, [props.weekDate]);

    function goPrevWeek() {
        const d = new Date(`${props.weekDate}T00:00:00`);
        props.setWeekDate(format(addWeeks(d, -1), "yyyy-MM-dd"));
    }

    function goNextWeek() {
        const d = new Date(`${props.weekDate}T00:00:00`);
        props.setWeekDate(format(addWeeks(d, 1), "yyyy-MM-dd"));
    }

    return (
        <div className="w-full min-w-0 rounded-xl border bg-card p-4 space-y-3">
            <div className="min-w-0 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                <label className="min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center text-sm">
                    <span className="shrink-0">{t("week.pickDateInWeek")}</span>
                    <input
                        type="date"
                        className="w-full sm:w-auto rounded-md border bg-background px-3 py-2 text-base sm:text-sm"
                        value={props.weekDate}
                        onChange={(e) => props.setWeekDate(e.target.value)}
                    />
                </label>

                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={goPrevWeek} disabled={props.busy} className="w-full sm:w-auto">
                        {t("week.prev")}
                    </Button>
                    <Button variant="outline" onClick={goNextWeek} disabled={props.busy} className="w-full sm:w-auto">
                        {t("week.next")}
                    </Button>
                </div>

                <Button onClick={props.onLoadWeek} disabled={props.busy} className="w-full sm:w-auto">
                    {t("routines.useWeek")}
                </Button>

                <div className="min-w-0 text-xs text-muted-foreground wrap-break-words">
                    {t("routines.selected")}: <span className="font-mono">{props.derivedWeekKey}</span> •{" "}
                    <span className="font-mono">{weekRangeLabel}</span> • {t("week.loaded")}:{" "}
                    <span className="font-mono">{props.runWeekKey}</span>{" "}
                    <Button
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={props.onSyncToLoadedWeek}
                        disabled={props.busy}
                    >
                        (sync)
                    </Button>
                </div>
            </div>
        </div>
    );
}
