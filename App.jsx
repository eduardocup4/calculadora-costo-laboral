import React, { useState } from 'react';
import { Calculator, TrendingUp, GitCompare, Scale } from 'lucide-react';
import { parseExcel, parseAbsenceFile, autoDetectColumns, calculateAll, analyzePrecierre, analyzeEquity, analyzePredictive, calculateIncrementSimulation, mapearNiveles, getNivelesUnicos, MONTHS } from './utils.js';
import { FileUpload, ColumnMapping, VariableDictionary, PreCalcFilters, CalculationConfig, NivelesUpload, ConfiguracionIncremento } from './Steps.jsx';
import Results from './Results.jsx';
import PrecierreAnalysis from './PrecierreAnalysis.jsx';
import EquityAnalysis from './EquityAnalysis.jsx';
import PredictiveAnalysis from './PredictiveAnalysis.jsx';
import IncrementoAnalysis from './IncrementoAnalysis.jsx';

const ModeSelector = ({ onSelectMode }) => {
  const modes = [
    { 
      id: 'single', 
      title: 'Costo Mensual', 
      desc: 'Reporte detallado con filtros y exportación PDF/Excel.', 
      icon: Calculator, 
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    { 
      id: 'incremento', 
      title: 'Comparativo Incremento', 
      desc: 'Simula aumentos 2026 con análisis Before/After y reglas de cascada.', 
      icon: TrendingUp, 
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    { 
      id: 'precierre', 
      title: 'Auditoría Precierre', 
      desc: 'Detecta Altas, Bajas y Variaciones vs Mes Anterior.', 
      icon: GitCompare, 
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    { 
      id: 'predictive', 
      title: 'Análisis Predictivo', 
      desc: 'Proyecciones de costo y Factor Bradford de ausentismo.', 
      icon: TrendingUp, 
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200'
    },
    { 
      id: 'equidad', 
      title: 'Equidad Salarial', 
      desc: 'Análisis de brecha de género y competitividad interna.', 
      icon: Scale, 
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto mt-16 px-4 animate-enter">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-3">
          Sistema de Análisis de Costo Laboral
        </h1>
        <p className="text-lg text-slate-500">Selecciona el tipo de análisis que deseas realizar</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modes.map(m => (
          <button 
            key={m.id} 
            onClick={() => onSelectMode(m.id)} 
            className={`text-left p-8 rounded-3xl bg-white border ${m.border} shadow-lg hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group`}
          >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <m.icon className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">{m.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{m.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data
  const [fileData, setFileData] = useState(null);
  const [absenceData, setAbsenceData] = useState(null);
  const [multiFiles, setMultiFiles] = useState([]);
  const [allHeaders, setAllHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [extraVars, setExtraVars] = useState([]);
  const [filters, setFilters] = useState({});
  const [config, setConfig] = useState({ 
    aguinaldo: true, 
    indemnizacion: true, 
    primaUtilidades: true, 
    segundoAguinaldo: false 
  });
  
  // Outputs
  const [results, setResults] = useState(null);
  const [precierreRes, setPrecierreRes] = useState(null);
  const [equityRes, setEquityRes] = useState(null);
  const [predictiveRes, setPredictiveRes] = useState(null);
  const [incrementoRes, setIncrementoRes] = useState(null);
  
  // Modo Incremento
  const [nivelMapping, setNivelMapping] = useState(null);

  const reset = () => { 
    setMode(null); 
    setStep(1); 
    setFileData(null); 
    setAbsenceData(null);
    setMultiFiles([]);
    setAllHeaders([]);
    setMapping({});
    setExtraVars([]);
    setFilters({});
    setResults(null); 
    setPrecierreRes(null); 
    setEquityRes(null);
    setPredictiveRes(null);
    setIncrementoRes(null);
    setNivelMapping(null);
  };
  
  const next = () => setStep(p => p + 1);
  const prev = () => setStep(p => p - 1);

  const handleFileUpload = async (file) => {
      setLoading(true);
      try {
        const { headers, data } = await parseExcel(file);
        setFileData({ headers, data, fileName: file.name, mapping: autoDetectColumns(headers) });
        setAllHeaders(headers);
        setMapping(autoDetectColumns(headers));
        next();
      } catch(e) {
        alert('Error al cargar archivo: ' + e.message);
        console.error(e);
      }
      setLoading(false);
  };

  const handleAbsenceUpload = async (file) => {
      setLoading(true);
      try {
        const absences = await parseAbsenceFile(file);
        setAbsenceData(absences);
      } catch(e) {
        alert('Error al cargar archivo de ausentismo: ' + e.message);
        console.error(e);
      }
      setLoading(false);
  };

  const handleMultiUpload = async (files) => {
      setLoading(true);
      try {
        const promises = Array.from(files).map(async (f) => {
            const res = await parseExcel(f);
            let month = 1, year = 2025;
            MONTHS.forEach((m,i) => { 
              if(f.name.toLowerCase().includes(m.toLowerCase())) month = i+1; 
            });
            const y = f.name.match(/20\d{2}/); 
            if(y) year = parseInt(y[0]);
            return { ...res, file: f, month, year, name: f.name };
        });
        const processed = (await Promise.all(promises)).sort((a,b) => (a.year*100+a.month)-(b.year*100+b.month));
        setMultiFiles(processed);
        
        const consolidatedHeaders = new Set();
        processed.forEach(p => p.headers.forEach(h => consolidatedHeaders.add(h)));
        const uniqueHeaders = Array.from(consolidatedHeaders);
        
        setAllHeaders(uniqueHeaders);
        setMapping(autoDetectColumns(uniqueHeaders));
        next();
      } catch(e) {
        alert('Error al cargar archivos: ' + e.message);
        console.error(e);
      }
      setLoading(false);
  };

  const handleNivelesUpload = (niveles) => {
    setNivelMapping(niveles);
  };

  const calculateIncremento = (simulationParams) => {
      setLoading(true);
      setTimeout(() => {
          try {
              console.log('Calculando incremento con:', { simulationParams, mapping, extraVars, filters, config });
              
              // Primero calcular la línea base (foto actual)
              const baseline = calculateAll(fileData.data, mapping, config, filters, extraVars);
              console.log('Baseline calculada:', baseline);
              
              // Luego ejecutar la simulación
              const simulation = calculateIncrementSimulation(
                baseline.details,
                simulationParams,
                nivelMapping.mapping,
                config
              );
              console.log('Simulación completada:', simulation);
              
              setIncrementoRes(simulation);
              next();
          } catch(e) { 
            alert('Error en simulación: ' + e.message); 
            console.error('Error detallado:', e);
          }
          setLoading(false);
      }, 500);
  };

  const calculate = () => {
      setLoading(true);
      setTimeout(() => {
          try {
              console.log('Calculando con:', { mode, mapping, extraVars, filters, config });
              
              if(mode === 'single') {
                  const res = calculateAll(fileData.data, mapping, config, filters, extraVars);
                  console.log('Resultado single:', res);
                  setResults(res);
              } else if(mode === 'precierre') {
                  const periods = multiFiles.map(p => ({ 
                    ...p, 
                    results: calculateAll(p.data, mapping, config, filters, extraVars) 
                  }));
                  const analysis = analyzePrecierre(periods);
                  console.log('Resultado precierre:', analysis);
                  setPrecierreRes(analysis);
                  setMultiFiles(periods);
              } else if(mode === 'equidad') {
                  const res = calculateAll(fileData.data, mapping, config, filters, extraVars);
                  const equity = analyzeEquity(res.details);
                  console.log('Resultado equidad:', equity);
                  setEquityRes(equity);
                  setResults(res);
              } else if(mode === 'predictive') {
                  const periods = multiFiles.map(p => ({ 
                    ...p, 
                    results: calculateAll(p.data, mapping, config, filters, extraVars) 
                  }));
                  const predictive = analyzePredictive(periods, absenceData);
                  console.log('Resultado predictivo:', predictive);
                  setPredictiveRes(predictive);
                  setMultiFiles(periods);
              }
              next();
          } catch(e) { 
            alert('Error en cálculo: ' + e.message); 
            console.error('Error detallado:', e);
          }
          setLoading(false);
      }, 500);
  };

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-900">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
                <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-slate-800">Costo Laboral Bolivia</h1>
                  <p className="text-xs text-slate-500">Versión 5.0 Pro</p>
                </div>
            </div>
            {mode && (
              <button 
                onClick={reset} 
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                ← Cambiar Modo
              </button>
            )}
        </div>
      </header>

      <main className="pt-10">
        {!mode ? (
          <ModeSelector onSelectMode={setMode} />
        ) : (
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-8 md:p-12 min-h-[600px]">
              
              {/* MODO INCREMENTO - Flujo de 7 pasos */}
              {mode === 'incremento' && (
                <>
                  {step === 1 && (
                    <FileUpload 
                      mode={mode} 
                      onFileUpload={handleFileUpload} 
                      isLoading={loading} 
                    />
                  )}
                  
                  {step === 2 && (
                    <NivelesUpload 
                      fileData={fileData}
                      onNivelesUpload={handleNivelesUpload}
                      onConfirm={next}
                      onBack={prev}
                      isLoading={loading}
                    />
                  )}
                  
                  {step === 3 && (
                    <ColumnMapping 
                      headers={fileData?.headers} 
                      mapping={mapping} 
                      onChange={setMapping} 
                      onConfirm={next} 
                      onBack={prev} 
                    />
                  )}
                  
                  {step === 4 && (
                    <VariableDictionary 
                      headers={fileData?.headers} 
                      data={fileData?.data}
                      mappedColumns={mapping} 
                      mapping={mapping}
                      extraVars={extraVars} 
                      setExtraVars={setExtraVars} 
                      onNext={next} 
                      onBack={prev} 
                    />
                  )}
                  
                  {step === 5 && (
                    <PreCalcFilters 
                      data={fileData?.data} 
                      mapping={mapping} 
                      filters={filters} 
                      setFilters={setFilters} 
                      onNext={next} 
                      onBack={prev} 
                    />
                  )}
                  
                  {step === 6 && (
                    <CalculationConfig 
                      config={config} 
                      setConfig={setConfig} 
                      onCalculate={next} 
                      onBack={prev} 
                    />
                  )}
                  
                  {step === 7 && (
                    <ConfiguracionIncremento 
                      nivelesDisponibles={nivelMapping?.nivelesDisponibles || []}
                      config={config}
                      setConfig={setConfig}
                      onCalculate={calculateIncremento}
                      onBack={prev}
                    />
                  )}
                  
                  {step === 8 && incrementoRes && (
                    <IncrementoAnalysis 
                      analysis={incrementoRes}
                      onNewAnalysis={reset}
                    />
                  )}
                </>
              )}

              {/* OTROS MODOS - Flujo original */}
              {mode !== 'incremento' && (
                <>
                  {step === 1 && (
                    <FileUpload 
                      mode={mode} 
                      onFileUpload={handleFileUpload} 
                      onMultiUpload={handleMultiUpload}
                      onAbsenceUpload={handleAbsenceUpload}
                      absenceData={absenceData}
                      isLoading={loading} 
                    />
                  )}
                  
                  {step === 2 && (
                    <ColumnMapping 
                      headers={allHeaders.length > 0 ? allHeaders : (mode === 'single' || mode === 'equidad' ? fileData?.headers : multiFiles[0]?.headers)} 
                      mapping={mapping} 
                      onChange={setMapping} 
                      onConfirm={next} 
                      onBack={prev} 
                    />
                  )}
                  
                  {step === 3 && (
                    <VariableDictionary 
                      headers={allHeaders.length > 0 ? allHeaders : (mode === 'single' || mode === 'equidad' ? fileData?.headers : multiFiles[0]?.headers)} 
                      data={mode === 'single' || mode === 'equidad' ? fileData?.data : multiFiles[0]?.data}
                      mappedColumns={mapping} 
                      mapping={mapping}
                      extraVars={extraVars} 
                      setExtraVars={setExtraVars} 
                      onNext={next} 
                      onBack={prev} 
                    />
                  )}
                  
                  {step === 4 && (
                    <PreCalcFilters 
                      data={mode === 'single' || mode === 'equidad' ? fileData?.data : multiFiles[0]?.data} 
                      mapping={mapping} 
                      filters={filters} 
                      setFilters={setFilters} 
                      onNext={next} 
                      onBack={prev} 
                    />
                  )}
                  
                  {step === 5 && (
                    mode === 'equidad' ? (
                      <div className="text-center py-20 animate-fade-in">
                        <Scale className="w-20 h-20 text-amber-500 mx-auto mb-6" />
                        <h3 className="text-3xl font-bold mb-4 text-slate-800">Listo para Analizar Equidad</h3>
                        <p className="text-slate-500 mb-8">Se procesarán todos los datos para generar el análisis de brecha salarial</p>
                        <button onClick={calculate} className="btn-primary text-lg px-10 py-4">
                          Generar Análisis Completo
                        </button>
                      </div>
                    ) : (
                      <CalculationConfig 
                        config={config} 
                        setConfig={setConfig} 
                        onCalculate={calculate} 
                        onBack={prev} 
                      />
                    )
                  )}
                  
                  {step === 6 && mode === 'single' && results && (
                    <Results 
                      results={results} 
                      onBack={prev} 
                      onNewCalculation={reset} 
                    />
                  )}
                  
                  {step === 6 && mode === 'precierre' && precierreRes && (
                    <PrecierreAnalysis 
                      analysis={precierreRes} 
                      periodsData={multiFiles} 
                      onNewAnalysis={reset} 
                    />
                  )}
                  
                  {step === 6 && mode === 'equidad' && equityRes && (
                    <EquityAnalysis 
                      analysis={equityRes}
                      results={results}
                      onBack={reset} 
                    />
                  )}
                  
                  {step === 6 && mode === 'predictive' && predictiveRes && (
                    <PredictiveAnalysis 
                      analysis={predictiveRes}
                      periodsData={multiFiles}
                      onNewAnalysis={reset} 
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 mt-12 text-center text-sm text-slate-400">
        <p>Sistema de Costo Laboral Bolivia 2025 - Desarrollado con React + Tailwind CSS</p>
      </footer>
    </div>
  );
};

export default App;
