import * as React from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/i18n/I18nProvider";
import { useMe } from "@/hooks/useMe";
import { useSettings } from "@/hooks/useSettings";
import { useSettingsStore } from "@/state/settings.store";

function formatNullable(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

export function SettingsPage() {
    const { t } = useI18n();
    const { me, loading: meLoading, error: meError } = useMe(true);

    const { settings, loading: sLoading, error: sError, lastLoadedAt, update } = useSettings(true);

    const setWeekStartsOn = useSettingsStore((s) => s.setWeekStartsOn);
    const setDefaultRpe = useSettingsStore((s) => s.setDefaultRpe);

    const busy = meLoading || sLoading;

    const onSave = async () => {
        try {
            await update({
                weekStartsOn: settings.weekStartsOn,
                debug: { showJson: false },
                defaults: { defaultRpe: settings.defaults.defaultRpe },
            });
            toast.success(t("settings.toast.saved"));
        } catch (e: any) {
            toast.error(e?.message ?? t("settings.toast.saveFail"));
        }
    };

    return (
        <div className="px-4 sm:px-0 space-y-6">
            <PageHeader
                title={t("settings.title")}
                subtitle={t("settings.subtitle")}
                right={
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={onSave}
                            disabled={busy}
                            className="w-full sm:w-auto h-11 sm:h-10"
                        >
                            {busy ? t("settings.saving") : t("settings.save")}
                        </Button>
                    </div>
                }
            />

            {meLoading ? (
                <EmptyState title={t("common.loading")} description={t("common.fetching")} />
            ) : meError ? (
                <EmptyState title={t("common.errorTitle")} description={meError} />
            ) : !me ? (
                <EmptyState title={t("common.noDataDash")} description={t("settings.subtitle")} />
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Account info */}
                    <Card className="border-primary/20 bg-primary/2">
                        <CardHeader>
                            <CardTitle>{t("settings.account.title")}</CardTitle>
                            <CardDescription>{t("settings.account.desc")}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground shrink-0">{t("settings.account.name")}</span>
                                <span className="min-w-0 text-right wrap-break-words">{formatNullable(me.name)}</span>
                            </div>

                            <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground shrink-0">{t("settings.account.email")}</span>
                                <span className="min-w-0 text-right wrap-break-words">{formatNullable(me.email)}</span>
                            </div>

                            <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground shrink-0">{t("settings.account.role")}</span>
                                <span className="min-w-0 text-right wrap-break-words">
                                    {me.role === "admin" ? t("settings.account.role.admin") : t("settings.account.role.user")}
                                </span>
                            </div>

                            <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground shrink-0">{t("settings.account.coachMode")}</span>
                                <span className="min-w-0 text-right wrap-break-words">
                                    {formatNullable(me.coachMode === "NONE" ? "REGULAR" : me.coachMode)}
                                </span>
                            </div>

                            <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground shrink-0">{t("settings.account.units")}</span>
                                <span className="min-w-0 text-right wrap-break-words">
                                    {me.units ? `${me.units.weight} / ${me.units.distance}` : "—"}
                                </span>
                            </div>

                            <div className="text-xs text-muted-foreground">{t("settings.account.hintProfile")}</div>
                        </CardContent>
                    </Card>

                    {/* App settings */}
                    <Card className="border-primary/20 bg-primary/2">
                        <CardHeader>
                            <CardTitle>{t("settings.app.title")}</CardTitle>
                            <CardDescription>{t("settings.app.desc")}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5 text-sm">
                            {sError ? (
                                <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground wrap-break-words">
                                    {t("settings.backendNotReadyHint")} {sError}
                                </div>
                            ) : null}

                            {/* Week starts on */}
                            <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <span className="text-muted-foreground">{t("settings.weekStartsOn")}</span>
                                    <select
                                        className="h-11 sm:h-10 w-full sm:w-auto rounded-lg border bg-background px-3 text-sm"
                                        value={settings.weekStartsOn}
                                        onChange={(e) => setWeekStartsOn(Number(e.target.value) as 0 | 1)}
                                        disabled={busy}
                                    >
                                        <option value={1}>{t("settings.weekStartsOn.mon")}</option>
                                        <option value={0}>{t("settings.weekStartsOn.sun")}</option>
                                    </select>
                                </div>
                                <div className="text-xs text-muted-foreground">{t("settings.weekStartsOn.hint")}</div>
                            </div>

                            {/* Default RPE */}
                            <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <span className="text-muted-foreground">{t("settings.defaultRpe")}</span>
                                    <select
                                        className="h-11 sm:h-10 w-full sm:w-auto rounded-lg border bg-background px-3 text-sm"
                                        value={settings.defaults.defaultRpe === null ? "" : String(settings.defaults.defaultRpe)}
                                        onChange={(e) => {
                                            const v = e.target.value.trim();
                                            setDefaultRpe(v ? Number(v) : null);
                                        }}
                                        disabled={busy}
                                    >
                                        <option value="">{t("settings.none")}</option>
                                        {Array.from({ length: 10 }).map((_, i) => {
                                            const v = i + 1;
                                            return (
                                                <option key={v} value={String(v)}>
                                                    {v}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="text-xs text-muted-foreground">{t("settings.defaultRpe.hint")}</div>
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="text-xs text-muted-foreground">
                                    {lastLoadedAt ? `${t("settings.lastSaved")} ${lastLoadedAt}` : t("settings.lastSaved.none")}
                                </div>

                                <Button onClick={onSave} disabled={busy} className="w-full sm:w-auto h-11 sm:h-10">
                                    {busy ? t("settings.saving") : t("settings.save")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
