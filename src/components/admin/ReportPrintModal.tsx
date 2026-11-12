import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Printer, X, Info, FileText, Check } from 'lucide-react';
import { ReportPrintFormat } from '../../utils/reportPrintUtils';
import { useApp } from '../../context/AppContext';

const REPORT_FORMAT_STORAGE_KEY = 'admin:preferredPrintFormat';

const readSavedFormat = (): ReportPrintFormat => {
  try {
    const val = localStorage.getItem(REPORT_FORMAT_STORAGE_KEY);
    if (val === 'a4' || val === '80mm' || val === '50mm') return val;
    return 'a4';
  } catch {
    return 'a4';
  }
};

export interface ReportPrintModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  generateHtml: (format: ReportPrintFormat) => string;
  initialFormat?: ReportPrintFormat;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  title,
  subtitle,
  onClose,
  generateHtml,
  initialFormat,
}) => {
  const { showToast } = useApp();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [format, setFormat] = useState<ReportPrintFormat>(() => initialFormat || readSavedFormat());
  const [previewHeight, setPreviewHeight] = useState(500);

  const reportHtml = useMemo(() => {
    return generateHtml(format);
  }, [generateHtml, format]);

  const handleChangeFormat = (newFormat: ReportPrintFormat) => {
    setFormat(newFormat);
    try {
      localStorage.setItem(REPORT_FORMAT_STORAGE_KEY, newFormat);
    } catch {
      // Ignora erro de storage
    }
  };

  const handlePreviewLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        setPreviewHeight(Math.max(doc.documentElement.scrollHeight, 400));
      }
    } catch {
      // safe fallback
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

  // Preview sizing
  const getContainerWidth = () => {
    switch (format) {
      case 'a4':
        return 'w-full max-w-4xl';
      case '80mm':
        return 'w-full max-w-md';
      case '50mm':
        return 'w-full max-w-sm';
      default:
        return 'w-full max-w-2xl';
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
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-3 pr-10 shrink-0">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
            <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-blue-400 font-bold uppercase tracking-wider block">
                Central de Impressão
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {format.toUpperCase()}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white font-tech leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Format Selector: A4 | 80mm | 50mm */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2 bg-slate-950/70 border border-slate-800 rounded-xl shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Formato de Impressão:</span>
          </div>

          <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl" role="radiogroup" aria-label="Formato de impressão">
            <button
              type="button"
              role="radio"
              aria-checked={format === 'a4'}
              onClick={() => handleChangeFormat('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                format === 'a4'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>📄 A4 (Folha Inteira)</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={format === '80mm'}
              onClick={() => handleChangeFormat('80mm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                format === '80mm'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🧾 80mm (Bobina Padrão)</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={format === '50mm'}
              onClick={() => handleChangeFormat('50mm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                format === '50mm'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🧾 50mm (Bobina Estreita)</span>
            </button>
          </div>
        </div>

        {/* Live Preview Frame */}
        <div className="flex-1 min-h-[300px] overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex justify-center">
          <iframe
            ref={iframeRef}
            title={title}
            srcDoc={reportHtml}
            onLoad={handlePreviewLoad}
            className="bg-white shadow-xl shrink-0"
            style={getIframeStyle()}
          />
        </div>

        {/* Guidance tip */}
        <p className="mt-2 text-[11px] text-slate-400 flex items-start gap-1.5 shrink-0">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <span>
            {format === 'a4'
              ? 'Dica A4: Na janela de impressão, você pode selecionar sua impressora convencional ou a opção "Salvar como PDF".'
              : 'Dica Térmica: Na janela de impressão, escolha sua impressora térmica e deixe as margens em "Nenhuma" para o melhor alinhamento.'}
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
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[42px] active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir ({format.toUpperCase()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

