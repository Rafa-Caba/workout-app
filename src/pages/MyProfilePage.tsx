// src/pages/MyProfilePage.tsx
import * as React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { JsonDetails } from "@/components/JsonDetails";
import { useI18n } from "@/i18n/I18nProvider";
import { useMe } from "@/hooks/useMe";
import { useLatestBodyMetric } from "@/hooks/useLatestBodyMetric";
import { ProfilePicModal } from "@/components/ProfilePicModal";
import { EditProfileModal } from "@/components/EditProfileModal";
import { BodyMetricsIllustration } from "@/components/bodyMetrics/BodyMetricsIllustration";

function formatNullable(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const first = parts[0]?.[0] ?? "U";
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
    return (first + (second ?? "")).toUpperCase();
}

function kgToLb(kg: number): number {
    return kg * 2.2046226218;
}

function roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

function formatWeightForDisplay(weightKg: number | null | undefined, unit: "kg" | "lb" | null | undefined): string {
    if (weightKg == null || !Number.isFinite(weightKg)) return "—";

    if (unit === "lb") {
        const lb = roundTo(kgToLb(weightKg), 1);
        return `${lb} lb`;
    }

    const kg = roundTo(weightKg, 1);
    return `${kg} kg`;
}

function formatLastLogin(value: string | null | undefined, lang: string): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";

    try {
        const locale = lang === "es" ? "es-MX" : "en-US";
        return d.toLocaleString(locale, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return d.toISOString();
    }
}

function formatPercent(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return "—";
    return `${roundTo(value, 1)}%`;
}

function formatCm(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return "—";
    return `${roundTo(value, 1)} cm`;
}

export function MyProfilePage() {
    const { t, lang } = useI18n();
    const { me, loading, error, refetch } = useMe(true);
    const latestBodyMetricQuery = useLatestBodyMetric();

    const [picOpen, setPicOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);

    const initials = me?.name ? getInitials(me.name) : "U";

    const right = me ? (
        <div className="w-full sm:w-auto">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <Button
                    className="w-full sm:w-auto"
                    variant="outline"
                    onClick={() => setEditOpen(true)}
                    disabled={loading}
                >
                    {t("profile.edit")}
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <div className="space-y-5 sm:space-y-6">
            <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} right={right} />

            {loading ? (
                <EmptyState title={t("common.loading")} description={t("common.fetching")} />
            ) : error ? (
                <EmptyState title={t("common.errorTitle")} description={error} />
            ) : !me ? (
                <EmptyState title={t("common.noDataDash")} description={t("profile.subtitle")} />
            ) : (
                <>
                    <Card className="border-primary/40 bg-primary/10">
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle>{t("profile.title")}</CardTitle>
                            <CardDescription>{t("profile.subtitle")}</CardDescription>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
                                <button
                                    type="button"
                                    onClick={() => setPicOpen(true)}
                                    className={[
                                        "h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden border bg-background",
                                        "grid place-items-center",
                                        "hover:bg-muted/60 transition",
                                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                    ].join(" ")}
                                    aria-label={t("profile.picModal.title")}
                                    title={t("profile.picModal.title")}
                                >
                                    {me.profilePicUrl ? (
                                        <img
                                            src={me.profilePicUrl}
                                            alt={me.name ?? "User"}
                                            className="h-full w-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span className="text-2xl sm:text-3xl font-semibold text-muted-foreground">
                                            {initials}
                                        </span>
                                    )}
                                </button>

                                <div className="flex-1 space-y-1 min-w-0 text-center sm:text-left">
                                    <div className="text-lg sm:text-xl font-semibold truncate">{me.name}</div>
                                    <div className="text-sm text-muted-foreground truncate">{me.email}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatNullable(me.role)} • {formatNullable(me.sex)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">{t("profile.editTip")}</div>
                                </div>
                            </div>

                            <div className="mt-5 sm:mt-6 grid grid-cols-1 gap-2 text-sm">
                                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.heightCm")}</span>
                                    <span className="text-right wrap-break-words">{formatNullable(me.heightCm)}</span>
                                </div>

                                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.weightKg")}</span>
                                    <span className="text-right wrap-break-words">
                                        {formatWeightForDisplay(me.currentWeightKg, me.units?.weight ?? "kg")}
                                    </span>
                                </div>

                                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                    <span className="text-muted-foreground">{t("settings.subtitle")}</span>
                                    <span className="text-right wrap-break-words">
                                        {me.units ? `${me.units.weight} / ${me.units.distance}` : "—"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.birthDate")}</span>
                                    <span className="text-right wrap-break-words">{formatNullable(me.birthDate)}</span>
                                </div>

                                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.goal")}</span>
                                    <span className="text-right wrap-break-words">{formatNullable(me.activityGoal)}</span>
                                </div>

                                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.trainingLevel")}</span>
                                    <span className="text-right wrap-break-words">
                                        {me.trainingLevel ? t(`profile.level.${me.trainingLevel}`) : "—"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                                    <span className="text-muted-foreground">{t("profile.fields.healthNotes")}</span>
                                    <div className="hidden md:block" />
                                    <div className="rounded-lg border bg-background px-3 py-2 text-sm whitespace-pre-wrap wrap-break-words">
                                        {me.healthNotes ? me.healthNotes : "—"}
                                    </div>
                                </div>

                                <div className="grid grid-cols-[1fr_auto] items-center gap-3 pt-2">
                                    <span className="text-muted-foreground">{t("profile.fields.coachMode")}</span>
                                    <span className="text-right wrap-break-words">
                                        {formatNullable(me.coachMode === "NONE" ? "REGULAR" : me.coachMode)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 sm:mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs text-muted-foreground order-2 sm:order-1">
                                    {t("profile.fields.lastLoginAt")}:{" "}
                                    <span className="text-foreground">{formatLastLogin(me.lastLoginAt, lang)}</span>
                                </div>

                                <div className="order-1 sm:order-2 flex justify-end">
                                    <Button className="w-full sm:w-auto" variant="outline" onClick={() => setEditOpen(true)}>
                                        {t("profile.edit")}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Historial corporal</CardTitle>
                            <CardDescription>
                                Sigue tu peso, cintura y composición corporal desde una sola pantalla.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr] lg:items-center">
                                <div className="flex justify-center">
                                    <BodyMetricsIllustration />
                                </div>

                                <div className="grid grid-cols-1 gap-2 rounded-xl border bg-background p-4 text-sm sm:grid-cols-2">
                                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                        <span className="text-muted-foreground">Último registro</span>
                                        <span className="font-medium">{latestBodyMetricQuery.data?.latest?.date ?? "—"}</span>
                                    </div>

                                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                        <span className="text-muted-foreground">Peso</span>
                                        <span className="font-medium">
                                            {formatWeightForDisplay(
                                                latestBodyMetricQuery.data?.latest?.weightKg ?? null,
                                                me.units?.weight ?? "kg"
                                            )}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                        <span className="text-muted-foreground">Grasa corporal</span>
                                        <span className="font-medium">
                                            {formatPercent(latestBodyMetricQuery.data?.latest?.bodyFatPct ?? null)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                        <span className="text-muted-foreground">Cintura</span>
                                        <span className="font-medium">
                                            {formatCm(latestBodyMetricQuery.data?.latest?.waistCm ?? null)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button asChild>
                                    <Link to="/me/body-metrics">Ver métricas corporales</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <JsonDetails title={t("json.title")} data={me} defaultOpen={false} />

                    <ProfilePicModal open={picOpen} user={me} onClose={() => setPicOpen(false)} onUpdated={refetch} />

                    <EditProfileModal open={editOpen} user={me} onClose={() => setEditOpen(false)} onSaved={refetch} />
                </>
            )}
        </div>
    );
}