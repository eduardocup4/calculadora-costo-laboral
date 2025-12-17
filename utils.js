import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ============================================================================
// 1. CONSTANTES LEGALES BOLIVIA 2025
// ============================================================================
export const CONSTANTS = {
  SMN: 2500, // Salario Mínimo Nacional
  
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
        projections[months] = (CONSTANTS.SMN * 3) * pct;
    });
    return projections;
};

// B. Análisis de Equidad (Mejorado)
export const analyzeEquity = (data) => {
    const byGender = { M: { sum: 0, count: 0, salaries: [] }, F: { sum: 0, count: 0, salaries: [] }, Other: { sum: 0, count: 0, salaries: [] } };
    const byRole = {};
    const bySeniority = { 
        '0-2': { sum: 0, count: 0, M: 0, F: 0 },
        '2-5': { sum: 0, count: 0, M: 0, F: 0 },
        '5-10': { sum: 0, count: 0, M: 0, F: 0 },
        '10+': { sum: 0, count: 0, M: 0, F: 0 }
    };

    data.forEach(emp => {
        // Normalizar Género
        let g = 'Other';
        const rawG = normalizeText(emp.genero);
        if (rawG.startsWith('m') || rawG.startsWith('h')) g = 'M';
        if (rawG.startsWith('f')) g = 'F';

        byGender[g].sum += emp.totalGanado;
        byGender[g].count++;
        byGender[g].salaries.push(emp.totalGanado);

        // Agrupar por Cargo
        if (!byRole[emp.cargo]) byRole[emp.cargo] = { sum: 0, count: 0, salaries: [], M: 0, F: 0 };
        byRole[emp.cargo].sum += emp.totalGanado;
        byRole[emp.cargo].count++;
        byRole[emp.cargo].salaries.push(emp.totalGanado);
        if(g === 'M') byRole[emp.cargo].M++;
        if(g === 'F') byRole[emp.cargo].F++;

        // Agrupar por Antigüedad
        if(emp.fechaIngreso) {
            const years = (new Date() - emp.fechaIngreso) / (1000 * 60 * 60 * 24 * 365.25);
            let senKey = '10+';
            if(years < 2) senKey = '0-2';
            else if(years < 5) senKey = '2-5';
            else if(years < 10) senKey = '5-10';
            
            bySeniority[senKey].sum += emp.totalGanado;
            bySeniority[senKey].count++;
            if(g === 'M') bySeniority[senKey].M++;
            if(g === 'F') bySeniority[senKey].F++;
        }
    });

    const avgM = byGender.M.count ? byGender.M.sum / byGender.M.count : 0;
    const avgF = byGender.F.count ? byGender.F.sum / byGender.F.count : 0;
    const gap = avgM > 0 ? ((avgM - avgF) / avgM) * 100 : 0;

    // Calcular medianas
    const medianM = calculateMedian(byGender.M.salaries);
    const medianF = calculateMedian(byGender.F.salaries);

    // Análisis por cargo con brecha
    const roleAnalysis = Object.entries(byRole).map(([cargo, data]) => {
        const avgSalary = data.count > 0 ? data.sum / data.count : 0;
        const genderGap = data.M > 0 && data.F > 0 ? ((data.M - data.F) / (data.M + data.F)) * 100 : 0;
        return { cargo, avgSalary, count: data.count, M: data.M, F: data.F, genderGap };
    }).sort((a, b) => b.avgSalary - a.avgSalary);

    return { byGender, byRole, bySeniority, gap, avgM, avgF, medianM, medianF, roleAnalysis };
};

// C. Cálculo Principal (Soporta Filtros y Diccionario)
export const calculateAll = (data, mapping, config, filters, extraVars = []) => {
  
  // 1. Filtrado PRE-CÁLCULO
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
    
    // Antigüedad
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
        projections: getSeniorityProjection(fechaIngreso)
    };
  });

  return { summary: totals, details };
};

// D. Auditoría Precierre (Mejorado con Alertas Inteligentes)
export const analyzePrecierre = (periodsData) => {
    if(periodsData.length < 2) return null;
    const sorted = [...periodsData].sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
    const current = sorted[sorted.length-1].results.details;
    const prev = sorted[sorted.length-2].results.details;
    
    const getKey = (p) => p.ci ? String(p.ci).trim() : normalizeText(p.nombre);

    const prevMap = new Map(prev.map(p => [getKey(p), p]));
    const currMap = new Map(current.map(p => [getKey(p), p]));
    
    const altas = current.filter(p => !prevMap.has(getKey(p)));
    const bajas = prev.filter(p => !currMap.has(getKey(p)));
    
    const variaciones = [];
    const alerts = [];

    current.forEach(currEmp => {
        const prevEmp = prevMap.get(getKey(currEmp));
        if(prevEmp) {
            const diff = currEmp.totalGanado - prevEmp.totalGanado;
            const pct = prevEmp.totalGanado > 0 ? (diff / prevEmp.totalGanado) * 100 : 0;
            
            // Detectar si es alta reciente (ingreso en periodo previo)
            const isRecentHire = prevEmp.fechaIngreso && 
                                 new Date(prevEmp.fechaIngreso).getMonth() === sorted[sorted.length-2].month - 1;
            
            // Solo alertar si NO es alta reciente y la variación es significativa
            if(Math.abs(diff) > 100 && !isRecentHire) {
                variaciones.push({
                    nombre: currEmp.nombre,
                    concepto: 'Total Ganado',
                    anterior: prevEmp.totalGanado,
                    actual: currEmp.totalGanado,
                    diff: diff,
                    pct: pct
                });

                // Generar alertas según umbral
                if(Math.abs(pct) > 20) {
                    alerts.push({
                        type: 'Crítico',
                        severity: 'high',
                        message: `${currEmp.nombre}: Variación de ${pct.toFixed(1)}% (${formatCurrency(diff)})`,
                        employee: currEmp.nombre,
                        value: pct
                    });
                } else if(Math.abs(pct) > 10) {
                    alerts.push({
                        type: 'Advertencia',
                        severity: 'medium',
                        message: `${currEmp.nombre}: Variación de ${pct.toFixed(1)}% (${formatCurrency(diff)})`,
                        employee: currEmp.nombre,
                        value: pct
                    });
                }
            }
            
            if(currEmp.cargo !== prevEmp.cargo) {
                 variaciones.push({
                    nombre: currEmp.nombre,
                    concepto: 'Cambio de Cargo',
                    anterior: prevEmp.cargo,
                    actual: currEmp.cargo,
                    diff: 0, 
                    pct: 0
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

    return { altas, bajas, variaciones, generalDiff, alerts };
};

// E. Análisis Predictivo (Factor Bradford + Tendencias)
export const analyzePredictive = (periodsData, absenceData) => {
    // Tendencia de costos
    const trendData = periodsData.map(p => ({
        monthName: `${MONTHS[p.month - 1].substring(0, 3)} ${p.year}`,
        month: p.month,
        year: p.year,
        costoTotal: p.results.summary.costo,
        count: p.results.summary.count,
        isProjection: false
    }));

    // Proyección simple (próximos 3 meses)
    const lastCost = trendData[trendData.length - 1].costoTotal;
    const avgGrowth = trendData.length > 1 ? 
        (trendData[trendData.length - 1].costoTotal - trendData[0].costoTotal) / (trendData.length - 1) : 0;

    for(let i = 1; i <= 3; i++) {
        const lastPeriod = trendData[trendData.length - 1];
        const nextMonth = lastPeriod.month + i > 12 ? (lastPeriod.month + i) % 12 : lastPeriod.month + i;
        const nextYear = lastPeriod.month + i > 12 ? lastPeriod.year + 1 : lastPeriod.year;
        
        trendData.push({
            monthName: `${MONTHS[nextMonth - 1].substring(0, 3)} ${nextYear}`,
            month: nextMonth,
            year: nextYear,
            costoTotal: lastCost + (avgGrowth * i),
            count: lastPeriod.count,
            isProjection: true
        });
    }

    // Factor Bradford
    const bradford = calculateBradford(periodsData[periodsData.length - 1].results.details, absenceData);

    return { trendData, bradford };
};

// F. Cálculo Factor Bradford
const calculateBradford = (employees, absenceData) => {
    if(!absenceData || absenceData.length === 0) return [];

    const bradfordMap = new Map();

    absenceData.forEach(abs => {
        const empKey = normalizeText(abs.nombre);
        if(!bradfordMap.has(empKey)) {
            bradfordMap.set(empKey, { nombre: abs.nombre, frecuencia: 0, dias: 0 });
        }
        const record = bradfordMap.get(empKey);
        record.frecuencia++;
        record.dias += abs.dias || 1;
    });

    const bradfordScores = Array.from(bradfordMap.values()).map(b => ({
        ...b,
        score: Math.round(b.frecuencia * b.frecuencia * b.dias)
    })).sort((a, b) => b.score - a.score).slice(0, 10);

    return bradfordScores;
};

// Función auxiliar para mediana
const calculateMedian = (arr) => {
    if(arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// G. Exportación PDF
export const exportReportPDF = (title, headers, rows) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(14);
    doc.setTextColor(30, 64, 175);
    doc.text(title, 14, 15);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString()} | Sistema de Costo Laboral Bolivia`, 14, 20);
    
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

// H. Exportación Excel Mejorada
export const exportToExcel = (data, filename) => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen
    if(data.summary) {
        const summaryData = [
            ['RESUMEN EJECUTIVO'],
            [''],
            ['Total Empleados', data.summary.count],
            ['Total Ganado', data.summary.ganado],
            ['Cargas Patronales', data.summary.patronal],
            ['Provisiones', data.summary.provisiones],
            ['Costo Total Empresa', data.summary.costo],
            [''],
            ['DESGLOSE CARGAS'],
            ['CNS (10%)', data.summary.cargas.cns],
            ['AFP Riesgo (1.71%)', data.summary.cargas.afp],
            ['AFP Vivienda (2%)', data.summary.cargas.vivienda],
            ['AFP Solidario (3.5%)', data.summary.cargas.solidario]
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
    }

    // Hoja 2: Detalle
    if(data.details) {
        const detailData = data.details.map(d => ({
            'CI': d.ci,
            'Nombre': d.nombre,
            'Cargo': d.cargo,
            'Área': d.area,
            'Regional': d.regional,
            'Empresa': d.empresa,
            'Haber Básico': d.haberBasico,
            'Bono Antigüedad': d.bonoAntiguedad,
            'Otros Bonos': d.otrosBonos,
            'Total Ganado': d.totalGanado,
            'Cargas Patronales': d.costoTotalMensual - d.totalGanado - d.provisiones,
            'Provisiones': d.provisiones,
            'Costo Total': d.costoTotalMensual
        }));
        const ws2 = XLSX.utils.json_to_sheet(detailData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Personal');
    }

    // Hoja 3: Análisis (si existe)
    if(data.analysis) {
        const ws3 = XLSX.utils.json_to_sheet(data.analysis);
        XLSX.utils.book_append_sheet(wb, ws3, 'Análisis');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
};

// I. Parsers
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
