import React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import type { MediaResourceType } from "@/types/media.types";
import type { MediaLikeItem } from "@/components/media/MediaViewerModal";

function isImageUrl(url: string): boolean {
    return /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(url);
}
function isVideoUrl(url: string): boolean {
    return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(url);
}

function inferType(item: MediaLikeItem): MediaResourceType | "other" {
    const url = item.url || "";
    if (item.resourceType === "image" || item.resourceType === "video") return item.resourceType;
    if (isImageUrl(url)) return "image";
    if (isVideoUrl(url)) return "video";
    return "other";
}

type Props = {
    item: MediaLikeItem;
    onOpen: (item: MediaLikeItem) => void;
};

export function MediaCard({ item, onOpen }: Props) {
    const { t } = useI18n();
    const url = item.url;
    const type = inferType(item);

    const isImage = type === "image";
    const isVideo = type === "video";

    // const title = item.originalName?.trim() || item.publicId ?? t("media.itemFallback");
    const title =
        item.originalName?.trim() ||
        item.publicId ||
        t("media.itemFallback");

    return (
        <button
            type="button"
            onClick={() => onOpen(item)}
            className="text-left rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
            title={item.publicId ?? undefined}
        >
            {/* Preview stays consistent */}
            <div className="aspect-video bg-background flex items-center justify-center shrink-0">
                {!url ? (
                    <span className="text-xs text-muted-foreground">{t("media.noUrl")}</span>
                ) : isImage ? (
                    <img src={url} alt={title} className="h-full w-full object-cover" />
                ) : isVideo ? (
                    <video src={url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                    <span className="text-sm underline">{t("media.open")}</span>
                )}
            </div>

            {/* Content area: force consistent height via clamping */}
            <div className="p-3 space-y-1 flex-1 min-h-[15]">
                <div className="text-sm font-medium line-clamp-2" title={title}>
                    {title}
                </div>

                <div className="text-xs text-muted-foreground flex flex-wrap gap-2 line-clamp-2">
                    {/* <span className="font-mono">{type}</span> */}
                    {/* {item.format ? <span className="font-mono">{item.format}</span> : null} */}
                    {/* {item.date ? <span className="font-mono">{item.date}</span> : null} */}
                    {/* {item.sessionType ? <span className="font-mono">{item.sessionType}</span> : null} */}
                    {item.source ? <span className="font-mono">src:{item.source}</span> : null}
                </div>
            </div>
        </button>
    );
}
