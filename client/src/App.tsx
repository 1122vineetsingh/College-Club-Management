import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Clubs from "@/pages/clubs";
import Events from "@/pages/events";
import Members from "@/pages/members";
import Reports from "@/pages/reports";
import UserManagement from "@/pages/user-management";
import SystemSettings from "@/pages/system-settings";
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={() => (
        <AppLayout>
          <Dashboard />
        </AppLayout>
      )} />
      <ProtectedRoute path="/clubs" component={() => (
        <AppLayout>
          <Clubs />
        </AppLayout>
      )} />
      <ProtectedRoute path="/events" component={() => (
        <AppLayout>
          <Events />
        </AppLayout>
      )} />
      <ProtectedRoute path="/members" component={() => (
        <AppLayout>
          <Members />
        </AppLayout>
      )} />
      <ProtectedRoute path="/reports" component={() => (
        <AppLayout>
          <Reports />
        </AppLayout>
      )} />
      <ProtectedRoute path="/users" component={() => (
        <AppLayout>
          <UserManagement />
        </AppLayout>
      )} />
      <ProtectedRoute path="/settings" component={() => (
        <AppLayout>
          <SystemSettings />
        </AppLayout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
