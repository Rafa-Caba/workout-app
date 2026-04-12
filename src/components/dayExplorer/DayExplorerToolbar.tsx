// src/components/dayExplorer/DayExplorerToolbar.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { themedPanelCard } from "@/theme/cardHierarchy";

type Tab = "summary" | "raw";

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
        <div className={cn("w-full min-w-0 rounded-2xl border p-4", themedPanelCard)}>
            <div className="min-w-0 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0 space-y-2">
                    <div className="text-xs text-muted-foreground">{t("days.toolbar.date")}</div>

                    <div className="min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="my-1 w-auto columns-1 sm:my-0 sm:w-auto">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => onDateChange(e.target.value)}
                                className="h-10 w-full min-w-0 rounded-xl border border-primary/15 bg-background px-3 text-base sm:w-auto sm:text-sm"
                            />
                        </div>

                        {isFetching ? (
                            <span className="text-xs text-muted-foreground">{t("days.toolbar.loading")}</span>
                        ) : null}
                    </div>
                </div>

                <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center md:w-auto">
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