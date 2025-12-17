import React from 'react';
import { Users, Scale, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatPercent } from './utils';

const EquityAnalysis = ({ analysis, onBack }) => {
  const { byGender, gap, avgM, avgF } = analysis;

  return (
    <div className="animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="w-6 h-6" /></button>
            <h2 className="text-3xl font-bold text-slate-800">Análisis de Equidad Salarial</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-3xl border shadow-sm text-center">
                <h3 className="text-lg font-bold text-slate-500 mb-2">Brecha Salarial de Género</h3>
                <div className={`text-5xl font-extrabold mb-4 ${gap > 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {formatPercent(Math.abs(gap))}
                </div>
                <p className="text-sm text-slate-400">
                    {gap > 0 ? 'Los hombres ganan más en promedio' : gap < 0 ? 'Las mujeres ganan más en promedio' : 'Equidad perfecta'}
                </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h4 className="font-bold text-blue-800 mb-1">Hombres</h4>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(avgM)}</p>
                    <p className="text-xs text-blue-600 mt-2">{byGender.M.count} empleados</p>
                </div>
                <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100">
                    <h4 className="font-bold text-pink-800 mb-1">Mujeres</h4>
                    <p className="text-2xl font-bold text-pink-900">{formatCurrency(avgF)}</p>
                    <p className="text-xs text-pink-600 mt-2">{byGender.F.count} empleadas</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default EquityAnalysis;