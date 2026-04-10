// src/components/bodyMetrics/BodyMetricsIllustration.tsx

import { Activity, Gauge, Ruler } from "lucide-react";

export function BodyMetricsIllustration() {
    return (
        <div className="relative mx-auto h-32 w-36">
            <div className="absolute inset-x-1 top-2 mx-auto h-24 w-24 rounded-full border bg-background" />

            <div className="absolute left-1 top-4 flex h-12 w-12 items-center justify-center rounded-full border bg-card shadow-sm">
                <Gauge className="h-5 w-5 text-primary" />
            </div>

            <div className="absolute right-1 top-7 flex h-12 w-12 items-center justify-center rounded-full border bg-card shadow-sm">
                <Ruler className="h-5 w-5 text-foreground" />
            </div>

            <div className="absolute inset-x-0 bottom-3 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
                <Activity className="h-7 w-7 text-primary" />
            </div>

            <div className="absolute bottom-0 right-5 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
                progreso
            </div>
        </div>
    );
}