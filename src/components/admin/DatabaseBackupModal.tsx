import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  RefreshCw,
  Copy,
  Check,
  X,
  Package,
  ShoppingCart,
  DollarSign,
  ShieldCheck,
  Server,
  Cloud,
  Layers,
  ArrowRight,
  FileText,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  BackupDataPayload,
  generateBackupPayload,
  downloadBackupFile,
  parseAndValidateBackupJson,
  BackupValidationResult,
} from '../../utils/backupUtils';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'export' | 'import';
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'export',
}) => {
  const {
    products,
    orders,
    storeSettings,
    financialTransactions,
    currentUser,
    showToast,
    saveEverythingToCloud,
    restoreAndDeployBackup,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>(defaultTab);

  // Export State
  const [copiedJson, setCopiedJson] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Import State
  const [importedText, setImportedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [showManualPaste, setShowManualPaste] = useState(false);

  // Progress & Execution State
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState<string>('');
  const [deployProgress, setDeployProgress] = useState<{ current: number; total: number }>({ current: 0, total: 100 });
  const [deployComplete, setDeployComplete] = useState<boolean>(false);
  const [deployResult, setDeployResult] = useState<{ productsCount: number; ordersCount: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const paidOrders = orders.filter((o) => o.status === 'Pago' || o.status === 'Entregue' || o.status === 'Enviado').length;

  // Handle Export / Download
  const handleDownloadBackup = () => {
    setIsExporting(true);
    try {
      const payload = generateBackupPayload(products, orders, {
        storeSettings,
        financialTransactions,
        userEmail: currentUser?.email,
      });

      const filename = downloadBackupFile(payload);
      showToast(`📥 Backup baixado com sucesso: ${filename}`);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao gerar arquivo de backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyBackupJson = async () => {
    try {
      const payload = generateBackupPayload(products, orders, {
        storeSettings,
        financialTransactions,
        userEmail: currentUser?.email,
      });
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedJson(true);
      showToast('📋 JSON de backup copiado para a área de transferência!');
      setTimeout(() => setCopiedJson(false), 2500);
    } catch (err) {
      console.error(err);
      showToast('Erro ao copiar JSON.');
    }
  };

  const handleQuickSyncCloud = async () => {
    setIsSyncingCloud(true);
    await saveEverythingToCloud();
    setIsSyncingCloud(false);
  };

  // Handle File Upload & Parsing
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportedText(text);
      const res = parseAndValidateBackupJson(text);
      setValidationResult(res);

      if (res.isValid && res.payload) {
        showToast(`✓ Arquivo validado: ${res.payload.products.length} produtos e ${res.payload.orders.length} pedidos encontrados!`);
      } else {
        showToast(res.error || 'Arquivo de backup inválido.');
      }
    };

    reader.onerror = () => {
      showToast('Erro ao ler arquivo.');
    };

    reader.readAsText(file);
  };

  const handleManualTextChange = (text: string) => {
    setImportedText(text);
    if (!text.trim()) {
      setValidationResult(null);
      return;
    }
    const res = parseAndValidateBackupJson(text);
    setValidationResult(res);
  };

  // Handle Deploying into Database
  const handleStartDeploy = async () => {
    if (!validationResult || !validationResult.isValid || !validationResult.payload) {
      showToast('Selecione um arquivo de backup válido primeiro.');
      return;
    }

    const { products: backupProds, orders: backupOrds } = validationResult.payload;
    const confirmMsg =
      restoreMode === 'replace'
        ? `Atenção: A implantação no modo COMPLETO irá restaurar ${backupProds.length} produtos e ${backupOrds.length} pedidos e gravá-los no Firebase Firestore e Supabase.\n\nDeseja prosseguir?`
        : `Deseja mesclar e implantar ${backupProds.length} produtos e ${backupOrds.length} pedidos no banco de dados?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsDeploying(true);
    setDeployComplete(false);
    setDeployStep('Preparando banco de dados para implantação...');

    try {
      const res = await restoreAndDeployBackup(validationResult.payload, {
        mode: restoreMode,
        onProgress: (step, current, total) => {
          setDeployStep(step);
          setDeployProgress({ current, total });
        },
      });

      if (res.success) {
        setDeployComplete(true);
        setDeployResult({
          productsCount: res.productsCount,
          ordersCount: res.ordersCount,
        });
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Erro ao implantar backup: ${err?.message || ''}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleResetImport = () => {
    setImportedText('');
    setFileName(null);
    setValidationResult(null);
    setDeployComplete(false);
    setDeployResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 text-cyan-400 border border-cyan-500/30">
              <Database className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-white font-tech tracking-wide">
                  BACKUP & RESTAURAÇÃO DO BANCO DE DADOS
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  PRODUTOS & PEDIDOS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exporte uma cópia completa de segurança ou importe e implante diretamente no Firebase Firestore e Supabase.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>1. Salvar Backup (Exportar)</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>2. Importar & Implantar no Banco</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">

          {/* ========================================================================= */}
          {/* TAB 1: EXPORT / SAVE BACKUP */}
          {/* ========================================================================= */}
          {activeTab === 'export' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Status Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-cyan-400" />
                      Produtos no Catálogo
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">ATIVOS</span>
                  </div>
                  <div className="text-2xl font-black text-white font-tech">{products.length}</div>
                  <p className="text-[10px] text-slate-400">
                    Inclui preços, dosagens, laudos HPLC e estoque
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="font-semibold flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-emerald-400" />
                      Pedidos Cadastrados
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% PRESERVADOS</span>
                  </div>
                  <div className="text-2xl font-black text-white font-tech">{orders.length}</div>
                  <p className="text-[10px] text-slate-400">
                    {paidOrders} pedidos quitados / pagos
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="font-semibold flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      Faturamento Total
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">ERP</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-tech">
                    {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Volume financeiro consolidado
                  </p>
                </div>
              </div>

              {/* Informative Guidance Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/30 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2.5 text-cyan-300 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>Por que salvar um backup periódico dos seus dados?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O arquivo de backup gerado contém <strong>toda a estrutura vital do seu e-commerce</strong> em formato JSON padronizado. Com ele em mãos, mesmo em caso de reinicialização de servidor, troca de computadores ou migração de banco de dados, você pode restaurar e reinserir todos os produtos e pedidos originais com um único clique.
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Formato .JSON Portável
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Compatível com Firebase & Supabase
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Blindagem contra Perda
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Ações de Exportação e Salvamento
                </h3>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleDownloadBackup}
                    disabled={isExporting}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    <span>BAIXAR ARQUIVO DE BACKUP (.JSON)</span>
                  </button>

                  <button
                    onClick={handleCopyBackupJson}
                    className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedJson ? 'Copiado!' : 'Copiar JSON'}</span>
                  </button>

                  <button
                    onClick={handleQuickSyncCloud}
                    disabled={isSyncingCloud}
                    className="py-3.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-500/30 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Forçar sincronização de todas as abas agora no Firebase e Supabase"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'Sincronizando...' : 'Salvar Nuvem Agora'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: IMPORT & RESTORE TO DATABASE */}
          {/* ========================================================================= */}
          {activeTab === 'import' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Deploy in progress view */}
              {isDeploying && (
                <div className="p-8 rounded-3xl bg-slate-950/90 border border-cyan-500/50 text-center space-y-5 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-tech">IMPLANTANDO NO BANCO DE DADOS</h3>
                    <p className="text-xs text-cyan-300 mt-1">{deployStep}</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden max-w-md mx-auto">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${deployProgress.total > 0 ? Math.round((deployProgress.current / deployProgress.total) * 100) : 50}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Progresso: {deployProgress.current} de {deployProgress.total} registros processados...
                  </p>
                </div>
              )}

              {/* Deploy success view */}
              {deployComplete && deployResult && (
                <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/50 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-tech">RESTAURAÇÃO & IMPLANTAÇÃO CONCLUÍDAS COM SUCESSO!</h3>
                      <p className="text-xs text-emerald-300/90">
                        Todos os dados foram gravados de forma permanente no Firebase Firestore e no Supabase.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-slate-400 block mb-0.5">Produtos Ativos Implantados</span>
                      <strong className="text-lg text-white font-tech">{deployResult.productsCount}</strong>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-slate-400 block mb-0.5">Pedidos Restaurados no Banco</span>
                      <strong className="text-lg text-emerald-400 font-tech">{deployResult.ordersCount}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={handleResetImport}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Importar Outro Arquivo
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                    >
                      Concluir e Voltar ao Painel
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Import Flow (When not deploying or completed) */}
              {!isDeploying && !deployComplete && (
                <>
                  {/* File Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                      validationResult?.isValid
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : validationResult?.error
                        ? 'border-red-500/60 bg-red-950/20'
                        : 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-950'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3 border border-cyan-500/20">
                      <FileJson className="w-7 h-7" />
                    </div>

                    <h4 className="text-sm font-bold text-white font-tech">
                      {fileName ? `Arquivo: ${fileName}` : 'SELECIONE OU ARRASTE O ARQUIVO DE BACKUP (.JSON)'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Clique para buscar o arquivo .json baixado anteriormente no seu computador.
                    </p>

                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{fileName ? 'Alterar Arquivo' : 'Escolher Arquivo .JSON'}</span>
                    </div>
                  </div>

                  {/* Manual Paste Toggle */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualPaste(!showManualPaste)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{showManualPaste ? 'Ocultar colagem manual de JSON' : 'Ou colar código JSON diretamente'}</span>
                    </button>
                    {fileName && (
                      <button
                        type="button"
                        onClick={handleResetImport}
                        className="text-slate-400 hover:text-red-400 text-xs"
                      >
                        Limpar seleção
                      </button>
                    )}
                  </div>

                  {showManualPaste && (
                    <div className="space-y-2 animate-in fade-in">
                      <label className="block text-xs font-semibold text-slate-300">
                        Cole o conteúdo do backup JSON aqui:
                      </label>
                      <textarea
                        rows={6}
                        value={importedText}
                        onChange={(e) => handleManualTextChange(e.target.value)}
                        placeholder='{"version": "2.0", "products": [...], "orders": [...]}'
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}

                  {/* Validation Summary Card */}
                  {validationResult && (
                    <div className={`p-5 rounded-2xl border space-y-4 ${
                      validationResult.isValid
                        ? 'bg-gradient-to-br from-slate-900 to-emerald-950/30 border-emerald-500/40'
                        : 'bg-red-950/20 border-red-500/40'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {validationResult.isValid ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-white font-tech">
                              {validationResult.isValid ? 'ARQUIVO DE BACKUP VÁLIDO E VERIFICADO!' : 'ERRO NA VALIDAÇÃO DO ARQUIVO'}
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5">
                              {validationResult.isValid
                                ? 'Os dados foram auditados e estão prontos para implantação no banco de dados.'
                                : validationResult.error}
                            </p>
                          </div>
                        </div>

                        {validationResult.isValid && validationResult.summary && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            PRONTO PARA IMPLANTAR
                          </span>
                        )}
                      </div>

                      {/* Content Summary */}
                      {validationResult.isValid && validationResult.summary && (
                        <div className="space-y-4 pt-2 border-t border-slate-800">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-semibold">Produtos Prontos</span>
                              <strong className="text-base text-cyan-400 font-tech">
                                {validationResult.summary.productsCount} itens
                              </strong>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-semibold">Pedidos Prontos</span>
                              <strong className="text-base text-emerald-400 font-tech">
                                {validationResult.summary.ordersCount} pedidos
                              </strong>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                              <span className="text-[10px] text-slate-400 block font-semibold">Faturamento no Backup</span>
                              <strong className="text-base text-amber-300 font-tech">
                                {validationResult.summary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </strong>
                            </div>
                          </div>

                          {/* Samples */}
                          <div className="space-y-2 text-xs">
                            <div className="text-slate-300 font-semibold text-[11px] flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Amostra de Produtos no Arquivo:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {validationResult.summary.productsSample.map((name, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                                  {name}
                                </span>
                              ))}
                              {validationResult.summary.productsCount > 5 && (
                                <span className="px-2 py-0.5 rounded-lg bg-slate-800/60 text-slate-400 text-[10px]">
                                  +{validationResult.summary.productsCount - 5} produtos adicionais
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Restore Mode Selector */}
                          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Modo de Implantação no Banco de Dados:
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label
                                onClick={() => setRestoreMode('replace')}
                                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                                  restoreMode === 'replace'
                                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="restoreMode"
                                  checked={restoreMode === 'replace'}
                                  onChange={() => setRestoreMode('replace')}
                                  className="mt-0.5 accent-cyan-400"
                                />
                                <div>
                                  <strong className="block text-xs font-bold text-white">
                                    Substituir e Restaurar Completo (Recomendado)
                                  </strong>
                                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                                    O catálogo e todos os pedidos passam a refletir fielmente o conteúdo do backup no Firebase e Supabase.
                                  </span>
                                </div>
                              </label>

                              <label
                                onClick={() => setRestoreMode('merge')}
                                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                                  restoreMode === 'merge'
                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="restoreMode"
                                  checked={restoreMode === 'merge'}
                                  onChange={() => setRestoreMode('merge')}
                                  className="mt-0.5 accent-emerald-400"
                                />
                                <div>
                                  <strong className="block text-xs font-bold text-white">
                                    Mesclar com Registros Atuais
                                  </strong>
                                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                                    Preserva os itens atuais em tela e adiciona/atualiza os produtos e pedidos que constam no backup.
                                  </span>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* Start Deploy CTA Button */}
                          <div className="pt-2">
                            <button
                              onClick={handleStartDeploy}
                              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
                            >
                              <Database className="w-5 h-5 text-slate-950" />
                              <span>RESTAURAR E IMPLANTAR NO BANCO DE DADOS AGORA</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  )}

                </>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>Persistência em Tempo Real: <strong>Firebase Firestore & Supabase</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
