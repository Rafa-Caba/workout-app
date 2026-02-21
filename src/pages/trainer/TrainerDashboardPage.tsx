import React from "react";
import { format, addWeeks } from "date-fns";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { useTrainerTrainees } from "@/hooks/trainer/useTrainerTrainees";
import { toWeekKey, weekKeyToStartDate } from "@/utils/weekKey";

import { TrainerWeeklySummarySection } from "@/sections/trainer/TrainerWeeklySummarySection";
import { TrainerDaySummarySection } from "@/sections/trainer/TrainerDaySummarySection";
import { TrainerRecoverySection } from "@/sections/trainer/TrainerRecoverySection";
import { TrainerAssignRoutineSection } from "@/sections/trainer/TrainerAssignRoutineSection";

type TrainerTab = "weekly" | "day" | "recovery" | "assign";

function tabButtonClass(active: boolean) {
    return cn(
        "h-9 px-3 rounded-full border text-sm transition-colors",
        "flex items-center gap-2",
        "w-full sm:w-auto justify-center",
        active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-card text-muted-foreground hover:bg-muted/70"
    );
}

function todayIso(): string {
    return format(new Date(), "yyyy-MM-dd");
}

export function TrainerDashboardPage() {
    const { lang } = useI18n();

    const [tab, setTab] = React.useState<TrainerTab>("weekly");

    // Centralized state (Option 1)
    const [selectedTraineeId, setSelectedTraineeId] = React.useState<string>("");
    const [weekKey, setWeekKey] = React.useState<string>(() => toWeekKey(new Date()));
    const [date, setDate] = React.useState<string>(() => todayIso());

    const traineesQ = useTrainerTrainees();

    // Normalize trainees for dropdown without assuming optional fields too hard.
    const trainees = React.useMemo(() => {
        const items = traineesQ.data ?? [];
        return items.map((u) => ({
            id: (u as any).id as string,
            name: ((u as any).name as string) || "Usuario",
            subtitle: ((u as any).email as string) || null,
        }));
    }, [traineesQ.data]);

    const selectedTrainee = React.useMemo(() => {
        if (!selectedTraineeId) return null;
        return trainees.find((t) => t.id === selectedTraineeId) ?? null;
    }, [selectedTraineeId, trainees]);

    // If current selection disappears (unassigned), clear selection gracefully.
    React.useEffect(() => {
        if (!selectedTraineeId) return;
        const stillExists = trainees.some((t) => t.id === selectedTraineeId);
        if (!stillExists && traineesQ.isFetched) {
            setSelectedTraineeId("");
            toast.error(
                lang === "es"
                    ? "Tu selección ya no está disponible. Tal vez el trainee fue desasignado."
                    : "Selection is no longer available. Trainee may have been unassigned."
            );
        }
    }, [selectedTraineeId, trainees, traineesQ.isFetched, lang]);

    const title = lang === "es" ? "Panel de entrenador" : "Trainer dashboard";
    const subtitle =
        lang === "es"
            ? "Selecciona un trainee para ver su resumen semanal, día, recuperación y asignar rutina."
            : "Select a trainee to view weekly/day summaries, recovery insights, and assign routines.";

    const traineeLabel = selectedTrainee?.name
        ? selectedTrainee.name
        : lang === "es"
            ? "Selecciona un trainee"
            : "Select a trainee";

    const tabDescription =
        tab === "weekly"
            ? lang === "es"
                ? "Resumen semanal (solo lectura)."
                : "Weekly summary (read-only)."
            : tab === "day"
                ? lang === "es"
                    ? "Resumen por día (solo lectura)."
                    : "Day summary (read-only)."
                : tab === "recovery"
                    ? lang === "es"
                        ? "Recuperación y sueño (solo lectura)."
                        : "Recovery and sleep (read-only)."
                    : lang === "es"
                        ? "Asignar rutina planificada (escritura)."
                        : "Assign planned routine (write).";

    const hasSelected = Boolean(selectedTraineeId);

    const weekStartMaybe = React.useMemo(() => {
        try {
            return weekKeyToStartDate(weekKey);
        } catch {
            return new Date();
        }
    }, [weekKey]);

    const weekStart = weekStartMaybe;

    const weekRangeLabel = React.useMemo(() => {
        // NOTE: End is exclusive in some systems; we use a friendly display.
        return `${format(weekStart, "yyyy-MM-dd")} → ${format(addWeeks(weekStart, 1), "yyyy-MM-dd")}`;
    }, [weekStart]);

    const onPrevWeek = () => setWeekKey(toWeekKey(addWeeks(weekStart, -1)));
    const onNextWeek = () => setWeekKey(toWeekKey(addWeeks(weekStart, 1)));

    const traineeDropdownDisabled = traineesQ.isLoading || traineesQ.isError;

    return (
        <div className="space-y-6">
            <PageHeader title={title} subtitle={subtitle} />

            {/* Controls: Trainee dropdown + Tabs */}
            <div className="rounded-xl border bg-card p-3 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-sm font-medium">{lang === "es" ? "Trainee" : "Trainee"}</div>

                        <div className="mt-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={traineeDropdownDisabled}
                                        className={cn("w-full sm:w-[320px] justify-between", traineeDropdownDisabled ? "opacity-80" : "")}
                                    >
                                        <span className="truncate">
                                            {traineesQ.isLoading
                                                ? lang === "es"
                                                    ? "Cargando trainees…"
                                                    : "Loading trainees…"
                                                : traineeLabel}
                                        </span>
                                        <span className="text-muted-foreground">▾</span>
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="start" className="min-w-[320px]">
                                    <DropdownMenuLabel>
                                        {lang === "es" ? "Selecciona un trainee" : "Select a trainee"}
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    {traineesQ.isError ? (
                                        <DropdownMenuItem onClick={() => traineesQ.refetch()} className="text-destructive">
                                            {lang === "es" ? "Error al cargar. Toca para reintentar." : "Failed to load. Tap to retry."}
                                        </DropdownMenuItem>
                                    ) : trainees.length === 0 ? (
                                        <DropdownMenuItem disabled>
                                            {lang === "es" ? "Aún no hay trainees asignados" : "No assigned trainees yet"}
                                        </DropdownMenuItem>
                                    ) : (
                                        trainees.map((t) => {
                                            const isActive = t.id === selectedTraineeId;
                                            return (
                                                <DropdownMenuItem
                                                    key={t.id}
                                                    onClick={() => setSelectedTraineeId(t.id)}
                                                    className={isActive ? "font-semibold" : ""}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate">{t.name}</div>
                                                        {t.subtitle ? (
                                                            <div className="truncate text-xs text-muted-foreground">{t.subtitle}</div>
                                                        ) : null}
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })
                                    )}

                                    {hasSelected ? (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setSelectedTraineeId("")}>
                                                {lang === "es" ? "Limpiar selección" : "Clear selection"}
                                            </DropdownMenuItem>
                                        </>
                                    ) : null}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="min-w-0">
                        <div className="text-sm font-medium">{lang === "es" ? "Secciones" : "Sections"}</div>

                        <div className="mt-2 grid gap-2 sm:flex sm:flex-wrap sm:gap-2">
                            <Button type="button" variant="ghost" className={tabButtonClass(tab === "weekly")} onClick={() => setTab("weekly")}>
                                {lang === "es" ? "Resumen semanal" : "Weekly summary"}
                            </Button>

                            <Button type="button" variant="ghost" className={tabButtonClass(tab === "day")} onClick={() => setTab("day")}>
                                {lang === "es" ? "Resumen del día" : "Day summary"}
                            </Button>

                            <Button type="button" variant="ghost" className={tabButtonClass(tab === "recovery")} onClick={() => setTab("recovery")}>
                                {lang === "es" ? "Recuperación" : "Recovery"}
                            </Button>

                            <Button type="button" variant="ghost" className={tabButtonClass(tab === "assign")} onClick={() => setTab("assign")}>
                                {lang === "es" ? "Asignar rutina" : "Assign routine"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">{tabDescription}</div>

                {/* Central controls (week/date) */}
                <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="text-xs text-muted-foreground">
                        {lang === "es" ? "Semana:" : "Week:"}{" "}
                        <span className="font-medium text-foreground">{weekKey}</span>{" "}
                        <span className="ml-2">({weekRangeLabel})</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
                        <Button type="button" variant="outline" onClick={onPrevWeek}>
                            {lang === "es" ? "Semana anterior" : "Prev week"}
                        </Button>
                        <Button type="button" variant="outline" onClick={onNextWeek}>
                            {lang === "es" ? "Semana siguiente" : "Next week"}
                        </Button>
                    </div>

                    <div className="sm:ml-auto">
                        <label className="block text-xs text-muted-foreground mb-1">
                            {lang === "es" ? "Día (YYYY-MM-DD)" : "Day (YYYY-MM-DD)"}
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={cn(
                                "h-9 w-full sm:w-[50] rounded-md border bg-background px-3 text-sm",
                                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            )}
                            disabled={!hasSelected}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            {!hasSelected ? (
                <EmptyState
                    title={lang === "es" ? "Selecciona un trainee para comenzar" : "Select a trainee to begin"}
                    description={
                        lang === "es"
                            ? "Aquí podrás ver su resumen semanal, día a día, recuperación y asignar rutina planificada."
                            : "You can view weekly/day summaries, recovery insights, and assign planned routines."
                    }
                />
            ) : (
                <>
                    {tab === "weekly" ? (
                        <TrainerWeeklySummarySection traineeId={selectedTraineeId} weekKey={weekKey} />
                    ) : null}

                    {tab === "day" ? (
                        <TrainerDaySummarySection traineeId={selectedTraineeId} date={date} />
                    ) : null}

                    {tab === "recovery" ? (
                        <TrainerRecoverySection traineeId={selectedTraineeId} weekKey={weekKey} />
                    ) : null}

                    {tab === "assign" ? (
                        <TrainerAssignRoutineSection traineeId={selectedTraineeId} weekKey={weekKey} date={date} />
                    ) : null}
                </>
            )}
        </div>
    );
}