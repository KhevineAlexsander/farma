import React, { useMemo, useRef, useState } from 'react';
import { Printer, X, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { buildThermalReceiptHtml, ThermalPaperWidth } from '../../utils/thermalReceipt';

const PAPER_WIDTH_STORAGE_KEY = 'admin:thermalPaperWidth';

const readSavedPaperWidth = (): ThermalPaperWidth => {
  try {
    return localStorage.getItem(PAPER_WIDTH_STORAGE_KEY) === '58' ? 58 : 80;
  } catch {
    return 80;
  }
};

interface ThermalPrintModalProps {
  order: Order;
  onClose: () => void;
}

export const ThermalPrintModal: React.FC<ThermalPrintModalProps> = ({ order, onClose }) => {
  const { storeSettings, currentUser, showToast } = useApp();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidth>(readSavedPaperWidth);
  const [previewHeight, setPreviewHeight] = useState(420);

  const receiptHtml = useMemo(
    () => buildThermalReceiptHtml(order, { paperWidth, storeSettings, printedBy: currentUser?.name }),
    [order, paperWidth, storeSettings, currentUser?.name]
  );

  const handleChangePaperWidth = (width: ThermalPaperWidth) => {
    setPaperWidth(width);
    try {
      localStorage.setItem(PAPER_WIDTH_STORAGE_KEY, String(width));
    } catch {
      // Preferência apenas local; segue sem salvar
    }
  };

  const handlePreviewLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) setPreviewHeight(doc.documentElement.scrollHeight);
  };

  // A prévia já é o próprio documento do cupom: imprime direto do iframe
  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      showToast('Erro ao preparar a impressão.');
      return;
    }
    win.focus();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-2xl max-h-[94vh] flex flex-col">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4 pr-10 shrink-0">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl sm:rounded-2xl border border-blue-500/30 shrink-0">
            <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-blue-400 font-bold uppercase tracking-wider block">
              Impressora Térmica
            </span>
            <h3 className="text-base sm:text-xl font-extrabold font-tech text-white">
              Imprimir Pedido: {order.orderNumber}
            </h3>
          </div>
        </div>

        {/* Paper Width Selector */}
        <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
          <span className="text-xs font-bold text-slate-300">Largura da bobina:</span>
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl" role="radiogroup" aria-label="Largura da bobina">
            {([80, 58] as ThermalPaperWidth[]).map((width) => (
              <button
                key={width}
                type="button"
                role="radio"
                aria-checked={paperWidth === width}
                onClick={() => handleChangePaperWidth(width)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  paperWidth === width ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {width} mm
              </button>
            ))}
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-center">
          <iframe
            ref={iframeRef}
            title={`Prévia do cupom do pedido ${order.orderNumber}`}
            srcDoc={receiptHtml}
            onLoad={handlePreviewLoad}
            className="bg-white shadow-lg shrink-0"
            style={{ width: `${paperWidth}mm`, height: `${previewHeight}px`, border: 0 }}
          />
        </div>

        <p className="mt-3 text-[11px] text-slate-400 flex items-start gap-1.5 shrink-0">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <span>
            Na janela de impressão, escolha a impressora térmica e deixe as margens em <strong>Nenhuma</strong>.
          </span>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 mt-3 border-t border-slate-800 shrink-0">
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
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[42px]"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
