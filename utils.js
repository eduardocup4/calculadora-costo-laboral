import * as XLSX from 'xlsx';
// Asegúrate de tener instalado: npm install jspdf jspdf-autotable
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ============================================================================
// 1. UTILIDADES BÁSICAS DE FORMATO (HELPERS)
// ============================================================================

export const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Limpia caracteres no numéricos excepto punto y menos
  const strVal = val.toString().trim();
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
    // Lógica para fechas seriales de Excel
    const date = new Date((dateInput - (25567 + 2)) * 86400 * 1000);
    return date.toLocaleDateString('es-BO');
  }
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? dateInput : date.toLocaleDateString('es-BO');
};

export const roundTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2
  }).format(value);
};

// --- CORRECCIÓN CRÍTICA PARA NETLIFY/VERCEL ---
export const formatPercent = (value) => {
  if (value === null || value === undefined) return "0.00%";
  const num = parseFloat(value);
  // Si el valor ya viene multiplicado por 100 (ej: 12.5), lo dejamos así.
  // Si viene como decimal (ej: 0.125), ajusta según tu lógica preferida.
  // Aquí asumimos que entra el valor directo para mostrar (ej: 16.71)
  return `${num.toFixed(2)}%`;
};

// ============================================================================
// 2. CONSTANTES DE LEGISLACIÓN BOLIVIANA (2025)
// ============================================================================

export const CONSTANTS = {
  SMN: 2500, // Salario Mínimo Nacional (Ajustar si hay decreto 2025)
  
  // Aportes Laborales
  AFP_VEJEZ: 0.10,
  AFP_RIESGO_COMUN: 0.0171,
  AFP_COMISION: 0.005,
  AFP_SOLIDARIO_LABORAL: 0.005,
  
  // Aportes Patronales (Costo Empresa)
  CNS: 0.10,                  
  AFP_PRO_VIVIENDA: 0.02,     
  AFP_RIESGO_PROFESIONAL: 0.0171, 
  AFP_SOLIDARIO_PATRONAL: 0.03, // 3% Aporte patronal solidario
  
  // Provisiones Sociales
  AGUINALDO: 0.08333,
  INDEMNIZACION: 0.08333,
  PRIMA: 0.08333,
};

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ============================================================================
// 3. MANEJO DE ARCHIVOS (PARSERS)
// ============================================================================

export const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Obtenemos headers de la fila 1
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = jsonData[0];
        
        // Obtenemos datos mapeados a objetos
        const rows = XLSX.utils.sheet_to_json(worksheet);
        
        resolve({ headers, data: rows });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const autoDetectColumns = (headers) => {
  const mapping = {};
  const normalize = (h) => h.toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  const rules = {
    nombre: ['nombre', 'empleado', 'trabajador', 'nombres', 'apellidos'],
    cargo: ['cargo', 'puesto', 'funcion'],
    area: ['area', 'departamento', 'seccion', 'unidad'],
    haberBasico: ['haber', 'basico', 'sueldo', 'salario', 'contrato'],
    bonoAntiguedad: ['antiguedad', 'bonoant'],
    fechaIngreso: ['ingreso', 'fechaing', 'inicio'],
    ci: ['ci', 'cedula', 'carnet', 'identificacion', 'documento'],
    totalGanado: ['totalganado', 'ganado', 'total']
  };

  headers.forEach(header => {
    const h = normalize(header);
    for (const [key, keywords] of Object.entries(rules)) {
      if (!mapping[key] && keywords.some(k => h.includes(k))) {
        mapping[key] = header;
      }
    }
  });

  return mapping;
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
        
        // Normalizar estructura: { nombre, tipo, dias }
        const absences = json.map(row => {
          // Detectar columnas dinámicamente
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.toLowerCase().includes('nombre')) || keys[0];
          const typeKey = keys.find(k => k.toLowerCase().includes('tipo') || k.toLowerCase().includes('motivo')) || keys[1];
          const daysKey = keys.find(k => k.toLowerCase().includes('dia') || k.toLowerCase().includes('duracion')) || keys[2];

          return {
            nombre: row[nameKey],
            tipo: row[typeKey],
            dias: parseNumber(row[daysKey])
          };
        });

        resolve(absences);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

// ============================================================================
// 4. LÓGICA DE CÁLCULO
// ============================================================================

export const calculateAll = (data, mapping, provisions, filters = null) => {
  // Aplicar Filtros antes del cálculo
  let processedData = data;
  if (filters) {
    processedData = data.filter(row => {
      const area = row[mapping.area] || '';
      const passArea = !filters.area || filters.area === 'Todas' || normalizeText(area) === normalizeText(filters.area);
      return passArea;
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
    const haberBasico = parseNumber(row[mapping.haberBasico]);
    const bonoAntiguedad = parseNumber(row[mapping.bonoAntiguedad]);
    
    // Si Total Ganado viene del Excel, úsalo. Si no, calcúlalo simple.
    let totalGanado = parseNumber(row[mapping.totalGanado]);
    if (totalGanado === 0) {
        totalGanado = haberBasico + bonoAntiguedad;
    }

    // Cálculos Patronales
    const aporteCNS = totalGanado * CONSTANTS.CNS;
    const aporteAFP_Vivienda = totalGanado * CONSTANTS.AFP_PRO_VIVIENDA;
    const aporteAFP_Riesgo = totalGanado * CONSTANTS.AFP_RIESGO_PROFESIONAL;
    const aporteAFP_Solidario = totalGanado * CONSTANTS.AFP_SOLIDARIO_PATRONAL;
    
    const totalPatronal = aporteCNS + aporteAFP_Vivienda + aporteAFP_Riesgo + aporteAFP_Solidario;

    // Provisiones Sociales
    const provAguinaldo = provisions.aguinaldo ? totalGanado * CONSTANTS.AGUINALDO : 0;
    const provIndemnizacion = provisions.indemnizacion ? totalGanado * CONSTANTS.INDEMNIZACION : 0;
    const provPrima = provisions.primaUtilidades ? totalGanado * CONSTANTS.PRIMA : 0;
    const prov2daPrima = provisions.segundoAguinaldo ? totalGanado * CONSTANTS.PRIMA : 0;
    
    const totalProvisiones = provAguinaldo + provIndemnizacion + provPrima + prov2daPrima;

    const costoMensual = totalGanado + totalPatronal + totalProvisiones;

    // Acumuladores Generales
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
      totalGanado,
      aportePatronal: totalPatronal,
      provisiones: totalProvisiones,
      costoTotalMensual: costoMensual
    };
  });

  return {
    summary: {
      totalCostoLaboral: totals.costoLaboralMensual,
      totalLiquido: totals.totalGanado * 0.8729, // Aprox líquido (menos 12.71% laboral)
      totalPatronal: totals.aportesPatronales,
      totalProvisiones: totals.provisiones,
      count: totals.count
    },
    details: employees,
    employeeCount: employees.length
  };
};

// ============================================================================
// 5. ANALYTICS (PRECIERRE & PREDICTIVO)
// ============================================================================

export const analyzePrecierre = (periodsData) => {
    // Protección contra datos insuficientes
    if(!periodsData || periodsData.length < 2) return null;
    
    // Ordenar y tomar los dos últimos periodos
    const sorted = [...periodsData].sort((a,b) => (a.year*100+a.month) - (b.year*100+b.month));
    const current = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];

    const currEmps = current.results.details;
    const prevEmps = prev.results.details;

    // Generar comparativa global
    const generalDiff = {
        totalPrevious: prev.results.summary.totalCostoLaboral,
        totalCurrent: current.results.summary.totalCostoLaboral,
        absolute: current.results.summary.totalCostoLaboral - prev.results.summary.totalCostoLaboral,
        percentage: ((current.results.summary.totalCostoLaboral - prev.results.summary.totalCostoLaboral) / prev.results.summary.totalCostoLaboral) * 100
    };

    const alerts = [];
    if (Math.abs(generalDiff.percentage) > 5) {
        alerts.push({ type: 'Variación Alta', message: `El costo laboral varió un ${generalDiff.percentage.toFixed(2)}% respecto al mes anterior.` });
    }

    // Mapa hash para comparar empleados
    const getKey = (e) => normalizeText(e.nombre);
    const prevMap = new Map();
    prevEmps.forEach(e => prevMap.set(getKey(e), e));

    const variaciones = [];

    currEmps.forEach(curr => {
        const key = getKey(curr);
        const previous = prevMap.get(key);

        if(previous) {
            const diff = curr.costoTotalMensual - previous.costoTotalMensual;
            if(Math.abs(diff) > 10) { // Variación mayor a 10 Bs
                variaciones.push({
                    nombre: curr.nombre,
                    diff: diff,
                    pct: (diff / previous.costoTotalMensual) * 100
                });
            }
        }
    });

    return {
        generalDiff,
        alerts,
        variations: variaciones
    };
};

export const analyzePeriods = (periodsData, absenceData) => {
    // Ordenar periodos
    const sortedPeriods = [...periodsData].sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
    
    // Datos para gráfica de tendencias
    const trendData = sortedPeriods.map(p => ({
        monthName: `${MONTHS[p.month-1]}`,
        costoTotal: p.results.summary.totalCostoLaboral,
        headcount: p.results.employeeCount,
        isProjection: false
    }));

    // Proyección simple (Mes siguiente = promedio ultimos 3)
    if (trendData.length > 0) {
        const last3 = trendData.slice(-3);
        const avgCost = last3.reduce((sum, item) => sum + item.costoTotal, 0) / last3.length;
        trendData.push({
            monthName: 'Proyección',
            costoTotal: avgCost,
            isProjection: true
        });
    }

    // Análisis Bradford (Ausentismo)
    let bradford = [];
    if (absenceData) {
        // Agrupar ausencias por empleado
        const absenceMap = {}; // { nombre: { S: 0, D: 0 } }
        
        absenceData.forEach(abs => {
            const key = normalizeText(abs.nombre);
            if (!absenceMap[key]) absenceMap[key] = { spells: 0, days: 0, realName: abs.nombre };
            
            absenceMap[key].spells += 1; // Frecuencia (S)
            absenceMap[key].days += abs.dias; // Días totales (D)
        });

        // Calcular Fórmula B = S² x D
        bradford = Object.values(absenceMap).map(item => ({
            nombre: item.realName,
            frecuencia: item.spells,
            dias: item.days,
            score: (item.spells * item.spells) * item.days
        })).sort((a,b) => b.score - a.score).slice(0, 5); // Top 5
    }

    return {
        trendData,
        bradford
    };
};

// ============================================================================
// 6. EXPORTACIÓN
// ============================================================================

export const exportToExcel = (data, fileName = 'Reporte') => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};