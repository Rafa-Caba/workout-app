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
        <div className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
    );
}
