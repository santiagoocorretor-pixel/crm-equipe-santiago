import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart3, Users, Zap, CheckSquare, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface CRMLayoutProps {
  children: React.ReactNode;
  activeTab: "dashboard" | "leads" | "history" | "analytics" | "cadences" | "tasks" | "reports";
}

export default function CRMLayout({ children, activeTab }: CRMLayoutProps) {
  const { user: authUser, logout: authLogout } = useAuth();
  const [, setLocation] = useLocation();
  const [isLocalAuth, setIsLocalAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsLocalAuth(true);
    } else if (!authUser) {
      // Se não houver token local nem usuário do Manus, redireciona para login
      setLocation("/login");
    }
  }, [authUser, setLocation]);

  const handleLogout = async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    await authLogout();
    setLocation("/login");
  };

  // Usuário fictício se estiver usando auth local
  const user = authUser || (isLocalAuth ? { name: "Administrador", email: "admin@vendas.com" } : null);

  if (!user) {
    return null; // O useEffect cuidará do redirecionamento
  }

  const navItems = [
    { id: "dashboard", label: "Painel", icon: BarChart3 },
    { id: "leads", label: "Leads", icon: Users },
    { id: "history", label: "Histórico", icon: Clock },
    { id: "analytics", label: "Análise", icon: TrendingUp },
    { id: "cadences", label: "Cadências", icon: Zap },
    { id: "tasks", label: "Tarefas", icon: CheckSquare },
    { id: "reports", label: "Relatórios", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Barra Lateral */}
      <aside className="w-64 bg-slate-900 text-white shadow-lg fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold truncate">Equipe Santiago</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">CRM de Vendas</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  const routes: Record<string, string> = {
                    dashboard: "/",
                    leads: "/leads",
                    history: "/history",
                    analytics: "/analytics",
                    cadences: "/cadences",
                    tasks: "/tasks",
                    reports: "/reports",
                  };
                  setLocation(routes[item.id]);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900">
          <div className="bg-slate-800 rounded-lg p-3 mb-3">
            <p className="text-xs text-slate-400 mb-1">Usuário Logado</p>
            <p className="text-white font-semibold truncate text-sm">{user.name || user.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-slate-300 hover:bg-red-900/20 hover:text-red-400 justify-start gap-3"
          >
            <LogOut size={18} />
            Sair do Sistema
          </Button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
