// src/components/weeklySummary/SessionTypeSummaryTable.tsx
// Shared session-type distribution table for month, week, and date-range summaries.

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { AppCard } from "@/components/mui";
import type { I18nKey } from "@/i18n/translations";
import type { WeekBySessionTypeRow } from "@/utils/summaryPeriods/weeksExplorer";

type Props = {
    rows: readonly WeekBySessionTypeRow[];
    t: (key: I18nKey) => string;
};

function formatStatValue(value: number | "—" | undefined): string {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Number(value.toFixed(2)).toString();
    }

    return "—";
}

export function SessionTypeSummaryTable(props: Props) {
    const { rows, t } = props;
    const hasMediaCount = rows.some((row) => typeof row.mediaCount === "number");

    if (rows.length === 0) return null;

    return (
        <AppCard title={t("weeks.byType.title")} padding="sm">
            <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 620 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t("weeks.byType.type")}</TableCell>
                            <TableCell align="right">{t("weeks.byType.sessions")}</TableCell>
                            <TableCell align="right">{t("weeks.byType.durationMin")}</TableCell>
                            <TableCell align="right">{t("weeks.byType.kcal")}</TableCell>
                            {hasMediaCount ? (
                                <TableCell align="right">{t("weeks.byType.media")}</TableCell>
                            ) : null}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={`${row.sessionType}-${index}`}>
                                <TableCell>{row.sessionType}</TableCell>
                                <TableCell align="right">{formatStatValue(row.sessionsCount)}</TableCell>
                                <TableCell align="right">{formatStatValue(row.durationMinutes)}</TableCell>
                                <TableCell align="right">{formatStatValue(row.activeKcal)}</TableCell>
                                {hasMediaCount ? (
                                    <TableCell align="right">{formatStatValue(row.mediaCount)}</TableCell>
                                ) : null}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </AppCard>
    );
}
