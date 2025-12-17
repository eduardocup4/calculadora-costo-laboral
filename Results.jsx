import React, { useState } from 'react';
import { Download, Users, DollarSign, Building2, PieChart, FileSpreadsheet, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, exportReportPDF, exportToExcel } from './utils';

const Results = ({ results, onBack, onNewCalculation }) => {
  const { summary, details } = results;
  const [expandedRow, setExpandedRow] = useState(null);

  const handleExportPDF = () => {
      const headers = ['Nombre', 'Cargo', 'Regional', 'Total Ganado', 'Cargas (17.21%)', 'Provisiones', 'Costo Total'];
      const rows = details.map(d => [
          d.nombre, 
          d.cargo, 
          d.regional || '-', 
          formatCurrency(d.totalGanado), 
          formatCurrency(d.costoTotalMensual - d.totalGanado - d.provisiones),
          formatCurrency(d.provisiones), 
          formatCurrency(d.costoTotalMensual)
      ]);
      exportReportPDF('Reporte_Costo_Laboral_2025', headers, rows);
  };

  const handleExportExcel = () => {
      exportToExcel(results, 'Costo_Laboral_Completo');
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Resultado del Cálculo</h2>
            <p className="text-lg text-slate-500">{summary.count} empleados procesados correctamente</p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={onNewCalculation} 
              className="px-5 py-2.5 border-2 border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all"
            >
              Nuevo Cálculo
            </button>
            <button 
              onClick={handleExportExcel} 
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg font-medium transition-all hover:-translate-y-0.5"
            >
                <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button 
              onClick={handleExportPDF} 
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg font-medium transition-all hover:-translate-y-0.5"
            >
                <FileText className="w-4 h-4" /> PDF
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Costo Total Empresa" 
          value={summary.costo} 
          icon={DollarSign}
          gradient="from-blue-500 to-blue-600"
          bgLight="bg-blue-50"
          textDark="text-blue-900"
          border="border-blue-200"
        />
        <KPICard 
          title="Masa Salarial" 
          value={summary.ganado} 
          icon={Users}
          gradient="from-emerald-500 to-emerald-600"
          bgLight="bg-emerald-50"
          textDark="text-emerald-900"
          border="border-emerald-200"
        />
        <KPICard 
          title="Cargas Patronales (17.21%)" 
          value={summary.patronal} 
          icon={Building2}
          gradient="from-indigo-500 to-indigo-600"
          bgLight="bg-indigo-50"
          textDark="text-indigo-900"
          border="border-indigo-200"
        />
        <KPICard 
          title="Provisiones" 
          value={summary.provisiones} 
          icon={PieChart}
          gradient="from-amber-500 to-amber-600"
          bgLight="bg-amber-50"
          textDark="text-amber-900"
          border="border-amber-200"
        />
      </div>

      {/* Desglose de Cargas */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-md">
        <h3 className="font-bold text-lg text-slate-800 mb-4">Desglose de Cargas Patronales</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-600 font-bold mb-1">CNS (10%)</p>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(summary.cargas.cns)}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-xs text-purple-600 font-bold mb-1">AFP Riesgo (1.71%)</p>
            <p className="text-lg font-bold text-purple-900">{formatCurrency(summary.cargas.afp)}</p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-xs text-indigo-600 font-bold mb-1">AFP Vivienda (2%)</p>
            <p className="text-lg font-bold text-indigo-900">{formatCurrency(summary.cargas.vivienda)}</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-xs text-emerald-600 font-bold mb-1">AFP Solidario (3.5%)</p>
            <p className="text-lg font-bold text-emerald-900">{formatCurrency(summary.cargas.solidario)}</p>
          </div>
        </div>
      </div>

      {/* Tabla de Detalle */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-xl text-slate-800">Detalle por Empleado</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-xs border-b-2 border-slate-300">
                    <tr>
                        <th className="px-6 py-4 text-left">Empleado</th>
                        <th className="px-6 py-4 text-left">Cargo</th>
                        <th className="px-6 py-4 text-right">Total Ganado</th>
                        <th className="px-6 py-4 text-right">Cargas</th>
                        <th className="px-6 py-4 text-right">Provisiones</th>
                        <th className="px-6 py-4 text-right bg-slate-200">Costo Total</th>
                        <th className="px-6 py-4 text-center">Detalle</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {details.map((d, i) => (
                        <React.Fragment key={i}>
                          <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-medium text-slate-900">{d.nombre}</div>
                                <div className="text-xs text-slate-500">{d.ci || 'Sin CI'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-slate-700">{d.cargo}</div>
                                <div className="text-xs text-slate-500">{d.area}</div>
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-slate-900">
                                {formatCurrency(d.totalGanado)}
                              </td>
                              <td className="px-6 py-4 text-right text-red-600 font-medium text-xs">
                                +{formatCurrency(d.costoTotalMensual - d.totalGanado - d.provisiones)}
                              </td>
                              <td className="px-6 py-4 text-right text-amber-600 font-medium text-xs">
                                +{formatCurrency(d.provisiones)}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-blue-900 bg-blue-50/30">
                                {formatCurrency(d.costoTotalMensual)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                                >
                                  {expandedRow === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>
                          </tr>
                          {expandedRow === i && (
                            <tr className="bg-slate-50">
                              <td colSpan="7" className="px-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <p className="text-slate-500 font-bold mb-1">Haber Básico</p>
                                    <p className="text-slate-900 font-medium">{formatCurrency(d.haberBasico)}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 font-bold mb-1">Bono Antigüedad</p>
                                    <p className="text-slate-900 font-medium">{formatCurrency(d.bonoAntiguedad)}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 font-bold mb-1">Otros Bonos</p>
                                    <p className="text-slate-900 font-medium">{formatCurrency(d.otrosBonos)}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 font-bold mb-1">Regional</p>
                                    <p className="text-slate-900 font-medium">{d.regional || 'N/A'}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, gradient, bgLight, textDark, border }) => (
  <div className={`${bgLight} p-6 rounded-2xl border-2 ${border} shadow-md hover:shadow-lg transition-all`}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white shadow-md`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-sm font-bold ${textDark} leading-tight`}>{title}</span>
    </div>
    <p className={`text-3xl font-extrabold ${textDark}`}>{formatCurrency(value)}</p>
  </div>
);

export default Results;
