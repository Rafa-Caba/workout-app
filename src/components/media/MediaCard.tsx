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

// pequeño helper para clases
function cx(...parts: Array<string | undefined | null | false>) {
    return parts.filter(Boolean).join(" ");
}

type Props = {
    item: MediaLikeItem;
    onOpen: (item: MediaLikeItem) => void;
    /** When false, hides the meta row (type, format, date, sessionType, source). Defaults to true. */
    showMetaInfo?: boolean;
    /** When false, hides the title under the preview. Defaults to true. */
    showTitle?: boolean;
    /** Extra classes for the outer button */
    className?: string;
};

export function MediaCard({
    item,
    onOpen,
    showMetaInfo = true,
    showTitle = true,
    className,
}: Props) {
    const { t } = useI18n();
    const url = item.url;
    const type = inferType(item);

    const isImage = type === "image";
    const isVideo = type === "video";

    const title =
        item.originalName?.trim() ||
        item.publicId ||
        t("media.itemFallback");

    return (
        <button
            type="button"
            onClick={() => onOpen(item)}
            className={cx(
                "w-full min-w-0 text-left rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            title={item.publicId ?? undefined}
        >
            {/* Preview */}
            <div className="aspect-video w-full min-w-0 bg-background flex items-center justify-center shrink-0 overflow-hidden">
                {!url ? (
                    <span className="px-3 text-xs text-muted-foreground">{t("media.noUrl")}</span>
                ) : isImage ? (
                    <img src={url} alt={title} className="h-full w-full object-cover" />
                ) : isVideo ? (
                    <video src={url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                    <span className="px-3 text-sm underline">{t("media.open")}</span>
                )}
            </div>

            {/* Content area */}
            <div className="min-w-0 flex-1 space-y-1 p-3 sm:p-4">
                {showTitle ? (
                    <div className="min-w-0 text-sm font-medium leading-snug wrap-break-words line-clamp-2" title={title}>
                        {title}
                    </div>
                ) : null}

                {showMetaInfo ? (
                    <div className="min-w-0 text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 wrap-break-words">
                        <span className="font-mono">{type}</span>
                        {item.format ? <span className="font-mono">{item.format}</span> : null}
                        {item.date ? <span className="font-mono">{item.date}</span> : null}
                        {item.sessionType ? (
                            <span className="font-mono">{item.sessionType}</span>
                        ) : null}
                        {item.source ? (
                            <span className="font-mono break-all">src:{item.source}</span>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </button>
    );
}
