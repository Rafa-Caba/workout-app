// src/pages/ProgressPage.tsx
import React from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { JsonDetails } from "@/components/JsonDetails";
import { EmptyState } from "@/components/EmptyState";
import { ExerciseProgressSection } from "@/components/progress/ExerciseProgressSection";
import { ProgressExerciseTableCard } from "@/components/progress/ProgressExerciseTableCard";
import { ProgressHeroCard } from "@/components/progress/ProgressHeroCard";
import { ProgressHighlightsCard } from "@/components/progress/ProgressHighlightsCard";
import { ProgressMetricsSection } from "@/components/progress/ProgressMetricsSection";
import { ProgressPeriodToolbar } from "@/components/progress/ProgressPeriodToolbar";
import { SessionTypeProgressCard } from "@/components/progress/SessionTypeProgressCard";
import { TopExerciseHighlightsCard } from "@/components/progress/TopExerciseHighlightsCard";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import type {
    WorkoutProgressCompareTo,
    WorkoutProgressMode,
} from "@/types/workoutProgress.types";

export function ProgressPage() {
    const [mode, setMode] = React.useState<WorkoutProgressMode>("last30");
    const [compareTo, setCompareTo] =
        React.useState<WorkoutProgressCompareTo>("previous_period");

    const query = useWorkoutProgress({
        mode,
        compareTo,
        includeExerciseProgress: true,
    });

    React.useEffect(() => {
        if (query.isError) {
            toast.error(query.error.message);
        }
    }, [query.isError, query.error]);

    const data = query.data ?? null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Progreso"
                subtitle="Compara entrenamiento, sueño, adherencia y mejoras por ejercicio."
            />

            <ProgressPeriodToolbar
                mode={mode}
                compareTo={compareTo}
                onChangeMode={setMode}
                onChangeCompareTo={setCompareTo}
            />

            {query.isFetching ? (
                <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                    Cargando progreso...
                </div>
            ) : null}

            {query.isError ? (
                <JsonDetails title="Error" data={query.error} defaultOpen />
            ) : null}

            {!query.isLoading && !data ? (
                <EmptyState
                    title="No se pudo cargar progreso"
                    description="Intenta nuevamente."
                />
            ) : null}

            {data ? (
                <>
                    <ProgressHeroCard
                        hero={data.hero}
                        range={data.range}
                        compareRange={data.compareRange}
                    />

                    <ProgressMetricsSection
                        title="Entrenamiento"
                        subtitle="Sesiones, duración, kcal, HR, distancia y pasos."
                        metrics={data.training}
                    />

                    <ProgressMetricsSection
                        title="Sueño"
                        subtitle="Sueño promedio, deep, REM y score."
                        metrics={data.sleep}
                    />

                    <ProgressMetricsSection
                        title="Adherencia"
                        subtitle="Planeado vs completado, ejercicios, sets y calidad."
                        metrics={data.adherence}
                    />

                    <ProgressHighlightsCard
                        title="Highlights automáticos"
                        items={data.highlights}
                    />

                    <ProgressExerciseTableCard rows={data.exerciseTable} />

                    <TopExerciseHighlightsCard items={data.exerciseHighlights} />

                    <ExerciseProgressSection items={data.exerciseProgress} />

                    <SessionTypeProgressCard items={data.sessionTypeProgress} />

                    <JsonDetails title="JSON progreso" data={data} />
                </>
            ) : null}
        </div>
    );
}