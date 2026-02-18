import React from "react";

export function StatCard({
    label,
    value,
    hint,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    hint?: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-card p-4 min-w-0">
            <div className="text-sm text-muted-foreground wrap-break-words">{label}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums wrap-break-words">{value}</div>
            {hint ? <div className="mt-2 text-xs text-muted-foreground wrap-break-words">{hint}</div> : null}
        </div>
    );
}
