import React from 'react';
import {
  History,
  X,
  Calendar,
  Calculator,
  Palmtree,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { CalculationHistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CalculationHistoryItem[];
  onClearHistory?: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const getTypeBadge = (type: CalculationHistoryItem['type']) => {
    switch (type) {
      case 'mensal':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <Calculator className="w-3 h-3" />
            <span>Mês Líquido</span>
          </span>
        );
      case 'ferias':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            <Palmtree className="w-3 h-3" />
            <span>Férias</span>
          </span>
        );
      case 'rescisao':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
            <FileSpreadsheet className="w-3 h-3" />
            <span>Rescisão</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-fadeIn my-8">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Histórico de Simulações Salvas</h3>
              <p className="text-xs text-slate-400">Cofre de relatórios calculados do trabalhador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <History className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Nenhuma simulação salva ainda.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Realize simulações nos módulos do Mês, Férias ou Rescisão e clique no botão "Salvar Simulação" para guardá-las aqui.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getTypeBadge(item.type)}
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>
                      {new Date(item.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor Principal</span>
                  <span className="text-base font-black text-slate-900">
                    R$ {item.valorLiquidoPrincipal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
          <p className="text-xs text-slate-500">Total: {history.length} registros no cofre</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
