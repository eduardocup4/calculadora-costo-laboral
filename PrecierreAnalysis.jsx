import React, { useState } from 'react';
import { UserPlus, UserMinus, AlertTriangle, Download, ArrowRight, TrendingUp, TrendingDown, FileSpreadsheet, FileText, Info, Filter } from 'lucide-react';
import { formatCurrency, formatPercent, exportReportPDF, exportToExcel } from './utils';

const PrecierreAnalysis = ({ analysis, periodsData, onNewAnalysis }) => {
  const { generalDiff, alerts, variaciones, variacionesNoSalariales, altas, bajas } = analysis;
  const currentPeriod = periodsData[periodsData.length - 1];
  const prevPeriod = periodsData[periodsData.length - 2];
  const [selectedAlert, setSelectedAlert] = useState('all');
  const [selectedVariante, setSelectedVariante] = useState('all');

  const handleDownloadPDF = () => {
      const headers = ['Nombre', 'Ocupación', 'Variante', 'Anterior', 'Actual', 'Diferencia', 'Variación %'];
      const rows = variaciones.map(v => [
        v.nombre, 
        v.cargo,
        v.variante,
        typeof v.anterior === 'number' ? formatCurrency(v.anterior) : v.anterior,
        typeof v.actual === 'number' ? formatCurrency(v.actual) : v.actual,
        formatCurrency(v.diff),
        formatPercent(v.pct)
      ]);
      exportReportPDF(`Auditoria_Precierre_${currentPeriod.name}`, headers, rows);
  };

  const handleDownloadExcel = () => {
      const excelData = {
        summary: {
          count: 1,
          ganado: 0,
          patronal: 0,
          provisiones: 0,
          costo: generalDiff.totalCurrent,
          cargas: { cns: 0, afp: 0, solidario: 0, vivienda: 0 }
        },
        details: variaciones.map(v => ({
          nombre: v.nombre,
          ocupacion: v.cargo,
          variante: v.variante,
          anterior: v.anterior,
          actual: v.actual,
          diferencia: v.diff,
          porcentaje: v.pct
        })),
        analysis: [
          { Métrica: 'Costo Anterior', Valor: generalDiff.totalPrevious },
          { Métrica: 'Costo Actual', Valor: generalDiff.totalCurrent },
          { Métrica: 'Variación Absoluta', Valor: generalDiff.absolute },
          { Métrica: 'Variación %', Valor: generalDiff.percentage },
          { Métrica: 'Total Altas', Valor: altas.length },
          { Métrica: 'Total Bajas', Valor: bajas.length },
          { Métrica: 'Total Variaciones', Valor: variaciones.length }
        ]
      };
      exportToExcel(excelData, `Precierre_${currentPeriod.name}`);
  };

  const filteredAlerts = selectedAlert === 'all' ? alerts : alerts.filter(a => a.severity === selectedAlert);
  
  const variantes = ['all', ...new Set(variaciones.map(v => v.variante))];
  const filteredVariaciones = selectedVariante === 'all' ? variaciones : variaciones.filter(v => v.variante === selectedVariante);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold mb-3">
            <AlertTriangle className="w-4 h-4" /> Auditoría de Precierre
          </div>
          <h2 className="text-4xl font-bold text-slate-800 mb-2">
            {prevPeriod.name} vs {currentPeriod.name}
          </h2>
          <p className="text-lg text-slate-500">
            Variación Neta: 
            <span className={`font-bold ml-2 ${generalDiff.absolute > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {generalDiff.absolute > 0 ? '+' : ''}{formatPercent(generalDiff.percentage)}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadExcel} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg font-medium transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleDownloadPDF} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg font-medium transition-all">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="py-4 md:py-0">
            <p className="text-sm text-slate-500 font-medium mb-2">Costo Periodo Anterior</p>
            <p className="text-3xl font-bold text-slate-700">{formatCurrency(generalDiff.totalPrevious)}</p>
            <p className="text-xs text-slate-400 mt-1">{prevPeriod.name}</p>
          </div>
          <div className="py-4 md:py-0">
            <p className="text-sm text-slate-500 font-medium mb-2">Costo Periodo Actual</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(generalDiff.totalCurrent)}</p>
            <p className="text-xs text-slate-400 mt-1">{currentPeriod.name}</p>
          </div>
          <div className="py-4 md:py-0">
            <p className="text-sm text-slate-500 font-medium mb-2">Variación Neta</p>
            <div className={`flex items-center justify-center gap-2 text-3xl font-bold ${generalDiff.absolute > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {generalDiff.absolute > 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
              {formatPercent(Math.abs(generalDiff.percentage))}
            </div>
            <p className={`text-sm font-medium mt-2 ${generalDiff.absolute > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {generalDiff.absolute > 0 ? '+' : ''}{formatCurrency(generalDiff.absolute)}
            </p>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              Alertas Detectadas ({filteredAlerts.length})
            </h3>
            <select value={selectedAlert} onChange={(e) => setSelectedAlert(e.target.value)} className="px-4 py-2 border-2 border-amber-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none">
              <option value="all">Todas las alertas</option>
              <option value="high">Solo críticas</option>
              <option value="medium">Solo advertencias</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAlerts.map((alert, i) => (
              <div key={i} className={`p-4 rounded-xl border-2 ${alert.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
                  <div>
                    <p className={`font-bold text-sm mb-1 ${alert.severity === 'high' ? 'text-red-900' : 'text-amber-900'}`}>{alert.type}</p>
                    <p className={`text-sm ${alert.severity === 'high' ? 'text-red-700' : 'text-amber-700'}`}>{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border-2 border-emerald-200 shadow-lg">
          <h3 className="font-bold text-xl text-emerald-900 flex items-center gap-2 mb-5">
            <UserPlus className="w-6 h-6 text-emerald-600" /> Nuevos Ingresos ({altas.length})
          </h3>
          {altas.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {altas.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-100 hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-medium text-slate-900">{p.nombre}</p>
                    <p className="text-xs text-slate-500">{p.cargo}</p>
                  </div>
                  <span className="font-bold text-emerald-700">{formatCurrency(p.totalGanado)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center"><Info className="w-12 h-12 text-emerald-300 mx-auto mb-3" /><p className="text-sm text-emerald-600">No se registraron nuevos ingresos</p></div>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border-2 border-red-200 shadow-lg">
          <h3 className="font-bold text-xl text-red-900 flex items-center gap-2 mb-5">
            <UserMinus className="w-6 h-6 text-red-600" /> Bajas Detectadas ({bajas.length})
          </h3>
          {bajas.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {bajas.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-red-100 hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-medium text-slate-900">{p.nombre}</p>
                    <p className="text-xs text-slate-500">{p.cargo}</p>
                  </div>
                  <span className="font-bold text-red-700">{formatCurrency(p.totalGanado)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center"><Info className="w-12 h-12 text-red-300 mx-auto mb-3" /><p className="text-sm text-red-600">No se detectaron bajas</p></div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b-2 border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl text-slate-800">Variaciones Salariales ({filteredVariaciones.length})</h3>
            <p className="text-sm text-slate-500 mt-1">Análisis por variante</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <select value={selectedVariante} onChange={(e) => setSelectedVariante(e.target.value)} className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="all">Todas las variantes</option>
              {variantes.filter(v => v !== 'all').map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-xs border-b-2 border-slate-300">
              <tr>
                <th className="px-6 py-4 text-left">Empleado</th>
                <th className="px-6 py-4 text-left">Ocupación</th>
                <th className="px-6 py-4 text-left">Variante</th>
                <th className="px-6 py-4 text-right">Valor Anterior</th>
                <th className="px-6 py-4 text-right">Valor Actual</th>
                <th className="px-6 py-4 text-right">Diferencia</th>
                <th className="px-6 py-4 text-right">Variación %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVariaciones.length > 0 ? filteredVariaciones.map((v, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{v.nombre}</td>
                  <td className="px-6 py-4 text-slate-600">{v.cargo}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{v.variante}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-medium">
                    {typeof v.anterior === 'number' ? formatCurrency(v.anterior) : v.anterior}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-900 font-bold">
                    {typeof v.actual === 'number' ? formatCurrency(v.actual) : v.actual}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${v.diff > 0 ? 'text-red-600' : v.diff < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {v.diff > 0 ? '+' : ''}{formatCurrency(v.diff)}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${v.pct > 0 ? 'text-red-600' : v.pct < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {v.pct > 0 ? '+' : ''}{formatPercent(v.pct)}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="px-6 py-12 text-center"><Info className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">No hay variaciones para esta variante</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {variacionesNoSalariales && variacionesNoSalariales.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-lg overflow-hidden">
          <div className="p-6 border-b-2 border-purple-200 bg-purple-50">
            <h3 className="font-bold text-xl text-purple-900">Variaciones NO Salariales ({variacionesNoSalariales.length})</h3>
            <p className="text-sm text-purple-700 mt-1">Cambios de cargo, área o unidad de negocio</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-purple-100 text-purple-700 uppercase font-bold text-xs border-b-2 border-purple-300">
                <tr>
                  <th className="px-6 py-4 text-left">Empleado</th>
                  <th className="px-6 py-4 text-left">Tipo de Cambio</th>
                  <th className="px-6 py-4 text-left">Valor Anterior</th>
                  <th className="px-6 py-4 text-left">Valor Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {variacionesNoSalariales.map((v, i) => (
                  <tr key={i} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{v.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">{v.tipo}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{v.anterior}</td>
                    <td className="px-6 py-4 font-bold text-purple-900">{v.actual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-8">
        <button onClick={onNewAnalysis} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl hover:shadow-2xl transition-all font-bold text-lg">
          Nuevo Análisis <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PrecierreAnalysis;
