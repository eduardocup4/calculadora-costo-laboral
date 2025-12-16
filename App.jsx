import React, { useState, useCallback, useMemo } from 'react';
import {
  Calculator, TrendingUp, GitCompare, Check,
  FileSpreadsheet, FileText, BarChart3, Users, Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import {
  MONTHS,
  parseExcel, parseAbsenceFile, autoDetectColumns,
  validateData, calculateAll, analyzePeriods, analyzePrecierre
} from './utils.js';

// Eliminamos EmployeeSelection de aquí para evitar el error
import {
  FileUpload, ColumnMapping, 
  CalculationConfig, AbsenceUpload
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
      id: 'predictive',
      title: 'Análisis Predictivo',
      description: 'Proyecta costos y tendencias cargando múltiples planillas históricas',
      icon: TrendingUp,
      color: 'purple',
      gradient: 'from-purple-500 to-fuchsia-600',
      features: ['Proyección a 12 meses', 'Análisis de ausentismo (Bradford)', 'Tendencias de Headcount']
    },
    {
      id: 'precierre',
      title: 'Análisis Precierre',
      description: 'Compara el mes actual vs. anterior para detectar anomalías antes de pagar',
      icon: GitCompare,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      features: ['Detección de Altas/Bajas', 'Variaciones salariales', 'Cambios de cargo/área']
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-8 px-4">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelectMode(mode.id)}
          className="relative group overflow-hidden bg-white p-8 rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300 text-left hover:-translate-y-1"
        >
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mode.gradient} opacity-5 rounded-bl-full transition-transform group-hover:scale-110`} />
          
          <div className={`w-14 h-14 rounded-2xl bg-${mode.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
            <mode.icon className={`w-7 h-7 text-${mode.color}-600`} />
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-3">{mode.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">{mode.description}</p>
          
          <ul className="space-y-2">
            {mode.features.map((feat, i) => (
              <li key={i} className="flex items-center text-xs text-slate-400">
                <Check className={`w-3 h-3 mr-2 text-${mode.color}-500`} />
                {feat}
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const App = () => {
  const [mode, setMode] = useState(null); // 'single', 'predictive', 'precierre'
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados de Datos
  const [fileData, setFileData] = useState(null); // { headers, data }
  const [multiFilesData, setMultiFilesData] = useState([]); // Array de planillas para predictivo
  const [columnMapping, setColumnMapping] = useState({});
  
  // Configuración de Cálculo
  const [config, setConfig] = useState({
    aguinaldo: true,
    primaUtilidades: true,
    indemnizacion: true,
    segundoAguinaldo: false
  });

  // Resultados
  const [results, setResults] = useState(null);
  const [analysis, setAnalysis] = useState(null); // Resultado Predictivo
  const [precierreAnalysis, setPrecierreAnalysis] = useState(null); // Resultado Precierre
  const [absenceData, setAbsenceData] = useState(null);
  const [isLoadingAbsence, setIsLoadingAbsence] = useState(false);

  // --- MANEJADORES DE NAVEGACIÓN ---

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setCurrentStep(1);
    // Reset states
    setFileData(null);
    setMultiFilesData([]);
    setResults(null);
    setAnalysis(null);
    setPrecierreAnalysis(null);
  };

  const handleBackToModes = () => {
    setMode(null);
    setCurrentStep(1);
  };

  const handleNextStep = () => setCurrentStep(prev => prev + 1);
  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  // --- MANEJADORES DE ARCHIVOS ---

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    try {
      const { headers, data } = await parseExcel(file);
      setFileData({ headers, data, fileName: file.name });
      
      // Auto-detectar columnas
      const detected = autoDetectColumns(headers);
      setColumnMapping(detected);
      
      handleNextStep();
    } catch (err) {
      setError('Error al leer el archivo. Asegúrese de que sea un Excel válido.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiFileUpload = async (files) => {
    setIsLoading(true);
    setError(null);
    try {
      const promises = Array.from(files).map(async (file) => {
        const { headers, data } = await parseExcel(file);
        // Intentar extraer fecha del nombre (ej: "Planilla Enero 2025.xlsx")
        const nameLower = file.name.toLowerCase();
        let month = 1;
        let year = 2025;
        
        MONTHS.forEach((m, i) => {
          if (nameLower.includes(m.toLowerCase())) month = i + 1;
        });
        const yearMatch = nameLower.match(/20\d{2}/);
        if (yearMatch) year = parseInt(yearMatch[0]);

        return { 
          id: Math.random().toString(36).substr(2, 9),
          file, 
          headers, 
          data, 
          month, 
          year, 
          name: file.name 
        };
      });

      const processedFiles = await Promise.all(promises);
      // Ordenar por fecha
      processedFiles.sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
      
      setMultiFilesData(processedFiles);
      
      // Usar headers del archivo más reciente para el mapping
      if (processedFiles.length > 0) {
        const latest = processedFiles[processedFiles.length - 1];
        setColumnMapping(autoDetectColumns(latest.headers));
      }

      handleNextStep();
    } catch (err) {
      setError('Error al procesar archivos múltiples.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- CÁLCULOS Y ANÁLISIS ---

  const handleValidate = () => {
    // Validar datos actuales (Single o el último de Multi)
    const dataToValidate = mode === 'single' ? fileData.data : multiFilesData[multiFilesData.length - 1].data;
    const validation = validateData(dataToValidate, columnMapping);
    
    // Si hay errores críticos podríamos detener, pero permitimos continuar con advertencia
    handleNextStep();
  };

  const handleCalculate = () => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        if (mode === 'single') {
          const res = calculateAll(fileData.data, columnMapping, config);
          setResults(res);
          handleNextStep(); // Ir a resultados
        } else if (mode === 'predictive' || mode === 'precierre') {
          // Calcular individualmente para cada periodo
          const periodsResults = multiFilesData.map(file => ({
            ...file,
            results: calculateAll(file.data, columnMapping, config)
          }));
          
          if (mode === 'predictive') {
             // Pasamos al paso de carga de ausencias
             // Guardamos resultados intermedios en el mismo estado para usarlos luego
             setMultiFilesData(periodsResults); 
             handleNextStep();
          } else {
             // Precierre: Ejecutar análisis comparativo
             const analysisRes = analyzePrecierre(periodsResults);
             setPrecierreAnalysis(analysisRes);
             handleNextStep();
          }
        }
      } catch (err) {
        console.error(err);
        setError('Error durante el cálculo: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleAbsenceUpload = async (file) => {
    setIsLoadingAbsence(true);
    try {
      const absences = await parseAbsenceFile(file);
      setAbsenceData(absences);
    } catch (err) {
      console.error(err);
      alert('Error al leer archivo de ausencias');
    } finally {
      setIsLoadingAbsence(false);
    }
  };

  const handleRunPredictiveAnalysis = () => {
    // Ejecutar análisis final con datos de planillas + ausencias
    const analysisRes = analyzePeriods(multiFilesData, absenceData);
    setAnalysis(analysisRes);
    handleNextStep();
  };

  // Exportaciones Dummy (Conectar con librería real si se desea)
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(results?.employees || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "Costo_Laboral.xlsx");
  };

  const handleExportPDF = () => {
    alert("Generando PDF...");
  };

  // --- RENDERIZADO ---

  return (
    <div className="min-h-screen pb-12 animate-fade-in">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToModes}>
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
              CL
            </div>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight">
              Costo Laboral <span className="text-slate-400 font-normal">| Bolivia 2025</span>
            </h1>
          </div>
          {mode && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
                <span className={`w-2 h-2 rounded-full bg-${mode === 'single' ? 'blue' : mode === 'predictive' ? 'purple' : 'emerald'}-500 animate-pulse`}/>
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                  {mode === 'single' ? 'Cálculo Simple' : mode === 'predictive' ? 'Predictivo' : 'Precierre'}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {!mode ? (
          <ModeSelector onSelectMode={handleModeSelect} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 mt-8">
            {/* Steps Rendering Logic */}
            
            {/* PASO 1: SUBIDA DE ARCHIVOS */}
            {currentStep === 1 && (
              <FileUpload 
                mode={mode} 
                onFileUpload={handleFileUpload} 
                onMultiUpload={handleMultiFileUpload}
                isLoading={isLoading}
              />
            )}

            {/* PASO 2: MAPEO DE COLUMNAS */}
            {currentStep === 2 && (
              <ColumnMapping 
                headers={mode === 'single' ? fileData?.headers : multiFilesData[0]?.headers}
                mapping={columnMapping}
                onChange={setColumnMapping}
                onConfirm={handleValidate}
                onBack={handlePrevStep}
              />
            )}

            {/* PASO 3: CONFIGURACIÓN (Solo Single) o PROCESO (Multi) */}
            {currentStep === 3 && (
               mode === 'single' ? (
                 <CalculationConfig 
                   config={config} 
                   setConfig={setConfig} 
                   onCalculate={handleCalculate}
                   onBack={handlePrevStep}
                 />
               ) : (
                 // Para Multi, saltamos directo a calcular
                 <div className="text-center py-20 animate-fade-in">
                   <h3 className="text-2xl font-bold text-slate-700 mb-4">Procesando Periodos...</h3>
                   <p className="text-slate-500 mb-8">Estamos analizando la información histórica.</p>
                   <button onClick={handleCalculate} className="btn-primary mx-auto">
                     Continuar al Análisis
                   </button>
                 </div>
               )
            )}

            {/* RESULTADOS SINGLE */}
            {mode === 'single' && currentStep === 4 && results && (
              <Results 
                results={results} 
                onBack={handlePrevStep}
                onNewCalculation={handleBackToModes}
              />
            )}

            {/* FLUJO PREDICTIVO: AUSENCIAS (Paso 4 real tras cálculo interno) */}
            {mode === 'predictive' && currentStep === 4 && (
              <AbsenceUpload 
                 onAbsenceUpload={handleAbsenceUpload}
                 absenceData={absenceData}
                 onNext={handleRunPredictiveAnalysis}
                 onSkip={handleRunPredictiveAnalysis}
                 isLoading={isLoadingAbsence}
              />
            )}

            {/* RESULTADOS PREDICTIVO */}
            {mode === 'predictive' && currentStep === 5 && analysis && (
              <PredictiveAnalysis 
                analysis={analysis} 
                onNewAnalysis={handleBackToModes}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
              />
            )}

            {/* RESULTADOS PRECIERRE */}
            {mode === 'precierre' && currentStep === 4 && precierreAnalysis && (
              <PrecierreAnalysis 
                analysis={precierreAnalysis}
                periodsData={multiFilesData}
                onNewAnalysis={handleBackToModes}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;