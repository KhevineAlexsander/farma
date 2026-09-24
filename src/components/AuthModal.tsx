import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ShieldAlert, Sparkles, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DnaLogo } from './DnaLogo';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, setIsAuthOpen, loginWithGoogle, loginStaffOrAdmin, switchUserRole } = useApp();
  
  // Tabs: 'CLIENTE' (Login Google ou e-mail) | 'STAFF' (Funcionários e Administradores)
  const [activeTab, setActiveTab] = useState<'CLIENTE' | 'STAFF'>('CLIENTE');
  
  // Client state
  const [isRegister, setIsRegister] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Staff / Admin state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState<string | null>(null);

  if (!isAuthOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setStaffError(null);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setIsAuthOpen(false);
      } else {
        setStaffError(res.message || 'Falha ao autenticar com o Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail) return;
    const res = loginStaffOrAdmin(clientEmail, clientPassword || '123456');
    if (res.success) {
      setIsAuthOpen(false);
    }
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    if (!staffEmail || !staffPassword) {
      setStaffError('Preencha seu e-mail corporativo e senha cadastrada.');
      return;
    }

    const res = loginStaffOrAdmin(staffEmail, staffPassword);
    if (res.success) {
      setIsAuthOpen(false);
    } else {
      setStaffError(res.message);
    }
  };

  const handleQuickDemo = (role: 'CLIENTE' | 'ADMIN') => {
    switchUserRole(role);
    setIsAuthOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs apple-overlay-bg">
      <div
        className="relative w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 apple-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAuthOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-[#0B0F17] rounded-2xl shadow-md">
              <DnaLogo size="sm" withText={false} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-tech">
            {activeTab === 'CLIENTE' ? 'PORTAL DO CLIENTE' : 'ÁREA INTERNA ERP'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'CLIENTE'
              ? 'Acesse com sua Conta Google para acompanhar seus pedidos e laudos'
              : 'Acesso restrito para funcionários e administradores cadastrados no site'}
          </p>
        </div>

        {/* Navigation Tabs: Cliente vs Funcionários / Admin */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('CLIENTE');
              setStaffError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'CLIENTE'
                ? 'bg-white text-cyan-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sou Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('STAFF');
              setStaffError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'STAFF'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Equipe & Admin</span>
          </button>
        </div>

        {/* TAB 1: CLIENTES (Login com Google Primário) */}
        {activeTab === 'CLIENTE' && (
          <div className="space-y-4">
            {/* GOOGLE SIGN IN BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700 font-semibold text-xs tracking-wide shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Conectando ao Google...' : 'Continuar com Google'}</span>
            </button>

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="px-3 text-[11px] text-slate-400 font-medium">ou via e-mail</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Email form for client */}
            <form onSubmit={handleClientSubmit} className="space-y-3 text-xs">
              {isRegister && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer mt-2"
              >
                {isRegister ? 'CRIAR CONTA DE CLIENTE' : 'ENTRAR NA CONTA'}
              </button>
            </form>

            {/* Toggle login vs register */}
            <div className="pt-2 text-center text-xs text-slate-600">
              {isRegister ? (
                <p>
                  Já possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="text-cyan-700 font-bold hover:underline"
                  >
                    Fazer Login
                  </button>
                </p>
              ) : (
                <p>
                  Novo por aqui?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="text-cyan-700 font-bold hover:underline"
                  >
                    Criar cadastro gratuito
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FUNCIONÁRIOS E ADMINISTRADORES CADASTRADOS NO SITE */}
        {activeTab === 'STAFF' && (
          <div className="space-y-4">
            <div className="p-3 bg-cyan-50/80 border border-cyan-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-cyan-900">
              <Building2 className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Credenciais de Acesso da Equipe</p>
                <p className="text-[11px] text-cyan-800 mt-0.5">
                  Os funcionários e administradores recebem seu cadastro e senha gerados no painel interno de colaboradores.
                </p>
              </div>
            </div>

            {staffError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleStaffSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">E-mail Corporativo Cadastrado</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="nome.funcao@peptideimports.com.br"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Senha de Acesso Cadastrada</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Sua senha corporativa de acesso"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-slate-900 to-cyan-950 hover:from-slate-800 hover:to-cyan-900 text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>ACESSAR SISTEMA ERP</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
