import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { DayKey, ExerciseItem } from "@/utils/routines/plan";
import type { AttachmentOption } from "@/utils/routines/attachments";
import { GymCheckExerciseMediaStrip } from "@/components/gymCheck/GymCheckExerciseMediaStrip";

function formatNullable(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

type Props = {
    lang: "es" | "en";
    busy: boolean;

    dayKey: DayKey;

    exercise: ExerciseItem;
    index: number;
    exerciseId: string;

    isDone: boolean;
    uploading: boolean;

    mediaPublicIds: string[];
    attachmentByPublicId: Map<string, AttachmentOption>;

    onToggleDone: () => void;
    onUploadFiles: (files: File[]) => void;

    onOpenViewer: (opt: AttachmentOption) => void;
    onRemoveMediaAt: (index: number) => void;
};

export function GymCheckExerciseCard(props: Props) {
    const {
        lang,
        busy,
        dayKey,
        exercise,
        index,
        exerciseId,
        isDone,
        uploading,
        mediaPublicIds,
        attachmentByPublicId,
        onToggleDone,
        onUploadFiles,
        onOpenViewer,
        onRemoveMediaAt,
    } = props;

    const inputId = `gymcheck-file-${dayKey}-${exerciseId}`;

    return (
        <Card className={isDone ? "opacity-95 w-full min-w-0" : "w-full min-w-0"}>
            <CardHeader className="pb-3 min-w-0">
                <div className="min-w-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <CardTitle className="text-base min-w-0 wrap-break-words">
                            {lang === "es" ? `Ejercicio #${index + 1}` : `Exercise #${index + 1}`}{" "}
                            <span className="text-muted-foreground">•</span>{" "}
                            <span className="font-semibold wrap-break-words">{formatNullable((exercise as any).name)}</span>
                        </CardTitle>

                        <CardDescription className="text-xs min-w-0 wrap-break-words">
                            {(exercise as any).notes
                                ? formatNullable((exercise as any).notes)
                                : lang === "es"
                                    ? "Sin notas"
                                    : "No notes"}
                        </CardDescription>
                    </div>

                    <div className="w-full sm:w-auto min-w-0 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-start sm:justify-end gap-2 sm:gap-3">
                        <div className="min-w-0">
                            <label className="text-sm flex items-center gap-2 select-none">
                                <input type="checkbox" checked={isDone} onChange={onToggleDone} disabled={busy} />
                                {lang === "es" ? "Hecho" : "Done"}
                            </label>

                            <input
                                id={inputId}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    e.target.value = "";
                                    onUploadFiles(files);
                                }}
                                disabled={busy}
                            />
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => document.getElementById(inputId)?.click()}
                            disabled={busy || uploading}
                            className="w-full sm:w-auto whitespace-nowrap"
                        >
                            {lang === "es" ? "Subir media" : "Upload media"}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="min-w-0 space-y-3">
                <div className="min-w-0 grid text-sm gap-3 grid-cols-1 md:grid-cols-2">
                    <div className="min-w-0 flex flex-col gap-2 justify-center mb-2 md:mb-0">
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold shrink-0">
                                {lang === "es" ? "Series" : "Sets"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{formatNullable((exercise as any).sets)}</span>
                        </div>
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold shrink-0">Reps</span>
                            <span className="min-w-0 wrap-break-words text-right">{formatNullable((exercise as any).reps)}</span>
                        </div>
                        <div className="min-w-0 flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold shrink-0">
                                {lang === "es" ? "Carga" : "Load"}
                            </span>
                            <span className="min-w-0 wrap-break-words text-right">{formatNullable((exercise as any).load)}</span>
                        </div>
                    </div>

                    <GymCheckExerciseMediaStrip
                        lang={lang}
                        mediaPublicIds={mediaPublicIds}
                        attachmentByPublicId={attachmentByPublicId}
                        onOpenViewer={onOpenViewer}
                        onRemoveAt={onRemoveMediaAt}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
