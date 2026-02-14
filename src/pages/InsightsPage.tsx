import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useI18n } from "@/i18n/I18nProvider";

export function InsightsPage() {
    const { t } = useI18n();

    return (
        <div className="space-y-6">
            <PageHeader title={t("pages.insights.title")} subtitle={t("pages.insights.subtitle")} />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="text-lg font-semibold">{t("insights.streaks.title")}</div>
                    <p className="text-sm text-muted-foreground">{t("insights.streaks.desc")}</p>
                    <Button asChild>
                        <Link to="/insights/streaks">{t("insights.openStreaks")}</Link>
                    </Button>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="text-lg font-semibold">{t("insights.prs.title")}</div>
                    <p className="text-sm text-muted-foreground">{t("insights.prs.desc")}</p>
                    <Button asChild>
                        <Link to="/insights/prs">{t("insights.openPrs")}</Link>
                    </Button>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="text-lg font-semibold">{t("insights.recovery.title")}</div>
                    <p className="text-sm text-muted-foreground">{t("insights.recovery.desc")}</p>
                    <Button asChild variant="outline">
                        <Link to="/insights/recovery">{t("insights.openRecovery")}</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
