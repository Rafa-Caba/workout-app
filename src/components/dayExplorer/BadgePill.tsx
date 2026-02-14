import React from "react";

export function BadgePill({
    emoji,
    label,
    value,
}: {
    emoji: string;
    label: string;
    value: string | null;
}) {
    return (
        <span className="w-full flex items-center justify-between gap-3 rounded-full border bg-background px-3 py-2">
            <span className="flex items-center gap-2 min-w-0 flex-1">
                <span aria-hidden="true" className="shrink-0">
                    {emoji}
                </span>
                <span className="text-xs text-muted-foreground truncate">{label}</span>
            </span>

            <span className="text-xs font-mono tabular-nums text-foreground shrink-0">
                {value ?? "—"}
            </span>
        </span>
    );
}
