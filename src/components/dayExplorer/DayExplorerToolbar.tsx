import React from "react";
import { Button } from "@/components/ui/button";

type Tab = "summary" | "raw";

// IMPORTANT: Our i18n `t` is strongly typed (union of keys),
// so accepting `(key: string) => string` causes TS2322.
// This signature is compatible with your typed `t`.
type TFn = (key: any, vars?: any) => string;

type Props = {
    t: TFn;
    date: string;
    onDateChange: (next: string) => void;
    isFetching: boolean;

    tab: Tab;
    onTabChange: (tab: Tab) => void;
};

export function DayExplorerToolbar({
    t,
    date,
    onDateChange,
    isFetching,
    tab,
    onTabChange,
}: Props) {
    return (
        <div className="rounded-2xl border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">{t("days.toolbar.date")}</div>

                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="h-10 rounded-xl border bg-background px-3 text-sm"
                        />

                        {isFetching ? (
                            <span className="text-xs text-muted-foreground">{t("days.toolbar.loading")}</span>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant={tab === "summary" ? "default" : "outline"}
                        onClick={() => onTabChange("summary")}
                    >
                        {t("days.toolbar.tab.summary")}
                    </Button>

                    <Button
                        type="button"
                        variant={tab === "raw" ? "default" : "outline"}
                        onClick={() => onTabChange("raw")}
                    >
                        {t("days.toolbar.tab.raw")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
