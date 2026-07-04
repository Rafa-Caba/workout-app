// src/pages/CardioPage.tsx

/**
 * CardioPage
 *
 * Page entry for the Web Cardio module.
 * Manual-only flow for Web:
 * - pick date
 * - list Cardio sessions saved in WorkoutDay
 * - create / edit / delete manual sessions
 */

import { PageHeader } from "@/components/PageHeader";
import { CardioSection } from "@/sections/cardio/CardioSection";

export function CardioPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Cardio"
                subtitle="Walking y Running indoor/outdoor guardados dentro del WorkoutDay."
            />

            <CardioSection />
        </div>
    );
}
