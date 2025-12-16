import React, { useState, useMemo, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle, Settings, Download,
  PieChart, BarChart3, Users, DollarSign, AlertTriangle, ChevronDown,
  ChevronUp, Trash2, Calculator, Building2, GraduationCap, Shirt,
  Filter, Search, Check, X, Save, FolderOpen, TrendingUp, TrendingDown,
  Calendar, ArrowUpRight, ArrowDownRight, Minus, AlertCircle, UserPlus,
  UserMinus, RefreshCw, Target, Activity, Layers, FileText, Clock,
  ChevronRight, Eye, EyeOff, Plus, CalendarDays, Briefcase, Coffee,
  ArrowRight, GitCompare, HelpCircle
} from 'lucide-react';
import {
  CONSTANTS, formatCurrency, formatPercent
} from "./utils.js";

// ============================================================================
// 1. COMPONENTE: CARGA DE ARCHIVOS (Single & Multi)
// ============================================================================

export const FileUpload = ({ mode, onFileUpload, onMultiUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (mode === 'single') onFileUpload(e.dataTransfer.files[0]);
      else onMultiUpload(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      if (mode === 'single') onFileUpload(e.target.files[0]);
      else onMultiUpload(e.target.files);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
          mode === 'single' ? 'bg-blue-100 text-blue-600' : 
          mode === 'predictive' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {mode === 'single' ? <Calculator className="w-8 h-8" /> : 
           mode === 'predictive' ? <TrendingUp className="w-8 h-8" /> : <GitCompare className="w-8 h-8" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {mode === 'single' ? 'Cargar Planilla Mensual' : 
           mode === 'predictive' ? 'Cargar Histórico de Planillas' : 'Cargar Planillas para Comparar'}
        </h2>
        <p className="text-slate-500">
          {mode === 'single' 
            ? 'Sube tu archivo Excel (.xlsx, .xls) o CSV para calcular el costo laboral.' 
            : 'Selecciona múltiples archivos Excel correspondientes a diferentes meses.'}
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          multiple={mode !== 'single'}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept=".xlsx, .xls, .csv"
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="font-semibold text-slate-700">Procesando datos...</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-white rounded-full shadow-lg mx-auto mb-6 flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-2">
              Arrastra tus archivos aquí o <span className="text-blue-600 underline">haz clic para buscar</span>
            </p>
            <p className="text-sm text-slate-400">
              Soporta archivos Excel y CSV
            </p>
          </>
        )}
      </div>

      {mode !== 'single' && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>
            Para un mejor análisis, asegúrate de que los archivos tengan nombres que incluyan el mes y año (ej: "Planilla_Enero_2025.xlsx").
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. COMPONENTE: MAPEO DE COLUMNAS
// ============================================================================

export const ColumnMapping = ({ headers, mapping, onChange, onConfirm, onBack }) => {
  // Campos requeridos por el sistema (utils.js)
  const fields = [
    { key: 'nombre', label: 'Nombre Completo', required: true, desc: 'Nombre del empleado' },
    { key: 'cargo', label: 'Cargo', required: true, desc: 'Puesto o función' },
    { key: 'area', label: 'Área / Departamento', required: true, desc: 'Para agrupar costos' },
    { key: 'haberBasico', label: 'Haber Básico', required: true, desc: 'Salario de contrato' },
    { key: 'bonoAntiguedad', label: 'Bono Antigüedad', required: false, desc: 'Monto ganado (opcional si hay fecha ingreso)' },
    { key: 'fechaIngreso', label: 'Fecha Ingreso', required: false, desc: 'Para calcular antigüedad real' },
    { key: 'ci', label: 'Cédula (CI)', required: false, desc: 'Identificador único (Recomendado)' },
    { key: 'totalGanado', label: 'Total Ganado', required: false, desc: 'Si ya tiene bonos sumados' },
  ];

  const progress = fields.reduce((acc, field) => {
    return acc + (mapping[field.key] ? 1 : 0);
  }, 0);
  
  const progressPct = (progress / fields.filter(f => f.required).length) * 100;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mapeo de Columnas</h2>
          <p className="text-slate-500">Confirma qué columna de tu Excel corresponde a cada dato.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-600 mb-1">Progreso Requerido</div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => {
          const isMapped = !!mapping[field.key];
          
          return (
            <div 
              key={field.key} 
              className={`p-4 rounded-xl border transition-all ${
                isMapped 
                  ? 'bg-white border-emerald-200 shadow-sm' 
                  : field.required 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <label className="font-semibold text-slate-700 flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500 text-xs">*</span>}
                  {isMapped && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                </label>
                <HelpCircle className="w-4 h-4 text-slate-300 cursor-help" title={field.desc} />
              </div>
              
              <select
                value={mapping[field.key] || ''}
                onChange={(e) => onChange({ ...mapping, [field.key]: e.target.value })}
                className={`w-full p-2.5 rounded-lg border text-sm outline-none focus:ring-2 ${
                  isMapped 
                    ? 'border-emerald-200 focus:ring-emerald-500 bg-emerald-50/30' 
                    : 'border-slate-300 focus:ring-blue-500 bg-white'
                }`}
              >
                <option value="">-- Seleccionar Columna --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              
              <p className="text-xs text-slate-400 mt-2">{field.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-all"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Atrás
        </button>
        <button
          onClick={onConfirm}
          disabled={progressPct < 100}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold shadow-lg transition-all ${
            progressPct >= 100 
              ? 'bg-slate-800 text-white hover:bg-slate-900 hover:shadow-xl' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Validar y Continuar
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 3. COMPONENTE: CONFIGURACIÓN Y PARÁMETROS
// ============================================================================

export const CalculationConfig = ({ config, setConfig, onCalculate, onBack }) => {
  
  const toggleParam = (key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Parámetros de Legislación 2025</h2>
        <p className="text-slate-500">Revisa los parámetros aplicados automáticamente según normativa boliviana.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Panel Izquierdo: Parámetros Fijos (Informativo) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Cargas Patronales (Ley)
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Caja Nacional de Salud', val: formatPercent(CONSTANTS.CNS * 100) },
              { label: 'AFP - Riesgo Profesional', val: formatPercent(CONSTANTS.AFP_RIESGO_PROFESIONAL * 100) },
              { label: 'AFP - Pro Vivienda', val: formatPercent(CONSTANTS.AFP_PRO_VIVIENDA * 100) },
              { label: 'Aporte Patronal Solidario', val: formatPercent(CONSTANTS.AFP_SOLIDARIO_PATRONAL * 100) },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="font-bold text-slate-800">{item.val}</span>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-blue-700">Total Carga Patronal</span>
                <span className="font-bold text-blue-700">16.71%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <h4 className="font-bold text-amber-800 text-sm mb-2">Base de Cálculo</h4>
            <div className="flex justify-between text-sm">
              <span className="text-amber-700">Salario Mínimo Nacional</span>
              <span className="font-bold text-amber-900">{formatCurrency(CONSTANTS.SMN)}</span>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Provisiones (Configurable) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-emerald-600" />
            Provisiones Sociales (Pasivos)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Selecciona qué provisiones deseas incluir en el cálculo del costo mensual.
          </p>
          
          <div className="space-y-3">
            <ToggleOption 
              label="Aguinaldo de Navidad" 
              sub="8.33% mensual (1 sueldo/año)"
              active={config.aguinaldo} 
              onClick={() => toggleParam('aguinaldo')} 
            />
            <ToggleOption 
              label="Indemnización" 
              sub="8.33% mensual (1 sueldo/año)"
              active={config.indemnizacion} 
              onClick={() => toggleParam('indemnizacion')} 
            />
            <ToggleOption 
              label="Prima de Utilidades" 
              sub="Si la empresa tiene utilidades (8.33%)"
              active={config.primaUtilidades} 
              onClick={() => toggleParam('primaUtilidades')} 
            />
            <ToggleOption 
              label="Segundo Aguinaldo" 
              sub="Esfuerzo por Bolivia (Condicional)"
              active={config.segundoAguinaldo} 
              onClick={() => toggleParam('segundoAguinaldo')} 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium px-4">
          Atrás
        </button>
        <button
          onClick={onCalculate}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <Calculator className="w-5 h-5" />
          Realizar Cálculo
        </button>
      </div>
    </div>
  );
};

// Componente auxiliar para Toggles
const ToggleOption = ({ label, sub, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
      active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
    }`}
  >
    <div>
      <p className={`font-semibold ${active ? 'text-emerald-900' : 'text-slate-700'}`}>{label}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
      active ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
    }`}>
      {active && <Check className="w-4 h-4 text-white" />}
    </div>
  </div>
);

// Icono auxiliar
const WalletIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
);

// ============================================================================
// 4. COMPONENTE: CARGA DE AUSENCIAS (Predictivo)
// ============================================================================

export const AbsenceUpload = ({ onAbsenceUpload, absenceData, onNext, onSkip, isLoading }) => {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Datos de Ausentismo (Opcional)</h2>
        <p className="text-slate-500 mt-2">
          Sube un archivo con el registro de vacaciones y bajas médicas para calcular el Factor Bradford.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-amber-200 mb-6">
        {absenceData ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-2" />
            <p className="font-bold text-slate-800">Archivo Procesado</p>
            <p className="text-sm text-slate-500">{absenceData.length} registros encontrados</p>
            <button 
              onClick={() => document.getElementById('absence-upload').click()}
              className="text-amber-600 text-sm underline mt-2 hover:text-amber-700"
            >
              Cambiar archivo
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center">
            <Upload className="w-10 h-10 text-amber-400 mb-3" />
            <span className="font-medium text-slate-700">Cargar Excel de Ausencias</span>
            <span className="text-xs text-slate-400 mt-1">Columnas requeridas: Nombre, Tipo, Días</span>
            <input 
              id="absence-upload" 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files[0] && onAbsenceUpload(e.target.files[0])}
            />
          </label>
        )}
      </div>

      {isLoading && <p className="text-amber-600 font-medium animate-pulse">Procesando ausencias...</p>}

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onSkip}
          className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition-all"
        >
          Omitir este paso
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2"
        >
          Ver Análisis Final
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 5. COMPONENTE: VALIDACIÓN DE DATOS (Resumen)
// ============================================================================

export const DataValidation = ({ validation, onContinue, onBack }) => {
  // Este componente puede ser un modal o un paso intermedio
  // Simplificado para integración en App.jsx si se necesita, 
  // pero la lógica principal suele manejarse con alertas o estados directos.
  return null; 
};