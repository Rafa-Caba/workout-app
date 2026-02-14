import * as React from "react";
import type { DayKey } from "@/utils/routines/plan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Item = { dayKey: DayKey; label: string };

type Props = {
    items: Item[];
    activeDay: DayKey;
    onSelectDay: (day: DayKey) => void;
};

export function GymCheckDayTabs(props: Props) {
    const { items, activeDay, onSelectDay } = props;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Plan por día</CardTitle>
                <CardDescription>Selecciona el día para marcar ejercicios y subir media.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="-mx-2 px-2 overflow-x-auto">
                    <div className="flex items-center gap-2 w-max">
                        {items.map((d) => {
                            const active = d.dayKey === activeDay;
                            return (
                                <button
                                    key={d.dayKey}
                                    type="button"
                                    onClick={() => onSelectDay(d.dayKey)}
                                    className={[
                                        "text-sm rounded-lg px-3 py-2 border transition whitespace-nowrap",
                                        active
                                            ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                                            : "bg-background hover:bg-muted/60",
                                    ].join(" ")}
                                >
                                    {d.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
