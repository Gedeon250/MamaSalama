import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AppProvider } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./i18n";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/admin/AdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Education from "./pages/Education";
import ArticleDetail from "./pages/ArticleDetail";
import Reminders from "./pages/Reminders";
import Community from "./pages/Community";
import Emergency from "./pages/Emergency";
import Profile from "./pages/Profile";
import Facilities from "./pages/Facilities";
import Settings from "./pages/Settings";
import LanguageSettings from "./pages/LanguageSettings";
import NotificationSettings from "./pages/NotificationSettings";
import PrivacySettings from "./pages/PrivacySettings";
import EditProfile from "./pages/EditProfile";
import ManageChildren from "./pages/ManageChildren";
import LocationSettings from "./pages/LocationSettings";
import Growth from "./pages/Growth";
import Milestones from "./pages/Milestones";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminClients from "./pages/admin/AdminClients";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminVaccinations from "./pages/admin/AdminVaccinations";
import AdminReminders from "./pages/admin/AdminReminders";
import AdminExport from "./pages/admin/AdminExport";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminCases from "./pages/admin/AdminCases";
import AdminCaseChat from "./pages/admin/AdminCaseChat";
import AdminSMS from "./pages/admin/AdminSMS";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation";
import AskAI from "./pages/AskAI";
import ThemeSettings from "./pages/ThemeSettings";
import KickCounter from "./pages/KickCounter";
import BreastfeedingTracker from "./pages/BreastfeedingTracker";
import SleepDiaperTracker from "./pages/SleepDiaperTracker";
import HealthJournal from "./pages/HealthJournal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
      <I18nProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/education" element={
              <ProtectedRoute>
                <Education />
              </ProtectedRoute>
            } />
            <Route path="/education/:id" element={
              <ProtectedRoute>
                <ArticleDetail />
              </ProtectedRoute>
            } />
            <Route path="/reminders" element={
              <ProtectedRoute>
                <Reminders />
              </ProtectedRoute>
            } />
            <Route path="/reminders/:tab" element={
              <ProtectedRoute>
                <Reminders />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } />
            <Route path="/emergency" element={
              <ProtectedRoute>
                <Emergency />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/profile/children" element={
              <ProtectedRoute>
                <ManageChildren />
              </ProtectedRoute>
            } />
            <Route path="/profile/location" element={
              <ProtectedRoute>
                <LocationSettings />
              </ProtectedRoute>
            } />
            <Route path="/facilities" element={
              <ProtectedRoute>
                <Facilities />
              </ProtectedRoute>
            } />
            <Route path="/growth" element={
              <ProtectedRoute>
                <Growth />
              </ProtectedRoute>
            } />
            <Route path="/milestones" element={
              <ProtectedRoute>
                <Milestones />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/settings/language" element={
              <ProtectedRoute>
                <LanguageSettings />
              </ProtectedRoute>
            } />
            <Route path="/settings/notifications" element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            } />
            <Route path="/settings/privacy" element={
              <ProtectedRoute>
                <PrivacySettings />
              </ProtectedRoute>
            } />
            <Route path="/settings/theme" element={
              <ProtectedRoute>
                <ThemeSettings />
              </ProtectedRoute>
            } />
            <Route path="/help" element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/chat/:id" element={
              <ProtectedRoute>
                <ChatConversation />
              </ProtectedRoute>
            } />
            <Route path="/kick-counter" element={
              <ProtectedRoute>
                <KickCounter />
              </ProtectedRoute>
            } />
            <Route path="/breastfeeding" element={
              <ProtectedRoute>
                <BreastfeedingTracker />
              </ProtectedRoute>
            } />
            <Route path="/sleep-diaper" element={
              <ProtectedRoute>
                <SleepDiaperTracker />
              </ProtectedRoute>
            } />
            <Route path="/health-journal" element={
              <ProtectedRoute>
                <HealthJournal />
              </ProtectedRoute>
            } />
            <Route path="/ask-ai" element={
              <ProtectedRoute>
                <AskAI />
              </ProtectedRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
            <Route path="/admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />
            <Route path="/admin/appointments" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
            <Route path="/admin/vaccinations" element={<AdminRoute><AdminVaccinations /></AdminRoute>} />
            <Route path="/admin/reminders" element={<AdminRoute><AdminReminders /></AdminRoute>} />
            <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
            <Route path="/admin/export" element={<AdminRoute><AdminExport /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/cases" element={<AdminRoute><AdminCases /></AdminRoute>} />
            <Route path="/admin/cases/:id" element={<AdminRoute><AdminCaseChat /></AdminRoute>} />
            <Route path="/admin/sms" element={<AdminRoute><AdminSMS /></AdminRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AppProvider>
      </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
