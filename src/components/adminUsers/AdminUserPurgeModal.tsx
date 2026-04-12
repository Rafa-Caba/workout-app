// src/components/adminUsers/AdminUserPurgeModal.tsx
import React from "react";

import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/types/adminUser.types";

import {
    type PurgeResult,
    formatDeletedCount,
} from "./adminUsers.shared";

type Props = {
    lang: string;
    open: boolean;
    target: AdminUser | null;
    confirmText: string;
    purging: boolean;
    result: PurgeResult | null;

    onClose: () => void;
    onConfirmTextChange: (value: string) => void;
    onConfirm: () => void;
};

export function AdminUserPurgeModal({
    lang,
    open,
    target,
    confirmText,
    purging,
    result,
    onClose,
    onConfirmTextChange,
    onConfirm,
}: Props) {
    if (!open) return null;

    const purgeIsUnlocked = confirmText.trim().toUpperCase() === "PURGE";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl">
                <div className="border-b p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold">
                                {lang === "es" ? "Purgar usuario" : "Purge user"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {lang === "es"
                                    ? "Esto eliminará permanentemente al usuario y sus datos relacionados. Esta acción no se puede deshacer."
                                    : "This will permanently delete the user and related data. This action cannot be undone."}
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={onClose}
                            disabled={purging}
                        >
                            {lang === "es" ? "Cerrar" : "Close"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                    {target ? (
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="truncate text-sm font-medium">{target.name}</div>
                            <div className="truncate font-mono text-xs text-muted-foreground">{target.email}</div>
                            <div className="truncate font-mono text-[11px] text-muted-foreground">
                                id: {target.id}
                            </div>
                        </div>
                    ) : null}

                    {!result ? (
                        <>
                            <div className="space-y-2">
                                <div className="text-xs font-medium text-red-600 dark:text-red-400">
                                    {lang === "es"
                                        ? "Advertencia: esto borrará datos (días, rutinas, tokens, métricas, etc.)."
                                        : "Warning: this will delete data (days, routines, tokens, metrics, etc.)."}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    {lang === "es"
                                        ? 'Para confirmar, escribe "PURGE" en el campo.'
                                        : 'To confirm, type "PURGE" in the field.'}
                                </p>

                                <input
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm font-mono"
                                    value={confirmText}
                                    onChange={(e) => onConfirmTextChange(e.target.value)}
                                    placeholder="PURGE"
                                    disabled={purging}
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={purging}
                                    className="w-full sm:w-auto"
                                >
                                    {lang === "es" ? "Cancelar" : "Cancel"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={onConfirm}
                                    disabled={!purgeIsUnlocked || purging}
                                    className="w-full sm:w-auto"
                                >
                                    {purging
                                        ? lang === "es"
                                            ? "Purgando..."
                                            : "Purging..."
                                        : lang === "es"
                                            ? "Confirmar purga"
                                            : "Confirm purge"}
                                </Button>
                            </div>

                            <p className="text-[11px] text-muted-foreground">
                                {lang === "es"
                                    ? "Tip: si solo quieres desactivar el acceso, usa “Eliminar” (desactiva)."
                                    : "Tip: if you only want to disable access, use “Delete” (deactivates)."}
                            </p>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-lg border bg-emerald-500/10 p-3">
                                <div className="text-sm font-medium">
                                    {lang === "es" ? "Purga completada" : "Purge completed"}
                                </div>
                                <div className="text-xs text-muted-foreground">{result.message}</div>
                            </div>

                            {result.cleanup?.items?.length ? (
                                <div className="rounded-lg border p-3">
                                    <div className="mb-2 text-xs font-semibold">
                                        {lang === "es" ? "Reporte de limpieza" : "Cleanup report"}
                                    </div>

                                    <div className="space-y-1">
                                        {result.cleanup.items.map((item) => (
                                            <div
                                                key={item.model}
                                                className="flex items-center justify-between gap-3 text-xs"
                                            >
                                                <span className="font-mono">{item.model}</span>
                                                <span className="font-mono text-muted-foreground">
                                                    {formatDeletedCount(item.deletedCount)}
                                                </span>
                                            </div>
                                        ))}

                                        <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs">
                                            <span className="font-semibold">
                                                {lang === "es" ? "Total eliminado" : "Total deleted"}
                                            </span>
                                            <span className="font-mono font-semibold">
                                                {formatDeletedCount(result.cleanup.totalDeleted)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground">
                                    {lang === "es"
                                        ? "No se recibió reporte de limpieza."
                                        : "No cleanup report received."}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button type="button" onClick={onClose}>
                                    {lang === "es" ? "Listo" : "Done"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}