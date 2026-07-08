// src/components/routines/ExerciseAttachmentPicker.tsx
// MUI attachment picker for routine exercise media.

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { MediaViewerModal, type MediaLikeItem } from "@/components/media/MediaViewerModal";

export type AttachmentOption = {
    publicId: string;
    label: string;
    url?: string;
    resourceType?: string;
    originalName?: string;
};

type Props = {
    title: string;
    hint?: string;
    emptyText: string;
    uploadAndAttachLabel: string;
    attachmentOptions: AttachmentOption[];
    selectedIds: string[];
    pendingFiles: File[];
    disabled?: boolean;
    busy?: boolean;
    onToggle: (publicId: string) => void;
    onPickFiles: (files: File[]) => void;
    onRemovePending: (index?: number) => void;
};

type PreviewItem = {
    key: string;
    url: string;
    name: string;
    kind: "image" | "video" | "file";
};

function fileKind(file: File): "image" | "video" | "file" {
    if (file.type?.startsWith("image/")) return "image";
    if (file.type?.startsWith("video/")) return "video";
    return "file";
}

function fileKey(file: File): string {
    return `${file.name}__${file.size}__${file.lastModified}__${file.type}`;
}

function isImageUrl(url: string): boolean {
    return /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(url);
}

function isVideoUrl(url: string): boolean {
    return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(url);
}

function inferResourceType(opt: AttachmentOption): "image" | "video" | "other" {
    if (opt.resourceType === "image" || opt.resourceType === "video") return opt.resourceType;
    const url = opt.url ?? "";
    if (isImageUrl(url)) return "image";
    if (isVideoUrl(url)) return "video";
    return "other";
}

export function ExerciseAttachmentPicker({
    title,
    hint,
    emptyText,
    uploadAndAttachLabel,
    attachmentOptions,
    selectedIds,
    pendingFiles,
    disabled,
    busy,
    onToggle,
    onPickFiles,
    onRemovePending,
}: Props) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const linked = React.useMemo(() => {
        const map = new Map<string, AttachmentOption>();
        for (const option of attachmentOptions) map.set(option.publicId, option);

        return (selectedIds ?? [])
            .filter(Boolean)
            .map((id) => {
                const option = map.get(id);
                return {
                    publicId: id,
                    label: option?.label ?? id,
                    url: option?.url ?? "",
                    resourceType: option?.resourceType,
                    originalName: option?.originalName ?? null,
                };
            });
    }, [attachmentOptions, selectedIds]);

    const [selected, setSelected] = React.useState<MediaLikeItem | null>(null);
    const urlMapRef = React.useRef<Map<string, string>>(new Map());
    const [previews, setPreviews] = React.useState<PreviewItem[]>([]);

    React.useEffect(() => {
        const map = urlMapRef.current;
        const nextKeys = new Set((pendingFiles ?? []).map(fileKey));

        for (const [key, url] of map.entries()) {
            if (!nextKeys.has(key)) {
                URL.revokeObjectURL(url);
                map.delete(key);
            }
        }

        const nextPreviews: PreviewItem[] = (pendingFiles ?? []).map((file) => {
            const key = fileKey(file);
            let url = map.get(key);
            if (!url) {
                url = URL.createObjectURL(file);
                map.set(key, url);
            }
            return { key, url, name: file.name, kind: fileKind(file) };
        });

        setPreviews(nextPreviews);
    }, [pendingFiles]);

    React.useEffect(() => {
        return () => {
            const map = urlMapRef.current;
            for (const url of map.values()) URL.revokeObjectURL(url);
            map.clear();
        };
    }, []);

    function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const list = event.target.files;
        if (!list || list.length === 0) return;
        const files = Array.from(list);
        event.currentTarget.value = "";
        onPickFiles(files);
    }

    function openLinkedInModal(opt: {
        publicId: string;
        url: string;
        resourceType?: string;
        originalName?: string | null;
        label: string;
    }) {
        const url = opt.url ?? "";
        if (!url) return;

        const rt = inferResourceType({
            publicId: opt.publicId,
            label: opt.label,
            url,
            resourceType: opt.resourceType,
            originalName: opt.originalName ?? undefined,
        });

        const resourceType: "image" | "video" | null = rt === "image" || rt === "video" ? rt : null;

        setSelected({
            url,
            publicId: opt.publicId,
            resourceType,
            format: null,
            createdAt: null,
            date: null,
            sessionType: "Routine Attachment",
            source: "routine",
            meta: null,
            originalName: opt.originalName ?? opt.label ?? null,
        });
    }

    return (
        <Box sx={{ display: "grid", gap: 1.25, minWidth: 0 }}>
            <input ref={inputRef} type="file" hidden multiple accept="image/*,video/*" onChange={onInputChange} />

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                    {title}
                </Typography>
                <Button type="button" size="small" variant="outlined" onClick={() => inputRef.current?.click()} disabled={disabled || busy}>
                    {busy ? "…" : uploadAndAttachLabel}
                </Button>
            </Box>

            {previews.length > 0 ? (
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, display: "grid", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>Pendiente</Typography>
                        <Button type="button" variant="outlined" size="small" onClick={() => onRemovePending()} disabled={disabled}>
                            Quitar todo
                        </Button>
                    </Box>

                    {previews.map((preview, index) => (
                        <Box key={preview.key} sx={{ display: "grid", gridTemplateColumns: "64px minmax(0, 1fr) auto", gap: 1.25, alignItems: "center" }}>
                            {preview.kind === "video" ? (
                                <Box component="video" src={preview.url} muted playsInline preload="metadata" controls sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 2, border: 1, borderColor: "divider" }} />
                            ) : preview.kind === "image" ? (
                                <Box component="img" src={preview.url} alt={preview.name} sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 2, border: 1, borderColor: "divider" }} />
                            ) : (
                                <Box sx={{ width: 64, height: 64, borderRadius: 2, border: 1, borderColor: "divider", display: "grid", placeItems: "center" }}>
                                    <Typography variant="caption" color="text.secondary">Archivo</Typography>
                                </Box>
                            )}
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", wordBreak: "break-word" }}>{preview.name}</Typography>
                                <Typography variant="caption" color="text.secondary">Se subirá al guardar.</Typography>
                            </Box>
                            <Button type="button" variant="outlined" color="error" size="small" onClick={() => onRemovePending(index)} disabled={disabled}>
                                Quitar
                            </Button>
                        </Box>
                    ))}
                </Box>
            ) : null}

            <Box sx={{ display: "grid", gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Enlazados</Typography>

                {linked.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">{emptyText}</Typography>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 1 }}>
                        {linked.map((opt) => {
                            const url = opt.url ?? "";
                            const rt = inferResourceType({ publicId: opt.publicId, label: opt.label, url, resourceType: opt.resourceType, originalName: opt.originalName ?? undefined });

                            return (
                                <Box key={opt.publicId} sx={{ position: "relative", border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.default" }}>
                                    <Box component="button" type="button" onClick={() => openLinkedInModal(opt)} disabled={disabled} title={opt.label} sx={{ width: "100%", border: 0, p: 0, bgcolor: "transparent", cursor: "pointer" }}>
                                        <Box sx={{ aspectRatio: "1 / 1", display: "grid", placeItems: "center", bgcolor: "action.hover" }}>
                                            {!url ? (
                                                <Typography variant="caption" color="text.secondary">Sin URL</Typography>
                                            ) : rt === "image" ? (
                                                <Box component="img" src={url} alt={opt.label} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : rt === "video" ? (
                                                <Box component="video" src={url} muted playsInline sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "underline" }}>Abrir</Typography>
                                            )}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", p: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.label}</Typography>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        aria-label="Quitar"
                                        title="Quitar"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            onToggle(opt.publicId);
                                        }}
                                        disabled={disabled}
                                        sx={{ position: "absolute", top: 4, right: 4, bgcolor: "background.paper", boxShadow: 1, "&:hover": { bgcolor: "background.paper" } }}
                                    >
                                        <CloseIcon fontSize="inherit" />
                                    </IconButton>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>

            {hint ? <Typography variant="caption" color="text.secondary">{hint}</Typography> : null}
            {selected ? <MediaViewerModal item={selected} onClose={() => setSelected(null)} /> : null}
        </Box>
    );
}
