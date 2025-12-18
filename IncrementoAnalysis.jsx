import React, { useState } from 'react';
import { 
  TrendingUp, ArrowUpCircle, ArrowDownCircle, Users, DollarSign, 
  Building2, PieChart, FileSpreadsheet, FileText, AlertTriangle,
  Check, ChevronDown, ChevronUp, Sparkles, Target
} from 'lucide-react';
import { formatCurrency, formatPercent, exportReportPDF, exportToExcel } from './utils';
import * as XLSX from 'xlsx';

const IncrementoAnalysis = ({ analysis, onNewAnalysis }) => {
  const { baseline, simulated, comparison } = analysis;
  const [expandedRow, setExpandedRow] = useState(null);
  const [filtroNivel, setFiltroNivel] = useState('Todos');
  const [filtroImpacto, setFiltroImpacto] = useState('Todos'); // Todos, Con Incremento, Nivelados por SMN

  // Filtrar datos simulados
  const filteredData = simulated.filter(emp => {
    if (filtroNivel !== 'Todos' && emp.nivel !== filtroNivel) return false;
    if (filtroImpacto === 'Con Incremento' && !emp.recibeIncremento) return false;
    if (filtroImpacto === 'Nivelados por SMN' && !emp.tocoElPiso) return false;
    return true;
  });

  // Obtener niveles únicos
  const nivelesUnicos = ['Todos', ...new Set(simulated.map(e => e.nivel))].sort();

  // Exportar a Excel con formato completo
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen Ejecutivo
    const summaryData = [
      ['ANÁLISIS DE IMPACTO - INCREMENTO SALARIAL 2026'],
      [''],
      ['PARÁMETROS DE SIMULACIÓN'],
      ['Nuevo SMN', formatCurrency(comparison.params.nuevoSMN)],
      ['% Incremento Gobierno', `${comparison.params.pctGobierno}%`],
      ['% Incremento Empresa', `${comparison.params.pctEmpresa}%`],
      ['% Incremento Total', `${comparison.params.pctGobierno + comparison.params.pctEmpresa}%`],
      ['Niveles con Incremento', comparison.nivelesAplicados.join(', ')],
      [''],
      ['RESUMEN GLOBAL'],
      ['Total Empleados', comparison.totalEmpleados],
      ['Empleados con Incremento Porcentual', comparison.empleadosConIncremento],
      ['Empleados Nivelados por SMN', comparison.niveladosPorSMN],
      [''],
      ['COMPARATIVO DE COSTOS'],
      ['', 'ACTUAL', 'PROYECTADO 2026', 'DELTA', '% VARIACIÓN'],
      ['Masa Salarial', comparison.ganadoActual, comparison.ganadoNuevo, comparison.deltaGanado, `${((comparison.deltaGanado/comparison.ganadoActual)*100).toFixed(2)}%`],
      ['Cargas Patronales (17.21%)', comparison.patronalActual, comparison.patronalNuevo, comparison.deltaPatronal, `${((comparison.deltaPatronal/comparison.patronalActual)*100).toFixed(2)}%`],
      ['Provisiones', comparison.provisionesActual, comparison.provisionesNuevo, comparison.deltaProvisiones, `${((comparison.deltaProvisiones/comparison.provisionesActual)*100).toFixed(2)}%`],
      ['COSTO TOTAL EMPRESA', comparison.costoActual, comparison.costoNuevo, comparison.impactoTotal, `${comparison.pctImpacto.toFixed(2)}%`],
      [''],
      ['IMPACTO ECONÓMICO MENSUAL', formatCurrency(comparison.impactoTotal)],
      ['IMPACTO ECONÓMICO ANUAL (x13)', formatCurrency(comparison.impactoTotal * 13)]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Ejecutivo');

    // Hoja 2: Detalle Comparativo por Empleado
    const detailData = simulated.map(d => ({
      'CI': d.ci,
      'Nombre': d.nombre,
      'Cargo': d.cargo,
      'Nivel': d.nivel,
      'Área': d.area,
      'Regional': d.regional,
      '': '', // Separador visual
      'Haber Básico ACTUAL': d.haberBasicoActual,
      'Haber Básico NUEVO': d.haberBasicoNuevo,
      'Δ Haber Básico': d.deltaHaber,
      '% Var Haber': d.haberBasicoActual > 0 ? `${((d.deltaHaber/d.haberBasicoActual)*100).toFixed(2)}%` : '0%',
      '  ': '', // Separador
      'Bono Antigüedad ACTUAL': d.bonoAntiguedadActual,
      'Bono Antigüedad NUEVO': d.bonoAntiguedadNuevo,
      'Δ Antigüedad': d.deltaAntiguedad,
      '   ': '', // Separador
      'Otros Bonos (FIJOS)': d.otrosBonos,
      '    ': '', // Separador
      'Total Ganado ACTUAL': d.totalGanadoActual,
      'Total Ganado NUEVO': d.totalGanadoNuevo,
      'Δ Total Ganado': d.deltaTotalGanado,
      '% Var Ganado': `${d.pctVariacionGanado.toFixed(2)}%`,
      '     ': '', // Separador
      'Costo Total ACTUAL': d.costoTotalActual,
      'Costo Total NUEVO': d.costoTotalNuevo,
      'Δ Costo Total': d.deltaCostoTotal,
      '% Var Costo': `${d.pctVariacionCosto.toFixed(2)}%`,
      '      ': '', // Separador
      'Recibe Incremento %': d.recibeIncremento ? 'SÍ' : 'NO',
      'Nivelado por SMN': d.tocoElPiso ? 'SÍ' : 'NO'
    }));
    const ws2 = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Personal');

    // Hoja 3: Top 20 Mayores Impactos
    const topImpacts = [...simulated]
      .sort((a, b) => b.deltaCostoTotal - a.deltaCostoTotal)
      .slice(0, 20)
      .map((d, i) => ({
        'Ranking': i + 1,
        'Nombre': d.nombre,
        'Cargo': d.cargo,
        'Nivel': d.nivel,
        'Costo Actual': d.costoTotalActual,
        'Costo Nuevo': d.costoTotalNuevo,
        'Impacto (BOB)': d.deltaCostoTotal,
        '% Incremento': `${d.pctVariacionCosto.toFixed(2)}%`,
        'Motivo': d.tocoElPiso ? 'Nivelado por SMN' : d.recibeIncremento ? 'Incremento Porcentual' : 'Solo Antigüedad'
      }));
    const ws3 = XLSX.utils.json_to_sheet(topImpacts);
    XLSX.utils.book_append_sheet(wb, ws3, 'Top 20 Impactos');

    // Hoja 4: Análisis por Nivel
    const porNivel = {};
    simulated.forEach(emp => {
      if (!porNivel[emp.nivel]) {
        porNivel[emp.nivel] = {
          count: 0,
          costoActual: 0,
          costoNuevo: 0,
          conIncremento: 0,
          niveladosSMN: 0
        };
      }
      porNivel[emp.nivel].count++;
      porNivel[emp.nivel].costoActual += emp.costoTotalActual;
      porNivel[emp.nivel].costoNuevo += emp.costoTotalNuevo;
      if (emp.recibeIncremento) porNivel[emp.nivel].conIncremento++;
      if (emp.tocoElPiso) porNivel[emp.nivel].niveladosSMN++;
    });

    const nivelData = Object.entries(porNivel).map(([nivel, data]) => ({
      'Nivel': nivel,
      'Empleados': data.count,
      'Con Incremento %': data.conIncremento,
      'Nivelados SMN': data.niveladosSMN,
      'Costo Actual': data.costoActual,
      'Costo Nuevo': data.costoNuevo,
      'Delta': data.costoNuevo - data.costoActual,
      '% Impacto': data.costoActual > 0 ? `${(((data.costoNuevo - data.costoActual)/data.costoActual)*100).toFixed(2)}%` : '0%'
    }));
    const ws4 = XLSX.utils.json_to_sheet(nivelData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Análisis por Nivel');

    XLSX.writeFile(wb, 'Analisis_Incremento_2026_Completo.xlsx');
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    const headers = ['Nombre', 'Cargo', 'Nivel', 'Ganado Actual', 'Ganado Nuevo', 'Δ Total', '% Var', 'Impacto'];
    const rows = simulated.map(d => [
      d.nombre,
      d.cargo,
      d.nivel,
      formatCurrency(d.totalGanadoActual),
      formatCurrency(d.totalGanadoNuevo),
      formatCurrency(d.deltaTotalGanado),
      `${d.pctVariacionGanado.toFixed(1)}%`,
      formatCurrency(d.deltaCostoTotal)
    ]);
    exportReportPDF('Analisis_Incremento_2026', headers, rows);
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-purple-600" />
            Análisis de Incremento 2026
          </h2>
          <p className="text-lg text-slate-500">{comparison.totalEmpleados} empleados procesados</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onNewAnalysis} 
            className="px-5 py-2.5 border-2 border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all"
          >
            Nueva Simulación
          </button>
          <button 
            onClick={handleExportExcel} 
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg font-medium transition-all hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={handleExportPDF} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg font-medium transition-all hover:-translate-y-0.5"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Parámetros de Simulación */}
      <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-3xl border-2 border-purple-200 shadow-lg">
        <h3 className="font-bold text-xl text-purple-900 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-600" />
          Parámetros Aplicados
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-purple-100">
            <p className="text-xs text-purple-600 font-bold mb-1">Nuevo SMN</p>
            <p className="text-lg font-bold text-purple-900">{formatCurrency(comparison.params.nuevoSMN)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-100">
            <p className="text-xs text-purple-600 font-bold mb-1">% Gobierno</p>
            <p className="text-lg font-bold text-purple-900">{comparison.params.pctGobierno}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-100">
            <p className="text-xs text-purple-600 font-bold mb-1">% Empresa</p>
            <p className="text-lg font-bold text-purple-900">{comparison.params.pctEmpresa}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-100">
            <p className="text-xs text-purple-600 font-bold mb-1">% Total</p>
            <p className="text-lg font-bold text-purple-900">{comparison.params.pctGobierno + comparison.params.pctEmpresa}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-100">
            <p className="text-xs text-purple-600 font-bold mb-1">Niveles Aplicados</p>
            <p className="text-sm font-bold text-purple-900">{comparison.nivelesAplicados.length} niveles</p>
          </div>
        </div>
      </div>

      {/* KPIs de Impacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Impacto Económico Total" 
          value={comparison.impactoTotal}
          subtitle={`${comparison.pctImpacto.toFixed(2)}% de incremento`}
          icon={DollarSign}
          gradient="from-red-500 to-red-600"
          bgLight="bg-red-50"
          textDark="text-red-900"
          border="border-red-200"
          isNegative
        />
        <KPICard 
          title="Costo Proyectado 2026" 
          value={comparison.costoNuevo}
          subtitle={`Actual: ${formatCurrency(comparison.costoActual)}`}
          icon={Building2}
          gradient="from-blue-500 to-blue-600"
          bgLight="bg-blue-50"
          textDark="text-blue-900"
          border="border-blue-200"
        />
        <KPICard 
          title="Empleados con Incremento %" 
          value={comparison.empleadosConIncremento}
          subtitle={`${((comparison.empleadosConIncremento/comparison.totalEmpleados)*100).toFixed(1)}% del total`}
          icon={Users}
          gradient="from-emerald-500 to-emerald-600"
          bgLight="bg-emerald-50"
          textDark="text-emerald-900"
          border="border-emerald-200"
          isCount
        />
        <KPICard 
          title="Nivelados por SMN" 
          value={comparison.niveladosPorSMN}
          subtitle={`Sin incremento porcentual`}
          icon={AlertTriangle}
          gradient="from-amber-500 to-amber-600"
          bgLight="bg-amber-50"
          textDark="text-amber-900"
          border="border-amber-200"
          isCount
        />
      </div>

      {/* Comparativo Detallado */}
      <div className="grid md:grid-cols-3 gap-6">
        <ComparativoCard 
          title="Masa Salarial"
          actual={comparison.ganadoActual}
          nuevo={comparison.ganadoNuevo}
          delta={comparison.deltaGanado}
          icon={DollarSign}
          color="blue"
        />
        <ComparativoCard 
          title="Cargas Patronales (17.21%)"
          actual={comparison.patronalActual}
          nuevo={comparison.patronalNuevo}
          delta={comparison.deltaPatronal}
          icon={Building2}
          color="indigo"
        />
        <ComparativoCard 
          title="Provisiones"
          actual={comparison.provisionesActual}
          nuevo={comparison.provisionesNuevo}
          delta={comparison.deltaProvisiones}
          icon={PieChart}
          color="emerald"
        />
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md">
        <h3 className="font-bold text-lg text-slate-800 mb-4">Filtros de Visualización</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Filtrar por Nivel</label>
            <select 
              value={filtroNivel} 
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
            >
              {nivelesUnicos.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Impacto</label>
            <select 
              value={filtroImpacto} 
              onChange={(e) => setFiltroImpacto(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
            >
              <option value="Todos">Todos los Empleados</option>
              <option value="Con Incremento">Solo con Incremento Porcentual</option>
              <option value="Nivelados por SMN">Solo Nivelados por SMN</option>
            </select>
          </div>
        </div>
        {(filtroNivel !== 'Todos' || filtroImpacto !== 'Todos') && (
          <div className="mt-4 flex items-center gap-2 text-sm text-purple-700 bg-purple-100 px-4 py-2 rounded-xl">
            <Check className="w-4 h-4" />
            Mostrando {filteredData.length} de {simulated.length} empleados
          </div>
        )}
      </div>

      {/* Tabla de Auditoría */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-xl text-slate-800">Detalle Comparativo por Empleado</h3>
          <p className="text-sm text-slate-500 mt-1">Vista lado a lado: Actual vs Proyectado 2026</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-xs border-b-2 border-slate-300">
              <tr>
                <th className="px-6 py-4 text-left">Empleado</th>
                <th className="px-6 py-4 text-left">Cargo / Nivel</th>
                <th className="px-6 py-4 text-right">Haber Básico</th>
                <th className="px-6 py-4 text-right">Bono Antigüedad</th>
                <th className="px-6 py-4 text-right">Total Ganado</th>
                <th className="px-6 py-4 text-right bg-slate-200">Costo Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">+</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((d, i) => (
                <React.Fragment key={i}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{d.nombre}</div>
                      <div className="text-xs text-slate-500">{d.ci || 'Sin CI'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{d.cargo}</div>
                      <div className="text-xs text-purple-600 font-bold">{d.nivel}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-medium ${d.tocoElPiso ? 'text-amber-600 bg-amber-50 px-2 py-1 rounded-lg' : 'text-slate-700'}`}>
                        {formatCurrency(d.haberBasicoActual)} → {formatCurrency(d.haberBasicoNuevo)}
                      </div>
                      {d.tocoElPiso && (
                        <div className="text-xs text-amber-600 font-bold mt-1">⚠️ Nivelado SMN</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-slate-700 text-xs">
                        {formatCurrency(d.bonoAntiguedadActual)} → {formatCurrency(d.bonoAntiguedadNuevo)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(d.totalGanadoActual)} → {formatCurrency(d.totalGanadoNuevo)}
                      </div>
                      <div className={`text-xs font-bold mt-1 ${d.deltaTotalGanado > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        +{formatCurrency(d.deltaTotalGanado)} ({d.pctVariacionGanado.toFixed(1)}%)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right bg-slate-50/50">
                      <div className="font-bold text-blue-900">
                        {formatCurrency(d.costoTotalActual)} → {formatCurrency(d.costoTotalNuevo)}
                      </div>
                      <div className="text-xs font-bold text-red-600 mt-1">
                        +{formatCurrency(d.deltaCostoTotal)} ({d.pctVariacionCosto.toFixed(1)}%)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {d.recibeIncremento && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                          <Check className="w-3 h-3" /> Incremento %
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        {expandedRow === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === i && (
                    <tr className="bg-slate-50">
                      <td colSpan="8" className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-slate-500 font-bold mb-1">Área</p>
                            <p className="text-slate-900">{d.area || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-bold mb-1">Regional</p>
                            <p className="text-slate-900">{d.regional || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-bold mb-1">Otros Bonos (Fijos)</p>
                            <p className="text-slate-900">{formatCurrency(d.otrosBonos)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-bold mb-1">Cargas Patronales</p>
                            <p className="text-slate-900">
                              {formatCurrency(d.cargasPatronalesActual)} → {formatCurrency(d.cargasPatronalesNuevo)}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon: Icon, gradient, bgLight, textDark, border, isNegative, isCount }) => (
  <div className={`${bgLight} p-6 rounded-2xl border-2 ${border} shadow-md hover:shadow-lg transition-all`}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white shadow-md`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-sm font-bold ${textDark} leading-tight flex-1`}>{title}</span>
    </div>
    <p className={`text-3xl font-extrabold ${textDark} mb-2`}>
      {isCount ? value : formatCurrency(value)}
    </p>
    <p className="text-xs text-slate-600">{subtitle}</p>
  </div>
);

const ComparativoCard = ({ title, actual, nuevo, delta, icon: Icon, color }) => {
  const pct = actual > 0 ? ((delta / actual) * 100).toFixed(2) : 0;
  const colorClass = {
    blue: 'from-blue-500 to-blue-600 border-blue-200 bg-blue-50 text-blue-900',
    indigo: 'from-indigo-500 to-indigo-600 border-indigo-200 bg-indigo-50 text-indigo-900',
    emerald: 'from-emerald-500 to-emerald-600 border-emerald-200 bg-emerald-50 text-emerald-900'
  }[color];

  return (
    <div className={`bg-white p-6 rounded-2xl border-2 ${colorClass.split(' ')[1]} shadow-md`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 bg-gradient-to-br ${colorClass.split(' ')[0]} rounded-xl flex items-center justify-center text-white`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className={`font-bold text-slate-800`}>{title}</h4>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Actual:</span>
          <span className="font-bold text-slate-900">{formatCurrency(actual)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Proyectado:</span>
          <span className="font-bold text-slate-900">{formatCurrency(nuevo)}</span>
        </div>
        <div className={`flex justify-between items-center pt-3 mt-3 border-t-2 ${colorClass.split(' ')[1]}`}>
          <span className="font-bold text-slate-700">Impacto:</span>
          <div className="text-right">
            <div className="font-bold text-red-600">+{formatCurrency(delta)}</div>
            <div className="text-xs text-red-500">+{pct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncrementoAnalysis;
