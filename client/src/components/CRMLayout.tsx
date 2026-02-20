import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart3, Users, Zap, CheckSquare, Settings, Clock, TrendingUp } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import NotificationCenter from "./NotificationCenter";

interface CRMLayoutProps {
  children: React.ReactNode;
  activeTab: "dashboard" | "leads" | "history" | "analytics" | "cadences" | "tasks" | "reports";
}

export default function CRMLayout({ children, activeTab }: CRMLayoutProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Manus CRM</h1>
          <p className="text-slate-300 mb-8">Gerencie suas vendas com eficiência</p>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <a href={getLoginUrl()}>Acessar com Manus</a>
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const navItems = [
    { id: "dashboard", label: "Painel", icon: BarChart3 },
    { id: "leads", label: "Leads", icon: Users },
    { id: "brokers", label: "Corretores", icon: Users },
    { id: "history", label: "Histórico", icon: Clock },
    { id: "analytics", label: "Análise", icon: TrendingUp },
    { id: "cadences", label: "Cadências", icon: Zap },
    { id: "tasks", label: "Tarefas", icon: CheckSquare },
    { id: "reports", label: "Relatórios", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Barra Lateral */}
      <aside className="w-64 bg-slate-900 text-white shadow-lg">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold">Manus CRM</h1>
          <p className="text-sm text-slate-400 mt-1">Gestão de Vendas</p>
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
                    brokers: "/brokers",
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
          <button
            onClick={() => setLocation("/funnel-config")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-300 hover:bg-slate-800"
          >
            <Settings size={20} />
            <span>Configurar Funil</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 w-64">
          <div className="bg-slate-800 rounded-lg p-3 mb-3">
            <p className="text-sm text-slate-300">Usuário</p>
            <p className="text-white font-semibold truncate">{user.name || user.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            <LogOut size={18} />
            Sair
          </Button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-auto">
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Manus CRM</h1>
          <NotificationCenter />
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
