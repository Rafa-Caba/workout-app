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
        <div className="w-full min-w-0 rounded-2xl border bg-card p-4">
            <div className="min-w-0 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0 space-y-2">
                    <div className="text-xs text-muted-foreground">{t("days.toolbar.date")}</div>

                    <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="h-10 w-full sm:w-auto min-w-0 rounded-xl border bg-background px-3 text-base sm:text-sm"
                        />

                        {isFetching ? (
                            <span className="text-xs text-muted-foreground">{t("days.toolbar.loading")}</span>
                        ) : null}
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button
                        type="button"
                        variant={tab === "summary" ? "default" : "outline"}
                        onClick={() => onTabChange("summary")}
                        className="w-full sm:w-auto"
                    >
                        {t("days.toolbar.tab.summary")}
                    </Button>

                    <Button
                        type="button"
                        variant={tab === "raw" ? "default" : "outline"}
                        onClick={() => onTabChange("raw")}
                        className="w-full sm:w-auto"
                    >
                        {t("days.toolbar.tab.raw")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
