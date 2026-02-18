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
        <span className="w-full min-w-0 rounded-full border bg-background px-3 py-2 sm:px-4">
            <span className="min-w-0 flex items-center justify-between gap-2">
                {/* Left side: emoji + label */}
                <span className="min-w-0 flex flex-1 items-center gap-2">
                    <span aria-hidden="true" className="shrink-0">
                        {emoji}
                    </span>
                    <span className="min-w-0 truncate text-xs text-muted-foreground sm:text-sm">
                        {label}
                    </span>
                </span>

                {/* Right side: value pinned */}
                <span className="shrink-0 whitespace-nowrap text-xs font-mono tabular-nums text-foreground sm:text-sm">
                    {value ?? "—"}
                </span>
            </span>
        </span>
    );
}
