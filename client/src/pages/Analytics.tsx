import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from "recharts";
import { TrendingUp, Users, Target, Clock, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#EF4444", "#06B6D4", "#14B8A6"];

export default function Analytics() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: funnelStats, isLoading: statsLoading } = trpc.metrics.funnelStats.useQuery();
  const { data: conversionMetrics, isLoading: metricsLoading } = trpc.metrics.conversionMetrics.useQuery({
    fromDate: fromDate ? new Date(fromDate) : undefined,
    toDate: toDate ? new Date(toDate) : undefined,
  });
  const { data: leads } = trpc.leads.list.useQuery({});

  // Processar dados de funil
  const funnelData = funnelStats?.map((stage) => ({
    name: stage.stageName,
    leads: stage.count,
    value: stage.value || 0,
    percentage: funnelStats ? (stage.count / funnelStats.reduce((sum, s) => sum + s.count, 0)) * 100 : 0,
  })) || [];

  // Calcular tempo médio por etapa
  const timePerStage = funnelStats?.map((stage) => {
    const stageConversions = conversionMetrics?.filter((m) => m.toStageId === stage.stageId) || [];
    const avgDays = stageConversions.length > 0
      ? (stageConversions.reduce((sum, c) => sum + (c.daysInStage || 0), 0) / stageConversions.length).toFixed(1)
      : 0;
    return {
      stage: stage.stageName,
      dias: parseFloat(String(avgDays)),
      conversoes: stageConversions.length,
    };
  }) || [];

  // Calcular taxa de conversão por etapa
  const conversionRate = funnelData.map((stage, index) => {
    const nextStage = funnelData[index + 1];
    const rate = nextStage ? ((nextStage.leads / stage.leads) * 100).toFixed(1) : 100;
    return {
      etapa: stage.name,
      taxa: parseFloat(String(rate)),
    };
  });

  // Distribuição de leads por origem
  const leadsByOrigin = leads
    ? Object.entries(
        leads.reduce(
          (acc, lead) => {
            const origin = lead.origin || "Sem origem";
            acc[origin] = (acc[origin] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([origin, count]) => ({
        name: origin,
        value: count,
      }))
    : [];

  // Distribuição de leads por fonte
  const leadsBySource = leads
    ? Object.entries(
        leads.reduce(
          (acc, lead) => {
            const source = lead.source || "Sem fonte";
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([source, count]) => ({
        name: source,
        value: count,
      }))
    : [];

  // Valor total por etapa
  const valuePerStage = funnelData.map((stage) => ({
    etapa: stage.name,
    valor: stage.value,
  }));

  // Métricas principais
  const totalLeads = funnelData.reduce((sum, stage) => sum + stage.leads, 0);
  const totalValue = funnelData.reduce((sum, stage) => sum + stage.value, 0);
  const avgConversionRate = conversionRate.length > 0
    ? (conversionRate.reduce((sum, c) => sum + c.taxa, 0) / conversionRate.length).toFixed(1)
    : 0;
  const avgTimePerStage = timePerStage.length > 0
    ? (timePerStage.reduce((sum, t) => sum + t.dias, 0) / timePerStage.length).toFixed(1)
    : 0;

  return (
    <CRMLayout activeTab="leads">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Análise Avançada</h1>
          <p className="text-slate-600 mt-1">Métricas detalhadas do seu funil de vendas</p>
        </div>

        {/* Filtros */}
        <Card className="bg-white border-0 shadow-sm p-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-900 mb-2">Data Inicial</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-900 mb-2">Data Final</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total de Leads</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : totalLeads}
                </p>
              </div>
              <Users className="text-blue-600" size={40} />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Valor Total</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    `R$ ${(totalValue / 1000).toFixed(1)}k`
                  )}
                </p>
              </div>
              <DollarSign className="text-green-600" size={40} />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Taxa de Conversão Média</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {metricsLoading ? <Skeleton className="h-8 w-12" /> : `${avgConversionRate}%`}
                </p>
              </div>
              <TrendingUp className="text-purple-600" size={40} />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Tempo Médio/Etapa</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {metricsLoading ? <Skeleton className="h-8 w-12" /> : `${avgTimePerStage}d`}
                </p>
              </div>
              <Clock className="text-orange-600" size={40} />
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
            ) : funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                  <Bar dataKey="leads" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Nenhum dado disponível
              </div>
            )}
          </Card>

          {/* Valor por Etapa */}
          <Card className="bg-white border-0 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Valor por Etapa</h2>
            {statsLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Carregando dados...
              </div>
            ) : valuePerStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={valuePerStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="etapa" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                  <Area type="monotone" dataKey="valor" fill="#10B981" stroke="#059669" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Nenhum dado disponível
              </div>
            )}
          </Card>

          {/* Tempo Médio por Etapa */}
          <Card className="bg-white border-0 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tempo Médio por Etapa (dias)</h2>
            {metricsLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Carregando dados...
              </div>
            ) : timePerStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={timePerStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                  <Legend />
                  <Bar dataKey="dias" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="conversoes" stroke="#F59E0B" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Nenhum dado disponível
              </div>
            )}
          </Card>

          {/* Taxa de Conversão */}
          <Card className="bg-white border-0 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Taxa de Conversão por Etapa (%)</h2>
            {metricsLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Carregando dados...
              </div>
            ) : conversionRate.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={conversionRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="etapa" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                  <Line type="monotone" dataKey="taxa" stroke="#EC4899" strokeWidth={2} dot={{ fill: "#EC4899" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Nenhum dado disponível
              </div>
            )}
          </Card>

          {/* Distribuição por Origem */}
          {leadsByOrigin.length > 0 && (
            <Card className="bg-white border-0 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribuição por Origem</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadsByOrigin}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadsByOrigin.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Distribuição por Fonte */}
          {leadsBySource.length > 0 && (
            <Card className="bg-white border-0 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribuição por Fonte</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadsBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Tabela de Resumo */}
        <Card className="bg-white border-0 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumo do Funil</h2>
          {statsLoading ? (
            <div className="py-12 text-center text-slate-500">
              Carregando dados...
            </div>
          ) : funnelData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Etapa</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Leads</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Percentual</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Valor Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Valor Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelData.map((stage) => (
                    <tr key={stage.name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-900 font-medium">{stage.name}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{stage.leads}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{stage.percentage.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right text-slate-600">R$ {stage.value.toLocaleString("pt-BR")}</td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        R$ {stage.leads > 0 ? (stage.value / stage.leads).toLocaleString("pt-BR") : "0"}
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
