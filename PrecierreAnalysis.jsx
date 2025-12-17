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
        <div className="lg:col-span-2">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Detalle de Variaciones (> 0 Bs)
            </h3>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-4 py-3 text-left">Empleado</th>
                            <th className="px-4 py-3 text-right">Diferencia</th>
                            <th className="px-4 py-3 text-right">% Var</th>
                            <th className="px-4 py-3 text-left">Motivo Probable</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {variations.filter(v => Math.abs(v.diff) > 0).slice(0, 10).map((v, i) => (
                            <tr key={i}>
                                <td className="px-4 py-3 font-medium text-slate-700">{v.nombre}</td>
                                <td className={`px-4 py-3 text-right font-bold ${v.diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {v.diff > 0 ? '+' : ''}{formatCurrency(v.diff)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-500">{formatPercent(v.pct)}</td>
                                <td className="px-4 py-3 text-slate-500 italic">
                                    {v.diff > 0 ? 'Incremento / Bono' : 'Descuento / Baja'}
                                </td>
                            </tr>
                        ))}
                        {variations.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-slate-400">
                                    No hay variaciones individuales registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onNewAnalysis} className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors">
                    Volver
                </button>
                <button className="bg-slate-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 shadow-lg">
                    <Download className="w-4 h-4" /> Descargar Reporte Completo
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrecierreAnalysis;