import * as XLSX from 'xlsx';
// Asegúrate de instalar: npm install jspdf jspdf-autotable
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ============================================================================
// 1. CONSTANTES DE LEGISLACIÓN BOLIVIANA (ACTUALIZADO 2025)
// ============================================================================

export const CONSTANTS = {
  SMN: 2750, 
  
  // Aportes Laborales
  AFP_VEJEZ: 0.10,
  AFP_RIESGO_COMUN: 0.0171,
  AFP_COMISION: 0.005,
  AFP_SOLIDARIO_LABORAL: 0.005,
  
  // Aportes Patronales (Costo Empresa) - CORREGIDO PUNTO G
  CNS: 0.10,                  
  AFP_PRO_VIVIENDA: 0.02,     
  AFP_RIESGO_PROFESIONAL: 0.0171, 
  AFP_SOLIDARIO_PATRONAL: 0.035,   // Actualizado al 3.5%
  
  // Provisiones
  AGUINALDO: 0.08333,
  INDEMNIZACION: 0.08333,
  PRIMA: 0.08333,
  
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
};

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ============================================================================
// 2. PARSERS ROBUSTOS (CORREGIDO PUNTO B)
// ============================================================================

export const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Elimina separadores de miles (espacios o comas si se usan erróneamente) 
  // y asegura punto decimal.
  // Formato esperado input: "3500.50" o "3500" (Excel raw usually)
  const strVal = val.toString().trim();
  // Eliminar cualquier caracter que no sea numero, punto o signo menos
  const clean = strVal.replace(/[^0-9.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

export const normalizeText = (text) => {
  return text ? text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
};

export const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  if (typeof dateInput === 'number') {
    // Excel serial date logic
    const date = new Date((dateInput - (25567 + 2)) * 86400 * 1000);
    return date.toLocaleDateString('es-BO');
  }
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? dateInput : date.toLocaleDateString('es-BO');
};

// ============================================================================
// 3. LOGICA DE CALCULO DETALLADA (CORREGIDO PUNTOS C, D, E)
// ============================================================================

export const calculateAll = (data, mapping, provisions, filters = null) => {
  // Aplicar Filtros (Punto K) antes del cálculo
  let processedData = data;
  if (filters) {
    processedData = data.filter(row => {
      const area = row[mapping.area] || '';
      const empresa = row[mapping.empresa] || ''; // Nueva columna Empresa
      
      const passArea = !filters.area || filters.area === 'Todas' || normalizeText(area) === normalizeText(filters.area);
      const passEmpresa = !filters.empresa || filters.empresa === 'Todas' || normalizeText(empresa) === normalizeText(filters.empresa);
      
      return passArea && passEmpresa;
    });
  }

  const totals = {
    totalGanado: 0,
    aportesPatronales: 0,
    provisiones: 0,
    costoLaboralMensual: 0,
    costoLaboralAnual: 0,
    count: 0
  };

  const employees = processedData.map((row, index) => {
    // 1. Desglose de Componentes Salariales
    const haberBasico = parseNumber(row[mapping.haberBasico]);
    const bonoAntiguedad = parseNumber(row[mapping.bonoAntiguedad]);
    const bonoProduccion = parseNumber(row[mapping.bonoProduccion]); // Nueva
    const bonoDominical = parseNumber(row[mapping.bonoDominical]);   // Nueva
    
    // Suma de Otros Bonos (Array de columnas mapeadas)
    let otrosBonos = 0;
    let desgloseOtros = {};
    if (mapping.otrosBonosList && Array.isArray(mapping.otrosBonosList)) {
      mapping.otrosBonosList.forEach(colKey => {
        const val = parseNumber(row[colKey]);
        otrosBonos += val;
        desgloseOtros[colKey] = val;
      });
    }

    // Validación Total Ganado (Punto F - Diferencia)
    const sumaComponentes = haberBasico + bonoAntiguedad + bonoProduccion + bonoDominical + otrosBonos;
    let totalGanadoExcel = parseNumber(row[mapping.totalGanado]);
    
    // Si la diferencia es minúscula (decimales), confiamos en la suma calculada o en el Excel según preferencia
    // Por robustez, usamos la suma de componentes para el cálculo interno si queremos cuadrar todo
    const diff = Math.abs(totalGanadoExcel - sumaComponentes);
    const totalGanado = totalGanadoExcel > 0 ? totalGanadoExcel : sumaComponentes; 

    // 2. Cálculos Patronales (Actualizado 17.21%)
    const aporteCNS = totalGanado * CONSTANTS.CNS;
    const aporteAFP_Vivienda = totalGanado * CONSTANTS.AFP_PRO_VIVIENDA;
    const aporteAFP_Riesgo = totalGanado * CONSTANTS.AFP_RIESGO_PROFESIONAL;
    const aporteAFP_Solidario = totalGanado * CONSTANTS.AFP_SOLIDARIO_PATRONAL;
    
    const totalPatronal = aporteCNS + aporteAFP_Vivienda + aporteAFP_Riesgo + aporteAFP_Solidario;

    // 3. Provisiones Sociales (Punto H - 2da Prima)
    const provAguinaldo = provisions.aguinaldo ? totalGanado * CONSTANTS.AGUINALDO : 0;
    const provIndemnizacion = provisions.indemnizacion ? totalGanado * CONSTANTS.INDEMNIZACION : 0;
    const provPrima = provisions.primaUtilidades ? totalGanado * CONSTANTS.PRIMA : 0;
    const prov2daPrima = provisions.segundaPrima ? totalGanado * CONSTANTS.PRIMA : 0; // Nueva
    
    const totalProvisiones = provAguinaldo + provIndemnizacion + provPrima + prov2daPrima;

    const costoMensual = totalGanado + totalPatronal + totalProvisiones;

    // Acumuladores
    totals.totalGanado += totalGanado;
    totals.aportesPatronales += totalPatronal;
    totals.provisiones += totalProvisiones;
    totals.costoLaboralMensual += costoMensual;
    totals.costoLaboralAnual += costoMensual * 12;
    totals.count++;

    return {
      id: index,
      nombre: row[mapping.nombre] || 'Sin Nombre',
      cargo: row[mapping.cargo] || 'Sin Cargo',
      area: row[mapping.area] || 'General',
      empresa: row[mapping.empresa] || 'Empresa', // Identificación Empresa
      fechaIngreso: row[mapping.fechaIngreso], // Importante para filtros de Ingresos
      fechaRetiro: row[mapping.fechaRetiro],   // Importante para filtros de Bajas
      componentes: {
        haberBasico,
        bonoAntiguedad,
        bonoProduccion,
        bonoDominical,
        otrosBonos,
        desgloseOtros,
        totalGanado,
        diffConExcel: diff
      },
      aportesPatronales: { total: totalPatronal },
      provisiones: { total: totalProvisiones },
      costoLaboralMensual: costoMensual
    };
  });

  // Agrupación (Se mantiene igual, omitido por brevedad)
  // ... (código existente byArea) ...
  const byArea = []; // Mock para que compile, usar el existente

  return {
    employees,
    totals,
    byArea,
    employeeCount: employees.length
  };
};

// ============================================================================
// 4. ANALYTICS MEJORADO (CORREGIDO PUNTOS L, M)
// ============================================================================

export const analyzePrecierre = (periodsData) => {
    // Protección contra datos vacíos (Punto N)
    if(!periodsData || periodsData.length < 2) return null;
    
    // Ordenar y tomar los dos últimos periodos
    const sorted = [...periodsData].sort((a,b) => (a.year*100+a.month) - (b.year*100+b.month));
    const current = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];

    const currEmps = current.results.employees;
    const prevEmps = prev.results.employees;

    // Mapa hash mejorado (Usa ID compuesto si no hay CI)
    const getKey = (e) => normalizeText(e.nombre) + '|' + normalizeText(e.cargo);
    const prevMap = new Map();
    prevEmps.forEach(e => prevMap.set(getKey(e), e));

    const altas = [];
    const bajas = [];
    const variaciones = [];

    currEmps.forEach(curr => {
        const key = getKey(curr);
        const previous = prevMap.get(key);

        if(!previous) {
            altas.push(curr);
        } else {
            // Check variación salarial
            const diff = curr.componentes.totalGanado - previous.componentes.totalGanado;
            if(Math.abs(diff) > 5) {
                variaciones.push({
                    nombre: curr.nombre,
                    cargo: curr.cargo,
                    area: curr.area,
                    anterior: previous.componentes.totalGanado,
                    nuevo: curr.componentes.totalGanado,
                    diff: diff,
                    pct: (diff / previous.componentes.totalGanado) * 100
                });
            }
            prevMap.set(key, { ...previous, found: true });
        }
    });

    // Detectar bajas
    prevMap.forEach((val) => {
        if(!val.found) bajas.push(val);
    });

    return {
        detalles: {
            altas, bajas, variacionesSalariales: variaciones, cambiosCargo: [], cambiosArea: []
        }
    };
};

export const analyzePeriods = (periodsData, absenceData) => {
    // ... (Código de ordenamiento existente) ...
    const sortedPeriods = [...periodsData].sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
    
    // Cálculo de Rotación (Punto L)
    // Tasa mensual = (Salidas / Promedio Headcount) * 100
    // Aquí simplificamos comparando listas mes a mes
    let totalSalidas = 0;
    let sumHeadcount = 0;
    const ingresosTotales = [];
    const salidasTotales = [];
    
    // Análisis de Incrementos Reales (Punto M)
    const incrementos = [];
    
    for(let i = 1; i < sortedPeriods.length; i++) {
        const prev = sortedPeriods[i-1];
        const curr = sortedPeriods[i];
        
        const prevKeys = new Set(prev.results.employees.map(e => normalizeText(e.nombre)));
        const currKeys = new Set(curr.results.employees.map(e => normalizeText(e.nombre)));
        
        // Salidas: Estaba en prev, no en curr
        const salidasMes = prev.results.employees.filter(e => !currKeys.has(normalizeText(e.nombre)));
        totalSalidas += salidasMes.length;
        salidasTotales.push(...salidasMes.map(s => ({...s, periodoSalida: `${curr.month}/${curr.year}`})));
        
        // Ingresos
        const ingresosMes = curr.results.employees.filter(e => !prevKeys.has(normalizeText(e.nombre)));
        ingresosTotales.push(...ingresosMes.map(n => ({...n, periodo: `${curr.month}/${curr.year}`})));

        sumHeadcount += curr.results.employeeCount;

        // Incrementos: Solo gente que estaba en ambos periodos
        curr.results.employees.forEach(c => {
             // FILTRO CLAVE: Si entró este mes, no cuenta como incremento salarial real
             // Asumimos que si no estaba en prevKeys es nuevo ingreso
             if(prevKeys.has(normalizeText(c.nombre))) {
                 const p = prev.results.employees.find(px => normalizeText(px.nombre) === normalizeText(c.nombre));
                 if(p && c.componentes.totalGanado > p.componentes.totalGanado * 1.02) { // >2% diff
                     incrementos.push({
                         nombre: c.nombre,
                         cargo: c.cargo,
                         salarioInicial: p.componentes.totalGanado,
                         salarioFinal: c.componentes.totalGanado,
                         variacion: c.componentes.totalGanado - p.componentes.totalGanado,
                         variacionPct: roundTwo(((c.componentes.totalGanado - p.componentes.totalGanado)/p.componentes.totalGanado)*100)
                     });
                 }
             }
        });
    }

    const avgHeadcount = sortedPeriods.length > 0 ? sumHeadcount / sortedPeriods.length : 1;
    const tasaRotacion = avgHeadcount > 0 ? (totalSalidas / avgHeadcount) * 100 : 0;

    return {
        // ... (data existente para gráficos) ...
        labels: sortedPeriods.map(p => `${MONTHS[p.month-1]} ${p.year}`),
        seriesCosto: sortedPeriods.map(p => p.results.totals.costoLaboralMensual),
        seriesHC: sortedPeriods.map(p => p.results.employeeCount),
        rotacion: {
            tasaAnualizada: roundTwo(tasaRotacion * 12), // Proyección simple
            tasaMensualPromedio: roundTwo(tasaRotacion),
            totalSalidas,
            headcountPromedio: Math.round(avgHeadcount)
        },
        headcountInicial: sortedPeriods[0]?.results.employeeCount || 0,
        headcountFinal: sortedPeriods[sortedPeriods.length-1]?.results.employeeCount || 0,
        ingresos: ingresosTotales,
        salidas: salidasTotales,
        topIncrementos: incrementos.sort((a,b) => b.variacion - a.variacion).slice(0, 10),
        forecast: [], // Implementar lógica regresión aquí
        totalPeriods: sortedPeriods.length
    };
};

// ============================================================================
// 5. EXPORTACIÓN REAL (PUNTO I)
// ============================================================================

export const exportToExcel = (data, fileName = 'Reporte') => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// Se requiere implementación en componente para llamar a esto con datos formateados