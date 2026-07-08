// src/components/routines/RoutinesDayTabs.tsx
// MUI day selector for routine editor days.

import type { DayKey } from "@/utils/routines/plan";
import { AppResponsiveTabs } from "@/components/mui";

type Props = {
    items: Array<{ dayKey: DayKey; label: string }>;
    activeDay: DayKey;
    busy: boolean;
    onSelectDay: (dayKey: DayKey) => void;
};

export function RoutinesDayTabs({ items, activeDay, busy, onSelectDay }: Props) {
    return (
        <AppResponsiveTabs
            ariaLabel="Routine day tabs"
            value={activeDay}
            onChange={(value) => onSelectDay(value as DayKey)}
            tabs={items.map((item) => ({ value: item.dayKey, label: item.label, disabled: busy }))}
            sx={{ borderBottom: 0 }}
        />
    );
}
