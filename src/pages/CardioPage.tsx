// src/pages/CardioPage.tsx
// MUI Cardio page entry. Keeps existing Cardio data flow while using the
// shared MUI page shell for consistent responsive spacing.

import { AppPage } from "@/components/mui";
import { CardioSection } from "@/sections/cardio/CardioSection";

export function CardioPage() {
    return (
        <AppPage
            title="Cardio"
            subtitle="Walking y Running indoor/outdoor guardados dentro del WorkoutDay."
            maxWidth="xl"
        >
            <CardioSection />
        </AppPage>
    );
}
