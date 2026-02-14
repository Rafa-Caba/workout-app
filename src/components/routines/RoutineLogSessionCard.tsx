// src/components/routines/RoutineLogSessionCard.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import type { DayPlan } from "@/utils/routines/plan";
import type { CreateSessionBody } from "@/services/workout/sessions.service";
import type { I18nKey } from "@/i18n/translations";

type I18nVars = Record<string, string | number>;
type TFn = (key: I18nKey, vars?: I18nVars) => string;

type Props = {
    lang: "es" | "en";
    t: TFn;

    activeDate: string | null;
    activeDayKey: DayPlan["dayKey"];
    activePlan: DayPlan;

    sessionsCount: number;
    sessionsPreviewText: string | null;

    loggingBusy: boolean;
    creating: boolean;

    onCreate: (payload: CreateSessionBody) => Promise<void>;
};

function defaultSessionTypeFromPlan(plan: DayPlan): string {
    const planned = (plan.sessionType ?? "").trim();
    if (planned) return planned;
    return "Traditional Strength Training";
}

export function RoutineLogSessionCard({
    lang,
    t,
    activeDate,
    activeDayKey,
    activePlan,
    sessionsCount,
    sessionsPreviewText,
    loggingBusy,
    creating,
    onCreate,
}: Props) {
    const [logType, setLogType] = React.useState<string>("");
    const [logDuration, setLogDuration] = React.useState<string>("");
    const [logNotes, setLogNotes] = React.useState<string>("");

    // Track whether the user has manually edited type.
    const typeDirtyRef = React.useRef(false);

    // When day changes: reset duration/notes and re-hydrate type from plan
    // (unless user already typed something for this day).
    React.useEffect(() => {
        typeDirtyRef.current = false;

        const plannedType = (activePlan.sessionType ?? "").trim();
        setLogType(plannedType); // allow empty if no plan type yet

        setLogDuration("");
        setLogNotes("");
    }, [activeDayKey, activePlan.sessionType]);

    function onTypeChange(v: string) {
        typeDirtyRef.current = true;
        setLogType(v);
    }

    async function quickComplete() {
        if (!activeDate) return;

        const payload: CreateSessionBody = {
            type: defaultSessionTypeFromPlan(activePlan),
            notes:
                lang === "es"
                    ? "Registrado desde Rutinas (quick complete)"
                    : "Logged from Routines (quick complete)",
        };

        await onCreate(payload);
    }

    async function logSession() {
        if (!activeDate) return;

        const type = (logType || "").trim() || defaultSessionTypeFromPlan(activePlan);
        const durationSeconds =
            logDuration.trim() === ""
                ? undefined
                : Number.isFinite(Number(logDuration))
                    ? Number(logDuration)
                    : NaN;

        if (durationSeconds !== undefined && Number.isNaN(durationSeconds)) {
            // parent shows toasts; here we just no-op
            return;
        }

        const payload: CreateSessionBody = {
            type,
            durationSeconds: durationSeconds === undefined ? undefined : durationSeconds,
            notes: logNotes.trim() ? logNotes.trim() : undefined,
        };

        await onCreate(payload);
    }

    const placeholderType = (activePlan.sessionType ?? "").trim() || "Traditional Strength Training";

    return (
        <div className="rounded-xl border bg-background p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold">
                        {lang === "es" ? "Registrar sesión real" : "Log actual session"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {lang === "es"
                            ? "Esto crea una sesión en el día para que Plan vs Real marque 'done'."
                            : "This creates a session on the day so Plan vs Actual becomes 'done'."}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={quickComplete} disabled={loggingBusy}>
                        Quick complete
                    </Button>
                    <Button onClick={logSession} disabled={loggingBusy}>
                        {creating
                            ? lang === "es"
                                ? "Guardando…"
                                : "Saving…"
                            : lang === "es"
                                ? "Crear sesión"
                                : "Create session"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium">{lang === "es" ? "Tipo" : "Type"}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={logType}
                        onChange={(e) => onTypeChange(e.target.value)}
                        disabled={loggingBusy}
                        placeholder={placeholderType}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium">
                        {lang === "es" ? "Duración (seg)" : "Duration (sec)"}
                    </label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={logDuration}
                        onChange={(e) => setLogDuration(e.target.value)}
                        disabled={loggingBusy}
                        placeholder={lang === "es" ? "Ej. 3600" : "e.g. 3600"}
                        inputMode="numeric"
                    />
                </div>

                <div className="space-y-1 md:col-span-1">
                    <label className="text-xs font-medium">{lang === "es" ? "Notas" : "Notes"}</label>
                    <input
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        disabled={loggingBusy}
                        placeholder={lang === "es" ? "Opcional…" : "Optional…"}
                    />
                </div>
            </div>

            <div className="text-xs text-muted-foreground">
                {lang === "es" ? "Sesiones actuales en el día:" : "Current sessions on the day:"}{" "}
                <span className="font-mono">{sessionsCount}</span>
                {sessionsPreviewText ? <span className="ml-2">• {sessionsPreviewText}</span> : null}
            </div>
        </div>
    );
}
