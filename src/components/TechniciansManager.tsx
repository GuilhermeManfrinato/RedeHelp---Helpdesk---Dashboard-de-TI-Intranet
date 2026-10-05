import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  X, 
  Check, 
  User, 
  Briefcase, 
  Wrench, 
  Mail,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  History,
  Search,
  Filter,
  AlertTriangle,
  Tv,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileText,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { 
  Technician, 
  AccessibilitySettings, 
  MilitaryUser, 
  SystemAuditLog, 
  UserRole 
} from '../types';
import { api } from '../utils/api';

interface TechniciansManagerProps {
  technicians: Technician[];
  militaryUsers: MilitaryUser[];
  auditLogs: SystemAuditLog[];
  currentUser: MilitaryUser | null;
  a11y: AccessibilitySettings;
  onUpdateTechnicians: (techs: Technician[]) => void;
  onUpdateMilitaryUsers: (users: MilitaryUser[]) => void;
  onAddAuditLog: (log: Omit<SystemAuditLog, 'id' | 'timestamp'>) => void;
  onSwitchUser?: (user: MilitaryUser) => void;
}

const RANKS = [
  'Dev',
  '1º Ten',
  '2º Ten',
  'Asp',
  'Subten',
  '1º Sgt',
  '2º Sgt',
  '3º Sgt',
  'Cb',
  'Sd',
  'TI (Civil/Painel)'
];

const AVAILABLE_ROLES: UserRole[] = [
  'CH-SECINFO',
  'AUX-SECINFO',
  'CH-XERIFEINFO',
  'CH-TECNICOINFO',
  'CH-TVINFO'
];

const ROLES_INFO: Record<string, { title: string; desc: string; badgeBg: string; textCol: string; borderCol: string }> = {
  'CH-SECINFO': {
    title: 'Chefe da Seção de TI (CHSECINFO)',
    desc: 'Acesso irrestrito a todo o sistema, cautelas, chamados, logs, exclusões e gerenciamento de usuários.',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    textCol: 'text-amber-700',
    borderCol: 'border-amber-400'
  },
  'AUX-SECINFO': {
    title: 'Auxiliar da Seção de TI (AUXSECINFO)',
    desc: 'Gestão de cautelas, acompanhamento da fila de chamados, controle de presenças e apoio administrativo da Seção.',
    badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
    textCol: 'text-teal-700',
    borderCol: 'border-teal-400'
  },
  'AUXSECINFO': {
    title: 'Auxiliar da Seção de TI (AUXSECINFO)',
    desc: 'Gestão de cautelas, acompanhamento da fila de chamados, controle de presenças e apoio administrativo da Seção.',
    badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
    textCol: 'text-teal-700',
    borderCol: 'border-teal-400'
  },
  'CH-XERIFEINFO': {
    title: 'Xerife do Corpo Técnico (XERIFESECINFO)',
    desc: 'Triagem operacional, atribuição de militares nos chamados, intervenção em massa, edição de prioridades e nomes de chamados. Não exclui chamados.',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    textCol: 'text-blue-700',
    borderCol: 'border-blue-400'
  },
  'XERIFESECINFO': {
    title: 'Xerife do Corpo Técnico (XERIFESECINFO)',
    desc: 'Triagem operacional, atribuição de militares nos chamados, intervenção em massa, edição de prioridades e nomes de chamados. Não exclui chamados.',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    textCol: 'text-blue-700',
    borderCol: 'border-blue-400'
  },
  'CH-TECNICOINFO': {
    title: 'Técnico de Atendimento (TECINFO)',
    desc: 'Liberado consultar chamados, responder dúvidas dos solicitantes e movimentar blocos de status.',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    textCol: 'text-emerald-700',
    borderCol: 'border-emerald-400'
  },
  'TECINFO': {
    title: 'Técnico de Atendimento (TECINFO)',
    desc: 'Liberado consultar chamados, responder dúvidas dos solicitantes e movimentar blocos de status.',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    textCol: 'text-emerald-700',
    borderCol: 'border-emerald-400'
  },
  'CH-TVINFO': {
    title: 'Painel TV (Telão da Seção)',
    desc: 'Exibição pública em tela grande com auto-scroll. Somente visualização dos chamados, sem nenhuma interação.',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
    textCol: 'text-purple-700',
    borderCol: 'border-purple-400'
  }
};

export const TechniciansManager: React.FC<TechniciansManagerProps> = ({
  technicians,
  militaryUsers,
  auditLogs,
  currentUser,
  a11y,
  onUpdateTechnicians,
  onUpdateMilitaryUsers,
  onAddAuditLog,
  onSwitchUser,
}) => {
  // Controle de Abas: 'users' (Militares e Logins) | 'audit' (Logs do Sistema)
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');

  // Permissões do usuário atual
  const isChefe = currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'dev' || currentUser?.username === 'dev' || currentUser?.rank === 'Dev';
  const isAux = currentUser?.role === 'AUX-SECINFO' || currentUser?.role === 'AUXSECINFO';
  const isXerife = currentUser?.role === 'CH-XERIFEINFO';
  const canManageUsers = isChefe || isAux || isXerife;

  // Estados do Modal de Criação de Militar (Login/Senha)
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedRank, setSelectedRank] = useState('3º Sgt');
  const [warName, setWarName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('CH-TECNICOINFO');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('Manutenção de Hardware e Suporte de Rede');
  const [userError, setUserError] = useState('');

  // Estados do Modal de Alteração de Credenciais (Login e Senha)
  const [editingCredsUser, setEditingCredsUser] = useState<MilitaryUser | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRank, setEditRank] = useState('3º Sgt');
  const [editWarName, setEditWarName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('CH-TECNICOINFO');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUnlockChecked, setEditUnlockChecked] = useState(false);
  const [showEditPasswordText, setShowEditPasswordText] = useState(false);
  const [editCredsError, setEditCredsError] = useState('');

  // Estados do Modal de Desligamento / Afastamento de Militar
  const [deactivatingUser, setDeactivatingUser] = useState<MilitaryUser | null>(null);
  const [deactivationReasonCategory, setDeactivationReasonCategory] = useState<string>('Transferência de OM');
  const [deactivationNotes, setDeactivationNotes] = useState<string>('');

  // Estados do Modal de Desbloqueio de Usuário Bloqueado (Chefe da Seção)
  const [unlockTargetUser, setUnlockTargetUser] = useState<MilitaryUser | null>(null);
  const [chefePasswordInput, setChefePasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);

  // Estados de Filtro de Logs de Auditoria
  const [logSearch, setLogSearch] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('all');
  const [logFilterUser, setLogFilterUser] = useState('all');
  const [logFilterDate, setLogFilterDate] = useState('');

  // Fechamento de qualquer modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddUserModal) setShowAddUserModal(false);
        else if (editingCredsUser) setEditingCredsUser(null);
        else if (deactivatingUser) setDeactivatingUser(null);
        else if (unlockTargetUser) setUnlockTargetUser(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddUserModal, editingCredsUser, deactivatingUser, unlockTargetUser]);

  // Criação de Novo Militar com Login & Senha
  const handleCreateMilitaryUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanWarName = warName.trim();

    if (!cleanWarName) {
      setUserError('Informe o Nome de Guerra do militar.');
      return;
    }
    if (!cleanUsername) {
      setUserError('Informe o login de acesso do militar.');
      return;
    }
    if (!password || password.length < 3) {
      setUserError('A senha deve conter no mínimo 3 caracteres.');
      return;
    }

    // Verificar se o login já existe
    if (militaryUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
      setUserError(`O login "${cleanUsername}" já está em uso por outro militar.`);
      return;
    }

    const fullName = `${selectedRank} ${cleanWarName}`;
    const newUser: MilitaryUser = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      password: password,
      name: fullName,
      rank: selectedRank,
      warName: cleanWarName,
      role: selectedRole,
      active: true,
      email: email.trim() || `${cleanUsername}@eb.mil.br`,
      specialty: specialty.trim() || 'Informática e Suporte Operacional',
      createdAt: new Date().toISOString(),
    };

    onUpdateMilitaryUsers([...militaryUsers, newUser]);

    // Registrar no Log de Auditoria
    onAddAuditLog({
      militaryName: currentUser?.name || 'Chefe da Seção',
      militaryLogin: currentUser?.username || 'admin',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'USUARIO_CRIADO',
      summary: `Cadastrou o militar ${fullName} com login "${cleanUsername}" e perfil ${selectedRole}`,
      details: `Função: ${ROLES_INFO[selectedRole].title} | Especialidade: ${newUser.specialty}`,
      targetRef: cleanUsername,
    });

    // Se for técnico ou xerife, cadastra também na lista de bancada se não existir
    if (selectedRole !== 'CH-TVINFO' && !technicians.some(t => t.name.toLowerCase() === fullName.toLowerCase())) {
      const initials = (selectedRank.split(' ')[0][0] + cleanWarName[0]).toUpperCase();
      const newTech: Technician = {
        id: `tech-${Date.now()}`,
        name: fullName,
        role: ROLES_INFO[selectedRole].title,
        email: newUser.email || `${cleanUsername}@eb.mil.br`,
        avatar: initials,
        active: true,
        specialty: newUser.specialty || 'Suporte Técnico',
      };
      onUpdateTechnicians([...technicians, newTech]);
    }

    setShowAddUserModal(false);
    setWarName('');
    setUsername('');
    setPassword('');
    setEmail('');
  };

  // Abrir Modal de Edição Completa de Login/Senha e Dados
  const openEditCredentials = (u: MilitaryUser) => {
    setEditingCredsUser(u);
    setEditUsername(u.username);
    setEditPassword(u.password || '');
    setEditRank(u.rank);
    setEditWarName(u.warName);
    setEditRole(u.role);
    setEditSpecialty(u.specialty || '');
    setEditEmail(u.email || '');
    setEditUnlockChecked(Boolean(u.isLocked || (u.failedAttempts && u.failedAttempts >= 3)));
    setShowEditPasswordText(false);
    setEditCredsError('');
  };

  // Salvar Credenciais e Dados do Militar (CHINFO)
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCredsUser) return;
    setEditCredsError('');

    const cleanUser = editUsername.trim().toLowerCase();
    const cleanPass = editPassword;
    const cleanWar = editWarName.trim();

    if (!cleanUser) {
      setEditCredsError('Informe o login do militar.');
      return;
    }
    if (!cleanPass || cleanPass.length < 3) {
      setEditCredsError('A senha deve conter no mínimo 3 caracteres.');
      return;
    }
    if (!cleanWar) {
      setEditCredsError('Informe o Nome de Guerra.');
      return;
    }

    // Verificar se login já pertence a outro militar
    if (
      cleanUser !== editingCredsUser.username.toLowerCase() &&
      militaryUsers.some(u => u.id !== editingCredsUser.id && u.username.toLowerCase() === cleanUser)
    ) {
      setEditCredsError(`O login "${cleanUser}" já está em uso por outro militar.`);
      return;
    }

    const fullName = `${editRank} ${cleanWar}`;
    const wasLocked = Boolean(editingCredsUser.isLocked || (editingCredsUser.failedAttempts && editingCredsUser.failedAttempts >= 3));
    const shouldUnlock = editUnlockChecked || !wasLocked;

    const updatedUser: MilitaryUser = {
      ...editingCredsUser,
      username: cleanUser,
      password: cleanPass,
      rank: editRank,
      warName: cleanWar,
      name: fullName,
      role: editRole,
      specialty: editSpecialty.trim() || editingCredsUser.specialty,
      email: editEmail.trim() || `${cleanUser}@eb.mil.br`,
      isLocked: shouldUnlock ? false : editingCredsUser.isLocked,
      failedAttempts: shouldUnlock ? 0 : (editingCredsUser.failedAttempts || 0),
      lockedAt: shouldUnlock ? undefined : editingCredsUser.lockedAt,
    };

    onUpdateMilitaryUsers(
      militaryUsers.map(u => u.id === editingCredsUser.id ? updatedUser : u)
    );

    api.updateMilitaryUser(editingCredsUser.id, updatedUser).catch(console.warn);

    onAddAuditLog({
      militaryName: currentUser?.name || 'Chefe da Seção',
      militaryLogin: currentUser?.username || 'admin',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'USUARIO_EDITADO',
      summary: `Atualizou login/senha e credenciais do militar ${fullName} (${cleanUser})`,
      details: `Perfil: ${editRole} | Bloqueio de tentativas: ${shouldUnlock ? 'Liberado/Zerado' : 'Mantido'}`,
      targetRef: cleanUser,
    });

    alert(`Credenciais do militar ${fullName} atualizadas com sucesso!`);
    setEditingCredsUser(null);
  };

  // Abrir Modal de Desbloqueio (exclusivo para o Chefe da Seção com confirmação de senha)
  const handleUnlockUser = (user: MilitaryUser) => {
    if (!isChefe) {
      alert('Apenas o Chefe da Seção (CH-SECINFO) tem autorização para desbloquear credenciais militares.');
      return;
    }
    setUnlockTargetUser(user);
    setChefePasswordInput('');
    setUnlockError('');
    setShowUnlockPassword(false);
  };

  // Confirmar Desbloqueio mediante Senha do Chefe da Seção
  const handleConfirmUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockTargetUser) return;
    setUnlockError('');

    if (!isChefe) {
      setUnlockError('Apenas o Chefe da Seção (CH-SECINFO) possui autorização para desbloquear credenciais.');
      return;
    }

    if (!currentUser?.password || chefePasswordInput !== currentUser.password) {
      setUnlockError('Senha do Chefe da Seção incorreta! O desbloqueio não foi autorizado.');
      return;
    }

    const updatedUser: MilitaryUser = {
      ...unlockTargetUser,
      isLocked: false,
      failedAttempts: 0,
      lockedAt: undefined,
    };

    onUpdateMilitaryUsers(
      militaryUsers.map(u => u.id === unlockTargetUser.id ? updatedUser : u)
    );

    api.updateMilitaryUser(unlockTargetUser.id, { isLocked: false, failedAttempts: 0 } as any).catch(console.warn);

    onAddAuditLog({
      militaryName: currentUser?.name || 'Chefe da Seção',
      militaryLogin: currentUser?.username || 'admin',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'USUARIO_DESBLOQUEADO',
      summary: `Chefe da Seção ${currentUser?.name || 'CHINFO'} desbloqueou o login do militar ${unlockTargetUser.name} (${unlockTargetUser.username}) mediante confirmação de senha.`,
      targetRef: unlockTargetUser.username,
    });

    alert(`Login do militar ${unlockTargetUser.name} (@${unlockTargetUser.username}) liberado com sucesso!`);
    setUnlockTargetUser(null);
    setChefePasswordInput('');
    setUnlockError('');
  };

  // Alternar Status Ativo / Inativo
  const handleToggleUserActive = (user: MilitaryUser) => {
    if (user.role === 'CH-SECINFO' && user.active && militaryUsers.filter(u => u.role === 'CH-SECINFO' && u.active).length <= 1) {
      alert('Não é possível desativar o único militar com cargo CH-SECINFO do sistema.');
      return;
    }

    if (user.active) {
      // Abrir modal para registrar o motivo do desligamento/afastamento
      setDeactivatingUser(user);
      setDeactivationReasonCategory('Transferência de OM');
      setDeactivationNotes('');
    } else {
      // Reativação direta
      if (window.confirm(`Deseja reativar o militar ${user.name} (${user.username}) para o serviço ativo na Seção de TI?`)) {
        handleReactivateUser(user);
      }
    }
  };

  const handleConfirmDeactivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivatingUser) return;

    const fullReason = deactivationNotes.trim() 
      ? `${deactivationReasonCategory}: ${deactivationNotes.trim()}`
      : deactivationReasonCategory;

    const deactivatedAt = new Date().toISOString();

    const updated = militaryUsers.map(u => u.id === deactivatingUser.id ? { 
      ...u, 
      active: false,
      deactivationReason: fullReason,
      deactivatedAt: deactivatedAt
    } : u);

    onUpdateMilitaryUsers(updated);

    // Sincronizar na bancada de técnicos também
    onUpdateTechnicians(
      technicians.map(t => t.id === deactivatingUser.id || t.email === deactivatingUser.email 
        ? { ...t, active: false } 
        : t
      )
    );

    onAddAuditLog({
      militaryName: currentUser?.name || 'Administrador',
      militaryLogin: currentUser?.username || 'admin',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'MILITAR_DESATIVADO',
      summary: `Desativou/afastou o militar ${deactivatingUser.name} (${deactivatingUser.username})`,
      details: `Motivo: ${fullReason}`,
      targetRef: deactivatingUser.username,
    });

    setDeactivatingUser(null);
  };

  const handleReactivateUser = (user: MilitaryUser) => {
    const updated = militaryUsers.map(u => u.id === user.id ? { 
      ...u, 
      active: true,
      deactivationReason: undefined,
      deactivatedAt: undefined
    } : u);

    onUpdateMilitaryUsers(updated);

    onUpdateTechnicians(
      technicians.map(t => t.id === user.id || t.email === user.email 
        ? { ...t, active: true } 
        : t
      )
    );

    onAddAuditLog({
      militaryName: currentUser?.name || 'Administrador',
      militaryLogin: currentUser?.username || 'admin',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'MILITAR_REATIVADO',
      summary: `Reativou o militar ${user.name} (${user.username}) para o serviço ativo`,
      targetRef: user.username,
    });
  };

  // Excluir Militar
  const handleDeleteUser = (user: MilitaryUser) => {
    if (user.role === 'CH-SECINFO' && militaryUsers.filter(u => u.role === 'CH-SECINFO').length <= 1) {
      alert('Não é permitido excluir o único Chefe de Seção (CH-SECINFO).');
      return;
    }

    if (window.confirm(`Deseja realmente remover o militar ${user.name} (login: ${user.username})?\n\nEsta ação excluirá o militar e seus acessos.`)) {
      onUpdateMilitaryUsers(militaryUsers.filter(u => u.id !== user.id));

      onAddAuditLog({
        militaryName: currentUser?.name || 'Administrador',
        militaryLogin: currentUser?.username || 'admin',
        role: currentUser?.role || 'CH-SECINFO',
        actionType: 'USUARIO_EDITADO',
        summary: `Excluiu o militar ${user.name} (login: ${user.username}) do sistema`,
        targetRef: user.username,
      });
    }
  };

  // Militares visíveis (o login DEV nunca aparece na listagem de militares da TI)
  const visibleMilitaryUsers = militaryUsers.filter(u => u.username !== 'dev' && u.role !== 'dev');

  // Filtragem de Logs de Auditoria
  const filteredLogs = auditLogs.filter(log => {
    if (logFilterAction !== 'all' && log.actionType !== logFilterAction) return false;
    if (logFilterUser !== 'all' && log.militaryLogin !== logFilterUser) return false;
    if (logFilterDate) {
      try {
        const logDateStr = new Date(log.timestamp).toISOString().slice(0, 10);
        if (logDateStr !== logFilterDate) return false;
      } catch {}
    }
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      const match = (
        log.militaryName.toLowerCase().includes(q) ||
        log.militaryLogin.toLowerCase().includes(q) ||
        log.summary.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.targetRef && log.targetRef.toLowerCase().includes(q))
      );
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Cabeçalho Principal */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#1e3316] text-[#dfb642] uppercase">
              2º GAC - REGIMENTO DEODORO · SEÇÃO DE TI
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Controle de Efetivo & Rastreabilidade
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
            Gestão de Militares, Permissões & Auditoria
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Criação de <strong>login e senha individuais</strong> dos militares, atribuição rigorosa de cargos e registro cronológico de <strong>todas as ações executadas no sistema</strong> para controle militar.
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-5 py-3 rounded-2xl bg-[#1e3316] text-[#dfb642] font-black text-sm flex items-center gap-2 hover:bg-[#27431e] shadow-md transition-all active:scale-[0.99] border border-[#cba135]/50 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Cadastrar Militar (Login/Senha)</span>
          </button>
        )}
      </div>

      {/* Faixa Explicativa dos Cargos Militares do Sistema */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {AVAILABLE_ROLES.map((roleKey) => {
          const info = ROLES_INFO[roleKey];
          return (
            <div 
              key={roleKey}
              className={`p-3.5 rounded-2xl border bg-white shadow-2xs space-y-1.5 ${info.borderCol}`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${info.badgeBg}`}>
                  {roleKey}
                </span>
                <Shield className={`w-4 h-4 ${info.textCol}`} />
              </div>
              <h4 className="font-bold text-xs text-slate-900">{info.title}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">{info.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Abas de Navegação (Exclusivas do Chefe de Seção e DEV) */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
            activeTab === 'users'
              ? 'border-[#27431e] text-[#1e3316] bg-white font-black shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-[#27431e]" />
          <span>Militares Cadastrados & Logins ({visibleMilitaryUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-[#27431e] text-[#1e3316] bg-white font-black shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-amber-700" />
          <span>Logs de Auditoria & Ações ({auditLogs.length})</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: MILITARES & LOGINS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Militares com credenciais individuais ativas no 2º GAC.</span>
            <span className="font-mono text-slate-500">Total: <strong>{visibleMilitaryUsers.length} militares</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {visibleMilitaryUsers.map((user) => {
              const roleMeta = ROLES_INFO[user.role] || ROLES_INFO['CH-TECNICOINFO'];
              const isLogged = currentUser?.id === user.id;
              const isUserLocked = Boolean(user.isLocked || (user.failedAttempts && user.failedAttempts >= 3));

              return (
                <div
                  key={user.id}
                  className={`p-5 rounded-3xl border transition-all bg-white shadow-xs space-y-4 relative ${
                    user.active ? 'border-slate-200 hover:border-[#27431e]' : 'border-slate-200 opacity-60 bg-slate-50'
                  } ${isLogged ? 'ring-2 ring-[#27431e] shadow-md' : ''}`}
                >
                  {isLogged && (
                    <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-[#1e3316] text-[#dfb642] font-mono text-[10px] font-black tracking-widest uppercase shadow-xs">
                      ● Sessão Atual
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#1e3316] text-[#dfb642] font-black text-sm flex items-center justify-center border border-[#cba135]/40 shadow-xs shrink-0">
                        {user.warName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-slate-900 leading-tight">
                            {user.name}
                          </h3>
                        </div>
                        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-black border ${roleMeta.badgeBg}`}>
                          {user.role} · {roleMeta.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Ativar/Desativar */}
                      {canManageUsers && (
                        <button
                          onClick={() => handleToggleUserActive(user)}
                          title={user.active ? "Desativar Militar" : "Ativar Militar"}
                          className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                            user.active ? 'text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}

                      {/* Excluir */}
                      {canManageUsers && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          title="Remover militar"
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Alerta de Bloqueio por Excesso de Tentativas */}
                  {isUserLocked && (
                    <div className="p-3 rounded-2xl bg-red-100 border border-red-300 text-red-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-700 shrink-0" />
                        <div>
                          <span className="font-black text-red-950 flex items-center gap-1.5">
                            LOGIN BLOQUEADO <Lock className="w-3.5 h-3.5 text-red-700" />
                          </span>
                          <span className="text-[10px] text-red-700 font-mono">
                            {user.failedAttempts || 3} erros de senha consecutivos
                          </span>
                        </div>
                      </div>
                      {isChefe ? (
                        <button
                          type="button"
                          onClick={() => handleUnlockUser(user)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-xs cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 self-start sm:self-auto"
                          title="Liberar e desbloquear acesso com senha do Chefe"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Liberar Acesso (Chefe)</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-red-800 font-semibold italic">
                          Apenas o Chefe da Seção pode liberar
                        </span>
                      )}
                    </div>
                  )}

                  {/* Informações de Credenciais (Login e Senha) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 font-bold block text-[11px]">Login do Militar:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 inline-flex items-center gap-1.5">
                            {user.username}
                            {isUserLocked && (
                              <span title="Login Bloqueado (3 erros)">
                                <Lock className="w-3.5 h-3.5 text-red-600 inline shrink-0" />
                              </span>
                            )}
                          </code>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 font-bold block text-[11px]">Senha Cadastrada:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
                            {user.password ? '••••••••' : 'Sem senha'}
                          </code>
                        </div>
                      </div>
                    </div>

                    {canManageUsers && (
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => openEditCredentials(user)}
                          className="px-3 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] hover:bg-[#27431e] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs border border-[#cba135]/40"
                          title="Alterar Login e Senha deste militar"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Alterar Login / Senha</span>
                        </button>

                        {Boolean(user.isLocked || (user.failedAttempts && user.failedAttempts >= 3)) && (
                          <span className="text-[10px] text-red-600 font-mono font-black">
                            ● Acesso Bloqueado
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Especialidade e E-mail */}
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-[#27431e] shrink-0" />
                      <span className="truncate"><strong>Especialidade:</strong> {user.specialty || 'TI Geral'}</span>
                    </div>
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#27431e] shrink-0" />
                        <span className="truncate"><strong>E-mail:</strong> {user.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card: Trocar de Sessão (Atalho para Testar Permissão) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] inline-block ${
                        user.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {user.active ? '● Efetivo Ativo na TI' : '○ Militar Afastado / Desligado'}
                      </span>
                      {!user.active && user.deactivationReason && (
                        <div className="mt-1 text-[11px] text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                          <strong>Motivo:</strong> {user.deactivationReason}
                        </div>
                      )}
                    </div>

                    {onSwitchUser && (
                      <button
                        type="button"
                        onClick={() => onSwitchUser(user)}
                        disabled={isLogged || !user.active}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto ${
                          isLogged 
                            ? 'bg-slate-100 text-slate-400 cursor-default' 
                            : 'bg-[#1e3316] text-[#dfb642] hover:bg-[#27431e] shadow-2xs'
                        }`}
                        title="Alternar login para testar a experiência com o perfil deste militar"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{isLogged ? 'Conectado' : 'Entrar como este militar'}</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: LOGS DE AUDITORIA (QUEM FEZ O QUÊ NO SISTEMA) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          
          {/* Painel de Filtros dos Logs */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por militar, chamado (TICKET-1001), notebook ou descrição..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Calendário para filtrar logs por data */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="date"
                    value={logFilterDate}
                    onChange={(e) => setLogFilterDate(e.target.value)}
                    className="text-xs font-semibold bg-transparent focus:outline-none"
                    title="Filtrar logs por data do calendário"
                  />
                  {logFilterDate && (
                    <button
                      type="button"
                      onClick={() => setLogFilterDate('')}
                      className="text-xs text-slate-400 hover:text-slate-800 font-bold ml-1 cursor-pointer"
                      title="Limpar filtro de data"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={logFilterAction}
                  onChange={(e) => setLogFilterAction(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="all">Todas as Ações</option>
                  <option value="PRORROGACAO_CAUTELA">Prorrogação de Cautela</option>
                  <option value="MENSAGEM_CAUTELA">Mensagem em Cautela</option>
                  <option value="DEVOLUCAO_CAUTELA">Descautela / Devolução</option>
                  <option value="EDICAO_CAUTELA">Edição de Cautela</option>
                  <option value="INTERVENCAO_XERIFE">Intervenção do Xerife</option>
                  <option value="ATRIBUIR_TECNICO">Atribuição de Técnico</option>
                  <option value="PRIORIDADE_CHAMADO">Alteração de Prioridade</option>
                  <option value="EDITAR_TITULO_CHAMADO">Edição de Título</option>
                  <option value="EXCLUSAO_CHAMADO">Exclusão de Chamado</option>
                  <option value="STATUS_CHAMADO">Movimentação de Bloco</option>
                  <option value="USUARIO_CRIADO">Criação de Militar/Login</option>
                  <option value="LOGIN_SUCESSO">Login no Sistema</option>
                </select>

                <select
                  value={logFilterUser}
                  onChange={(e) => setLogFilterUser(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="all">Todos os Militares</option>
                  {visibleMilitaryUsers.map(u => (
                    <option key={u.id} value={u.username}>{u.name} ({u.username})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Trilha de Auditoria Oficial do Exército Brasileiro · 2º GAC</span>
              <span>Exibindo <strong>{filteredLogs.length}</strong> de {auditLogs.length} registros</span>
            </div>
          </div>

          {/* Tabela dos Logs de Auditoria */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1e3316] text-[#dfb642] font-mono font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Militar Responsável</th>
                    <th className="py-3 px-4">Cargo / Role</th>
                    <th className="py-3 px-4">Ação Executada</th>
                    <th className="py-3 px-4">Referência</th>
                    <th className="py-3 px-4">Resumo & Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Nenhum registro de log encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const roleMeta = ROLES_INFO[log.role] || ROLES_INFO['CH-TECNICOINFO'];
                      const isProrrogacao = log.actionType === 'PRORROGACAO_CAUTELA';
                      const isIntervencao = log.actionType === 'INTERVENCAO_XERIFE';
                      const isExclusao = log.actionType === 'EXCLUSAO_CHAMADO';

                      return (
                        <tr 
                          key={log.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isProrrogacao ? 'bg-amber-50/30' : isIntervencao ? 'bg-blue-50/30' : isExclusao ? 'bg-red-50/20' : ''
                          }`}
                        >
                          {/* Data/Hora */}
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>

                          {/* Militar */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block leading-tight">{log.militaryName}</span>
                            <code className="text-[10px] text-slate-500 font-mono">@{log.militaryLogin}</code>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${roleMeta.badgeBg}`}>
                              {log.role}
                            </span>
                          </td>

                          {/* Ação */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`font-mono text-[11px] font-black uppercase ${
                              isProrrogacao ? 'text-amber-800' : isIntervencao ? 'text-blue-800' : isExclusao ? 'text-red-700' : 'text-slate-700'
                            }`}>
                              {log.actionType.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Referência */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {log.targetRef ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 border text-slate-900">
                                {log.targetRef}
                              </span>
                            ) : '-'}
                          </td>

                          {/* Resumo */}
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900 leading-snug">{log.summary}</p>
                            {log.details && (
                              <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                                {log.details}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* MODAL 1: CADASTRAR MILITAR COM LOGIN E SENHA */}
      {showAddUserModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddUserModal(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#27431e]/30 cursor-default"
          >
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-[#1e3316] text-[#dfb642]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    Cadastrar Login de Militar
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">2º GAC - Regimento Deodoro</span>
                </div>
              </div>

              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateMilitaryUser} className="space-y-4 text-xs">
              
              {/* Posto e Nome de Guerra */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">
                    Posto / Graduação:
                  </label>
                  <select
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                  >
                    {RANKS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome de Guerra:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Silveira, Rocha, Alencar"
                    value={warName}
                    onChange={(e) => {
                      setWarName(e.target.value);
                      if (!username) {
                        setUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Credenciais: Login e Senha */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300/80 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Credenciais de Autenticação do Militar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Login de Acesso:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: rocha, silveira"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Senha Inicial:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 123 ou senha forte"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Perfil de Acesso (Cargo no Sistema) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#27431e]" />
                  <span>Perfil de Acesso & Permissões:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_ROLES.map((r) => {
                    const info = ROLES_INFO[r];
                    const isSelected = selectedRole === r;
                    return (
                      <div
                        key={r}
                        onClick={() => setSelectedRole(r)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#1e3316] text-[#dfb642] border-[#cba135] shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-black text-xs">{r}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#dfb642]" />}
                        </div>
                        <span className={`text-[11px] block font-bold ${isSelected ? 'text-emerald-200' : 'text-slate-900'}`}>
                          {info.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Especialidade e E-mail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Especialidade:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Manutenção N2, Redes"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    E-mail Institucional:
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: militar@eb.mil.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {userError && (
                <div className="p-2.5 rounded-xl bg-red-100 text-red-900 text-xs font-bold border border-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{userError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] shadow-md border border-[#cba135]/40"
                >
                  Cadastrar Militar & Acessos
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ALTERAR LOGIN / SENHA E CREDENCIAIS DO MILITAR (CHINFO) */}
      {editingCredsUser && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditingCredsUser(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#27431e] max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#1e3316] text-[#dfb642] border border-[#cba135]/40 shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    Editar Credenciais & Acesso
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {editingCredsUser.name} (@{editingCredsUser.username})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditingCredsUser(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso de militar bloqueado */}
            {Boolean(editingCredsUser.isLocked || (editingCredsUser.failedAttempts && editingCredsUser.failedAttempts >= 3)) && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Acesso atualmente bloqueado por excesso de tentativas (3 erros).</div>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-800 bg-white p-2 rounded-xl border border-red-200">
                    <input
                      type="checkbox"
                      checked={editUnlockChecked}
                      onChange={(e) => setEditUnlockChecked(e.target.checked)}
                      className="w-4 h-4 accent-emerald-700 rounded"
                    />
                    <span>Desbloquear login deste militar ao salvar</span>
                  </label>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
              {editCredsError && (
                <div className="p-3 rounded-xl bg-red-100 text-red-900 border border-red-300 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{editCredsError}</span>
                </div>
              )}

              {/* Login e Senha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#27431e]" />
                    <span>Login de Acesso:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Ex: carlos.mendes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xs bg-slate-50 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Identificação única no sistema</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-[#27431e]" />
                      <span>Senha Militar:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEditPasswordText(!showEditPasswordText)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {showEditPasswordText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showEditPasswordText ? 'Ocultar' : 'Ver'}</span>
                    </button>
                  </label>
                  <input
                    type={showEditPasswordText ? 'text' : 'password'}
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Digite a nova senha..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xs bg-slate-50 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Mínimo 3 caracteres</span>
                </div>
              </div>

              {/* Posto e Nome de Guerra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Posto / Graduação:
                  </label>
                  <select
                    value={editRank}
                    onChange={(e) => setEditRank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  >
                    {RANKS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Nome de Guerra:
                  </label>
                  <input
                    type="text"
                    required
                    value={editWarName}
                    onChange={(e) => setEditWarName(e.target.value)}
                    placeholder="Ex: Mendes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
              </div>

              {/* Cargo / Perfil Militar */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#27431e]" />
                  <span>Função / Perfil Militar:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_ROLES.map((r) => {
                    const info = ROLES_INFO[r];
                    const isSelected = editRole === r;
                    return (
                      <div
                        key={r}
                        onClick={() => setEditRole(r)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#1e3316] text-[#dfb642] border-[#cba135] shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono font-black text-[11px]">{r}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#dfb642]" />}
                        </div>
                        <span className={`text-[10px] block font-bold truncate ${isSelected ? 'text-emerald-200' : 'text-slate-900'}`}>
                          {info.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Especialidade e E-mail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Especialidade:
                  </label>
                  <input
                    type="text"
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    placeholder="Ex: Redes, Hardware"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    E-mail:
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Ex: militar@eb.mil.br"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
                Todas as alterações em logins e senhas são registradas de forma auditável pelo Chefe da Seção (CHINFO).
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCredsUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] shadow-md border border-[#cba135]/40 cursor-pointer"
                >
                  Salvar Credenciais
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRO DE MOTIVO DE DESLIGAMENTO / AFASTAMENTO DE MILITAR */}
      {deactivatingUser && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setDeactivatingUser(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-red-500/40 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-100 text-red-700">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Afastamento / Desligamento de Militar
                  </h3>
                  <span className="text-xs text-slate-500">
                    {deactivatingUser.name} ({deactivatingUser.username})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeactivatingUser(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeactivation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Motivo Principal do Afastamento *
                </label>
                <select
                  value={deactivationReasonCategory}
                  onChange={(e) => setDeactivationReasonCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="Transferência de OM">Transferência de OM / Guarnição</option>
                  <option value="Missão Externa / Operação">Missão Externa / Operação Militar</option>
                  <option value="Licença Especial / Médica">Licença Especial / Licença Médica (FSR)</option>
                  <option value="Baixa do Serviço Ativo">Baixa do Serviço Ativo / Reserva</option>
                  <option value="Férias Regulamentares">Férias Regulamentares</option>
                  <option value="Designação Externa">Designação para outra função interna</option>
                  <option value="Desligamento Administrativo">Desligamento Administrativo da TI</option>
                  <option value="Outro Motivo">Outro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Observações / Justificativa Militar (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Publicado no BI nº 142 de 24/09; Transferido para a 2ª Bia O; Período de 30 dias..."
                  value={deactivationNotes}
                  onChange={(e) => setDeactivationNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Atenção:</strong> Ao desativar o militar, o acesso dele ao painel administrativo será bloqueado e o motivo ficará registrado nos logs de auditoria e na listagem da seção.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeactivatingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-md cursor-pointer"
                >
                  Confirmar Afastamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DESBLOQUEIO DE MILITAR PELO CHEFE DA SEÇÃO (CONFIRMAÇÃO DE SENHA) */}
      {unlockTargetUser && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setUnlockTargetUser(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-600/40 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-100 text-red-700">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Desbloqueio de Acesso Militar
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    2º GAC · Liberação com Senha do Chefe
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnlockTargetUser(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">
                Militar a ser liberado:
              </p>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-black text-slate-900">{unlockTargetUser.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px]">@{unlockTargetUser.username}</span>
                <Lock className="w-3.5 h-3.5 text-red-600" />
              </div>
              <p className="text-[11px] text-red-700 pt-1">
                Bloqueado após atingir 3 tentativas consecutivas de senha incorreta.
              </p>
            </div>

            <form onSubmit={handleConfirmUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Senha do Chefe da Seção ({currentUser?.name || 'CH-SECINFO'}) *
                </label>
                <div className="relative">
                  <input
                    type={showUnlockPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Digite sua senha de Chefe para autorizar..."
                    value={chefePasswordInput}
                    onChange={(e) => {
                      setChefePasswordInput(e.target.value);
                      if (unlockError) setUnlockError('');
                    }}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-[#27431e] focus:border-[#27431e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {unlockError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                Esta ação zera o contador de erros e restaura imediatamente o acesso do militar. A liberação ficará registrada no log de auditoria da seção.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setUnlockTargetUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmar e Desbloquear</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
