import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Award, RefreshCw,
  FileSpreadsheet, FileText, ChevronDown, ChevronUp, Building2,
  PieChart, BarChart3, Calculator, ArrowUpDown, ArrowUp, ArrowDown,
  UserPlus, UserMinus, ArrowUpRight, ArrowDownRight, Minus, AlertCircle,
  GitCompare, Filter, Search, Briefcase, Clock, Eye, Check, X
} from 'lucide-react';
import { formatCurrency, formatPercent, roundTwo, MONTHS } from './utils.js';

// ============================================================================
// COMPONENTE: FOOTER CON FIRMA
// ============================================================================

const Footer = () => (
  <footer className="mt-8 pt-6 border-t border-slate-200">
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-center md:text-left">
        <p className="text-sm text-slate-500">
          Análisis de Precierre | Legislación Boliviana
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

const SortableTable = ({ columns, data, onRowClick, highlightCondition }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      const aNum = typeof aVal === 'number' ? aVal : parseFloat(aVal) || 0;
      const bNum = typeof bVal === 'number' ? bVal : parseFloat(bVal) || 0;
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
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
      ? <ArrowUp className="w-4 h-4 text-amber-600" />
      : <ArrowDown className="w-4 h-4 text-amber-600" />;
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
            <tr
              key={row.id || i}
              className={`border-t border-slate-100 transition-colors ${
                highlightCondition && highlightCondition(row) ? 'bg-amber-50' : 'hover:bg-slate-50'
              } ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// COMPONENTE: BADGE DE VARIACIÓN
// ============================================================================

const VariationBadge = ({ value, showPercent = false }) => {
  if (value === 0 || value === null || value === undefined) {
    return <span className="text-slate-400">-</span>;
  }
  
  const isPositive = value > 0;
  const displayValue = showPercent ? `${roundTwo(value)}%` : formatCurrency(Math.abs(value));
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
    }`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {isPositive ? '+' : '-'}{displayValue}
    </span>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: ANÁLISIS PRECIERRE
// ============================================================================

const PrecierreAnalysis = ({
  analysis,
  periodsData,
  columnMapping,
  onExportExcel,
  onExportPDF,
  onNewAnalysis
}) => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [selectedVariable, setSelectedVariable] = useState('totalGanado');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMovimiento, setFilterMovimiento] = useState('');

  if (!analysis || !periodsData || periodsData.length < 2) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 text-lg">Se requieren al menos 2 períodos para el análisis comparativo</p>
      </div>
    );
  }

  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: PieChart },
    { id: 'variaciones', label: 'Variaciones por Persona', icon: Users },
    { id: 'movimientos', label: 'Altas, Bajas y Cambios', icon: GitCompare },
  ];

  const {
    periods,
    headcountByPeriod,
    totalGanadoByPeriod,
    variacionPersonal,
    altas,
    bajas,
    cambiosCargo,
    cambiosArea,
    variacionesSalariales,
  } = analysis;

  // Variables disponibles para comparar
  const variablesDisponibles = [
    { key: 'totalGanado', label: 'Total Ganado' },
    { key: 'haberBasico', label: 'Haber Básico' },
    { key: 'bonoAntiguedad', label: 'Bono Antigüedad' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'area', label: 'Área' },
  ];

  // Filtrar variaciones de personas
  const filteredVariaciones = useMemo(() => {
    return variacionPersonal.filter(v => {
      const matchSearch = !searchTerm || 
        v.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [variacionPersonal, searchTerm]);

  // Períodos formateados
  const periodLabels = periods.map(p => `${MONTHS[p.month - 1]} ${p.year}`);
  const primerPeriodo = periodLabels[0];
  const ultimoPeriodo = periodLabels[periodLabels.length - 1];

  // Calcular variación total
  const variacionHeadcount = headcountByPeriod[headcountByPeriod.length - 1] - headcountByPeriod[0];
  const variacionTotalGanado = totalGanadoByPeriod[totalGanadoByPeriod.length - 1] - totalGanadoByPeriod[0];
  const variacionTotalGanadoPct = totalGanadoByPeriod[0] > 0 
    ? ((variacionTotalGanado / totalGanadoByPeriod[0]) * 100)
    : 0;

  // Columnas para tabla de variaciones por persona
  const variacionColumns = [
    { key: 'nombre', label: 'Nombre', render: (v) => <span className="font-medium text-slate-800">{v}</span> },
    { key: 'cargo', label: 'Cargo' },
    { key: 'area', label: 'Área' },
    { 
      key: 'valorInicial', 
      label: `${variablesDisponibles.find(v => v.key === selectedVariable)?.label} Inicial`, 
      align: 'right',
      render: (v) => selectedVariable.includes('cargo') || selectedVariable.includes('area') 
        ? v 
        : formatCurrency(v || 0)
    },
    { 
      key: 'valorFinal', 
      label: `${variablesDisponibles.find(v => v.key === selectedVariable)?.label} Final`, 
      align: 'right',
      render: (v) => selectedVariable.includes('cargo') || selectedVariable.includes('area')
        ? v 
        : formatCurrency(v || 0)
    },
    { 
      key: 'variacion', 
      label: 'Variación', 
      align: 'right',
      render: (v, row) => {
        if (selectedVariable.includes('cargo') || selectedVariable.includes('area')) {
          return row.valorInicial !== row.valorFinal ? (
            <span className="text-amber-600 font-semibold">Cambió</span>
          ) : '-';
        }
        return <VariationBadge value={v} />;
      }
    },
    { 
      key: 'variacionPct', 
      label: '% Var', 
      align: 'right',
      render: (v, row) => {
        if (selectedVariable.includes('cargo') || selectedVariable.includes('area')) return '-';
        return <VariationBadge value={v} showPercent />;
      }
    },
  ];

  // Columnas para movimientos
  const movimientoColumns = [
    { key: 'nombre', label: 'Nombre', render: (v) => <span className="font-medium text-slate-800">{v}</span> },
    { key: 'cargo', label: 'Cargo' },
    { key: 'area', label: 'Área' },
    { key: 'tipo', label: 'Tipo', render: (v) => {
      const colorMap = {
        'alta': 'bg-emerald-100 text-emerald-700',
        'baja': 'bg-red-100 text-red-700',
        'cambio_cargo': 'bg-purple-100 text-purple-700',
        'cambio_area': 'bg-blue-100 text-blue-700',
      };
      const labelMap = {
        'alta': 'Alta',
        'baja': 'Baja',
        'cambio_cargo': 'Cambio Cargo',
        'cambio_area': 'Cambio Área',
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorMap[v]}`}>
          {labelMap[v]}
        </span>
      );
    }},
    { key: 'periodo', label: 'Período' },
    { key: 'detalle', label: 'Detalle' },
  ];

  // Combinar todos los movimientos
  const todosMovimientos = useMemo(() => {
    const movs = [];
    
    altas?.forEach(a => movs.push({ ...a, tipo: 'alta', detalle: `Ingreso en ${a.periodo}` }));
    bajas?.forEach(b => movs.push({ ...b, tipo: 'baja', detalle: `Salida en ${b.periodo}` }));
    cambiosCargo?.forEach(c => movs.push({ 
      ...c, 
      tipo: 'cambio_cargo', 
      detalle: `${c.cargoAnterior} → ${c.cargoNuevo}` 
    }));
    cambiosArea?.forEach(c => movs.push({ 
      ...c, 
      tipo: 'cambio_area', 
      detalle: `${c.areaAnterior} → ${c.areaNueva}` 
    }));
    
    return movs.filter(m => {
      if (!filterMovimiento) return true;
      return m.tipo === filterMovimiento;
    });
  }, [altas, bajas, cambiosCargo, cambiosArea, filterMovimiento]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header ejecutivo */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-300 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <GitCompare className="w-8 h-8" />
                Análisis de Precierre
              </h2>
              <p className="text-amber-100 text-lg">
                Comparando {periods.length} períodos: {primerPeriodo} → {ultimoPeriodo}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onExportExcel}
                className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={onExportPDF}
                className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-all"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>

          {/* KPIs de variación */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-amber-200 text-xs mb-1">Headcount Inicial</p>
              <p className="text-2xl font-bold">{headcountByPeriod[0]}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-amber-200 text-xs mb-1">Headcount Final</p>
              <p className="text-2xl font-bold">{headcountByPeriod[headcountByPeriod.length - 1]}</p>
              <span className={`text-xs ${variacionHeadcount >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {variacionHeadcount >= 0 ? '+' : ''}{variacionHeadcount}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-amber-200 text-xs mb-1">Altas</p>
              <p className="text-2xl font-bold text-emerald-300">{altas?.length || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-amber-200 text-xs mb-1">Bajas</p>
              <p className="text-2xl font-bold text-red-300">{bajas?.length || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-amber-200 text-xs mb-1">Cambios</p>
              <p className="text-2xl font-bold text-purple-300">
                {(cambiosCargo?.length || 0) + (cambiosArea?.length || 0)}
              </p>
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
                ? 'bg-amber-100 text-amber-700'
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
          {/* Variación de Personal */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Variación de Cantidad de Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-500 mb-1">{primerPeriodo}</p>
                <p className="text-3xl font-bold text-slate-800">{headcountByPeriod[0]}</p>
                <p className="text-xs text-slate-400">empleados</p>
              </div>
              <div className="flex items-center justify-center">
                <div className={`px-6 py-3 rounded-full font-bold text-lg ${
                  variacionHeadcount > 0 ? 'bg-emerald-100 text-emerald-700' :
                  variacionHeadcount < 0 ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {variacionHeadcount > 0 ? '+' : ''}{variacionHeadcount}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-500 mb-1">{ultimoPeriodo}</p>
                <p className="text-3xl font-bold text-slate-800">{headcountByPeriod[headcountByPeriod.length - 1]}</p>
                <p className="text-xs text-slate-400">empleados</p>
              </div>
            </div>

            {/* Evolución por período */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Evolución por período:</p>
              <div className="flex items-end gap-2 h-32">
                {headcountByPeriod.map((hc, i) => {
                  const maxHc = Math.max(...headcountByPeriod);
                  const pct = maxHc > 0 ? (hc / maxHc) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-lg transition-all"
                        style={{ height: `${pct}%` }}
                      />
                      <p className="text-xs text-slate-500 mt-1 text-center">{periodLabels[i]}</p>
                      <p className="text-sm font-bold text-slate-700">{hc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Variación de Total Ganado */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Variación del Total Ganado (Masa Salarial)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-500 mb-1">{primerPeriodo}</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalGanadoByPeriod[0])}</p>
              </div>
              <div className="flex items-center justify-center">
                <div className={`px-4 py-3 rounded-xl font-bold ${
                  variacionTotalGanado > 0 ? 'bg-emerald-100 text-emerald-700' :
                  variacionTotalGanado < 0 ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  <p className="text-lg">{variacionTotalGanado > 0 ? '+' : ''}{formatCurrency(variacionTotalGanado)}</p>
                  <p className="text-xs">({variacionTotalGanadoPct > 0 ? '+' : ''}{roundTwo(variacionTotalGanadoPct)}%)</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center border border-emerald-200">
                <p className="text-sm text-emerald-700 mb-1">{ultimoPeriodo}</p>
                <p className="text-2xl font-bold text-emerald-800">{formatCurrency(totalGanadoByPeriod[totalGanadoByPeriod.length - 1])}</p>
              </div>
            </div>

            {/* Evolución por período */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Evolución por período:</p>
              <div className="flex items-end gap-2 h-32">
                {totalGanadoByPeriod.map((tg, i) => {
                  const maxTg = Math.max(...totalGanadoByPeriod);
                  const pct = maxTg > 0 ? (tg / maxTg) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-emerald-500 to-teal-500 rounded-t-lg transition-all"
                        style={{ height: `${pct}%` }}
                      />
                      <p className="text-xs text-slate-500 mt-1 text-center">{periodLabels[i]}</p>
                      <p className="text-xs font-bold text-slate-700">{formatCurrency(tg)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resumen de Movimientos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 text-center">
              <UserPlus className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-700">{altas?.length || 0}</p>
              <p className="text-sm text-emerald-600">Altas (Ingresos)</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-200 text-center">
              <UserMinus className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-700">{bajas?.length || 0}</p>
              <p className="text-sm text-red-600">Bajas (Salidas)</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-200 text-center">
              <Briefcase className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-purple-700">{cambiosCargo?.length || 0}</p>
              <p className="text-sm text-purple-600">Cambios de Cargo</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 text-center">
              <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-700">{cambiosArea?.length || 0}</p>
              <p className="text-sm text-blue-600">Cambios de Área</p>
            </div>
          </div>

          {/* Top variaciones salariales */}
          {variacionesSalariales && variacionesSalariales.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Top 10 Mayores Variaciones Salariales
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nombre</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Cargo</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Inicial</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Final</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Variación</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variacionesSalariales.slice(0, 10).map((v, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                            v.variacion > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{v.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{v.cargo}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(v.valorInicial)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(v.valorFinal)}</td>
                        <td className="px-4 py-3 text-right">
                          <VariationBadge value={v.variacion} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <VariationBadge value={v.variacionPct} showPercent />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== TAB: VARIACIONES POR PERSONA ========== */}
      {activeTab === 'variaciones' && (
        <div className="space-y-4">
          {/* Selector de variable y filtros */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Variable a comparar</label>
                <select
                  value={selectedVariable}
                  onChange={(e) => setSelectedVariable(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  {variablesDisponibles.map(v => (
                    <option key={v.key} value={v.key}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Buscar empleado</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nombre..."
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Comparando: {variablesDisponibles.find(v => v.key === selectedVariable)?.label} | 
              {filteredVariaciones.length} empleados
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-4 h-4" />
              Clic en columna para ordenar
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <SortableTable
              columns={variacionColumns}
              data={filteredVariaciones}
              highlightCondition={(row) => row.variacion !== 0}
            />
          </div>
        </div>
      )}

      {/* ========== TAB: MOVIMIENTOS ========== */}
      {activeTab === 'movimientos' && (
        <div className="space-y-4">
          {/* Filtro de tipo */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterMovimiento('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !filterMovimiento ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos ({todosMovimientos.length})
              </button>
              <button
                onClick={() => setFilterMovimiento('alta')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterMovimiento === 'alta' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-1" />
                Altas ({altas?.length || 0})
              </button>
              <button
                onClick={() => setFilterMovimiento('baja')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterMovimiento === 'baja' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserMinus className="w-4 h-4 inline mr-1" />
                Bajas ({bajas?.length || 0})
              </button>
              <button
                onClick={() => setFilterMovimiento('cambio_cargo')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterMovimiento === 'cambio_cargo' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4 inline mr-1" />
                Cambio Cargo ({cambiosCargo?.length || 0})
              </button>
              <button
                onClick={() => setFilterMovimiento('cambio_area')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterMovimiento === 'cambio_area' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-1" />
                Cambio Área ({cambiosArea?.length || 0})
              </button>
            </div>
          </div>

          {todosMovimientos.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <SortableTable
                columns={movimientoColumns}
                data={todosMovimientos}
              />
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-12 text-center">
              <GitCompare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No se detectaron movimientos de este tipo</p>
            </div>
          )}
        </div>
      )}

      {/* Botón nuevo análisis */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 font-semibold shadow-lg transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Nuevo Análisis
        </button>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PrecierreAnalysis;
