import * as React from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { JsonDetails } from "@/components/JsonDetails";
import { useI18n } from "@/i18n/I18nProvider";
import { useMe } from "@/hooks/useMe";
import { ProfilePicModal } from "@/components/ProfilePicModal";
import { EditProfileModal } from "@/components/EditProfileModal";

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

export function MyProfilePage() {
    const { t } = useI18n();
    const { me, loading, error, refetch } = useMe(true);

    const [picOpen, setPicOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);

    const initials = me?.name ? getInitials(me.name) : "U";

    const right = me ? (
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)} disabled={loading}>
                {t("profile.edit")}
            </Button>
        </div>
    ) : null;

    return (
        <div className="space-y-6">
            <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} right={right} />

            {loading ? (
                <EmptyState title={t("common.loading")} description={t("common.fetching")} />
            ) : error ? (
                <EmptyState title={t("common.errorTitle")} description={error} />
            ) : !me ? (
                <EmptyState title={t("common.noDataDash")} description={t("profile.subtitle")} />
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("profile.title")}</CardTitle>
                            <CardDescription>{t("profile.subtitle")}</CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="flex items-start gap-5">
                                {/* Avatar (2x size) */}
                                <button
                                    type="button"
                                    onClick={() => setPicOpen(true)}
                                    className={[
                                        "h-32 w-32 rounded-full overflow-hidden border bg-background",
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
                                        <span className="text-3xl font-semibold text-muted-foreground">{initials}</span>
                                    )}
                                </button>

                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="text-xl font-semibold truncate">{me.name}</div>
                                    <div className="text-sm text-muted-foreground truncate">{me.email}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatNullable(me.role)} • {formatNullable(me.sex)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">{t("profile.editTip")}</div>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-2 text-sm px-3">
                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.heightCm")}</span>
                                    <span>{formatNullable(me.heightCm)}</span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.weightKg")}</span>
                                    <span>{formatNullable(me.currentWeightKg)}</span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">{t("settings.subtitle") /* reuse ok */}</span>
                                    <span>{me.units ? `${me.units.weight} / ${me.units.distance}` : "—"}</span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.birthDate")}</span>
                                    <span>{formatNullable(me.birthDate)}</span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.goal")}</span>
                                    <span>{formatNullable(me.activityGoal)}</span>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">{t("profile.fields.timezone")}</span>
                                    <span>{formatNullable(me.timezone)}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end">
                                <Button variant="outline" onClick={() => setEditOpen(true)}>
                                    {t("profile.edit")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Debug JSON collapsed at bottom */}
                    <JsonDetails title={t("json.title")} data={me} defaultOpen={false} />

                    <ProfilePicModal
                        open={picOpen}
                        user={me}
                        onClose={() => setPicOpen(false)}
                        onUpdated={refetch}
                    />

                    <EditProfileModal
                        open={editOpen}
                        user={me}
                        onClose={() => setEditOpen(false)}
                        onSaved={refetch}
                    />
                </>
            )}
        </div>
    );
}
