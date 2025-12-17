import React from 'react';
import { 
  TrendingUp, Users, Calendar, AlertCircle, 
  ArrowRight, Download 
} from 'lucide-react';
import { formatCurrency } from './utils';

const PredictiveAnalysis = ({ analysis, onNewAnalysis, onExportExcel }) => {
  const { trendData, bradford } = analysis;

  // Calculamos el máximo para escalar los gráficos CSS
  const maxCost = Math.max(...trendData.map(d => d.costoTotal));

  return (
    <div className="animate-fade-in space-y-12">
      
      {/* 1. SECCIÓN DE TENDENCIAS DE COSTO */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Proyección de Costo Laboral
            </h2>
            <p className="text-slate-500">Evolución histórica y proyección a corto plazo.</p>
          </div>
          <button onClick={onExportExcel} className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1">
            <Download className="w-4 h-4" /> Exportar Data
          </button>
        </div>

        {/* Gráfico de Barras CSS (Responsive) */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="min-w-[600px] h-64 flex items-end justify-between gap-4">
            {trendData.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="relative w-full flex justify-center items-end h-full">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                    {formatCurrency(item.costoTotal)}
                  </div>
                  
                  {/* La Barra */}
                  <div 
                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${
                      item.isProjection 
                        ? 'bg-purple-200 hover:bg-purple-300 border-t-2 border-purple-400 dashed' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                    style={{ height: `${(item.costoTotal / maxCost) * 100}%` }}
                  />
                </div>
                {/* Etiqueta Eje X */}
                <div className="text-xs font-medium text-slate-500 text-center">
                  {item.monthName}
                  {item.isProjection && <span className="block text-[10px] text-purple-500">(Est)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN FACTOR BRADFORD (Ausentismo) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-amber-50 rounded-3xl p-8 border border-amber-100">
          <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Factor Bradford
          </h3>
          <p className="text-amber-800 text-sm leading-relaxed mb-6">
            El Factor Bradford identifica interrupciones frecuentes de corta duración, que suelen ser más perjudiciales que las ausencias largas aisladas.
          </p>
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-amber-900 font-medium">Crítico (> 250 puntos)</span>
             </div>
             <div className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                <span className="text-amber-900 font-medium">Preocupante (125 - 250)</span>
             </div>
             <div className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-amber-900 font-medium">Normal (0 - 124)</span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
             <h3 className="font-bold text-slate-800">Top Casos de Ausentismo</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left">Empleado</th>
                <th className="px-6 py-4 text-center">Frecuencia</th>
                <th className="px-6 py-4 text-center">Días Totales</th>
                <th className="px-6 py-4 text-center">Score Bradford</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bradford.length > 0 ? bradford.map((b, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-700">{b.nombre}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{b.frecuencia}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{b.dias}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800">{b.score}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      b.score > 250 ? 'bg-red-100 text-red-700' : 
                      b.score > 125 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {b.score > 250 ? 'Crítico' : b.score > 125 ? 'Atención' : 'Normal'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No hay datos de ausentismo cargados o no se encontraron coincidencias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button onClick={onNewAnalysis} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg">
          Volver al Inicio <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PredictiveAnalysis;