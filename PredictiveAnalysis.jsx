import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, AlertCircle, ArrowRight, Download, Info, FileSpreadsheet, FileText,
  Calendar, BarChart3, Users, Building, Briefcase
} from 'lucide-react';
import { formatCurrency, exportToExcel, exportReportPDF, analyzeSeniorityProjection, MONTHS } from './utils';

const PredictiveAnalysis = ({ analysis, periodsData, onNewAnalysis }) => {
  const { trendData, bradford, statsTable } = analysis;
  const [showProjections, setShowProjections] = useState(true);
  const [seniorityAnalysis, setSeniorityAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('trends');
  const [seniorityView, setSeniorityView] = useState('person');

  useEffect(() => {
    if(periodsData && periodsData.length > 0) {
      const lastPeriod = periodsData[periodsData.length - 1];
      const analysis = analyzeSeniorityProjection(lastPeriod.data, lastPeriod.mapping || {});
      setSeniorityAnalysis(analysis);
    }
  }, [periodsData]);

  const maxCost = trendData.length > 0 ? Math.max(...trendData.map(d => d.costoTotal)) : 0;
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
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-3">
            <TrendingUp className="w-4 h-4" /> Análisis Predictivo
          </div>
          <h2 className="text-4xl font-bold text-slate-800 mb-2">Proyección de Costo Laboral</h2>
          <p className="text-lg text-slate-500">Evolución histórica y proyección a 3 meses</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportExcel} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg font-medium transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleExportPDF} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2 shadow-lg font-medium transition-all">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Preview de Periodos Cargados */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h3 className="font-bold text-lg text-blue-900">Periodos Cargados</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {periodsData.map((p, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-blue-200 text-center">
              <p className="text-xs text-blue-600 font-bold mb-1">{MONTHS[p.month - 1]}</p>
              <p className="text-lg font-extrabold text-blue-900">{p.year}</p>
              <p className="text-xs text-slate-500 mt-1">{p.results.summary.count} empl.</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-slate-200">
        {[
          { id: 'trends', label: 'Tendencias', icon: TrendingUp },
          { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
          { id: 'bradford', label: 'Bradford', icon: AlertCircle },
          { id: 'seniority', label: 'Proyección Antigüedad', icon: Calendar }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${activeTab === tab.id ? 'border-b-4 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Tendencias */}
      {activeTab === 'trends' && (
        <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-purple-600" />
                Evolución del Costo Total
              </h3>
              <p className="text-slate-500 mt-1">{historicalData.length} periodos históricos • {projectionData.length} proyecciones</p>
            </div>
            <button onClick={() => setShowProjections(!showProjections)} className={`px-4 py-2 rounded-xl font-medium transition-all ${showProjections ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {showProjections ? 'Ocultar' : 'Mostrar'} Proyecciones
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px] h-80 flex items-end justify-between gap-3 px-4">
              {trendData.map((item, i) => {
                if (item.isProjection && !showProjections) return null;
                return (
                  <div key={i} className="flex flex-col items-center gap-3 flex-1 group">
                    <div className="relative w-full flex justify-center items-end h-full">
                      <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs py-2 px-3 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-xl">
                        <p className="font-bold mb-1">{item.monthName}</p>
                        <p>{formatCurrency(item.costoTotal)}</p>
                        <p className="text-slate-300">{item.count} empleados</p>
                      </div>
                      <div className={`w-full max-w-[50px] rounded-t-xl transition-all duration-700 ease-out shadow-lg ${item.isProjection ? 'bg-gradient-to-t from-purple-300 to-purple-200 border-t-4 border-purple-500 border-dashed hover:from-purple-400 hover:to-purple-300' : 'bg-gradient-to-t from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600'}`}
                        style={{ height: maxCost > 0 ? `${(item.costoTotal / maxCost) * 100}%` : '0%', animationDelay: `${i * 0.1}s` }}
                      />
                    </div>
                    <div className="text-xs font-bold text-slate-600 text-center">
                      <div>{item.monthName}</div>
                      {item.isProjection && <span className="block text-[10px] font-extrabold text-purple-600 mt-1 px-2 py-0.5 bg-purple-100 rounded-full">PROYECCIÓN</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
      )}

      {/* TAB: Estadísticas por Grupo */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
          <div className="p-6 border-b-2 border-slate-200 bg-slate-50">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Estadísticas por Grupo (Ordenado Mayor a Menor)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-xs border-b-2 border-slate-300">
                <tr>
                  <th className="px-6 py-4 text-left sticky left-0 bg-slate-100">Grupo / Área</th>
                  {statsTable.length > 0 && statsTable[0].periodKeys.map((pk, i) => (
                    <th key={i} className="px-6 py-4 text-right">{pk}</th>
                  ))}
                  <th className="px-6 py-4 text-right bg-blue-50">Total</th>
                  <th className="px-6 py-4 text-right bg-emerald-50">Tendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsTable.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900 sticky left-0 bg-white">{row.grupo}</td>
                    {row.periodKeys.map((pk, j) => (
                      <td key={j} className="px-6 py-4 text-right text-slate-700">{formatCurrency(row.periods[pk])}</td>
                    ))}
                    <td className="px-6 py-4 text-right font-extrabold text-blue-900 bg-blue-50">{formatCurrency(row.total)}</td>
                    <td className={`px-6 py-4 text-right font-bold bg-emerald-50 ${row.trend > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {row.trend > 0 ? '↑' : '↓'} {Math.abs(row.trend).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Bradford */}
      {activeTab === 'bradford' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-8 border-2 border-amber-200 shadow-lg">
            <h3 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-7 h-7 text-amber-600" />
              Factor Bradford
            </h3>
            <p className="text-amber-800 text-sm leading-relaxed mb-6">
              El Factor Bradford identifica interrupciones frecuentes de corta duración, que suelen ser más perjudiciales para la productividad.
            </p>
            <div className="bg-white p-4 rounded-xl border-2 border-amber-200 mb-4">
              <p className="text-xs font-bold text-amber-700 mb-2">FÓRMULA</p>
              <code className="text-sm font-mono text-amber-900 block">Score = F² × D</code>
              <p className="text-xs text-amber-600 mt-2">F = Frecuencia | D = Días</p>
            </div>
            <div className="space-y-3">
              {[
                { color: 'red', label: 'Crítico (&gt; 250)', icon: '🔴' },
                { color: 'orange', label: 'Atención (125-250)', icon: '🟠' },
                { color: 'emerald', label: 'Normal (0-124)', icon: '🟢' }
              ].map(({color, label, icon}) => (
                <div key={color} className="flex items-center gap-3 text-sm">
                  <span className={`w-4 h-4 rounded-full bg-${color}-500 shadow-md`}></span>
                  <span className="text-amber-900 font-bold">{icon} {label.replace('&gt;', '>')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b-2 border-slate-200 bg-slate-50">
              <h3 className="font-bold text-xl text-slate-800">Top 10 Casos de Ausentismo</h3>
            </div>
            {bradford.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-xs">
                    <tr>
                      <th className="px-6 py-4 text-left">Ranking</th>
                      <th className="px-6 py-4 text-left">Empleado</th>
                      <th className="px-6 py-4 text-center">Frecuencia</th>
                      <th className="px-6 py-4 text-center">Días</th>
                      <th className="px-6 py-4 text-center">Score</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bradford.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${i < 3 ? (i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-600') : 'bg-slate-300'}`}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{b.nombre}</td>
                        <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-slate-100 rounded-full font-bold">{b.frecuencia}</span></td>
                        <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-blue-100 rounded-full font-bold text-blue-700">{b.dias}</span></td>
                        <td className="px-6 py-4 text-center text-2xl font-extrabold">{b.score}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-4 py-2 rounded-full text-xs font-bold ${b.score > 250 ? 'bg-red-100 text-red-700' : b.score > 125 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {b.score > 250 ? '🔴 CRÍTICO' : b.score > 125 ? '🟠 ATENCIÓN' : '🟢 NORMAL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center"><Info className="w-16 h-16 text-slate-300 mx-auto mb-4" /><p className="text-slate-400">No hay datos de ausentismo</p></div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Proyección Antigüedad (NUEVO) */}
      {activeTab === 'seniority' && seniorityAnalysis && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border-2 border-indigo-200">
            <h3 className="font-bold text-xl text-indigo-900 mb-2 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Proyección de Costo de Bono Antigüedad
            </h3>
            <p className="text-indigo-700">Análisis de incremento proyectado: Actual, 3m, 6m, 12m, 24m, 36m</p>
          </div>

          <div className="flex gap-2 border-b-2 border-slate-200">
            {[
              { id: 'person', label: 'Por Persona', icon: Users },
              { id: 'group', label: 'Por Grupo', icon: Building },
              { id: 'unit', label: 'Por Unidad', icon: Building },
              { id: 'position', label: 'Por Cargo', icon: Briefcase }
            ].map(tab => (
              <button key={tab.id} onClick={() => setSeniorityView(tab.id)} className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${seniorityView === tab.id ? 'border-b-4 border-indigo-600 text-indigo-700' : 'text-slate-500'}`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {seniorityView === 'person' && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-xs">
                    <tr>
                      <th className="px-6 py-4 text-left">Nombre</th>
                      <th className="px-6 py-4 text-left">Cargo</th>
                      <th className="px-6 py-4 text-right">Actual</th>
                      <th className="px-6 py-4 text-right">3 meses</th>
                      <th className="px-6 py-4 text-right">6 meses</th>
                      <th className="px-6 py-4 text-right">12 meses</th>
                      <th className="px-6 py-4 text-right">24 meses</th>
                      <th className="px-6 py-4 text-right">36 meses</th>
                      <th className="px-6 py-4 text-right bg-emerald-50">Incremento Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {seniorityAnalysis.byPerson.slice(0, 20).map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium">{p.nombre}</td>
                        <td className="px-6 py-4 text-slate-600">{p.cargo}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(p.actual)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(p.m3)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(p.m6)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(p.m12)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(p.m24)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(p.m36)}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-700 bg-emerald-50">
                          +{formatCurrency(p.incremento36m)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {seniorityView === 'group' && (
            <GroupSeniorityTable data={Object.entries(seniorityAnalysis.byGroup).sort((a,b) => b[1].m36 - a[1].m36)} />
          )}

          {seniorityView === 'unit' && (
            <GroupSeniorityTable data={Object.entries(seniorityAnalysis.byUnidadNegocio).sort((a,b) => b[1].m36 - a[1].m36)} />
          )}

          {seniorityView === 'position' && (
            <GroupSeniorityTable data={Object.entries(seniorityAnalysis.byCargo).sort((a,b) => b[1].m36 - a[1].m36)} />
          )}
        </div>
      )}

      <div className="flex justify-center pt-8">
        <button onClick={onNewAnalysis} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl hover:shadow-2xl transition-all font-bold text-lg">
          Volver al Inicio <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const GroupSeniorityTable = ({ data }) => (
  <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-xs">
          <tr>
            <th className="px-6 py-4 text-left">Nombre</th>
            <th className="px-6 py-4 text-center">Empleados</th>
            <th className="px-6 py-4 text-right">Actual</th>
            <th className="px-6 py-4 text-right">3m</th>
            <th className="px-6 py-4 text-right">6m</th>
            <th className="px-6 py-4 text-right">12m</th>
            <th className="px-6 py-4 text-right">24m</th>
            <th className="px-6 py-4 text-right">36m</th>
            <th className="px-6 py-4 text-right bg-emerald-50">Incremento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(([name, values], i) => (
            <tr key={i} className="hover:bg-slate-50">
              <td className="px-6 py-4 font-bold">{name}</td>
              <td className="px-6 py-4 text-center">{values.count}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(values.actual)}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(values.m3)}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(values.m6)}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(values.m12)}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(values.m24)}</td>
              <td className="px-6 py-4 text-right font-bold">{formatCurrency(values.m36)}</td>
              <td className="px-6 py-4 text-right font-bold text-emerald-700 bg-emerald-50">
                +{formatCurrency(values.m36 - values.actual)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default PredictiveAnalysis;
