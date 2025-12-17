import React from 'react';
import { Users, Scale, ArrowLeft, TrendingUp, AlertCircle, Award, FileSpreadsheet, FileText } from 'lucide-react';
import { formatCurrency, formatPercent, exportToExcel, exportReportPDF } from './utils';

const EquityAnalysis = ({ analysis, results, onBack }) => {
  const { byGender, gap, avgM, avgF, medianM, medianF, roleAnalysis, bySeniority } = analysis;

  const handleExportExcel = () => {
    const excelData = {
      summary: results?.summary || { count: 0, ganado: 0, patronal: 0, provisiones: 0, costo: 0, cargas: {} },
      details: roleAnalysis.map(r => ({
        cargo: r.cargo,
        promedioSalarial: r.avgSalary,
        totalEmpleados: r.count,
        hombres: r.M,
        mujeres: r.F,
        brechaGenero: r.genderGap
      })),
      analysis: [
        { Métrica: 'Brecha Salarial de Género', Valor: `${gap.toFixed(2)}%` },
        { Métrica: 'Salario Promedio Hombres', Valor: avgM },
        { Métrica: 'Salario Promedio Mujeres', Valor: avgF },
        { Métrica: 'Mediana Hombres', Valor: medianM },
        { Métrica: 'Mediana Mujeres', Valor: medianF },
        { Métrica: 'Total Hombres', Valor: byGender.M.count },
        { Métrica: 'Total Mujeres', Valor: byGender.F.count }
      ]
    };
    exportToExcel(excelData, 'Analisis_Equidad_Salarial');
  };

  const handleExportPDF = () => {
    const headers = ['Cargo', 'Promedio Salarial', 'Total Empleados', 'Hombres', 'Mujeres', 'Brecha %'];
    const rows = roleAnalysis.map(r => [
      r.cargo,
      formatCurrency(r.avgSalary),
      r.count,
      r.M,
      r.F,
      `${r.genderGap.toFixed(2)}%`
    ]);
    exportReportPDF('Analisis_Equidad_por_Cargo', headers, rows);
  };

  const getGapSeverity = (gapValue) => {
    const absGap = Math.abs(gapValue);
    if (absGap < 5) return { color: 'emerald', label: 'Equidad Excelente', icon: '✓' };
    if (absGap < 10) return { color: 'blue', label: 'Equidad Buena', icon: '◐' };
    if (absGap < 20) return { color: 'amber', label: 'Atención Necesaria', icon: '⚠' };
    return { color: 'red', label: 'Brecha Significativa', icon: '✕' };
  };

  const severity = getGapSeverity(gap);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-3 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-3">
              <Scale className="w-4 h-4" /> Análisis de Equidad Salarial
            </div>
            <h2 className="text-4xl font-bold text-slate-800">Diagnóstico de Brecha de Género</h2>
          </div>
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
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg font-medium transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* KPI Principal - Brecha de Género */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-10 rounded-3xl border-2 border-slate-200 shadow-xl text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${severity.color}-100 text-${severity.color}-700 rounded-full text-sm font-bold mb-6`}>
            <span className="text-lg">{severity.icon}</span>
            {severity.label}
          </div>
          <h3 className="text-lg font-bold text-slate-600 mb-3">Brecha Salarial de Género</h3>
          <div className={`text-7xl font-extrabold mb-6 ${
            Math.abs(gap) < 5 ? 'text-emerald-600' : 
            Math.abs(gap) < 10 ? 'text-blue-600' : 
            Math.abs(gap) < 20 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {formatPercent(Math.abs(gap))}
          </div>
          <p className="text-slate-600 text-lg">
            {gap > 0 ? (
              <>Los hombres ganan <span className="font-bold text-red-600">{formatPercent(gap)}</span> más en promedio</>
            ) : gap < 0 ? (
              <>Las mujeres ganan <span className="font-bold text-red-600">{formatPercent(Math.abs(gap))}</span> más en promedio</>
            ) : (
              <span className="font-bold text-emerald-600">Equidad perfecta detectada</span>
            )}
          </p>
        </div>

        {/* Distribución por Género */}
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-lg">
          <h3 className="font-bold text-lg text-slate-700 mb-6 text-center">Distribución</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-900">👨 Hombres</span>
                <span className="text-2xl font-extrabold text-blue-700">{byGender.M.count}</span>
              </div>
              <p className="text-sm text-blue-700 font-medium">
                {byGender.M.count + byGender.F.count > 0 
                  ? `${((byGender.M.count / (byGender.M.count + byGender.F.count)) * 100).toFixed(1)}% del total`
                  : '0%'}
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-2xl border-2 border-pink-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-pink-900">👩 Mujeres</span>
                <span className="text-2xl font-extrabold text-pink-700">{byGender.F.count}</span>
              </div>
              <p className="text-sm text-pink-700 font-medium">
                {byGender.M.count + byGender.F.count > 0 
                  ? `${((byGender.F.count / (byGender.M.count + byGender.F.count)) * 100).toFixed(1)}% del total`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparativa Promedio vs Mediana */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
          <h3 className="font-bold text-lg text-blue-900 mb-5 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Salarios Promedio
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-bold mb-2">Hombres</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(avgM)}</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-xl">
              <p className="text-xs text-pink-600 font-bold mb-2">Mujeres</p>
              <p className="text-2xl font-bold text-pink-900">{formatCurrency(avgF)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-lg">
          <h3 className="font-bold text-lg text-indigo-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Salarios Mediana
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-indigo-50 rounded-xl">
              <p className="text-xs text-indigo-600 font-bold mb-2">Hombres</p>
              <p className="text-2xl font-bold text-indigo-900">{formatCurrency(medianM)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-xs text-purple-600 font-bold mb-2">Mujeres</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(medianF)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Análisis por Antigüedad */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-lg">
        <h3 className="font-bold text-xl text-slate-800 mb-6">Distribución por Antigüedad</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(bySeniority).map(([range, data]) => (
            <div key={range} className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200">
              <p className="text-xs text-slate-500 font-bold mb-2">{range} años</p>
              <p className="text-2xl font-bold text-slate-900 mb-3">{data.count}</p>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold">👨 {data.M}</span>
                <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded font-bold">👩 {data.F}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Análisis por Cargo */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b-2 border-slate-200 bg-slate-50">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-slate-600" />
            Análisis de Equidad por Cargo
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-xs border-b-2 border-slate-300">
              <tr>
                <th className="px-6 py-4 text-left">Cargo</th>
                <th className="px-6 py-4 text-right">Promedio Salarial</th>
                <th className="px-6 py-4 text-center">Total</th>
                <th className="px-6 py-4 text-center">Hombres</th>
                <th className="px-6 py-4 text-center">Mujeres</th>
                <th className="px-6 py-4 text-center">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roleAnalysis.map((role, i) => {
                const totalGender = role.M + role.F;
                const malePercent = totalGender > 0 ? (role.M / totalGender) * 100 : 0;
                const femalePercent = totalGender > 0 ? (role.F / totalGender) * 100 : 0;
                const isBalanced = Math.abs(malePercent - 50) < 15;
                
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{role.cargo}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      {formatCurrency(role.avgSalary)}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">
                      {role.count}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-bold text-blue-700">{role.M}</span>
                        <span className="text-xs text-blue-500">({malePercent.toFixed(0)}%)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-bold text-pink-700">{role.F}</span>
                        <span className="text-xs text-pink-500">({femalePercent.toFixed(0)}%)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isBalanced 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isBalanced ? '✓ Balanceado' : '⚠ Desbalanceado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-xl text-blue-900 mb-4">Recomendaciones</h3>
            <ul className="space-y-3 text-blue-800">
              {Math.abs(gap) > 10 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>La brecha salarial detectada sugiere revisar políticas de compensación para asegurar equidad de género.</span>
                </li>
              )}
              {roleAnalysis.some(r => Math.abs(((r.M - r.F) / (r.M + r.F)) * 100) > 30) && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Algunos cargos muestran desbalance significativo. Considerar estrategias de diversidad e inclusión.</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Realizar auditorías salariales periódicas para mantener la equidad a lo largo del tiempo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Implementar bandas salariales transparentes para cada cargo y nivel de antigüedad.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquityAnalysis;
