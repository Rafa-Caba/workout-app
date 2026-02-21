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
import { InsightsStreaksPage } from "@/pages/InsightsStreaksPage";
import { InsightsPRsPage } from "@/pages/InsightsPRsPage";
import { InsightsRecoveryPage } from "@/pages/InsightsRecoveryPage";
import { MovementsPage } from "@/pages/MovementsPage";
import { SleepPage } from "@/pages/SleepPage";
import { MyProfilePage } from "@/pages/MyProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";

import { TrainerDashboardPage } from "@/pages/trainer/TrainerDashboardPage";

import { useAuthStore } from "@/state/auth.store";
import { GymCheckPage } from "./pages/GymCheckPage";

export default function App() {
  const user = useAuthStore((s) => s.user);

  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />

          <Route path="/me" element={<MyProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route path="/days" element={<DayExplorerPage />} />
          <Route path="/weeks" element={<WeeklySummaryPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/media" element={<MediaPage />} />

          {user?.coachMode !== "TRAINEE" && (
            <Route path="/routines" element={<RoutinesPage />} />
          )}
          <Route path="/plan-vs-actual" element={<PlanVsActualPage />} />

          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/insights/streaks" element={<InsightsStreaksPage />} />
          <Route path="/insights/prs" element={<InsightsPRsPage />} />
          <Route path="/insights/recovery" element={<InsightsRecoveryPage />} />

          <Route path="/gym-check" element={<GymCheckPage />} />
          <Route path="/movements" element={<MovementsPage />} />
          <Route path="/sleep" element={<SleepPage />} />

          {/* Trainer */}
          {user?.coachMode === "TRAINER" ? (
            <Route path="/trainer" element={<TrainerDashboardPage />} />
          ) : null}

          {user?.role === "admin" && (
            <Route path="/admin" element={<AdminPage />} />
          )}
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}