import React from "react";

export function DaySessionBadge({
    emoji,
    label,
    value,
}: {
    emoji: string;
    label: string;
    value: string | null;
}) {
    return (
        <span className="w-full rounded-full border bg-background px-3 py-2">
            <span className="flex items-center justify-between gap-2">
                {/* Left side: emoji + label */}
                <span className="flex items-center gap-2 min-w-0 flex-1">
                    <span aria-hidden="true" className="shrink-0">
                        {emoji}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                        {label}
                    </span>
                </span>

                {/* Right side: value pinned */}
                <span className="text-xs font-mono tabular-nums text-foreground shrink-0 whitespace-nowrap">
                    {value ?? "—"}
                </span>
            </span>
        </span>
    );
}
