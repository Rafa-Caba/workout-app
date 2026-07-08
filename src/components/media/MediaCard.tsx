// src/components/media/MediaCard.tsx
// MUI media card used by Media, Movements and session previews.

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

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
    showMetaInfo?: boolean;
    showTitle?: boolean;
};

export function MediaCard({
    item,
    onOpen,
    showMetaInfo = true,
    showTitle = true,
}: Props) {
    const { t } = useI18n();
    const url = item.url;
    const type = inferType(item);
    const isImage = type === "image";
    const isVideo = type === "video";

    const title = item.originalName?.trim() || item.publicId || t("media.itemFallback");
    const showFooter = showTitle || showMetaInfo;

    return (
        <ButtonBase
            onClick={() => onOpen(item)}
            title={item.publicId ?? undefined}
            sx={(theme) => ({
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                textAlign: "left",
                overflow: "hidden",
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
                "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: theme.shadows[3],
                    transform: "translateY(-1px)",
                },
                "&:focus-visible": {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                },
            })}
        >
            <Box
                sx={{
                    aspectRatio: "16 / 9",
                    width: "100%",
                    minWidth: 0,
                    bgcolor: "background.default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                }}
            >
                {!url ? (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>
                        {t("media.noUrl")}
                    </Typography>
                ) : isImage ? (
                    <Box
                        component="img"
                        src={url}
                        alt={title}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : isVideo ? (
                    <Box
                        component="video"
                        src={url}
                        muted
                        playsInline
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <Typography variant="body2" color="primary" sx={{ px: 1.5, fontWeight: 700 }}>
                        {t("media.open")}
                    </Typography>
                )}
            </Box>

            {showFooter ? (
                <Box sx={{ minWidth: 0, flex: 1, p: { xs: 1.25, md: 1.5 } }}>
                    {showTitle ? (
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 750,
                                lineHeight: 1.25,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                overflowWrap: "anywhere",
                            }}
                        >
                            {title}
                        </Typography>
                    ) : null}

                    {showMetaInfo ? (
                        <Box
                            sx={{
                                mt: showTitle ? 1 : 0,
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                                minWidth: 0,
                            }}
                        >
                            <Chip label={type} size="small" />
                            {item.format ? <Chip label={item.format} size="small" /> : null}
                            {item.date ? <Chip label={item.date} size="small" /> : null}
                            {item.sessionType ? <Chip label={item.sessionType} size="small" /> : null}
                            {item.source ? <Chip label={`src:${item.source}`} size="small" /> : null}
                        </Box>
                    ) : null}
                </Box>
            ) : null}
        </ButtonBase>
    );
}
