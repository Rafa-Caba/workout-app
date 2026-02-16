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
        null
        // <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        //     <div className="space-y-1">
        //         <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        //         {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        //     </div>

        //     {right ? <div className="flex items-center gap-2">{right}</div> : null}
        // </div>
    );
}
