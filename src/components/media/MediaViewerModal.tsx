import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JsonDetails } from "@/components/JsonDetails";
import { useI18n } from "@/i18n/I18nProvider";
import type { MediaResourceType } from "@/types/media.types";

export type MediaLikeItem = {
    url: string;
    publicId?: string | null;
    resourceType?: MediaResourceType | null;
    format?: string | null;

    createdAt?: string | null;
    date?: string | null;
    sessionType?: string | null;
    source?: string | null;

    meta?: unknown;
    originalName?: string | null;
};

function isImageUrl(url: string): boolean {
    return /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(url);
}

function isVideoUrl(url: string): boolean {
    return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(url);
}

function safeFileNameFromItem(item: MediaLikeItem): string {
    const base = item.publicId?.split("/").pop()?.trim() || "media";
    const extFromFormat = item.format?.trim()?.toLowerCase() || null;

    if (extFromFormat && /^[a-z0-9]+$/.test(extFromFormat)) {
        if (base.toLowerCase().endsWith(`.${extFromFormat}`)) return base;
        return `${base}.${extFromFormat}`;
    }

    const m = item.url.match(/\.([a-z0-9]+)(\?.*)?$/i);
    if (m?.[1]) {
        const ext = m[1].toLowerCase();
        if (base.toLowerCase().endsWith(`.${ext}`)) return base;
        return `${base}.${ext}`;
    }

    return base;
}

async function downloadMedia(url: string, filename: string): Promise<void> {
    try {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.rel = "noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
    } catch {
        // continue
    }

    try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(objectUrl);
    } catch (e) {
        window.open(url, "_blank", "noreferrer");
        throw e;
    }
}

export function MediaViewerModal({
    item,
    onClose,
}: {
    item: MediaLikeItem;
    onClose: () => void;
}) {
    const { t } = useI18n();

    const url = item.url;
    const fileName = item.originalName?.trim() || safeFileNameFromItem(item);

    const inferredType: MediaResourceType | "other" =
        item.resourceType === "image" || item.resourceType === "video"
            ? item.resourceType
            : isImageUrl(url)
                ? "image"
                : isVideoUrl(url)
                    ? "video"
                    : "other";

    async function onDownload() {
        try {
            await downloadMedia(url, fileName);
            toast.success("Descarga iniciada");
        } catch {
            toast.error("No se pudo descargar. Abriendo en una pestaña…");
        }
    }

    return (
        <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="absolute inset-0 bg-black/80" />
            <div className="absolute inset-0 p-4 md:p-8 flex items-center justify-center">
                <div className="w-full max-w-5xl rounded-2xl border bg-background shadow-xl overflow-hidden">
                    <div className="flex items-center flex-col md:flex-row justify-between gap-3 p-4 border-b">
                        <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" title={fileName}>
                                {fileName}
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                                <span className="font-mono">{inferredType}</span>
                                {item.createdAt ? <span className="font-mono">{item.createdAt}</span> : null}
                                {item.date ? <span className="font-mono">{item.date}</span> : null}
                                {item.sessionType ? <span className="font-mono">{item.sessionType}</span> : null}
                                {item.source ? <span className="font-mono">src:{item.source}</span> : null}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" onClick={() => window.open(url, "_blank", "noreferrer")}>
                                {t("media.open")}
                            </Button>
                            <Button onClick={onDownload}>Descargar</Button>
                            <Button variant="outline" onClick={onClose}>
                                ✕
                            </Button>
                        </div>
                    </div>

                    <div className="bg-black/5">
                        <div className="w-full aspect-video flex items-center justify-center">
                            {inferredType === "image" ? (
                                <img src={url} alt={fileName} className="max-h-[75vh] w-auto object-contain" />
                            ) : inferredType === "video" ? (
                                <video src={url} className="max-h-[75vh] w-full object-contain" controls />
                            ) : (
                                <div className="p-8 text-center space-y-3">
                                    <div className="text-sm text-muted-foreground">{t("media.open")}</div>
                                    <a className="underline break-all" href={url} target="_blank" rel="noreferrer">
                                        {url}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t">
                        <JsonDetails title="Meta (JSON)" data={item.meta ?? null} />
                    </div>
                </div>
            </div>
        </div>
    );
}
