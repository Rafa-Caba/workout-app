import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/state/user.store";
import { useI18n } from "@/i18n/I18nProvider";
import type { AuthUser } from "@/types/auth.types";
import type { UserProfileUpdateRequest, ActivityGoal } from "@/types/user.types";

type SexOption = "male" | "female" | "other" | "null";
type WeightUnit = "kg" | "lb";
type DistanceUnit = "km" | "mi";

function toNullableNumber(v: string): number | null {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
}

function normalizeString(v: string): string | null {
    const trimmed = v.trim();
    return trimmed ? trimmed : null;
}

function normalizeName(v: string): string | null {
    const trimmed = v.trim();
    return trimmed ? trimmed : null;
}

function sexToPayload(v: SexOption): UserProfileUpdateRequest["sex"] {
    if (v === "null") return null;
    return v;
}

function goalToPayload(v: string): ActivityGoal {
    if (v === "null") return null;
    return v as ActivityGoal;
}

/**
 * Builds a safe PATCH payload (only changed fields).
 * Keeps BE happy if it rejects unknown/unmodified fields.
 */
function buildPatchPayload(original: AuthUser, next: FormState): UserProfileUpdateRequest {
    const payload: UserProfileUpdateRequest = {};

    const nextName = normalizeName(next.name) ?? original.name ?? null;
    if (nextName !== (original.name ?? null) && nextName !== null) payload.name = nextName;

    const nextSex = sexToPayload(next.sex);
    if (nextSex !== (original.sex ?? null)) payload.sex = nextSex;

    const nextHeight = toNullableNumber(next.heightCm);
    if (nextHeight !== (original.heightCm ?? null)) payload.heightCm = nextHeight;

    const nextWeight = toNullableNumber(next.currentWeightKg);
    if (nextWeight !== (original.currentWeightKg ?? null)) payload.currentWeightKg = nextWeight;

    const nextBirth = normalizeString(next.birthDate);
    if ((nextBirth ?? null) !== (original.birthDate ?? null)) payload.birthDate = nextBirth;

    const nextGoal = goalToPayload(next.activityGoal);
    if (nextGoal !== (original.activityGoal ?? null)) payload.activityGoal = nextGoal;

    const nextTz = normalizeString(next.timezone);
    if ((nextTz ?? null) !== (original.timezone ?? null)) payload.timezone = nextTz;

    const nextUnits =
        next.unitsWeight && next.unitsDistance
            ? { weight: next.unitsWeight as WeightUnit, distance: next.unitsDistance as DistanceUnit }
            : null;

    const originalUnits = original.units ?? null;

    const unitsChanged =
        (nextUnits === null && originalUnits !== null) ||
        (nextUnits !== null && originalUnits === null) ||
        (nextUnits !== null &&
            originalUnits !== null &&
            (nextUnits.weight !== originalUnits.weight || nextUnits.distance !== originalUnits.distance));

    if (unitsChanged) payload.units = nextUnits;

    return payload;
}

type FormState = {
    name: string;
    sex: SexOption;

    heightCm: string;
    currentWeightKg: string;

    unitsWeight: WeightUnit | "";
    unitsDistance: DistanceUnit | "";

    birthDate: string; // YYYY-MM-DD or ""
    activityGoal: string; // ActivityGoal | "null"
    timezone: string;
};

function initForm(user: AuthUser): FormState {
    return {
        name: user.name ?? "",
        sex: (user.sex ?? "null") as SexOption,

        heightCm: user.heightCm === null || user.heightCm === undefined ? "" : String(user.heightCm),
        currentWeightKg:
            user.currentWeightKg === null || user.currentWeightKg === undefined ? "" : String(user.currentWeightKg),

        unitsWeight: user.units?.weight ?? "",
        unitsDistance: user.units?.distance ?? "",

        birthDate: user.birthDate ?? "",
        activityGoal: (user.activityGoal ?? "null") as string,
        timezone: user.timezone ?? "",
    };
}

export function EditProfileModal({
    open,
    user,
    onClose,
    onSaved,
}: {
    open: boolean;
    user: AuthUser;
    onClose: () => void;
    onSaved?: () => void;
}) {
    const { t } = useI18n();

    const updateMe = useUserStore((s) => s.updateMe);
    const busy = useUserStore((s) => s.loading);

    const [form, setForm] = React.useState<FormState>(() => initForm(user));

    React.useEffect(() => {
        if (!open) return;
        setForm(initForm(user));
    }, [open, user]);

    const payloadPreview = React.useMemo(() => buildPatchPayload(user, form), [user, form]);
    const isNoChanges = React.useMemo(() => Object.keys(payloadPreview).length === 0, [payloadPreview]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        const payload = buildPatchPayload(user, form);
        if (Object.keys(payload).length === 0) {
            toast.message(t("profile.toast.noChanges"));
            return;
        }

        try {
            await updateMe(payload);
            toast.success(t("profile.toast.updated"));
            onSaved?.();
            onClose();
        } catch (err: any) {
            toast.error(err?.message ?? t("profile.toast.updateFail"));
        }
    }

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

            {/* Make the viewport wrapper scroll-safe on mobile + safe-area padding */}
            <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6 md:p-8 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <div className="min-h-[dvh] flex items-start sm:items-center justify-center">
                    {/* Modal becomes a column with max-height so header stays reachable */}
                    <div className="w-full max-w-3xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] rounded-2xl border bg-background shadow-xl overflow-hidden flex flex-col">
                        {/* Sticky header so the close/save buttons never go offscreen */}
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">{t("profile.editModal.title")}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {t("profile.editModal.subtitle")}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <Button variant="outline" onClick={onClose} disabled={busy} className="h-9">
                                    {t("profile.editModal.cancel")}
                                </Button>
                                <Button form="edit-profile-form" type="submit" disabled={busy || isNoChanges} className="h-9">
                                    {t("profile.editModal.save")}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={busy}
                                    aria-label="Close"
                                    className="h-9 w-9 p-0"
                                >
                                    ✕
                                </Button>
                            </div>
                        </div>

                        {/* ✅ Scrollable body area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
                            <form id="edit-profile-form" onSubmit={onSubmit} className="space-y-5">
                                {/* Name + Sex */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("profile.fields.name")}</label>
                                        <input
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                            value={form.name}
                                            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                                            placeholder={t("profile.fields.name")}
                                            disabled={busy}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("profile.fields.sex")}</label>
                                        <select
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                            value={form.sex}
                                            onChange={(e) => setForm((s) => ({ ...s, sex: e.target.value as SexOption }))}
                                            disabled={busy}
                                        >
                                            <option value="null">{t("profile.fields.sex.none")}</option>
                                            <option value="male">{t("profile.fields.sex.male")}</option>
                                            <option value="female">{t("profile.fields.sex.female")}</option>
                                            <option value="other">{t("profile.fields.sex.other")}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Height + Weight */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("profile.fields.heightCm")}</label>
                                        <input
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                            value={form.heightCm}
                                            onChange={(e) => setForm((s) => ({ ...s, heightCm: e.target.value }))}
                                            placeholder={t("profile.fields.heightCm")}
                                            inputMode="decimal"
                                            disabled={busy}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("profile.fields.weightKg")}</label>
                                        <input
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                            value={form.currentWeightKg}
                                            onChange={(e) => setForm((s) => ({ ...s, currentWeightKg: e.target.value }))}
                                            placeholder={t("profile.fields.weightKg")}
                                            inputMode="decimal"
                                            disabled={busy}
                                        />
                                    </div>
                                </div>

                                {/* Units */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("profile.fields.unitsWeight")}</label>
                                        <select
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                            value={form.unitsWeight}
                                            onChange={(e) =>
                                                setForm((s) => ({ ...s, unitsWeight: e.target.value as WeightUnit | "" }))
                                            }
                                            disabled={busy}
                                        >
                                            <option value="">{t("profile.fields.sex.none")}</option>
                                            <option value="kg">kg</option>
                                            <option value="lb">lb</option>
                                        </select>
                                        <div className="text-xs text-muted-foreground">{t("profile.fields.unitsHint")}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("profile.fields.unitsDistance")}</label>
                                        <select
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                            value={form.unitsDistance}
                                            onChange={(e) =>
                                                setForm((s) => ({
                                                    ...s,
                                                    unitsDistance: e.target.value as DistanceUnit | "",
                                                }))
                                            }
                                            disabled={busy}
                                        >
                                            <option value="">{t("profile.fields.sex.none")}</option>
                                            <option value="km">km</option>
                                            <option value="mi">mi</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Birth date + Goal */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("profile.fields.birthDate")}</label>
                                        <input
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                            type="date"
                                            value={form.birthDate}
                                            onChange={(e) => setForm((s) => ({ ...s, birthDate: e.target.value }))}
                                            disabled={busy}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("profile.fields.goal")}</label>
                                        <select
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                            value={form.activityGoal}
                                            onChange={(e) => setForm((s) => ({ ...s, activityGoal: e.target.value }))}
                                            disabled={busy}
                                        >
                                            <option value="null">{t("profile.fields.goal.none")}</option>
                                            <option value="fat_loss">{t("profile.fields.goal.fat_loss")}</option>
                                            <option value="hypertrophy">{t("profile.fields.goal.hypertrophy")}</option>
                                            <option value="strength">{t("profile.fields.goal.strength")}</option>
                                            <option value="maintenance">{t("profile.fields.goal.maintenance")}</option>
                                            <option value="other">{t("profile.fields.goal.other")}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Coach Mode */}
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-sm font-medium">{t("profile.fields.coachMode")}</label>
                                    <span className="min-w-0 text-start wrap-break-words text-muted-foreground">
                                        {user.coachMode === "NONE" ? "REGULAR" : user.coachMode}
                                    </span>
                                </div>

                                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="text-xs text-muted-foreground">
                                        {isNoChanges ? t("profile.editModal.noChanges") : t("profile.editModal.ready")}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => setForm(initForm(user))}
                                            disabled={busy}
                                            className="h-9"
                                        >
                                            {t("profile.editModal.reset")}
                                        </Button>
                                        <Button type="submit" disabled={busy || isNoChanges} className="h-9">
                                            {t("profile.editModal.save")}
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            <div className="mt-4 text-xs text-muted-foreground">{t("profile.picModal.tip")}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
