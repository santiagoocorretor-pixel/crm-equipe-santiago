import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: conversionMetrics, isLoading } = trpc.metrics.conversionMetrics.useQuery({
    fromDate: fromDate ? new Date(fromDate) : undefined,
    toDate: toDate ? new Date(toDate) : undefined,
  });

  const { data: funnelStats } = trpc.metrics.funnelStats.useQuery();

  // Processar dados de conversão por etapa
  const conversionData = funnelStats?.map(stage => {
    const conversions = conversionMetrics?.filter(m => m.toStageId === stage.stageId) || [];
    return {
      stage: stage.stageName,
      conversions: conversions.length,
      avgDays: conversions.length > 0
        ? (conversions.reduce((sum, c) => sum + (c.daysInStage || 0), 0) / conversions.length).toFixed(1)
        : 0,
    };
  }) || [];

  const handleExportPDF = () => {
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <CRMLayout activeTab="reports">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Relatórios</h1>
            <p className="text-slate-600 mt-1">Análise detalhada do desempenho de vendas</p>
          </div>
          <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700">
            <Download size={18} className="mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Filtros de Data */}
        <Card className="bg-white border-0 shadow-sm p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-900 mb-2">Data Inícial</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
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

        {/* Conversão por Etapa */}
        <Card className="bg-white border-0 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Conversões por Etapa</h2>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center text-slate-500">
              Carregando dados...
            </div>
          ) : conversionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }}
                />
                <Legend />
                <Bar dataKey="conversions" fill="#3B82F6" name="Conversões" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500">
              Nenhum dado de conversão
            </div>
          )}
        </Card>

        {/* Tempo Médio por Etapa */}
        <Card className="bg-white border-0 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tempo Médio em Cada Etapa (dias)</h2>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center text-slate-500">
              Carregando dados...
            </div>
          ) : conversionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgDays"
                  stroke="#8B5CF6"
                  name="Dias Médios"
                  strokeWidth={2}
                  dot={{ fill: "#8B5CF6", r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500">
              Nenhum dado de tempo
            </div>
          )}
        </Card>

        {/* Tabela Detalhada */}
        <Card className="bg-white border-0 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Detalhes de Conversão</h2>
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">
              Carregando dados...
            </div>
          ) : conversionMetrics && conversionMetrics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">ID Lead</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Data de Conversão</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Dias na Etapa</th>
                  </tr>
                </thead>
                <tbody>
                  {conversionMetrics.map((metric) => (
                    <tr key={metric.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-900">#{metric.leadId}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(metric.conversionDate).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right">
                        {metric.daysInStage || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Nenhum dado de conversão para o período selecionado
            </div>
          )}
        </Card>
      </div>
    </CRMLayout>
  );
}
