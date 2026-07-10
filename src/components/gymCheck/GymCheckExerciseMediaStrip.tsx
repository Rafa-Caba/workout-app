// src/components/gymCheck/GymCheckExerciseMediaStrip.tsx
// MUI media preview strip for Gym Check exercise attachments.
// Uses thumbnails when URL data is available and keeps remove/open actions compact.

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { AttachmentOption } from "@/utils/routines/attachments";

type Props = {
    lang: "es" | "en";
    mediaPublicIds: string[];
    attachmentByPublicId: Map<string, AttachmentOption>;
    onOpenViewer: (opt: AttachmentOption) => void;
    onRemoveAt: (index: number) => void;
};

function isLikelyImage(option: AttachmentOption): boolean {
    if (option.resourceType === "image") return true;
    return /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(option.url ?? "");
}

function isLikelyVideo(option: AttachmentOption): boolean {
    if (option.resourceType === "video") return true;
    return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(option.url ?? "");
}

function getShortLabel(option: AttachmentOption): string {
    const label = option.originalName?.trim() || option.label.trim() || option.publicId;
    if (label.length <= 22) return label;
    return `${label.slice(0, 10)}…${label.slice(-8)}`;
}

export function GymCheckExerciseMediaStrip({ lang, mediaPublicIds, attachmentByPublicId, onOpenViewer, onRemoveAt }: Props) {
    const seen = new Set<string>();
    const items = mediaPublicIds
        .map((publicId, index) => ({ publicId, index, option: attachmentByPublicId.get(publicId) ?? null }))
        .filter((item): item is { publicId: string; index: number; option: AttachmentOption } => Boolean(item.option))
        .filter((item) => {
            if (seen.has(item.publicId)) return false;
            seen.add(item.publicId);
            return true;
        });

    if (items.length === 0) {
        return (
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5, bgcolor: "background.default" }}>
                <Typography variant="body2" color="text.secondary">
                    {lang === "es" ? "Sin media agregada." : "No media added."}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, minWidth: 0 }}>
            {items.map((item) => {
                const isImage = isLikelyImage(item.option);
                const isVideo = isLikelyVideo(item.option);
                const label = getShortLabel(item.option);

                return (
                    <Box
                        key={`${item.publicId}-${item.index}`}
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "56px minmax(0, 1fr)",
                            alignItems: "center",
                            gap: 0.9,
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                            p: 0.75,
                            width: { xs: "100%", sm: 260 },
                            maxWidth: "100%",
                            bgcolor: "background.default",
                        }}
                    >
                        <ButtonBase
                            onClick={() => onOpenViewer(item.option)}
                            title={item.option.publicId}
                            sx={(theme) => ({
                                width: 56,
                                height: 56,
                                borderRadius: 1.5,
                                overflow: "hidden",
                                border: 1,
                                borderColor: "divider",
                                bgcolor: "background.paper",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                                "&:focus-visible": {
                                    outline: `2px solid ${theme.palette.primary.main}`,
                                    outlineOffset: 2,
                                },
                            })}
                        >
                            {item.option.url && isImage ? (
                                <Box
                                    component="img"
                                    src={item.option.url}
                                    alt={label}
                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : item.option.url && isVideo ? (
                                <Box
                                    component="video"
                                    src={item.option.url}
                                    muted
                                    playsInline
                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <Typography variant="caption" color="primary" sx={{ fontWeight: 900 }}>
                                    {isVideo ? "▶" : "IMG"}
                                </Typography>
                            )}
                        </ButtonBase>

                        <Box sx={{ minWidth: 0 }}>
                            <Chip
                                size="small"
                                label={label}
                                onClick={() => onOpenViewer(item.option)}
                                sx={{ maxWidth: "100%", mb: 0.5 }}
                            />
                            <Box>
                                <Button size="small" variant="text" color="error" onClick={() => onRemoveAt(item.index)} sx={{ minHeight: 28, px: 0.75 }}>
                                    {lang === "es" ? "Quitar" : "Remove"}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}
