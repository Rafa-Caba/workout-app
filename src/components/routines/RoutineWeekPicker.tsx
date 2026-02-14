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
        <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm">
                    {t("week.pickDateInWeek")}{" "}
                    <input
                        type="date"
                        className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                        value={props.weekDate}
                        onChange={(e) => props.setWeekDate(e.target.value)}
                    />
                </label>

                <Button variant="outline" onClick={goPrevWeek} disabled={props.busy}>
                    {t("week.prev")}
                </Button>
                <Button variant="outline" onClick={goNextWeek} disabled={props.busy}>
                    {t("week.next")}
                </Button>

                <Button onClick={props.onLoadWeek} disabled={props.busy}>
                    {t("routines.useWeek")}
                </Button>

                <span className="text-xs text-muted-foreground">
                    {t("routines.selected")}: <span className="font-mono">{props.derivedWeekKey}</span> •{" "}
                    {weekRangeLabel} • {t("week.loaded")}: <span className="font-mono">{props.runWeekKey}</span>{" "}
                    <Button
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={props.onSyncToLoadedWeek}
                        disabled={props.busy}
                    >
                        (sync)
                    </Button>
                </span>
            </div>
        </div>
    );
}
