import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Plane, Lock, Users, Sparkles, BookOpen, DownloadCloud } from 'lucide-react';
import { PeptideVial } from './PeptideVial';
import { useApp } from '../context/AppContext';

export const HeroSection: React.FC = () => {
  const { setSelectedCategory, storeSettings, setCurrentView, showToast } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
      }
    };
    checkInstalled();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      showToast('✓ Aplicativo instalado com sucesso!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;
    if (installPrompt) {
      setIsInstalling(true);
      try {
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallPrompt(null);
          setIsInstalled(true);
          showToast('✓ Aplicativo instalado com sucesso!');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const heroShowcases = [
    {
      center: { name: 'GHK-CU', dosage: '100 MG', capColor: '#0088FF' },
      left: { name: 'KLOW', dosage: '80 MG', capColor: '#16A34A' },
      right: { name: 'MOTS-C', dosage: '40 MG', capColor: '#06B6D4' },
      tagline: 'Fórmula Padrão Ouro em Regeneração e Firmeza',
    },
    {
      center: { name: 'GLOW', dosage: '70 MG', capColor: '#EC4899' },
      left: { name: 'CAGRILINTIDE', dosage: '10 MG', capColor: '#10B981' },
      right: { name: 'TESAMORELIN', dosage: '10 MG', capColor: '#2563EB' },
      tagline: 'Definição Metabólica e Queima de Gordura Visceral',
    },
    {
      center: { name: 'SEMAX', dosage: '10 MG', capColor: '#EAB308' },
      left: { name: 'SELANK', dosage: '10 MG', capColor: '#9333EA' },
      right: { name: 'BPC-157', dosage: '10 MG', capColor: '#0284C7' },
      tagline: 'Otimização Cognitiva e Recuperação Muscular Extrema',
    },
  ];

  const currentShowcase = heroShowcases[activeSlide] || heroShowcases[0];

  const scrollToCatalog = () => {
    setSelectedCategory('Todos');
    const catalogEl = document.getElementById('catalogo');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#0B0F17] py-12 md:py-20 border-b border-slate-800/80">
      {/* High-Tech Background Glow & Mesh Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Matrix/Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* LEFT COLUMN: Heading, Subtitle, CTA */}
          <div className="lg:col-span-4 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-[0.25em] uppercase px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{storeSettings.heroTagline || 'QUALIDADE • CONFIANÇA • RESULTADOS'}</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-none">
                {storeSettings.heroTitle || 'PEPTÍDEOS'}
              </h1>
              {/* Hollow / Outline Effect for 'IMPORTADOS' */}
              <h2
                className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-none uppercase"
                style={{
                  WebkitTextStroke: '1.5px #FFFFFF',
                  color: 'transparent',
                }}
              >
                {storeSettings.heroSubtitle || 'IMPORTADOS'}
              </h2>
            </div>

            <p className="text-slate-300 text-base sm:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed font-normal">
              {storeSettings.heroDescription || 'Mais performance, saúde e bem-estar para a sua melhor versão.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <button
                onClick={scrollToCatalog}
                className="inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full bg-white text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.35)] hover:shadow-[0_0_28px_rgba(0,229,255,0.6)] hover:bg-cyan-50 hover:text-cyan-950 transition-all active:scale-95 group cursor-pointer"
              >
                <span>Ver todos os produtos</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  setCurrentView('guide');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white font-bold text-sm border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer shadow-lg shadow-cyan-950/40"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Guia Científico (E-Book)</span>
              </button>

              <button
                onClick={handleInstallClick}
                disabled={isInstalling || isInstalled}
                className={`inline-flex md:hidden items-center justify-center gap-2 px-5 py-3.5 rounded-full font-bold text-sm border transition-all cursor-pointer shadow-lg shadow-cyan-950/40 ${
                  isInstalled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default'
                    : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-300 hover:text-white border-cyan-500/40'
                }`}
              >
                {isInstalled ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>✓ Aplicativo instalado</span>
                  </>
                ) : isInstalling ? (
                  <>
                    <DownloadCloud className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>⏳ Instalando...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4 text-cyan-400 animate-bounce" />
                    <span>⬇ Instalar aplicativo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CENTER COLUMN: 3D Peptide Vials Showcase & Carousel */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center py-4 relative">
            {/* Ambient Spotlight Circle Behind Vials */}
            <div className="relative w-full max-w-[420px] flex items-end justify-center min-h-[290px]">
              
              {/* Left Secondary Vial */}
              <div className="absolute left-4 sm:left-6 bottom-2 opacity-75 scale-90 -rotate-6 transition-all duration-500 hover:opacity-100 hover:scale-95 z-0">
                <PeptideVial
                  name={currentShowcase?.left?.name || 'Peptídeo'}
                  dosage={currentShowcase?.left?.dosage || ''}
                  capColor={currentShowcase?.left?.capColor || '#16A34A'}
                  size="md"
                />
              </div>

              {/* Right Secondary Vial */}
              <div className="absolute right-4 sm:right-6 bottom-2 opacity-75 scale-90 rotate-6 transition-all duration-500 hover:opacity-100 hover:scale-95 z-0">
                <PeptideVial
                  name={currentShowcase?.right?.name || 'Peptídeo'}
                  dosage={currentShowcase?.right?.dosage || ''}
                  capColor={currentShowcase?.right?.capColor || '#06B6D4'}
                  size="md"
                />
              </div>

              {/* Primary Center Hero Vial */}
              <div className="relative z-10 scale-110 mb-2 transition-all duration-500 hover:scale-115">
                <PeptideVial
                  name={currentShowcase?.center?.name || 'GHK-CU'}
                  dosage={currentShowcase?.center?.dosage || ''}
                  capColor={currentShowcase?.center?.capColor || '#0088FF'}
                  size="lg"
                  glow={true}
                />
              </div>
            </div>

            {/* Subtle Tagline for Active Showcase */}
            <p className="mt-3 text-xs text-cyan-300/80 font-medium tracking-wide text-center">
              {currentShowcase.tagline}
            </p>

            {/* Carousel Navigation Dots */}
            <div className="flex items-center gap-2.5 mt-4">
              {heroShowcases.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`transition-all rounded-full ${
                    activeSlide === idx
                      ? 'w-6 h-2 bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]'
                      : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: 4 Trust Badges matching image */}
          <div className="lg:col-span-3 space-y-4 lg:pl-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
              {[
                {
                  icon: ShieldCheck,
                  title: 'PRODUTOS DE ALTA QUALIDADE',
                  desc: 'Pureza > 99% comprovada via laudo HPLC e espectrometria.',
                },
                {
                  icon: Plane,
                  title: 'IMPORTAÇÃO DIRETA',
                  desc: 'Rastreabilidade fria sem intermediários ou aditivos.',
                },
                {
                  icon: Lock,
                  title: 'COMPRA SEGURA',
                  desc: 'Ambiente criptografado com seguro total de entrega.',
                },
                {
                  icon: Users,
                  title: 'ATENDIMENTO PERSONALIZADO',
                  desc: 'Consultores especializados para tirar suas dúvidas.',
                },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shrink-0 group-hover:border-cyan-400/60 group-hover:bg-cyan-950/40 transition-colors">
                    <badge.icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white tracking-wide uppercase font-tech">
                      {badge.title}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      {badge.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <DownloadCloud className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Instalar App no Celular</h3>
                  <p className="text-xs text-cyan-400 font-mono">Adicione à tela inicial em segundos</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-xs uppercase font-tech tracking-wide text-cyan-300">
                  <span>🤖 Android (Google Chrome / Samsung)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  1. Toque no menu de <b>três pontinhos</b> (canto superior direito do navegador).<br/>
                  2. Selecione <b>"Adicionar à tela inicial"</b> ou <b>"Instalar aplicativo"</b>.<br/>
                  3. Confirme para criar o atalho na sua tela principal.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-xs uppercase font-tech tracking-wide text-blue-300">
                  <span>🍏 iPhone / iPad (Safari)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  1. Toque no botão de <b>Compartilhar</b> (quadrado com seta para cima na barra inferior).<br/>
                  2. Role para baixo e toque em <b>"Adicionar à Tela de Início"</b>.<br/>
                  3. Toque em <b>"Adicionar"</b> no canto superior direito.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
            >
              Entendido, obrigado!
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
