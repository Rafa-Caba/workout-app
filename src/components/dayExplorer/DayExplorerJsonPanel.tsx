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
        <div className="w-full min-w-0 rounded-2xl border bg-card overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold">
                        {tab === "summary" ? t("days.json.summaryTitle") : t("days.json.rawTitle")}
                    </div>
                    <div className="min-w-0 text-xs text-muted-foreground wrap-break-words sm:truncate">
                        {runDate ? `${t("days.json.date")}: ${runDate}` : t("days.json.noDate")}
                        {isFetching ? ` • ${t("days.json.loading")}` : ""}
                    </div>
                </div>

                <div className="flex w-full sm:w-auto items-center justify-start sm:justify-end gap-2 shrink-0 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={copyJson}
                        disabled={!data}
                        title={!data ? t("days.json.copyDisabled") : undefined}
                        className="w-full sm:w-auto"
                    >
                        {t("days.json.copy")}
                    </Button>
                </div>
            </div>

            <div className="p-4 min-w-0">
                {showFetchingBlock ? (
                    <div className="text-sm text-muted-foreground">{t("days.json.fetching")}</div>
                ) : error ? (
                    <div className="text-sm text-red-600 wrap-break-words">{error.message ?? "Error"}</div>
                ) : !data ? (
                    <div className="text-sm text-muted-foreground">{t("days.json.empty")}</div>
                ) : (
                    <details open className="min-w-0 rounded-xl border bg-background p-3">
                        <summary className="cursor-pointer text-sm font-medium">
                            {t("days.json.expand")}
                        </summary>
                        <div className="mt-3 min-w-0">
                            <JsonDetails title={t("days.json.payload")} data={data} />
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}
