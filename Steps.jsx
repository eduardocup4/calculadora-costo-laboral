import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle, Settings, Download,
  PieChart, BarChart3, Users, DollarSign, AlertTriangle, ChevronDown,
  ChevronUp, Trash2, Calculator, Building2, GraduationCap, Shirt,
  Filter, Search, Check, X, Save, FolderOpen, TrendingUp, TrendingDown,
  Calendar, ArrowUpRight, ArrowDownRight, Minus, AlertCircle, UserPlus,
  UserMinus, RefreshCw, Target, Activity, Layers, FileText, Clock,
  ChevronRight, Eye, EyeOff, Plus, CalendarDays, Briefcase, Coffee,
  ArrowRight, GitCompare
} from 'lucide-react';
import {
  CONSTANTS, MONTHS, COLORS,
  formatCurrency, formatPercent, roundTwo, parseNumber,
  parseCSV, parseExcel, parseAbsenceFile, autoDetectColumns,
  validateData, calculateAll, analyzePeriods
} from "./utils.js";

// ============================================================================
// COMPONENTE: EDITOR DE PERÍODOS MÚLTIPLES
// ============================================================================

const MultiPeriodEditor = ({ multiFilesData, onChange, onRemove }) => {
  if (!multiFilesData || multiFilesData.length === 0) return null;

  const handleChange = (index, field, value) => {
    const updated = multiFilesData.map((f, i) =>
      i === index ? { ...f, [field]: field === 'month' || field === 'year' ? parseInt(value) : value } : f
    );
    onChange(updated);
  };

  // Ordenar por fecha
  const sortedFiles = [...multiFilesData].sort((a, b) => {
    const dateA = a.year * 12 + a.month;
    const dateB = b.year * 12 + b.month;
    return dateA - dateB;
  });

  return (
    <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          {multiFilesData.length} archivo{multiFilesData.length !== 1 ? 's' : ''} cargado{multiFilesData.length !== 1 ? 's' : ''}
        </h3>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
          Edite mes/año si es necesario
        </span>
      </div>
      <div className="space-y-3 max-h-72 overflow-auto pr-2 custom-scrollbar">
        {sortedFiles.map((f, index) => {
          const originalIndex = multiFilesData.findIndex(mf => mf.name === f.name);
          return (
            <div key={f.name} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 md:col-span-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-slate-800 text-sm block truncate">{f.name}</span>
                  <p className="text-xs text-slate-500">{f.data?.length || 0} registros</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Mes</label>
                <select
                  value={f.month}
                  onChange={(e) => handleChange(originalIndex, 'month', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Año</label>
                <select
                  value={f.year}
                  onChange={(e) => handleChange(originalIndex, 'year', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => onRemove(originalIndex)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar archivo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: CARGA DE ARCHIVO (MEJORADO)
// ============================================================================

export const FileUpload = ({ 
  onFileUpload, 
  onFilesReady,
  isLoading, 
  mode = 'single', 
  periodInfo, 
  onPeriodChange, 
  multiFilesData = [], 
  onMultiFilesChange 
}) => {
  const fileInputRef = useRef(null);

  const detectPeriodFromFilename = (filename) => {
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const lower = filename.toLowerCase();
    
    let month = periodInfo?.month || new Date().getMonth() + 1;
    let year = periodInfo?.year || new Date().getFullYear();
    
    monthNames.forEach((m, i) => {
      if (lower.includes(m)) month = i + 1;
    });
    
    const yearMatch = lower.match(/20\d{2}/);
    if (yearMatch) year = parseInt(yearMatch[0]);
    
    return { month, year };
  };

  const handleChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (mode === 'multi' || mode === 'precierre') {
      // En modo multi/precierre, agregar archivos sin avanzar
      const newFiles = [];
      for (const file of files) {
        try {
          const { headers, data } = file.name.endsWith('.csv')
            ? parseCSV(await file.text())
            : await parseExcel(file);
          
          const detected = detectPeriodFromFilename(file.name);
          newFiles.push({
            name: file.name,
            headers,
            data,
            month: detected.month,
            year: detected.year,
          });
        } catch (error) {
          console.error('Error parsing file:', file.name, error);
          alert(`Error al procesar ${file.name}: ${error.message}`);
        }
      }
      
      // Agregar a los existentes, evitando duplicados
      const existingNames = new Set(multiFilesData.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
      
      if (uniqueNewFiles.length > 0) {
        onMultiFilesChange([...multiFilesData, ...uniqueNewFiles]);
      }
    } else {
      // Modo single: comportamiento normal
      onFileUpload(files[0]);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const files = Array.from(e.dataTransfer.files || [])
      .filter(f => /\.(xlsx|xls|csv)$/i.test(f.name));

    if (!files.length) return;

    if (mode === 'multi' || mode === 'precierre') {
      // Simular el mismo proceso que handleChange
      const newFiles = [];
      for (const file of files) {
        try {
          const { headers, data } = file.name.endsWith('.csv')
            ? parseCSV(await file.text())
            : await parseExcel(file);
          
          const detected = detectPeriodFromFilename(file.name);
          newFiles.push({
            name: file.name,
            headers,
            data,
            month: detected.month,
            year: detected.year,
          });
        } catch (error) {
          console.error('Error parsing file:', file.name, error);
        }
      }
      
      const existingNames = new Set(multiFilesData.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
      
      if (uniqueNewFiles.length > 0) {
        onMultiFilesChange([...multiFilesData, ...uniqueNewFiles]);
      }
    } else {
      onFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemoveFile = (index) => {
    const updated = multiFilesData.filter((_, i) => i !== index);
    onMultiFilesChange(updated);
  };

  const handleProceed = () => {
    if (multiFilesData.length > 0 && onFilesReady) {
      onFilesReady(multiFilesData);
    }
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'multi':
        return {
          color: 'purple',
          title: 'Cargar Archivos para Análisis Predictivo',
          description: 'Suba múltiples archivos de planilla para analizar la evolución del costo laboral por períodos.',
          icon: TrendingUp,
          minFiles: 2,
          recommendation: 'Recomendado: 3 a 12 períodos mensuales'
        };
      case 'precierre':
        return {
          color: 'amber',
          title: 'Cargar Archivos para Análisis de Precierre',
          description: 'Suba archivos de planilla para detectar variaciones salariales, cambios de cargo y movimientos de personal.',
          icon: GitCompare,
          minFiles: 2,
          recommendation: 'Recomendado: 2 a 3 períodos para mejor comparación'
        };
      default:
        return {
          color: 'blue',
          title: 'Cargar Archivo de Planilla',
          description: 'Suba el archivo de planilla mensual para calcular el costo laboral anual.',
          icon: Calculator,
          minFiles: 1,
          recommendation: null
        };
    }
  };

  const config = getModeConfig();
  const IconComponent = config.icon;
  const isMultiMode = mode === 'multi' || mode === 'precierre';
  const canProceed = isMultiMode ? multiFilesData.length >= config.minFiles : false;

  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      shadow: 'shadow-blue-500/25',
      bgLight: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200/60',
      text: 'text-blue-900',
      textLight: 'text-blue-700/80',
      button: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
    },
    purple: {
      gradient: 'from-purple-500 via-purple-600 to-indigo-700',
      shadow: 'shadow-purple-500/25',
      bgLight: 'from-purple-50 to-indigo-50',
      border: 'border-purple-200/60',
      text: 'text-purple-900',
      textLight: 'text-purple-700/80',
      button: 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25'
    },
    amber: {
      gradient: 'from-amber-500 via-amber-600 to-orange-600',
      shadow: 'shadow-amber-500/25',
      bgLight: 'from-amber-50 to-orange-50',
      border: 'border-amber-200/60',
      text: 'text-amber-900',
      textLight: 'text-amber-700/80',
      button: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
    }
  };

  const colors = colorClasses[config.color];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${colors.gradient} mb-6 shadow-xl ${colors.shadow}`}>
          <IconComponent className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          {config.title}
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          {config.description}
        </p>
        {config.recommendation && (
          <p className={`text-sm ${colors.textLight} mt-2`}>
            {config.recommendation}
          </p>
        )}
      </div>

      {isMultiMode && multiFilesData.length === 0 && (
        <div className={`bg-gradient-to-br ${colors.bgLight} border ${colors.border} rounded-2xl p-5 shadow-sm`}>
          <h3 className={`font-semibold ${colors.text} mb-4 flex items-center gap-2`}>
            <CalendarDays className="w-5 h-5" />
            Período por defecto
          </h3>
          <p className={`text-sm ${colors.textLight} mb-4`}>Se aplicará si no se detecta automáticamente del nombre del archivo</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mes</label>
              <select
                value={periodInfo?.month || 1}
                onChange={(e) => onPeriodChange({ ...periodInfo, month: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Año</label>
              <select
                value={periodInfo?.year || new Date().getFullYear()}
                onChange={(e) => onPeriodChange({ ...periodInfo, year: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <label className="block">
        <div
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 group overflow-hidden
            ${isLoading 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-slate-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50'}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center relative z-10">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-lg font-semibold text-blue-600">Procesando archivo...</p>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <p className="text-lg font-semibold text-slate-700 mb-2 group-hover:text-blue-700 transition-colors">
                {isMultiMode
                  ? (multiFilesData.length > 0 ? 'Agregar más archivos' : 'Arrastre sus archivos aquí')
                  : 'Arrastre su archivo aquí'}
              </p>
              <p className="text-slate-500 mb-3">o haga clic para seleccionar</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
                <FileText className="w-4 h-4" />
                Formatos: .xlsx, .xls, .csv
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            multiple={isMultiMode}
            onChange={handleChange}
            className="hidden"
            disabled={isLoading}
          />
        </div>
      </label>

      {/* Lista de archivos cargados */}
      {isMultiMode && multiFilesData.length > 0 && (
        <>
          <MultiPeriodEditor 
            multiFilesData={multiFilesData} 
            onChange={onMultiFilesChange}
            onRemove={handleRemoveFile}
          />
          
          {/* Botón Continuar */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleProceed}
              disabled={!canProceed}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold shadow-lg transition-all ${
                canProceed
                  ? `bg-gradient-to-r ${colors.button} text-white`
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Continuar con {multiFilesData.length} archivo{multiFilesData.length !== 1 ? 's' : ''}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          {!canProceed && (
            <p className="text-center text-sm text-slate-500">
              Necesita al menos {config.minFiles} archivos para continuar
            </p>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE: CARGA DE AUSENCIAS
// ============================================================================

export const AbsenceUpload = ({ onAbsenceUpload, absenceData, isLoading, onBack, onNext, onSkip }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onAbsenceUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) {
      onAbsenceUpload(file);
    }
  };

  const absenceSummary = useMemo(() => {
    if (!absenceData || absenceData.length === 0) return null;
    
    const uniqueEmployees = new Set(absenceData.map(a => a.ci)).size;
    const totalDays = absenceData.reduce((sum, a) => sum + (a.dias || 0), 0);
    const vacationRecords = absenceData.filter(a => a.tipoSolicitud?.toLowerCase().includes('vacacion'));
    const absenceRecords = absenceData.filter(a => !a.tipoSolicitud?.toLowerCase().includes('vacacion'));
    
    return {
      totalRecords: absenceData.length,
      uniqueEmployees,
      totalDays: roundTwo(totalDays),
      vacationRecords: vacationRecords.length,
      absenceRecords: absenceRecords.length,
    };
  }, [absenceData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 mb-6 shadow-xl shadow-purple-500/25">
          <Coffee className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Cargar Archivo de Ausencias
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Opcional: Cargue el archivo de ausencias para calcular el Factor de Bradford y analizar el consumo de vacaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5">
          <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Factor de Bradford
          </h4>
          <p className="text-sm text-amber-700/80">
            Mide el impacto del ausentismo. Score = S² × D (episodios² × días)
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl p-5">
          <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Análisis de Vacaciones
          </h4>
          <p className="text-sm text-emerald-700/80">
            Días según normativa boliviana: 15/20/30 días por antigüedad
          </p>
        </div>
      </div>

      <label className="block">
        <div
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 group
            ${dragOver ? 'border-purple-400 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
              <p className="text-lg font-semibold text-purple-600">Procesando...</p>
            </div>
          ) : (
            <div>
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Upload className="w-10 h-10 text-purple-500" />
              </div>
              <p className="text-lg font-semibold text-slate-700 mb-2">
                Arrastre el archivo de ausencias
              </p>
              <p className="text-slate-500 mb-3">o haga clic para seleccionar</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
                <FileText className="w-4 h-4" />
                Formatos: .xlsx, .xls
              </div>
            </div>
          )}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleChange}
            className="hidden"
            disabled={isLoading}
          />
        </div>
      </label>

      {/* Formato esperado */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Formato esperado del archivo:</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-2 text-left text-slate-600">Nombre</th>
                <th className="px-3 py-2 text-left text-slate-600">C.I.</th>
                <th className="px-3 py-2 text-left text-slate-600">Cargo</th>
                <th className="px-3 py-2 text-left text-slate-600">Tipo Solicitud</th>
                <th className="px-3 py-2 text-left text-slate-600">Fecha Inicio</th>
                <th className="px-3 py-2 text-left text-slate-600">Fecha Fin</th>
                <th className="px-3 py-2 text-left text-slate-600">Días</th>
              </tr>
            </thead>
            <tbody className="text-slate-500">
              <tr>
                <td className="px-3 py-2">Juan Pérez</td>
                <td className="px-3 py-2">1234567</td>
                <td className="px-3 py-2">Analista</td>
                <td className="px-3 py-2">Vacación</td>
                <td className="px-3 py-2">01/01/2024</td>
                <td className="px-3 py-2">05/01/2024</td>
                <td className="px-3 py-2">5</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen si hay datos */}
      {absenceSummary && (
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-5 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            Archivo cargado correctamente
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/80 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{absenceSummary.totalRecords}</p>
              <p className="text-xs text-slate-500">Registros</p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{absenceSummary.uniqueEmployees}</p>
              <p className="text-xs text-slate-500">Empleados</p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{absenceSummary.totalDays}</p>
              <p className="text-xs text-slate-500">Días totales</p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{absenceSummary.vacationRecords}</p>
              <p className="text-xs text-slate-500">Vacaciones</p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{absenceSummary.absenceRecords}</p>
              <p className="text-xs text-slate-500">Ausencias</p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <ChevronDown className="w-5 h-5 rotate-90" />
          Atrás
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            Omitir
          </button>
          <button
            onClick={onNext}
            disabled={!absenceData}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
              absenceData
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Continuar con datos
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: MAPEO DE COLUMNAS
// ============================================================================

export const ColumnMapping = ({ headers, columnMapping, setColumnMapping, sampleRows, onBack, onNext }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const requiredFields = [
    { key: 'nombre', label: 'Nombre del Empleado', icon: Users },
    { key: 'haberBasico', label: 'Haber Básico', icon: DollarSign },
    { key: 'totalGanado', label: 'Total Ganado', icon: Calculator },
  ];

  const optionalFields = [
    { key: 'cargo', label: 'Cargo', icon: Briefcase },
    { key: 'area', label: 'Área/Departamento', icon: Building2 },
    { key: 'empresa', label: 'Empresa', icon: Building2 },
    { key: 'identificador', label: 'CI/Identificador', icon: Users },
    { key: 'bonoAntiguedad', label: 'Bono de Antigüedad', icon: Clock },
    { key: 'bonoDominical', label: 'Bono Dominical', icon: DollarSign },
    { key: 'fechaIngreso', label: 'Fecha de Ingreso', icon: Calendar },
    { key: 'fechaSalida', label: 'Fecha de Salida', icon: Calendar },
  ];

  const handleFieldChange = (key, value) => {
    setColumnMapping(prev => ({ ...prev, [key]: value }));
  };

  const isValid = requiredFields.every(f => columnMapping[f.key]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 mb-6 shadow-xl shadow-indigo-500/25">
          <Settings className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Mapear Columnas
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Seleccione qué columna del archivo corresponde a cada campo requerido.
        </p>
      </div>

      {/* Campos requeridos */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/60">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Campos Requeridos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {requiredFields.map(field => (
            <div key={field.key}>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <field.icon className="w-4 h-4 text-blue-600" />
                {field.label} *
              </label>
              <select
                value={columnMapping[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all ${
                  columnMapping[field.key] ? 'border-emerald-300' : 'border-slate-200'
                }`}
              >
                <option value="">-- Seleccionar --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {Array.isArray(sampleRows) && sampleRows.length > 0 && columnMapping[field.key] && (
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Ej: {String(sampleRows[0]?.[columnMapping[field.key]] ?? '')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vista previa: 5 filas aleatorias */}
      {Array.isArray(sampleRows) && sampleRows.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-2">Vista previa (5 filas aleatorias)</h3>
          <p className="text-sm text-slate-500 mb-4">
            Revise que las columnas seleccionadas contienen datos correctos antes de validar.
          </p>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  {headers.slice(0, 8).map((h) => (
                    <th key={h} className="py-2 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    {headers.slice(0, 8).map((h) => (
                      <td key={h} className="py-2 pr-4 whitespace-nowrap text-slate-700">
                        {row?.[h] != null ? String(row[h]) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {headers.length > 8 && (
            <p className="text-xs text-slate-400 mt-3">
              Mostrando 8 de {headers.length} columnas.
            </p>
          )}
        </div>
      )}

      {/* Campos opcionales */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            Campos Opcionales
          </h3>
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
            {optionalFields.map(field => (
              <div key={field.key}>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                  <field.icon className="w-4 h-4 text-slate-500" />
                  {field.label}
                </label>
                <select
                  value={columnMapping[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
                >
                  <option value="">-- No mapear --</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* Otros Bonos (variables sueltas) - selección múltiple */}
            <div className="md:col-span-2 lg:col-span-4">
              <label className="flex items-center justify-between text-sm font-medium text-slate-600 mb-2">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  Otros Bonos (variables sueltas)
                </span>
                <span className="text-xs text-slate-400">
                  {Array.isArray(columnMapping.otrosBonos) ? columnMapping.otrosBonos.length : 0} seleccionadas
                </span>
              </label>

              <div className="max-h-48 overflow-auto border border-slate-200 rounded-xl bg-white p-3">
                {headers.map((h) => {
                  const selected = Array.isArray(columnMapping.otrosBonos) && columnMapping.otrosBonos.includes(h);
                  return (
                    <label key={h} className="flex items-center gap-2 py-1 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          setColumnMapping(prev => {
                            const prevList = Array.isArray(prev.otrosBonos) ? prev.otrosBonos : [];
                            return {
                              ...prev,
                              otrosBonos: selected
                                ? prevList.filter(x => x !== h)
                                : [...prevList, h],
                            };
                          });
                        }}
                      />
                      <span className="truncate">{h}</span>
                    </label>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Estas columnas se sumarán como <strong>OTROS BONOS</strong> para validar que:
                <strong> Haber Básico + Antigüedad + Dominical + Otros Bonos = Total Ganado</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <ChevronDown className="w-5 h-5 rotate-90" />
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
            isValid
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Validar Datos
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: VALIDACIÓN DE DATOS
// ============================================================================

export const DataValidation = ({ validationResult, onBack, onNext }) => {
  if (!validationResult) return null;

  const toInt = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const valid = toInt(validationResult.valid);
  const invalid = toInt(validationResult.invalid);
  const total = toInt(validationResult.total);
  const errors = Array.isArray(validationResult.errors) ? validationResult.errors : [];
  const validPercent = total > 0 ? Math.round((valid / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-xl ${
          validPercent >= 80 
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25' 
            : validPercent >= 50 
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25'
              : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25'
        }`}>
          {validPercent >= 80 ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-white" />
          )}
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Validación de Datos
        </h2>
        <p className="text-slate-500">
          {valid} de {total} registros son válidos ({validPercent}%)
        </p>
      </div>

      {/* Barra de progreso */}
      <div className="max-w-md mx-auto">
        <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              validPercent >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
              validPercent >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              'bg-gradient-to-r from-red-500 to-rose-500'
            }`}
            style={{ width: `${validPercent}%` }}
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
          <p className="text-3xl font-bold text-emerald-600">{valid}</p>
          <p className="text-sm text-emerald-700">Válidos</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
          <p className="text-3xl font-bold text-red-600">{invalid}</p>
          <p className="text-sm text-red-700">Inválidos</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
          <p className="text-3xl font-bold text-slate-700">{total}</p>
          <p className="text-sm text-slate-600">Total</p>
        </div>
      </div>

      {/* Errores */}
      {errors && errors.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Errores detectados (primeros 10)
          </h4>
          <div className="space-y-2 max-h-48 overflow-auto">
            {errors.slice(0, 10).map((err, i) => (
              <div key={i} className="text-sm text-red-700 bg-white/50 px-3 py-2 rounded-lg">
                Fila {err.row}: {err.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <ChevronDown className="w-5 h-5 rotate-90" />
          Corregir Mapeo
        </button>
        <button
          onClick={onNext}
          disabled={total === 0 || invalid > 0}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
            total > 0 && invalid === 0
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {invalid > 0 ? `No se puede continuar: ${invalid} error(es)` : `Continuar con ${valid} registros`}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: SELECCIÓN DE EMPLEADOS
// ============================================================================

export const EmployeeSelection = ({ 
  fileData, 
  columnMapping, 
  selectedEmployees, 
  setSelectedEmployees, 
  savedGroups,
  setSavedGroups,
  onBack, 
  onNext 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterCargo, setFilterCargo] = useState('');

  const employees = useMemo(() => {
    if (!fileData || !columnMapping.nombre) return [];
    return fileData.map((row, index) => ({
      id: index,
      nombre: row[columnMapping.nombre] || 'Sin nombre',
      cargo: row[columnMapping.cargo] || '',
      area: row[columnMapping.area] || '',
      ci: row[columnMapping.identificador] || '',
    }));
  }, [fileData, columnMapping]);

  const uniqueAreas = useMemo(() => 
    [...new Set(employees.map(e => e.area).filter(Boolean))].sort(),
  [employees]);

  const uniqueCargos = useMemo(() => 
    [...new Set(employees.map(e => e.cargo).filter(Boolean))].sort(),
  [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = !searchTerm || 
        emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cargo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchArea = !filterArea || emp.area === filterArea;
      const matchCargo = !filterCargo || emp.cargo === filterCargo;
      return matchSearch && matchArea && matchCargo;
    });
  }, [employees, searchTerm, filterArea, filterCargo]);

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedEmployees(filteredEmployees.map(e => e.id));
  const deselectAll = () => setSelectedEmployees([]);

  const isAllSelected = filteredEmployees.length > 0 && 
    filteredEmployees.every(e => selectedEmployees.includes(e.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 mb-6 shadow-xl shadow-teal-500/25">
          <Users className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Seleccionar Empleados
        </h2>
        <p className="text-slate-500">
          Seleccione los empleados a incluir en el cálculo o deje vacío para incluir todos.
        </p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre o cargo..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Área</label>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="">Todas</option>
            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Cargo</label>
          <select
            value={filterCargo}
            onChange={(e) => setFilterCargo(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="">Todos</option>
            {uniqueCargos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={isAllSelected ? deselectAll : selectAll}
            className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium"
          >
            {isAllSelected ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {isAllSelected ? 'Deseleccionar' : 'Seleccionar'} filtrados ({filteredEmployees.length})
          </button>
        </div>
        <div className="text-sm text-slate-500">
          {selectedEmployees.length} de {employees.length} seleccionados
        </div>
      </div>

      {/* Lista de empleados */}
      <div className="max-h-96 overflow-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={isAllSelected ? deselectAll : selectAll}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Cargo</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Área</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr 
                key={emp.id} 
                className={`border-t border-slate-100 hover:bg-teal-50 cursor-pointer transition-colors ${
                  selectedEmployees.includes(emp.id) ? 'bg-teal-50' : ''
                }`}
                onClick={() => toggleEmployee(emp.id)}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{emp.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{emp.cargo}</td>
                <td className="px-4 py-3 text-slate-600">{emp.area}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <ChevronDown className="w-5 h-5 rotate-90" />
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all"
        >
          {selectedEmployees.length > 0 
            ? `Calcular con ${selectedEmployees.length} empleados`
            : `Calcular con todos (${employees.length})`
          }
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: CONFIGURACIÓN DE CÁLCULO
// ============================================================================

export const CalculationConfig = ({ 
  provisions, 
  setProvisions, 
  additionalCosts, 
  setAdditionalCosts,
  uniqueCargos,
  uniqueAreas,
  onBack, 
  onNext 
}) => {
  const provisionItems = [
    { key: 'aguinaldo', label: 'Aguinaldo (Navidad)', percent: 8.33, required: true },
    { key: 'segundoAguinaldo', label: 'Segundo Aguinaldo (Esfuerzo Bolivia)', percent: 8.33, required: false },
    { key: 'primaUtilidades', label: 'Prima de Utilidades', percent: 8.33, required: true },
    { key: 'segundaPrima', label: 'Segunda Prima', percent: 8.33, required: false },
    { key: 'indemnizacion', label: 'Indemnización', percent: 8.33, required: true },
  ];

  const toggleProvision = (key) => {
    setProvisions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeProvisions = Object.entries(provisions).filter(([_, v]) => v).length;
  const provisionPercent = activeProvisions * 8.33;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 mb-6 shadow-xl shadow-violet-500/25">
          <Settings className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Configuración del Cálculo
        </h2>
        <p className="text-slate-500">
          Seleccione las provisiones y aportes a incluir en el cálculo.
        </p>
      </div>

      {/* Provisiones */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            Provisiones Laborales
          </h3>
          <span className="text-sm text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
            {roundTwo(provisionPercent)}% del Total Ganado
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {provisionItems.map(item => (
            <label
              key={item.key}
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                provisions[item.key]
                  ? 'bg-white border-2 border-indigo-400 shadow-sm'
                  : 'bg-white/50 border border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={provisions[item.key]}
                  onChange={() => toggleProvision(item.key)}
                  disabled={item.required}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-medium text-slate-800 text-sm">{item.label}</span>
                  {item.required && (
                    <span className="ml-2 text-xs text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                      Obligatorio
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-500">{item.percent}%</span>
            </label>
          ))}
        </div>
      </div>

      {/* Aportes Patronales */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            Aportes Patronales
          </h3>
          <span className="text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            17.21% del Total Ganado
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Caja de Salud (Seguridad Social Corto Plazo)', percent: '10%' },
            { label: 'Fondo de Vivienda (FV)', percent: '2%' },
            { label: 'Riesgo Profesional (RP)', percent: '1.71%' },
            { label: 'Aporte Patronal Solidario', percent: '3.5%' },          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/70 rounded-xl border border-amber-200">
              <span className="font-medium text-slate-800 text-sm">{item.label}</span>
              <span className="text-sm text-amber-700 font-semibold">{item.percent}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-700/70 mt-3">
          * Los aportes patronales son obligatorios según legislación boliviana
        </p>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <ChevronDown className="w-5 h-5 rotate-90" />
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all"
        >
          Calcular Costo Laboral
          <Calculator className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
