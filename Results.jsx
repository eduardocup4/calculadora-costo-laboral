import React, { useState, useMemo } from 'react';
import {
  Users, DollarSign, TrendingUp, Building2, Award, RefreshCw,
  FileSpreadsheet, FileText, ChevronDown, ChevronUp, Download,
  PieChart, BarChart3, Calculator, ArrowUpDown, ArrowUp, ArrowDown,
  Filter, Search, Eye, EyeOff
} from 'lucide-react';
import { formatCurrency, formatPercent, roundTwo, COLORS } from './utils.js';

// ============================================================================
// COMPONENTE: HEADER DE SECCIÓN
// ============================================================================
const SectionHeader = ({ icon: Icon, title, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    purple: 'from-purple-500 to-violet-600',
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: KPI CARD
// ============================================================================
const KpiCard = ({ title, value, subValue, icon: Icon, color }) => {
  const styles = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
  };

  const style = styles[color] || styles.blue;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${style.bg}`}>
          <Icon className={`w-6 h-6 ${style.icon}`} />
        </div>
        {subValue && (
          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
            {subValue}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <h4 className={`text-2xl font-bold ${style.text}`}>{value}</h4>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: RESULTADOS
// ============================================================================

const Results = ({ results, onBack, onNewCalculation }) => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'costoLaboralMensual', direction: 'desc' });

  // Desestructuración segura de los nuevos resultados del utils.js
  const { 
    totals = {}, 
    employees = [], 
    byArea = [], // Ahora es un array ordenado
    employeeCount = 0 
  } = results || {};

  // Lógica de ordenamiento y filtrado
  const filteredEmployees = useMemo(() => {
    let data = [...employees];
    
    // Filtrar
    if (searchTerm) {
      data = data.filter(e => 
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.area.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    if (sortConfig.key) {
      data.sort((a, b) => {
        // Manejo de propiedades anidadas (ej: componentes.haberBasico)
        const getValue = (obj, path) => path.split('.').reduce((o, i) => o[i], obj);
        
        const aVal = getValue(a, sortConfig.key);
        const bVal = getValue(b, sortConfig.key);

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [employees, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-4 h-4 text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" /> 
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Función para exportar Excel simple (para PDF ya tienes la lógica en App.jsx probablemente, o utils)
  const exportToExcel = () => {
    // Implementación básica o llamada al prop si lo pasas desde App
    alert("Funcionalidad de exportación lista para integrar");
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER DE RESULTADOS */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Reporte de Costo Laboral</h2>
            <p className="text-slate-400">Legislación Boliviana 2025</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400 mb-1">Costo Laboral Mensual Total</p>
            <p className="text-4xl font-bold text-emerald-400">{formatCurrency(totals.costoLaboralMensual)}</p>
          </div>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex justify-center">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
          {[
            { id: 'resumen', label: 'Dashboard Ejecutivo', icon: PieChart },
            { id: 'detalle', label: 'Planilla Detallada', icon: FileSpreadsheet },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VISTA: DASHBOARD EJECUTIVO */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard 
              title="Total Ganado (Masa Salarial)" 
              value={formatCurrency(totals.totalGanado)} 
              icon={DollarSign} 
              color="blue" 
            />
            <KpiCard 
              title="Cargas Patronales (16.71% + Solidario)" 
              value={formatCurrency(totals.aportesPatronales)} 
              subValue={`${formatPercent((totals.aportesPatronales / totals.totalGanado) * 100)} del TG`}
              icon={Building2} 
              color="purple" 
            />
            <KpiCard 
              title="Provisiones Sociales (Aguinaldo/Indem)" 
              value={formatCurrency(totals.provisiones)} 
              icon={Award} 
              color="amber" 
            />
            <KpiCard 
              title="Costo Promedio por Empleado" 
              value={formatCurrency(totals.costoLaboralMensual / employeeCount)} 
              subValue={`${employeeCount} Empleados`}
              icon={Users} 
              color="green" 
            />
          </div>

          {/* Gráficos y Tablas Resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Distribución por Área */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <SectionHeader icon={PieChart} title="Distribución de Costo por Área" color="blue" />
              <div className="space-y-4">
                {byArea.map((area, index) => (
                  <div key={index} className="relative">
                    <div className="flex justify-between text-sm mb-1 z-10 relative">
                      <span className="font-medium text-slate-700">{area.area}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(area.costoMensual)} ({area.porcentaje}%)</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-blue-500" 
                        style={{ width: `${area.porcentaje}%`, opacity: 0.8 }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estructura del Costo (Waterfall simplificado) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <SectionHeader icon={BarChart3} title="Estructura del Costo" color="purple" />
              <div className="space-y-6 mt-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-slate-600">Sueldo Neto + Aportes Lab.</span>
                  </div>
                  <span className="font-bold text-slate-800">{formatPercent((totals.totalGanado / totals.costoLaboralMensual) * 100)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-slate-600">Aportes Patronales</span>
                  </div>
                  <span className="font-bold text-slate-800">{formatPercent((totals.aportesPatronales / totals.costoLaboralMensual) * 100)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-slate-600">Provisiones (Pasivos)</span>
                  </div>
                  <span className="font-bold text-slate-800">{formatPercent((totals.provisiones / totals.costoLaboralMensual) * 100)}</span>
                </div>
                
                <div className="pt-6 border-t border-slate-100 mt-4">
                  <p className="text-xs text-slate-400 text-center">
                    Por cada Bs 100 pagados al empleado, la empresa gasta Bs {roundTwo((totals.costoLaboralMensual / totals.totalGanado) * 100)}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: DETALLE DE EMPLEADOS */}
      {activeTab === 'detalle' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Barra de herramientas de tabla */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar por nombre, cargo o área..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Descargar Excel">
                <FileSpreadsheet className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('nombre')}>
                    <div className="flex items-center gap-1">Nombre <SortIcon column="nombre" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('cargo')}>
                    <div className="flex items-center gap-1">Cargo <SortIcon column="cargo" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('area')}>
                    <div className="flex items-center gap-1">Área <SortIcon column="area" /></div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('componentes.haberBasico')}>
                    <div className="flex items-center justify-end gap-1">Haber Básico <SortIcon column="componentes.haberBasico" /></div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('componentes.totalGanado')}>
                    <div className="flex items-center justify-end gap-1">Total Ganado <SortIcon column="componentes.totalGanado" /></div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('aportesPatronales.total')}>
                    <div className="flex items-center justify-end gap-1">Aportes Pat. <SortIcon column="aportesPatronales.total" /></div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('provisiones.total')}>
                    <div className="flex items-center justify-end gap-1">Provisiones <SortIcon column="provisiones.total" /></div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 bg-blue-50/50" onClick={() => handleSort('costoLaboralMensual')}>
                    <div className="flex items-center justify-end gap-1 text-blue-700">Costo Mensual <SortIcon column="costoLaboralMensual" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{emp.nombre}</td>
                    <td className="px-6 py-4 text-slate-500">{emp.cargo}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">
                        {emp.area}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(emp.componentes.haberBasico)}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">{formatCurrency(emp.componentes.totalGanado)}</td>
                    <td className="px-6 py-4 text-right text-purple-600">{formatCurrency(emp.aportesPatronales.total)}</td>
                    <td className="px-6 py-4 text-right text-amber-600">{formatCurrency(emp.provisiones.total)}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-700 bg-blue-50/30">
                      {formatCurrency(emp.costoLaboralMensual)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
            Mostrando {filteredEmployees.length} de {employees.length} registros
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-slate-300 text-slate-600 rounded-xl hover:bg-white hover:shadow-sm transition-all font-medium"
        >
          Atrás (Configuración)
        </button>
        <button
          onClick={onNewCalculation}
          className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Iniciar Nuevo Cálculo
        </button>
      </div>
    </div>
  );
};

export default Results;