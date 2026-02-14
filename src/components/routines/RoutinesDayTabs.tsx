import React from "react";
import { Button } from "@/components/ui/button";
import type { DayKey } from "@/utils/routines/plan";

type Props = {
    items: Array<{ dayKey: DayKey; label: string }>;
    activeDay: DayKey;
    busy: boolean;
    onSelectDay: (dayKey: DayKey) => void;
};

export function RoutinesDayTabs({ items, activeDay, busy, onSelectDay }: Props) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((it) => {
                const active = it.dayKey === activeDay;
                return (
                    <Button
                        key={it.dayKey}
                        type="button"
                        variant={active ? "default" : "outline"}
                        className="h-9"
                        onClick={() => onSelectDay(it.dayKey)}
                        disabled={busy}
                    >
                        {it.label}
                    </Button>
                );
            })}
        </div>
    );
}
