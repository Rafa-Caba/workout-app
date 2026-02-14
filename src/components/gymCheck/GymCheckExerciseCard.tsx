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
        <Card className={isDone ? "opacity-95" : ""}>
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <CardTitle className="text-base">
                            {lang === "es" ? `Ejercicio #${index + 1}` : `Exercise #${index + 1}`}{" "}
                            <span className="text-muted-foreground">•</span>{" "}
                            <span className="font-semibold">{formatNullable((exercise as any).name)}</span>
                        </CardTitle>

                        <CardDescription className="text-xs">
                            {(exercise as any).notes
                                ? formatNullable((exercise as any).notes)
                                : lang === "es"
                                    ? "Sin notas"
                                    : "No notes"}
                        </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                        <div>
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
                            className="whitespace-nowrap"
                        >
                            {lang === "es" ? "Subir media" : "Upload media"}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="grid text-sm gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-2 justify-center mb-2 md:mb-0">
                        <div className="flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold">{lang === "es" ? "Series" : "Sets"}</span>
                            <span>{formatNullable((exercise as any).sets)}</span>
                        </div>
                        <div className="flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold">Reps</span>
                            <span>{formatNullable((exercise as any).reps)}</span>
                        </div>
                        <div className="flex justify-between gap-3 md:mr-5">
                            <span className="text-muted-foreground font-extrabold">{lang === "es" ? "Carga" : "Load"}</span>
                            <span>{formatNullable((exercise as any).load)}</span>
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
