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
        <Card className="w-full min-w-0">
            <CardHeader className="min-w-0">
                <CardTitle className="min-w-0 wrap-break-words">Plan por día</CardTitle>
                <CardDescription className="min-w-0 wrap-break-words">
                    Selecciona el día para marcar ejercicios y subir media.
                </CardDescription>
            </CardHeader>

            <CardContent className="min-w-0 space-y-4">
                <div className="-mx-3 px-3 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-center gap-2 w-max min-w-full">
                        {items.map((d) => {
                            const active = d.dayKey === activeDay;
                            return (
                                <button
                                    key={d.dayKey}
                                    type="button"
                                    onClick={() => onSelectDay(d.dayKey)}
                                    className={[
                                        "shrink-0 text-base sm:text-sm rounded-lg px-3 py-2 border transition whitespace-nowrap",
                                        "min-h-10",
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
