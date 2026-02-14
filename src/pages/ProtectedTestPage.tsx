import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDaySummary } from "@/hooks/useDaySummary";
import type { ApiError } from "@/api/httpErrors";

export function ProtectedTestPage() {
    const [date, setDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"));
    const [runDate, setRunDate] = React.useState<string | null>(null);

    const query = useDaySummary(runDate ?? "");

    React.useEffect(() => {
        if (query.isSuccess) toast.success("Success");
    }, [query.isSuccess]);

    React.useEffect(() => {
        if (query.isError) {
            const err = query.error;
            toast.error(err.message, {
                description: err.status ? `HTTP ${err.status}` : undefined,
            });
        }
    }, [query.isError, query.error]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">Protected Test</h1>
                <p className="text-sm text-muted-foreground">
                    Step 0.6: React Query hook + stable query key.
                </p>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="text-sm">
                        Date{" "}
                        <input
                            className="ml-2 rounded-md border bg-background px-3 py-2 text-sm"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            placeholder="YYYY-MM-DD"
                        />
                    </label>

                    <Button
                        onClick={() => setRunDate(date)}
                        disabled={!date || query.isFetching}
                    >
                        {query.isFetching ? "Loading..." : "Call /workout/days/:date/summary"}
                    </Button>

                    {runDate && (
                        <Button
                            variant="outline"
                            onClick={() => query.refetch()}
                            disabled={query.isFetching}
                            title="Refetch"
                        >
                            Refetch
                        </Button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    Query key: <span className="font-mono">[&quot;daySummary&quot;, date]</span>
                </p>
            </div>

            <div className="rounded-xl border bg-card p-4">
                {!runDate && <p className="text-sm text-muted-foreground">No result yet.</p>}

                {query.isFetching && (
                    <p className="text-sm text-muted-foreground">Fetching…</p>
                )}

                {query.isError && (
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(query.error, null, 2)}
                    </pre>
                )}

                {query.isSuccess && (
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(query.data, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    );
}
