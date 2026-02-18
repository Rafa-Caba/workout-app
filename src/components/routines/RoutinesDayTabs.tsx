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
        <div className="w-full min-w-0 -mx-1 px-1 overflow-x-auto">
            <div className="flex items-center gap-2 w-max min-w-full flex-nowrap sm:flex-wrap sm:min-w-0 sm:w-full">
                {items.map((it) => {
                    const active = it.dayKey === activeDay;

                    return (
                        <Button
                            key={it.dayKey}
                            type="button"
                            variant={active ? "default" : "outline"}
                            className="h-9 whitespace-nowrap shrink-0"
                            onClick={() => onSelectDay(it.dayKey)}
                            disabled={busy}
                        >
                            {it.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
