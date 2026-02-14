import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <Card>
            <CardHeader>
                <CardTitle>{lang === "es" ? "Semana" : "Week"}</CardTitle>
                <CardDescription>
                    {lang === "es"
                        ? "Elige semana. Si no existe rutina, puedes cambiar a otra."
                        : "Pick a week. If there’s no routine, you can switch weeks."}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="text-sm text-muted-foreground">{t("week.pickDateInWeek")}</label>
                    <input
                        className="rounded-lg border bg-background px-3 py-2 text-sm"
                        type="date"
                        value={weekDate}
                        onChange={(e) => onWeekDateChange(e.target.value)}
                        disabled={busy}
                    />
                    <Button variant="outline" onClick={onPrevWeek} disabled={busy}>
                        {t("week.prev")}
                    </Button>
                    <Button variant="outline" onClick={onNextWeek} disabled={busy}>
                        {t("week.next")}
                    </Button>
                    <Button onClick={onUseWeek} disabled={busy}>
                        {lang === "es" ? "Usar semana" : "Use week"}
                    </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                    {lang === "es" ? "Seleccionado" : "Selected"}: <span className="font-mono">{derivedWeekKey}</span> •{" "}
                    {lang === "es" ? "Cargado" : "Loaded"}: <span className="font-mono">{runWeekKey}</span> •{" "}
                    <span className="font-mono">{weekRangeLabel}</span>
                </div>

                {routineExists ? (
                    <div className="text-sm">
                        <span className="font-semibold">{formatNullable(routineTitle)}</span>{" "}
                        <span className="text-muted-foreground">• {formatNullable(routineSplit)}</span>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        {lang === "es"
                            ? "No hay rutina para esta semana. Selecciona otra semana o crea la rutina en “Rutinas”."
                            : "No routine for this week. Pick another week or create it in “Routines”."}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
