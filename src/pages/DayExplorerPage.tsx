import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

import { useI18n } from "@/i18n/I18nProvider";
import { useDaySummary } from "@/hooks/useDaySummary";
import { useWorkoutDay } from "@/hooks/useWorkoutDay";

import { buildDayExplorerKpis } from "@/utils/dayExplorer";
import { DayExplorerToolbar } from "@/components/dayExplorer/DayExplorerToolbar";
import { DayExplorerKpisPanel } from "@/components/dayExplorer/DayExplorerKpis";

import { MediaViewerModal, type MediaLikeItem } from "@/components/media/MediaViewerModal";
import { DaySessionsPanel } from "@/components/dayExplorer/DaySessionsPanel";
import { DaySleepPanel } from "@/components/dayExplorer/DaySleepPanel";
import { DayTrainingMetaPanel } from "@/components/dayExplorer/DayTrainingMetaPanel";

import { JsonDetails } from "@/components/JsonDetails";

type Tab = "summary" | "raw";

function todayIso(): string {
    return format(new Date(), "yyyy-MM-dd");
}

export function DayExplorerPage() {
    const { t } = useI18n();

    const [date, setDate] = React.useState(() => todayIso());
    const [tab, setTab] = React.useState<Tab>("summary");
    const [openMedia, setOpenMedia] = React.useState<MediaLikeItem | null>(null);

    const summary = useDaySummary(date);
    const day = useWorkoutDay(date, Boolean(date));

    const isFetching = summary.isFetching || day.isFetching;

    React.useEffect(() => {
        if (summary.isError) {
            toast.error(summary.error.message);
        }
    }, [summary.isError, summary.error]);

    React.useEffect(() => {
        if (day.isError) {
            toast.error(day.error.message);
        }
    }, [day.isError, day.error]);

    const summaryData = summary.data ?? null;
    const rawDayData = day.data ?? null;

    const dataForJson = tab === "summary" ? summaryData : rawDayData;
    const errorForJson =
        tab === "summary"
            ? summary.isError
                ? summary.error
                : null
            : day.isError
                ? day.error
                : null;

    const kpis = React.useMemo(() => buildDayExplorerKpis(summaryData), [summaryData]);

    return (
        <div className="space-y-6">
            <PageHeader title={t("pages.days.title")} subtitle={t("pages.days.subtitle")} />

            <DayExplorerToolbar
                t={t}
                date={date}
                onDateChange={setDate}
                isFetching={isFetching}
                tab={tab}
                onTabChange={setTab}
            />

            {tab === "summary" && summary.isSuccess ? <DayExplorerKpisPanel t={t} kpis={kpis} /> : null}

            {!date ? <EmptyState title={t("days.empty.title")} description={t("days.empty.desc")} /> : null}

            {tab === "raw" && day.isSuccess && rawDayData ? (
                <div className="space-y-4">
                    <DayTrainingMetaPanel t={t} training={rawDayData.training} />
                    <DaySleepPanel t={t} day={rawDayData} />
                    <DaySessionsPanel t={t} day={rawDayData} onOpenMedia={setOpenMedia} />
                </div>
            ) : null}

            {isFetching ? (
                <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                    {t("common.fetching")}
                </div>
            ) : null}

            {errorForJson ? <JsonDetails title={t("days.debug.errorJsonTitle")} data={errorForJson} defaultOpen /> : null}

            <JsonDetails
                title={tab === "summary" ? t("days.debug.summaryJsonTitle") : t("days.debug.dayJsonTitle")}
                data={dataForJson}
            />

            {openMedia ? <MediaViewerModal item={openMedia} onClose={() => setOpenMedia(null)} /> : null}
        </div>
    );
}