import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import StudentsList from "@/pages/students-list";
import StudentProfile from "@/pages/student-profile";
import StudentSkills from "@/pages/student-skills";
import ProjectsList from "@/pages/projects-list";
import ProjectDetail from "@/pages/project-detail";
import CertificatePage from "@/pages/certificate";
import CertificateVerify from "@/pages/certificate-verify";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={StudentsList} />
        <Route path="/students/:id" component={StudentProfile} />
        <Route path="/students/:id/skills" component={StudentSkills} />
        <Route path="/projects" component={ProjectsList} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/certificate/:id" component={CertificatePage} />
        <Route path="/certificate/verify/:code" component={CertificateVerify} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
