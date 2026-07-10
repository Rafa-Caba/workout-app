// /src/App.tsx
// Main route registry for Workout Web.
// Keeps all active pages registered and removes deprecated split Insights routes.

import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AdminPage } from "@/pages/admin/AdminPage";
import { DayExplorerPage } from "@/pages/DayExplorerPage";
import { WeeklySummaryPage } from "@/pages/WeeklySummaryPage";
import { TrendsPage } from "@/pages/TrendsPage";
import { MediaPage } from "@/pages/MediaPage";
import { RoutinesPage } from "@/pages/RoutinesPage";
import { PlanVsActualPage } from "@/pages/PlanVsActualPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { MovementsPage } from "@/pages/MovementsPage";
import { SleepPage } from "@/pages/SleepPage";
import { MyProfilePage } from "@/pages/MyProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { CardioPage } from "@/pages/CardioPage";
import { BodyMetricsPage } from "@/pages/BodyMetricsPage";
import { TrainerDashboardPage } from "@/pages/trainer/TrainerDashboardPage";
import { GymCheckPage } from "@/pages/GymCheckPage";
import { ProgressPage } from "@/pages/ProgressPage";
import { useAuthStore } from "@/state/auth.store";

export default function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />

          <Route path="/me" element={<MyProfilePage />} />
          <Route path="/me/body-metrics" element={<BodyMetricsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route path="/days" element={<DayExplorerPage />} />
          <Route path="/weeks" element={<WeeklySummaryPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/cardio" element={<CardioPage />} />

          {user?.coachMode !== "TRAINEE" ? (
            <Route path="/routines" element={<RoutinesPage />} />
          ) : null}

          <Route path="/plan-vs-actual" element={<PlanVsActualPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/gym-check" element={<GymCheckPage />} />
          <Route path="/movements" element={<MovementsPage />} />
          <Route path="/sleep" element={<SleepPage />} />
          <Route path="/progress" element={<ProgressPage />} />

          {user?.coachMode === "TRAINER" ? (
            <Route path="/trainer" element={<TrainerDashboardPage />} />
          ) : null}

          {user?.role === "admin" ? <Route path="/admin" element={<AdminPage />} /> : null}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
