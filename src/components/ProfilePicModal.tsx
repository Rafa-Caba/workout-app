import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import type { AuthUser } from "@/types/auth.types";
import { useUserStore } from "@/state/user.store";

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const first = parts[0]?.[0] ?? "U";
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
    return (first + (second ?? "")).toUpperCase();
}

export function ProfilePicModal({
    open,
    user,
    onClose,
    onUpdated,
}: {
    open: boolean;
    user: AuthUser;
    onClose: () => void;
    onUpdated?: () => void;
}) {
    const { t } = useI18n();
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const uploadProfilePic = useUserStore((s) => s.uploadProfilePic);
    const deleteProfilePic = useUserStore((s) => s.deleteProfilePic);
    const busy = useUserStore((s) => s.loading);

    const avatarUrl = user.profilePicUrl ?? null;
    const initials = user.name ? getInitials(user.name) : "U";

    const onPickFile = () => fileInputRef.current?.click();

    const onUploadFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const file = e.target.files?.[0] ?? null;
        e.target.value = "";
        if (!file) return;

        try {
            await uploadProfilePic(file);
            toast.success(t("profile.picModal.updated"));
            onUpdated?.();
        } catch (err: any) {
            toast.error(err?.message ?? t("profile.picModal.uploadFail"));
        }
    };

    const onRemovePic = async () => {
        try {
            await deleteProfilePic();
            toast.success(t("profile.picModal.deleted"));
            onUpdated?.();
        } catch (err: any) {
            toast.error(err?.message ?? t("profile.picModal.deleteFail"));
        }
    };

    if (!open) return null;

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

            <div className="absolute inset-0 p-3 sm:p-4 md:p-8 flex items-center justify-center">
                <div className="w-full max-w-3xl rounded-2xl border bg-background shadow-xl overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border-b">
                        <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" title={user.name ?? "User"}>
                                {user.name ?? "User"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{user.email ?? ""}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            {avatarUrl ? (
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(avatarUrl, "_blank", "noreferrer")}
                                    disabled={busy}
                                    className="h-9 px-3 text-sm"
                                >
                                    {t("media.open")}
                                </Button>
                            ) : null}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onUploadFile}
                            />

                            <Button
                                variant="outline"
                                onClick={onPickFile}
                                disabled={busy}
                                className="h-9 px-3 text-sm"
                            >
                                {t("profile.picModal.change")}
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={onRemovePic}
                                disabled={busy || !avatarUrl}
                                className="h-9 px-3 text-sm"
                            >
                                {t("common.remove")}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={busy}
                                aria-label="Close"
                                className="h-9 w-9 px-0"
                            >
                                ✕
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 bg-black/5">
                        <div className="w-full flex items-center justify-center">
                            <div className="w-full max-w-xl aspect-square rounded-2xl border bg-background overflow-hidden grid place-items-center">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={user.name ?? "User"}
                                        className="h-full w-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="text-4xl font-semibold text-muted-foreground">{initials}</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-muted-foreground text-center">
                            {t("profile.picModal.tip")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
