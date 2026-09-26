import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Flame,
  Droplets,
  Apple,
  Utensils,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Syringe,
  Dna,
  ShieldCheck,
  Zap,
  Info,
  Scale,
  Lock,
  ArrowLeft,
  User,
  Mail,
  Bookmark,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal: 'cafe' | 'almoco' | 'lanche' | 'jantar';
}

interface InjectionLog {
  id: string;
  date: string;
  time: string;
  peptideName: string;
  dosage: string;
  site: string;
  notes?: string;
}

const PEPTIDE_QUICK_FOODS = [
  { name: 'Whey Protein Isolado (30g)', calories: 120, protein: 26, carbs: 1, fats: 0.5 },
  { name: 'Filé de Frango Grelhado (150g)', calories: 240, protein: 46, carbs: 0, fats: 4.5 },
  { name: '2 Ovos Inteiros Cozidos', calories: 140, protein: 12, carbs: 1, fats: 10 },
  { name: 'Patinho Moído Grelhado (150g)', calories: 270, protein: 48, carbs: 0, fats: 8 },
  { name: 'Iogurte Grego / Desnatado (150g)', calories: 95, protein: 12, carbs: 8, fats: 0 },
  { name: 'Porção de Aveia em Flocos (30g)', calories: 110, protein: 4, carbs: 19, fats: 2 },
  { name: 'Arroz Branco ou Integral (100g)', calories: 130, protein: 2.5, carbs: 28, fats: 0.5 },
  { name: 'Salada Verde c/ 1 colher Azeite', calories: 115, protein: 1, carbs: 2, fats: 11 },
  { name: 'Banana Prata Média (1 un)', calories: 85, protein: 1, carbs: 22, fats: 0 },
  { name: 'Pasta de Amendoim Integral (15g)', calories: 90, protein: 4, carbs: 3, fats: 7 },
];

export const DietControlPage: React.FC = () => {
  const {
    products,
    setCurrentView,
    currentUser,
    loginWithGoogle,
    loginClientWithEmail,
    registerClientAccount,
    saveDietProfile,
    saveInjectionRecord,
    deleteInjectionRecord,
    showToast,
  } = useApp();

  // Auth gate states if not logged in
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Profile & Goal State (Persisted in localStorage and User Profile)
  const [gender, setGender] = useState<'male' | 'female'>(() => {
    return currentUser?.dietProfile?.gender || (localStorage.getItem('diet_gender') as any) || 'male';
  });
  const [age, setAge] = useState<number>(() => {
    return currentUser?.dietProfile?.age || Number(localStorage.getItem('diet_age')) || 32;
  });
  const [weightKg, setWeightKg] = useState<number>(() => {
    return currentUser?.dietProfile?.weightKg || Number(localStorage.getItem('diet_weight')) || 82;
  });
  const [heightCm, setHeightCm] = useState<number>(() => {
    return currentUser?.dietProfile?.heightCm || Number(localStorage.getItem('diet_height')) || 178;
  });
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'high'>(() => {
    return currentUser?.dietProfile?.activityLevel || (localStorage.getItem('diet_activity') as any) || 'moderate';
  });
  const [peptideProtocol, setPeptideProtocol] = useState<'glp1' | 'gh' | 'cutting' | 'longevity'>(() => {
    return currentUser?.dietProfile?.peptideProtocol || (localStorage.getItem('diet_protocol') as any) || 'glp1';
  });

  // Sync profile when currentUser updates
  useEffect(() => {
    if (currentUser?.dietProfile) {
      if (currentUser.dietProfile.gender) setGender(currentUser.dietProfile.gender);
      if (currentUser.dietProfile.age) setAge(currentUser.dietProfile.age);
      if (currentUser.dietProfile.weightKg) setWeightKg(currentUser.dietProfile.weightKg);
      if (currentUser.dietProfile.heightCm) setHeightCm(currentUser.dietProfile.heightCm);
      if (currentUser.dietProfile.activityLevel) setActivityLevel(currentUser.dietProfile.activityLevel);
      if (currentUser.dietProfile.peptideProtocol) setPeptideProtocol(currentUser.dietProfile.peptideProtocol);
    }
  }, [currentUser]);

  // Handler to persist biometrics to Firestore
  const handleSaveBiometrics = () => {
    saveDietProfile({
      gender,
      age,
      weightKg,
      heightCm,
      activityLevel,
      peptideProtocol,
    });
  };

  // Date Navigation for Log
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Food items by date (Storage: Record<dateStr, FoodItem[]>)
  const [allFoods, setAllFoods] = useState<Record<string, FoodItem[]>>(() => {
    const saved = localStorage.getItem('diet_foods_by_date');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  // Water intake by date (ml)
  const [waterByDate, setWaterByDate] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('diet_water_by_date');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  // Electrolyte check by date
  const [electrolytesByDate, setElectrolytesByDate] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('diet_electrolytes_by_date');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  // Injections Log
  const [injections, setInjections] = useState<InjectionLog[]>(() => {
    const saved = localStorage.getItem('diet_injections_log');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'inj-1',
        date: new Date().toISOString().split('T')[0],
        time: '08:00',
        peptideName: 'Tirzepatida 60 mg',
        dosage: '2.5 mg (25 UI)',
        site: 'Abdômen Direito',
        notes: 'Aplicação indolor, excelente saciedade.',
      },
    ];
  });

  // New Food Modal / Inline state
  const [foodName, setFoodName] = useState('');
  const [foodCalories, setFoodCalories] = useState<number | ''>('');
  const [foodProtein, setFoodProtein] = useState<number | ''>('');
  const [foodCarbs, setFoodCarbs] = useState<number | ''>('');
  const [foodFats, setFoodFats] = useState<number | ''>('');
  const [foodMeal, setFoodMeal] = useState<'cafe' | 'almoco' | 'lanche' | 'jantar'>('almoco');
  const [isAddingFood, setIsAddingFood] = useState(false);

  // New Injection Form State
  const [injPeptide, setInjPeptide] = useState('Tirzepatida');
  const [injDose, setInjDose] = useState('2.5 mg');
  const [injSite, setInjSite] = useState('Abdômen Direito');
  const [injTime, setInjTime] = useState('08:30');
  const [injNotes, setInjNotes] = useState('');

  // Persist Profile Settings
  useEffect(() => {
    localStorage.setItem('diet_gender', gender);
    localStorage.setItem('diet_age', age.toString());
    localStorage.setItem('diet_weight', weightKg.toString());
    localStorage.setItem('diet_height', heightCm.toString());
    localStorage.setItem('diet_activity', activityLevel);
    localStorage.setItem('diet_protocol', peptideProtocol);
  }, [gender, age, weightKg, heightCm, activityLevel, peptideProtocol]);

  // Persist Foods
  useEffect(() => {
    localStorage.setItem('diet_foods_by_date', JSON.stringify(allFoods));
  }, [allFoods]);

  // Persist Water
  useEffect(() => {
    localStorage.setItem('diet_water_by_date', JSON.stringify(waterByDate));
  }, [waterByDate]);

  // Persist Electrolytes
  useEffect(() => {
    localStorage.setItem('diet_electrolytes_by_date', JSON.stringify(electrolytesByDate));
  }, [electrolytesByDate]);

  // Persist Injections
  useEffect(() => {
    localStorage.setItem('diet_injections_log', JSON.stringify(injections));
  }, [injections]);

  // Metabolic Math (Mifflin-St Jeor Formula)
  const metabolicPlan = useMemo(() => {
    // 1. Basal Metabolic Rate (BMR)
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // 2. Activity Multiplier
    const actMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      high: 1.725,
    };
    const tdee = Math.round(bmr * (actMultipliers[activityLevel] || 1.4));

    // 3. Caloric Target & Macro Distribution based on Peptide Protocol
    let targetCalories = tdee;
    let proteinGramsPerKg = 2.0;
    let fatPercentage = 0.25;

    switch (peptideProtocol) {
      case 'glp1':
        // Mild/Moderate deficit, high protein (2.2g/kg) to shield muscle against GLP-1 catabolism
        targetCalories = Math.round(tdee - 450);
        proteinGramsPerKg = 2.2;
        fatPercentage = 0.25;
        break;

      case 'gh':
        // Muscle building surplus (+15%)
        targetCalories = Math.round(tdee + 300);
        proteinGramsPerKg = 2.0;
        fatPercentage = 0.25;
        break;

      case 'cutting':
        // AOD-9604, Retratutide, SLU: Aggressive fat burn (-500 kcal)
        targetCalories = Math.round(tdee - 500);
        proteinGramsPerKg = 2.3;
        fatPercentage = 0.22;
        break;

      case 'longevity':
        // Isocaloric, anti-inflammatory
        targetCalories = tdee;
        proteinGramsPerKg = 1.8;
        fatPercentage = 0.30;
        break;
    }

    // Minimum sanity floor for calories
    targetCalories = Math.max(targetCalories, 1300);

    const proteinGrams = Math.round(weightKg * proteinGramsPerKg);
    const proteinKcal = proteinGrams * 4;

    const fatKcal = Math.round(targetCalories * fatPercentage);
    const fatGrams = Math.round(fatKcal / 9);

    const carbKcal = Math.max(targetCalories - proteinKcal - fatKcal, 200);
    const carbGrams = Math.round(carbKcal / 4);

    // Water target: 45 ml per kg (especially important for GLP-1/Peptides)
    const waterTargetMl = Math.round(weightKg * 45);

    return {
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      proteinGrams,
      carbGrams,
      fatGrams,
      waterTargetMl,
    };
  }, [gender, age, weightKg, heightCm, activityLevel, peptideProtocol]);

  // Daily logged items for the active date
  const dayFoods = allFoods[currentDateStr] || [];
  const currentWater = waterByDate[currentDateStr] || 0;
  const currentElectrolytes = Boolean(electrolytesByDate[currentDateStr]);

  // Consumed totals today
  const consumedTotals = useMemo(() => {
    return dayFoods.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fats: acc.fats + item.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [dayFoods]);

  // Handlers for Foods
  const handleAddFoodItem = () => {
    if (!foodName.trim() || !foodCalories) {
      showToast('Preencha pelo menos o nome e as calorias do alimento.');
      return;
    }

    const newItem: FoodItem = {
      id: `food-${Date.now()}`,
      name: foodName.trim(),
      calories: Number(foodCalories) || 0,
      protein: Number(foodProtein) || 0,
      carbs: Number(foodCarbs) || 0,
      fats: Number(foodFats) || 0,
      meal: foodMeal,
    };

    setAllFoods((prev) => ({
      ...prev,
      [currentDateStr]: [...(prev[currentDateStr] || []), newItem],
    }));

    setFoodName('');
    setFoodCalories('');
    setFoodProtein('');
    setFoodCarbs('');
    setFoodFats('');
    setIsAddingFood(false);
    showToast('Alimento registrado no seu diário!');
  };

  const handleQuickAddFood = (preset: typeof PEPTIDE_QUICK_FOODS[0]) => {
    const newItem: FoodItem = {
      id: `food-${Date.now()}`,
      name: preset.name,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fats: preset.fats,
      meal: foodMeal,
    };

    setAllFoods((prev) => ({
      ...prev,
      [currentDateStr]: [...(prev[currentDateStr] || []), newItem],
    }));

    showToast(`${preset.name} adicionado ao diário!`);
  };

  const handleDeleteFood = (id: string) => {
    setAllFoods((prev) => ({
      ...prev,
      [currentDateStr]: (prev[currentDateStr] || []).filter((f) => f.id !== id),
    }));
  };

  // Water Handlers
  const handleAddWater = (ml: number) => {
    setWaterByDate((prev) => {
      const current = prev[currentDateStr] || 0;
      const updated = Math.max(current + ml, 0);
      return { ...prev, [currentDateStr]: updated };
    });
  };

  const handleToggleElectrolytes = () => {
    setElectrolytesByDate((prev) => ({
      ...prev,
      [currentDateStr]: !prev[currentDateStr],
    }));
  };

  // Injection Handlers
  const handleAddInjection = async () => {
    if (!injPeptide.trim() || !injDose.trim()) {
      showToast('Informe o nome do peptídeo e a dose.');
      return;
    }

    const newLog: InjectionLog = {
      id: `inj-${Date.now()}`,
      date: currentDateStr,
      time: injTime,
      peptideName: injPeptide,
      dosage: injDose,
      site: injSite,
      notes: injNotes,
    };

    setInjections((prev) => [newLog, ...prev]);
    await saveInjectionRecord(newLog);
    setInjNotes('');
  };

  const handleDeleteInjection = async (id: string) => {
    setInjections((prev) => prev.filter((i) => i.id !== id));
    await deleteInjectionRecord(id);
  };

  // Date Shift Helper
  const shiftDate = (days: number) => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    setCurrentDateStr(dateObj.toISOString().split('T')[0]);
  };

  // If user is not logged in, enforce authentication requirement gate
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070A10] py-16 px-4 sm:px-6 lg:px-8 text-white flex items-center justify-center pb-24">
        <div className="max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-md">
          <button
            onClick={() => setCurrentView('store')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para a Loja</span>
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-md">
              <Activity className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-tech">
              DIETA & REGISTRO DE PROTOCOLOS
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Faça login ou crie sua conta gratuita para calcular suas necessidades calóricas (TDEE), registrar refeições diárias, água, eletrólitos e salvar seu histórico de aplicações de peptídeos na nuvem.
            </p>
          </div>

          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={async () => {
              setAuthLoading(true);
              setAuthError(null);
              try {
                const res = await loginWithGoogle();
                if (!res.success) {
                  setAuthError(res.message || 'Falha na autenticação Google');
                }
              } finally {
                setAuthLoading(false);
              }
            }}
            disabled={authLoading}
            className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{authLoading ? 'Conectando...' : 'Entrar com Conta Google'}</span>
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-slate-800" />
            <span className="px-3 text-[11px] text-slate-500 font-medium">ou com e-mail</span>
            <div className="flex-1 border-t border-slate-800" />
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthError(null);
              if (!authEmail) return;
              setAuthLoading(true);
              try {
                if (authMode === 'register') {
                  const res = await registerClientAccount(authName, authEmail, authPassword, authPhone);
                  if (!res.success) setAuthError(res.message || 'Erro ao criar conta');
                } else {
                  const res = await loginClientWithEmail(authEmail, authPassword);
                  if (!res.success) setAuthError(res.message || 'Erro ao entrar');
                }
              } finally {
                setAuthLoading(false);
              }
            }}
            className="space-y-3 text-xs"
          >
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">E-mail</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Senha</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer mt-2 disabled:opacity-60"
            >
              {authLoading
                ? 'Conectando...'
                : authMode === 'register'
                ? 'CRIAR CONTA E ACESSAR DIETA'
                : 'ENTRAR E ACESSAR DIETA'}
            </button>
          </form>

          <div className="pt-4 text-center text-xs text-slate-400">
            {authMode === 'register' ? (
              <p>
                Já possui conta?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-emerald-400 font-bold hover:underline ml-1"
                >
                  Fazer Login
                </button>
              </p>
            ) : (
              <p>
                Novo usuário?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-emerald-400 font-bold hover:underline ml-1"
                >
                  Criar conta grátis
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 pb-28">
      {/* Top Banner */}
      <section className="relative overflow-hidden pt-12 pb-12 border-b border-slate-800/80 bg-gradient-to-b from-blue-950/30 via-[#0B0F17] to-[#070A10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                <span>Nutrição & Bioquímica de Resultados</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Controle de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300">Dieta & Protocolo</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Calculadora metabólica ajustada para peptídeos, registro diário de macros, blindagem contra perda de massa magra e diário de injeções.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
              <button
                onClick={() => {
                  setCurrentView('dosage-calculator');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Syringe className="w-4 h-4 text-cyan-400" />
                <span>Calcular Doses</span>
              </button>
              <button
                onClick={() => {
                  setCurrentView('benefits');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Página de Benefícios</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Section 1: Peptide Protocol Metabolic Calculator */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Passo 1: Calibre suas Metas Metabólicas
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Calculadora Nutricional de Protocolos
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              Ajustado com o modelo <strong className="text-white">Mifflin-St Jeor</strong> + Fator Incretínico
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Gender */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sexo Biológico</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none"
              >
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Idade (anos)</label>
              <input
                type="number"
                min="18"
                max="90"
                value={age}
                onChange={(e) => setAge(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Peso Atual (kg)</label>
              <input
                type="number"
                step="0.5"
                min="35"
                max="250"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Altura (cm)</label>
              <input
                type="number"
                min="120"
                max="230"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
              />
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nível de Treino</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none"
              >
                <option value="sedentary">Sedentário (sem treino)</option>
                <option value="light">Leve (1 a 2x/sem)</option>
                <option value="moderate">Moderado (3 a 5x/sem)</option>
                <option value="high">Intenso (6 a 7x/sem)</option>
              </select>
            </div>

            {/* Peptide Protocol Focus */}
            <div>
              <label className="block text-[11px] font-semibold text-emerald-400 mb-1">Protocolo Ativo</label>
              <select
                value={peptideProtocol}
                onChange={(e) => setPeptideProtocol(e.target.value as any)}
                className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold focus:outline-none"
              >
                <option value="glp1">GLP-1 (Tirzepatida/Retratutide)</option>
                <option value="gh">Secretagogo GH (CJC/Ipamorelin)</option>
                <option value="cutting">Cutting (AOD-9604/SLU)</option>
                <option value="longevity">Longevidade (NAD+/Epithalon)</option>
              </select>
            </div>
          </div>

          {/* Computed Output Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Taxa Basal (TMB)</div>
              <div className="text-lg font-black text-white mt-0.5">{metabolicPlan.bmr} kcal</div>
              <div className="text-[10px] text-slate-500">Mínimo biológico</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Gasto Total (TDEE)</div>
              <div className="text-lg font-black text-slate-300 mt-0.5">{metabolicPlan.tdee} kcal</div>
              <div className="text-[10px] text-slate-500">Com exercícios</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/40 shadow-sm">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Meta Calórica Diária</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">{metabolicPlan.targetCalories} kcal</div>
              <div className="text-[10px] text-emerald-400/80">Plano do protocolo</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-blue-500/40">
              <div className="text-[10px] text-blue-400 uppercase font-bold">Meta de Proteína</div>
              <div className="text-xl font-black text-blue-300 mt-0.5">{metabolicPlan.proteinGrams} g</div>
              <div className="text-[10px] text-slate-400">({(metabolicPlan.proteinGrams / weightKg).toFixed(1)}g/kg - músculo)</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/40">
              <div className="text-[10px] text-amber-400 uppercase font-bold">Carboidratos / Gordura</div>
              <div className="text-base font-black text-white mt-0.5">
                {metabolicPlan.carbGrams}g <span className="text-xs font-normal text-slate-400">/</span> {metabolicPlan.fatGrams}g
              </div>
              <div className="text-[10px] text-slate-400">Energia equilibrada</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-cyan-500/40">
              <div className="text-[10px] text-cyan-400 uppercase font-bold">Meta Diária de Água</div>
              <div className="text-xl font-black text-cyan-300 mt-0.5">
                {(metabolicPlan.waterTargetMl / 1000).toFixed(1)} L
              </div>
              <div className="text-[10px] text-cyan-400/80">{metabolicPlan.waterTargetMl} mL essenciais</div>
            </div>
          </div>
        </div>

        {/* Section 2: Daily Log, Macro Progress & Hydration Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Macro Rings & Daily Food Logger (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Date Selector Header */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <button
                onClick={() => shiftDate(-1)}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="Dia anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Diário Alimentar
                </div>
                <div className="text-base font-black text-white flex items-center gap-2 justify-center">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>
                    {new Date(currentDateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => shiftDate(1)}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="Próximo dia"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Daily Macro Progress Summary */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Progresso Nutricional de Hoje</span>
                <span className="text-emerald-400 font-mono">
                  {consumedTotals.calories} / {metabolicPlan.targetCalories} kcal
                </span>
              </div>

              {/* Calories Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((consumedTotals.calories / (metabolicPlan.targetCalories || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* 3 Macro Bars: Protein, Carbs, Fats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                {/* Protein */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400">Proteína</span>
                    <span className="font-mono text-white">
                      {consumedTotals.protein}g / {metabolicPlan.proteinGrams}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min((consumedTotals.protein / (metabolicPlan.proteinGrams || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Carbs */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Carboidratos</span>
                    <span className="font-mono text-white">
                      {consumedTotals.carbs}g / {metabolicPlan.carbGrams}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min((consumedTotals.carbs / (metabolicPlan.carbGrams || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Fats */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400">Gorduras</span>
                    <span className="font-mono text-white">
                      {consumedTotals.fats}g / {metabolicPlan.fatGrams}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min((consumedTotals.fats / (metabolicPlan.fatGrams || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Peptide Food Presets (1-Click Addition) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Alimentos Estratégicos para Protocolos (Adição em 1 Clique)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PEPTIDE_QUICK_FOODS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickAddFood(item)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-300 truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.calories} kcal • <strong className="text-blue-400">{item.protein}g P</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Food Form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <span>Registrar Refeição Personalizada</span>
                </div>
                <button
                  onClick={() => setIsAddingFood(!isAddingFood)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  {isAddingFood ? 'Fechar' : '+ Adicionar Alimento'}
                </button>
              </div>

              {isAddingFood && (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Nome do Alimento</label>
                    <input
                      type="text"
                      placeholder="Ex: Shake de Proteína"
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Calorias (kcal)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={foodCalories}
                      onChange={(e) => setFoodCalories(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Proteína (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={foodProtein}
                      onChange={(e) => setFoodProtein(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Carboidrato (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={foodCarbs}
                      onChange={(e) => setFoodCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleAddFoodItem}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* List of Logged Foods Today */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Refeições Registradas em {currentDateStr} ({dayFoods.length} itens)
              </h3>

              {dayFoods.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhum alimento registrado nesta data. Clique nos atalhos acima para registrar.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {dayFoods.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.calories} kcal • {item.protein}g Proteína • {item.carbs}g Carbs • {item.fats}g Gord
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteFood(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                        title="Remover alimento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Hydration, Electrolytes & Injection Log (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Water Tracker */}
            <div className="bg-gradient-to-b from-slate-900 to-[#0B0F17] border border-cyan-500/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Hidratação do Dia</h3>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {currentWater} / {metabolicPlan.waterTargetMl} mL
                </span>
              </div>

              {/* Water Progress Bar */}
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((currentWater / (metabolicPlan.waterTargetMl || 1)) * 100, 100)}%`,
                  }}
                />
              </div>

              {/* Quick Water Add Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAddWater(250)}
                  className="py-2 bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 transition-colors"
                >
                  +250 mL
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  className="py-2 bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 transition-colors"
                >
                  +500 mL
                </button>
                <button
                  onClick={() => handleAddWater(-250)}
                  className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 transition-colors"
                >
                  -250 mL
                </button>
              </div>

              {/* Electrolytes Checkbox */}
              <div
                onClick={handleToggleElectrolytes}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  currentElectrolytes
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={currentElectrolytes}
                  onChange={handleToggleElectrolytes}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">Eletrólitos Ingeridos Hoje</div>
                  <div className="text-[10px] text-slate-400">
                    Sódio, Potássio e Magnésio (previne tontura e fadiga)
                  </div>
                </div>
              </div>
            </div>

            {/* Peptide Injections Diary */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Diário de Aplicações</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {injections.length} registros
                </span>
              </div>

              {/* Log Form */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Peptídeo Aplicado</label>
                  <select
                    value={injPeptide}
                    onChange={(e) => setInjPeptide(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Tirzepatida">Tirzepatida</option>
                    <option value="Retratutide">Retratutide</option>
                    <option value="Cagrilintide">Cagrilintide</option>
                    <option value="BPC-157 + TB-500">BPC-157 + TB-500</option>
                    <option value="CJC-1295 + Ipamorelin">CJC-1295 + Ipamorelin</option>
                    <option value="AOD-9604">AOD-9604</option>
                    <option value="GHK-Cu">GHK-Cu</option>
                    <option value="Semax">Semax</option>
                    <option value="NAD+">NAD+</option>
                    <option value="Epithalon">Epithalon</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Dose Aplicada</label>
                    <input
                      type="text"
                      placeholder="Ex: 2.5 mg"
                      value={injDose}
                      onChange={(e) => setInjDose(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Local da Punção</label>
                    <select
                      value={injSite}
                      onChange={(e) => setInjSite(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Abdômen Direito">Abdômen Direito</option>
                      <option value="Abdômen Esquerdo">Abdômen Esquerdo</option>
                      <option value="Coxa Direita">Coxa Direita</option>
                      <option value="Coxa Esquerda">Coxa Esquerda</option>
                      <option value="Braço (Deltoide)">Braço (Deltoide)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Observações de Tolerância</label>
                  <input
                    type="text"
                    placeholder="Ex: Sem náusea, boa saciedade."
                    value={injNotes}
                    onChange={(e) => setInjNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleAddInjection}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Registrar Aplicação
                </button>
              </div>

              {/* Injections History */}
              <div className="pt-2 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Histórico Recente
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {injections.map((inj) => (
                    <div
                      key={inj.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>{inj.peptideName}</span>
                          <span className="text-cyan-400 font-mono text-[11px]">({inj.dosage})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {inj.date} • {inj.time} • {inj.site}
                        </div>
                        {inj.notes && (
                          <div className="text-[10px] text-slate-300 italic mt-0.5">"{inj.notes}"</div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteInjection(inj.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Excluir registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Specialized Clinical Advice Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Regras de Ouro na Dieta com Peptídeos</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
                <li>
                  • <strong className="text-slate-300">Proteína Fracionada:</strong> Consuma pelo menos 30g de proteína por refeição principal para otimizar o estímulo de síntese proteica (mTOR).
                </li>
                <li>
                  • <strong className="text-slate-300">Refluxo & GLP-1:</strong> Evite refeições volumosas até 3 horas antes de deitar, pois o esvaziamento gástrico está desacelerado.
                </li>
                <li>
                  • <strong className="text-slate-300">Timing do GH:</strong> Não consuma carboidratos de alto índice glicêmico 2h antes de aplicar CJC/Ipamorelin para evitar que a insulina bloqueie o pico somatotrófico.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
