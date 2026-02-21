import * as React from "react";
import { useAuthStore } from '../state/auth.store';
import { GymTraineeCheckPage } from './GymTraineeCheckPage';
import { RoutineGymCheckPage } from "./RoutineGymCheckPage";

export function GymCheckPage() {
    const user = useAuthStore((s) => s.user);
    const isTrainee = user?.coachMode === "TRAINEE";

    return isTrainee ? <GymTraineeCheckPage /> : <RoutineGymCheckPage />;
}