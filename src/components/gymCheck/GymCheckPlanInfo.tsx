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
        <Card>
            <CardHeader>
                <CardTitle>{lang === "es" ? "Plan (info)" : "Plan (info)"}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
                <div className="text-sm font-semibold">
                    {lang === "es" ? `Día ${dayLabels[activeDay].es}` : `Day ${dayLabels[activeDay].en}`}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                        <span className="font-semibold">{lang === "es" ? "Tipo" : "Type"}:</span>{" "}
                        {formatNullable((activePlan as any).sessionType)}
                    </div>
                    <div>
                        <span className="font-semibold">{lang === "es" ? "Enfoque" : "Focus"}:</span>{" "}
                        {formatNullable((activePlan as any).focus)}
                    </div>
                    <div>
                        <span className="font-semibold">Tags:</span> {getTagsText(activePlan)}
                    </div>
                    <div>
                        <span className="font-semibold">{lang === "es" ? "Notas" : "Notes"}:</span>{" "}
                        {formatNullable((activePlan as any).notes)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
