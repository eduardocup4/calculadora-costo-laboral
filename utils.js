/**
 * CALCULADORA DE COSTO LABORAL ANUAL - BOLIVIA
 * Versión 3.0 con People Analytics Avanzado
 * 
 * Funcionalidades:
 * - Cálculo de costo laboral según legislación boliviana
 * - Desglose completo de componentes salariales
 * - Selección y filtrado de empleados
 * - Grupos guardados de selección
 * - Análisis predictivo multi-período
 * - Detección de cambios (ingresos, salidas, promociones)
 * - Factor de Bradford (ausentismo)
 * - Análisis de vacaciones según normativa boliviana
 * - Cálculo de antigüedad y distribución
 * - Tasa de rotación
 * - Forecast y proyecciones
 * 
 * Diseñado por JELB - https://www.linkedin.com/in/jelbas/
 */

import * as XLSX from 'xlsx';

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

const CONSTANTS = {
  PROVISION_RATE: 0.0833,
  APORTE_GESTORA: 0.0721,
  APORTE_CAJA_SALUD: 0.10,
  TOTAL_APORTES: 0.1721,
};

// Vacaciones según Ley General del Trabajo Bolivia
const VACATION_DAYS = {
  TIER_1: { min: 1, max: 5, days: 15 },   // 1-5 años: 15 días hábiles
  TIER_2: { min: 5, max: 10, days: 20 },  // 5-10 años: 20 días hábiles
  TIER_3: { min: 10, max: Infinity, days: 30 }, // 10+ años: 30 días hábiles
};

// Clasificación Factor de Bradford
const BRADFORD_THRESHOLDS = {
  LOW: { max: 200, label: 'Bajo', color: 'emerald' },
  MODERATE: { max: 450, label: 'Moderado', color: 'amber' },
  HIGH: { max: 900, label: 'Alto', color: 'orange' },
  CRITICAL: { max: Infinity, label: 'Crítico', color: 'red' },
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

// Paleta de colores refinada para gráficos profesionales
const CHART_COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
  neutral: '#64748b',
  gradient: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'],
};

// ============================================================================
// UTILIDADES DE FORMATO
// ============================================================================

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'Bs 0.00';
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value, decimals = 1) => {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

const formatNumber = (value, decimals = 0) => {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const roundTwo = (num) => {
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
};

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Normaliza CI removiendo sufijo de departamento (ej: "6301349 SC" -> "6301349")
const normalizeCI = (ci) => {
  if (!ci) return '';
  return String(ci).trim().split(' ')[0].replace(/[^\d]/g, '');
};

// ============================================================================
// PARSERS DE ARCHIVOS
// ============================================================================

const makeUniqueHeaders = (rawHeaders) => {
  const counts = {};
  return rawHeaders.map((h) => {
    const name = String(h ?? '').trim().replace(/\s+/g, ' ');
    if (!name) return '';
    counts[name] = (counts[name] || 0) + 1;
    return counts[name] === 1 ? name : `${name} (${counts[name]})`;
  });
};

const stripHeaderSuffix = (h) => String(h ?? '').trim().replace(/\s*\(\d+\)\s*$/, '');

const pickMappedValue = (row, primary, alternate) => {
  const has = (k) => k && Object.prototype.hasOwnProperty.call(row, k) && row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '';
  if (has(primary)) return row[primary];
  if (has(alternate)) return row[alternate];
  return undefined;
};

const pickMappedNumber = (row, primary, alternate) => parseNumber(pickMappedValue(row, primary, alternate));

const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) throw new Error('El archivo está vacío');
  
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headersRaw = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  const headers = makeUniqueHeaders(headersRaw);
  
  const data = lines.slice(1).map((line, index) => {
    const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
    const row = { _rowIndex: index + 2, _id: `emp_${index}` };
    headers.forEach((header, i) => {
      const numValue = parseFloat(values[i]?.replace(/[^\d.-]/g, ''));
      row[header] = isNaN(numValue) ? values[i] : numValue;
    });
    return row;
  }).filter(row => Object.keys(row).some(key => !key.startsWith('_') && row[key]));
  
  return { headers, data };
};

const parseExcel = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (jsonData.length === 0) throw new Error('La hoja está vacía');

  const headersRaw = jsonData[0].map(h => String(h || '').trim());
  const headers = makeUniqueHeaders(headersRaw);
  const data = jsonData.slice(1).map((row, index) => {
    const obj = { _rowIndex: index + 2, _id: `emp_${index}` };
    headers.forEach((header, i) => {
      if (!header) return;
      const numValue = parseFloat(String(row[i] || '')?.replace(/[^\d.-]/g, ''));
      obj[header] = isNaN(numValue) ? row[i] : numValue;
    });
    return obj;
  }).filter(row => Object.keys(row).some(key => !key.startsWith('_') && row[key]));

  return { headers, data };
};

// Parser específico para archivo de ausencias
const parseAbsenceFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

  return jsonData.map((row, index) => ({
    _id: `abs_${index}`,
    nombre: row['Nombre'] || '',
    ci: normalizeCI(row['C.I.'] || row['CI'] || row['Ci'] || ''),
    empresa: row['Empresa'] || '',
    departamento: row['Departamento'] || row['Grupo'] || '',
    cargo: row['Cargo'] || '',
    tipoSolicitud: row['Tipo Solicitud'] || row['Tipo'] || '',
    motivo: row['Motivo'] || '',
    justificacion: row['Justificación'] || row['Justificacion'] || '',
    fechaInicio: row['Feha Inicio'] || row['Fecha Inicio'] || row['FechaInicio'] || null,
    fechaFin: row['Fecha Fin'] || row['FechaFin'] || null,
    dias: parseNumber(row['Dias'] || row['Días'] || 0),
  }));
};

const autoDetectColumns = (headers) => {
  const mapping = {
    haberBasico: '', haberBasicoAlt: '',
    bonoAntiguedad: '', bonoAntiguedadAlt: '',
    bonoDominical: '', bonoDominicalAlt: '',
    otrosBonos: [],
    totalGanado: '', totalGanadoAlt: '',
    nombre: '', cargo: '', area: '', empresa: '', identificador: '',
    fechaIngreso: '', fechaSalida: ''
  };
  
  headers.forEach(header => {
    const lower = stripHeaderSuffix(header).toLowerCase();
    if ((lower.includes('haber') && lower.includes('básico')) || 
        (lower.includes('haber') && lower.includes('basico')) || lower === 'hb') {
      if (!mapping.haberBasico) mapping.haberBasico = header; else if (!mapping.haberBasicoAlt) mapping.haberBasicoAlt = header;
    } else if (lower.includes('antigüedad') || lower.includes('antiguedad') || lower === 'ba') {
      if (!mapping.bonoAntiguedad) mapping.bonoAntiguedad = header; else if (!mapping.bonoAntiguedadAlt) mapping.bonoAntiguedadAlt = header;
    } else if ((lower.includes('total') && lower.includes('ganado')) || lower === 'tg') {
      if (!mapping.totalGanado) mapping.totalGanado = header; else if (!mapping.totalGanadoAlt) mapping.totalGanadoAlt = header;
    } else if (lower.includes('dominical')) {
      if (!mapping.bonoDominical) mapping.bonoDominical = header; else if (!mapping.bonoDominicalAlt) mapping.bonoDominicalAlt = header;
    } else if ((lower.includes('fecha') && lower.includes('salida')) || lower.includes('retiro')) {
      mapping.fechaSalida = header;
    } else if ((lower.includes('fecha') && lower.includes('ingreso')) || lower.includes('incorporacion') || lower.includes('incorporación')) {
      mapping.fechaIngreso = header;
    } else if (lower.includes('nombre') || lower.includes('empleado') || lower.includes('trabajador')) {
      mapping.nombre = header;
    } else if (lower.includes('cargo') || lower.includes('puesto')) {
      mapping.cargo = header;
    } else if (lower.includes('empresa')) {
      mapping.empresa = header;
    } else if (lower.includes('área') || lower.includes('area') || lower.includes('departamento')) {
      mapping.area = header;
    } else if (lower.includes('ci') || lower.includes('carnet') || lower.includes('identificador') || lower.includes('código') || lower.includes('codigo')) {
      mapping.identificador = header;
    }
  });

  // Priorizar columnas específicas si existen con estos nombres exactos
  const ciHeader = headers.find(h => h.trim().toLowerCase() === 'ci' || h.trim().toLowerCase() === 'c.i.');
  if (ciHeader) mapping.identificador = ciHeader;

  const nombreHeader = headers.find(h => h.trim().toLowerCase() === 'nombre');
  if (nombreHeader) mapping.nombre = nombreHeader;

  const cargoHeader = headers.find(h => {
    const lowerH = h.trim().toLowerCase();
    return lowerH.includes('ocup') && lowerH.includes('desem');
  });
  if (cargoHeader) mapping.cargo = cargoHeader;

  return mapping;
};

// ============================================================================
// MOTOR DE CÁLCULOS
// ============================================================================

const validateData = (data, mapping) => {
  // Valida que: HB + Antigüedad + Dominical + (Otros Bonos seleccionados) = Total Ganado
  // Devuelve contadores numéricos para que la UI pueda bloquear el avance cuando haya errores.
  const errors = [];

  if (!Array.isArray(data) || data.length === 0) {
    return { valid: 0, invalid: 0, total: 0, errors: [{ row: null, message: 'No hay datos para validar.' }] };
  }

  if (!mapping?.haberBasico || !mapping?.totalGanado) {
    return {
      valid: 0,
      invalid: data.length,
      total: data.length,
      errors: [{ row: null, message: 'Debe mapear Haber Básico y Total Ganado antes de validar.' }],
    };
  }

  const otrosBonosCols = Array.isArray(mapping.otrosBonos) ? mapping.otrosBonos : [];

  let validCount = 0;
  data.forEach((row, index) => {
    const rowNum = row?._rowIndex || index + 2;

    const hb = pickMappedNumber(row, mapping.haberBasico, mapping.haberBasicoAlt);
    const ba = pickMappedNumber(row, mapping.bonoAntiguedad, mapping.bonoAntiguedadAlt);
    const bd = pickMappedNumber(row, mapping.bonoDominical, mapping.bonoDominicalAlt);
    const otros = otrosBonosCols.reduce((sum, col) => sum + parseNumber(row?.[col]), 0);
    const tg = pickMappedNumber(row, mapping.totalGanado, mapping.totalGanadoAlt);

    const calculated = roundTwo(hb + ba + bd + otros);
    const diff = Math.abs(calculated - tg);

    // Tolerancia por redondeo
    if (diff > 0.02) {
      errors.push({
        row: rowNum,
        message: `${calculated.toFixed(2)} ≠ ${tg.toFixed(2)} (dif: ${diff.toFixed(2)})`,
      });
    } else {
      validCount += 1;
    }
  });

  const total = data.length;
  const invalid = total - validCount;

  return {
    valid: validCount,
    invalid,
    total,
    errors,
  };
};

const calculateEmployeeCost = (row, mapping, provisions, additionalCosts, index) => {
  const nombre = row[mapping.nombre] || `Empleado ${index + 1}`;
  const cargo = row[mapping.cargo] || 'Sin cargo';
  const area = row[mapping.area] || 'Sin área';
  const empresa = mapping.empresa ? (row[mapping.empresa] || 'Sin empresa') : 'Sin empresa';
  const identificador = row[mapping.identificador] || row._id || `ID_${index}`;
  const ciNormalizado = normalizeCI(identificador);
  const fechaIngreso = mapping.fechaIngreso ? (row[mapping.fechaIngreso] || null) : null;
  const fechaSalida = mapping.fechaSalida ? (row[mapping.fechaSalida] || null) : null;
  
  const haberBasico = pickMappedNumber(row, mapping.haberBasico, mapping.haberBasicoAlt);
  const bonoAntiguedad = pickMappedNumber(row, mapping.bonoAntiguedad, mapping.bonoAntiguedadAlt);
  const bonoDominical = pickMappedNumber(row, mapping.bonoDominical, mapping.bonoDominicalAlt);
  
  // Desglose de otros bonos
  const otrosBonosCols = Array.isArray(mapping?.otrosBonos) ? mapping.otrosBonos : [];
  const otrosBonosDetalle = {};
  let otrosBonosTotal = 0;
  otrosBonosCols.forEach(col => {
    const valor = parseNumber(row[col]);
    otrosBonosDetalle[col] = valor;
    otrosBonosTotal += valor;
  });
  
  const totalGanadoArchivo = pickMappedNumber(row, mapping.totalGanado, mapping.totalGanadoAlt);
  const totalGanado = roundTwo(haberBasico + bonoAntiguedad + bonoDominical + otrosBonosTotal);

  // Provisiones
  const provAguinaldo = provisions.aguinaldo ? roundTwo(totalGanado * CONSTANTS.PROVISION_RATE) : 0;
  const provSegundoAguinaldo = provisions.segundoAguinaldo ? roundTwo(totalGanado * CONSTANTS.PROVISION_RATE) : 0;
  const provPrimaUtilidades = provisions.primaUtilidades ? roundTwo(totalGanado * CONSTANTS.PROVISION_RATE) : 0;
  const provSegundaPrima = provisions.segundaPrima ? roundTwo(totalGanado * CONSTANTS.PROVISION_RATE) : 0;
  const provIndemnizacion = provisions.indemnizacion ? roundTwo(totalGanado * CONSTANTS.PROVISION_RATE) : 0;
  const totalProvisiones = roundTwo(provAguinaldo + provSegundoAguinaldo + provPrimaUtilidades + provSegundaPrima + provIndemnizacion);
  
  // Aportes
  const aporteGestora = roundTwo(totalGanado * CONSTANTS.APORTE_GESTORA);
  const aporteCajaSalud = roundTwo(totalGanado * CONSTANTS.APORTE_CAJA_SALUD);
  const totalAportes = roundTwo(aporteGestora + aporteCajaSalud);
  
  // Adicionales
  let costoUniforme = 0, costoCapacitacion = 0;
  const ac = (additionalCosts && typeof additionalCosts === 'object') ? additionalCosts : {};
  const uniformeCfg = ac.uniforme || { enabled: false, byGroup: false, groups: {}, defaultValue: 0 };
  const capacitacionCfg = ac.capacitacion || { enabled: false, byGroup: false, groups: {}, defaultValue: 0 };

  if (uniformeCfg.enabled) {
    costoUniforme = uniformeCfg.byGroup
      ? (uniformeCfg.groups[cargo] || uniformeCfg.groups[area] || uniformeCfg.defaultValue)
      : uniformeCfg.defaultValue;
  }
  if (capacitacionCfg.enabled) {
    costoCapacitacion = capacitacionCfg.byGroup
      ? (capacitacionCfg.groups[cargo] || capacitacionCfg.groups[area] || capacitacionCfg.defaultValue)
      : capacitacionCfg.defaultValue;
  }
  
  const costoMensualAdicional = roundTwo((costoUniforme + costoCapacitacion) / 12);
  const costoLaboralMensual = roundTwo(totalGanado + totalProvisiones + totalAportes + costoMensualAdicional);
  const costoLaboralAnual = roundTwo(costoLaboralMensual * 12);

  // Calcular antigüedad
  const antiguedad = calculateAntiguedad(fechaIngreso);
  
  return {
    _id: identificador,
    ciNormalizado,
    nombre, cargo, area, empresa, identificador,
    fechaIngreso,
    fechaSalida,
    antiguedad,
    componentes: {
      haberBasico,
      bonoAntiguedad,
      bonoDominical,
      otrosBonos: otrosBonosDetalle,
      otrosBonosTotal,
      totalGanado,
      totalGanadoArchivo,
    },
    provisiones: {
      aguinaldo: provAguinaldo,
      segundoAguinaldo: provSegundoAguinaldo,
      primaUtilidades: provPrimaUtilidades,
      segundaPrima: provSegundaPrima,
      indemnizacion: provIndemnizacion,
      total: totalProvisiones,
    },
    aportes: {
      gestora: aporteGestora,
      cajaSalud: aporteCajaSalud,
      total: totalAportes,
    },
    adicionales: {
      uniforme: costoUniforme,
      capacitacion: costoCapacitacion,
      mensual: costoMensualAdicional,
    },
    costoLaboralMensual,
    costoLaboralAnual,
  };
};

const calculateAll = (data, mapping, provisions, additionalCosts, selectedIds = null) => {
  let filteredData = data;
  if (selectedIds && selectedIds.length > 0) {
    const idField = mapping.identificador || '_id';
    filteredData = data.filter(row => selectedIds.includes(row[idField] || row._id));
  }
  
  const employees = filteredData.map((row, i) => calculateEmployeeCost(row, mapping, provisions, additionalCosts, i));
  
  // Calcular totales
  const totals = employees.reduce((acc, emp) => {
    acc.componentes.haberBasico += emp.componentes.haberBasico;
    acc.componentes.bonoAntiguedad += emp.componentes.bonoAntiguedad;
    acc.componentes.bonoDominical += emp.componentes.bonoDominical || 0;
    acc.componentes.otrosBonosTotal += emp.componentes.otrosBonosTotal;
    acc.componentes.totalGanado += emp.componentes.totalGanado;
    
    // Sumar detalle de otros bonos
    Object.keys(emp.componentes.otrosBonos).forEach(key => {
      acc.componentes.otrosBonos[key] = (acc.componentes.otrosBonos[key] || 0) + emp.componentes.otrosBonos[key];
    });
    
    acc.provisiones.aguinaldo += emp.provisiones.aguinaldo;
    acc.provisiones.segundoAguinaldo += emp.provisiones.segundoAguinaldo;
    acc.provisiones.primaUtilidades += emp.provisiones.primaUtilidades;
    acc.provisiones.segundaPrima += emp.provisiones.segundaPrima;
    acc.provisiones.indemnizacion += emp.provisiones.indemnizacion;
    acc.provisiones.total += emp.provisiones.total;
    
    acc.aportes.gestora += emp.aportes.gestora;
    acc.aportes.cajaSalud += emp.aportes.cajaSalud;
    acc.aportes.total += emp.aportes.total;
    
    acc.adicionales.uniforme += emp.adicionales.uniforme;
    acc.adicionales.capacitacion += emp.adicionales.capacitacion;
    acc.adicionales.mensual += emp.adicionales.mensual;
    
    acc.costoLaboralMensual += emp.costoLaboralMensual;
    acc.costoLaboralAnual += emp.costoLaboralAnual;
    
    return acc;
  }, {
    componentes: { haberBasico: 0, bonoAntiguedad: 0, bonoDominical: 0, otrosBonos: {}, otrosBonosTotal: 0, totalGanado: 0 },
    provisiones: { aguinaldo: 0, segundoAguinaldo: 0, primaUtilidades: 0, segundaPrima: 0, indemnizacion: 0, total: 0 },
    aportes: { gestora: 0, cajaSalud: 0, total: 0 },
    adicionales: { uniforme: 0, capacitacion: 0, mensual: 0 },
    costoLaboralMensual: 0,
    costoLaboralAnual: 0,
  });
  
  // Agrupar por área
  const byArea = {};
  employees.forEach(emp => {
    if (!byArea[emp.area]) {
      byArea[emp.area] = { count: 0, totalGanado: 0, costoMensual: 0, costoAnual: 0, empleados: [] };
    }
    byArea[emp.area].count++;
    byArea[emp.area].totalGanado += emp.componentes.totalGanado;
    byArea[emp.area].costoMensual += emp.costoLaboralMensual;
    byArea[emp.area].costoAnual += emp.costoLaboralAnual;
    byArea[emp.area].empleados.push(emp.nombre);
  });
  
  // Multiempresa: agregados por empresa
  const byEmpresa = {};
  employees.forEach(emp => {
    const empresaKey = emp.empresa || 'Sin empresa';
    if (!byEmpresa[empresaKey]) {
      byEmpresa[empresaKey] = { count: 0, totalGanado: 0, costoMensual: 0, costoAnual: 0 };
    }
    byEmpresa[empresaKey].count++;
    byEmpresa[empresaKey].totalGanado += emp.componentes.totalGanado;
    byEmpresa[empresaKey].costoMensual += emp.costoLaboralMensual;
    byEmpresa[empresaKey].costoAnual += emp.costoLaboralAnual;
  });
  
  // Ordenar áreas por costo anual (mayor a menor)
  const byAreaSorted = Object.entries(byArea)
    .sort((a, b) => b[1].costoAnual - a[1].costoAnual)
    .reduce((obj, [key, val]) => {
      obj[key] = {
        ...val,
        promedioPorEmpleado: roundTwo(val.costoAnual / (val.count || 1)),
        porcentaje: roundTwo((val.costoAnual / totals.costoLaboralAnual) * 100 || 0),
      };
      return obj;
    }, {});
  
  const byEmpresaSorted = Object.entries(byEmpresa)
    .sort((a, b) => b[1].costoAnual - a[1].costoAnual)
    .reduce((obj, [key, val]) => {
      obj[key] = {
        ...val,
        promedioPorEmpleado: roundTwo(val.costoAnual / (val.count || 1)),
        porcentaje: roundTwo((val.costoAnual / totals.costoLaboralAnual) * 100 || 0),
      };
      return obj;
    }, {});

  // Egresos: empleados con fecha de salida registrada
  const egresos = {
    total: employees.filter(emp => emp.fechaSalida).length,
  };

  return {
    employees,
    totals,
    byArea: byAreaSorted,
    byEmpresa: byEmpresaSorted,
    egresos,
    employeeCount: employees.length,
    costoPromedioPorEmpleado: employees.length ? roundTwo(totals.costoLaboralAnual / employees.length) : 0,
  };
};

// ============================================================================
// CÁLCULOS DE ANTIGÜEDAD
// ============================================================================

const calculateAntiguedad = (fechaIngreso, referenceDate = new Date()) => {
  if (!fechaIngreso) return { years: 0, months: 0, days: 0, totalMonths: 0 };
  
  const ingreso = new Date(fechaIngreso);
  if (isNaN(ingreso.getTime())) return { years: 0, months: 0, days: 0, totalMonths: 0 };
  
  const diff = referenceDate - ingreso;
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;
  const totalMonths = years * 12 + months;
  
  return { years, months, days, totalMonths, totalDays };
};

const getVacationDaysEntitled = (antiguedadYears) => {
  if (antiguedadYears < 1) return 0;
  if (antiguedadYears >= 1 && antiguedadYears < 5) return VACATION_DAYS.TIER_1.days;
  if (antiguedadYears >= 5 && antiguedadYears < 10) return VACATION_DAYS.TIER_2.days;
  return VACATION_DAYS.TIER_3.days;
};

// Calcula días de vacaciones prorrateados según fecha de ingreso
const calculateProratedVacationDays = (fechaIngreso, referenceDate = new Date()) => {
  const antiguedad = calculateAntiguedad(fechaIngreso, referenceDate);
  if (antiguedad.years < 1) {
    // Menos de 1 año: prorrateo de 15 días
    const monthsWorked = antiguedad.totalMonths;
    return roundTwo((15 / 12) * monthsWorked);
  }
  return getVacationDaysEntitled(antiguedad.years);
};

const analyzeAntiguedad = (employees) => {
  const ranges = {
    '0-1 año': { count: 0, employees: [] },
    '1-3 años': { count: 0, employees: [] },
    '3-5 años': { count: 0, employees: [] },
    '5-10 años': { count: 0, employees: [] },
    '10+ años': { count: 0, employees: [] },
  };
  
  let totalYears = 0;
  let employeesWithData = 0;
  
  employees.forEach(emp => {
    if (!emp.fechaIngreso) return;
    
    const antiguedad = calculateAntiguedad(emp.fechaIngreso);
    totalYears += antiguedad.years + (antiguedad.months / 12);
    employeesWithData++;
    
    const empInfo = { nombre: emp.nombre, cargo: emp.cargo, antiguedad };
    
    if (antiguedad.years < 1) {
      ranges['0-1 año'].count++;
      ranges['0-1 año'].employees.push(empInfo);
    } else if (antiguedad.years < 3) {
      ranges['1-3 años'].count++;
      ranges['1-3 años'].employees.push(empInfo);
    } else if (antiguedad.years < 5) {
      ranges['3-5 años'].count++;
      ranges['3-5 años'].employees.push(empInfo);
    } else if (antiguedad.years < 10) {
      ranges['5-10 años'].count++;
      ranges['5-10 años'].employees.push(empInfo);
    } else {
      ranges['10+ años'].count++;
      ranges['10+ años'].employees.push(empInfo);
    }
  });
  
  const promedioAnios = employeesWithData > 0 ? roundTwo(totalYears / employeesWithData) : 0;
  
  return {
    ranges,
    promedioAnios,
    employeesWithData,
    totalEmployees: employees.length,
  };
};

// ============================================================================
// FACTOR DE BRADFORD
// ============================================================================

const calculateBradfordFactor = (absenceRecords) => {
  // Bradford Factor = S² × D
  // S = número de episodios de ausencia separados
  // D = total de días de ausencia
  
  if (!absenceRecords || absenceRecords.length === 0) return { score: 0, episodes: 0, days: 0, classification: BRADFORD_THRESHOLDS.LOW };
  
  const episodes = absenceRecords.length;
  const totalDays = absenceRecords.reduce((sum, record) => sum + (record.dias || 0), 0);
  
  const score = Math.round(Math.pow(episodes, 2) * totalDays);
  
  let classification;
  if (score <= BRADFORD_THRESHOLDS.LOW.max) classification = BRADFORD_THRESHOLDS.LOW;
  else if (score <= BRADFORD_THRESHOLDS.MODERATE.max) classification = BRADFORD_THRESHOLDS.MODERATE;
  else if (score <= BRADFORD_THRESHOLDS.HIGH.max) classification = BRADFORD_THRESHOLDS.HIGH;
  else classification = BRADFORD_THRESHOLDS.CRITICAL;
  
  return { score, episodes, days: roundTwo(totalDays), classification };
};

const analyzeAbsences = (absenceData, employees) => {
  if (!absenceData || absenceData.length === 0) {
    return {
      hasData: false,
      bradfordByEmployee: [],
      vacationAnalysis: [],
      summary: {
        totalAbsenceDays: 0,
        totalVacationDays: 0,
        averageBradford: 0,
        criticalCount: 0,
        highCount: 0,
        moderateCount: 0,
        lowCount: 0,
      }
    };
  }
  
  // Agrupar ausencias por CI
  const absencesByCI = {};
  const vacationsByCI = {};
  
  absenceData.forEach(record => {
    const ci = record.ci;
    if (!ci) return;
    
    const isVacation = record.tipoSolicitud?.toLowerCase().includes('vacacion');
    
    if (isVacation) {
      if (!vacationsByCI[ci]) vacationsByCI[ci] = [];
      vacationsByCI[ci].push(record);
    } else {
      if (!absencesByCI[ci]) absencesByCI[ci] = [];
      absencesByCI[ci].push(record);
    }
  });
  
  // Calcular Bradford por empleado
  const bradfordByEmployee = [];
  const vacationAnalysis = [];
  
  employees.forEach(emp => {
    const ci = emp.ciNormalizado;
    const empAbsences = absencesByCI[ci] || [];
    const empVacations = vacationsByCI[ci] || [];
    
    // Bradford (solo ausencias NO vacaciones)
    const bradford = calculateBradfordFactor(empAbsences);
    bradfordByEmployee.push({
      ci,
      nombre: emp.nombre,
      cargo: emp.cargo,
      area: emp.area,
      ...bradford,
      absenceRecords: empAbsences,
    });
    
    // Análisis de vacaciones
    const antiguedad = calculateAntiguedad(emp.fechaIngreso);
    const diasAsignados = calculateProratedVacationDays(emp.fechaIngreso);
    const diasTomados = empVacations.reduce((sum, v) => sum + (v.dias || 0), 0);
    const porcentajeConsumo = diasAsignados > 0 ? roundTwo((diasTomados / diasAsignados) * 100) : 0;
    
    let consumoStatus;
    if (porcentajeConsumo >= 70) consumoStatus = { label: 'Saludable', color: 'emerald' };
    else if (porcentajeConsumo >= 50) consumoStatus = { label: 'Atención', color: 'amber' };
    else consumoStatus = { label: 'Crítico', color: 'red' };
    
    const presencialismo = diasTomados < (diasAsignados * 0.01);
    
    vacationAnalysis.push({
      ci,
      nombre: emp.nombre,
      cargo: emp.cargo,
      area: emp.area,
      antiguedadAnios: antiguedad.years,
      diasAsignados: roundTwo(diasAsignados),
      diasTomados: roundTwo(diasTomados),
      saldoPendiente: roundTwo(diasAsignados - diasTomados),
      porcentajeConsumo,
      consumoStatus,
      presencialismo,
      vacationRecords: empVacations,
    });
  });
  
  // Ordenar Bradford de mayor a menor (peor primero)
  bradfordByEmployee.sort((a, b) => b.score - a.score);
  
  // Summary
  const summary = {
    totalAbsenceDays: roundTwo(bradfordByEmployee.reduce((sum, b) => sum + b.days, 0)),
    totalVacationDays: roundTwo(vacationAnalysis.reduce((sum, v) => sum + v.diasTomados, 0)),
    averageBradford: bradfordByEmployee.length > 0 
      ? Math.round(bradfordByEmployee.reduce((sum, b) => sum + b.score, 0) / bradfordByEmployee.length)
      : 0,
    criticalCount: bradfordByEmployee.filter(b => b.classification.label === 'Crítico').length,
    highCount: bradfordByEmployee.filter(b => b.classification.label === 'Alto').length,
    moderateCount: bradfordByEmployee.filter(b => b.classification.label === 'Moderado').length,
    lowCount: bradfordByEmployee.filter(b => b.classification.label === 'Bajo').length,
    presencialismoCount: vacationAnalysis.filter(v => v.presencialismo).length,
    consumoSaludableCount: vacationAnalysis.filter(v => v.consumoStatus.label === 'Saludable').length,
    consumoAtencionCount: vacationAnalysis.filter(v => v.consumoStatus.label === 'Atención').length,
    consumoCriticoCount: vacationAnalysis.filter(v => v.consumoStatus.label === 'Crítico').length,
  };
  
  return {
    hasData: true,
    bradfordByEmployee,
    vacationAnalysis,
    summary,
  };
};

// ============================================================================
// ANÁLISIS PREDICTIVO
// ============================================================================

const analyzePeriods = (periodsData, absenceData = null) => {
  if (!periodsData || periodsData.length < 2) return null;
  
  // Ordenar por fecha
  const sorted = [...periodsData].sort((a, b) => {
    const dateA = new Date(a.year, a.month - 1);
    const dateB = new Date(b.year, b.month - 1);
    return dateA - dateB;
  });
  
  const firstPeriod = sorted[0];
  const lastPeriod = sorted[sorted.length - 1];
  
  // Crear mapa de empleados por identificador
  const employeeHistory = {};
  
  sorted.forEach((period, periodIndex) => {
    period.results.employees.forEach(emp => {
      const id = emp.ciNormalizado || emp._id || emp.identificador;
      if (!employeeHistory[id]) {
        employeeHistory[id] = {
          nombre: emp.nombre,
          cargo: emp.cargo,
          area: emp.area,
          fechaIngreso: emp.fechaIngreso,
          history: [],
          firstSeen: periodIndex,
          lastSeen: periodIndex,
        };
      }
      employeeHistory[id].history.push({
        period: `${period.month}/${period.year}`,
        periodIndex,
        totalGanado: emp.componentes.totalGanado,
        costoMensual: emp.costoLaboralMensual,
        cargo: emp.cargo,
        area: emp.area,
        fechaSalida: emp.fechaSalida || null,
      });
      employeeHistory[id].lastSeen = periodIndex;
      employeeHistory[id].nombre = emp.nombre;
      employeeHistory[id].cargo = emp.cargo;
      employeeHistory[id].area = emp.area;
    });
  });
  
  // Análisis de cambios
  const analysis = {
    periods: sorted.map(p => `${MONTHS[p.month - 1]} ${p.year}`),
    totalPeriods: sorted.length,
    headcountInicial: 0,
    headcountFinal: 0,
    
    // Movimientos de personal
    ingresos: [],
    salidas: [],
    promociones: [],
    
    // Análisis salarial
    incrementos: [],
    decrementos: [],
    sinCambios: [],
    
    // Tendencias
    tendenciaCostoTotal: [],
    tendenciaHeadcount: [],
    
    // Empleados con mayor incremento
    topIncrementos: [],
    
    // Variabilidad
    altaVariabilidad: [],
    bajaVariabilidad: [],
    
    // Tasa de Rotación
    rotacion: {
      tasaMensualPromedio: 0,
      tasaAnualizada: 0,
      totalSalidas: 0,
      headcountPromedio: 0,
    },
    
    // Antigüedad
    antiguedadAnalysis: null,
    
    // Análisis de ausencias (si hay datos)
    absenceAnalysis: null,
    
    // Proyecciones
    forecast: {},
  };
  
  // Calcular tendencias de costo total y headcount
  sorted.forEach(period => {
    analysis.tendenciaCostoTotal.push({
      periodo: `${MONTHS[period.month - 1]} ${period.year}`,
      valor: period.results.totals.costoLaboralMensual,
    });
    analysis.tendenciaHeadcount.push({
      periodo: `${MONTHS[period.month - 1]} ${period.year}`,
      valor: period.results.employeeCount,
    });
  });

  if (analysis.tendenciaHeadcount.length > 0) {
    analysis.headcountInicial = analysis.tendenciaHeadcount[0].valor;
    analysis.headcountFinal = analysis.tendenciaHeadcount[analysis.tendenciaHeadcount.length - 1].valor;
  }
  
  // Analizar cada empleado
  Object.entries(employeeHistory).forEach(([id, emp]) => {
    const historyLength = emp.history.length;
    const esIngreso = emp.firstSeen > 0;

    // Detectar ingresos (no estaba en el primer período)
    if (esIngreso) {
      analysis.ingresos.push({
        id,
        nombre: emp.nombre,
        cargo: emp.cargo,
        area: emp.area,
        periodo: emp.history[0].period,
      });
    }

    // Detectar salidas
    const historyWithExit = emp.history.filter(h => h.fechaSalida);
    if (historyWithExit.length > 0) {
      const lastExit = historyWithExit[historyWithExit.length - 1];
      analysis.salidas.push({
        id,
        nombre: emp.nombre,
        cargo: emp.cargo,
        area: emp.area,
        periodoSalida: lastExit.period,
        fechaSalida: lastExit.fechaSalida,
      });
    } else if (emp.lastSeen < sorted.length - 1) {
      const lastRecord = emp.history[emp.history.length - 1];
      analysis.salidas.push({
        id,
        nombre: emp.nombre,
        cargo: emp.cargo,
        area: emp.area,
        periodoSalida: lastRecord.period,
        fechaSalida: null,
      });
    }

    // Detectar cambios de cargo (promociones)
    const cargos = [...new Set(emp.history.map(h => h.cargo))];
    if (cargos.length > 1) {
      analysis.promociones.push({
        id,
        nombre: emp.nombre,
        cargoAnterior: emp.history[0].cargo,
        cargoActual: emp.history[emp.history.length - 1].cargo,
        area: emp.area,
      });
    }

    // Calcular variación salarial
    if (!esIngreso && historyLength >= 2) {
      const primerSalario = emp.history[0].totalGanado;
      const ultimoSalario = emp.history[emp.history.length - 1].totalGanado;
      const variacion = ultimoSalario - primerSalario;
      const variacionPct = primerSalario > 0 ? ((variacion / primerSalario) * 100) : 0;

      const empData = {
        id,
        nombre: emp.nombre,
        cargo: emp.cargo,
        area: emp.area,
        salarioInicial: primerSalario,
        salarioFinal: ultimoSalario,
        variacion: roundTwo(variacion),
        variacionPct: roundTwo(variacionPct),
      };

      if (variacion > 0) {
        analysis.incrementos.push(empData);
      } else if (variacion < 0) {
        analysis.decrementos.push(empData);
      } else {
        analysis.sinCambios.push(empData);
      }

      // Calcular variabilidad
      const salarios = emp.history.map(h => h.totalGanado);
      const promedio = salarios.reduce((a, b) => a + b, 0) / salarios.length;
      const varianza = salarios.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / salarios.length;
      const desviacion = Math.sqrt(varianza);
      const coefVariacion = promedio > 0 ? (desviacion / promedio) * 100 : 0;

      if (coefVariacion > 10) {
        analysis.altaVariabilidad.push({ ...empData, coefVariacion: roundTwo(coefVariacion) });
      } else if (coefVariacion < 2 && variacion === 0) {
        analysis.bajaVariabilidad.push({ ...empData, coefVariacion: roundTwo(coefVariacion) });
      }
    }
  });

  // Top 10 incrementos
  analysis.topIncrementos = analysis.incrementos
    .sort((a, b) => b.variacionPct - a.variacionPct)
    .slice(0, 10);
  
  // Calcular Tasa de Rotación
  const headcountPromedio = analysis.tendenciaHeadcount.reduce((sum, h) => sum + h.valor, 0) / analysis.tendenciaHeadcount.length;
  const totalSalidas = analysis.salidas.length;
  const mesesAnalizados = sorted.length;
  
  const tasaMensualPromedio = headcountPromedio > 0 ? (totalSalidas / mesesAnalizados) / headcountPromedio * 100 : 0;
  const tasaAnualizada = tasaMensualPromedio * 12;
  
  analysis.rotacion = {
    tasaMensualPromedio: roundTwo(tasaMensualPromedio),
    tasaAnualizada: roundTwo(tasaAnualizada),
    totalSalidas,
    headcountPromedio: roundTwo(headcountPromedio),
    mesesAnalizados,
  };
  
  // Análisis de antigüedad (del último período)
  if (lastPeriod?.results?.employees) {
    analysis.antiguedadAnalysis = analyzeAntiguedad(lastPeriod.results.employees);
  }
  
  // Análisis de ausencias si hay datos
  if (absenceData && absenceData.length > 0 && lastPeriod?.results?.employees) {
    analysis.absenceAnalysis = analyzeAbsences(absenceData, lastPeriod.results.employees);
  }
  
  // Forecast simple (regresión lineal)
  if (analysis.tendenciaCostoTotal.length >= 3) {
    const valores = analysis.tendenciaCostoTotal.map(t => t.valor);
    const n = valores.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = valores.reduce((a, b) => a + b, 0);
    const sumXY = valores.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Proyectar 3, 6 y 12 meses
    analysis.forecast = {
      mes3: roundTwo(intercept + slope * (n + 2)),
      mes6: roundTwo(intercept + slope * (n + 5)),
      mes12: roundTwo(intercept + slope * (n + 11)),
      tendencia: slope > 0 ? 'creciente' : slope < 0 ? 'decreciente' : 'estable',
      pendiente: roundTwo(slope),
    };
  }
  
  return analysis;
};

// ============================================================================
// ANÁLISIS DE PRECIERRE (COMPARATIVO)
// ============================================================================

const analyzePrecierre = (periodsData, columnMapping) => {
  if (!periodsData || periodsData.length < 2) return null;
  
  // Ordenar por fecha
  const sorted = [...periodsData].sort((a, b) => {
    const dateA = new Date(a.year, a.month - 1);
    const dateB = new Date(b.year, b.month - 1);
    return dateA - dateB;
  });
  
  const periods = sorted.map(p => ({ month: p.month, year: p.year, label: `${MONTHS[p.month - 1]} ${p.year}` }));
  
  // Crear mapa de empleados por CI normalizado
  const employeeHistory = {};
  
  sorted.forEach((period, periodIndex) => {
    period.results.employees.forEach(emp => {
      const id = emp.ciNormalizado || emp._id || emp.identificador || emp.nombre;
      if (!id) return;
      
      if (!employeeHistory[id]) {
        employeeHistory[id] = {
          id,
          nombre: emp.nombre,
          cargo: emp.cargo,
          area: emp.area,
          empresa: emp.empresa,
          history: [],
          firstSeen: periodIndex,
          lastSeen: periodIndex,
        };
      }
      
      employeeHistory[id].history.push({
        periodIndex,
        periodLabel: periods[periodIndex].label,
        totalGanado: emp.componentes?.totalGanado || 0,
        haberBasico: emp.componentes?.haberBasico || 0,
        bonoAntiguedad: emp.componentes?.bonoAntiguedad || 0,
        cargo: emp.cargo,
        area: emp.area,
        empresa: emp.empresa,
        costoMensual: emp.costoLaboralMensual,
      });
      
      employeeHistory[id].lastSeen = periodIndex;
      // Actualizar datos al último período visto
      employeeHistory[id].nombre = emp.nombre;
      employeeHistory[id].cargo = emp.cargo;
      employeeHistory[id].area = emp.area;
    });
  });
  
  // Calcular headcount y total ganado por período
  const headcountByPeriod = sorted.map(p => p.results.employeeCount);
  const totalGanadoByPeriod = sorted.map(p => p.results.totals.totalGanado);
  
  // Detectar movimientos
  const altas = [];
  const bajas = [];
  const cambiosCargo = [];
  const cambiosArea = [];
  const variacionesSalariales = [];
  const variacionPersonal = [];
  
  const totalPeriods = sorted.length;
  
  Object.entries(employeeHistory).forEach(([id, emp]) => {
    const history = emp.history;
    const firstRecord = history[0];
    const lastRecord = history[history.length - 1];
    
    // Detectar ALTAS (no estaban en el primer período)
    if (emp.firstSeen > 0) {
      altas.push({
        id,
        nombre: emp.nombre,
        cargo: emp.cargo,
        area: emp.area,
        periodo: firstRecord.periodLabel,
        totalGanado: firstRecord.totalGanado,
      });
    }
    
    // Detectar BAJAS (no están en el último período)
    if (emp.lastSeen < totalPeriods - 1) {
      bajas.push({
        id,
        nombre: emp.nombre,
        cargo: lastRecord.cargo,
        area: lastRecord.area,
        periodo: lastRecord.periodLabel,
        totalGanado: lastRecord.totalGanado,
      });
    }
    
    // Detectar CAMBIOS DE CARGO
    const cargosUnicos = [...new Set(history.map(h => h.cargo).filter(Boolean))];
    if (cargosUnicos.length > 1) {
      cambiosCargo.push({
        id,
        nombre: emp.nombre,
        cargoAnterior: firstRecord.cargo,
        cargoNuevo: lastRecord.cargo,
        area: lastRecord.area,
        periodo: lastRecord.periodLabel,
      });
    }
    
    // Detectar CAMBIOS DE ÁREA
    const areasUnicas = [...new Set(history.map(h => h.area).filter(Boolean))];
    if (areasUnicas.length > 1) {
      cambiosArea.push({
        id,
        nombre: emp.nombre,
        areaAnterior: firstRecord.area,
        areaNueva: lastRecord.area,
        cargo: lastRecord.cargo,
        periodo: lastRecord.periodLabel,
      });
    }
    
    // Calcular variación salarial (solo si está en primer y último período)
    if (emp.firstSeen === 0 && emp.lastSeen === totalPeriods - 1) {
      const variacion = lastRecord.totalGanado - firstRecord.totalGanado;
      const variacionPct = firstRecord.totalGanado > 0 
        ? ((variacion / firstRecord.totalGanado) * 100) 
        : 0;
      
      if (Math.abs(variacion) > 0.01) {
        variacionesSalariales.push({
          id,
          nombre: emp.nombre,
          cargo: lastRecord.cargo,
          area: lastRecord.area,
          valorInicial: firstRecord.totalGanado,
          valorFinal: lastRecord.totalGanado,
          variacion,
          variacionPct: roundTwo(variacionPct),
        });
      }
    }
    
    // Crear registro de variación por persona (para la tabla detallada)
    const firstValue = firstRecord.totalGanado;
    const lastValue = lastRecord.totalGanado;
    const varValue = lastValue - firstValue;
    const varPct = firstValue > 0 ? ((varValue / firstValue) * 100) : 0;
    
    variacionPersonal.push({
      id,
      nombre: emp.nombre,
      cargo: lastRecord.cargo,
      area: lastRecord.area,
      // Valores para Total Ganado
      valorInicial: firstValue,
      valorFinal: lastValue,
      variacion: roundTwo(varValue),
      variacionPct: roundTwo(varPct),
      // Valores para Haber Básico
      haberBasicoInicial: firstRecord.haberBasico,
      haberBasicoFinal: lastRecord.haberBasico,
      haberBasicoVariacion: roundTwo(lastRecord.haberBasico - firstRecord.haberBasico),
      // Valores para Bono Antigüedad
      bonoAntiguedadInicial: firstRecord.bonoAntiguedad,
      bonoAntiguedadFinal: lastRecord.bonoAntiguedad,
      bonoAntiguedadVariacion: roundTwo(lastRecord.bonoAntiguedad - firstRecord.bonoAntiguedad),
      // Valores para Cargo
      cargoInicial: firstRecord.cargo,
      cargoFinal: lastRecord.cargo,
      // Valores para Área
      areaInicial: firstRecord.area,
      areaFinal: lastRecord.area,
      // Metadata
      firstSeen: emp.firstSeen,
      lastSeen: emp.lastSeen,
      esAlta: emp.firstSeen > 0,
      esBaja: emp.lastSeen < totalPeriods - 1,
    });
  });
  
  // Ordenar variaciones salariales por valor absoluto de variación
  variacionesSalariales.sort((a, b) => Math.abs(b.variacion) - Math.abs(a.variacion));
  
  return {
    periods,
    headcountByPeriod,
    totalGanadoByPeriod,
    altas,
    bajas,
    cambiosCargo,
    cambiosArea,
    variacionesSalariales,
    variacionPersonal,
    resumen: {
      totalEmpleadosAnalizados: Object.keys(employeeHistory).length,
      altas: altas.length,
      bajas: bajas.length,
      cambiosCargo: cambiosCargo.length,
      cambiosArea: cambiosArea.length,
      conVariacionSalarial: variacionesSalariales.length,
      variacionHeadcount: headcountByPeriod[headcountByPeriod.length - 1] - headcountByPeriod[0],
      variacionTotalGanado: totalGanadoByPeriod[totalGanadoByPeriod.length - 1] - totalGanadoByPeriod[0],
    }
  };
};

// ============================================================================
// CONSOLIDAR HEADERS DE MÚLTIPLES ARCHIVOS
// ============================================================================

const consolidateHeaders = (multiFilesData) => {
  if (!multiFilesData || multiFilesData.length === 0) return [];
  
  // Usar un Set para obtener headers únicos
  const headersSet = new Set();
  
  multiFilesData.forEach(file => {
    if (file.headers && Array.isArray(file.headers)) {
      file.headers.forEach(h => headersSet.add(h));
    }
  });
  
  return Array.from(headersSet);
};

// ============================================================================
// EXPORTACIONES
// ============================================================================

export {
  CONSTANTS, MONTHS, COLORS, CHART_COLORS,
  VACATION_DAYS, BRADFORD_THRESHOLDS,
  formatCurrency, formatPercent, formatNumber, formatDate, roundTwo, parseNumber, normalizeCI,
  parseCSV, parseExcel, parseAbsenceFile, autoDetectColumns,
  validateData, calculateEmployeeCost, calculateAll,
  calculateAntiguedad, getVacationDaysEntitled, calculateProratedVacationDays, analyzeAntiguedad,
  calculateBradfordFactor, analyzeAbsences,
  analyzePeriods, analyzePrecierre, consolidateHeaders
};