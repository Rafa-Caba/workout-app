import * as React from "react";
import type { DayKey, DayPlan } from "@/utils/routines/plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatNullable(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

function getTagsText(plan: DayPlan): string {
    const p: any = plan as any;

    if (typeof p.tagsCsv === "string") return p.tagsCsv.trim() || "—";

    if (Array.isArray(p.tags)) {
        const joined = p.tags.filter((x: any) => typeof x === "string" && x.trim()).join(", ");
        return joined || "—";
    }

    if (typeof p.tags === "string") return p.tags.trim() || "—";

    return "—";
}

type Props = {
    lang: "es" | "en";
    activeDay: DayKey;
    dayLabels: Record<string, { es: string; en: string }>;
    activePlan: DayPlan;
};

export function GymCheckPlanInfo(props: Props) {
    const { lang, activeDay, dayLabels, activePlan } = props;

    return (
        <Card className="w-full min-w-0">
            <CardHeader className="min-w-0">
                <CardTitle className="min-w-0 wrap-break-words">{lang === "es" ? "Plan (info)" : "Plan (info)"}</CardTitle>
            </CardHeader>

            <CardContent className="min-w-0 space-y-2">
                <div className="min-w-0 text-sm font-semibold wrap-break-words">
                    {lang === "es" ? `Día ${dayLabels[activeDay].es}` : `Day ${dayLabels[activeDay].en}`}
                </div>

                <div className="min-w-0 text-xs text-muted-foreground space-y-1">
                    <div className="min-w-0 wrap-break-words">
                        <span className="font-semibold">{lang === "es" ? "Tipo" : "Type"}:</span>{" "}
                        {formatNullable((activePlan as any).sessionType)}
                    </div>
                    <div className="min-w-0 wrap-break-words">
                        <span className="font-semibold">{lang === "es" ? "Enfoque" : "Focus"}:</span>{" "}
                        {formatNullable((activePlan as any).focus)}
                    </div>
                    <div className="min-w-0 wrap-break-words">
                        <span className="font-semibold">Tags:</span>{" "}
                        <span className="wrap-break-words">{getTagsText(activePlan)}</span>
                    </div>
                    <div className="min-w-0 wrap-break-words">
                        <span className="font-semibold">{lang === "es" ? "Notas" : "Notes"}:</span>{" "}
                        <span className="wrap-break-words">{formatNullable((activePlan as any).notes)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
