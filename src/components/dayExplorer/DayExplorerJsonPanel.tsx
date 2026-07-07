// src/components/dayExplorer/DayExplorerJsonPanel.tsx
// Optional MUI JSON helper for Day Explorer debug payloads.

import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { JsonDetails } from "@/components/JsonDetails";
import type { I18nKey } from "@/i18n/keys";
import { AppCard } from "@/components/mui";

type Tab = "summary" | "raw";
type TFn = (key: I18nKey, vars?: Record<string, string | number>) => string;

type JsonPanelError = {
    message?: string;
};

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
    error: JsonPanelError | null;
    isFetching: boolean;
    showFetchingBlock: boolean;
}) {
    async function copyJson() {
        if (!data) return;
        const txt = safeStringify(data);
        try {
            await navigator.clipboard.writeText(txt);
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = txt;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            textArea.remove();
        }
    }

    return (
        <AppCard
            title={tab === "summary" ? t("days.json.summaryTitle") : t("days.json.rawTitle")}
            subtitle={
                runDate
                    ? `${t("days.json.date")}: ${runDate}${isFetching ? ` • ${t("days.json.loading")}` : ""}`
                    : t("days.json.noDate")
            }
            action={
                <Button
                    variant="outlined"
                    onClick={copyJson}
                    disabled={!data}
                    title={!data ? t("days.json.rawTitle") : undefined}
                >
                    {t("days.json.copy")}
                </Button>
            }
        >
            {showFetchingBlock ? (
                <Typography variant="body2" color="text.secondary">
                    {t("days.json.fetching")}
                </Typography>
            ) : error ? (
                <Alert severity="error" variant="outlined">
                    {error.message ?? "Error"}
                </Alert>
            ) : !data ? (
                <Typography variant="body2" color="text.secondary">
                    {t("days.json.empty")}
                </Typography>
            ) : (
                <Box sx={{ minWidth: 0 }}>
                    <JsonDetails title={t("days.json.payload")} data={data} />
                </Box>
            )}
        </AppCard>
    );
}
