// src/pages/MediaPage.tsx
// MUI media explorer and media statistics page. Data hooks and API contracts remain unchanged.

import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { JsonDetails } from "@/components/JsonDetails";
import { MediaCard } from "@/components/media/MediaCard";
import { MediaViewerModal } from "@/components/media/MediaViewerModal";
import { AppCard, AppEmptyState, AppMetricCard, AppPage, AppResponsiveTabs, AppToolbar } from "@/components/mui";
import { useI18n } from "@/i18n/I18nProvider";
import { useMedia } from "@/hooks/useMedia";
import { useMediaStats } from "@/hooks/useMediaStats";
import type { MediaFeedItem } from "@/types/media.types";

type Tab = "browse" | "stats";
type MediaSource = "all" | "day" | "routine";

export function MediaPage() {
    const { t } = useI18n();
    const today = React.useMemo(() => new Date(), []);
    const [tab, setTab] = React.useState<Tab>("browse");
    const [source, setSource] = React.useState<MediaSource>("all");
    const [cursor, setCursor] = React.useState<string | null>(null);
    const [pages, setPages] = React.useState<MediaFeedItem[][]>([]);
    const [nextCursor, setNextCursor] = React.useState<string | null>(null);

    const mediaQuery = useMedia({ source, cursor: cursor ?? undefined, limit: 50 });

    const [from, setFrom] = React.useState(() => format(today, "yyyy-MM-dd"));
    const [to, setTo] = React.useState(() => format(today, "yyyy-MM-dd"));
    const [runFrom, setRunFrom] = React.useState(from);
    const [runTo, setRunTo] = React.useState(to);

    const statsEnabled = tab === "stats" && Boolean(runFrom) && Boolean(runTo);
    const statsQuery = useMediaStats(runFrom, runTo, statsEnabled, source);
    const [selected, setSelected] = React.useState<MediaFeedItem | null>(null);

    const lastBrowseActionRef = React.useRef<"first" | "next" | null>(null);
    const lastStatsToastKeyRef = React.useRef<string>("");
    const didAutoLoadBrowseRef = React.useRef(false);

    function loadFirstPage(opts?: { silent?: boolean }) {
        setPages([]);
        setNextCursor(null);
        setCursor(null);
        lastBrowseActionRef.current = opts?.silent ? null : "first";
        void mediaQuery.refetch();
    }

    function loadNextPage() {
        if (!nextCursor) return;
        lastBrowseActionRef.current = "next";
        setCursor(nextCursor);
    }

    React.useEffect(() => {
        if (tab !== "browse") return;
        if (didAutoLoadBrowseRef.current) return;
        didAutoLoadBrowseRef.current = true;
        loadFirstPage({ silent: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    React.useEffect(() => {
        if (tab !== "browse") return;
        loadFirstPage({ silent: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, tab]);

    React.useEffect(() => {
        if (!mediaQuery.data) return;
        const items = mediaQuery.data.items ?? [];
        const next = mediaQuery.data.nextCursor ?? null;

        setPages((previousPages) => {
            if (cursor === null) return [items];
            return [...previousPages, items];
        });
        setNextCursor(next);

        if (lastBrowseActionRef.current === "first") toast.success(t("media.toast.loaded", { count: items.length }));
        if (lastBrowseActionRef.current === "next") toast.success(t("media.toast.nextLoaded", { count: items.length }));
        lastBrowseActionRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaQuery.dataUpdatedAt]);

    React.useEffect(() => {
        if (mediaQuery.isError) toast.error(mediaQuery.error.message);
    }, [mediaQuery.isError, mediaQuery.error]);

    React.useEffect(() => {
        if (tab !== "stats") return;
        const handle = window.setTimeout(() => {
            if (!from || !to) return;
            setRunFrom(from);
            setRunTo(to);
        }, 450);
        return () => window.clearTimeout(handle);
    }, [from, to, tab]);

    React.useEffect(() => {
        if (tab !== "stats") return;
        const handle = window.setTimeout(() => {
            setRunFrom(from);
            setRunTo(to);
        }, 250);
        return () => window.clearTimeout(handle);
    }, [source, tab, from, to]);

    React.useEffect(() => {
        if (!statsQuery.isSuccess) return;
        const key = `${runFrom}:${runTo}:${source}`;
        if (lastStatsToastKeyRef.current !== key) {
            lastStatsToastKeyRef.current = key;
            toast.success(t("media.stats.toast.loaded"));
        }
    }, [statsQuery.isSuccess, runFrom, runTo, source, t]);

    React.useEffect(() => {
        if (statsQuery.isError) toast.error(statsQuery.error.message);
    }, [statsQuery.isError, statsQuery.error]);

    const allItems = React.useMemo(() => {
        const seen = new Set<string>();
        const deduped: MediaFeedItem[] = [];

        for (const item of pages.flat()) {
            const key = item.publicId.trim().length > 0 ? item.publicId : `${item.url}:${item.createdAt}`;
            if (seen.has(key)) continue;
            seen.add(key);
            deduped.push(item);
        }

        return deduped;
    }, [pages]);

    return (
        <AppPage title={t("pages.media.title")} subtitle={t("pages.media.subtitle")}>
            <AppToolbar>
                <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1.25 }}>
                    <AppResponsiveTabs
                        value={tab}
                        ariaLabel="Media tabs"
                        onChange={(value) => setTab(value as Tab)}
                        tabs={[
                            { value: "browse", label: t("tabs.browse") },
                            { value: "stats", label: t("tabs.stats") },
                        ]}
                        variant="scrollable"
                    />

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{t("media.sourceLabel")}</Typography>
                        {([
                            { value: "all" as const, label: t("media.source.all") },
                            { value: "day" as const, label: t("media.source.day") },
                            { value: "routine" as const, label: t("media.source.routine") },
                        ]).map((option) => (
                            <Button
                                key={option.value}
                                size="small"
                                variant={source === option.value ? "contained" : "outlined"}
                                onClick={() => setSource(option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Box>

                    {tab === "browse" ? (
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 1 }}>
                            <Button variant="outlined" onClick={loadNextPage} disabled={!nextCursor || mediaQuery.isFetching} title={!nextCursor ? t("media.noNextCursorHint") : ""}>
                                {t("media.nextPage")}
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                                {t("media.loadedItems")}: <strong>{allItems.length}</strong>
                                {nextCursor ? <> · {t("media.nextCursor")}: <Box component="span" sx={{ fontFamily: "monospace" }}>{nextCursor}</Box></> : null}
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 1 }}>
                            <TextField label={t("common.from")} type="date" value={from} onChange={(event) => setFrom(event.target.value)} size="small" />
                            <TextField label={t("common.to")} type="date" value={to} onChange={(event) => setTo(event.target.value)} size="small" />
                            <Chip label={`${t("week.loaded")}: ${runFrom} → ${runTo}`} size="small" />
                        </Box>
                    )}
                </Box>
            </AppToolbar>

            {tab === "browse" ? (
                <>
                    {mediaQuery.isError ? <JsonDetails title={t("common.errorTitle")} data={mediaQuery.error} defaultOpen /> : null}

                    {allItems.length === 0 && !mediaQuery.isFetching ? (
                        <AppEmptyState title={t("media.empty.title")} description={t("media.empty.desc")} />
                    ) : null}

                    {allItems.length > 0 ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1 }}>
                            <AppMetricCard label={t("media.kpi.itemsTotal")} value={allItems.length} compact />
                            <AppMetricCard label={t("media.kpi.pages")} value={pages.length} compact />
                            <AppMetricCard label={t("media.kpi.nextCursor")} value={nextCursor ?? "—"} compact />
                        </Box>
                    ) : null}

                    {allItems.length > 0 ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }, gap: { xs: 1, md: 1.25 } }}>
                            {allItems.map((item) => (
                                <MediaCard key={`${item.publicId}-${item.createdAt}`} item={item} onOpen={(nextItem) => setSelected(nextItem as MediaFeedItem)} />
                            ))}
                        </Box>
                    ) : null}

                    {Boolean(mediaQuery.data) ? <JsonDetails title={t("media.debug.browseTitle")} data={mediaQuery.data} /> : null}
                </>
            ) : (
                <>
                    {statsQuery.isError ? <JsonDetails title={t("common.errorTitle")} data={statsQuery.error} defaultOpen /> : null}

                    {!statsQuery.data && !statsQuery.isFetching ? (
                        <AppEmptyState title={t("media.stats.empty.title")} description={t("media.stats.empty.desc")} />
                    ) : null}

                    {statsQuery.data ? (
                        <>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1 }}>
                                <AppMetricCard label={t("media.stats.total")} value={statsQuery.data.totals.items} />
                                <AppMetricCard label={t("media.stats.images")} value={statsQuery.data.totals.images} />
                                <AppMetricCard label={t("media.stats.videos")} value={statsQuery.data.totals.videos} />
                            </Box>

                            <AppCard title="Por día" subtitle={`${statsQuery.data.range.from} → ${statsQuery.data.range.to}`}>
                                {statsQuery.data.byDay.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">Sin datos en el rango.</Typography>
                                ) : (
                                    <TableContainer sx={{ overflowX: "auto" }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>{t("common.date")}</TableCell>
                                                    <TableCell>{t("media.stats.total")}</TableCell>
                                                    <TableCell>{t("media.stats.images")}</TableCell>
                                                    <TableCell>{t("media.stats.videos")}</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {statsQuery.data.byDay.map((row) => (
                                                    <TableRow key={row.date}>
                                                        <TableCell sx={{ fontFamily: "monospace" }}>{row.date}</TableCell>
                                                        <TableCell>{row.items}</TableCell>
                                                        <TableCell>{row.images}</TableCell>
                                                        <TableCell>{row.videos}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </AppCard>

                            <JsonDetails title={t("media.debug.statsTitle")} data={statsQuery.data} />
                        </>
                    ) : null}
                </>
            )}

            {selected ? <MediaViewerModal item={selected} onClose={() => setSelected(null)} /> : null}
        </AppPage>
    );
}
