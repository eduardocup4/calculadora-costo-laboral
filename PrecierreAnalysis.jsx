import React from 'react';
import { 
  ArrowUpRight, ArrowDownRight, AlertTriangle, 
  CheckCircle, FileText, Download 
} from 'lucide-react';
import { formatCurrency, formatPercent } from './utils';

const PrecierreAnalysis = ({ analysis, periodsData, onNewAnalysis }) => {
  const { generalDiff, alerts, variations } = analysis;
  const currentPeriod = periodsData[periodsData.length - 1];
  const prevPeriod = periodsData[periodsData.length - 2];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold mb-4">
          <CheckCircle className="w-4 h-4" /> Auditoría de Precierre
        </div>
        <h2 className="text-3xl font-bold text-slate-800">
          Comparativa: {prevPeriod.name} vs {currentPeriod.name}
        </h2>
        <p className="text-slate-500 mt-2">Detección automática de variaciones salariales y anomalías.</p>
      </div>

      {/* Tarjeta Principal de Variación */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-xl mb-10">
        <div className="grid grid-cols-3 gap-8 text-center divide-x divide-slate-100">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Costo Anterior</p>
            <p className="text-xl font-bold text-slate-600">{formatCurrency(generalDiff.totalPrevious)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Costo Actual</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(generalDiff.totalCurrent)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Variación Neta</p>
            <div className={`flex items-center justify-center gap-1 text-xl font-bold ${generalDiff.absolute > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {generalDiff.absolute > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              {formatPercent(generalDiff.percentage)}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Alertas Críticas */}
        <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Alertas Detectadas ({alerts.length})
            </h3>
            {alerts.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100">
                    Todo parece correcto. No hay variaciones drásticas.
                </div>
            ) : (
                alerts.map((alert, i) => (
                    <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm">
                        <p className="font-bold text-red-700 mb-1">{alert.type}</p>
                        <p className="text-red-600">{alert.message}</p>
                    </div>
                ))
            )}
        </div>

        {/* Tabla de Variaciones por Persona */}
import React from 'react';
import { UserPlus, UserMinus, AlertTriangle, Download, ArrowRight } from 'lucide-react';
import { formatCurrency, formatPercent, exportReportPDF } from './utils';

const PrecierreAnalysis = ({ analysis, periodsData, onNewAnalysis }) => {
  const { generalDiff, alerts, variations, altas, bajas } = analysis;
  const currentPeriod = periodsData[periodsData.length - 1];
  const prevPeriod = periodsData[periodsData.length - 2];

  const handleDownload = () => {
      const headers = ['Nombre', 'Concepto', 'Anterior', 'Actual', 'Diferencia'];
      const rows = variations.map(v => [v.nombre, v.concepto, formatCurrency(v.anterior), formatCurrency(v.actual), formatCurrency(v.diff)]);
      exportReportPDF(`Auditoria_Precierre_${currentPeriod.name}`, headers, rows);
  };

  return (
    <div className="animate-fade-in space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Auditoría: {prevPeriod.name} vs {currentPeriod.name}</h2>
                <p className="text-slate-500">Variación Neta: <span className={generalDiff.absolute > 0 ? "text-red-500 font-bold" : "text-emerald-500"}>{formatPercent(generalDiff.percentage)}</span></p>
            </div>
            <button onClick={handleDownload} className="btn-primary">
                <Download className="w-4 h-4" /> Reporte Auditoría (PDF)
            </button>
        </div>

        {/* ALTAS Y BAJAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-4">
                    <UserPlus className="w-5 h-5" /> Nuevos Ingresos (Altas)
                </h3>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {altas.map((p, i) => (
                        <li key={i} className="text-sm text-emerald-700 border-b border-emerald-100 pb-1 flex justify-between">
                            <span>{p.nombre}</span> <span className="font-bold">{formatCurrency(p.totalGanado)}</span>
                        </li>
                    ))}
                    {altas.length === 0 && <p className="text-xs opacity-50">No hubo ingresos.</p>}
                </ul>
            </div>
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4">
                    <UserMinus className="w-5 h-5" /> Bajas Detectadas
                </h3>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {bajas.map((p, i) => (
                        <li key={i} className="text-sm text-red-700 border-b border-red-100 pb-1 flex justify-between">
                            <span>{p.nombre}</span> <span className="font-bold">{formatCurrency(p.totalGanado)}</span>
                        </li>
                    ))}
                    {bajas.length === 0 && <p className="text-xs opacity-50">No hubo bajas.</p>}
                </ul>
            </div>
        </div>

        {/* VARIACIONES */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Variaciones Salariales Específicas</h3>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Empleado</th>
                        <th className="px-6 py-4">Concepto</th>
                        <th className="px-6 py-4 text-right">Anterior</th>
                        <th className="px-6 py-4 text-right">Actual</th>
                        <th className="px-6 py-4 text-right">Dif</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {variations.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium">{v.nombre}</td>
                            <td className="px-6 py-4 text-slate-500">{v.concepto}</td>
                            <td className="px-6 py-4 text-right text-slate-400">{formatCurrency(v.anterior)}</td>
                            <td className="px-6 py-4 text-right font-medium">{formatCurrency(v.actual)}</td>
                            <td className={`px-6 py-4 text-right font-bold ${v.diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {formatCurrency(v.diff)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default PrecierreAnalysis;