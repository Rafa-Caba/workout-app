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
        <Card className="w-full min-w-0">
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

                    <input
                        className="h-10 w-full sm:w-auto min-w-0 rounded-lg border bg-background px-3 text-base sm:text-sm"
                        type="date"
                        value={weekDate}
                        onChange={(e) => onWeekDateChange(e.target.value)}
                        disabled={busy}
                    />

                    <div className="grid w-full sm:w-auto gap-2 grid-cols-2 my-1 sm:my-0">
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

                <div className="min-w-0 text-xs text-muted-foreground wrap-break-words">
                    {lang === "es" ? "Seleccionado" : "Selected"}:{" "}
                    <span className="font-mono break-all">{derivedWeekKey}</span> •{" "}
                    {lang === "es" ? "Cargado" : "Loaded"}: <span className="font-mono break-all">{runWeekKey}</span> •{" "}
                    <span className="font-mono break-all">{weekRangeLabel}</span>
                </div>

                {routineExists ? (
                    <div className="min-w-0 text-sm wrap-break-words">
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
