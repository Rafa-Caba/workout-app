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
            <div className="text-xs text-muted-foreground font-bold italic wrap-break-words">
                {lang === "es"
                    ? "Sin media aún. Puedes subir foto/video si quieres."
                    : "No media yet. You can upload a photo/video if you want."}
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-2">
            <div className="text-xs font-extrabold text-muted-foreground">
                {lang === "es" ? "Media (subida en gym)" : "Gym media"}
            </div>

            <div className="min-w-0 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {mediaPublicIds.map((pid, i) => {
                    const opt = attachmentByPublicId.get(pid) ?? null;
                    const thumbUrl = typeof opt?.url === "string" ? opt.url : null;

                    return (
                        <div key={`${pid}-${i}`} className="relative shrink-0">
                            <button
                                type="button"
                                className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden border bg-background grid place-items-center hover:bg-muted/60 transition"
                                onClick={() => {
                                    if (!opt) return;
                                    onOpenViewer(opt);
                                }}
                                title={pid}
                            >
                                {thumbUrl ? (
                                    <img src={thumbUrl} alt={pid} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="px-1 text-[11px] text-muted-foreground">media</span>
                                )}
                            </button>

                            <button
                                type="button"
                                className="absolute -top-2 -right-2 h-7 w-7 sm:h-6 sm:w-6 rounded-full border bg-background text-xs hover:bg-muted/60 flex items-center justify-center"
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
