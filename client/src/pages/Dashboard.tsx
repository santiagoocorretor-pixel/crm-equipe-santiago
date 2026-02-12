import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: funnelStats, isLoading: statsLoading } = trpc.metrics.funnelStats.useQuery();
  const { data: conversionMetrics, isLoading: metricsLoading } = trpc.metrics.conversionMetrics.useQuery({});
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (funnelStats) {
      const leads = funnelStats.reduce((sum, stat) => sum + (stat.count || 0), 0);
      const value = funnelStats.reduce((sum, stat) => sum + (stat.value || 0), 0);
      setTotalLeads(leads);
      setTotalValue(value);
    }
  }, [funnelStats]);

  const conversionRate =
    conversionMetrics && totalLeads > 0
      ? ((conversionMetrics.length / (totalLeads || 1)) * 100).toFixed(1)
      : "0";

  const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#EF4444"];

  return (
    <CRMLayout activeTab="dashboard">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Painel de Controle</h1>
          <p className="text-slate-600 mt-1">Visão geral do seu pipeline de vendas</p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Leads */}
          <Card className="bg-white border-0 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-slate-600 text-sm font-medium block">Total de Leads</span>
                <span className="text-3xl font-bold text-slate-900 mt-2 block">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : totalLeads}
                </span>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          {/* Valor Total */}
          <Card className="bg-white border-0 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-slate-600 text-sm font-medium block">Valor Total</span>
                <span className="text-3xl font-bold text-slate-900 mt-2 block">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    `R$ ${(totalValue / 1000).toFixed(1)}k`
                  )}
                </span>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          {/* Taxa de Conversão */}
          <Card className="bg-white border-0 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-slate-600 text-sm font-medium block">Taxa de Conversão</span>
                <span className="text-3xl font-bold text-slate-900 mt-2 block">
                  {metricsLoading ? <Skeleton className="h-8 w-16" /> : `${conversionRate}%`}
                </span>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </Card>

          {/* Tempo Médio */}
          <Card className="bg-white border-0 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-slate-600 text-sm font-medium block">Tempo Médio/Etapa</span>
                <span className="text-3xl font-bold text-slate-900 mt-2 block">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : "0d"}
                </span>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funil de Vendas */}
          <Card className="bg-white border-0 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Funil de Vendas</h2>
            {statsLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Carregando dados...
              </div>
            ) : funnelStats && funnelStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={funnelStats}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Nenhum dado disponível
              </div>
            )}
          </Card>

          {/* Distribuição por Etapa */}
          <Card className="bg-white border-0 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribuição por Etapa</h2>
            {statsLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Carregando dados...
              </div>
            ) : funnelStats && funnelStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={funnelStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ stageName, count }) => `${stageName}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {funnelStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Nenhum dado disponível
              </div>
            )}
          </Card>
        </div>

        {/* Tabela de Etapas */}
        <Card className="bg-white border-0 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumo das Etapas</h2>
          {statsLoading ? (
            <div className="py-12 text-center text-slate-500">
              Carregando dados...
            </div>
          ) : funnelStats && funnelStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Etapa</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Quantidade</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Valor Total</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Valor Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelStats.map((stat) => (
                    <tr key={stat.stageId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{stat.stageName}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">{stat.count}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">R$ {(stat.value || 0).toLocaleString('pt-BR')}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">
                        R$ {stat.count > 0 ? ((stat.value || 0) / stat.count).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : "0"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Nenhum dado disponível
            </div>
          )}
        </Card>
      </div>
    </CRMLayout>
  );
}
