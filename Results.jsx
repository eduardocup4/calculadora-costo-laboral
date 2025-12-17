import React, { useMemo } from 'react';
import { 
  ArrowLeft, Download, Users, DollarSign, 
  PieChart, Building2, Wallet, RefreshCw 
} from 'lucide-react';
import { formatCurrency, formatPercent } from './utils';

const Results = ({ results, onBack, onNewCalculation }) => {
  const { summary, details } = results;

  // Datos para gráficos simples (CSS width)
  const maxCosto = Math.max(...details.map(d => d.costoTotalMensual));

  return (
    <div className="animate-fade-in">
      {/* Header Resultados */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Reporte de Costo Laboral</h2>
          <p className="text-slate-500">Cálculo basado en normativa boliviana vigencia 2025</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onNewCalculation} className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" /> Nuevo Cálculo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Costo Total Empresa" 
          value={formatCurrency(summary.totalCostoLaboral)} 
          icon={DollarSign} 
          color="blue" 
        />
        <KPICard 
          title="Total Líquido Pagable" 
          value={formatCurrency(summary.totalLiquido)} 
          icon={Wallet} 
          color="emerald" 
        />
        <KPICard 
          title="Cargas Patronales" 
          value={formatCurrency(summary.totalPatronal)} 
          icon={Building2} 
          color="indigo" 
        />
        <KPICard 
          title="Provisiones Sociales" 
          value={formatCurrency(summary.totalProvisiones)} 
          icon={PieChart} 
          color="amber" 
        />
      </div>

      {/* Tabla Detallada */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            Nómina Detallada ({details.length} Empleados)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Empleado</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4 text-right">Total Ganado</th>
                <th className="px-6 py-4 text-right">Cargas Patronales</th>
                <th className="px-6 py-4 text-right">Provisiones</th>
                <th className="px-6 py-4 text-right">Costo Total</th>
                <th className="px-6 py-4 text-center">Peso Relativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.map((emp, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{emp.nombre}</td>
                  <td className="px-6 py-4 text-slate-500">{emp.cargo}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(emp.totalGanado)}</td>
                  <td className="px-6 py-4 text-right text-red-600 text-xs">+{formatCurrency(emp.aportePatronal)}</td>
                  <td className="px-6 py-4 text-right text-amber-600 text-xs">+{formatCurrency(emp.provisiones)}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-900 bg-blue-50/30">
                    {formatCurrency(emp.costoTotalMensual)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${(emp.costoTotalMensual / maxCosto) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Subcomponente Card
const KPICard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Results;