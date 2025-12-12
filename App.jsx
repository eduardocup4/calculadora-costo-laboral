import React, { useState, useCallback, useMemo } from 'react';
import {
  Calculator, TrendingUp, GitCompare, RefreshCw, Download,
  FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Check,
  Award, BarChart3, Users, DollarSign, Building2, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import {
  CONSTANTS, MONTHS, COLORS,
  formatCurrency, formatPercent, roundTwo, parseNumber,
  parseCSV, parseExcel, parseAbsenceFile, autoDetectColumns,
  validateData, calculateAll, analyzePeriods, analyzePrecierre,
  consolidateHeaders
} from './utils.js';

import {
  FileUpload, ColumnMapping, DataValidation,
  EmployeeSelection, CalculationConfig, AbsenceUpload
} from './Steps.jsx';
import Results from './Results.jsx';
import PredictiveAnalysis from './PredictiveAnalysis.jsx';
import PrecierreAnalysis from './PrecierreAnalysis.jsx';

// ============================================================================
// COMPONENTE: SELECTOR DE MODO
// ============================================================================

const ModeSelector = ({ onSelectMode }) => {
  const modes = [
    {
      id: 'single',
      title: 'Cálculo Simple',
      description: 'Calcula el costo laboral anual a partir de una planilla mensual',
      icon: Calculator,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      features: ['Desglose por empleado', 'Resumen por área', 'Exportación Excel/PDF']
    },
    {
      id: 'multi',
      title: 'Análisis Predictivo',
      description: 'Analiza tendencias y proyecciones con múltiples períodos',
      icon: TrendingUp,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-600',
      badge: 'ANALYTICS',
      features: ['Rotación de personal', 'Factor Bradford', 'Proyecciones a futuro']
    },
    {
      id: 'precierre',
      title: 'Análisis Precierre',
      description: 'Detecta variaciones y cambios antes del cierre de planilla',
      icon: GitCompare,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-600',
      badge: 'COMPARATIVO',
      features: ['Variaciones salariales', 'Altas y bajas', 'Cambios de cargo/área']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 mb-6 shadow-xl">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
            Calculadora de Costo Laboral
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Sistema integral para el cálculo y análisis de costos laborales según la legislación boliviana
          </p>
        </div>

        {/* Tarjetas de modo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-transparent hover:scale-[1.02] text-left overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${mode.gradient}`} />
              
              {/* Badge */}
              {mode.badge && (
                <span className={`absolute top-4 right-4 px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${mode.gradient} text-white`}>
                  {mode.badge}
                </span>
              )}
              
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                <mode.icon className="w-8 h-8 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-slate-800 mb-2">{mode.title}</h3>
              <p className="text-slate-500 mb-4 text-sm">{mode.description}</p>
              
              {/* Features */}
              <ul className="space-y-2">
                {mode.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className={`w-4 h-4 text-${mode.color}-500`} />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {/* Arrow */}
              <div className={`absolute bottom-6 right-6 w-10 h-10 rounded-full bg-gradient-to-r ${mode.gradient} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-sm text-slate-400 mb-2">
            Calculadora de Costo Laboral v3.0 | Legislación Boliviana
          </p>
          <a
            href="https://www.linkedin.com/in/jelbas/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Award className="w-4 h-4" />
            Diseñado por JELB
          </a>
        </footer>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: INDICADOR DE PASOS
// ============================================================================

const StepIndicator = ({ steps, currentStep, mode }) => {
  const getModeColor = () => {
    switch (mode) {
      case 'multi': return 'purple';
      case 'precierre': return 'amber';
      default: return 'blue';
    }
  };

  const color = getModeColor();
  const colorClasses = {
    blue: { bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-600', border: 'border-purple-600', text: 'text-purple-600' },
    amber: { bg: 'bg-amber-600', border: 'border-amber-600', text: 'text-amber-600' },
  };

  return (
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className={`hidden sm:block w-8 h-0.5 ${isCompleted ? colorClasses[color].bg : 'bg-slate-200'}`} />
            )}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                isCompleted 
                  ? 'bg-emerald-500 text-white' 
                  : isCurrent 
                    ? `${colorClasses[color].bg} text-white shadow-lg`
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`hidden md:inline text-sm font-medium ${
                isCurrent ? colorClasses[color].text : 'text-slate-500'
              }`}>
                {step}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: APP
// ============================================================================

const App = () => {
  // Estados principales
  const [mode, setMode] = useState(null); // 'single', 'multi', 'precierre'
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de datos
  const [fileData, setFileData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [validationResult, setValidationResult] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [savedGroups, setSavedGroups] = useState([]);
  const [provisions, setProvisions] = useState({
    aguinaldo: true,
    segundoAguinaldo: false,
    primaUtilidades: true,
    segundaPrima: false,
    indemnizacion: true,
  });
  const [additionalCosts, setAdditionalCosts] = useState({
    uniforme: { enabled: false, byGroup: false, groups: {}, defaultValue: 0 },
    capacitacion: { enabled: false, byGroup: false, groups: {}, defaultValue: 0 },
  });
  const [results, setResults] = useState(null);

  // Estados para multi-período
  const [multiFilesData, setMultiFilesData] = useState([]);
  const [periodInfo, setPeriodInfo] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [periodsData, setPeriodsData] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  // Estados para ausencias (solo en modo multi)
  const [absenceData, setAbsenceData] = useState(null);
  const [isLoadingAbsence, setIsLoadingAbsence] = useState(false);

  // Estados para precierre
  const [precierreAnalysis, setPrecierreAnalysis] = useState(null);

  // Definir pasos según el modo
  const getSteps = () => {
    switch (mode) {
      case 'multi':
        return ['Cargar', 'Mapear', 'Validar', 'Seleccionar', 'Configurar', 'Ausencias', 'Análisis'];
      case 'precierre':
        return ['Cargar', 'Mapear', 'Validar', 'Precierre'];
      default:
        return ['Cargar', 'Mapear', 'Validar', 'Seleccionar', 'Configurar', 'Resultados'];
    }
  };

  const steps = getSteps();

  // ============================================================================
  // HANDLERS DE ARCHIVOS
  // ============================================================================

  // Handler para carga de archivo único (modo single)
  const handleSingleFileUpload = useCallback(async (file) => {
    setIsLoading(true);
    try {
      const { headers: fileHeaders, data } = file.name.endsWith('.csv')
        ? parseCSV(await file.text())
        : await parseExcel(file);

      setHeaders(fileHeaders);
      setFileData(data);
      
      const detectedMapping = autoDetectColumns(fileHeaders);
      setColumnMapping(detectedMapping);
      
      setCurrentStep(1);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error al procesar el archivo: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler cuando los archivos están listos (modo multi/precierre)
  const handleFilesReady = useCallback((files) => {
    if (files.length < 2) {
      alert('Necesita al menos 2 archivos para continuar');
      return;
    }
    
    // Consolidar headers de todos los archivos
    const consolidatedHeaders = consolidateHeaders(files);
    setHeaders(consolidatedHeaders);
    
    // Detectar mapeo automático
    const detectedMapping = autoDetectColumns(consolidatedHeaders);
    setColumnMapping(detectedMapping);
    
    setCurrentStep(1);
  }, []);

  // Handler para carga de archivo de ausencias
  const handleAbsenceUpload = useCallback(async (file) => {
    setIsLoadingAbsence(true);
    try {
      const data = await parseAbsenceFile(file);
      setAbsenceData(data);
    } catch (error) {
      console.error('Error processing absence file:', error);
      alert('Error al procesar el archivo de ausencias: ' + error.message);
    } finally {
      setIsLoadingAbsence(false);
    }
  }, []);

  // ============================================================================
  // HANDLERS DE NAVEGACIÓN
  // ============================================================================

  const handleNextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  // ============================================================================
  // HANDLERS DE VALIDACIÓN Y CÁLCULO
  // ============================================================================

  const handleValidation = useCallback(() => {
    if (mode === 'single') {
      // Modo single: validar archivo único
      const result = validateData(fileData, columnMapping);
      setValidationResult(result);
      handleNextStep();
    } else {
      // Modo multi/precierre: validar todos los archivos
      let allValid = 0;
      let allInvalid = 0;
      let allTotal = 0;
      const allErrors = [];

      multiFilesData.forEach(file => {
        const result = validateData(file.data, columnMapping);
        allValid += result.valid;
        allInvalid += result.invalid;
        allTotal += result.total;
        allErrors.push(...result.errors.map(e => ({ ...e, file: file.name })));
      });

      setValidationResult({
        valid: allValid,
        invalid: allInvalid,
        total: allTotal,
        errors: allErrors.slice(0, 20),
      });
      handleNextStep();
    }
  }, [mode, fileData, multiFilesData, columnMapping, handleNextStep]);

  const handleCalculate = useCallback(() => {
    if (mode === 'single') {
      // Modo single: calcular una sola planilla
      const indices = selectedEmployees.length > 0 ? selectedEmployees : fileData.map((_, i) => i);
      const selectedData = indices.map(i => fileData[i]);
      
      const calcResults = calculateAll(selectedData, columnMapping, provisions, additionalCosts);
      setResults(calcResults);
      handleNextStep();
    } else if (mode === 'multi') {
      // Modo predictivo: procesar todos los períodos
      const processedPeriods = multiFilesData.map(file => {
        const indices = selectedEmployees.length > 0 
          ? selectedEmployees.filter(i => i < file.data.length)
          : file.data.map((_, i) => i);
        const selectedData = indices.map(i => file.data[i]);
        
        return {
          month: file.month,
          year: file.year,
          results: calculateAll(selectedData, columnMapping, provisions, additionalCosts),
        };
      });

      setPeriodsData(processedPeriods);
      handleNextStep(); // Ir a paso de ausencias
    } else if (mode === 'precierre') {
      // Modo precierre: procesar y analizar
      const processedPeriods = multiFilesData.map(file => {
        const calcResults = calculateAll(file.data, columnMapping, provisions, additionalCosts);
        return {
          month: file.month,
          year: file.year,
          results: calcResults,
        };
      });

      const precierreResult = analyzePrecierre(processedPeriods, columnMapping);
      setPrecierreAnalysis(precierreResult);
      setPeriodsData(processedPeriods);
      handleNextStep();
    }
  }, [mode, fileData, multiFilesData, selectedEmployees, columnMapping, provisions, additionalCosts, handleNextStep]);

  // Handler para proceder al análisis (modo multi)
  const handleProceedToAnalysis = useCallback((withAbsences) => {
    const analysisResult = analyzePeriods(periodsData, withAbsences ? absenceData : null);
    setAnalysis(analysisResult);
    handleNextStep();
  }, [periodsData, absenceData, handleNextStep]);

  // ============================================================================
  // HANDLERS DE EXPORTACIÓN
  // ============================================================================

  const handleExportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    if (mode === 'single' && results) {
      // Exportar resultados simples
      const wsData = results.employees.map(emp => ({
        'Nombre': emp.nombre,
        'Cargo': emp.cargo || '',
        'Área': emp.area || '',
        'Haber Básico': emp.componentes?.haberBasico || 0,
        'Bono Antigüedad': emp.componentes?.bonoAntiguedad || 0,
        'Total Ganado': emp.componentes?.totalGanado || 0,
        'Provisiones': emp.provisiones?.total || 0,
        'Aportes Patronales': emp.aportes?.total || 0,
        'Costo Mensual': emp.costoLaboralMensual,
        'Costo Anual': emp.costoLaboralAnual,
      }));
      
      const ws = XLSX.utils.json_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Costo Laboral');
      
      // Hoja de resumen por área
      const areaData = Object.entries(results.byArea || {}).map(([area, data]) => ({
        'Área': area,
        'Empleados': data.count,
        'Total Ganado': data.totalGanado,
        'Costo Mensual': data.costoMensual,
        'Costo Anual': data.costoAnual,
        '% Participación': data.porcentaje,
      }));
      
      const wsArea = XLSX.utils.json_to_sheet(areaData);
      XLSX.utils.book_append_sheet(wb, wsArea, 'Por Área');
      
    } else if (mode === 'precierre' && precierreAnalysis) {
      // Exportar análisis de precierre
      const { variacionPersonal, altas, bajas, cambiosCargo, cambiosArea } = precierreAnalysis;
      
      // Hoja de variaciones
      const wsVariaciones = XLSX.utils.json_to_sheet(variacionPersonal.map(v => ({
        'Nombre': v.nombre,
        'Cargo': v.cargo,
        'Área': v.area,
        'Total Ganado Inicial': v.valorInicial,
        'Total Ganado Final': v.valorFinal,
        'Variación': v.variacion,
        'Variación %': v.variacionPct,
      })));
      XLSX.utils.book_append_sheet(wb, wsVariaciones, 'Variaciones');
      
      // Hoja de altas
      if (altas?.length > 0) {
        const wsAltas = XLSX.utils.json_to_sheet(altas);
        XLSX.utils.book_append_sheet(wb, wsAltas, 'Altas');
      }
      
      // Hoja de bajas
      if (bajas?.length > 0) {
        const wsBajas = XLSX.utils.json_to_sheet(bajas);
        XLSX.utils.book_append_sheet(wb, wsBajas, 'Bajas');
      }
      
      // Hoja de cambios de cargo
      if (cambiosCargo?.length > 0) {
        const wsCargo = XLSX.utils.json_to_sheet(cambiosCargo);
        XLSX.utils.book_append_sheet(wb, wsCargo, 'Cambios Cargo');
      }
      
      // Hoja de cambios de área
      if (cambiosArea?.length > 0) {
        const wsAreaCambios = XLSX.utils.json_to_sheet(cambiosArea);
        XLSX.utils.book_append_sheet(wb, wsAreaCambios, 'Cambios Área');
      }
    }

    const filename = mode === 'precierre' 
      ? 'analisis_precierre.xlsx'
      : mode === 'multi'
        ? 'analisis_predictivo.xlsx'
        : 'costo_laboral.xlsx';
        
    XLSX.writeFile(wb, filename);
  }, [mode, results, precierreAnalysis]);

  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255);
    doc.setFontSize(16);
    
    const title = mode === 'precierre' 
      ? 'Análisis de Precierre'
      : mode === 'multi'
        ? 'Análisis Predictivo'
        : 'Costo Laboral Anual';
    doc.text(title, 14, 20);
    
    doc.setTextColor(0);
    doc.setFontSize(10);
    
    if (mode === 'single' && results) {
      // Resumen ejecutivo
      doc.autoTable({
        startY: 40,
        head: [['Concepto', 'Valor']],
        body: [
          ['Total Empleados', results.employeeCount],
          ['Total Ganado Mensual', formatCurrency(results.totals.totalGanado)],
          ['Costo Laboral Mensual', formatCurrency(results.totals.costoLaboralMensual)],
          ['Costo Laboral Anual', formatCurrency(results.totals.costoLaboralAnual)],
        ],
      });
    } else if (mode === 'precierre' && precierreAnalysis) {
      const { resumen, periods } = precierreAnalysis;
      
      doc.text(`Períodos comparados: ${periods.map(p => p.label).join(' → ')}`, 14, 40);
      
      doc.autoTable({
        startY: 50,
        head: [['Concepto', 'Valor']],
        body: [
          ['Empleados Analizados', resumen.totalEmpleadosAnalizados],
          ['Altas (Ingresos)', resumen.altas],
          ['Bajas (Salidas)', resumen.bajas],
          ['Cambios de Cargo', resumen.cambiosCargo],
          ['Cambios de Área', resumen.cambiosArea],
          ['Variación Headcount', resumen.variacionHeadcount],
          ['Variación Total Ganado', formatCurrency(resumen.variacionTotalGanado)],
        ],
      });
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text('Diseñado por JELB - linkedin.com/in/jelbas/', 14, 287);
      doc.text(`Página ${i} de ${pageCount}`, 180, 287);
    }

    const filename = mode === 'precierre' 
      ? 'analisis_precierre.pdf'
      : mode === 'multi'
        ? 'analisis_predictivo.pdf'
        : 'costo_laboral.pdf';
        
    doc.save(filename);
  }, [mode, results, precierreAnalysis]);

  // ============================================================================
  // HANDLER DE REINICIO
  // ============================================================================

  const handleNewCalculation = useCallback(() => {
    setMode(null);
    setCurrentStep(0);
    setFileData(null);
    setHeaders([]);
    setColumnMapping({});
    setValidationResult(null);
    setSelectedEmployees([]);
    setResults(null);
    setMultiFilesData([]);
    setPeriodsData([]);
    setAnalysis(null);
    setAbsenceData(null);
    setPrecierreAnalysis(null);
  }, []);

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  // Si no hay modo seleccionado, mostrar selector

  // Obtener listas únicas para filtros
  const uniqueCargos = useMemo(() => {
    const data = mode === 'single' ? fileData : multiFilesData[0]?.data;
    if (!data || !columnMapping.cargo) return [];
    return [...new Set(data.map(row => row[columnMapping.cargo]).filter(Boolean))].sort();
  }, [mode, fileData, multiFilesData, columnMapping]);

  const uniqueAreas = useMemo(() => {
    const data = mode === 'single' ? fileData : multiFilesData[0]?.data;
    if (!data || !columnMapping.area) return [];
    return [...new Set(data.map(row => row[columnMapping.area]).filter(Boolean))].sort();
  }, [mode, fileData, multiFilesData, columnMapping]);

  // Vista previa: 5 filas aleatorias del dataset (para revisar mapeo antes de validar)
  const sampleRows = useMemo(() => {
    const data = mode === 'single' ? fileData : multiFilesData[0]?.data;
    if (!Array.isArray(data) || data.length === 0) return [];

    const n = Math.min(5, data.length);
    const indices = new Set();
    while (indices.size < n) {
      indices.add(Math.floor(Math.random() * data.length));
    }
    return Array.from(indices).map(i => data[i]);
  }, [mode, fileData, multiFilesData]);

  if (!mode) {
    return <ModeSelector onSelectMode={setMode} />;
  }


  // Obtener color del modo
  const getModeColor = () => {
    switch (mode) {
      case 'multi': return 'purple';
      case 'precierre': return 'amber';
      default: return 'blue';
    }
  };

  const modeColor = getModeColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header del modo */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleNewCalculation}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Cambiar modo
          </button>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            modeColor === 'blue' ? 'bg-blue-100 text-blue-700' :
            modeColor === 'purple' ? 'bg-purple-100 text-purple-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {mode === 'single' ? 'Cálculo Simple' : mode === 'multi' ? 'Análisis Predictivo' : 'Análisis Precierre'}
          </div>
        </div>

        {/* Indicador de pasos */}
        <StepIndicator steps={steps} currentStep={currentStep} mode={mode} />

        {/* Contenido del paso actual */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
          
          {/* PASO 0: Cargar archivos */}
          {currentStep === 0 && (
            <FileUpload
              onFileUpload={mode === 'single' ? handleSingleFileUpload : null}
              onFilesReady={mode !== 'single' ? handleFilesReady : null}
              isLoading={isLoading}
              mode={mode}
              periodInfo={periodInfo}
              onPeriodChange={setPeriodInfo}
              multiFilesData={multiFilesData}
              onMultiFilesChange={setMultiFilesData}
            />
          )}

          {/* PASO 1: Mapear columnas */}
          {currentStep === 1 && (
            <ColumnMapping
              headers={headers}
              columnMapping={columnMapping}
              setColumnMapping={setColumnMapping}
              sampleRows={sampleRows}
              onBack={handlePrevStep}
              onNext={handleValidation}
            />
          )}

          {/* PASO 2: Validación */}
          {currentStep === 2 && (
            <DataValidation
              validationResult={validationResult}
              onBack={handlePrevStep}
              onNext={mode === 'precierre' ? handleCalculate : handleNextStep}
            />
          )}

          {/* MODO SINGLE: Pasos 3, 4, 5 */}
          {mode === 'single' && (
            <>
              {currentStep === 3 && (
                <EmployeeSelection
                  fileData={fileData}
                  columnMapping={columnMapping}
                  selectedEmployees={selectedEmployees}
                  setSelectedEmployees={setSelectedEmployees}
                  savedGroups={savedGroups}
                  setSavedGroups={setSavedGroups}
                  onBack={handlePrevStep}
                  onNext={handleNextStep}
                />
              )}

              {currentStep === 4 && (
                <CalculationConfig
                  provisions={provisions}
                  setProvisions={setProvisions}
                  additionalCosts={additionalCosts}
                  setAdditionalCosts={setAdditionalCosts}
                  uniqueCargos={uniqueCargos}
                  uniqueAreas={uniqueAreas}
                  onBack={handlePrevStep}
                  onNext={handleCalculate}
                />
              )}

              {currentStep === 5 && results && (
                <Results
                  results={results}
                  columnMapping={columnMapping}
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                  onNewCalculation={handleNewCalculation}
                  onModifyConfig={() => setCurrentStep(3)}
                />
              )}
            </>
          )}

          {/* MODO MULTI: Pasos 3, 4, 5, 6 */}
          {mode === 'multi' && (
            <>
              {currentStep === 3 && (
                <EmployeeSelection
                  fileData={multiFilesData[0]?.data || []}
                  columnMapping={columnMapping}
                  selectedEmployees={selectedEmployees}
                  setSelectedEmployees={setSelectedEmployees}
                  savedGroups={savedGroups}
                  setSavedGroups={setSavedGroups}
                  onBack={handlePrevStep}
                  onNext={handleNextStep}
                />
              )}

              {currentStep === 4 && (
                <CalculationConfig
                  provisions={provisions}
                  setProvisions={setProvisions}
                  additionalCosts={additionalCosts}
                  setAdditionalCosts={setAdditionalCosts}
                  uniqueCargos={uniqueCargos}
                  uniqueAreas={uniqueAreas}
                  onBack={handlePrevStep}
                  onNext={handleCalculate}
                />
              )}

              {currentStep === 5 && (
                <AbsenceUpload
                  onAbsenceUpload={handleAbsenceUpload}
                  absenceData={absenceData}
                  isLoading={isLoadingAbsence}
                  onBack={handlePrevStep}
                  onNext={() => handleProceedToAnalysis(true)}
                  onSkip={() => handleProceedToAnalysis(false)}
                />
              )}

              {currentStep === 6 && analysis && (
                <PredictiveAnalysis
                  analysis={analysis}
                  periodsData={periodsData}
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                  onNewAnalysis={handleNewCalculation}
                />
              )}
            </>
          )}

          {/* MODO PRECIERRE: Paso 3 */}
          {mode === 'precierre' && currentStep === 3 && precierreAnalysis && (
            <PrecierreAnalysis
              analysis={precierreAnalysis}
              periodsData={periodsData}
              columnMapping={columnMapping}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onNewAnalysis={handleNewCalculation}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;