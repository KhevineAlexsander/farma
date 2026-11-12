import React, { useMemo, useRef, useState } from 'react';
import { Printer, X, Info, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { buildOrderPrintHtml, ReportPrintFormat } from '../../utils/reportPrintUtils';

const ORDER_FORMAT_STORAGE_KEY = 'admin:preferredPrintFormat';

const readSavedFormat = (): ReportPrintFormat => {
  try {
    const val = localStorage.getItem(ORDER_FORMAT_STORAGE_KEY);
    if (val === 'a4' || val === '80mm' || val === '50mm') return val;
    // Retrocompatibilidade
    const legacy = localStorage.getItem('admin:thermalPaperWidth');
    if (legacy === '58') return '50mm';
    return '80mm';
  } catch {
    return '80mm';
  }
};

export interface ThermalPrintModalProps {
  order: Order;
  onClose: () => void;
  initialFormat?: ReportPrintFormat;
}

export const ThermalPrintModal: React.FC<ThermalPrintModalProps> = ({ order, onClose, initialFormat }) => {
  const { storeSettings, currentUser, showToast } = useApp();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [format, setFormat] = useState<ReportPrintFormat>(() => initialFormat || readSavedFormat());
  const [previewHeight, setPreviewHeight] = useState(450);

  const receiptHtml = useMemo(
    () => buildOrderPrintHtml(order, { storeSettings, printedBy: currentUser?.name }, format),
    [order, format, storeSettings, currentUser?.name]
  );

  const handleChangeFormat = (newFormat: ReportPrintFormat) => {
    setFormat(newFormat);
    try {
      localStorage.setItem(ORDER_FORMAT_STORAGE_KEY, newFormat);
    } catch {
      // Ignora erro de storage
    }
  };

  const handlePreviewLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) setPreviewHeight(Math.max(doc.documentElement.scrollHeight, 400));
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      showToast('Erro ao preparar a impressão.');
      return;
    }
    win.focus();
    win.print();
  };

  const getContainerWidth = () => {
    switch (format) {
      case 'a4':
        return 'w-full max-w-4xl';
      case '80mm':
        return 'w-full max-w-md';
      case '50mm':
        return 'w-full max-w-sm';
      default:
        return 'w-full max-w-md';
    }
  };

  const getIframeStyle = () => {
    switch (format) {
      case 'a4':
        return {
          width: '100%',
          minHeight: '520px',
          height: `${previewHeight}px`,
          maxWidth: '820px',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
        };
      case '80mm':
        return {
          width: '80mm',
          minHeight: '400px',
          height: `${previewHeight}px`,
          border: '1px solid #cbd5e1',
          borderRadius: '2px',
        };
      case '50mm':
        return {
          width: '54mm',
          minHeight: '380px',
          height: `${previewHeight}px`,
          border: '1px solid #cbd5e1',
          borderRadius: '2px',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative ${getContainerWidth()} bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-2xl max-h-[94vh] flex flex-col transition-all duration-300`}>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-3 pr-10 shrink-0">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
            <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-blue-400 font-bold uppercase tracking-wider block">
                Impressão de Pedido
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {format.toUpperCase()}
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-extrabold font-tech text-white">
              Pedido #{order.orderNumber}
            </h3>
          </div>
        </div>

        {/* Paper / Format Selector: A4 | 80mm | 50mm */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2 bg-slate-950/70 border border-slate-800 rounded-xl shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Formato:</span>
          </div>
          <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl" role="radiogroup" aria-label="Formato de impressão">
            <button
              type="button"
              role="radio"
              aria-checked={format === 'a4'}
              onClick={() => handleChangeFormat('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                format === 'a4' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>📄 A4</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={format === '80mm'}
              onClick={() => handleChangeFormat('80mm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                format === '80mm' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🧾 80mm</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={format === '50mm'}
              onClick={() => handleChangeFormat('50mm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                format === '50mm' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🧾 50mm</span>
            </button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="flex-1 min-h-[300px] overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex justify-center">
          <iframe
            ref={iframeRef}
            title={`Prévia do pedido ${order.orderNumber}`}
            srcDoc={receiptHtml}
            onLoad={handlePreviewLoad}
            className="bg-white shadow-lg shrink-0"
            style={getIframeStyle()}
          />
        </div>

        <p className="mt-2 text-[11px] text-slate-400 flex items-start gap-1.5 shrink-0">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <span>
            {format === 'a4'
              ? 'Dica: Você pode imprimir em folha A4 comum ou salvar em PDF como nota/comprovante de entrega.'
              : 'Dica Térmica: Deixe as margens em "Nenhuma" nas configurações da impressora térmica.'}
          </span>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 mt-2 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold min-h-[42px]"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[42px] active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Pedido ({format.toUpperCase()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
