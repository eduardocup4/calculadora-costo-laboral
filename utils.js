import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ============================================================================
// 1. CONSTANTES LEGALES BOLIVIA 2025
// ============================================================================
export const CONSTANTS = {
  SMN: 2500, // Salario Mínimo Nacional (Ajustar si hay incremento oficial)
  
  // Cargas Sociales (Patronal) - TOTAL: 17.21%
  CNS: 0.10,                      // 10.00%
  AFP_PRO_VIVIENDA: 0.02,         //  2.00%
  AFP_RIESGO_PROFESIONAL: 0.0171, //  1.71%
  AFP_SOLIDARIO_PATRONAL: 0.035,  //  3.50%
  
  // Provisiones (Pasivos)
  AGUINALDO: 0.08333,
  INDEMNIZACION: 0.08333,
  PRIMA: 0.08333,
  
  // Escala Bono Antigüedad (DS 21060 Art 60) - Base 3 SMN
  ESCALA_ANTIGUEDAD: [
    { min: 0, max: 2, pct: 0.00 },
    { min: 2, max: 5, pct: 0.05 },
    { min: 5, max: 8, pct: 0.11 },
    { min: 8, max: 11, pct: 0.18 },
    { min: 11, max: 15, pct: 0.26 },
    { min: 15, max: 20, pct: 0.34 },
    { min: 20, max: 25, pct: 0.42 },
    { min: 25, max: 100, pct: 0.50 },
  ]
};

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ============================================================================
// 2. HELPERS
// ============================================================================
export const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = val.toString().replace(/[^0-9.-]/g, '');
  return parseFloat(clean) || 0;
};

export const normalizeText = (text) => text ? text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

export const formatDate = (d) => {
    if (!d) return null;
    if (typeof d === 'number') return new Date((d - (25567 + 2)) * 86400 * 1000);
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
};

export const formatCurrency = (val) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(val);
export const formatPercent = (val) => `${(parseFloat(val)).toFixed(2)}%`;

// ============================================================================
// 3. LÓGICA DE NEGOCIO Y CÁLCULOS
// ============================================================================

// A. Proyección de Antigüedad (Futuro)
export const getSeniorityProjection = (fechaIngreso) => {
    if (!fechaIngreso) return null;
    const projections = {};
    const periods = [0, 3, 6, 12, 24];
    const today = new Date();
    
    periods.forEach(months => {
        const futureDate = new Date(new Date().setMonth(today.getMonth() + months));
        const diffTime = Math.abs(futureDate - fechaIngreso);
        const years = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        
        const scale = CONSTANTS.ESCALA_ANTIGUEDAD.find(s => years >= s.min && years < s.max);
        const pct = scale ? scale.pct : 0.50;
        // BASE DE CÁLCULO: 3 SALARIOS MÍNIMOS
        projections[months] = (CONSTANTS.SMN * 3) * pct;
    });
    return projections;
};

// B. Análisis de Equidad (Nuevo Módulo)
export const analyzeEquity = (data) => {
    const byGender = { M: { sum: 0, count: 0 }, F: { sum: 0, count: 0 }, Other: { sum: 0, count: 0 } };
    const byRole = {};

    data.forEach(emp => {
        // Normalizar Género
        let g = 'Other';
        const rawG = normalizeText(emp.genero);
        if (rawG.startsWith('m') || rawG.startsWith('h')) g = 'M';
        if (rawG.startsWith('f')) g = 'F';

        byGender[g].sum += emp.totalGanado;
        byGender[g].count++;

        // Agrupar por Cargo
        if (!byRole[emp.cargo]) byRole[emp.cargo] = { sum: 0, count: 0, salaries: [] };
        byRole[emp.cargo].sum += emp.totalGanado;
        byRole[emp.cargo].count++;
        byRole[emp.cargo].salaries.push(emp.totalGanado);
    });

    const avgM = byGender.M.count ? byGender.M.sum / byGender.M.count : 0;
    const avgF = byGender.F.count ? byGender.F.sum / byGender.F.count : 0;
    const gap = avgM > 0 ? ((avgM - avgF) / avgM) * 100 : 0;

    return { byGender, byRole, gap, avgM, avgF };
};

// C. Cálculo Principal (Soporta Filtros y Diccionario)
export const calculateAll = (data, mapping, config, filters, extraVars = []) => {
  
  // 1. Filtrado PRE-CÁLCULO (Optimización)
  const filteredData = data.filter(row => {
    if (filters.empresa && filters.empresa !== 'Todas' && row[mapping.empresa] !== filters.empresa) return false;
    if (filters.regional && filters.regional !== 'Todas' && row[mapping.regional] !== filters.regional) return false;
    if (filters.area && filters.area !== 'Todas' && row[mapping.area] !== filters.area) return false;
    if (filters.cargo && filters.cargo !== 'Todas' && row[mapping.cargo] !== filters.cargo) return false;
    return true;
  });

  const totals = { 
    ganado: 0, patronal: 0, provisiones: 0, costo: 0, count: 0,
    cargas: { cns: 0, afp: 0, solidario: 0, vivienda: 0 }
  };
  
  const details = filteredData.map((row, index) => {
    const haberBasico = parseNumber(row[mapping.haberBasico]);
    const fechaIngreso = formatDate(row[mapping.fechaIngreso]);
    const fechaRetiro = formatDate(row[mapping.fechaRetiro]);
    
    // Antigüedad: Si viene en Excel se usa, sino se calcula
    let bonoAntiguedad = parseNumber(row[mapping.bonoAntiguedad]);
    if (bonoAntiguedad === 0 && fechaIngreso) {
        bonoAntiguedad = getSeniorityProjection(fechaIngreso)[0];
    }

    // Otros Bonos (Diccionario)
    let otrosBonos = 0;
    const breakdown = {}; 
    extraVars.forEach(v => {
        const val = parseNumber(row[v.originalName]);
        if (v.isComputable) otrosBonos += val;
        breakdown[v.alias] = val; 
    });

    const totalGanado = haberBasico + bonoAntiguedad + otrosBonos;

    // Cargas Patronales (17.21%)
    const cns = totalGanado * CONSTANTS.CNS;
    const afpRiesgo = totalGanado * CONSTANTS.AFP_RIESGO_PROFESIONAL;
    const afpVivienda = totalGanado * CONSTANTS.AFP_PRO_VIVIENDA;
    const afpSolidario = totalGanado * CONSTANTS.AFP_SOLIDARIO_PATRONAL;
    const totalPatronal = cns + afpRiesgo + afpVivienda + afpSolidario;

    // Provisiones
    let provisiones = 0;
    if (config.aguinaldo) provisiones += totalGanado * CONSTANTS.AGUINALDO;
    if (config.indemnizacion) provisiones += totalGanado * CONSTANTS.INDEMNIZACION;
    if (config.primaUtilidades) provisiones += totalGanado * CONSTANTS.PRIMA;
    if (config.segundoAguinaldo) provisiones += totalGanado * CONSTANTS.PRIMA;

    const costoTotal = totalGanado + totalPatronal + provisiones;

    totals.ganado += totalGanado;
    totals.patronal += totalPatronal;
    totals.provisiones += provisiones;
    totals.costo += costoTotal;
    totals.cargas.cns += cns;
    totals.cargas.afp += afpRiesgo;
    totals.cargas.solidario += afpSolidario;
    totals.cargas.vivienda += afpVivienda;
    totals.count++;

    return {
        id: index,
        ci: row[mapping.ci],
        nombre: row[mapping.nombre],
        cargo: row[mapping.cargo],
        area: row[mapping.area],
        regional: row[mapping.regional],
        empresa: row[mapping.empresa],
        genero: row[mapping.genero],
        fechaIngreso,
        fechaRetiro,
        haberBasico,
        bonoAntiguedad,
        otrosBonos,
        breakdown,
        totalGanado,
        cargas: { cns, afpRiesgo, afpVivienda, afpSolidario },
        provisiones,
        costoTotalMensual: costoTotal,
        projections: getSeniorityProjection(fechaIngreso) // Futuro
    };
  });

  return { summary: totals, details };
};

// D. Auditoría Precierre (Altas/Bajas/Variaciones)
export const analyzePrecierre = (periodsData) => {
    if(periodsData.length < 2) return null;
    const sorted = [...periodsData].sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
    const current = sorted[sorted.length-1].results.details;
    const prev = sorted[sorted.length-2].results.details;
    
    // Key única: CI (preferido) o Nombre
    const getKey = (p) => p.ci ? String(p.ci).trim() : normalizeText(p.nombre);

    const prevMap = new Map(prev.map(p => [getKey(p), p]));
    const currMap = new Map(current.map(p => [getKey(p), p]));
    
    const altas = current.filter(p => !prevMap.has(getKey(p)));
    const bajas = prev.filter(p => !currMap.has(getKey(p))); // O fechaRetiro en mes actual
    
    const variaciones = [];
    current.forEach(currEmp => {
        const prevEmp = prevMap.get(getKey(currEmp));
        if(prevEmp) {
            const diff = currEmp.totalGanado - prevEmp.totalGanado;
            if(Math.abs(diff) > 1) { // Tolerancia 1 BOB
                variaciones.push({
                    nombre: currEmp.nombre,
                    concepto: 'Total Ganado',
                    anterior: prevEmp.totalGanado,
                    actual: currEmp.totalGanado,
                    diff: diff,
                    pct: (diff / prevEmp.totalGanado) * 100
                });
            }
            if(currEmp.cargo !== prevEmp.cargo) {
                 variaciones.push({
                    nombre: currEmp.nombre,
                    concepto: 'Cambio de Cargo',
                    anterior: prevEmp.cargo,
                    actual: currEmp.cargo,
                    diff: 0, pct: 0
                });
            }
        }
    });

    const generalDiff = {
        totalPrevious: sorted[sorted.length-2].results.summary.costo,
        totalCurrent: sorted[sorted.length-1].results.summary.costo,
        absolute: sorted[sorted.length-1].results.summary.costo - sorted[sorted.length-2].results.summary.costo,
        percentage: ((sorted[sorted.length-1].results.summary.costo - sorted[sorted.length-2].results.summary.costo) / sorted[sorted.length-2].results.summary.costo) * 100
    };

    return { altas, bajas, variaciones, generalDiff };
};

// E. Exportación PDF (Planilla General Filtrada)
export const exportReportPDF = (title, headers, rows) => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    
    doc.setFontSize(14);
    doc.setTextColor(30, 64, 175);
    doc.text(title, 14, 15);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString()} | Sistema de Costo Laboral`, 14, 20);
    
    doc.autoTable({
        startY: 25,
        head: [headers],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

// ... (Parsers y Helpers de Archivo se mantienen) ...
export const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve({ headers: jsonData[0], data: XLSX.utils.sheet_to_json(worksheet) });
      } catch (error) { reject(error); }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const parseAbsenceFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const absences = json.map(row => {
          const keys = Object.keys(row);
          // Auto-detect simple
          return {
            nombre: row[keys.find(k => k.match(/nombre|empleado/i))] || Object.values(row)[0],
            tipo: row[keys.find(k => k.match(/tipo|motivo/i))] || 'Ausencia',
            dias: parseNumber(row[keys.find(k => k.match(/dia|duracion/i))]) || 1
          };
        });
        resolve(absences);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const autoDetectColumns = (headers) => {
  const mapping = {};
  const normalize = (h) => h.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const rules = {
    ci: ['ci', 'cedula', 'carnet', 'documento'],
    nombre: ['nombre', 'empleado', 'trabajador'],
    cargo: ['cargo', 'puesto'],
    area: ['area', 'departamento'],
    regional: ['regional', 'ciudad', 'sucursal'], 
    empresa: ['empresa', 'razon', 'compania'],
    genero: ['genero', 'sexo'],
    haberBasico: ['haber', 'basico', 'sueldo'],
    bonoAntiguedad: ['antiguedad'],
    fechaIngreso: ['ingreso', 'fechaing'],
    fechaRetiro: ['retiro', 'baja', 'salida'], 
    totalGanado: ['totalganado', 'ganado', 'total']
  };
  headers.forEach(h => {
    const norm = normalize(h);
    for(const [key, list] of Object.entries(rules)) {
        if(!mapping[key] && list.some(k => norm.includes(k))) mapping[key] = h;
    }
  });
  return mapping;
};

export const extractUniqueValues = (data, column) => {
    if(!column) return [];
    const values = new Set(data.map(row => row[column]).filter(Boolean));
    return Array.from(values).sort();
};

// Función vacía para evitar error en imports viejos
export const analyzePeriods = (data, abs) => ({ trendData: [], bradford: [] });