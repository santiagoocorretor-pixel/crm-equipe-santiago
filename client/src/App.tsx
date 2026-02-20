import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Cadences from "./pages/Cadences";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import FunnelConfig from "./pages/FunnelConfig";
import Brokers from "./pages/Brokers";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Route component={Login} />;
  }

  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/leads"} component={Leads} />
      <Route path={"/history"} component={History} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/cadences"} component={Cadences} />
      <Route path={"/tasks"} component={Tasks} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/funnel-config"} component={FunnelConfig} />
      <Route path={"/brokers"} component={Brokers} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
