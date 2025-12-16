import React, { useState } from 'react';
import {
  Calculator, TrendingUp, GitCompare, Check,
  ChevronLeft, Award
} from 'lucide-react';
import {
  parseExcel, autoDetectColumns, validateData, 
  calculateAll, analyzePeriods, analyzePrecierre,
  parseAbsenceFile, MONTHS
} from './utils.js';

import {
  FileUpload, ColumnMapping, 
  CalculationConfig, AbsenceUpload
} from './Steps.jsx';

import Results from './Results.jsx';
import PredictiveAnalysis from './PredictiveAnalysis.jsx';
import PrecierreAnalysis from './PrecierreAnalysis.jsx';

// ============================================================================
// COMPONENTE: SELECTOR DE MODO (MEJORADO VISUALMENTE)
// ============================================================================

const ModeSelector = ({ onSelectMode }) => {
  const modes = [
    {
      id: 'single',
      title: 'Cálculo Mensual',
      description: 'Genera reportes de costo laboral exactos para un mes específico.',
      icon: Calculator,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      features: ['Desglose Individual', 'Reporte por Áreas', 'Exportación PDF/Excel']
    },
    {
      id: 'predictive',
      title: 'People Analytics',
      description: 'Proyecta costos futuros y analiza tendencias de ausentismo.',
      icon: TrendingUp,
      color: 'purple',
      gradient: 'from-violet-500 to-fuchsia-600',
      shadow: 'shadow-purple-500/20',
      features: ['Proyección a 12 meses', 'Factor Bradford', 'Headcount Trend']
    },
    {
      id: 'precierre',
      title: 'Auditoría Precierre',
      description: 'Detecta anomalías comparando el mes actual contra el anterior.',
      icon: GitCompare,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      features: ['Variaciones Salariales', 'Detección Altas/Bajas', 'Alertas de Desvíos']
    }
  ];

  return (
    <div className="max-w-6xl mx-auto mt-12 px-4 animate-enter">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Costo Laboral</span>
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Plataforma avanzada para el cálculo, proyección y auditoría de nóminas bajo normativa boliviana 2025.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className="group relative bg-white rounded-[2rem] p-8 text-left border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${mode.gradient} opacity-[0.03] rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-[0.08] transition-opacity duration-500`} />
            
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-8 shadow-lg ${mode.shadow} group-hover:scale-110 transition-transform duration-300`}>
              <mode.icon className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors">
              {mode.title}
            </h3>
            <p className="text-slate-500 leading-relaxed mb-8">
              {mode.description}
            </p>
            
            <div className="space-y-3 border-t border-slate-100 pt-6">
              {mode.features.map((feat, i) => (
                <div key={i} className="flex items-center text-sm text-slate-600 font-medium">
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${mode.gradient} mr-3`} />
                  {feat}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL (ORQUESTADOR)
// ============================================================================

const App = () => {
  const [mode, setMode] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados de Datos
  const [fileData, setFileData] = useState(null);
  const [multiFilesData, setMultiFilesData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [config, setConfig] = useState({
    aguinaldo: true,
    primaUtilidades: true,
    indemnizacion: true,
    segundoAguinaldo: false
  });

  // Resultados
  const [results, setResults] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [precierreAnalysis, setPrecierreAnalysis] = useState(null);
  const [absenceData, setAbsenceData] = useState(null);
  const [isLoadingAbsence, setIsLoadingAbsence] = useState(false);

  // --- HANDLERS ---

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setCurrentStep(1);
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

  // --- LOGICA DE ARCHIVOS ---

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    try {
      const { headers, data } = await parseExcel(file);
      setFileData({ headers, data, fileName: file.name });
      setColumnMapping(autoDetectColumns(headers));
      handleNextStep();
    } catch (err) {
      setError('Error al leer el archivo. Verifica el formato.');
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
        const nameLower = file.name.toLowerCase();
        let month = 1;
        let year = 2025;
        MONTHS.forEach((m, i) => { if (nameLower.includes(m.toLowerCase())) month = i + 1; });
        const yearMatch = nameLower.match(/20\d{2}/);
        if (yearMatch) year = parseInt(yearMatch[0]);

        return { id: Math.random().toString(36).substr(2, 9), file, headers, data, month, year, name: file.name };
      });

      const processedFiles = await Promise.all(promises);
      processedFiles.sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
      setMultiFilesData(processedFiles);
      if (processedFiles.length > 0) setColumnMapping(autoDetectColumns(processedFiles[processedFiles.length - 1].headers));
      
      handleNextStep();
    } catch (err) {
      setError('Error al procesar múltiples archivos.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- CALCULO ---

  const handleValidate = () => handleNextStep(); // Simplificado para demo visual

  const handleCalculate = () => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        if (mode === 'single') {
          const res = calculateAll(fileData.data, columnMapping, config);
          setResults(res);
          handleNextStep();
        } else if (mode === 'predictive' || mode === 'precierre') {
          const periodsResults = multiFilesData.map(file => ({
            ...file,
            results: calculateAll(file.data, columnMapping, config)
          }));
          
          if (mode === 'predictive') {
             setMultiFilesData(periodsResults); 
             handleNextStep();
          } else {
             const analysisRes = analyzePrecierre(periodsResults);
             setPrecierreAnalysis(analysisRes);
             handleNextStep();
          }
        }
      } catch (err) {
        setError('Error: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  const handleAbsenceUpload = async (file) => {
    setIsLoadingAbsence(true);
    try {
      const absences = await parseAbsenceFile(file);
      setAbsenceData(absences);
    } catch (err) {
      alert('Error en archivo de ausencias');
    } finally {
      setIsLoadingAbsence(false);
    }
  };

  const handleRunPredictiveAnalysis = () => {
    const analysisRes = analyzePeriods(multiFilesData, absenceData);
    setAnalysis(analysisRes);
    handleNextStep();
  };

  // --- RENDERIZADO ---

  return (
    <div className="min-h-screen pb-20">
      {/* HEADER GLASSMORPHISM */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleBackToModes}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg tracking-tight leading-tight">
                Costo Laboral
              </h1>
              <p className="text-xs text-slate-500 font-medium">Bolivia 2025</p>
            </div>
          </div>
          
          {mode && (
            <div className="flex items-center gap-4 animate-enter">
              <button 
                onClick={handleBackToModes}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Cambiar Modo
              </button>
              <div className="px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  mode === 'single' ? 'bg-blue-500' : mode === 'predictive' ? 'bg-purple-500' : 'bg-emerald-500'
                }`}/>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {mode === 'single' ? 'Simple' : mode === 'predictive' ? 'Predictivo' : 'Precierre'}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main>
        {!mode ? (
          <ModeSelector onSelectMode={handleModeSelect} />
        ) : (
          <div className="max-w-7xl mx-auto px-6 mt-10 animate-enter">
            
            {/* WRAPPER BLANCO ELEGANTE PARA STEPS */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 p-8 md:p-12 min-h-[600px]">
              
              {currentStep === 1 && (
                <FileUpload 
                  mode={mode} 
                  onFileUpload={handleFileUpload} 
                  onMultiUpload={handleMultiFileUpload}
                  isLoading={isLoading}
                />
              )}

              {currentStep === 2 && (
                <ColumnMapping 
                  headers={mode === 'single' ? fileData?.headers : multiFilesData[0]?.headers}
                  mapping={columnMapping}
                  onChange={setColumnMapping}
                  onConfirm={handleValidate}
                  onBack={handlePrevStep}
                />
              )}

              {currentStep === 3 && (
                 mode === 'single' ? (
                   <CalculationConfig 
                     config={config} 
                     setConfig={setConfig} 
                     onCalculate={handleCalculate}
                     onBack={handlePrevStep}
                   />
                 ) : (
                   <div className="flex flex-col items-center justify-center h-96 text-center">
                     <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <TrendingUp className="w-10 h-10 text-blue-600 animate-pulse" />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-800 mb-2">Procesando Información Histórica</h3>
                     <p className="text-slate-500 mb-8 max-w-md">
                       Estamos normalizando los datos de {multiFilesData.length} períodos para generar el análisis.
                     </p>
                     <button onClick={handleCalculate} className="btn-primary">
                       Generar Análisis
                     </button>
                   </div>
                 )
              )}

              {/* RESULTADOS OCUPAN TODO EL ANCHO (Fuera del wrapper si se desea, pero aquí dentro se ve limpio) */}
              {mode === 'single' && currentStep === 4 && results && (
                <Results 
                  results={results} 
                  onBack={handlePrevStep}
                  onNewCalculation={handleBackToModes}
                />
              )}

              {mode === 'predictive' && currentStep === 4 && (
                <AbsenceUpload 
                   onAbsenceUpload={handleAbsenceUpload}
                   absenceData={absenceData}
                   onNext={handleRunPredictiveAnalysis}
                   onSkip={handleRunPredictiveAnalysis}
                   isLoading={isLoadingAbsence}
                />
              )}

              {mode === 'predictive' && currentStep === 5 && analysis && (
                <PredictiveAnalysis 
                  analysis={analysis} 
                  onNewAnalysis={handleBackToModes}
                />
              )}

              {mode === 'precierre' && currentStep === 4 && precierreAnalysis && (
                <PrecierreAnalysis 
                  analysis={precierreAnalysis}
                  periodsData={multiFilesData}
                  onNewAnalysis={handleBackToModes}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;