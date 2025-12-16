/**
 * CALCULADORA DE COSTO LABORAL ANUAL - BOLIVIA
 * Versión Final 2025 - Senior Edition
 * * Lógica de Negocio:
 * - Ley General del Trabajo & D.S. 21060 (Escala Antigüedad)
 * - Ley de Pensiones 065 (Aportes Solidarios Actualizados Ley 1582)
 * - Proyecciones Financieras Lineales
 * - Algoritmos de Normalización de Datos
 */

import * as XLSX from 'xlsx';

// ============================================================================
// 1. CONSTANTES DE LEGISLACIÓN BOLIVIANA (GESTIÓN 2025)
// ============================================================================

export const CONSTANTS = {
  // Salario Mínimo Nacional (Configurable)
  SMN: 2750, 
  
  // Aportes Laborales (Deducciones al empleado)
  AFP_VEJEZ: 0.10,            // 10% Cuenta Personal
  AFP_RIESGO_COMUN: 0.0171,   // 1.71% Riesgo Común
  AFP_COMISION: 0.005,        // 0.5% Comisión Gestora
  AFP_SOLIDARIO_LABORAL: 0.005, // 0.5% Solidario Fijo
  
  // Aportes Patronales (Costo Empresa)
  CNS: 0.10,                  // 10% Caja Nacional
  AFP_PRO_VIVIENDA: 0.02,     // 2% Provivienda
  AFP_RIESGO_PROFESIONAL: 0.0171, // 1.71% Riesgo Profesional
  AFP_SOLIDARIO_PATRONAL: 0.03,   // 3% Aporte Patronal Solidario
  
  // Provisiones Sociales (Pasivos)
  AGUINALDO: 0.08333,         // 8.33% (1 sueldo / 12)
  INDEMNIZACION: 0.08333,     // 8.33% (1 sueldo / 12)
  PRIMA: 0.08333,             // 8.33% (Si aplica)

  // Escala Bono Antigüedad (D.S. 21060 Art 60)
  // Se aplica sobre 3 Salarios Mínimos Nacionales
  ESCALA_ANTIGUEDAD: [
    { min: 0, max: 1, pct: 0.00 },
    { min: 2, max: 4, pct: 0.05 },
    { min: 5, max: 7, pct: 0.11 },
    { min: 8, max: 10, pct: 0.18 },
    { min: 11, max: 14, pct: 0.26 },
    { min: 15, max: 19, pct: 0.34 },
    { min: 20, max: 24, pct: 0.42 },
    { min: 25, max: 99, pct: 0.50 },
  ],

  // Parámetros de Análisis
  DIAS_LABORALES_MES: 30,
};

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const COLORS = {
  primary: '#2563EB',   // Blue 600
  secondary: '#4F46E5', // Indigo 600
  success: '#10B981',   // Emerald 500
  warning: '#F59E0B',   // Amber 500
  danger: '#EF4444',    // Red 500
  text: '#1F2937',      // Gray 800
  chart: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1']
};

export const BRADFORD_THRESHOLDS = {
  low: 200,      // Atención
  moderate: 450, // Preocupante
  high: 900      // Crítico
};

// ============================================================================
// 2. UTILIDADES DE FORMATO Y HELPERS
// ============================================================================

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
};

export const formatPercent = (value, decimals = 2) => {
  return `${(value || 0).toFixed(decimals)}%`;
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('es-BO').format(value || 0);
};

export const roundTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  // Manejo de fechas de Excel (números seriales)
  if (typeof dateInput === 'number') {
    const date = new Date((dateInput - (25567 + 2)) * 86400 * 1000);
    return date.toLocaleDateString('es-BO');
  }
  // Manejo de strings
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? dateInput : date.toLocaleDateString('es-BO');
};

export const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Limpia "Bs.", espacios, y maneja coma decimal si viene como texto europeo
  const clean = val.toString().replace(/[Bs.A-Za-z\s]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Normalizar texto para comparaciones insensibles a mayúsculas/tildes
const normalizeText = (text) => {
  return text ? text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
};

// ============================================================================
// 3. PARSEO Y DETECCIÓN DE COLUMNAS (INTELIGENCIA DE DATOS)
// ============================================================================

export const autoDetectColumns = (headers) => {
  const mapping = {};
  const lowerHeaders = headers.map(h => ({ original: h, lower: normalizeText(h) }));

  // Diccionario de sinónimos comunes en RRHH Bolivia
  const dictionary = {
    nombre: ['nombre', 'empleado', 'nombres', 'apellidos', 'funcionario', 'trabajador'],
    haberBasico: ['haber basico', 'sueldo basico', 'basico', 'salario mensual', 'haber mensual'],
    bonoAntiguedad: ['bono antiguedad', 'antiguedad', 'cat'],
    totalGanado: ['total ganado', 'total', 'bruto', 'total haberes'],
    cargo: ['cargo', 'puesto', 'posicion', 'funcion'],
    area: ['area', 'departamento', 'seccion', 'gerencia', 'unidad', 'centro de costo'],
    fechaIngreso: ['fecha ingreso', 'ingreso', 'fecha de inicio', 'f.ingreso'],
    diasPagados: ['dias', 'dias pagados', 'dias trabajados', 'dias trab'],
    ci: ['ci', 'cedula', 'documento', 'carnet', 'identidad']
  };

  Object.entries(dictionary).forEach(([key, keywords]) => {
    // Busca la primera coincidencia
    const match = lowerHeaders.find(h => keywords.some(k => h.lower.includes(k)));
    if (match) mapping[key] = match.original;
  });

  return mapping;
};

export const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true }); // cellDates para fechas correctas
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        // raw: false intenta formatear, pero true es más seguro para números
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        resolve({ headers, data: jsonData });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const parseCSV = (text) => {
  const rows = text.split('\n').filter(r => r.trim());
  if (rows.length < 2) return { headers: [], data: [] };
  
  const headers = rows[0].split(',').map(h => h.trim());
  const data = rows.slice(1).map(row => {
    const values = row.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]?.trim());
    return obj;
  });
  return { headers, data };
};

export const parseAbsenceFile = (file) => {
  return parseExcel(file).then(result => {
    // Normalización específica para ausencias
    const cleanData = result.data.map(row => {
      // Buscar keys dinámicamente
      const keys = Object.keys(row);
      const findKey = (search) => keys.find(k => normalizeText(k).includes(search));
      
      const tipoRaw = row[findKey('tipo') || findKey('motivo') || findKey('causa')] || 'Ausencia';
      const dias = parseNumber(row[findKey('dias') || findKey('cantidad')]);
      
      return {
        nombre: row[findKey('nombre')] || 'Desconocido',
        cargo: row[findKey('cargo')] || '',
        tipoSolicitud: tipoRaw,
        dias: dias,
        // Clasificación simple para lógica de negocio
        isVacacion: normalizeText(tipoRaw).includes('vacaci'),
        isBajaMedica: normalizeText(tipoRaw).includes('baja') || normalizeText(tipoRaw).includes('enfermedad') || normalizeText(tipoRaw).includes('salud')
      };
    });
    return cleanData.filter(d => d.dias > 0); // Filtrar filas vacías
  });
};

// ============================================================================
// 4. LÓGICA DE CÁLCULO FINANCIERO Y LABORAL
// ============================================================================

// Aporte Nacional Solidario (ANS) - Actualizado Ley 1582 (2024/2025)
const calculateANS = (totalGanado) => {
  let aporte = 0;
  // Rango 1: > 13,000 (1.15%)
  if (totalGanado > 13000) aporte += (totalGanado - 13000) * 0.0115;
  // Rango 2: > 25,000 (5.74%)
  if (totalGanado > 25000) aporte += (totalGanado - 25000) * 0.0574;
  // Rango 3: > 35,000 (11.48%)
  if (totalGanado > 35000) aporte += (totalGanado - 35000) * 0.1148;
  
  return aporte;
};

// Bono de Antigüedad sobre 3 SMN
const calculateBonoAntiguedadReal = (fechaIngreso) => {
  if (!fechaIngreso) return 0;
  
  // Convertir fecha de Excel o String a Objeto Date
  let date;
  if (typeof fechaIngreso === 'number') {
     date = new Date((fechaIngreso - (25567 + 2)) * 86400 * 1000);
  } else {
     date = new Date(fechaIngreso);
  }
  
  if (isNaN(date.getTime())) return 0;

  const hoy = new Date(); // O fecha de fin de mes de proceso si se tuviera
  const diffTime = Math.abs(hoy - date);
  const years = diffTime / (1000 * 60 * 60 * 24 * 365.25); 

  const escala = CONSTANTS.ESCALA_ANTIGUEDAD.find(e => years >= e.min && years < (e.max === 99 ? 100 : e.max + 1)); // Ajuste de rango
  
  if (!escala || escala.pct === 0) return 0;
  
  // Base de cálculo: 3 SMN
  return (CONSTANTS.SMN * 3) * escala.pct;
};

export const calculateAll = (data, mapping, provisions, additionalCosts) => {
  const totals = {
    totalGanado: 0,
    aportesPatronales: 0,
    provisiones: 0,
    costoLaboralMensual: 0,
    costoLaboralAnual: 0,
    count: 0
  };

  const employees = data.map((row, index) => {
    // 1. Obtener Haber Básico
    const haberBasico = parseNumber(row[mapping.haberBasico]);
    
    // 2. Calcular Bono Antigüedad
    // Si viene en el Excel, lo usamos. Si no y hay fecha, lo calculamos.
    let bonoAntiguedad = 0;
    if (mapping.bonoAntiguedad && row[mapping.bonoAntiguedad]) {
      bonoAntiguedad = parseNumber(row[mapping.bonoAntiguedad]);
    } else if (mapping.fechaIngreso && row[mapping.fechaIngreso]) {
      bonoAntiguedad = calculateBonoAntiguedadReal(row[mapping.fechaIngreso]);
    }

    // 3. Otros Bonos (Sumatoria dinámica)
    let otrosBonos = 0;
    if (mapping.otrosBonos && Array.isArray(mapping.otrosBonos)) {
      mapping.otrosBonos.forEach(col => {
        otrosBonos += parseNumber(row[col]);
      });
    }

    // 4. Determinar Total Ganado
    // Si el usuario mapeó "Total Ganado", confiamos en eso. Si no, sumamos.
    let totalGanado = 0;
    if (mapping.totalGanado && row[mapping.totalGanado]) {
      totalGanado = parseNumber(row[mapping.totalGanado]);
    } else {
      totalGanado = haberBasico + bonoAntiguedad + otrosBonos;
    }

    // Validación de integridad: Total Ganado no puede ser menor a la suma de partes
    if (totalGanado < (haberBasico + bonoAntiguedad + otrosBonos)) {
       totalGanado = haberBasico + bonoAntiguedad + otrosBonos;
    }

    // 5. Cálculos Patronales (Costo Empresa)
    const aporteCNS = totalGanado * CONSTANTS.CNS;
    const aporteAFP_Vivienda = totalGanado * CONSTANTS.AFP_PRO_VIVIENDA;
    const aporteAFP_Riesgo = totalGanado * CONSTANTS.AFP_RIESGO_PROFESIONAL;
    // El solidario patronal puede ser 3% o 3.5% (Minería). Usamos constante configurable.
    const aporteAFP_Solidario = totalGanado * CONSTANTS.AFP_SOLIDARIO_PATRONAL;
    
    const totalPatronal = aporteCNS + aporteAFP_Vivienda + aporteAFP_Riesgo + aporteAFP_Solidario;

    // 6. Provisiones Sociales (Pasivos Diferidos)
    let totalProvisiones = 0;
    const provAguinaldo = provisions.aguinaldo ? totalGanado * CONSTANTS.AGUINALDO : 0;
    const provIndemnizacion = provisions.indemnizacion ? totalGanado * CONSTANTS.INDEMNIZACION : 0;
    const provPrima = provisions.primaUtilidades ? totalGanado * CONSTANTS.PRIMA : 0;
    
    // Segundo Aguinaldo (Opcional según crecimiento PIB)
    const prov2doAguinaldo = provisions.segundoAguinaldo ? totalGanado * CONSTANTS.AGUINALDO : 0;

    totalProvisiones = provAguinaldo + provIndemnizacion + provPrima + prov2doAguinaldo;

    // 7. Costo Total
    const costoMensual = totalGanado + totalPatronal + totalProvisiones;
    const costoAnual = costoMensual * 12;

    // Acumuladores
    totals.totalGanado += totalGanado;
    totals.aportesPatronales += totalPatronal;
    totals.provisiones += totalProvisiones;
    totals.costoLaboralMensual += costoMensual;
    totals.costoLaboralAnual += costoAnual;
    totals.count++;

    return {
      id: index, // Identificador temporal si no hay CI
      nombre: row[mapping.nombre] || 'Sin Nombre',
      cargo: row[mapping.cargo] || 'Sin Cargo',
      area: row[mapping.area] || 'General',
      ci: row[mapping.ci] || '',
      componentes: {
        haberBasico,
        bonoAntiguedad,
        otrosBonos,
        totalGanado
      },
      aportesPatronales: {
        cns: aporteCNS,
        afp: aporteAFP_Vivienda + aporteAFP_Riesgo + aporteAFP_Solidario,
        total: totalPatronal
      },
      provisiones: {
        aguinaldo: provAguinaldo,
        indemnizacion: provIndemnizacion,
        prima: provPrima,
        total: totalProvisiones
      },
      costoLaboralMensual: costoMensual,
      costoLaboralAnual: costoAnual
    };
  });

  // Agrupación por Área (Pivot)
  const byArea = employees.reduce((acc, curr) => {
    const areaName = curr.area.trim() || 'Sin Área';
    if (!acc[areaName]) {
      acc[areaName] = { 
        area: areaName, 
        count: 0, 
        costoAnual: 0, 
        costoMensual: 0 
      };
    }
    acc[areaName].count++;
    acc[areaName].costoAnual += curr.costoLaboralAnual;
    acc[areaName].costoMensual += curr.costoLaboralMensual;
    return acc;
  }, {});

  // Convertir objeto de áreas a array y calcular porcentajes
  const byAreaArray = Object.values(byArea).map(a => ({
    ...a,
    porcentaje: totals.costoLaboralAnual > 0 ? roundTwo((a.costoAnual / totals.costoLaboralAnual) * 100) : 0
  })).sort((a, b) => b.costoAnual - a.costoAnual);

  return {
    employees,
    totals,
    byArea: byAreaArray,
    employeeCount: employees.length,
    averageCost: employees.length > 0 ? totals.costoLaboralMensual / employees.length : 0
  };
};

export const validateData = (data, mapping) => {
  if (!data || data.length === 0) return { valid: 0, invalid: 0, total: 0, errors: [] };
  
  let valid = 0;
  let invalid = 0;
  const errors = [];

  data.forEach((row, index) => {
    const missing = [];
    if (!row[mapping.nombre]) missing.push('Nombre');
    // Es flexible: si no hay haber básico pero hay total ganado, pasa.
    if (!row[mapping.haberBasico] && !row[mapping.totalGanado]) missing.push('Haber Básico o Total Ganado');

    if (missing.length > 0) {
      invalid++;
      errors.push({ 
        row: index + 2, // Excel empieza en 1 + header
        message: `Fila ${index + 2}: Falta ${missing.join(' y ')}` 
      });
    } else {
      valid++;
    }
  });

  return { valid, invalid, total: data.length, errors };
};

// ============================================================================
// 5. ANÁLISIS PREDICTIVO Y DE PRECIERRE (INTELIGENCIA DE NEGOCIO)
// ============================================================================

export const consolidateHeaders = (filesData) => {
  if (!filesData || filesData.length === 0) return [];
  // Usa el primer archivo como referencia, asumiendo estructura similar
  return filesData[0].headers || [];
};

export const analyzePrecierre = (periodsData) => {
  // Ordenar cronológicamente (Año/Mes)
  const sortedPeriods = [...periodsData].sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
  
  if (sortedPeriods.length < 2) return null;

  const current = sortedPeriods[sortedPeriods.length - 1]; // Mes actual (Cierre)
  const prev = sortedPeriods[sortedPeriods.length - 2];    // Mes anterior (Base)

  const currEmps = current.results.employees;
  const prevEmps = prev.results.employees;

  // Mapa Hash para búsquedas O(1)
  // Usamos CI si existe, sino Nombre normalizado como clave
  const getKey = (e) => e.ci ? e.ci : normalizeText(e.nombre);
  
  const prevMap = new Map();
  prevEmps.forEach(e => prevMap.set(getKey(e), e));

  const altas = [];
  const bajas = [];
  const cambiosCargo = [];
  const cambiosArea = [];
  const variacionesSalariales = [];

  // 1. Detectar Altas y Cambios en existentes
  currEmps.forEach(curr => {
    const key = getKey(curr);
    const previous = prevMap.get(key);

    if (!previous) {
      // Es Alta
      altas.push(curr);
    } else {
      // Verificar cambios
      // A. Cambio Salarial (> 5 Bs de diferencia por redondeos)
      const diffSalario = curr.componentes.totalGanado - previous.componentes.totalGanado;
      if (Math.abs(diffSalario) > 5) {
        variacionesSalariales.push({
          nombre: curr.nombre,
          cargo: curr.cargo,
          anterior: previous.componentes.totalGanado,
          nuevo: curr.componentes.totalGanado,
          diff: diffSalario,
          pct: roundTwo((diffSalario / previous.componentes.totalGanado) * 100)
        });
      }

      // B. Cambio de Cargo
      if (normalizeText(curr.cargo) !== normalizeText(previous.cargo)) {
        cambiosCargo.push({
          nombre: curr.nombre,
          anterior: previous.cargo,
          nuevo: curr.cargo
        });
      }

      // C. Cambio de Área
      if (normalizeText(curr.area) !== normalizeText(previous.area)) {
        cambiosArea.push({
          nombre: curr.nombre,
          anterior: previous.area,
          nuevo: curr.area
        });
      }
      
      // Marcar como procesado en el mapa (para luego ver bajas)
      prevMap.set(key, { ...previous, procesado: true });
    }
  });

  // 2. Detectar Bajas (Estaban en Prev, no marcados como procesados)
  prevMap.forEach((value) => {
    if (!value.procesado) {
      bajas.push(value);
    }
  });

  return {
    periodoActual: `${MONTHS[current.month-1]} ${current.year}`,
    periodoAnterior: `${MONTHS[prev.month-1]} ${prev.year}`,
    resumen: {
      totalEmpleados: currEmps.length,
      variacionNeta: currEmps.length - prevEmps.length,
      altasCount: altas.length,
      bajasCount: bajas.length,
      variacionCosto: current.results.totals.costoLaboralMensual - prev.results.totals.costoLaboralMensual
    },
    detalles: {
      altas,
      bajas,
      cambiosCargo,
      cambiosArea,
      variacionesSalariales: variacionesSalariales.sort((a,b) => Math.abs(b.diff) - Math.abs(a.diff))
    }
  };
};

export const analyzePeriods = (periodsData, absenceData) => {
  const sortedPeriods = [...periodsData].sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
  
  // 1. Series de Tiempo
  const seriesCosto = sortedPeriods.map(p => p.results.totals.costoLaboralMensual);
  const seriesHC = sortedPeriods.map(p => p.results.employeeCount);
  const labels = sortedPeriods.map(p => `${MONTHS[p.month-1].substring(0,3)} ${p.year}`);

  // 2. Regresión Lineal para Proyección (y = mx + b)
  const n = seriesCosto.length;
  let slope = 0, intercept = 0;
  
  if (n >= 2) {
    const x = Array.from({length: n}, (_, i) => i); // [0, 1, 2...]
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = seriesCosto.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + (xi * seriesCosto[i]), 0);
    const sumXX = x.reduce((sum, xi) => sum + (xi * xi), 0);
    
    slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    intercept = (sumY - slope * sumX) / n;
  }

  const forecast = [3, 6, 12].map(months => ({
    meses: months,
    valor: slope * (n - 1 + months) + intercept, // Proyectar desde el último punto
    label: `Proyección +${months} Meses`
  }));

  // 3. Análisis de Ausentismo (Factor Bradford)
  let absenceStats = null;
  if (absenceData && absenceData.length > 0) {
    const empAbsence = {};
    
    absenceData.forEach(abs => {
      const key = normalizeText(abs.nombre);
      if (!empAbsence[key]) {
        empAbsence[key] = { 
          nombre: abs.nombre, 
          cargo: abs.cargo,
          frecuencia: 0, // Spells (S)
          diasTotales: 0, // Days (D)
          diasVacacion: 0,
          diasBaja: 0
        };
      }
      
      empAbsence[key].frecuencia += 1;
      empAbsence[key].diasTotales += abs.dias;
      
      if (abs.isVacacion) empAbsence[key].diasVacacion += abs.dias;
      else empAbsence[key].diasBaja += abs.dias;
    });

    const report = Object.values(empAbsence).map(e => {
      // Bradford = S^2 * D (Solo aplica a ausentismo no planificado, i.e., bajas)
      // Si queremos ser estrictos, usamos frecuencia total o solo frecuencia de bajas.
      // Aquí usaremos frecuencia total y días de baja para el score de "problema".
      const score = (e.frecuencia * e.frecuencia) * e.diasBaja;
      
      let status = 'Bajo';
      if (score >= BRADFORD_THRESHOLDS.high) status = 'Crítico';
      else if (score >= BRADFORD_THRESHOLDS.moderate) status = 'Alto';
      else if (score >= BRADFORD_THRESHOLDS.low) status = 'Moderado';

      return { ...e, score, status };
    });

    absenceStats = {
      list: report.sort((a, b) => b.score - a.score),
      topCritical: report.filter(r => r.score >= BRADFORD_THRESHOLDS.high).length,
      totalLostDays: report.reduce((acc, curr) => acc + curr.diasBaja, 0)
    };
  }

  return {
    labels,
    seriesCosto,
    seriesHC,
    forecast,
    absenceStats,
    tendencia: slope > 0 ? 'Alza' : 'Baja',
    crecimientoPromedio: n > 1 ? ((seriesCosto[n-1] - seriesCosto[0]) / seriesCosto[0]) * 100 : 0
  };
};