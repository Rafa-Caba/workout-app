import React from "react";

export function PageHeader({
    title,
    subtitle,
    right,
}: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    right?: React.ReactNode;
}) {
    return (
        <div className="w-full min-w-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
                <h1 className="min-w-0 wrap-break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                    {title}
                </h1>
                {subtitle ? (
                    <p className="min-w-0 wrap-break-words text-sm text-muted-foreground sm:text-base">
                        {subtitle}
                    </p>
                ) : null}
            </div>

            {right ? (
                <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
                    {right}
                </div>
            ) : null}
        </div>
    );
}
