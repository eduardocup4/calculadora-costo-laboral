import React, { useState } from 'react';
import { Calculator, TrendingUp, GitCompare, Award, Scale } from 'lucide-react';
import { parseExcel, autoDetectColumns, calculateAll, analyzePrecierre, analyzeEquity, MONTHS } from './utils.js';
import { FileUpload, ColumnMapping, VariableDictionary, PreCalcFilters, CalculationConfig } from './Steps.jsx';
import Results from './Results.jsx';
import PrecierreAnalysis from './PrecierreAnalysis.jsx';
import EquityAnalysis from './EquityAnalysis.jsx';

const ModeSelector = ({ onSelectMode }) => {
  const modes = [
    { id: 'single', title: 'Costo Mensual', desc: 'Reporte detallado con filtros y exportación PDF.', icon: Calculator, color: 'blue' },
    { id: 'precierre', title: 'Auditoría Precierre', desc: 'Detecta Altas, Bajas y Variaciones vs Mes Anterior.', icon: GitCompare, color: 'emerald' },
    { id: 'equidad', title: 'Equidad Salarial', desc: 'Análisis de brecha de género y competitividad interna.', icon: Scale, color: 'purple' }
  ];

  return (
    <div className="max-w-6xl mx-auto mt-16 px-4 animate-enter grid md:grid-cols-3 gap-6">
        {modes.map(m => (
            <button key={m.id} onClick={() => onSelectMode(m.id)} 
                className={`text-left p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl hover:-translate-y-1 transition-all group`}>
                <div className={`w-14 h-14 rounded-2xl bg-${m.color}-100 flex items-center justify-center mb-6 text-${m.color}-600`}>
                    <m.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{m.title}</h3>
                <p className="text-slate-500 text-sm">{m.desc}</p>
            </button>
        ))}
    </div>
  );
};

const App = () => {
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data
  const [fileData, setFileData] = useState(null);
  const [multiFiles, setMultiFiles] = useState([]);
  const [mapping, setMapping] = useState({});
  const [extraVars, setExtraVars] = useState([]);
  const [filters, setFilters] = useState({});
  const [config, setConfig] = useState({ aguinaldo: true, indemnizacion: true, primaUtilidades: true, segundoAguinaldo: false });
  
  // Outputs
  const [results, setResults] = useState(null);
  const [precierreRes, setPrecierreRes] = useState(null);
  const [equityRes, setEquityRes] = useState(null);

  const reset = () => { setMode(null); setStep(1); setFileData(null); setMultiFiles([]); setResults(null); setPrecierreRes(null); setEquityRes(null); };
  const next = () => setStep(p => p + 1);
  const prev = () => setStep(p => p - 1);

  const handleFileUpload = async (file) => {
      setLoading(true);
      const { headers, data } = await parseExcel(file);
      setFileData({ headers, data, fileName: file.name });
      setMapping(autoDetectColumns(headers));
      setLoading(false); next();
  };

  const handleMultiUpload = async (files) => {
      setLoading(true);
      const promises = Array.from(files).map(async (f) => {
          const res = await parseExcel(f);
          // Detectar Mes/Año del nombre
          let month = 1, year = 2025;
          MONTHS.forEach((m,i) => { if(f.name.toLowerCase().includes(m.toLowerCase())) month = i+1; });
          const y = f.name.match(/20\d{2}/); if(y) year = parseInt(y[0]);
          return { ...res, file: f, month, year, name: f.name };
      });
      const processed = (await Promise.all(promises)).sort((a,b) => (a.year*100+a.month)-(b.year*100+b.month));
      setMultiFiles(processed);
      setMapping(autoDetectColumns(processed[processed.length-1].headers));
      setLoading(false); next();
  };

  const calculate = () => {
      setLoading(true);
      setTimeout(() => {
          try {
              if(mode === 'single') {
                  const res = calculateAll(fileData.data, mapping, config, filters, extraVars);
                  setResults(res);
              } else if(mode === 'precierre') {
                  const periods = multiFiles.map(p => ({ ...p, results: calculateAll(p.data, mapping, config, filters, extraVars) }));
                  setPrecierreRes(analyzePrecierre(periods));
                  setMultiFiles(periods); // Guardar para usar nombres de periodos
              } else if(mode === 'equidad') {
                  const res = calculateAll(fileData.data, mapping, config, filters, extraVars);
                  setEquityRes(analyzeEquity(res.details));
              }
              next();
          } catch(e) { alert(e.message); }
          setLoading(false);
      }, 500);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-50 glass bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Award /></div>
                <h1 className="font-bold text-lg">Costo Laboral <span className="text-blue-600">v4.0</span></h1>
            </div>
            {mode && <button onClick={reset} className="text-sm font-medium text-slate-500 hover:text-blue-600">Cambiar Modo</button>}
        </div>
      </header>

      <main className="pt-10">
        {!mode ? <ModeSelector onSelectMode={setMode} /> : (
            <div className="max-w-7xl mx-auto px-6">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-12 min-h-[600px]">
                    {step === 1 && <FileUpload mode={mode} onFileUpload={handleFileUpload} onMultiUpload={handleMultiUpload} isLoading={loading} />}
                    {step === 2 && <ColumnMapping headers={mode==='single' || mode==='equidad' ? fileData?.headers : multiFiles[0]?.headers} mapping={mapping} onChange={setMapping} onConfirm={next} onBack={prev} />}
                    {step === 3 && <VariableDictionary headers={mode==='single' || mode==='equidad' ? fileData?.headers : multiFiles[0]?.headers} mappedColumns={mapping} extraVars={extraVars} setExtraVars={setExtraVars} onNext={next} onBack={prev} />}
                    {step === 4 && <PreCalcFilters data={mode==='single' || mode==='equidad' ? fileData?.data : multiFiles[0]?.data} mapping={mapping} filters={filters} setFilters={setFilters} onNext={next} onBack={prev} />}
                    {step === 5 && (mode === 'equidad' ? 
                        <div className="text-center py-20"><h3 className="text-2xl font-bold mb-4">Listo para analizar equidad</h3><button onClick={calculate} className="btn-primary">Generar Análisis</button></div> : 
                        <CalculationConfig config={config} setConfig={setConfig} onCalculate={calculate} onBack={prev} />
                    )}
                    
                    {step === 6 && mode === 'single' && results && <Results results={results} onBack={prev} onNewCalculation={reset} />}
                    {step === 6 && mode === 'precierre' && precierreRes && <PrecierreAnalysis analysis={precierreRes} periodsData={multiFiles} onNewAnalysis={reset} />}
                    {step === 6 && mode === 'equidad' && equityRes && <EquityAnalysis analysis={equityRes} onBack={reset} />}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;