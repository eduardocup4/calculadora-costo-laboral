import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ============================================================================
// CONSTANTES LEGALES BOLIVIA 2025
// ============================================================================
export const CONSTANTS = {
  SMN: 2500,
  CNS: 0.10,
  AFP_PRO_VIVIENDA: 0.02,
  AFP_RIESGO_PROFESIONAL: 0.0171,
  AFP_SOLIDARIO_PATRONAL: 0.035,
  AGUINALDO: 0.08333,
  INDEMNIZACION: 0.08333,
  PRIMA: 0.08333,
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
// PARSEO DE ARCHIVO DE VARIANTES
// ============================================================================
export const parseVariantsFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const variants = json.map(row => {
          const keys = Object.keys(row);
          return {
            codigo: row[keys.find(k => k.match(/codigo|clave|key/i))] || row[keys[0]],
            nombre: row[keys.find(k => k.match(/nombre|descripcion|desc/i))] || row[keys[1]],
            tipo: normalizeText(row[keys.find(k => k.match(/tipo|type|categoria/i))] || row[keys[2]] || 'OTRO')
          };
        });
        
        resolve(variants);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

// ============================================================================
// IDENTIFICAR COLUMNAS DESPUÉS DE "LIQUIDO PAGABLE"
// ============================================================================
export const getColumnsAfterLiquidoPagable = (headers) => {
  const liquidoIndex = headers.findIndex(h => 
    normalizeText(h).includes('liquido') && normalizeText(h).includes('pag')
  );
  
  if (liquidoIndex === -1) {
    console.warn('No se encontró columna "Liquido Pagable", mostrando todas');
    return headers;
  }
  
  return headers.slice(liquidoIndex + 1);
};

// ============================================================================
// VALIDAR SUMA DE VARIABLES = TOTAL GANADO
// ============================================================================
export const validateVariablesSum = (data, mapping, selectedVars) => {
  const sampleSize = Math.min(5, data.length);
  const validation = [];
  
  for (let i = 0; i < sampleSize; i++) {
    const row = data[i];
    const haberBasico = parseNumber(row[mapping.haberBasico]) || 0;
    const bonoAntiguedad = parseNumber(row[mapping.bonoAntiguedad]) || 0;
    const bonoDominical = parseNumber(row[mapping.bonoDominical]) || 0;
    const totalGanado = parseNumber(row[mapping.totalGanado]) || 0;
    
    let sumOtrosBonos = 0;
    selectedVars.forEach(v => {
      sumOtrosBonos += parseNumber(row[v.originalName]) || 0;
    });
    
    const calculatedTotal = haberBasico + bonoAntiguedad + bonoDominical + sumOtrosBonos;
    const diff = Math.abs(totalGanado - calculatedTotal);
    const isValid = diff < 1;
    
    validation.push({
      rowIndex: i,
      nombre: row[mapping.nombre] || `Fila ${i + 1}`,
      haberBasico,
      bonoAntiguedad,
      bonoDominical,
      otrosBonos: sumOtrosBonos,
      totalCalculado: calculatedTotal,
      totalEsperado: totalGanado,
      diferencia: diff,
      isValid
    });
  }
  
  const allValid = validation.every(v => v.isValid);
  return { validation, allValid, sampleSize };
};

// ============================================================================
// PROYECCIÓN DE ANTIGÜEDAD
// ============================================================================
export const getSeniorityProjection = (fechaIngreso) => {
    if (!fechaIngreso) return null;
    const projections = {};
    const periods = [0, 3, 6, 12, 24, 36];
    const today = new Date();
    
    periods.forEach(months => {
        const futureDate = new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
        const diffTime = Math.abs(futureDate - fechaIngreso);
        const years = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        
        const scale = CONSTANTS.ESCALA_ANTIGUEDAD.find(s => years >= s.min && years < s.max);
        const pct = scale ? scale.pct : 0.50;
        projections[months] = (CONSTANTS.SMN * 3) * pct;
    });
    return projections;
};

export const analyzeSeniorityProjection = (data, mapping) => {
  const projections = {
    byGroup: {},
    byUnidadNegocio: {},
    byCargo: {},
    byPerson: []
  };
  
  data.forEach(row => {
    const nombre = row[mapping.nombre];
    const fechaIngreso = formatDate(row[mapping.fechaIngreso]);
    const grupo = row[mapping.area] || 'Sin Área';
    const unidad = row[mapping.empresa] || 'Sin Unidad';
    const cargo = row[mapping.cargo] || 'Sin Cargo';
    
    if (!fechaIngreso) return;
    
    const projection = getSeniorityProjection(fechaIngreso);
    
    projections.byPerson.push({
      nombre,
      cargo,
      grupo,
      unidad,
      fechaIngreso,
      actual: projection[0],
      m3: projection[3],
      m6: projection[6],
      m12: projection[12],
      m24: projection[24],
      m36: projection[36],
      incremento36m: projection[36] - projection[0]
    });
    
    if (!projections.byGroup[grupo]) {
      projections.byGroup[grupo] = { actual: 0, m3: 0, m6: 0, m12: 0, m24: 0, m36: 0, count: 0 };
    }
    projections.byGroup[grupo].actual += projection[0];
    projections.byGroup[grupo].m3 += projection[3];
    projections.byGroup[grupo].m6 += projection[6];
    projections.byGroup[grupo].m12 += projection[12];
    projections.byGroup[grupo].m24 += projection[24];
    projections.byGroup[grupo].m36 += projection[36];
    projections.byGroup[grupo].count++;
    
    if (!projections.byUnidadNegocio[unidad]) {
      projections.byUnidadNegocio[unidad] = { actual: 0, m3: 0, m6: 0, m12: 0, m24: 0, m36: 0, count: 0 };
    }
    projections.byUnidadNegocio[unidad].actual += projection[0];
    projections.byUnidadNegocio[unidad].m3 += projection[3];
    projections.byUnidadNegocio[unidad].m6 += projection[6];
    projections.byUnidadNegocio[unidad].m12 += projection[12];
    projections.byUnidadNegocio[unidad].m24 += projection[24];
    projections.byUnidadNegocio[unidad].m36 += projection[36];
    projections.byUnidadNegocio[unidad].count++;
    
    if (!projections.byCargo[cargo]) {
      projections.byCargo[cargo] = { actual: 0, m3: 0, m6: 0, m12: 0, m24: 0, m36: 0, count: 0 };
    }
    projections.byCargo[cargo].actual += projection[0];
    projections.byCargo[cargo].m3 += projection[3];
    projections.byCargo[cargo].m6 += projection[6];
    projections.byCargo[cargo].m12 += projection[12];
    projections.byCargo[cargo].m24 += projection[24];
    projections.byCargo[cargo].m36 += projection[36];
    projections.byCargo[cargo].count++;
  });
  
  projections.byPerson.sort((a, b) => b.incremento36m - a.incremento36m);
  
  return projections;
};

// ============================================================================
// ANÁLISIS DE EQUIDAD
// ============================================================================
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
        let g = 'Other';
        const rawG = normalizeText(emp.genero);
        if (rawG.startsWith('m') || rawG.startsWith('h')) g = 'M';
        if (rawG.startsWith('f')) g = 'F';

        byGender[g].sum += emp.totalGanado;
        byGender[g].count++;
        byGender[g].salaries.push(emp.totalGanado);

        if (!byRole[emp.cargo]) byRole[emp.cargo] = { sum: 0, count: 0, salaries: [], M: 0, F: 0 };
        byRole[emp.cargo].sum += emp.totalGanado;
        byRole[emp.cargo].count++;
        byRole[emp.cargo].salaries.push(emp.totalGanado);
        if(g === 'M') byRole[emp.cargo].M++;
        if(g === 'F') byRole[emp.cargo].F++;

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

    const calculateMedian = (arr) => {
        if(arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const medianM = calculateMedian(byGender.M.salaries);
    const medianF = calculateMedian(byGender.F.salaries);

    const roleAnalysis = Object.entries(byRole).map(([cargo, data]) => {
        const avgSalary = data.count > 0 ? data.sum / data.count : 0;
        const genderGap = data.M > 0 && data.F > 0 ? ((data.M - data.F) / (data.M + data.F)) * 100 : 0;
        return { cargo, avgSalary, count: data.count, M: data.M, F: data.F, genderGap };
    }).sort((a, b) => b.avgSalary - a.avgSalary);

    return { byGender, byRole, bySeniority, gap, avgM, avgF, medianM, medianF, roleAnalysis };
};

// ============================================================================
// CÁLCULO PRINCIPAL
// ============================================================================
export const calculateAll = (data, mapping, config, filters, extraVars = []) => {
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
    const bonoDominical = parseNumber(row[mapping.bonoDominical]) || 0;
    const fechaIngreso = formatDate(row[mapping.fechaIngreso]);
    const fechaRetiro = formatDate(row[mapping.fechaRetiro]);
    
    let bonoAntiguedad = parseNumber(row[mapping.bonoAntiguedad]);
    if (bonoAntiguedad === 0 && fechaIngreso) {
        bonoAntiguedad = getSeniorityProjection(fechaIngreso)[0];
    }

    let otrosBonos = 0;
    const breakdown = {}; 
    extraVars.forEach(v => {
        const val = parseNumber(row[v.originalName]);
        if (v.isComputable) otrosBonos += val;
        breakdown[v.alias] = val; 
    });

    const totalGanado = haberBasico + bonoAntiguedad + bonoDominical + otrosBonos;

    const cns = totalGanado * CONSTANTS.CNS;
    const afpRiesgo = totalGanado * CONSTANTS.AFP_RIESGO_PROFESIONAL;
    const afpVivienda = totalGanado * CONSTANTS.AFP_PRO_VIVIENDA;
    const afpSolidario = totalGanado * CONSTANTS.AFP_SOLIDARIO_PATRONAL;
    const totalPatronal = cns + afpRiesgo + afpVivienda + afpSolidario;

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
        bonoDominical,
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

// ============================================================================
// AUDITORÍA PRECIERRE (CON VARIACIONES NO SALARIALES)
// ============================================================================
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
    const variacionesNoSalariales = [];
    const alerts = [];

    current.forEach(currEmp => {
        const prevEmp = prevMap.get(getKey(currEmp));
        if(prevEmp) {
            const diff = currEmp.totalGanado - prevEmp.totalGanado;
            const pct = prevEmp.totalGanado > 0 ? (diff / prevEmp.totalGanado) * 100 : 0;
            
            const isRecentHire = prevEmp.fechaIngreso && 
                                 new Date(prevEmp.fechaIngreso).getMonth() === sorted[sorted.length-2].month - 1;
            
            if(Math.abs(diff) > 100 && !isRecentHire) {
                variaciones.push({
                    nombre: currEmp.nombre,
                    cargo: currEmp.cargo,
                    variante: 'Total Ganado',
                    anterior: prevEmp.totalGanado,
                    actual: currEmp.totalGanado,
                    diff: diff,
                    pct: pct
                });

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
            
            if(currEmp.breakdown && prevEmp.breakdown) {
                Object.keys(currEmp.breakdown).forEach(key => {
                    const currVal = currEmp.breakdown[key] || 0;
                    const prevVal = prevEmp.breakdown[key] || 0;
                    const diffComp = currVal - prevVal;
                    
                    if(Math.abs(diffComp) > 10) {
                        const pctComp = prevVal > 0 ? (diffComp / prevVal) * 100 : 0;
                        variaciones.push({
                            nombre: currEmp.nombre,
                            cargo: currEmp.cargo,
                            variante: key,
                            anterior: prevVal,
                            actual: currVal,
                            diff: diffComp,
                            pct: pctComp
                        });
                    }
                });
            }
            
            if(currEmp.cargo !== prevEmp.cargo) {
                 variacionesNoSalariales.push({
                    nombre: currEmp.nombre,
                    tipo: 'Cambio de Cargo',
                    anterior: prevEmp.cargo,
                    actual: currEmp.cargo
                });
            }
            
            if(currEmp.area !== prevEmp.area) {
                 variacionesNoSalariales.push({
                    nombre: currEmp.nombre,
                    tipo: 'Cambio de Área',
                    anterior: prevEmp.area,
                    actual: currEmp.area
                });
            }
            
            if(currEmp.empresa !== prevEmp.empresa) {
                 variacionesNoSalariales.push({
                    nombre: currEmp.nombre,
                    tipo: 'Cambio de Unidad de Negocio',
                    anterior: prevEmp.empresa,
                    actual: currEmp.empresa
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

    return { altas, bajas, variaciones, variacionesNoSalariales, generalDiff, alerts };
};

// ============================================================================
// ANÁLISIS PREDICTIVO (CON TABLA ESTADÍSTICA)
// ============================================================================
export const analyzePredictive = (periodsData, absenceData) => {
    const trendData = periodsData.map(p => ({
        monthName: `${MONTHS[p.month - 1]} ${p.year}`,
        month: p.month,
        year: p.year,
        costoTotal: p.results.summary.costo,
        count: p.results.summary.count,
        isProjection: false
    }));

    const lastCost = trendData[trendData.length - 1].costoTotal;
    const avgGrowth = trendData.length > 1 ? 
        (trendData[trendData.length - 1].costoTotal - trendData[0].costoTotal) / (trendData.length - 1) : 0;

    for(let i = 1; i <= 3; i++) {
        const lastPeriod = trendData[trendData.length - 1];
        const nextMonth = lastPeriod.month + i > 12 ? ((lastPeriod.month + i - 1) % 12) + 1 : lastPeriod.month + i;
        const nextYear = lastPeriod.month + i > 12 ? lastPeriod.year + 1 : lastPeriod.year;
        
        trendData.push({
            monthName: `${MONTHS[nextMonth - 1]} ${nextYear}`,
            month: nextMonth,
            year: nextYear,
            costoTotal: lastCost + (avgGrowth * i),
            count: lastPeriod.count,
            isProjection: true
        });
    }

    const bradford = calculateBradford(periodsData[periodsData.length - 1].results.details, absenceData);
    
    const statsTable = buildStatsTable(periodsData);

    return { trendData, bradford, statsTable };
};

const buildStatsTable = (periodsData) => {
    const groupStats = {};
    
    periodsData.forEach(period => {
        const monthKey = `${MONTHS[period.month - 1]} ${period.year}`;
        
        period.results.details.forEach(emp => {
            const group = emp.area || 'Sin Área';
            
            if (!groupStats[group]) {
                groupStats[group] = { total: 0, periods: {} };
            }
            
            if (!groupStats[group].periods[monthKey]) {
                groupStats[group].periods[monthKey] = 0;
            }
            
            groupStats[group].periods[monthKey] += emp.totalGanado;
            groupStats[group].total += emp.totalGanado;
        });
    });
    
    const statsArray = Object.entries(groupStats).map(([group, data]) => {
        const periods = data.periods;
        const periodKeys = Object.keys(periods).sort();
        const trend = periodKeys.length > 1 ? 
            ((periods[periodKeys[periodKeys.length - 1]] - periods[periodKeys[0]]) / periods[periodKeys[0]]) * 100 : 0;
        
        return {
            grupo: group,
            total: data.total,
            periods: periods,
            periodKeys: periodKeys,
            trend: trend
        };
    }).sort((a, b) => b.total - a.total);
    
    return statsArray;
};

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

// ============================================================================
// EXPORTACIÓN
// ============================================================================
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

export const exportToExcel = (data, filename) => {
    const wb = XLSX.utils.book_new();

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

    if(data.analysis) {
        const ws3 = XLSX.utils.json_to_sheet(data.analysis);
        XLSX.utils.book_append_sheet(wb, ws3, 'Análisis');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
};

// ============================================================================
// PARSERS
// ============================================================================
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
    bonoDominical: ['dominical', 'domingo'],
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
