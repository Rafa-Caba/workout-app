// src/pages/OutdoorPage.tsx

/**
 * OutdoorPage
 *
 * Page entry for the Web Outdoor module.
 * Manual-only flow for Web:
 * - pick date
 * - list outdoor sessions saved in WorkoutDay
 * - create / edit / delete manual sessions
 */

import { PageHeader } from "@/components/PageHeader";
import { OutdoorSection } from "@/sections/outdoor/OutdoorSection";

export function OutdoorPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Outdoor"
                subtitle="Walking y Running manuales guardados dentro del WorkoutDay."
            />

            <OutdoorSection />
        </div>
    );
}