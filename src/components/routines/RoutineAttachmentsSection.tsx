import React from "react";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@/utils/routines/attachments";
import type { I18nKey } from "@/i18n/translations";
import type { UploadQuery } from "@/types/uploadQuery";
import { isUploadQuery } from "@/types/uploadQuery";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { MediaCard } from "@/components/media/MediaCard";
import { MediaViewerModal, type MediaLikeItem } from "@/components/media/MediaViewerModal";

type I18nVars = Record<string, string | number>;
type TFn = (key: I18nKey, vars?: I18nVars) => string;

type Props = {
    t: TFn;
    lang: "es" | "en";
    busy: boolean;

    attachments: Attachment[];

    onUpload: (args: { files: File[]; query: UploadQuery }) => Promise<void>;
    onDelete: (args: { publicId: string; deleteCloudinary: boolean }) => Promise<void>;

    showUploadQuery?: boolean;
};

type ParseOk = { ok: true; value: UploadQuery };
type ParseErr = { ok: false; error: string };

function safeParseUploadQuery(input: string): ParseOk | ParseErr {
    try {
        const v: unknown = JSON.parse(input);
        if (!isUploadQuery(v)) {
            return {
                ok: false,
                error: "Query must be a JSON object with primitive values (string/number/boolean/null).",
            };
        }
        return { ok: true, value: v };
    } catch (e) {
        return { ok: false, error: (e as Error).message };
    }
}

function toMediaLikeItem(a: Attachment, idx: number): MediaLikeItem {
    const publicId = a.publicId ?? `attachment-${idx}`;
    const url = a.url ?? "";

    return {
        url,
        publicId,
        resourceType: (a.resourceType as any) ?? null,
        format: (a as any).format ?? null,
        date: null,
        createdAt: (a as any).createdAt ?? null,
        sessionType: "Routine Attachment",
        source: "routine",
        meta: (a as any).meta ?? null,
        originalName: a.originalName ?? null,
    };
}

export function RoutineAttachmentsSection({
    t,
    lang,
    busy,
    attachments,
    onUpload,
    onDelete,
    showUploadQuery = true,
}: Props) {
    const [files, setFiles] = React.useState<File[]>([]);
    const [uploadQueryJson, setUploadQueryJson] = React.useState<string>("{}");
    const [deleteCloudinary, setDeleteCloudinary] = React.useState<boolean>(true);

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [pendingDeletePublicId, setPendingDeletePublicId] = React.useState<string | null>(null);

    const [selected, setSelected] = React.useState<MediaLikeItem | null>(null);

    function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const list = e.target.files ? Array.from(e.target.files) : [];
        setFiles(list);
    }

    async function upload() {
        if (files.length === 0) return;

        const parsed = safeParseUploadQuery(uploadQueryJson);
        if (!parsed.ok) return;

        await onUpload({ files, query: parsed.value });

        setFiles([]);
        setUploadQueryJson("{}");
        const input = document.getElementById("routine-upload-input") as HTMLInputElement | null;
        if (input) input.value = "";
    }

    function requestDelete(publicId: string) {
        setPendingDeletePublicId(publicId);
        setConfirmOpen(true);
    }

    async function confirmDelete() {
        if (!pendingDeletePublicId) return;
        try {
            await onDelete({ publicId: pendingDeletePublicId, deleteCloudinary });
        } finally {
            setConfirmOpen(false);
            setPendingDeletePublicId(null);
        }
    }

    const items: MediaLikeItem[] = React.useMemo(
        () => attachments.map((a, idx) => toMediaLikeItem(a, idx)),
        [attachments]
    );

    return (
        <div className="rounded-xl border bg-card p-4 space-y-4">
            <div>
                <h2 className="text-lg font-semibold">{t("routines.attachmentsTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("routines.attachmentsHint")}</p>
            </div>

            <div className="rounded-xl border bg-background p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        id="routine-upload-input"
                        type="file"
                        multiple
                        onChange={onPickFiles}
                        className="text-sm"
                        disabled={busy}
                    />
                    <Button onClick={upload} disabled={busy || files.length === 0}>
                        {files.length === 0 ? t("routines.upload") : `${t("routines.upload")} (${files.length})`}
                    </Button>

                    <div className="flex items-center gap-2">
                        <input
                            id="deleteCloudinary"
                            type="checkbox"
                            checked={deleteCloudinary}
                            onChange={(e) => setDeleteCloudinary(e.target.checked)}
                            disabled={busy}
                        />
                        <label htmlFor="deleteCloudinary" className="text-sm text-muted-foreground">
                            {t("routines.deleteCloudinary")}
                        </label>
                    </div>
                </div>

                {showUploadQuery ? (
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t("routines.uploadQueryTitle")}</label>
                        <textarea
                            className="min-h-[23] w-full rounded-md border bg-background p-2 font-mono text-xs"
                            value={uploadQueryJson}
                            onChange={(e) => setUploadQueryJson(e.target.value)}
                            placeholder="{}"
                            disabled={busy}
                        />
                        <p className="text-xs text-muted-foreground">{t("routines.uploadQueryHint")}</p>
                    </div>
                ) : null}
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("routines.noAttachments")}</p>
            ) : (
                // <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((item) => (
                        <div
                            key={`${item.publicId}-${item.createdAt ?? ""}`}
                            className="relative flex flex-col pb-3"
                        >
                            <MediaCard item={item} onOpen={(it) => setSelected(it)} />

                            <div className="mt-3 pt-2 border-t flex items-center gap-2" />
                            <div className="mt-3 flex items-center gap-2">

                                <Button
                                    variant="outline"
                                    className="h-8 px-3"
                                    onClick={() => window.open(item.url, "_blank", "noreferrer")}
                                    disabled={!item.url}
                                    type="button"
                                >
                                    {t("routines.open")}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-8 px-3"
                                    onClick={() => item.publicId && requestDelete(item.publicId)}
                                    disabled={!item.publicId || busy}
                                    type="button"
                                >
                                    {t("routines.delete")}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("routines.confirmDeleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("routines.confirmDeleteDesc")}{" "}
                            {deleteCloudinary ? t("routines.confirmDeleteCloudinaryYes") : t("routines.confirmDeleteCloudinaryNo")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>{t("routines.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={busy}>
                            {lang === "es" ? "Eliminar" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {selected ? <MediaViewerModal item={selected} onClose={() => setSelected(null)} /> : null}
        </div>
    );
}
