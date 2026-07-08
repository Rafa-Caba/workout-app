// src/components/media/MediaViewerModal.tsx
// MUI modal for previewing and downloading media files.

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { toast } from "sonner";

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

    const extensionMatch = item.url.match(/\.([a-z0-9]+)(\?.*)?$/i);
    if (extensionMatch?.[1]) {
        const ext = extensionMatch[1].toLowerCase();
        if (base.toLowerCase().endsWith(`.${ext}`)) return base;
        return `${base}.${ext}`;
    }

    return base;
}

async function downloadMedia(url: string, filename: string): Promise<void> {
    try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = "noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        return;
    } catch {
        // Continue with fetch fallback.
    }

    try {
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(objectUrl);
    } catch (error) {
        window.open(url, "_blank", "noreferrer");
        throw error;
    }
}

export function MediaViewerModal({ item, onClose }: { item: MediaLikeItem; onClose: () => void }) {
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
        <Dialog
            open
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                    },
                },
            }}
        >
            <DialogTitle
                component="div"
                sx={{
                    p: 0,
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        px: { xs: 2, md: 2.5 },
                        py: 1.5,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            component="h2"
                            sx={{ fontWeight: 800, overflowWrap: "anywhere" }}
                        >
                            {fileName}
                        </Typography>
                        <Box sx={{ mt: 0.75, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            <Chip label={inferredType} size="small" />
                            {item.createdAt ? <Chip label={item.createdAt} size="small" /> : null}
                            {item.date ? <Chip label={item.date} size="small" /> : null}
                            {item.sessionType ? <Chip label={item.sessionType} size="small" /> : null}
                            {item.source ? <Chip label={`src:${item.source}`} size="small" /> : null}
                        </Box>
                    </Box>

                    <IconButton aria-label="Cerrar" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent
                sx={{
                    p: 0,
                    bgcolor: "background.default",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                }}
            >
                <Box sx={{ bgcolor: "black", display: "grid", placeItems: "center" }}>
                    {inferredType === "image" ? (
                        <Box
                            component="img"
                            src={url}
                            alt={fileName}
                            sx={{
                                maxWidth: "100%",
                                maxHeight: { xs: "62vh", md: "72vh" },
                                objectFit: "contain",
                            }}
                        />
                    ) : inferredType === "video" ? (
                        <Box
                            component="video"
                            src={url}
                            controls
                            playsInline
                            sx={{
                                width: "100%",
                                maxHeight: { xs: "62vh", md: "72vh" },
                                bgcolor: "black",
                            }}
                        />
                    ) : (
                        <Box sx={{ p: 5, textAlign: "center" }}>
                            <Button
                                variant="contained"
                                endIcon={<OpenInNewIcon />}
                                onClick={() => window.open(url, "_blank", "noreferrer")}
                            >
                                {t("media.open")}
                            </Button>
                        </Box>
                    )}
                </Box>

                <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                    <JsonDetails title="Metadata" data={item.meta ?? item} defaultOpen={false} />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2, md: 2.5 }, py: 1.5 }}>
                <Button
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(url, "_blank", "noreferrer")}
                >
                    {t("media.open")}
                </Button>
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => void onDownload()}>
                    Descargar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
