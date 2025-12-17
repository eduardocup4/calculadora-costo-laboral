import React, { useState } from 'react';
import { 
  TrendingUp, AlertCircle, ArrowRight, Download, Info, FileSpreadsheet, FileText
} from 'lucide-react';
import { formatCurrency, exportToExcel, exportReportPDF } from './utils';

const PredictiveAnalysis = ({ analysis, periodsData, onNewAnalysis }) => {
  const { trendData, bradford } = analysis;
  const [showProjections, setShowProjections] = useState(true);

  // Calcular el máximo para escalar los gráficos CSS
  const maxCost = trendData.length > 0 
    ? Math.max(...trendData.map(d => d.costoTotal)) 
    : 0;

  const historicalData = trendData.filter(d => !d.isProjection);
  const projectionData = trendData.filter(d => d.isProjection);

  const handleExportExcel = () => {
    const excelData = {
      summary: periodsData[periodsData.length - 1]?.results?.summary || { 
        count: 0, ganado: 0, patronal: 0, provisiones: 0, costo: 0, cargas: {} 
      },
      details: trendData.map(t => ({
        periodo: t.monthName,
        costoTotal: t.costoTotal,
        cantidadEmpleados: t.count,
        tipo: t.isProjection ? 'Proyección' : 'Real'
      })),
      analysis: bradford.map(b => ({
        nombre: b.nombre,
        frecuencia: b.frecuencia,
        diasTotales: b.dias,
        scoreBradford: b.score,
        estado: b.score > 250 ? 'Crítico' : b.score > 125 ? 'Atención' : 'Normal'
      }))
    };
    exportToExcel(excelData, 'Analisis_Predictivo_Completo');
  };

  const handleExportPDF = () => {
    const headers = ['Empleado', 'Frecuencia Ausencias', 'Días Totales', 'Score Bradford', 'Estado'];
    const rows = bradford.map(b => [
      b.nombre,
      b.frecuencia,
      b.dias,
      b.score,
      b.score > 250 ? 'Crítico' : b.score > 125 ? 'Atención' : 'Normal'
    ]);
    exportReportPDF('Factor_Bradford_Ausentismo', headers, rows);
  };

  return (
    <div className="animate-fade-in space-y-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-3">
            <TrendingUp className="w-4 h-4" /> Análisis Predictivo
          </div>
          <h2 className="text-4xl font-bold text-slate-800 mb-2">Proyección de Costo Laboral</h2>
          <p className="text-lg text-slate-500">Evolución histórica y proyección a 3 meses</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg font-medium transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2 shadow-lg font-medium transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Gráfico de Tendencias */}
      <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-purple-600" />
              Evolución del Costo Total
            </h3>
            <p className="text-slate-500 mt-1">
              {historicalData.length} periodos históricos • {projectionData.length} proyecciones
            </p>
          </div>
          <button
            onClick={() => setShowProjections(!showProjections)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              showProjections 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {showProjections ? 'Ocultar' : 'Mostrar'} Proyecciones
          </button>
        </div>

        {/* Gráfico de Barras CSS (Responsive) */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px] h-80 flex items-end justify-between gap-3 px-4">
            {trendData.map((item, i) => {
              if (item.isProjection && !showProjections) return null;
              
              return (
                <div key={i} className="flex flex-col items-center gap-3 flex-1 group">
                  <div className="relative w-full flex justify-center items-end h-full">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs py-2 px-3 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-xl">
                      <p className="font-bold mb-1">{item.monthName}</p>
                      <p>{formatCurrency(item.costoTotal)}</p>
                      <p className="text-slate-300">{item.count} empleados</p>
                    </div>
                    
                    {/* La Barra */}
                    <div 
                      className={`w-full max-w-[50px] rounded-t-xl transition-all duration-700 ease-out shadow-lg ${
                        item.isProjection 
                          ? 'bg-gradient-to-t from-purple-300 to-purple-200 border-t-4 border-purple-500 border-dashed hover:from-purple-400 hover:to-purple-300' 
                          : 'bg-gradient-to-t from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600'
                      }`}
                      style={{ 
                        height: maxCost > 0 ? `${(item.costoTotal / maxCost) * 100}%` : '0%',
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  </div>
                  
                  {/* Etiqueta Eje X */}
                  <div className="text-xs font-bold text-slate-600 text-center">
                    <div>{item.monthName}</div>
                    {item.isProjection && (
                      <span className="block text-[10px] font-extrabold text-purple-600 mt-1 px-2 py-0.5 bg-purple-100 rounded-full">
                        PROYECCIÓN
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-purple-600 to-purple-500 rounded"></div>
            <span className="text-sm text-slate-600 font-medium">Datos Reales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-purple-300 to-purple-200 border-2 border-purple-500 border-dashed rounded"></div>
            <span className="text-sm text-slate-600 font-medium">Proyecciones</span>
          </div>
        </div>
      </div>

      {/* Sección Factor Bradford */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Info Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-8 border-2 border-amber-200 shadow-lg">
          <h3 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-7 h-7 text-amber-600" />
            Factor Bradford
          </h3>
          <p className="text-amber-800 text-sm leading-relaxed mb-6">
            El Factor Bradford identifica interrupciones frecuentes de corta duración, que suelen ser más 
            perjudiciales para la productividad que las ausencias largas aisladas.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border-2 border-amber-200">
              <p className="text-xs font-bold text-amber-700 mb-2">FÓRMULA</p>
              <code className="text-sm font-mono text-amber-900 block">
                Score = F² × D
              </code>
              <p className="text-xs text-amber-600 mt-2">
                F = Frecuencia de ausencias<br/>
                D = Días totales de ausencia
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-4 h-4 rounded-full bg-red-500 shadow-md"></span>
                <span className="text-amber-900 font-bold">Crítico (&gt; 250 puntos)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-4 h-4 rounded-full bg-orange-400 shadow-md"></span>
                <span className="text-amber-900 font-bold">Preocupante (125 - 250)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-md"></span>
                <span className="text-amber-900 font-bold">Normal (0 - 124)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Bradford */}
        <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b-2 border-slate-200 bg-slate-50">
            <h3 className="font-bold text-xl text-slate-800">Top 10 Casos de Ausentismo</h3>
            <p className="text-sm text-slate-500 mt-1">Empleados con mayor impacto en productividad</p>
          </div>
          
          {bradford.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-xs border-b-2 border-slate-300">
                  <tr>
                    <th className="px-6 py-4 text-left">Ranking</th>
                    <th className="px-6 py-4 text-left">Empleado</th>
                    <th className="px-6 py-4 text-center">Frecuencia</th>
                    <th className="px-6 py-4 text-center">Días Totales</th>
                    <th className="px-6 py-4 text-center">Score Bradford</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bradford.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          i === 0 ? 'bg-yellow-500' : 
                          i === 1 ? 'bg-slate-400' : 
                          i === 2 ? 'bg-amber-600' : 'bg-slate-300'
                        }`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{b.nombre}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-slate-100 rounded-full font-bold text-slate-700">
                          {b.frecuencia}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-blue-100 rounded-full font-bold text-blue-700">
                          {b.dias}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-2xl font-extrabold text-slate-900">{b.score}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-md ${
                          b.score > 250 ? 'bg-red-100 text-red-700 border-2 border-red-300' : 
                          b.score > 125 ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' : 
                          'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                        }`}>
                          {b.score > 250 ? '🔴 CRÍTICO' : b.score > 125 ? '🟠 ATENCIÓN' : '🟢 NORMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <Info className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 text-lg font-medium mb-2">
                No hay datos de ausentismo disponibles
              </p>
              <p className="text-slate-400 text-sm">
                Carga un archivo de ausentismo en el paso 1 para ver el análisis Bradford
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Insights Automáticos */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
        <div className="flex items-start gap-4">
          <Info className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-xl text-blue-900 mb-4">Insights del Análisis</h3>
            <ul className="space-y-3 text-blue-800">
              {projectionData.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">📈</span>
                  <span>
                    La proyección indica un costo estimado de <strong>{formatCurrency(projectionData[projectionData.length - 1].costoTotal)}</strong> 
                    {' '}para {projectionData[projectionData.length - 1].monthName}.
                  </span>
                </li>
              )}
              {bradford.filter(b => b.score > 250).length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">⚠️</span>
                  <span>
                    <strong>{bradford.filter(b => b.score > 250).length} empleado(s)</strong> en estado crítico de ausentismo. 
                    Requiere intervención inmediata.
                  </span>
                </li>
              )}
              {historicalData.length >= 3 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">📊</span>
                  <span>
                    Tendencia basada en {historicalData.length} periodos históricos con promedio de{' '}
                    <strong>{historicalData[0].count} empleados</strong>.
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">💡</span>
                <span>
                  Considera implementar políticas de asistencia para empleados con scores Bradford superiores a 125.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botón de Retorno */}
      <div className="flex justify-center pt-8">
        <button 
          onClick={onNewAnalysis} 
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl hover:shadow-2xl transition-all font-bold text-lg"
        >
          Volver al Inicio <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PredictiveAnalysis;
