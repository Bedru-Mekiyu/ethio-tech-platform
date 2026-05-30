import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { MarketingLayout } from "@/layouts/MarketingLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ClassroomLayout } from "@/layouts/ClassroomLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { GuestRoute } from "@/routes/GuestRoute";
import { MentorToolsRoute } from "@/routes/MentorToolsRoute";
import { RouteFallback } from "@/components/layout/RouteFallback";
import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { ErrorBoundary } from "@/components/composites/ErrorBoundary";
import { ToastProvider } from "@/components/composites/ToastProvider";
import { OfflineBanner } from "@/components/composites/OfflineBanner";
import { AvatarSyncBootstrap } from "@/components/auth/AvatarSyncBootstrap";
import { useFocusOnRouteChange } from "@/hooks/useFocusOnRouteChange";

const HomePage = lazy(() => import("@/pages/marketing/HomePage").then((module) => ({ default: module.HomePage })));
const AboutPage = lazy(() => import("@/pages/marketing/AboutPage").then((module) => ({ default: module.AboutPage })));
const HowItWorksPage = lazy(() =>
  import("@/pages/marketing/HowItWorksPage").then((module) => ({ default: module.HowItWorksPage }))
);
const HubsPage = lazy(() => import("@/pages/marketing/HubsPage").then((module) => ({ default: module.HubsPage })));
const LeaderboardPage = lazy(() =>
  import("@/pages/marketing/LeaderboardPage").then((module) => ({ default: module.LeaderboardPage }))
);
const FaqPage = lazy(() => import("@/pages/marketing/InfoPages").then((module) => ({ default: module.FaqPage })));
const ContactPage = lazy(() =>
  import("@/pages/marketing/InfoPages").then((module) => ({ default: module.ContactPage }))
);
const CommunityPage = lazy(() =>
  import("@/pages/marketing/InfoPages").then((module) => ({ default: module.CommunityPage }))
);
const ResourcesPage = lazy(() =>
  import("@/pages/marketing/InfoPages").then((module) => ({ default: module.ResourcesPage }))
);
const SupportPage = lazy(() =>
  import("@/pages/marketing/InfoPages").then((module) => ({ default: module.SupportPage }))
);
const MentorsPage = lazy(() =>
  import("@/pages/marketing/MentorsPage").then((module) => ({ default: module.MentorsPage }))
);
const MentorRecruitmentPage = lazy(() =>
  import("@/pages/marketing/MentorRecruitmentPage").then((module) => ({ default: module.MentorRecruitmentPage }))
);
const SuccessStoriesPage = lazy(() =>
  import("@/pages/marketing/InfoPages").then((module) => ({ default: module.SuccessStoriesPage }))
);
const EventsPage = lazy(() =>
  import("@/pages/marketing/InfoPages").then((module) => ({ default: module.EventsPage }))
);
const PrivacyPage = lazy(() =>
  import("@/pages/marketing/InfoPages").then((module) => ({ default: module.PrivacyPage }))
);
const TermsPage = lazy(() => import("@/pages/marketing/InfoPages").then((module) => ({ default: module.TermsPage })));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((module) => ({ default: module.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("@/pages/auth/ResetPasswordPage").then((module) => ({ default: module.ResetPasswordPage }))
);
const ProgressPage = lazy(() =>
  import("@/pages/app/ProgressPage").then((module) => ({ default: module.ProgressPage }))
);
const SquadsListPage = lazy(() =>
  import("@/pages/app/SquadsListPage").then((module) => ({ default: module.SquadsListPage }))
);
const CertificatesPage = lazy(() =>
  import("@/pages/app/CertificatesPage").then((module) => ({ default: module.CertificatesPage }))
);
const RoadmapPage = lazy(() =>
  import("@/pages/app/RoadmapPage").then((module) => ({ default: module.RoadmapPage }))
);
const MentorAvailabilityPage = lazy(() =>
  import("@/pages/mentor/MentorAvailabilityPage").then((module) => ({ default: module.MentorAvailabilityPage }))
);
const StudentDashboardPage = lazy(() =>
  import("@/pages/app/StudentDashboardPage").then((module) => ({ default: module.StudentDashboardPage }))
);
const SettingsPage = lazy(() => import("@/pages/app/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const TracksPage = lazy(() => import("@/pages/app/TracksPage").then((module) => ({ default: module.TracksPage })));
const AssignedProjectsPage = lazy(() =>
  import("@/pages/app/AssignedProjectsPage").then((module) => ({ default: module.AssignedProjectsPage }))
);
const AchievementsPage = lazy(() =>
  import("@/pages/app/AchievementsPage").then((module) => ({ default: module.AchievementsPage }))
);
const ProfilePage = lazy(() => import("@/pages/app/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const ProjectSubmitPage = lazy(() =>
  import("@/pages/app/ProjectSubmitPage").then((module) => ({ default: module.ProjectSubmitPage }))
);
const SquadPage = lazy(() => import("@/pages/app/SquadPage").then((module) => ({ default: module.SquadPage })));
const MentorDashboardPage = lazy(() =>
  import("@/pages/mentor/MentorDashboardPage").then((module) => ({ default: module.MentorDashboardPage }))
);
const MentorSessionsPage = lazy(() =>
  import("@/pages/mentor/MentorSessionsPage").then((module) => ({ default: module.MentorSessionsPage }))
);
const MentorReviewPage = lazy(() =>
  import("@/pages/mentor/MentorReviewPage").then((module) => ({ default: module.MentorReviewPage }))
);
const ClassroomPage = lazy(() =>
  import("@/features/classroom/ClassroomPage").then((module) => ({ default: module.ClassroomPage }))
);
const AdminPage = lazy(() => import("@/pages/admin/AdminPage").then((module) => ({ default: module.AdminPage })));
const AdminUsersPage = lazy(() =>
  import("@/pages/admin/AdminUsersPage").then((module) => ({ default: module.AdminUsersPage }))
);
const AdminModerationPage = lazy(() =>
  import("@/pages/admin/AdminModerationPage").then((module) => ({ default: module.AdminModerationPage }))
);
const AdminOperationsPage = lazy(() =>
  import("@/pages/admin/AdminOperationsPage").then((module) => ({ default: module.AdminOperationsPage }))
);
const AdminContentPage = lazy(() =>
  import("@/pages/admin/AdminContentPage").then((module) => ({ default: module.AdminContentPage }))
);
const AdminGamificationPage = lazy(() =>
  import("@/pages/admin/AdminGamificationPage").then((module) => ({ default: module.AdminGamificationPage }))
);
const TrackDetailPage = lazy(() =>
  import("@/pages/app/TrackDetailPage").then((module) => ({ default: module.TrackDetailPage }))
);
const LessonPage = lazy(() =>
  import("@/pages/app/LessonPage").then((module) => ({ default: module.LessonPage }))
);
const XpHistoryPage = lazy(() =>
  import("@/pages/app/XpHistoryPage").then((module) => ({ default: module.XpHistoryPage }))
);
const NotificationsPage = lazy(() =>
  import("@/pages/app/NotificationsPage").then((module) => ({ default: module.NotificationsPage }))
);
const SessionHistoryPage = lazy(() =>
  import("@/pages/app/SessionHistoryPage").then((module) => ({ default: module.SessionHistoryPage }))
);
const SessionFeedbackPage = lazy(() =>
  import("@/pages/app/SessionFeedbackPage").then((module) => ({ default: module.SessionFeedbackPage }))
);
const ParentDashboardPage = lazy(() =>
  import("@/pages/parent/ParentDashboardPage").then((module) => ({ default: module.ParentDashboardPage }))
);
const CodingWorkspacePage = lazy(() =>
  import("@/pages/app/CodingWorkspacePage").then((module) => ({ default: module.CodingWorkspacePage }))
);
const BlogPage = lazy(() =>
  import("@/pages/marketing/BlogPage").then((module) => ({ default: module.BlogPage }))
);
const PartnersPage = lazy(() =>
  import("@/pages/marketing/PartnersPage").then((module) => ({ default: module.PartnersPage }))
);
const DonationPage = lazy(() =>
  import("@/pages/marketing/DonationPage").then((module) => ({ default: module.DonationPage }))
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 45_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "online",
    },
    mutations: {
      retry: 1,
    },
  },
});

function NavigationManager() {
  useFocusOnRouteChange();
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
      <ToastProvider>
      <AuthBootstrap>
      <AvatarSyncBootstrap />
      <OfflineBanner />
      <BrowserRouter>
        <NavigationManager />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<MarketingLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="how-it-works" element={<HowItWorksPage />} />
              <Route path="mentors" element={<MentorsPage />} />
              <Route path="hubs" element={<HubsPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="mentor-recruitment" element={<MentorRecruitmentPage />} />
              <Route path="success-stories" element={<SuccessStoriesPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="donate" element={<DonationPage />} />
            </Route>
            <Route
              element={
                <GuestRoute>
                  <AuthLayout />
                </GuestRoute>
              }
            >
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="auth/reset-password" element={<ResetPasswordPage />} />
            </Route>
            <Route
              path="/app"
              element={
                <ProtectedRoute roles={["student", "admin", "parent"]}>
                  <DashboardLayout variant="student" />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboardPage />} />
              <Route path="tracks" element={<TracksPage />} />
              <Route path="projects" element={<AssignedProjectsPage />} />
              <Route path="tracks/:trackId" element={<TrackDetailPage />} />
              <Route path="lessons/:lessonId" element={<LessonPage />} />
              <Route path="xp" element={<XpHistoryPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="sessions" element={<SessionHistoryPage />} />
              <Route path="sessions/:sessionId/feedback" element={<SessionFeedbackPage />} />
              <Route path="workspace" element={<CodingWorkspacePage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="squads" element={<SquadsListPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="roadmap" element={<RoadmapPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="projects/submit" element={<ProjectSubmitPage />} />
              <Route path="squads/:id" element={<SquadPage />} />
              <Route path="settings" element={<SettingsPage scope="student" />} />
            </Route>
            <Route
              path="/parent"
              element={
                <ProtectedRoute roles={["parent"]}>
                  <DashboardLayout variant="parent" />
                </ProtectedRoute>
              }
            >
              <Route index element={<ParentDashboardPage />} />
              <Route path="settings" element={<SettingsPage scope="parent" />} />
            </Route>
            <Route
              path="/mentor"
              element={
                <ProtectedRoute roles={["mentor", "admin"]}>
                  <DashboardLayout variant="mentor" />
                </ProtectedRoute>
              }
            >
              <Route index element={<MentorDashboardPage />} />
              <Route element={<MentorToolsRoute />}>
                <Route path="sessions" element={<MentorSessionsPage />} />
                <Route path="reviews" element={<MentorReviewPage />} />
                <Route path="availability" element={<MentorAvailabilityPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage scope="mentor" />} />
              </Route>
            </Route>
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <DashboardLayout variant="admin" />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="moderation" element={<AdminModerationPage />} />
              <Route path="operations" element={<AdminOperationsPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="gamification" element={<AdminGamificationPage />} />
              <Route path="settings" element={<SettingsPage scope="admin" />} />
            </Route>
            <Route
              path="/app/classroom/:sessionId"
              element={
                <ProtectedRoute roles={["student", "mentor", "admin"]}>
                  <ClassroomLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ClassroomPage />} />
            </Route>
            <Route element={<MarketingLayout />}>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      </AuthBootstrap>
      </ToastProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
