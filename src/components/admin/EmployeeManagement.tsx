import React, { useState } from 'react';
import { Users, UserPlus, Edit2, Trash2, Shield, CheckCircle, XCircle, Search, Key, ShieldCheck, Mail, Phone, Calendar, Eye, EyeOff, RefreshCw, Copy, Check, UploadCloud } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';

export const EmployeeManagement: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, clearAllEmployees, currentUser, showToast, saveAllEmployeesToCloud } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleSaveStaffToCloud = async () => {
    setIsSavingStaff(true);
    const success = await saveAllEmployeesToCloud();
    setIsSavingStaff(false);
    if (success) {
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  // In-App Deletion & Wipe Confirmation State (replaces blocked window.confirm)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Atendente de Vendas');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [empId: string]: boolean }>({});
  const [copiedEmpId, setCopiedEmpId] = useState<string | null>(null);

  const [permissions, setPermissions] = useState({
    canManageProducts: false,
    canManageOrders: true,
    canManageFinances: false,
    canManageStaff: false,
    canManageSettings: false,
  });

  const roles = [
    'Administrador Geral',
    'Gerente de Produtos',
    'Atendente de Vendas',
    'Farmacêutico Responsável',
    'Financeiro',
  ];

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let generated = 'Pep#';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return generated;
  };

  const handleOpenCreate = () => {
    setEditingEmp(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword(generateRandomPassword());
    setShowPassword(true);
    setRole('Atendente de Vendas');
    setStatus('Ativo');
    setPermissions({
      canManageProducts: false,
      canManageOrders: true,
      canManageFinances: false,
      canManageStaff: false,
      canManageSettings: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setPassword(emp.password || 'pep@2026');
    setShowPassword(false);
    setRole(emp.role);
    setStatus(emp.status);
    setPermissions({ ...emp.permissions });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Por favor, preencha o nome e o e-mail do funcionário.');
      return;
    }

    if (!password.trim()) {
      showToast('Por favor, defina uma senha de acesso para o funcionário.');
      return;
    }

    if (password.trim().length < 6) {
      showToast('A senha de acesso deve conter pelo menos 6 caracteres por segurança.');
      return;
    }

    if (editingEmp) {
      updateEmployee(editingEmp.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim(),
        role,
        status,
        permissions,
      });
    } else {
      addEmployee({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password.trim(),
        role,
        status,
        permissions,
      });
    }

    setIsModalOpen(false);
  };

  const toggleCardPassword = (empId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const copyCredentials = (emp: Employee) => {
    const text = `Acesso Painel Peptide Imports Farma:\nE-mail: ${emp.email}\nSenha: ${emp.password || 'pep@2026'}`;
    navigator.clipboard.writeText(text);
    setCopiedEmpId(emp.id);
    showToast(`Credenciais de ${emp.name} copiadas!`);
    setTimeout(() => setCopiedEmpId(null), 2500);
  };

  const confirmDeleteEmployee = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  const confirmWipeAll = async () => {
    await clearAllEmployees();
    setShowWipeConfirm(false);
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.role || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'Todos' || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-tech flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyan-400" />
            GESTÃO DE ACESSO & FUNCIONÁRIOS
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre sua equipe e administradores no site com persistência em nuvem (Firebase). Os colaboradores usam seu e-mail e senha cadastrados para acessar o sistema diretamente pela aba "Equipe & Admin" na tela de login.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {employees.length > 0 && (
            <button
              onClick={() => setShowWipeConfirm(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs transition-all cursor-pointer"
              title="Excluir todos os funcionários cadastrados de uma só vez"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Todos os Usuários</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Funcionário</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cargo..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
          <span className="text-slate-400 text-xs shrink-0">Filtrar cargo:</span>
          {['Todos', ...roles].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                roleFilter === r
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Master Admin Card - VISIBLE ONLY TO THE MASTER ADMIN (khevineoliveira@gmail.com) */}
      {currentUser?.email?.toLowerCase().trim() === 'khevineoliveira@gmail.com' && (
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-cyan-500/20">
                KO
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-tech">Khevine Oliveira</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950">
                    ADM MASTER
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Acesso Total Exclusivo
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-cyan-400 font-mono">khevineoliveira@gmail.com</span>
                  <span className="text-slate-400">Senha Master: <span className="font-mono text-slate-200">Aa88176895</span></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText('khevineoliveira@gmail.com\nAa88176895');
                  showToast('Credenciais do Admin Master copiadas!');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Copiar Acesso Master
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Grid or Empty State */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold font-tech text-white mb-1">
            {searchTerm || roleFilter !== 'Todos'
              ? 'Nenhum funcionário encontrado para estes filtros'
              : 'Nenhum funcionário cadastrado na equipe'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
            {searchTerm || roleFilter !== 'Todos'
              ? 'Tente ajustar os termos de pesquisa ou remover os filtros de cargo.'
              : 'Cadastre os membros reais da sua equipe com seus respectivos e-mails corporativos, senhas de acesso e níveis de permissão.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Funcionário</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                {/* Header card info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-sm font-tech">
                      {(emp.name || 'F').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{emp.name || 'Funcionário'}</h3>
                      <span className="text-[11px] text-cyan-400 font-semibold">{emp.role || 'Operador'}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      emp.status === 'Ativo'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-slate-400 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <p className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{emp.phone || 'Sem telefone'}</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Cadastrado em: {emp.createdAt}</span>
                  </p>
                </div>

                {/* Password & Credential Box */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs mb-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] text-slate-400">Senha:</span>
                    <span className="font-mono text-xs text-amber-300 font-bold tracking-wider">
                      {visiblePasswords[emp.id] ? (emp.password || 'pep@2026') : '••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleCardPassword(emp.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title={visiblePasswords[emp.id] ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {visiblePasswords[emp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyCredentials(emp)}
                      className="p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Copiar dados de acesso (E-mail e Senha)"
                    >
                      {copiedEmpId === emp.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Badges of permissions */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Abas Liberadas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {emp.permissions.canManageOrders && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-blue-500/15 text-blue-300 border-blue-500/30">
                        Pedidos & Baixas
                      </span>
                    )}
                    {emp.permissions.canManageProducts && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
                        Produtos & Catálogo
                      </span>
                    )}
                    {emp.permissions.canManageFinances && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                        Financeiro
                      </span>
                    )}
                    {emp.permissions.canManageStaff && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-purple-500/15 text-purple-300 border-purple-500/30">
                        Equipe
                      </span>
                    )}
                    {emp.permissions.canManageSettings && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-amber-500/15 text-amber-300 border-amber-500/30">
                        Loja & WhatsApp
                      </span>
                    )}
                    {!emp.permissions.canManageOrders &&
                      !emp.permissions.canManageProducts &&
                      !emp.permissions.canManageFinances &&
                      !emp.permissions.canManageStaff &&
                      !emp.permissions.canManageSettings && (
                        <span className="text-[11px] text-slate-500 italic">
                          Nenhuma aba liberada (acesso restrito)
                        </span>
                      )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => setEmployeeToDelete(emp)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-App Confirmation Modal: Delete Single Employee */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold font-tech text-white">REMOVER FUNCIONÁRIO</h3>
              <p className="text-xs text-slate-300">
                Tem certeza que deseja remover o acesso de <strong className="text-white">"{employeeToDelete.name || 'Funcionário'}"</strong> (<span className="text-cyan-400">{employeeToDelete.email || ''}</span>)?
              </p>
              <p className="text-[11px] text-slate-500">
                O acesso deste colaborador ao painel administrativo será revogado imediatamente.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteEmployee}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/20 cursor-pointer transition-all"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Wipe All Employees */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold font-tech text-white">LIMPAR TODOS OS FUNCIONÁRIOS</h3>
              <p className="text-xs text-slate-300">
                Deseja apagar todos os <strong className="text-white">{employees.length}</strong> funcionários e contas de teste cadastradas no sistema?
              </p>
              <p className="text-[11px] text-amber-400 font-medium">
                (O seu acesso de Administrador Master continuará intacto).
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmWipeAll}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/20 cursor-pointer transition-all"
              >
                Limpar Todos Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                  {editingEmp ? 'Atualizar Cadastro' : 'Novo Funcionário'}
                </span>
                <h3 className="text-xl font-extrabold font-tech text-white">
                  {editingEmp ? 'EDITAR FUNCIONÁRIO' : 'CADASTRAR FUNCIONÁRIO'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: carlos@peptideimports.com.br"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Senha de Acesso com Gerador e Visualizador */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Senha de Acesso ao Painel *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPassword(generateRandomPassword());
                        setShowPassword(true);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Gerar Senha Segura</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Defina a senha de acesso..."
                      className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    O funcionário usará este e-mail e senha para realizar login e acessar os módulos permitidos.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cargo / Função</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status da Conta</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'Ativo'}
                      onChange={() => setStatus('Ativo')}
                      className="accent-cyan-500"
                    />
                    <span>Ativo (Pode acessar o painel)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'Inativo'}
                      onChange={() => setStatus('Inativo')}
                      className="accent-red-500"
                    />
                    <span>Inativo (Acesso bloqueado)</span>
                  </label>
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Módulos e Permissões de Acesso
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={permissions.canManageOrders}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageOrders: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Gestão de Pedidos & Baixas</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={permissions.canManageProducts}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageProducts: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Criar/Editar Produtos & Promoções</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={permissions.canManageFinances}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageFinances: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Visualizar Finanças & DRE</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={permissions.canManageStaff}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageStaff: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Gerenciar Equipe / Funcionários</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={permissions.canManageSettings}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageSettings: e.target.checked })
                      }
                      className="accent-cyan-500 rounded"
                    />
                    <span className="text-slate-200">Editar WhatsApp & Textos da Loja</span>
                  </label>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{editingEmp ? 'Salvar no Banco & Atualizar Acessos' : 'Salvar no Banco & Liberar Acesso'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
