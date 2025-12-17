import React from 'react';
import { Download, Users, DollarSign, Building2, PieChart, ArrowLeft } from 'lucide-react';
import { formatCurrency, exportReportPDF } from './utils';

const Results = ({ results, onBack, onNewCalculation }) => {
  const { summary, details } = results;

  const handleExport = () => {
      // PREPARAR DATOS PARA PDF PLANILLA GENERAL
      const headers = ['Nombre', 'Cargo', 'Regional', 'Total Ganado', 'Cargas (17.21%)', 'Provisiones', 'Costo Total'];
      const rows = details.map(d => [
          d.nombre, 
          d.cargo, 
          d.regional || '-', 
          formatCurrency(d.totalGanado), 
          formatCurrency(d.costoTotalMensual - d.totalGanado - d.provisiones), // Cargas
          formatCurrency(d.provisiones), 
          formatCurrency(d.costoTotalMensual)
      ]);
      exportReportPDF('Reporte_Costo_Laboral_2025', headers, rows);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Resultado del Cálculo</h2>
            <p className="text-slate-500">{summary.count} empleados procesados</p>
        </div>
        <div className="flex gap-3">
            <button onClick={onNewCalculation} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Nuevo Cálculo</button>
            <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg">
                <Download className="w-4 h-4" /> Exportar PDF
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card title="Costo Empresa Total" val={summary.costo} icon={DollarSign} color="blue" />
        <Card title="Masa Salarial" val={summary.ganado} icon={Users} color="emerald" />
        <Card title="Cargas Patronales" val={summary.patronal} icon={Building2} color="indigo" />
        <Card title="Provisiones" val={summary.provisiones} icon={PieChart} color="amber" />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                    <tr>
                        <th className="px-6 py-4">Empleado</th>
                        <th className="px-6 py-4">Cargo</th>
                        <th className="px-6 py-4 text-right">Total Ganado</th>
                        <th className="px-6 py-4 text-right">Cargas</th>
                        <th className="px-6 py-4 text-right">Provisiones</th>
                        <th className="px-6 py-4 text-right bg-slate-100">Costo Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {details.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{d.nombre}</td>
                            <td className="px-6 py-4 text-slate-500">{d.cargo}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(d.totalGanado)}</td>
                            <td className="px-6 py-4 text-right text-red-500 text-xs">+{formatCurrency(d.costoTotalMensual - d.totalGanado - d.provisiones)}</td>
                            <td className="px-6 py-4 text-right text-amber-500 text-xs">+{formatCurrency(d.provisiones)}</td>
                            <td className="px-6 py-4 text-right font-bold text-blue-800 bg-blue-50/20">{formatCurrency(d.costoTotalMensual)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const Card = ({title, val, icon: Icon, color}) => (
    <div className={`p-6 rounded-2xl bg-${color}-50 border border-${color}-100`}>
        <div className="flex items-center gap-3 mb-2">
            <Icon className={`w-5 h-5 text-${color}-600`} />
            <span className={`text-sm font-bold text-${color}-800`}>{title}</span>
        </div>
        <p className={`text-2xl font-bold text-${color}-900`}>{formatCurrency(val)}</p>
    </div>
);

export default Results;