import React, { useState, useEffect } from 'react';
import {
  Upload, CheckCircle, Calculator, Filter, 
  ArrowRight, Plus, Trash2, Building2, Check, HelpCircle,
  TrendingUp, GitCompare, RefreshCw, AlertTriangle, Scale, FileBarChart,
  Eye, AlertCircle as AlertIcon, X
} from 'lucide-react';
import { 
  extractUniqueValues, formatPercent, CONSTANTS, formatCurrency,
  parseVariantsFile, getColumnsAfterLiquidoPagable, validateVariablesSum, 
  parseNumber
} from './utils';

// ============================================================================
// 1. CARGA DE ARCHIVOS (MEJORADO)
// ============================================================================
export const FileUpload = ({ mode, onFileUpload, onMultiUpload, onAbsenceUpload, absenceData, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setDragActive(e.type === "dragenter" || e.type === "dragover"); 
  };
  
  const handleDrop = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setDragActive(false); 
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      mode === 'single' || mode === 'equidad' ? onFileUpload(e.dataTransfer.files[0]) : onMultiUpload(e.dataTransfer.files);
    }
  };
  
  const handleChange = (e) => { 
    if (e.target.files[0]) {
      mode === 'single' || mode === 'equidad' ? onFileUpload(e.target.files[0]) : onMultiUpload(e.target.files);
    }
  };

  const handleAbsenceChange = (e) => {
    if(e.target.files[0]) onAbsenceUpload(e.target.files[0]);
  };

  const getModeConfig = () => {
    const configs = {
      single: { icon: Calculator, color: 'blue', title: 'Carga Planilla Mensual', desc: 'Sube tu archivo Excel (.xlsx) o CSV con la planilla del mes.' },
      equidad: { icon: Scale, color: 'amber', title: 'Análisis de Equidad', desc: 'Sube tu planilla para analizar brechas salariales de género.' },
      predictive: { icon: TrendingUp, color: 'purple', title: 'Carga Múltiples Planillas + Ausentismo', desc: 'Sube planillas de varios meses y archivo de ausentismo.' },
      precierre: { icon: GitCompare, color: 'emerald', title: 'Carga Múltiples Planillas', desc: 'Sube planillas de 2+ meses para comparar cambios.' }
    };
    return configs[mode] || configs.single;
  };

  const config = getModeConfig();

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-${config.color}-500 to-${config.color}-600 flex items-center justify-center text-white shadow-xl`}>
          <config.icon className="w-11 h-11" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-3">{config.title}</h2>
        <p className="text-slate-500 text-lg">{config.desc}</p>
      </div>

      <div 
        onDragEnter={handleDrag} 
        onDragOver={handleDrag} 
        onDragLeave={handleDrag} 
        onDrop={handleDrop}
        className={`relative border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${dragActive ? `border-${config.color}-500 bg-${config.color}-50 scale-105` : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400'}`}
      >
        <input type="file" multiple={mode === 'precierre' || mode === 'predictive'} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleChange} accept=".xlsx, .xls, .csv" />
        
        {isLoading ? (
          <div className="py-4">
            <RefreshCw className={`w-12 h-12 text-${config.color}-500 animate-spin mx-auto mb-4`} />
            <p className="text-slate-600 font-medium">Procesando archivo...</p>
          </div>
        ) : (
          <div className="py-4">
            <Upload className="w-14 h-14 text-slate-400 mx-auto mb-6" />
            <p className="font-bold text-xl text-slate-700 mb-2">
              {mode === 'precierre' || mode === 'predictive' ? 'Arrastra múltiples archivos o haz clic' : 'Arrastra tu archivo o haz clic'}
            </p>
            <p className="text-sm text-slate-500">Formatos: .xlsx, .xls, .csv</p>
          </div>
        )}
      </div>

      {mode === 'predictive' && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <FileBarChart className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-700">Archivo de Ausentismo (Opcional)</h3>
          </div>
          <div className="relative border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center bg-purple-50/30 hover:bg-purple-50 transition-all">
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleAbsenceChange} accept=".xlsx, .xls, .csv" />
            {absenceData ? (
              <div className="flex items-center justify-center gap-3 text-purple-700">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">{absenceData.length} registros de ausentismo cargados</span>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <p className="text-sm text-purple-700 font-medium">Carga archivo con: Nombre, Tipo, Días</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. MAPEO DE COLUMNAS
// ============================================================================
export const ColumnMapping = ({ headers, mapping, onChange, onConfirm, onBack }) => {
  const fields = [
    { key: 'nombre', label: 'Nombre Completo', required: true, icon: '👤' },
    { key: 'cargo', label: 'Cargo', required: true, icon: '💼' },
    { key: 'area', label: 'Área / Dpto', required: true, icon: '🏢' },
    { key: 'haberBasico', label: 'Haber Básico', required: true, icon: '💰' },
    { key: 'ci', label: 'Cédula (CI)', required: true, desc: 'Clave para auditoría', icon: '🆔' },
    { key: 'totalGanado', label: 'Total Ganado', required: true, desc: 'Para validación', icon: '💵' },
    { key: 'regional', label: 'Regional / Ciudad', required: false, desc: 'Para filtrar por ciudad', icon: '📍' },
    { key: 'empresa', label: 'Empresa / Razón Social', required: false, desc: 'Para filtrar por empresa', icon: '🏭' },
    { key: 'fechaIngreso', label: 'Fecha Ingreso', required: false, desc: 'Para antigüedad', icon: '📅' },
    { key: 'fechaRetiro', label: 'Fecha Retiro', required: false, desc: 'Para detectar bajas', icon: '🚪' },
    { key: 'genero', label: 'Género', required: false, desc: 'Para módulo de equidad', icon: '⚧' },
    { key: 'bonoAntiguedad', label: 'Bono Antigüedad', required: false, icon: '🎖️' },
    { key: 'bonoDominical', label: 'Bono Dominical', required: false, icon: '📅' },
  ];

  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);
  const progress = requiredFields.reduce((acc, f) => acc + (mapping[f.key] ? 1 : 0), 0);
  const progressPct = (progress / requiredFields.length) * 100;
  const canContinue = progressPct === 100;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Mapeo de Columnas</h2>
          <p className="text-slate-500">Conecta las columnas de tu archivo con los campos del sistema</p>
        </div>
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Progreso Obligatorio</span>
            <span className="text-sm font-bold text-slate-700">{progress}/{requiredFields.length}</span>
          </div>
          <div className="w-full md:w-48 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Campos Obligatorios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requiredFields.map((f) => (
            <FieldMapper key={f.key} field={f} headers={headers} mapping={mapping} onChange={onChange} />
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Campos Opcionales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {optionalFields.map((f) => (
            <FieldMapper key={f.key} field={f} headers={headers} mapping={mapping} onChange={onChange} />
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-200">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-800 font-medium px-6 py-3 rounded-xl hover:bg-slate-100 transition-all">← Atrás</button>
        <button onClick={onConfirm} disabled={!canContinue} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${canContinue ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          Confirmar Mapeo <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const FieldMapper = ({ field, headers, mapping, onChange }) => {
  const isMapped = !!mapping[field.key];
  return (
    <div className={`p-5 rounded-2xl border-2 transition-all ${isMapped ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <label className="block mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{field.icon}</span>
            <span className="text-sm font-bold text-slate-700">{field.label}</span>
          </div>
          {field.required && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">REQUERIDO</span>}
          {isMapped && <CheckCircle className="w-5 h-5 text-emerald-600" />}
        </div>
        <select value={mapping[field.key] || ''} onChange={(e) => onChange({...mapping, [field.key]: e.target.value})} className="w-full p-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all">
          <option value="">-- Seleccionar columna --</option>
          {headers.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </label>
      {field.desc && <p className="text-xs text-slate-500 mt-2 flex items-start gap-1"><HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{field.desc}</p>}
    </div>
  );
};

// ============================================================================
// 3. DICCIONARIO DE VARIABLES (MEJORADO CON VALIDACIÓN)
// ============================================================================
export const VariableDictionary = ({ headers, data, mappedColumns, mapping, extraVars, setExtraVars, onNext, onBack }) => {
    const [variantsFile, setVariantsFile] = useState(null);
    const [variants, setVariants] = useState([]);
    const [renamedHeaders, setRenamedHeaders] = useState({});
    const [validation, setValidation] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    
    const used = Object.values(mappedColumns);
    const afterLiquido = getColumnsAfterLiquidoPagable(headers);
    const available = afterLiquido.filter(h => !used.includes(h));
    
    const handleVariantsUpload = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        try {
            const parsedVariants = await parseVariantsFile(file);
            setVariants(parsedVariants);
            setVariantsFile(file.name);
            
            const renamed = {};
            available.forEach(col => {
                const variant = parsedVariants.find(v => 
                    col.includes(v.codigo) || normalizeText(col).includes(normalizeText(v.codigo))
                );
                if(variant) {
                    renamed[col] = `${variant.nombre} (${variant.tipo.toUpperCase()})`;
                }
            });
            setRenamedHeaders(renamed);
        } catch(err) {
            alert('Error al cargar archivo de variantes: ' + err.message);
        }
    };
    
    const getDisplayName = (col) => renamedHeaders[col] || col;
    
    const getVariantType = (col) => {
        const variant = variants.find(v => 
            col.includes(v.codigo) || normalizeText(col).includes(normalizeText(v.codigo))
        );
        return variant ? variant.tipo : 'otro';
    };
    
    const isIncremento = (col) => {
        const tipo = getVariantType(col);
        return normalizeText(tipo).includes('increment') || normalizeText(tipo).includes('ingreso');
    };
    
    const toggle = (col) => {
        if(!isIncremento(col) && variants.length > 0) {
            alert('Solo se pueden seleccionar variantes tipo INCREMENTO');
            return;
        }
        
        if(extraVars.find(v => v.originalName === col)) {
          setExtraVars(extraVars.filter(v => v.originalName !== col));
        } else {
          setExtraVars([...extraVars, { originalName: col, alias: getDisplayName(col), isComputable: true }]);
        }
    };
    
    useEffect(() => {
        if(extraVars.length > 0 && data && data.length > 0) {
            const result = validateVariablesSum(data, mapping, extraVars);
            setValidation(result);
        } else {
            setValidation(null);
        }
    }, [extraVars, data, mapping]);

    const incrementoVars = available.filter(isIncremento);
    const otherVars = available.filter(c => !isIncremento(c));

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                <Plus className="w-9 h-9" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Validación de Variables Adicionales</h2>
              <p className="text-slate-500 text-lg">Total Ganado = Haber Básico + Bono Antigüedad + Bono Dominical + Otros Bonos</p>
            </div>

            {/* Upload de Variantes */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 mb-8">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <FileBarChart className="w-5 h-5" />
                    Archivo de Variantes (Opcional pero Recomendado)
                </h3>
                <p className="text-sm text-blue-700 mb-4">Sube un archivo con: Código | Nombre | Tipo (INCREMENTO/DESCUENTO)</p>
                <div className="relative">
                    <input type="file" onChange={handleVariantsUpload} accept=".xlsx,.xls,.csv" className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="p-4 bg-white rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 transition-all flex items-center justify-center gap-3">
                        {variantsFile ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="font-medium text-slate-700">{variantsFile} - {variants.length} variantes cargadas</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5 text-blue-500" />
                                <span className="text-slate-600">Click para cargar archivo de variantes</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Validación en Tiempo Real */}
            {validation && (
                <div className={`p-6 rounded-2xl border-2 mb-8 ${validation.allValid ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold flex items-center gap-2">
                            {validation.allValid ? 
                                <><CheckCircle className="w-5 h-5 text-emerald-600" /> Validación Exitosa</> :
                                <><AlertIcon className="w-5 h-5 text-red-600" /> Validación Fallida</>
                            }
                        </h3>
                        <button onClick={() => setShowPreview(!showPreview)} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {showPreview ? 'Ocultar' : 'Ver'} Preview
                        </button>
                    </div>
                    
                    {showPreview && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-2 text-left">Nombre</th>
                                        <th className="p-2 text-right">Haber</th>
                                        <th className="p-2 text-right">Antigüedad</th>
                                        <th className="p-2 text-right">Dominical</th>
                                        <th className="p-2 text-right">Otros</th>
                                        <th className="p-2 text-right">Calculado</th>
                                        <th className="p-2 text-right">Esperado</th>
                                        <th className="p-2 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validation.validation.map((v, i) => (
                                        <tr key={i} className={v.isValid ? '' : 'bg-red-100'}>
                                            <td className="p-2">{v.nombre}</td>
                                            <td className="p-2 text-right">{formatCurrency(v.haberBasico)}</td>
                                            <td className="p-2 text-right">{formatCurrency(v.bonoAntiguedad)}</td>
                                            <td className="p-2 text-right">{formatCurrency(v.bonoDominical)}</td>
                                            <td className="p-2 text-right">{formatCurrency(v.otrosBonos)}</td>
                                            <td className="p-2 text-right font-bold">{formatCurrency(v.totalCalculado)}</td>
                                            <td className="p-2 text-right">{formatCurrency(v.totalEsperado)}</td>
                                            <td className="p-2 text-center">
                                                {v.isValid ? <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-red-600 mx-auto" />}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Selección de Variables */}
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700">Columnas Disponibles (Después de Liquido Pagable)</h3>
                <span className="text-sm text-slate-500">{extraVars.length} seleccionada{extraVars.length !== 1 ? 's' : ''}</span>
              </div>
              
              {variants.length > 0 && incrementoVars.length > 0 && (
                <div className="mb-6">
                    <p className="text-sm font-bold text-emerald-700 mb-3">✓ Variables tipo INCREMENTO</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {incrementoVars.map(col => {
                            const selected = extraVars.find(v => v.originalName === col);
                            return (
                                <button key={col} onClick={() => toggle(col)} className={`p-4 rounded-xl border-2 text-left flex items-center justify-between gap-2 transition-all ${selected ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                                    <span className={`text-sm font-medium truncate ${selected ? 'text-white' : 'text-slate-700'}`} title={getDisplayName(col)}>
                                      {getDisplayName(col)}
                                    </span>
                                    {selected && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
              )}
              
              {variants.length === 0 && available.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {available.map(col => {
                        const selected = extraVars.find(v => v.originalName === col);
                        return (
                            <button key={col} onClick={() => toggle(col)} className={`p-4 rounded-xl border-2 text-left flex items-center justify-between gap-2 transition-all ${selected ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                                <span className={`text-sm font-medium truncate ${selected ? 'text-white' : 'text-slate-700'}`} title={col}>{col}</span>
                                {selected ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <Plus className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                            </button>
                        );
                    })}
                </div>
              )}

              {available.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p>No hay columnas disponibles después de "Liquido Pagable"</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                <button onClick={onBack} className="text-slate-600 hover:text-slate-800 font-medium px-6 py-3 rounded-xl hover:bg-slate-100 transition-all">← Atrás</button>
                <button onClick={onNext} disabled={validation && !validation.allValid} className={`px-8 py-3 rounded-xl font-bold text-base transition-all ${validation && validation.allValid ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                    Continuar <ArrowRight className="w-5 h-5 ml-2 inline" />
                </button>
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
        if(data) {
          setOpts({
              empresas: extractUniqueValues(data, mapping.empresa),
              regionales: extractUniqueValues(data, mapping.regional),
              areas: extractUniqueValues(data, mapping.area),
              cargos: extractUniqueValues(data, mapping.cargo)
          });
        }
    }, [data, mapping]);

    const change = (k, v) => setFilters(prev => ({...prev, [k]: v}));
    const activeFilters = Object.values(filters).filter(v => v && v !== 'Todas').length;

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                  <Filter className="w-9 h-9" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-3">Segmentación de Datos</h2>
                <p className="text-slate-500 text-lg">Aplica filtros para generar reportes específicos</p>
                {activeFilters > 0 && (
                  <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    <Filter className="w-4 h-4" />
                    {activeFilters} filtro{activeFilters > 1 ? 's' : ''} activo{activeFilters > 1 ? 's' : ''}
                  </div>
                )}
            </div>

            <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-lg space-y-6">
                {[
                  { key: 'empresa', label: 'Empresa / Razón Social', icon: '🏭' },
                  { key: 'regional', label: 'Regional / Ciudad', icon: '📍' },
                  { key: 'area', label: 'Área / Departamento', icon: '🏢' },
                  { key: 'cargo', label: 'Cargo / Puesto', icon: '💼' }
                ].map(({ key, label, icon }) => (
                    <div key={key}>
                        <label className="block mb-2">
                          <span className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            <span>{icon}</span>
                            {label}
                          </span>
                        </label>
                        <select value={filters[key] || 'Todas'} onChange={(e) => change(key, e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium">
                            <option value="Todas">📋 Todas</option>
                            {opts[key+'s']?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-8">
                <button onClick={onBack} className="text-slate-600 hover:text-slate-800 font-medium px-6 py-3 rounded-xl hover:bg-slate-100 transition-all">← Atrás</button>
                <button onClick={onNext} className="btn-primary px-8 py-3 text-base">
                  Ir a Parámetros <ArrowRight className="w-5 h-5 ml-2" />
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// 5. CONFIGURACIÓN DE CÁLCULO
// ============================================================================
export const CalculationConfig = ({ config, setConfig, onCalculate, onBack }) => {
  const toggle = (k) => setConfig(prev => ({...prev, [k]: !prev[k]}));
  
  const provisions = [
    { key: 'aguinaldo', label: 'Aguinaldo', desc: 'Pago anual equivalente a 1 mes de salario', pct: '8.33%' },
    { key: 'indemnizacion', label: 'Indemnización', desc: 'Fondo por tiempo de servicio', pct: '8.33%' },
    { key: 'primaUtilidades', label: 'Prima de Utilidades', desc: 'Distribución de utilidades', pct: '8.33%' },
    { key: 'segundoAguinaldo', label: 'Segundo Aguinaldo', desc: 'Si aplica según crecimiento PIB', pct: '8.33%' }
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
          <Calculator className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Parámetros Legales Bolivia 2025</h2>
        <p className="text-slate-500 text-lg">Configura las cargas y provisiones a incluir en el cálculo</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl border-2 border-blue-200 shadow-lg">
            <h3 className="font-bold text-xl flex items-center gap-3 mb-6 text-blue-900">
              <Building2 className="w-6 h-6 text-blue-600"/> 
              Cargas Patronales
            </h3>
            <ul className="space-y-4">
                <li className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
                  <span className="font-medium text-slate-700">Caja Nacional de Salud</span>
                  <span className="font-bold text-blue-700">10.00%</span>
                </li>
                <li className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
                  <span className="font-medium text-slate-700">AFP Riesgo Profesional</span>
                  <span className="font-bold text-blue-700">1.71%</span>
                </li>
                <li className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
                  <span className="font-medium text-slate-700">AFP Pro Vivienda</span>
                  <span className="font-bold text-blue-700">2.00%</span>
                </li>
                <li className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
                  <span className="font-medium text-slate-700">AFP Solidario Patronal</span>
                  <span className="font-bold text-blue-700">3.50%</span>
                </li>
                <li className="flex justify-between items-center pt-4 mt-4 border-t-2 border-blue-200">
                  <span className="text-lg font-bold text-blue-900">TOTAL CARGA PATRONAL</span>
                  <span className="text-2xl font-extrabold text-blue-700">17.21%</span>
                </li>
            </ul>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-3xl border-2 border-emerald-200 shadow-lg">
            <h3 className="font-bold text-xl flex items-center gap-3 mb-6 text-emerald-900">
              <CheckCircle className="w-6 h-6 text-emerald-600"/> 
              Provisiones
            </h3>
            <div className="space-y-3">
                {provisions.map(p => (
                    <button key={p.key} onClick={() => toggle(p.key)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${config[p.key] ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold ${config[p.key] ? 'text-white' : 'text-slate-800'}`}>{p.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${config[p.key] ? 'text-emerald-100' : 'text-emerald-600'}`}>{p.pct}</span>
                            {config[p.key] && <Check className="w-5 h-5" />}
                          </div>
                        </div>
                        <p className={`text-xs ${config[p.key] ? 'text-emerald-100' : 'text-slate-500'}`}>{p.desc}</p>
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-200">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-800 font-medium px-6 py-3 rounded-xl hover:bg-slate-100 transition-all">← Atrás</button>
        <button onClick={onCalculate} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all flex items-center gap-3">
          <Calculator className="w-6 h-6" /> Calcular Ahora
        </button>
      </div>
    </div>
  );
};
