import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Calendar, Award,
  UserPlus, UserMinus, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle,
  BarChart3, PieChart, Activity, Target, RefreshCw, Clock, Coffee,
  ChevronDown, ChevronUp, Download, FileSpreadsheet, FileText, Building2,
  AlertCircle, CheckCircle, XCircle, Briefcase, Heart, Sun, Eye
} from 'lucide-react';
import {
  formatCurrency, formatPercent, formatNumber, formatDate, roundTwo,
  MONTHS, COLORS, BRADFORD_THRESHOLDS
} from './utils.js';

// ============================================================================
// COMPONENTE: FOOTER CON FIRMA
// ============================================================================

const Footer = () => (
  <footer className="mt-8 pt-6 border-t border-slate-200">
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-center md:text-left">
        <p className="text-sm text-slate-500">
          Análisis Predictivo de Costo Laboral | Legislación Boliviana
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
// COMPONENTES AUXILIARES
// ============================================================================

const SectionHeader = ({ icon: Icon, title, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-rose-600',
    purple: 'from-purple-500 to-violet-600',
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, trendValue }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-rose-600',
    purple: 'from-purple-500 to-violet-600',
    slate: 'from-slate-600 to-slate-700',
  };

  const bgColorClasses = {
    blue: 'bg-blue-500/10',
    green: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    red: 'bg-red-500/10',
    purple: 'bg-purple-500/10',
    slate: 'bg-slate-500/10',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    slate: 'text-slate-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${bgColorClasses[color]} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 
            trend === 'down' ? 'bg-red-100 text-red-700' : 
            'bg-slate-100 text-slate-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : 
             trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : 
             <Minus className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};

const BradfordBadge = ({ classification }) => {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  const iconMap = {
    emerald: '🟢',
    amber: '🟡',
    orange: '🟠',
    red: '🔴',
  };

  const color = classification?.color || 'emerald';
  const label = classification?.label || 'Bajo';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colorMap[color]}`}>
      {iconMap[color]} {label}
    </span>
  );
};

const VacationStatusBadge = ({ status }) => {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${colorMap[status.color]}`}>
      {status.label}
    </span>
  );
};

const ProgressBar = ({ value, max, color = 'blue', showLabel = true }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-500',
    green: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-red-500 to-rose-500',
    purple: 'from-purple-500 to-violet-500',
  };

  return (
    <div className="w-full">
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 mt-1 text-right">{roundTwo(pct)}%</p>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: ANÁLISIS PREDICTIVO
// ============================================================================

const PredictiveAnalysis = ({
  analysis,
  onExportExcel,
  onExportPDF,
  onNewAnalysis
}) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedTables, setExpandedTables] = useState({});

  // ----------------------------------------------------------------------
  // 1. ADAPTADOR DE DATOS (CRÍTICO PARA QUE FUNCIONE EL UTILS SENIOR)
  // ----------------------------------------------------------------------
  
  // Extraemos las nuevas estructuras del utils.js Senior
  const {
    labels = [],
    seriesCosto = [],
    seriesHC = [],
    forecast = [], // Ahora es un Array
    absenceStats = null, // Nombre actualizado
    tendencia = 'Estable',
    rotacion = { tasaAnualizada: 0, tasaMensualPromedio: 0, totalSalidas: 0, headcountPromedio: 0 },
    headcountInicial = 0,
    headcountFinal = 0,
    ingresos = [],
    salidas = [],
    promociones = [],
    topIncrementos = [],
    decrementos = [],
    altaVariabilidad = [],
    sinCambios = [],
    totalPeriods = 0,
    periods = []
  } = analysis || {};

  // Reconstruimos las variables que tu UI original espera
  const tendenciaCostoTotal = labels.map((l, i) => ({ periodo: l, valor: seriesCosto[i] || 0 }));
  const tendenciaHeadcount = labels.map((l, i) => ({ periodo: l, valor: seriesHC[i] || 0 }));
  const absenceAnalysis = absenceStats; // Alias para compatibilidad
  
  // Mockup para antiguedad si no viniera calculada
  const antiguedadAnalysis = analysis?.antiguedadAnalysis || {
      promedioAnios: 0,
      ranges: { "0-2 años": {count: 0}, "2-5 años": {count: 0}, "5+ años": {count: 0} },
      employeesWithData: 0
  };

  // ----------------------------------------------------------------------

  const toggleTable = (key) => {
    setExpandedTables(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500 text-lg">No hay datos de análisis disponibles</p>
      </div>
    );
  }

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'personal', label: 'Personal', icon: Users },
    { id: 'salarial', label: 'Salarial', icon: DollarSign },
    { id: 'bienestar', label: 'Bienestar', icon: Heart },
    { id: 'proyecciones', label: 'Proyecciones', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Ejecutivo */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Análisis Predictivo de People Analytics
              </h2>
              <p className="text-slate-400 text-lg">
                {totalPeriods} períodos analizados: {labels[0]} → {labels[labels.length - 1]}
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-xs">Headcount Actual</span>
              </div>
              <p className="text-2xl font-bold">{headcountFinal}</p>
              <p className="text-xs text-slate-400">Inicial: {headcountInicial}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-400 text-xs">Ingresos</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{ingresos?.length || 0}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <UserMinus className="w-5 h-5 text-red-400" />
                <span className="text-slate-400 text-xs">Salidas</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{salidas?.length || 0}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <span className="text-slate-400 text-xs">Rotación Anualizada</span>
              </div>
              <p className="text-2xl font-bold text-amber-400">{rotacion?.tasaAnualizada || 0}%</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400 text-xs">Tendencia</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{tendencia}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de secciones */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <section.icon className="w-5 h-5" />
            {section.label}
          </button>
        ))}
      </div>

      {/* ========== SECCIÓN: DASHBOARD ========== */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Tendencia de Costo Total */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <SectionHeader icon={TrendingUp} title="Evolución del Costo Laboral" subtitle="Tendencia mensual" color="blue" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de tendencia */}
              <div className="space-y-4">
                {tendenciaCostoTotal.map((item, i) => {
                  const maxVal = Math.max(...tendenciaCostoTotal.map(t => t.valor));
                  const pct = maxVal > 0 ? (item.valor / maxVal) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 font-medium">{item.periodo}</span>
                        <span className="font-bold text-slate-800">{formatCurrency(item.valor)}</span>
                      </div>
                      <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Headcount por período */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 mb-3">Evolución del Headcount</h4>
                {tendenciaHeadcount.map((item, i) => {
                  const maxVal = Math.max(...tendenciaHeadcount.map(t => t.valor));
                  const pct = maxVal > 0 ? (item.valor / maxVal) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 font-medium">{item.periodo}</span>
                        <span className="font-bold text-slate-800">{item.valor} empleados</span>
                      </div>
                      <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resumen de KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Promociones"
              value={promociones?.length || 0}
              subtitle="Cambios de cargo detectados"
              icon={Award}
              color="purple"
            />
            <KPICard
              title="Incrementos Salariales"
              value={topIncrementos?.length || 0}
              subtitle="Empleados con aumento"
              icon={TrendingUp}
              color="green"
            />
            <KPICard
              title="Decrementos"
              value={decrementos?.length || 0}
              subtitle="Empleados con reducción"
              icon={TrendingDown}
              color="red"
            />
            <KPICard
              title="Sin Cambios"
              value={sinCambios?.length || 0}
              subtitle="Salario estable"
              icon={Minus}
              color="slate"
            />
          </div>

          {/* Resumen Bradford y Vacaciones si hay datos */}
          {absenceAnalysis?.hasData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
                <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Resumen Factor Bradford
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{absenceAnalysis.summary.lowCount}</p>
                    <p className="text-xs text-slate-500">🟢 Bajo</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{absenceAnalysis.summary.moderateCount}</p>
                    <p className="text-xs text-slate-500">🟡 Moderado</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{absenceAnalysis.summary.highCount}</p>
                    <p className="text-xs text-slate-500">🟠 Alto</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{absenceAnalysis.summary.criticalCount}</p>
                    <p className="text-xs text-slate-500">🔴 Crítico</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
                <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-emerald-600" />
                  Resumen Vacaciones
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{absenceAnalysis.summary.consumoSaludableCount}</p>
                    <p className="text-xs text-slate-500">Consumo Saludable</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{absenceAnalysis.summary.consumoAtencionCount}</p>
                    <p className="text-xs text-slate-500">Requiere Atención</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{absenceAnalysis.summary.consumoCriticoCount}</p>
                    <p className="text-xs text-slate-500">Crítico</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{absenceAnalysis.summary.presencialismoCount}</p>
                    <p className="text-xs text-slate-500">Presencialismo</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== SECCIÓN: PERSONAL ========== */}
      {activeSection === 'personal' && (
        <div className="space-y-6">
          {/* Tasa de Rotación */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <SectionHeader icon={RefreshCw} title="Tasa de Rotación" subtitle="Análisis de movimiento de personal" color="amber" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-amber-700 mb-1">Tasa Mensual Promedio</p>
                <p className="text-3xl font-bold text-amber-800">{rotacion?.tasaMensualPromedio || 0}%</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-200">
                <p className="text-sm text-red-700 mb-1">Tasa Anualizada</p>
                <p className="text-3xl font-bold text-red-800">{rotacion?.tasaAnualizada || 0}%</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Total Salidas</p>
                <p className="text-3xl font-bold text-slate-800">{rotacion?.totalSalidas || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Headcount Promedio</p>
                <p className="text-3xl font-bold text-blue-800">{rotacion?.headcountPromedio || 0}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
              <p><strong>Fórmula:</strong> (Salidas / Meses) / Headcount Promedio × 100</p>
              <p className="mt-1">Período analizado: {rotacion?.mesesAnalizados || 0} meses</p>
            </div>
          </div>

          {/* Ingresos */}
          {ingresos?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={UserPlus} title="Nuevos Ingresos" subtitle={`${ingresos.length} incorporaciones`} color="green" />
                <button onClick={() => toggleTable('ingresos')} className="p-2 hover:bg-slate-100 rounded-lg">
                  {expandedTables.ingresos ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
              
              {(expandedTables.ingresos !== false) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Cargo</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Área</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Período Ingreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingresos.slice(0, 15).map((emp, i) => (
                        <tr key={i} className="border-t border-slate-100 hover:bg-emerald-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{emp.nombre}</td>
                          <td className="px-4 py-3 text-slate-600">{emp.cargo}</td>
                          <td className="px-4 py-3 text-slate-600">{emp.area}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                              {emp.periodo}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Salidas */}
          {salidas?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={UserMinus} title="Salidas de Personal" subtitle={`${salidas.length} desvinculaciones`} color="red" />
                <button onClick={() => toggleTable('salidas')} className="p-2 hover:bg-slate-100 rounded-lg">
                  {expandedTables.salidas ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
              
              {(expandedTables.salidas !== false) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Cargo</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Área</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Último Período</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salidas.slice(0, 15).map((emp, i) => (
                        <tr key={i} className="border-t border-slate-100 hover:bg-red-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{emp.nombre}</td>
                          <td className="px-4 py-3 text-slate-600">{emp.cargo}</td>
                          <td className="px-4 py-3 text-slate-600">{emp.area}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              {emp.periodoSalida}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========== SECCIÓN: SALARIAL ========== */}
      {activeSection === 'salarial' && (
        <div className="space-y-6">
          {/* Top 10 Incrementos */}
          {topIncrementos?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <SectionHeader icon={TrendingUp} title="Top 10 Mayores Incrementos" subtitle="Variación salarial positiva" color="green" />
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Cargo</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Salario Inicial</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Salario Final</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Incremento</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">% Var</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topIncrementos.map((emp, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-emerald-50">
                        <td className="px-4 py-3">
                          <span className="w-6 h-6 inline-flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{emp.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{emp.cargo}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(emp.salarioInicial)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(emp.salarioFinal)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">+{formatCurrency(emp.variacion)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            +{emp.variacionPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Decrementos */}
          {decrementos?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <SectionHeader icon={TrendingDown} title="Decrementos Salariales" subtitle={`${decrementos.length} casos detectados`} color="red" />
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Cargo</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Salario Inicial</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Salario Final</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Decremento</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">% Var</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decrementos.slice(0, 10).map((emp, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-red-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{emp.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{emp.cargo}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(emp.salarioInicial)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(emp.salarioFinal)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(emp.variacion)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                            {emp.variacionPct}%
                          </span>
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

      {/* ========== SECCIÓN: BIENESTAR ========== */}
      {activeSection === 'bienestar' && (
        <div className="space-y-6">
          {absenceAnalysis?.hasData ? (
            <>
              {/* Factor de Bradford */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader icon={AlertTriangle} title="Factor de Bradford" subtitle="Análisis de ausentismo" color="amber" />
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-6 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Fórmula:</strong> S² × D (Episodios² × Días totales)
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1">🟢 Bajo: &lt;200</span>
                    <span className="flex items-center gap-1">🟡 Moderado: 200-449</span>
                    <span className="flex items-center gap-1">🟠 Alto: 450-899</span>
                    <span className="flex items-center gap-1">🔴 Crítico: ≥900</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-slate-800">{absenceAnalysis.summary.totalAbsenceDays}</p>
                    <p className="text-xs text-slate-500">Días Ausencia Total</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{absenceAnalysis.summary.averageBradford}</p>
                    <p className="text-xs text-slate-500">Bradford Promedio</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                    <p className="text-3xl font-bold text-red-600">{absenceAnalysis.summary.criticalCount}</p>
                    <p className="text-xs text-red-600">Casos Críticos</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
                    <p className="text-3xl font-bold text-orange-600">{absenceAnalysis.summary.highCount}</p>
                    <p className="text-xs text-orange-600">Casos Altos</p>
                  </div>
                </div>

                {/* Tabla Bradford */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Empleado</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Cargo</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Episodios</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Días</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Score</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Clasificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absenceAnalysis.list // Ahora usamos "list" en vez de "bradfordByEmployee" por consistencia de utils
                         .filter(b => b.score > 0)
                        .slice(0, 20)
                        .map((emp, i) => (
                        <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{emp.nombre}</td>
                          <td className="px-4 py-3 text-slate-600">{emp.cargo}</td>
                          <td className="px-4 py-3 text-center font-semibold">{emp.frecuencia}</td> {/* actualizado a 'frecuencia' */}
                          <td className="px-4 py-3 text-center font-semibold">{emp.diasTotales}</td> {/* actualizado a 'diasTotales' */}
                          <td className="px-4 py-3 text-center font-bold text-slate-800">{emp.score}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold 
                              ${emp.status === 'Crítico' ? 'bg-red-100 text-red-700' : 
                                emp.status === 'Alto' ? 'bg-orange-100 text-orange-700' :
                                emp.status === 'Moderado' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'}`}>
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-12 text-center">
              <Coffee className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">Sin datos de ausencias</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                No se cargó archivo de ausencias. Para ver el Factor de Bradford y análisis de vacaciones, 
                cargue un archivo de ausencias en el paso correspondiente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========== SECCIÓN: PROYECCIONES ========== */}
      {activeSection === 'proyecciones' && (
        <div className="space-y-6">
          {/* Forecast de Costo */}
          {forecast && forecast.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <SectionHeader icon={Target} title="Proyección de Costo Laboral" subtitle="Forecast basado en tendencia lineal" color="blue" />
              
              {/* Tarjetas de Proyección Corregidas para Array */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                 {forecast.map((item, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                    <p className="text-sm text-blue-700 mb-2">{item.label}</p>
                    <p className="text-3xl font-bold text-blue-800">{formatCurrency(item.valor)}</p>
                  </div>
                 ))}
              </div>

              <div className={`rounded-xl p-4 ${
                tendencia === 'Alza' 
                  ? 'bg-amber-50 border border-amber-200' 
                  : tendencia === 'Baja'
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-slate-50 border border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  {tendencia === 'Alza' ? (
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  ) : tendencia === 'Baja' ? (
                    <TrendingDown className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Minus className="w-6 h-6 text-slate-600" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      tendencia === 'Alza' ? 'text-amber-800' :
                      tendencia === 'Baja' ? 'text-emerald-800' : 'text-slate-800'
                    }`}>
                      Tendencia a la {tendencia}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico de evolución con forecast */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-6">Evolución y Proyección del Costo</h4>
            
            <div className="space-y-4">
              {/* Datos históricos */}
              {tendenciaCostoTotal.map((item, i) => {
                const maxVal = Math.max(...tendenciaCostoTotal.map(t => t.valor));
                const pct = maxVal > 0 ? (item.valor / maxVal) * 100 : 0;
                
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 font-medium">{item.periodo}</span>
                      <span className="font-bold text-slate-800">{formatCurrency(item.valor)}</span>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              
              {/* Proyecciones */}
              {forecast && (
                <>
                  <div className="border-t border-dashed border-slate-300 pt-4 mt-4">
                    <p className="text-xs text-slate-500 mb-3 font-semibold">PROYECCIONES</p>
                  </div>
                  
                  {forecast.map((proj, i) => {
                    // Calculamos porcentaje relativo al histórico para la barra
                    const maxVal = Math.max(...tendenciaCostoTotal.map(t => t.valor));
                    const pct = maxVal > 0 ? (proj.valor / maxVal) * 100 : 0;
                    
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-purple-600 font-medium">{proj.label}</span>
                          <span className="font-bold text-purple-800">{formatCurrency(proj.valor)}</span>
                        </div>
                        <div className="h-6 bg-purple-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-violet-500 transition-all duration-500 opacity-70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
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

      {/* Footer con firma */}
      <Footer />
    </div>
  );
};

export default PredictiveAnalysis;