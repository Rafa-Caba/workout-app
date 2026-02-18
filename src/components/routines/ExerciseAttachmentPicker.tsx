import React from "react";
import { Button } from "@/components/ui/button";
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

    // IMPORTANT: keep this as "toggle" (we'll call it ONLY from explicit remove button)
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
    const u = opt.url ?? "";
    if (isImageUrl(u)) return "image";
    if (isVideoUrl(u)) return "video";
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

    // Map selectedIds -> full objects (label/url/type)
    const linked = React.useMemo(() => {
        const map = new Map<string, AttachmentOption>();
        for (const o of attachmentOptions) map.set(o.publicId, o);

        return (selectedIds ?? [])
            .filter(Boolean)
            .map((id) => {
                const opt = map.get(id);
                return {
                    publicId: id,
                    label: opt?.label ?? id,
                    url: opt?.url ?? "",
                    resourceType: opt?.resourceType,
                    originalName: opt?.originalName ?? null,
                };
            });
    }, [attachmentOptions, selectedIds]);

    // Modal
    const [selected, setSelected] = React.useState<MediaLikeItem | null>(null);

    // Pending previews
    const urlMapRef = React.useRef<Map<string, string>>(new Map());
    const [previews, setPreviews] = React.useState<PreviewItem[]>([]);

    React.useEffect(() => {
        const map = urlMapRef.current;
        const nextKeys = new Set((pendingFiles ?? []).map(fileKey));

        for (const [k, url] of map.entries()) {
            if (!nextKeys.has(k)) {
                URL.revokeObjectURL(url);
                map.delete(k);
            }
        }

        const nextPreviews: PreviewItem[] = (pendingFiles ?? []).map((f) => {
            const k = fileKey(f);
            let url = map.get(k);
            if (!url) {
                url = URL.createObjectURL(f);
                map.set(k, url);
            }
            return { key: k, url, name: f.name, kind: fileKind(f) };
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

    function openPicker() {
        inputRef.current?.click();
    }

    function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const list = e.target.files;
        if (!list || list.length === 0) return;

        const files = Array.from(list);
        e.currentTarget.value = "";
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

        const item: MediaLikeItem = {
            url,
            publicId: opt.publicId,
            resourceType: rt === "other" ? null : (rt as any),
            format: null,
            createdAt: null,
            date: null,
            sessionType: "Routine Attachment",
            source: "routine",
            meta: null,
            originalName: opt.originalName ?? opt.label ?? null,
        };

        setSelected(item);
    }

    return (
        <div className="space-y-2">
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={onInputChange}
            />

            <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium">{title}</label>

                <Button
                    type="button"
                    variant="outline"
                    className="h-8"
                    onClick={openPicker}
                    disabled={disabled || busy}
                    title={uploadAndAttachLabel}
                >
                    {busy ? "…" : uploadAndAttachLabel}
                </Button>
            </div>

            {/* Pending uploads (keep your current behavior) */}
            {previews.length > 0 ? (
                <div className="rounded-md border bg-background p-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium">Pendiente</div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => onRemovePending()}
                            disabled={disabled}
                        >
                            Quitar todo
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {previews.map((p, i) => (
                            <div key={p.key} className="flex items-center gap-3">
                                {p.kind === "video" ? (
                                    <video
                                        src={p.url}
                                        className="h-16 w-16 rounded-md border object-cover"
                                        muted
                                        playsInline
                                        preload="metadata"
                                        controls
                                    />
                                ) : p.kind === "image" ? (
                                    <img src={p.url} alt={p.name} className="h-16 w-16 rounded-md border object-cover" />
                                ) : (
                                    <div className="h-16 w-16 rounded-md border flex items-center justify-center text-xs text-muted-foreground">
                                        Archivo
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-muted-foreground break-all">{p.name}</div>
                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                        Se subirá y se enlazará cuando presiones <span className="font-medium">Guardar</span>.
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={() => onRemovePending(i)}
                                    disabled={disabled}
                                >
                                    Quitar
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Linked attachments */}
            <div className="space-y-1">
                <div className="text-xs font-medium">Enlazados</div>

                {linked.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{emptyText}</div>
                ) : (
                    <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
                        {linked.map((opt) => {
                            const url = opt.url ?? "";
                            const rt = inferResourceType({
                                publicId: opt.publicId,
                                label: opt.label,
                                url,
                                resourceType: opt.resourceType,
                                originalName: opt.originalName ?? undefined,
                            });

                            return (
                                <div key={opt.publicId} className="relative group">
                                    <button
                                        type="button"
                                        className="w-full rounded-md border bg-background overflow-hidden hover:shadow-sm transition-shadow"
                                        onClick={() => openLinkedInModal(opt)}
                                        disabled={disabled}
                                        title={opt.label}
                                    >
                                        <div className="aspect-square bg-black/5 flex items-center justify-center">
                                            {!url ? (
                                                <span className="text-[11px] text-muted-foreground px-2 text-center">Sin URL</span>
                                            ) : rt === "image" ? (
                                                <img src={url} alt={opt.label} className="h-full w-full object-cover" />
                                            ) : rt === "video" ? (
                                                <video src={url} className="h-full w-full object-cover" muted playsInline />
                                            ) : (
                                                <span className="text-[11px] underline text-muted-foreground px-2 text-center">Abrir</span>
                                            )}
                                        </div>

                                        <div className="px-2 py-1 text-[11px] text-muted-foreground truncate">
                                            {opt.label}
                                        </div>
                                    </button>

                                    {/* Explicit remove (ONLY this calls onToggle) */}
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 border shadow-sm text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onToggle(opt.publicId);
                                        }}
                                        disabled={disabled}
                                        title="Quitar"
                                        aria-label="Quitar"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

            {selected ? <MediaViewerModal item={selected} onClose={() => setSelected(null)} /> : null}
        </div>
    );
}
