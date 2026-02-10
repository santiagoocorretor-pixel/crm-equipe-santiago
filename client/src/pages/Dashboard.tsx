import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, Target, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: funnelStats, isLoading: statsLoading } = trpc.metrics.funnelStats.useQuery();
  const { data: conversionMetrics, isLoading: metricsLoading } = trpc.metrics.conversionMetrics.useQuery({});
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (funnelStats) {
      const leads = funnelStats.reduce((sum, stage) => sum + stage.count, 0);
      const value = funnelStats.reduce((sum, stage) => sum + stage.value, 0);
      setTotalLeads(leads);
      setTotalValue(value);
    }
  }, [funnelStats]);

  const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#6B7280"];

  const conversionRate = conversionMetrics && conversionMetrics.length > 0
    ? ((conversionMetrics.length / (totalLeads || 1)) * 100).toFixed(1)
    : "0";

  const avgTimeInStage = conversionMetrics && conversionMetrics.length > 0
    ? (conversionMetrics.reduce((sum, m) => sum + (m.daysInStage || 0), 0) / conversionMetrics.length).toFixed(1)
    : "0";

  return (
    <CRMLayout activeTab="dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Visão geral do seu pipeline de vendas</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total de Leads</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{statsLoading ? <Skeleton className="h-8 w-16" /> : totalLeads}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Valor Total</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {statsLoading ? <Skeleton className="h-8 w-20" /> : `R$ ${(totalValue / 1000).toFixed(1)}k`}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metricsLoading ? <Skeleton className="h-8 w-16" /> : `${conversionRate}%`}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Target className="text-purple-600" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Tempo Médio/Etapa</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metricsLoading ? <Skeleton className="h-8 w-16" /> : `${avgTimeInStage}d`}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funil de Vendas */}
          <Card className="p-6 bg-white border-0 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Funil de Vendas</h2>
            {statsLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : funnelStats && funnelStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stageName" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Nenhum lead registrado
              </div>
            )}
          </Card>

          {/* Distribuição por Etapa */}
          <Card className="p-6 bg-white border-0 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribuição por Etapa</h2>
            {statsLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : funnelStats && funnelStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={funnelStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ stageName, count }) => `${stageName}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {funnelStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Nenhum lead registrado
              </div>
            )}
          </Card>
        </div>

        {/* Detalhes do Funil */}
        <Card className="p-6 bg-white border-0 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Detalhes do Funil</h2>
          {statsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : funnelStats && funnelStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Etapa</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Quantidade</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Valor Total</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelStats.map((stage, index) => (
                    <tr key={stage.stageId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-900 font-medium">{stage.stageName}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">{stage.count}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">R$ {(stage.value / 1000).toFixed(1)}k</td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">
                        {((stage.count / (totalLeads || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Nenhum lead registrado
            </div>
          )}
        </Card>
      </div>
    </CRMLayout>
  );
}
