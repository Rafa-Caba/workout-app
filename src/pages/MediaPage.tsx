import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMedia } from "@/hooks/useMedia";
import { useMediaStats } from "@/hooks/useMediaStats";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { JsonDetails } from "@/components/JsonDetails";
import { StatCard } from "@/components/StatCard";
import { useI18n } from "@/i18n/I18nProvider";
import type { MediaFeedItem } from "@/types/media.types";

import { MediaCard } from "@/components/media/MediaCard";
import { MediaViewerModal } from "@/components/media/MediaViewerModal";

type Tab = "browse" | "stats";
type MediaSource = "all" | "day" | "routine";

export function MediaPage() {
    const { t } = useI18n();
    const today = React.useMemo(() => new Date(), []);

    const [tab, setTab] = React.useState<Tab>("browse");

    // Shared source filter for both tabs
    const [source, setSource] = React.useState<MediaSource>("all");

    // Browse state
    const [cursor, setCursor] = React.useState<string | null>(null);
    const [pages, setPages] = React.useState<MediaFeedItem[][]>([]);
    const [nextCursor, setNextCursor] = React.useState<string | null>(null);

    const mediaQuery = useMedia({
        source,
        cursor: cursor ?? undefined,
        limit: 50,
    });

    // Stats state
    const [from, setFrom] = React.useState(() => format(today, "yyyy-MM-dd"));
    const [to, setTo] = React.useState(() => format(today, "yyyy-MM-dd"));
    const [runFrom, setRunFrom] = React.useState(from);
    const [runTo, setRunTo] = React.useState(to);

    const statsEnabled = tab === "stats" && Boolean(runFrom) && Boolean(runTo);
    const statsQuery = useMediaStats(runFrom, runTo, statsEnabled, source);

    // viewer
    const [selected, setSelected] = React.useState<MediaFeedItem | null>(null);

    // Only toast when user initiated an action
    const lastBrowseActionRef = React.useRef<"first" | "next" | null>(null);
    const lastStatsToastKeyRef = React.useRef<string>("");

    // Auto-load browse once (no toast)
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

    // Browse: auto-load on first enter + on source changes
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

    // Browse: append pages when data arrives
    React.useEffect(() => {
        if (!mediaQuery.data) return;

        const items = mediaQuery.data.items ?? [];
        const nc = mediaQuery.data.nextCursor ?? null;

        setPages((prev) => {
            if (cursor === null) return [items];
            return [...prev, items];
        });

        setNextCursor(nc);

        if (lastBrowseActionRef.current === "first") toast.success(t("media.toast.loaded", { count: items.length }));
        if (lastBrowseActionRef.current === "next") toast.success(t("media.toast.nextLoaded", { count: items.length }));

        lastBrowseActionRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaQuery.dataUpdatedAt]);

    React.useEffect(() => {
        if (mediaQuery.isError) toast.error(mediaQuery.error.message);
    }, [mediaQuery.isError, mediaQuery.error]);

    // Stats: AUTO-RUN when user changes from/to (debounced), and also when source changes (debounced)
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
            // re-run stats for new source
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

    const allItems = pages.flat();

    return (
        <div className="space-y-6">
            <PageHeader title={t("pages.media.title")} subtitle={t("pages.media.subtitle")} />

            <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant={tab === "browse" ? "default" : "outline"} onClick={() => setTab("browse")}>
                        {t("tabs.browse")}
                    </Button>
                    <Button variant={tab === "stats" ? "default" : "outline"} onClick={() => setTab("stats")}>
                        {t("tabs.stats")}
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t("media.sourceLabel")}</span>

                    <Button size="sm" variant={source === "all" ? "default" : "outline"} onClick={() => setSource("all")}>
                        {t("media.source.all")}
                    </Button>
                    <Button size="sm" variant={source === "day" ? "default" : "outline"} onClick={() => setSource("day")}>
                        {t("media.source.day")}
                    </Button>
                    <Button
                        size="sm"
                        variant={source === "routine" ? "default" : "outline"}
                        onClick={() => setSource("routine")}
                    >
                        {t("media.source.routine")}
                    </Button>
                </div>

                {tab === "browse" ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={loadNextPage}
                            disabled={!nextCursor || mediaQuery.isFetching}
                            title={!nextCursor ? t("media.noNextCursorHint") : ""}
                        >
                            {t("media.nextPage")}
                        </Button>

                        <span className="text-xs text-muted-foreground">
                            {t("media.loadedItems")}: <span className="font-mono">{allItems.length}</span>
                            {nextCursor ? (
                                <>
                                    {" "}
                                    • {t("media.nextCursor")}: <span className="font-mono">{nextCursor}</span>
                                </>
                            ) : null}
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="text-sm">
                            {t("common.from")}{" "}
                            <input
                                type="date"
                                className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                        </label>

                        <label className="text-sm">
                            {t("common.to")}{" "}
                            <input
                                type="date"
                                className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </label>

                        <span className="text-xs text-muted-foreground">
                            {t("week.loaded")}: <span className="font-mono">{runFrom}</span> → <span className="font-mono">{runTo}</span>
                        </span>
                    </div>
                )}
            </div>

            {tab === "browse" ? (
                <div className="space-y-4">
                    {mediaQuery.isError ? <JsonDetails title={t("common.errorTitle")} data={mediaQuery.error} defaultOpen /> : null}

                    {allItems.length === 0 && !mediaQuery.isFetching ? (
                        <EmptyState title={t("media.empty.title")} description={t("media.empty.desc")} />
                    ) : null}

                    {allItems.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-3">
                            <StatCard label={t("media.kpi.itemsTotal")} value={allItems.length} />
                            <StatCard label={t("media.kpi.pages")} value={pages.length} />
                            <StatCard label={t("media.kpi.nextCursor")} value={nextCursor ?? "—"} />
                        </div>
                    ) : null}

                    {allItems.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {allItems.map((item) => (
                                <MediaCard
                                    key={`${item.publicId}-${item.createdAt}`}
                                    item={item}
                                    onOpen={(it) => setSelected(it as MediaFeedItem)}
                                />
                            ))}
                        </div>
                    ) : null}

                    {Boolean(mediaQuery.data) ? <JsonDetails title={t("media.debug.browseTitle")} data={mediaQuery.data} /> : null}
                </div>
            ) : (
                <div className="space-y-4">
                    {statsQuery.isError ? <JsonDetails title={t("common.errorTitle")} data={statsQuery.error} defaultOpen /> : null}

                    {!statsQuery.data && !statsQuery.isFetching ? (
                        <EmptyState title={t("media.stats.empty.title")} description={t("media.stats.empty.desc")} />
                    ) : null}

                    {statsQuery.data ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <StatCard label={t("media.stats.total")} value={statsQuery.data.totals.items} />
                                <StatCard label={t("media.stats.images")} value={statsQuery.data.totals.images} />
                                <StatCard label={t("media.stats.videos")} value={statsQuery.data.totals.videos} />
                            </div>

                            <div className="rounded-xl border bg-card overflow-hidden">
                                <div className="p-4 border-b">
                                    <div className="text-sm font-semibold">Por día</div>
                                    <div className="text-xs text-muted-foreground">
                                        {statsQuery.data.range.from} → {statsQuery.data.range.to}
                                    </div>
                                </div>

                                <div className="p-4 overflow-auto">
                                    {statsQuery.data.byDay.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">Sin datos en el rango.</div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="text-left text-muted-foreground">
                                                <tr>
                                                    <th className="py-2 pr-4">{t("common.date")}</th>
                                                    <th className="py-2 pr-4">{t("media.stats.total")}</th>
                                                    <th className="py-2 pr-4">{t("media.stats.images")}</th>
                                                    <th className="py-2">{t("media.stats.videos")}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {statsQuery.data.byDay.map((r) => (
                                                    <tr key={r.date} className="border-t">
                                                        <td className="py-2 pr-4 font-mono">{r.date}</td>
                                                        <td className="py-2 pr-4">{r.items}</td>
                                                        <td className="py-2 pr-4">{r.images}</td>
                                                        <td className="py-2">{r.videos}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            <JsonDetails title={t("media.debug.statsTitle")} data={statsQuery.data} />
                        </>
                    ) : null}
                </div>
            )}

            {selected ? <MediaViewerModal item={selected} onClose={() => setSelected(null)} /> : null}
        </div>
    );
}
