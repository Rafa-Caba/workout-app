// src/components/gymCheck/GymCheckDayTabs.tsx
// MUI day selector for Gym Check daily plans.

import type { DayKey } from "@/utils/routines/plan";
import { AppCard, AppResponsiveTabs } from "@/components/mui";

type Item = { dayKey: DayKey; label: string };

type Props = {
    items: Item[];
    activeDay: DayKey;
    onSelectDay: (day: DayKey) => void;
};

export function GymCheckDayTabs(props: Props) {
    const { items, activeDay, onSelectDay } = props;

    return (
        <AppCard
            title="Plan por día"
            subtitle="Selecciona el día para marcar ejercicios y subir media."
            padding="sm"
        >
            <AppResponsiveTabs
                ariaLabel="Gym Check day tabs"
                value={activeDay}
                onChange={(value) => onSelectDay(value as DayKey)}
                tabs={items.map((item) => ({ value: item.dayKey, label: item.label }))}
                sx={{ borderBottom: 0 }}
            />
        </AppCard>
    );
}
