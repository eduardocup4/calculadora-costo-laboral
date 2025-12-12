import React, { useState, useMemo } from 'react';
import {
  Users, DollarSign, TrendingUp, Building2, Award, RefreshCw,
  FileSpreadsheet, FileText, ChevronDown, ChevronUp, Download,
  PieChart, BarChart3, Calculator, ArrowUpDown, ArrowUp, ArrowDown,
  Filter, Search, Eye, EyeOff
} from 'lucide-react';
import { formatCurrency, formatPercent, roundTwo, COLORS } from './utils.js';

// ============================================================================
// COMPONENTE: FOOTER CON FIRMA
// ============================================================================

const Footer = () => (
  <footer className="mt-8 pt-6 border-t border-slate-200">
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-center md:text-left">
        <p className="text-sm text-slate-500">
          Calculadora de Costo Laboral Anual | Legislación Boliviana
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Diseñado por</span>
        <a 
          href="https://www.linkedin.com/in/jelbas/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          <Award className="w-4 h-4" />
          JELB
        </a>
      </div>
    </div>
  </footer>
);

// ============================================================================
// COMPONENTE: TABLA ORDENABLE
// ============================================================================

const SortableTable = ({ columns, data, onRowClick, expandedRow, renderExpanded }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      // Handle numeric values
      const aNum = typeof aVal === 'number' ? aVal : parseFloat(aVal) || 0;
      const bNum = typeof bVal === 'number' ? bVal : parseFloat(bVal) || 0;
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-slate-300" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 sticky top-0">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-3 text-${col.align || 'left'} font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors select-none`}
                onClick={() => handleSort(col.key)}
              >
                <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                  {col.label}
                  {getSortIcon(col.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <React.Fragment key={row.id || i}>
              <tr
                className={`border-t border-slate-100 hover:bg-blue-50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${expandedRow === (row.id || i) ? 'bg-blue-50' : ''}`}
                onClick={() => onRowClick && onRowClick(row.id || i)}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
              {expandedRow === (row.id || i) && renderExpanded && (
                <tr>
                  <td colSpan={columns.length} className="bg-slate-50 px-4 py-4">
                    {renderExpanded(row)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: RESULTADOS
// ============================================================================

const Results = ({
  results,
  columnMapping,
  onExportExcel,
  onExportPDF,
  onNewCalculation,
  onModifyConfig
}) => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');

  if (!results) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">No hay resultados disponibles</p>
      </div>
    );
  }

  const { employees, totals, byArea, byEmpresa, employeeCount, costoPromedioPorEmpleado } = results;

  // Filtrar empleados
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = !searchTerm || 
        emp.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cargo?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchArea = !filterArea || emp.area === filterArea;
      const matchEmpresa = !filterEmpresa || emp.empresa === filterEmpresa;
      return matchSearch && matchArea && matchEmpresa;
    });
  }, [employees, searchTerm, filterArea, filterEmpresa]);

  // Obtener listas únicas
  const uniqueAreas = useMemo(() => 
    [...new Set(employees.map(e => e.area).filter(Boolean))].sort(),
  [employees]);

  const uniqueEmpresas = useMemo(() => 
    [...new Set(employees.map(e => e.empresa).filter(Boolean))].sort(),
  [employees]);

  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: PieChart },
    { id: 'empleados', label: 'Por Empleado', icon: Users },
    { id: 'areas', label: 'Por Área', icon: Building2 },
  ];

  // Columnas para tabla de empleados
  const employeeColumns = [
    { key: 'nombre', label: 'Nombre', render: (v) => <span className="font-medium text-slate-800">{v}</span> },
    { key: 'cargo', label: 'Cargo' },
    { key: 'area', label: 'Área' },
    { key: 'totalGanado', label: 'Total Ganado', align: 'right', render: (_, row) => formatCurrency(row.componentes?.totalGanado || 0) },
    { key: 'costoMensual', label: 'Costo Mensual', align: 'right', render: (_, row) => <span className="font-semibold text-blue-600">{formatCurrency(row.costoLaboralMensual)}</span> },
    { key: 'costoAnual', label: 'Costo Anual', align: 'right', render: (_, row) => <span className="font-bold text-emerald-600">{formatCurrency(row.costoLaboralAnual)}</span> },
  ];

  // Columnas para tabla de áreas
  const areaColumns = [
    { key: 'area', label: 'Área', render: (v) => <span className="font-medium text-slate-800">{v}</span> },
    { key: 'count', label: 'Empleados', align: 'right' },
    { key: 'totalGanado', label: 'Total Ganado', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'costoMensual', label: 'Costo Mensual', align: 'right', render: (v) => <span className="text-blue-600">{formatCurrency(v)}</span> },
    { key: 'costoAnual', label: 'Costo Anual', align: 'right', render: (v) => <span className="font-semibold text-emerald-600">{formatCurrency(v)}</span> },
    { key: 'porcentaje', label: '% Part.', align: 'right', render: (v) => <span className="font-semibold">{v}%</span> },
  ];

  // Convertir byArea a array
  const areaData = useMemo(() => 
    Object.entries(byArea || {}).map(([area, data]) => ({
      area,
      ...data
    })),
  [byArea]);

  // Renderizar expansión de empleado
  const renderEmployeeExpanded = (emp) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h5 className="text-xs font-semibold text-slate-500 mb-2">COMPONENTES SALARIALES</h5>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Haber Básico</span>
            <span className="font-medium">{formatCurrency(emp.componentes?.haberBasico || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Bono Antigüedad</span>
            <span className="font-medium">{formatCurrency(emp.componentes?.bonoAntiguedad || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Otros Bonos</span>
            <span className="font-medium">{formatCurrency(emp.componentes?.otrosBonosTotal || 0)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
            <span className="text-slate-800 font-semibold">Total Ganado</span>
            <span className="font-bold text-blue-600">{formatCurrency(emp.componentes?.totalGanado || 0)}</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h5 className="text-xs font-semibold text-slate-500 mb-2">PROVISIONES MENSUAL</h5>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Aguinaldo</span>
            <span className="font-medium">{formatCurrency(emp.provisiones?.aguinaldo || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Prima</span>
            <span className="font-medium">{formatCurrency(emp.provisiones?.prima || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Indemnización</span>
            <span className="font-medium">{formatCurrency(emp.provisiones?.indemnizacion || 0)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
            <span className="text-slate-800 font-semibold">Total Prov.</span>
            <span className="font-bold text-indigo-600">{formatCurrency(emp.provisiones?.total || 0)}</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h5 className="text-xs font-semibold text-slate-500 mb-2">APORTES PATRONALES MENSUAL</h5>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">CNS</span>
            <span className="font-medium">{formatCurrency(emp.aportes?.cns || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">AFP Vivienda</span>
            <span className="font-medium">{formatCurrency(emp.aportes?.afpVivienda || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Riesgo Prof.</span>
            <span className="font-medium">{formatCurrency(emp.aportes?.afpRiesgoProfesional || 0)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
            <span className="text-slate-800 font-semibold">Total Aportes</span>
            <span className="font-bold text-amber-600">{formatCurrency(emp.aportes?.total || 0)}</span>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
        <h5 className="text-xs font-semibold text-emerald-700 mb-2">RESUMEN DE COSTOS</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-emerald-700">Costo Mensual</span>
            <span className="font-bold text-emerald-800">{formatCurrency(emp.costoLaboralMensual)}</span>
          </div>
          <div className="flex justify-between border-t border-emerald-200 pt-2 mt-2">
            <span className="text-emerald-700 font-semibold">Costo Anual (×12)</span>
            <span className="font-bold text-xl text-emerald-800">{formatCurrency(emp.costoLaboralAnual)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header ejecutivo */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Resultados del Cálculo
              </h2>
              <p className="text-slate-400 text-lg">
                Costo Laboral Anual - {employeeCount} empleados
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onExportExcel}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={onExportPDF}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl text-sm font-semibold shadow-lg shadow-red-500/25 transition-all"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>

          {/* KPIs Principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-xs">Empleados</span>
              </div>
              <p className="text-2xl font-bold">{employeeCount}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-400 text-xs">Costo Mensual</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totals.costoLaboralMensual)}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span className="text-slate-400 text-xs">Costo Anual</span>
              </div>
              <p className="text-2xl font-bold text-amber-400">{formatCurrency(totals.costoLaboralAnual)}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400 text-xs">Promedio/Emp</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{formatCurrency(costoPromedioPorEmpleado)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== TAB: RESUMEN ========== */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Composición del Costo MENSUAL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Composición del Costo Laboral MENSUAL
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Ganado Mensual */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">Total Ganado</h4>
                <p className="text-2xl font-bold text-blue-700 mb-3">{formatCurrency(totals.totalGanado)}</p>
                <div className="space-y-1 text-xs text-blue-600">
                  <div className="flex justify-between">
                    <span>Haber Básico</span>
                    <span>{formatCurrency(totals.haberBasico || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bono Antigüedad</span>
                    <span>{formatCurrency(totals.bonoAntiguedad || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Otros Bonos</span>
                    <span>{formatCurrency(totals.otrosBonos || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Provisiones Mensual */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
                <h4 className="text-sm font-semibold text-indigo-800 mb-3">Provisiones (24.99%)</h4>
                <p className="text-2xl font-bold text-indigo-700 mb-3">{formatCurrency(totals.provisiones)}</p>
                <div className="space-y-1 text-xs text-indigo-600">
                  <div className="flex justify-between">
                    <span>Aguinaldo (8.33%)</span>
                    <span>{formatCurrency(totals.totalGanado * 0.0833)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prima (8.33%)</span>
                    <span>{formatCurrency(totals.totalGanado * 0.0833)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indemnización (8.33%)</span>
                    <span>{formatCurrency(totals.totalGanado * 0.0833)}</span>
                  </div>
                </div>
              </div>

              {/* Aportes Patronales Mensual */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <h4 className="text-sm font-semibold text-amber-800 mb-3">Aportes Patronales (17.21%)</h4>
                <p className="text-2xl font-bold text-amber-700 mb-3">{formatCurrency(totals.aportesPatronales)}</p>
                <div className="space-y-1 text-xs text-amber-600">
                  <div className="flex justify-between">
                    <span>CNS (10%)</span>
                    <span>{formatCurrency(totals.totalGanado * 0.10)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AFP Vivienda (2%)</span>
                    <span>{formatCurrency(totals.totalGanado * 0.02)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Riesgo + INFOCAL</span>
                    <span>{formatCurrency(totals.totalGanado * 0.0521)}</span>
                  </div>
                </div>
              </div>

              {/* Costo Total Mensual */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg">
                <h4 className="text-sm font-semibold text-emerald-100 mb-3">COSTO TOTAL MENSUAL</h4>
                <p className="text-3xl font-bold mb-3">{formatCurrency(totals.costoLaboralMensual)}</p>
                <div className="text-xs text-emerald-100 space-y-1">
                  <div className="flex justify-between border-t border-emerald-400/30 pt-1">
                    <span>T. Ganado + Prov. + Aportes</span>
                  </div>
                  <p className="text-emerald-200">
                    = {formatCurrency(totals.totalGanado)} + {formatCurrency(totals.provisiones)} + {formatCurrency(totals.aportesPatronales)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Proyección ANUAL */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Proyección de Costo Laboral ANUAL (×12 meses)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                <p className="text-sm text-slate-500 mb-1">Total Ganado Anual</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(totals.totalGanado * 12)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                <p className="text-sm text-slate-500 mb-1">Provisiones Anual</p>
                <p className="text-xl font-bold text-indigo-700">{formatCurrency(totals.provisiones * 12)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                <p className="text-sm text-slate-500 mb-1">Aportes Anual</p>
                <p className="text-xl font-bold text-amber-700">{formatCurrency(totals.aportesPatronales * 12)}</p>
              </div>
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white text-center shadow-lg">
                <p className="text-sm text-emerald-100 mb-1">COSTO TOTAL ANUAL</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.costoLaboralAnual)}</p>
              </div>
            </div>

            {/* Barra de composición visual */}
            <div className="mt-6">
              <p className="text-sm text-slate-600 mb-2">Composición porcentual del costo:</p>
              <div className="h-8 rounded-full overflow-hidden flex">
                <div 
                  className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(totals.totalGanado / totals.costoLaboralMensual * 100).toFixed(1)}%` }}
                >
                  {(totals.totalGanado / totals.costoLaboralMensual * 100).toFixed(1)}%
                </div>
                <div 
                  className="bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(totals.provisiones / totals.costoLaboralMensual * 100).toFixed(1)}%` }}
                >
                  {(totals.provisiones / totals.costoLaboralMensual * 100).toFixed(1)}%
                </div>
                <div 
                  className="bg-amber-500 flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(totals.aportesPatronales / totals.costoLaboralMensual * 100).toFixed(1)}%` }}
                >
                  {(totals.aportesPatronales / totals.costoLaboralMensual * 100).toFixed(1)}%
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded"></span> Total Ganado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-indigo-500 rounded"></span> Provisiones
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-amber-500 rounded"></span> Aportes
                </span>
              </div>
            </div>
          </div>

          {/* Resumen por Empresa si hay múltiples */}
          {byEmpresa && Object.keys(byEmpresa).length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-600" />
                Resumen por Empresa
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Empresa</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Empleados</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Costo Mensual</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Costo Anual</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">% Part.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(byEmpresa).map(([empresa, data]) => (
                      <tr key={empresa} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-800">{empresa}</td>
                        <td className="px-4 py-3 text-right">{data.count}</td>
                        <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(data.costoMensual)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(data.costoAnual)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{data.porcentaje}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== TAB: EMPLEADOS ========== */}
      {activeTab === 'empleados' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nombre o cargo..."
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Área</label>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Todas</option>
                  {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {uniqueEmpresas.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Empresa</label>
                  <select
                    value={filterEmpresa}
                    onChange={(e) => setFilterEmpresa(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Todas</option>
                    {uniqueEmpresas.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Mostrando {filteredEmployees.length} de {employees.length} empleados
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-4 h-4" />
              Clic en columna para ordenar
            </span>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <SortableTable
              columns={employeeColumns}
              data={filteredEmployees.map((emp, i) => ({
                ...emp,
                id: i,
                totalGanado: emp.componentes?.totalGanado || 0,
                costoMensual: emp.costoLaboralMensual,
                costoAnual: emp.costoLaboralAnual,
              }))}
              onRowClick={(id) => setExpandedEmployee(expandedEmployee === id ? null : id)}
              expandedRow={expandedEmployee}
              renderExpanded={(row) => renderEmployeeExpanded(filteredEmployees[row.id])}
            />
          </div>

          {/* Totales */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-400">Total Ganado</p>
                <p className="text-lg font-bold">{formatCurrency(filteredEmployees.reduce((s, e) => s + (e.componentes?.totalGanado || 0), 0))}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Costo Mensual</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(filteredEmployees.reduce((s, e) => s + e.costoLaboralMensual, 0))}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Costo Anual</p>
                <p className="text-lg font-bold text-amber-400">{formatCurrency(filteredEmployees.reduce((s, e) => s + e.costoLaboralAnual, 0))}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: ÁREAS ========== */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{areaData.length} áreas</span>
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-4 h-4" />
              Clic en columna para ordenar
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <SortableTable
              columns={areaColumns}
              data={areaData}
            />
          </div>

          {/* Gráfico de barras horizontal */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h4 className="font-semibold text-slate-800 mb-4">Distribución por Área</h4>
            <div className="space-y-3">
              {areaData.sort((a, b) => b.costoAnual - a.costoAnual).map((area, i) => {
                const maxCosto = Math.max(...areaData.map(a => a.costoAnual));
                const pct = maxCosto > 0 ? (area.costoAnual / maxCosto) * 100 : 0;
                const colors = ['from-blue-500 to-indigo-500', 'from-emerald-500 to-teal-500', 'from-purple-500 to-violet-500', 'from-amber-500 to-orange-500', 'from-red-500 to-rose-500'];
                
                return (
                  <div key={area.area}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{area.area}</span>
                      <span className="text-slate-600">{formatCurrency(area.costoAnual)} ({area.porcentaje}%)</span>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${colors[i % colors.length]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={onModifyConfig}
          className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Modificar Selección
        </button>
        <button
          onClick={onNewCalculation}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-semibold shadow-lg hover:from-slate-800 hover:to-slate-900 transition-all"
        >
          <Calculator className="w-5 h-5" />
          Nuevo Cálculo
        </button>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Results;
