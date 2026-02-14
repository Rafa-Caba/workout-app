import React from "react";
import { Button } from "@/components/ui/button";
import { JsonDetails } from "@/components/JsonDetails";

type Tab = "summary" | "raw";
type TFn = (key: any, vars?: any) => string;

function safeStringify(data: unknown): string {
    try {
        return JSON.stringify(data, null, 2);
    } catch {
        return String(data);
    }
}

export function DayExplorerJsonPanel({
    t,
    tab,
    runDate,
    data,
    error,
    isFetching,
    showFetchingBlock,
}: {
    t: TFn;
    tab: Tab;
    runDate: string | null;
    data: unknown | null;
    error: any | null;
    isFetching: boolean;
    showFetchingBlock: boolean;
}) {
    async function copyJson() {
        if (!data) return;
        const txt = safeStringify(data);
        try {
            await navigator.clipboard.writeText(txt);
        } catch {
            // fallback
            const ta = document.createElement("textarea");
            ta.value = txt;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
        }
    }

    return (
        <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold">
                        {tab === "summary" ? t("days.json.summaryTitle") : t("days.json.rawTitle")}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                        {runDate ? `${t("days.json.date")}: ${runDate}` : t("days.json.noDate")}
                        {isFetching ? ` • ${t("days.json.loading")}` : ""}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        onClick={copyJson}
                        disabled={!data}
                        title={!data ? t("days.json.copyDisabled") : undefined}
                    >
                        {t("days.json.copy")}
                    </Button>
                </div>
            </div>

            <div className="p-4">
                {showFetchingBlock ? (
                    <div className="text-sm text-muted-foreground">{t("days.json.fetching")}</div>
                ) : error ? (
                    <div className="text-sm text-red-600">{error.message ?? "Error"}</div>
                ) : !data ? (
                    <div className="text-sm text-muted-foreground">{t("days.json.empty")}</div>
                ) : (
                    <details open className="rounded-xl border bg-background p-3">
                        <summary className="cursor-pointer text-sm font-medium">
                            {t("days.json.expand")}
                        </summary>
                        <div className="mt-3">
                            <JsonDetails title={t("days.json.payload")} data={data} />
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}
