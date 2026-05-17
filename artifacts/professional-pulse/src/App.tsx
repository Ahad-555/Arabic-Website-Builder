import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "@/pages/login";
import StudentApp from "@/pages/student-app";
import SupervisorApp from "@/pages/supervisor-app";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

export type StudentSession = { type: "student"; id: number; name: string; major: string; college: string };
export type Session = StudentSession | { type: "supervisor" } | null;

function AppInner() {
  const [session, setSession] = useState<Session>(() => {
    try {
      const s = localStorage.getItem("pulse_session");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const login = (s: Session) => {
    setSession(s);
    localStorage.setItem("pulse_session", JSON.stringify(s));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("pulse_session");
    queryClient.clear();
  };

  if (!session) return <LoginPage onLogin={login} />;
  if (session.type === "supervisor") return <SupervisorApp onLogout={logout} />;
  return <StudentApp student={session} onLogout={logout} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
