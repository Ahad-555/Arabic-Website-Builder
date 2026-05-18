import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "@/pages/login";
import StudentApp from "@/pages/student-app";
import SupervisorApp from "@/pages/supervisor-app";
import PartnerView from "@/pages/partner-view";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

export type StudentSession = { type: "student"; id: number; name: string; major: string; college: string };
export type Session = StudentSession | { type: "supervisor" } | { type: "partner" } | null;

function AppInner() {
  const [session, setSession] = useState<Session>(() => {
    try {
      const s = localStorage.getItem("pulse_session");
      if (!s) return null;
      const parsed = JSON.parse(s);
      // Partner view is never persisted
      if (parsed?.type === "partner") return null;
      return parsed;
    } catch { return null; }
  });

  const login = (s: Session) => {
    setSession(s);
    // Don't persist partner sessions
    if (s?.type !== "partner") {
      localStorage.setItem("pulse_session", JSON.stringify(s));
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("pulse_session");
    queryClient.clear();
  };

  if (!session) return <LoginPage onLogin={login} />;
  if (session.type === "supervisor") return <SupervisorApp onLogout={logout} />;
  if (session.type === "partner") return <PartnerView onBack={logout} />;
  return <StudentApp student={session} onLogout={logout} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
