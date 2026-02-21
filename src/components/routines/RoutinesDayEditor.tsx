import React from "react";
import { Button } from "@/components/ui/button";
import { RoutinesExerciseCard, type MovementOption } from "@/components/routines/RoutinesExerciseCard";
import type { AttachmentOption } from "@/utils/routines/attachments";
import type { DayPlan, DayKey, ExerciseItem } from "@/utils/routines/plan";
import type { I18nKey } from "@/i18n/translations";

type TFn = (key: I18nKey) => string;

type Placeholders = {
    sessionType: string;
    focus: string;
    tags: string;
    notes: string;
    exNotes: string;
    sets: string;
    reps: string;
    load: string;
};

type Props = {
    activePlan: DayPlan;
    busy: boolean;

    t: TFn;
    lang: string;

    ph: Placeholders;

    scrollRootEl?: HTMLElement | null;

    attachmentOptions: AttachmentOption[];

    movementOptions?: MovementOption[];

    exerciseUploadBusy: boolean;
    uploadingExercise: { dayKey: DayKey; exerciseId: string } | null;

    getPendingFilesForExercise: (exerciseId: string) => File[];
    onPickFilesForExercise: (exerciseId: string, files: File[]) => void;
    onRemovePendingForExercise: (exerciseId: string, fileIndex?: number) => void;

    onAddExercise: (dayKey: DayKey) => void;
    onRemoveExercise: (dayKey: DayKey, idx: number) => void;
    onUpdatePlan: (dayKey: DayKey, patch: Partial<DayPlan>) => void;
    onUpdateExercise: (dayKey: DayKey, idx: number, patch: Partial<ExerciseItem>) => void;
};

function getOverflowY(el: HTMLElement): string {
    try {
        return window.getComputedStyle(el).overflowY;
    } catch {
        return "";
    }
}

function findScrollRoot(startEl: HTMLElement): HTMLElement | Window {
    // Radix ScrollArea viewport
    const radixViewport = startEl.closest("[data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (radixViewport) return radixViewport;

    // Nearest overflow-y auto/scroll parent
    let p: HTMLElement | null = startEl.parentElement;
    while (p) {
        const oy = getOverflowY(p);
        if (oy === "auto" || oy === "scroll") return p;
        p = p.parentElement;
    }

    return window;
}

function isWindow(v: HTMLElement | Window): v is Window {
    return v === window;
}

function getViewportBounds(root: HTMLElement | Window): { top: number; bottom: number } {
    if (isWindow(root)) {
        const h = window.innerHeight || document.documentElement.clientHeight || 0;
        return { top: 0, bottom: h };
    }

    const r = root.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom };
}

export function RoutinesDayEditor({
    activePlan,
    busy,
    t,
    lang,
    ph,
    attachmentOptions,
    movementOptions,
    exerciseUploadBusy,
    uploadingExercise,
    getPendingFilesForExercise,
    onPickFilesForExercise,
    onRemovePendingForExercise,
    onAddExercise,
    onRemoveExercise,
    onUpdatePlan,
    onUpdateExercise,
    scrollRootEl
}: Props) {
    const exercises = activePlan.exercises ?? [];

    // Track when the "real" header button is visible.
    const addBtnWrapRef = React.useRef<HTMLDivElement | null>(null);
    const [showStickyAdd, setShowStickyAdd] = React.useState(false);

    function canScroll(el: HTMLElement | null | undefined) {
        if (!el) return true; // viewport siempre “scrolleable”
        return el.scrollHeight > el.clientHeight + 1;
    }

    React.useEffect(() => {
        const sentinel = addBtnWrapRef.current;
        if (!sentinel) return;

        if (scrollRootEl && !canScroll(scrollRootEl)) {
            setShowStickyAdd(false);
            return;
        }

        setShowStickyAdd(false);

        let raf1 = 0;
        let raf2 = 0;

        let hasScrolled = false;

        const root = scrollRootEl ?? null;

        const onScroll = () => {
            const top = scrollRootEl ? scrollRootEl.scrollTop : window.scrollY;
            hasScrolled = top > 8;
            if (!hasScrolled) setShowStickyAdd(false);
        };

        const scrollTarget: EventTarget = scrollRootEl ?? window;
        scrollTarget.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        const isMdUp =
            typeof window !== "undefined"
                ? window.matchMedia("(min-width: 768px)").matches
                : false;

        const rootMargin = isMdUp ? "-72px 0px 0px 0px" : "0px 0px 0px 0px";

        const io = new IntersectionObserver(
            ([entry]) => {
                if (!hasScrolled) {
                    setShowStickyAdd(false);
                    return;
                }
                setShowStickyAdd(!entry.isIntersecting);
            },
            {
                root,
                threshold: 0,
                rootMargin,
            }
        );

        io.observe(sentinel);

        raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                if (!hasScrolled) setShowStickyAdd(false);
            });
        });

        return () => {
            io.disconnect();
            scrollTarget.removeEventListener("scroll", onScroll as any);
            if (raf1) cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
        };
    }, [scrollRootEl]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <span>{t("routines.day")}</span>
                    <span className="inline-flex items-center rounded-full border border-secondary/60 bg-primary/20 px-2 py-0.5 text-[11px] font-mono">
                        {activePlan.dayKey}
                    </span>
                </div>

                <div className="w-full sm:w-auto">
                    <div ref={addBtnWrapRef} className="h-px w-full" aria-hidden="true" />
                    <Button
                        variant="outline"
                        className="h-9 px-3 w-full sm:w-auto"
                        onClick={() => onAddExercise(activePlan.dayKey as DayKey)}
                        disabled={busy}
                    >
                        {t("routines.addExercise")}
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border bg-card/80 p-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs font-medium">{t("routines.sessionType")}</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={activePlan.sessionType ?? ""}
                            onChange={(e) =>
                                onUpdatePlan(activePlan.dayKey as DayKey, {
                                    sessionType: e.target.value || undefined,
                                })
                            }
                            disabled={busy}
                            placeholder={ph.sessionType}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium">{t("routines.focus")}</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={activePlan.focus ?? ""}
                            onChange={(e) =>
                                onUpdatePlan(activePlan.dayKey as DayKey, {
                                    focus: e.target.value || undefined,
                                })
                            }
                            disabled={busy}
                            placeholder={ph.focus}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium">{t("routines.tagsCsv")}</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={(activePlan.tags ?? []).join(", ")}
                            onChange={(e) =>
                                onUpdatePlan(activePlan.dayKey as DayKey, {
                                    tags: e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                })
                            }
                            disabled={busy}
                            placeholder={ph.tags}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium">{t("routines.notes")}</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={activePlan.notes ?? ""}
                            onChange={(e) =>
                                onUpdatePlan(activePlan.dayKey as DayKey, {
                                    notes: e.target.value || undefined,
                                })
                            }
                            disabled={busy}
                            placeholder={ph.notes}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-dashed bg-card/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium text-muted-foreground">
                        {lang === "es" ? "Ejercicios del día" : "Day exercises"}
                    </div>
                    {exercises.length > 0 ? (
                        <div className="text-[11px] font-mono text-muted-foreground shrink-0">
                            {exercises.length} {lang === "es" ? "ejercicio(s)" : "exercise(s)"}
                        </div>
                    ) : null}
                </div>

                <div className="space-y-3 border-primary/80">
                    {exercises.map((ex, idx) => {
                        const exerciseId = ex.id;
                        const selectedIds = Array.isArray(ex.attachmentPublicIds) ? ex.attachmentPublicIds : [];

                        const isThisUploading =
                            exerciseUploadBusy &&
                            uploadingExercise?.dayKey === (activePlan.dayKey as DayKey) &&
                            uploadingExercise?.exerciseId === exerciseId;

                        const pendingFiles = getPendingFilesForExercise(exerciseId);

                        return (
                            <RoutinesExerciseCard
                                key={exerciseId}
                                dayKey={activePlan.dayKey as DayKey}
                                idx={idx}
                                exercise={ex}
                                movementOptions={movementOptions}
                                attachmentOptions={attachmentOptions}
                                selectedIds={selectedIds}
                                pendingFiles={pendingFiles}
                                onPickFiles={(files) => onPickFilesForExercise(exerciseId, files)}
                                onRemovePending={(fileIndex) => onRemovePendingForExercise(exerciseId, fileIndex)}
                                busy={busy}
                                isThisUploading={isThisUploading}
                                t={t}
                                lang={lang}
                                ph={ph}
                                onRemove={() => onRemoveExercise(activePlan.dayKey as DayKey, idx)}
                                onChangeMovement={({ movementId, movementName }) => {
                                    onUpdateExercise(activePlan.dayKey as DayKey, idx, {
                                        movementId,
                                        movementName,
                                        name: movementName ?? ex.name,
                                    });
                                }}
                                onChangeName={(next) => onUpdateExercise(activePlan.dayKey as DayKey, idx, { name: next })}
                                onChangeNotes={(next) =>
                                    onUpdateExercise(activePlan.dayKey as DayKey, idx, { notes: next || undefined })
                                }
                                onChangeSets={(next) =>
                                    onUpdateExercise(activePlan.dayKey as DayKey, idx, { sets: next || undefined })
                                }
                                onChangeReps={(next) =>
                                    onUpdateExercise(activePlan.dayKey as DayKey, idx, { reps: next || undefined })
                                }
                                onChangeRpe={(next) =>
                                    onUpdateExercise(activePlan.dayKey as DayKey, idx, { rpe: next || undefined })
                                }
                                onChangeLoad={(next) =>
                                    onUpdateExercise(activePlan.dayKey as DayKey, idx, { load: next || undefined })
                                }
                                onToggleAttachment={(publicId) => {
                                    const curr = new Set(selectedIds);
                                    if (curr.has(publicId)) curr.delete(publicId);
                                    else curr.add(publicId);

                                    onUpdateExercise(activePlan.dayKey as DayKey, idx, {
                                        attachmentPublicIds: Array.from(curr),
                                    });
                                }}
                            />
                        );
                    })}

                    {exercises.length === 0 ? (
                        <div className="text-xs text-muted-foreground">
                            {lang === "es" ? "Agrega tu primer ejercicio para este día." : "Add your first exercise for this day."}
                        </div>
                    ) : null}
                </div>
            </div>

            {showStickyAdd ? (
                <div
                    className="
                        fixed inset-x-0 z-40 md:z-50
                        border-t md:border rounded-none md:rounded-xl
                        bg-card/95
                        backdrop-blur supports-backdrop-filter:bg-card/70
                        md:backdrop-blur-none md:bg-card
                        pointer-events-none
                        bottom-[calc(env(safe-area-inset-bottom)+55px)]
                        sm:bottom-[calc(env(safe-area-inset-bottom)+0px)]
                    "
                    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                >
                    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2">
                        <div
                            className="
                                pointer-events-auto
                                flex items-center gap-2
                                justify-stretch
                                sm:justify-start
                                md:justify-between pb-2 md:pb-0
                            "
                        >
                            <Button
                                variant="outline"
                                className="h-9 px-3 w-full sm:w-auto shadow-sm"
                                onClick={() => onAddExercise(activePlan.dayKey as DayKey)}
                                disabled={busy}
                            >
                                {t("routines.addExercise")}
                            </Button>

                            <div className="hidden md:block w-full" />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
