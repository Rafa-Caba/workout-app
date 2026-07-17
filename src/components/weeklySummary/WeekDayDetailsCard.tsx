// src/components/weeklySummary/WeekDayDetailsCard.tsx
// Tabbed daily training and sleep detail for the weekly summary page.

import * as React from "react";
import Box from "@mui/material/Box";

import { AppCard, AppResponsiveTabs } from "@/components/mui";
import { WeekSleepByDayTable } from "@/components/weeklySummary/WeekSleepByDayTable";
import { WeekTrainingByDayTable } from "@/components/weeklySummary/WeekTrainingByDayTable";
import type { I18nKey } from "@/i18n/translations";
import type { CalendarDayFull } from "@/types/workoutDay.types";

type DetailTab = "training" | "sleep";

function isDetailTab(value: string): value is DetailTab {
    return value === "training" || value === "sleep";
}

type Props = {
    days: readonly CalendarDayFull[];
    loading: boolean;
    hasError: boolean;
    lang: "es" | "en";
    t: (key: I18nKey) => string;
    period?: "week" | "range";
};

export function WeekDayDetailsCard(props: Props) {
    const { days, loading, hasError, lang, t, period = "week" } = props;
    const [activeTab, setActiveTab] = React.useState<DetailTab>("training");

    return (
        <AppCard
            title={lang === "es" ? "Detalle por día" : "Daily detail"}
            subtitle={
                period === "range"
                    ? (
                        lang === "es"
                            ? "Compara lo registrado en entrenamiento y sueño durante el rango seleccionado."
                            : "Compare training and sleep records captured during the selected range."
                    )
                    : (
                        lang === "es"
                            ? "Compara lo registrado en entrenamiento y sueño durante la semana."
                            : "Compare training and sleep records captured during the week."
                    )
            }
            padding="sm"
        >
            <Box sx={{ mb: 1.5 }}>
                <AppResponsiveTabs
                    value={activeTab}
                    onChange={(value) => {
                        if (isDetailTab(value)) {
                            setActiveTab(value);
                        }
                    }}
                    ariaLabel={
                        period === "range"
                            ? (lang === "es" ? "Detalle del rango por día" : "Range daily detail")
                            : (lang === "es" ? "Detalle semanal por día" : "Weekly daily detail")
                    }
                    tabs={[
                        { value: "training", label: lang === "es" ? "Entrenamiento" : "Training" },
                        { value: "sleep", label: lang === "es" ? "Sueño" : "Sleep" },
                    ]}
                    variant="standard"
                />
            </Box>

            {activeTab === "training" ? (
                <WeekTrainingByDayTable
                    days={days}
                    loading={loading}
                    hasError={hasError}
                    lang={lang}
                    t={t}
                />
            ) : (
                <WeekSleepByDayTable
                    days={days}
                    loading={loading}
                    hasError={hasError}
                    lang={lang}
                    t={t}
                />
            )}
        </AppCard>
    );
}
