// src/components/dayExplorer/DayExplorerToolbar.tsx
// MUI toolbar for Day Explorer date selection and view switch.

import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import type { I18nKey } from "@/i18n/keys";
import { AppResponsiveTabs, AppToolbar } from "@/components/mui";

type Tab = "summary" | "raw";
type TFn = (key: I18nKey, vars?: Record<string, string | number>) => string;

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
        <AppToolbar
            dense
            start={
                <TextField
                    label={t("days.toolbar.date")}
                    type="date"
                    value={date}
                    onChange={(event) => onDateChange(event.target.value)}
                    sx={{ width: { xs: "100%", sm: 220 } }}
                />
            }
            end={
                <Box sx={{ minWidth: 0, width: { xs: "100%", md: "auto" } }}>
                    <AppResponsiveTabs
                        value={tab}
                        ariaLabel="Day Explorer view"
                        onChange={(next) => onTabChange(next === "raw" ? "raw" : "summary")}
                        tabs={[
                            { value: "summary", label: t("days.toolbar.tab.summary") },
                            { value: "raw", label: t("days.toolbar.tab.raw") },
                        ]}
                        sx={{ borderBottom: 0 }}
                    />
                    {isFetching ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            {t("days.toolbar.loading")}
                        </Typography>
                    ) : null}
                </Box>
            }
        />
    );
}
