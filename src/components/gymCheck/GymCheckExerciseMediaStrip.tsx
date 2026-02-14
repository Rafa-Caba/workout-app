import * as React from "react";
import type { AttachmentOption } from "@/utils/routines/attachments";

type Props = {
    lang: "es" | "en";
    mediaPublicIds: string[];
    attachmentByPublicId: Map<string, AttachmentOption>;
    onOpenViewer: (opt: AttachmentOption) => void;
    onRemoveAt: (index: number) => void;
};

export function GymCheckExerciseMediaStrip(props: Props) {
    const { lang, mediaPublicIds, attachmentByPublicId, onOpenViewer, onRemoveAt } = props;

    if (!Array.isArray(mediaPublicIds) || mediaPublicIds.length === 0) {
        return (
            <div className="text-xs text-muted-foreground font-bold italic">
                {lang === "es" ? "Sin media aún. Puedes subir foto/video si quieres." : "No media yet. You can upload a photo/video if you want."}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="text-xs font-extrabold text-muted-foreground">
                {lang === "es" ? "Media (subida en gym)" : "Gym media"}
            </div>

            <div className="flex flex-wrap gap-2">
                {mediaPublicIds.map((pid, i) => {
                    const opt = attachmentByPublicId.get(pid) ?? null;
                    const thumbUrl = typeof opt?.url === "string" ? opt.url : null;

                    return (
                        <div key={`${pid}-${i}`} className="relative">
                            <button
                                type="button"
                                className="h-20 w-20 rounded-lg overflow-hidden border bg-background grid place-items-center hover:bg-muted/60 transition"
                                onClick={() => {
                                    if (!opt) return;
                                    onOpenViewer(opt);
                                }}
                                title={pid}
                            >
                                {thumbUrl ? (
                                    <img src={thumbUrl} alt={pid} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">media</span>
                                )}
                            </button>

                            <button
                                type="button"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full border bg-background text-xs hover:bg-muted/60"
                                onClick={() => onRemoveAt(i)}
                                title={lang === "es" ? "Quitar" : "Remove"}
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
