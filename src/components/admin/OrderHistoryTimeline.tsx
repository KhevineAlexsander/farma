import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import { OrderHistoryEntry } from '../../types';
import { formatHistoryTimestamp } from '../../utils/orderHistory';

interface OrderHistoryTimelineProps {
  history?: OrderHistoryEntry[];
}

export const OrderHistoryTimeline: React.FC<OrderHistoryTimelineProps> = ({ history }) => {
  const entries = [...(history || [])].reverse(); // newest first

  return (
    <div className="p-3.5 sm:p-4 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800 mb-4 sm:mb-6">
      <h4 className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5 text-[11px] mb-3">
        <History className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
        Histórico de Alterações
        {entries.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-semibold tabular-nums">
            {entries.length}
          </span>
        )}
      </h4>

      {entries.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          Nenhuma alteração registrada ainda. As próximas mudanças neste pedido aparecerão aqui com data e hora.
        </p>
      ) : (
        <ol className="relative max-h-72 overflow-y-auto overscroll-contain pr-1 space-y-3 border-l border-slate-800 ml-1.5">
          {entries.map((entry) => (
            <li key={entry.id} className="pl-4 relative">
              <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-cyan-500" aria-hidden="true" />
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <time dateTime={entry.at} className="text-[11px] font-semibold text-slate-200 tabular-nums">
                  {formatHistoryTimestamp(entry.at)}
                </time>
                <span className="text-[11px] text-slate-500">por</span>
                <span className="text-[11px] font-semibold text-cyan-300 break-words">{entry.by}</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">{entry.action}</p>
              {entry.changes && entry.changes.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {entry.changes.map((c, i) => (
                    <li key={i} className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1 break-words">
                      <span className="text-slate-500">{c.field}:</span>
                      <span className="line-through decoration-slate-600 min-w-0 break-words">{c.from}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" aria-label="para" />
                      <span className="text-slate-200 min-w-0 break-words">{c.to}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
