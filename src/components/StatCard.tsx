// src/components/StatCard.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { themedPanelCard } from "@/theme/cardHierarchy";

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
        <div className={cn("rounded-xl border p-4 min-w-0", themedPanelCard)}>
            <div className="text-sm text-muted-foreground wrap-break-words">{label}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums wrap-break-words">{value}</div>
            {hint ? <div className="mt-2 text-xs text-muted-foreground wrap-break-words">{hint}</div> : null}
        </div>
    );
}