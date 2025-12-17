import React, { useState, useEffect } from 'react';
import {
  Upload, CheckCircle, Calculator, Filter, 
  ArrowRight, Plus, Trash2, Building2, Check, HelpCircle,
  TrendingUp, GitCompare, RefreshCw, AlertTriangle
} from 'lucide-react';
import { extractUniqueValues, formatPercent, CONSTANTS, formatCurrency } from './utils';

// ============================================================================
// 1. CARGA DE ARCHIVOS
// ============================================================================
export const FileUpload = ({ mode, onFileUpload, onMultiUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); 
    if (e.dataTransfer.files && e.dataTransfer.files[0]) mode === 'single' ? onFileUpload(e.dataTransfer.files[0]) : onMultiUpload(e.dataTransfer.files); 
  };
  const handleChange = (e) => { if (e.target.files[0]) mode === 'single' ? onFileUpload(e.target.files[0]) : onMultiUpload(e.target.files); };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
          mode === 'single' ? 'bg-blue-100 text-blue-600' : mode === 'predictive' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {mode === 'single' ? <Calculator className="w-8 h-8" /> : mode === 'predictive' ? <TrendingUp className="w-8 h-8" /> : <GitCompare className="w-8 h-8" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {mode === 'single' ? 'Carga Planilla Mensual' : mode === 'equidad' ? 'Análisis de Equidad' : 'Carga Múltiples Planillas'}
        </h2>
        <p className="text-slate-500">Sube tus archivos Excel (.xlsx) o CSV.</p>
      </div>
      <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'}`}>
        <input type="file" multiple={mode !== 'single'} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleChange} accept=".xlsx, .xls, .csv" />
        {isLoading ? <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" /> : 
          <><Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" /><p className="font-medium text-slate-700">Arrastra o haz clic</p></>
        }
      </div>
    </div>
  );
};

// ============================================================================
// 2. MAPEO DE COLUMNAS (CORREGIDO: Campos Nuevos)
// ============================================================================
export const ColumnMapping = ({ headers, mapping, onChange, onConfirm, onBack }) => {
  const fields = [
    { key: 'nombre', label: 'Nombre Completo', required: true },
    { key: 'cargo', label: 'Cargo', required: true },
    { key: 'area', label: 'Área / Dpto', required: true },
    { key: 'haberBasico', label: 'Haber Básico', required: true },
    { key: 'ci', label: 'Cédula (CI)', required: true, desc: 'Clave para auditoría' },
    // CAMPOS NUEVOS OBLIGATORIOS PARA FILTROS
    { key: 'regional', label: 'Regional / Ciudad', required: false, desc: 'Para filtrar por ciudad' },
    { key: 'empresa', label: 'Empresa / Razón Social', required: false, desc: 'Para filtrar por empresa' },
    { key: 'fechaIngreso', label: 'Fecha Ingreso', required: false, desc: 'Para antigüedad' },
    { key: 'fechaRetiro', label: 'Fecha Retiro', required: false, desc: 'Para detectar bajas' },
    { key: 'genero', label: 'Género', required: false, desc: 'Para módulo de equidad' },
    { key: 'bonoAntiguedad', label: 'Bono Antigüedad', required: false },
    { key: 'totalGanado', label: 'Total Ganado', required: false },
  ];

  const progress = fields.reduce((acc, f) => acc + (mapping[f.key] ? 1 : 0), 0);
  const requiredCount = fields.filter(f => f.required).length;
  const progressPct = (progress / requiredCount) * 100;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Mapeo de Columnas</h2>
        <div className="text-right">
            <span className="text-xs font-bold text-blue-600">Progreso Obligatorio</span>
            <div className="w-32 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${Math.min(progressPct, 100)}%` }} />
            </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={`p-4 rounded-xl border ${mapping[f.key] ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
              {f.label} {f.required && <span className="text-red-500">*</span>}
              {mapping[f.key] && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </label>
            <select value={mapping[f.key] || ''} onChange={(e) => onChange({...mapping, [f.key]: e.target.value})} 
              className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">-- Seleccionar --</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            {f.desc && <p className="text-xs text-slate-400 mt-1">{f.desc}</p>}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="text-slate-500 px-4">Atrás</button>
        <button onClick={onConfirm} className="btn-primary" disabled={progressPct < 100}>Confirmar Mapeo <ArrowRight className="w-4 h-4 ml-2" /></button>
      </div>
    </div>
  );
};

// ============================================================================
// 3. DICCIONARIO DE VARIABLES
// ============================================================================
export const VariableDictionary = ({ headers, mappedColumns, extraVars, setExtraVars, onNext, onBack }) => {
    const used = Object.values(mappedColumns);
    const available = headers.filter(h => !used.includes(h));
    
    const toggle = (col) => {
        if(extraVars.find(v => v.originalName === col)) setExtraVars(extraVars.filter(v => v.originalName !== col));
        else setExtraVars([...extraVars, { originalName: col, alias: col, isComputable: true }]);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Diccionario de Variables</h2>
            <p className="text-slate-500 text-center mb-8">Selecciona columnas adicionales (Bonos, Comisiones) para sumar al Total Ganado.</p>
            <div className="grid grid-cols-2 gap-4 h-80 overflow-y-auto mb-8 pr-2">
                {available.map(col => {
                    const selected = extraVars.find(v => v.originalName === col);
                    return (
                        <div key={col} onClick={() => toggle(col)} 
                             className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center ${selected ? 'bg-indigo-50 border-indigo-500' : 'bg-white hover:border-indigo-300'}`}>
                            <span className="text-sm truncate w-40" title={col}>{col}</span>
                            {selected ? <CheckCircle className="w-4 h-4 text-indigo-600" /> : <Plus className="w-4 h-4 text-slate-300" />}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between border-t pt-4">
                <button onClick={onBack} className="text-slate-500 px-4">Atrás</button>
                <button onClick={onNext} className="btn-primary">Siguiente <ArrowRight className="w-4 h-4 ml-2" /></button>
            </div>
        </div>
    );
};

// ============================================================================
// 4. FILTROS PRE-CÁLCULO
// ============================================================================
export const PreCalcFilters = ({ data, mapping, filters, setFilters, onNext, onBack }) => {
    const [opts, setOpts] = useState({});
    useEffect(() => {
        if(data) setOpts({
            empresas: extractUniqueValues(data, mapping.empresa),
            regionales: extractUniqueValues(data, mapping.regional),
            areas: extractUniqueValues(data, mapping.area),
            cargos: extractUniqueValues(data, mapping.cargo)
        });
    }, [data, mapping]);

    const change = (k, v) => setFilters(prev => ({...prev, [k]: v}));

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
                <Filter className="w-12 h-12 text-blue-600 mx-auto mb-4 bg-blue-100 p-2 rounded-xl" />
                <h2 className="text-2xl font-bold text-slate-800">Segmentación de Datos</h2>
                <p className="text-slate-500">Aplica filtros antes del cálculo para reportes específicos.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                {['empresa', 'regional', 'area', 'cargo'].map(k => (
                    <div key={k}>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{k}</label>
                        <select value={filters[k] || 'Todas'} onChange={(e) => change(k, e.target.value)}
                            className="w-full p-2 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="Todas">Todas</option>
                            {opts[k+'s']?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-8">
                <button onClick={onBack} className="text-slate-500 px-4">Atrás</button>
                <button onClick={onNext} className="btn-primary">Ir a Parámetros <ArrowRight className="w-4 h-4 ml-2" /></button>
            </div>
        </div>
    );
};

// ============================================================================
// 5. CONFIGURACIÓN (CORREGIDO: 17.21%)
// ============================================================================
export const CalculationConfig = ({ config, setConfig, onCalculate, onBack }) => {
  const toggle = (k) => setConfig(prev => ({...prev, [k]: !prev[k]}));
  
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">Parámetros Legales 2025</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-blue-600"/> Cargas Patronales</h3>
            <ul className="space-y-3 text-sm">
                <li className="flex justify-between"><span>Caja Nacional</span><span className="font-bold">10.00%</span></li>
                <li className="flex justify-between"><span>AFP Riesgo</span><span className="font-bold">1.71%</span></li>
                <li className="flex justify-between"><span>AFP Vivienda</span><span className="font-bold">2.00%</span></li>
                <li className="flex justify-between"><span>AFP Solidario</span><span className="font-bold">3.50%</span></li>
                <li className="flex justify-between pt-3 border-t text-blue-700 font-bold text-base">
                    <span>Total Carga</span><span>17.21%</span> {/* CORREGIDO AQUÍ */}
                </li>
            </ul>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4"><CheckCircle className="w-5 h-5 text-emerald-600"/> Provisiones</h3>
            <div className="space-y-3">
                {['aguinaldo', 'indemnizacion', 'primaUtilidades', 'segundoAguinaldo'].map(k => (
                    <div key={k} onClick={() => toggle(k)} className={`p-3 rounded-lg border cursor-pointer flex justify-between ${config[k] ? 'bg-emerald-50 border-emerald-500' : 'hover:bg-slate-50'}`}>
                        <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                        {config[k] && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                ))}
            </div>
        </div>
      </div>
      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="text-slate-500 px-4">Atrás</button>
        <button onClick={onCalculate} className="btn-primary py-3 px-8 text-lg shadow-xl shadow-blue-200">
            <Calculator className="w-5 h-5 mr-2" /> Calcular Ahora
        </button>
      </div>
    </div>
  );
};