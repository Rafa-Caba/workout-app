import React from "react";

export function EmptyState({
    title,
    description,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-card p-5 sm:p-6 text-center">
            <div className="text-base font-semibold">{title}</div>
            {description ? <div className="mt-2 text-sm text-muted-foreground">{description}</div> : null}
        </div>
    );
}
