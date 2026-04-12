// src/components/gymCheck/GymCheckWeekPickerCard.tsx
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { themedPanelCard, themedNestedCard } from "@/theme/cardHierarchy";

function formatNullable(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

type Props = {
    t: (key: any) => string;
    lang: "es" | "en";
    busy: boolean;

    weekDate: string;
    onWeekDateChange: (v: string) => void;

    onPrevWeek: () => void;
    onNextWeek: () => void;
    onUseWeek: () => void;

    derivedWeekKey: string;
    runWeekKey: string;
    weekRangeLabel: string;

    routineExists: boolean;
    routineTitle: string | null;
    routineSplit: string | null;
};

export function GymCheckWeekPickerCard(props: Props) {
    const {
        t,
        lang,
        busy,
        weekDate,
        onWeekDateChange,
        onPrevWeek,
        onNextWeek,
        onUseWeek,
        derivedWeekKey,
        runWeekKey,
        weekRangeLabel,
        routineExists,
        routineTitle,
        routineSplit,
    } = props;

    return (
        <Card className={cn("w-full min-w-0", themedPanelCard)}>
            <CardHeader className="min-w-0">
                <CardTitle className="min-w-0 wrap-break-words">{lang === "es" ? "Semana" : "Week"}</CardTitle>
                <CardDescription className="min-w-0 wrap-break-words">
                    {lang === "es"
                        ? "Elige semana. Si no existe rutina, puedes cambiar a otra."
                        : "Pick a week. If there’s no routine, you can switch weeks."}
                </CardDescription>
            </CardHeader>

            <CardContent className="min-w-0 space-y-3">
                <div className="min-w-0 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                    <label className="text-sm text-muted-foreground">{t("week.pickDateInWeek")}</label>
                    <div className="my-1 w-auto columns-1 sm:my-0 sm:w-auto">
                        <input
                            className="h-10 min-w-0 rounded-lg border border-primary/15 bg-background px-3 text-base sm:w-full sm:text-sm"
                            type="date"
                            value={weekDate}
                            onChange={(e) => onWeekDateChange(e.target.value)}
                            disabled={busy}
                        />
                    </div>

                    <div className="my-1 grid w-full grid-cols-2 gap-2 sm:my-0 sm:w-auto">
                        <Button className="w-full sm:w-auto" variant="outline" onClick={onPrevWeek} disabled={busy}>
                            {t("week.prev")}
                        </Button>
                        <Button className="w-full sm:w-auto" variant="outline" onClick={onNextWeek} disabled={busy}>
                            {t("week.next")}
                        </Button>
                    </div>

                    <Button className="w-full sm:w-auto" onClick={onUseWeek} disabled={busy}>
                        {lang === "es" ? "Usar semana" : "Use week"}
                    </Button>
                </div>

                <div className={cn("min-w-0 flex flex-col sm:flex-row rounded-xl border p-3 text-xs text-muted-foreground wrap-break-words", themedNestedCard)}>
                    <span className="break-all font-mono"> {lang === "es" ? "Seleccionado" : "Selected"}:{" "}{derivedWeekKey}{" "}•{" "}</span>
                    <span className="break-all font-mono">{lang === "es" ? "Cargado" : "Loaded"}: {runWeekKey}{" "}•{" "}</span>{" "}
                    <span className="break-all font-mono">{weekRangeLabel}</span>
                </div>

                {routineExists ? (
                    <div className={cn("min-w-0 rounded-xl border p-3 text-sm wrap-break-words", themedNestedCard)}>
                        <span className="font-semibold">{formatNullable(routineTitle)}</span>{" "}
                        <span className="text-muted-foreground">• {formatNullable(routineSplit)}</span>
                    </div>
                ) : (
                    <div className={cn("rounded-xl border p-3 text-sm text-muted-foreground", themedNestedCard)}>
                        {lang === "es"
                            ? "No hay rutina para esta semana. Selecciona otra semana o crea la rutina en “Rutinas”."
                            : "No routine for this week. Pick another week or create it in “Routines”."}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}