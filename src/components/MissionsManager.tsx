import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  ChevronRight, 
  MessageSquare, 
  ShieldAlert, 
  ListChecks, 
  Lock,
  ArrowRight,
  Send,
  Building2,
  Users,
  ClipboardCheck,
  Copy,
  Star,
  Network,
  Code,
  Wrench,
  Layers,
  LayoutGrid,
  List,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import { Mission, MissionPriority, MissionStatus, MissionArea, MilitaryUser, Technician, AccessibilitySettings } from '../types';
import { AttendanceModal } from './AttendanceModal';

interface MissionsManagerProps {
  missions: Mission[];
  technicians: Technician[];
  militaryUsers: MilitaryUser[];
  currentUser: MilitaryUser | null;
  a11y: AccessibilitySettings;
  onAddMission: (missionData: {
    title: string;
    description: string;
    priority: MissionPriority;
    area?: MissionArea;
    assignedTechnicianIds: string[];
    deadline?: string;
    checklistItems: string[];
  }) => void;
  onUpdateMission: (missionId: string, updates: Partial<Mission>) => void;
  onDeleteMission: (missionId: string) => void;
  onAddMissionNote: (missionId: string, noteText: string) => void;
  onToggleChecklistItem: (missionId: string, itemId: string) => void;
  onAddAuditLog?: (log: any) => void;
}

export const MissionsManager: React.FC<MissionsManagerProps> = ({
  missions,
  technicians,
  militaryUsers,
  currentUser,
  a11y,
  onAddMission,
  onUpdateMission,
  onDeleteMission,
  onAddMissionNote,
  onToggleChecklistItem,
  onAddAuditLog,
}) => {
  // Permissões Oficiais
  const isDev = currentUser?.role === 'dev' || currentUser?.role === 'DEV' || currentUser?.role === 'System Developer' || currentUser?.username === 'dev';
  const isChefe = currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'CHSECINFO' || isDev;
  const isAux = currentUser?.role === 'AUX-SECINFO' || currentUser?.role === 'AUXSECINFO';
  const isXerife = currentUser?.role === 'INF-XERIFE' || currentUser?.role === 'CH-XERIFEINFO' || currentUser?.role === 'XERIFESECINFO';
  const canManageMissions = isChefe || isXerife || isDev; // Somente Chefe, Xerife e DEV criam e editam
  const canDeleteMissions = isChefe || isDev; // Chefe de Seção e DEV excluem
  const canTakeAttendance = isChefe || isAux || isXerife || isDev; // Xerifes, Auxiliares, Chefes e DEV
  const canSetPriority = isChefe || isAux || isXerife || isDev; // Xerife, Chefe, Aux e DEV definem prioridade
  const isTV = currentUser?.role === 'CH-TVINFO' || currentUser?.role === 'INF-TV';
  const canInteract = !isTV;

  // Hierarquia Militar: Xerife não inclui Chefe/Aux, Aux não inclui Chefe, Ninguém inclui DEV
  const isTechAssignable = (tech: Technician) => {
    const milUser = (militaryUsers || []).find(u => 
      u.id === tech.id || 
      u.username === tech.id || 
      u.name.toLowerCase().trim() === tech.name.toLowerCase().trim() ||
      (tech.email && u.email && u.email.toLowerCase() === tech.email.toLowerCase())
    );

    const targetRole = milUser?.role || tech.role;
    const targetUsername = milUser?.username;

    // NINGUÉM pode incluir o DEV
    if (targetUsername === 'dev' || targetRole === 'dev' || targetRole === 'DEV' || milUser?.rank === 'Dev') {
      return false;
    }

    // Se o operador for XERIFE: não pode incluir Auxiliar nem Chefe
    if (isXerife && !isChefe && !isDev) {
      if (
        targetRole === 'CH-SECINFO' || 
        targetRole === 'CHSECINFO' || 
        targetRole === 'AUX-SECINFO' || 
        targetRole === 'AUXSECINFO'
      ) {
        return false;
      }
    }

    // Se o operador for AUXILIAR: não pode incluir o Chefe
    if (isAux && !isChefe && !isDev) {
      if (targetRole === 'CH-SECINFO' || targetRole === 'CHSECINFO') {
        return false;
      }
    }

    return true;
  };

  const hasActiveTopPriority = missions.some(m => m.isTopPriority && m.status !== 'concluida');

  const handleToggleTopPriority = (e: React.MouseEvent, mission: Mission) => {
    e.stopPropagation();
    if (!canSetPriority) return;
    const isNowTop = !mission.isTopPriority;
    const designation = isNowTop 
      ? `${currentUser?.role || 'Comando'} - ${currentUser?.name || 'Militar'}`
      : undefined;

    onUpdateMission(mission.id, {
      isTopPriority: isNowTop,
      priorityDesignatedBy: designation,
    });

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Comando',
      militaryLogin: currentUser?.username || 'militar',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'EDICAO_MISSAO',
      summary: isNowTop 
        ? `Definiu a missão ${mission.code} (${mission.title}) como PRIORIDADE MÁXIMA DA SEÇÃO.`
        : `Removeu a prioridade máxima da missão ${mission.code}.`,
      targetRef: mission.code,
    });
  };

  // Estados de Filtro e Visualização
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState<'todos' | MissionStatus>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'todas' | MissionPriority>('todas');

  // Drag and Drop de Missões por Área Técnica
  const [draggedMissionId, setDraggedMissionId] = useState<string | null>(null);
  const [dragOverArea, setDragOverArea] = useState<MissionArea | null>(null);
  const [collapsedMissionsColumns, setCollapsedMissionsColumns] = useState<Record<string, boolean>>({
    redes: false,
    desenvolvimento: false,
    hardware: false,
    geral: false,
  });

  const toggleAreaCollapse = (areaKey: string) => {
    setCollapsedMissionsColumns(prev => ({ ...prev, [areaKey]: !prev[areaKey] }));
  };

  const getMissionArea = (m: Mission): MissionArea => {
    if (m.area) return m.area;
    const text = `${m.title} ${m.description}`.toLowerCase();
    if (/(rede|switch|roteador|fibra|wifi|wi-fi|ip|vlan|conectividade|internet|dns|dhcp|link)/i.test(text)) return 'redes';
    if (/(sistema|desenvolvimento|dev|código|software|portal|intranet|banco de dados|api|site|script)/i.test(text)) return 'desenvolvimento';
    if (/(computador|notebook|bancada|impressora|toner|mouse|teclado|hardware|fonte|placa|disco|ssd|ram|formata)/i.test(text)) return 'hardware';
    return 'geral';
  };

  const handleDropOnArea = (targetArea: MissionArea) => {
    if (!draggedMissionId) return;
    const targetMission = missions.find(m => m.id === draggedMissionId);
    if (targetMission && getMissionArea(targetMission) !== targetArea) {
      onUpdateMission(draggedMissionId, { area: targetArea });
      onAddAuditLog?.({
        militaryName: currentUser?.name || 'Militar da TI',
        militaryLogin: currentUser?.username || 'ti',
        role: currentUser?.role || 'CH-SECINFO',
        actionType: 'EDICAO_MISSAO',
        summary: `Moveu a missão ${targetMission.code} para a área de ${targetArea.toUpperCase()}`,
        targetRef: targetMission.code,
      });
    }
    setDraggedMissionId(null);
    setDragOverArea(null);
  };

  // Configuração das Áreas Técnicas da TI
  const AREAS_CONFIG: {
    id: MissionArea;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    colBg: string;
    colBorder: string;
    dot: string;
    badge: string;
  }[] = [
    {
      id: 'redes',
      title: 'Redes & Conectividade',
      subtitle: 'Switches, Fibra, Wi-Fi e Roteadores',
      icon: Network,
      colBg: 'bg-blue-50/40',
      colBorder: 'border-blue-200',
      dot: 'bg-blue-600',
      badge: 'bg-blue-100 text-blue-900 border-blue-300',
    },
    {
      id: 'desenvolvimento',
      title: 'Desenvolvimento & Sistemas',
      subtitle: 'Software, Intranet, BD e Portais',
      icon: Code,
      colBg: 'bg-purple-50/40',
      colBorder: 'border-purple-200',
      dot: 'bg-purple-600',
      badge: 'bg-purple-100 text-purple-900 border-purple-300',
    },
    {
      id: 'hardware',
      title: 'Hardware & Bancada',
      subtitle: 'Computadores, Impressoras e Manutenção',
      icon: Wrench,
      colBg: 'bg-amber-50/40',
      colBorder: 'border-amber-200',
      dot: 'bg-amber-600',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      id: 'geral',
      title: 'Geral & Infraestrutura',
      subtitle: 'Operações Gerais e Apoio Técnico',
      icon: Layers,
      colBg: 'bg-emerald-50/40',
      colBorder: 'border-emerald-200',
      dot: 'bg-emerald-600',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
  ];

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [deletingMissionId, setDeletingMissionId] = useState<string | null>(null);

  // Fechamento de qualquer modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deletingMissionId) setDeletingMissionId(null);
        else if (isCreateModalOpen || editingMission) {
          setIsCreateModalOpen(false);
          setEditingMission(null);
        } else if (selectedMission) setSelectedMission(null);
        else if (isAttendanceModalOpen) setIsAttendanceModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deletingMissionId, isCreateModalOpen, editingMission, selectedMission, isAttendanceModalOpen]);

  // Sincronizar selectedMission com a lista atualizada de missões (mensagens e checklist em tempo real)
  useEffect(() => {
    if (selectedMission) {
      const updated = missions.find(m => m.id === selectedMission.id);
      if (updated) {
        setSelectedMission(updated);
      }
    }
  }, [missions]);

  // Estado e função para copiar dados da missão
  const [copiedMissionId, setCopiedMissionId] = useState<string | null>(null);
  const handleCopyMission = (m: Mission) => {
    const text = `ORDEM DE MISSÃO DA TI - 2º GAC\nCódigo: ${m.code}\nTítulo: ${m.title}\nPrioridade: ${m.priority.toUpperCase()}\nStatus: ${getStatusLabel(m.status)}\nPrazo: ${m.deadline ? new Date(m.deadline).toLocaleDateString('pt-BR') : 'Sem prazo fixo'}\nDescrição: ${m.description}`;
    navigator.clipboard.writeText(text);
    setCopiedMissionId(m.id);
    setTimeout(() => setCopiedMissionId(null), 2000);
  };

  // Form State para Nova / Editar Missão
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<MissionPriority>('normal');
  const [formArea, setFormArea] = useState<MissionArea>('redes');
  const [formAssignedTechs, setFormAssignedTechs] = useState<string[]>([]);
  const [formDeadline, setFormDeadline] = useState('');
  const [checklistInputs, setChecklistInputs] = useState<string[]>(['']);

  // Novo despacho no detalhe
  const [newNoteText, setNewNoteText] = useState('');

  const openCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormPriority('normal');
    setFormArea('redes');
    setFormAssignedTechs([]);
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    setFormDeadline(d.toISOString().slice(0, 10));
    setChecklistInputs(['Conferência inicial de materiais e ferramentas', 'Execução da tarefa técnica']);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (m: Mission) => {
    setEditingMission(m);
    setFormTitle(m.title);
    setFormDescription(m.description);
    setFormPriority(m.priority);
    setFormArea(getMissionArea(m));
    setFormAssignedTechs(m.assignedTechnicianIds || []);
    setFormDeadline(m.deadline ? m.deadline.slice(0, 10) : '');
    setChecklistInputs(m.checklist && m.checklist.length > 0 ? m.checklist.map(c => c.text) : ['']);
  };

  const handleSaveMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const validChecklist = checklistInputs.filter(item => item.trim().length > 0);

    if (editingMission) {
      onUpdateMission(editingMission.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        area: formArea,
        assignedTechnicianIds: formAssignedTechs,
        deadline: formDeadline ? new Date(formDeadline).toISOString() : undefined,
        checklist: validChecklist.map((text, idx) => {
          const existing = editingMission.checklist?.find(c => c.text === text);
          return existing || { id: `c-${Date.now()}-${idx}`, text, done: false };
        }),
      });
      setEditingMission(null);
    } else {
      onAddMission({
        title: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        area: formArea,
        assignedTechnicianIds: formAssignedTechs,
        deadline: formDeadline ? new Date(formDeadline).toISOString() : undefined,
        checklistItems: validChecklist,
      });
      setIsCreateModalOpen(false);
    }
  };

  // Filtragem
  const filteredMissions = missions.filter(m => {
    if (statusFilter !== 'todos' && m.status !== statusFilter) return false;
    if (priorityFilter !== 'todas' && m.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchCode = m.code.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCode) return false;
    }
    return true;
  });

  const getPriorityBadge = (p: MissionPriority) => {
    switch (p) {
      case 'urgente':
        return 'bg-red-600 text-white animate-pulse';
      case 'alta':
        return 'bg-amber-500 text-white';
      case 'normal':
        return 'bg-[#27431e] text-[#dfb642]';
      case 'baixa':
        return 'bg-slate-500 text-white';
    }
  };

  const getStatusBadge = (s: MissionStatus) => {
    switch (s) {
      case 'pendente':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'concluida':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'cancelada':
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusLabel = (s: MissionStatus) => {
    switch (s) {
      case 'pendente': return 'Pendente';
      case 'em_andamento': return 'Em Andamento';
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
    }
  };

  // Contadores
  const countPendente = missions.filter(m => m.status === 'pendente').length;
  const countAndamento = missions.filter(m => m.status === 'em_andamento').length;
  const countConcluida = missions.filter(m => m.status === 'concluida').length;
  const countUrgente = missions.filter(m => m.priority === 'urgente' && m.status !== 'concluida').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Topo do Painel de Missões */}
      <div className={`p-6 rounded-3xl border shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        a11y.highContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#1e3316] text-[#dfb642] border border-[#cba135]/50 shadow-md shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#27431e] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                2º GAC
              </span>
              {canManageMissions ? (
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                  Gestão Liberada (Chefe / Xerife)
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  Modo Operador Técnico
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Missões & Ordens de Operações da TI
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Escalação de tarefas de campo, infraestrutura, cabeamento e operações técnicas da Seção.
            </p>
          </div>
        </div>

        {/* Botões de Ação do Topo: Tiragem de Faltas e Criação de Missão */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          {/* Botão de Tiragem de Faltas (Formatura do Dia - Restrito a Xerife, Aux e Chefe) */}
          {canTakeAttendance && (
            <button
              type="button"
              onClick={() => setIsAttendanceModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#27431e] hover:bg-[#325727] text-[#dfb642] hover:text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm border border-[#cba135]/60 shrink-0 cursor-pointer active:scale-95"
              title="Realizar chamada/tiragem de faltas e consultar histórico militar"
            >
              <ClipboardCheck className="w-4 h-4 text-[#dfb642] shrink-0" />
              <span>Tiragem de Faltas (Formatura)</span>
            </button>
          )}

          {canManageMissions && (
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[#1e3316] hover:bg-[#27431e] text-[#dfb642] hover:text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm border border-[#cba135]/60 shrink-0 cursor-pointer active:scale-95"
              title="Cadastrar nova missão ou ordem de operação"
            >
              <Plus className="w-4 h-4 text-[#dfb642] shrink-0" />
              <span>Nova Missão</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter(statusFilter === 'em_andamento' ? 'todos' : 'em_andamento')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'em_andamento' ? 'ring-2 ring-blue-500 bg-blue-50/70 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            Em Andamento
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1 block">
            {countAndamento}
          </span>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'todos' : 'pendente')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'pendente' ? 'ring-2 ring-amber-500 bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pendentes
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1 block">
            {countPendente}
          </span>
        </div>

        <div 
          onClick={() => setPriorityFilter(priorityFilter === 'urgente' ? 'todas' : 'urgente')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            priorityFilter === 'urgente' ? 'ring-2 ring-red-500 bg-red-50/70 border-red-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-600" />
            Prioridade Urgente
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-red-600 mt-1 block">
            {countUrgente}
          </span>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'concluida' ? 'todos' : 'concluida')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'concluida' ? 'ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Concluídas
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1 block">
            {countConcluida}
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por código (ex: MISSAO-101), título ou militar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#27431e] bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Alternador de Modo de Visualização */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#1e3316] text-[#dfb642] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Quadro Kanban por Áreas Técnicas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quadro Kanban (Áreas TI)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#1e3316] text-[#dfb642] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Lista Detalhada"
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista Detalhada</span>
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
          >
            <option value="todas">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>

        {/* Indicador de Busca Ativa */}
        {searchQuery.trim().length > 0 && (
          <div className="flex items-center justify-between text-xs px-1 pt-2 border-t border-slate-100">
            <span className="text-slate-600 font-medium">
              Filtrando por: <strong className="text-[#1e3316]">"{searchQuery.trim()}"</strong> ({filteredMissions.length} missão(ões) localizada(s))
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#1e3316] font-bold hover:underline cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        )}

        {/* Resultado Instantâneo ao Terminar de Digitar */}
        {searchQuery.trim().length > 0 && filteredMissions.length > 0 && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-[#1e3316] text-[#dfb642] font-black shrink-0">
                <Target className="w-4 h-4" />
              </span>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">
                  Missão Localizada Automaticamente:
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {filteredMissions[0].code}
                </span>
                <span className="text-slate-700 font-semibold ml-2">
                  — {filteredMissions[0].title} ({getStatusLabel(filteredMissions[0].status)})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setSelectedMission(filteredMissions[0])}
                className="px-3.5 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-bold text-xs flex items-center gap-1.5 hover:bg-[#27431e] cursor-pointer shadow-xs"
              >
                <span>Ver Detalhes & Despachos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Renderização das Missões (Modo Kanban por Áreas vs Modo Lista) */}
      {filteredMissions.length === 0 && viewMode === 'table' ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
          <Target className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {searchQuery.trim() ? `Nenhuma missão localizada para "${searchQuery}"` : 'Nenhuma missão cadastrada'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery.trim() 
              ? 'Verifique o código ou os termos pesquisados.'
              : canManageMissions 
                ? 'O módulo é totalmente modular. Clique em "+ Nova Missão" acima para cadastrar a primeira ordem de operação da equipe.'
                : 'Nenhuma ordem de operação aberta no momento.'}
          </p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="space-y-3">
          {/* Dica Interativa de Arrastar e Soltar */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
            <GripVertical className="w-4 h-4 text-[#27431e] shrink-0" />
            <span>
              <strong>Quadro Kanban por Áreas Técnicas da TI:</strong> Arraste e solte cards entre as colunas para remanejar a especialidade técnica da missão (Redes, Desenvolvimento, Hardware ou Geral).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {AREAS_CONFIG.map((area) => {
              const areaMissions = filteredMissions.filter(m => getMissionArea(m) === area.id);
              const isCollapsed = collapsedMissionsColumns[area.id];
              const isDragOver = dragOverArea === area.id;
              const AreaIcon = area.icon;

              return (
                <div
                  key={area.id}
                  onDragOver={(e) => {
                    if (!canInteract) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverArea !== area.id) setDragOverArea(area.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverArea(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (!canInteract) return;
                    e.preventDefault();
                    handleDropOnArea(area.id);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                    isCollapsed ? 'min-h-[85px]' : 'min-h-[450px]'
                  } ${
                    isDragOver
                      ? 'bg-emerald-50 border-2 border-dashed border-[#27431e] ring-4 ring-[#27431e]/15'
                      : `${area.colBg} ${area.colBorder}`
                  }`}
                >
                  {/* Cabeçalho da Coluna de Área */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${area.dot} shrink-0`}></span>
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800 truncate flex items-center gap-1">
                        <AreaIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{area.title}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white text-slate-800 border border-slate-200">
                        {areaMissions.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAreaCollapse(area.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                        title={isCollapsed ? 'Expandir coluna' : 'Contrair coluna'}
                      >
                        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isCollapsed ? (
                    <div
                      onClick={() => toggleAreaCollapse(area.id)}
                      className="py-4 text-center cursor-pointer hover:bg-slate-200/50 rounded-xl transition-colors space-y-1"
                      title="Clique para expandir"
                    >
                      <span className="text-xs text-slate-400 font-bold block">Coluna contraída</span>
                      <span className="text-[10px] text-slate-500 underline">Clique para ver as missões</span>
                    </div>
                  ) : (
                    <>
                      {isDragOver && (
                        <div className="p-3 text-center rounded-xl bg-white border border-[#27431e] text-xs font-bold text-[#1e3316] animate-pulse shadow-xs">
                          ⬇️ Solte aqui para transferir para {area.title}
                        </div>
                      )}

                      <div className="space-y-3">
                        {areaMissions.map((mission) => {
                          const assignedTechs = technicians.filter(t => mission.assignedTechnicianIds?.includes(t.id));
                          const completedChecklist = mission.checklist?.filter(c => c.done).length || 0;
                          const totalChecklist = mission.checklist?.length || 0;
                          const progressPct = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;
                          const isThisTopPriority = Boolean(mission.isTopPriority && mission.status !== 'concluida');
                          const isCompleted = mission.status === 'concluida';

                          if (isCompleted) {
                            return (
                              <div
                                key={mission.id}
                                draggable={canInteract}
                                onDragStart={(e) => {
                                  if (!canInteract) return;
                                  e.dataTransfer.setData('text/plain', mission.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggedMissionId(mission.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedMissionId(null);
                                  setDragOverArea(null);
                                }}
                                onClick={() => setSelectedMission(mission)}
                                className="p-2.5 rounded-xl border border-slate-300 bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_8px,#f1f5f9_8px,#f1f5f9_16px)] hover:bg-slate-100 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs hover:border-slate-400 group opacity-90 hover:opacity-100"
                                title={`${mission.code} - ${mission.title} (Clique para ver detalhes)`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="font-mono text-xs font-black text-[#1e3316] bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                                    {mission.code}
                                  </span>
                                  <span className="text-xs text-slate-600 truncate font-semibold group-hover:text-slate-900">
                                    {mission.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  {canInteract && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onUpdateMission(mission.id, { status: 'em_andamento' });
                                      }}
                                      className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                      title="Reabrir esta missão para Em Andamento"
                                    >
                                      <span>🔄 Reabrir</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectedMission(mission)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                                    title="Ver detalhes"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={mission.id}
                              draggable={canInteract}
                              onDragStart={(e) => {
                                if (!canInteract) return;
                                e.dataTransfer.setData('text/plain', mission.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggedMissionId(mission.id);
                              }}
                              onDragEnd={() => {
                                setDraggedMissionId(null);
                                setDragOverArea(null);
                              }}
                              onClick={() => setSelectedMission(mission)}
                              className={`p-3.5 rounded-2xl border bg-white transition-all flex flex-col justify-between cursor-pointer group relative shadow-xs hover:shadow-md ${
                                canInteract ? 'cursor-grab active:cursor-grabbing hover:border-[#27431e]' : ''
                              } ${draggedMissionId === mission.id ? 'opacity-40 scale-95 border-dashed border-[#27431e]' : ''} ${
                                isCompleted
                                  ? 'border-slate-200 opacity-60 bg-slate-50/70 text-slate-500 hover:opacity-85'
                                  : isThisTopPriority
                                    ? 'border-[#dfb642] ring-2 ring-[#dfb642] shadow-xl bg-amber-50/20 scale-[1.01]'
                                    : mission.priority === 'urgente'
                                      ? 'border-red-400 ring-1 ring-red-400 shadow-xs'
                                      : 'border-slate-200 hover:border-[#27431e]'
                              }`}
                            >
                              <div>
                                {isThisTopPriority && (
                                  <div className="mb-2 px-2 py-1 rounded-lg bg-[#1e3316] text-[#dfb642] border border-[#cba135] text-[10px] font-black flex items-center justify-between gap-1 shadow-xs">
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-[#dfb642] text-[#dfb642]" />
                                      <span>PRIORIDADE MÁXIMA</span>
                                    </div>
                                    {mission.priorityDesignatedBy && (
                                      <span className="text-[9px] text-amber-200 font-mono truncate">
                                        por: {mission.priorityDesignatedBy}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-1.5 mb-2">
                                  <div className="flex items-center gap-1 min-w-0">
                                    {canInteract && (
                                      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0" />
                                    )}
                                    <span className="font-mono text-xs font-black text-[#1e3316] bg-slate-100 px-2 py-0.5 rounded-md">
                                      {mission.code}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {canSetPriority && mission.status !== 'concluida' && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleToggleTopPriority(e, mission)}
                                        className={`p-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                          mission.isTopPriority
                                            ? 'bg-amber-400 text-amber-950 hover:bg-amber-500 shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900 border border-slate-200'
                                        }`}
                                        title={mission.isTopPriority ? 'Remover prioridade' : 'Definir como prioridade'}
                                      >
                                        <Star className={`w-3 h-3 ${mission.isTopPriority ? 'fill-amber-950 text-amber-950' : 'text-slate-500'}`} />
                                      </button>
                                    )}
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${getPriorityBadge(mission.priority)}`}>
                                      {mission.priority}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono border ${getStatusBadge(mission.status)}`}>
                                      {getStatusLabel(mission.status)}
                                    </span>
                                  </div>
                                </div>

                                <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-[#1e3316] transition-colors line-clamp-2">
                                  {mission.title}
                                </h4>
                                <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                                  {mission.description}
                                </p>

                                {totalChecklist > 0 && (
                                  <div className="mt-2.5 space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-semibold">
                                      <span>Checklist</span>
                                      <span>{completedChecklist}/{totalChecklist} ({progressPct}%)</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-300 ${
                                          progressPct === 100 ? 'bg-emerald-500' : 'bg-[#27431e]'
                                        }`}
                                        style={{ width: `${progressPct}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <Users className="w-3 h-3 text-[#27431e] shrink-0" />
                                    <span className="truncate text-[10px] font-medium">
                                      {assignedTechs.length > 0 
                                        ? assignedTechs.map(t => t.name).join(', ')
                                        : 'Sem militar escalado'}
                                    </span>
                                  </div>
                                  {mission.notes && mission.notes.length > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
                                      <MessageSquare className="w-3 h-3 text-amber-600" />
                                      {mission.notes.length}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                                {canInteract && mission.status !== 'concluida' ? (
                                  <div className="flex items-center gap-1">
                                    {mission.status === 'pendente' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          onUpdateMission(mission.id, { status: 'em_andamento' });
                                        }}
                                        className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold border border-blue-200 transition-colors cursor-pointer"
                                        title="Iniciar operação"
                                      >
                                        ▶ Iniciar
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const nowIso = new Date().toISOString();
                                        const allDoneChecklist = (mission.checklist || []).map(c => ({ ...c, done: true }));
                                        onUpdateMission(mission.id, { 
                                          status: 'concluida', 
                                          completedAt: nowIso,
                                          checklist: allDoneChecklist
                                        });
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black shadow-xs border border-emerald-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                      title="Concluir esta missão em 1 clique"
                                    >
                                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                      <span>Concluir</span>
                                    </button>
                                  </div>
                                ) : mission.status === 'concluida' ? (
                                  <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Concluída</span>
                                  </span>
                                ) : null}

                                <div className="flex items-center gap-0.5 ml-auto">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyMission(mission);
                                    }}
                                    className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Copiar dados"
                                  >
                                    {copiedMissionId === mission.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  {canManageMissions && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(mission);
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-[#1e3316] hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {canDeleteMissions && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingMissionId(mission.id);
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectedMission(mission)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-800 transition-colors"
                                    title="Ver detalhes"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {areaMissions.length === 0 && (
                          <div className="p-6 text-center text-xs text-slate-400 bg-white/60 rounded-xl border border-dashed border-slate-200">
                            Nenhuma missão nesta área técnica.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMissions.map((mission) => {
            const assignedTechs = technicians.filter(t => mission.assignedTechnicianIds?.includes(t.id));
            const completedChecklist = mission.checklist?.filter(c => c.done).length || 0;
            const totalChecklist = mission.checklist?.length || 0;
            const progressPct = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;
            const isThisTopPriority = Boolean(mission.isTopPriority && mission.status !== 'concluida');
            const isDimmed = hasActiveTopPriority && !isThisTopPriority;
            const missionArea = getMissionArea(mission);
            const areaConfig = AREAS_CONFIG.find(a => a.id === missionArea);

            return (
              <div
                key={mission.id}
                onClick={() => setSelectedMission(mission)}
                className={`p-5 rounded-3xl border bg-white transition-all flex flex-col justify-between cursor-pointer group relative ${
                  isThisTopPriority
                    ? 'border-[#dfb642] ring-2 ring-[#dfb642] shadow-xl bg-amber-50/20 scale-[1.01]'
                    : isDimmed
                      ? 'border-slate-200 opacity-40 hover:opacity-100 hover:shadow-md'
                      : mission.priority === 'urgente' && mission.status !== 'concluida' 
                        ? 'border-red-400 ring-1 ring-red-400 shadow-xs hover:shadow-md' 
                        : 'border-slate-200 hover:border-[#27431e] shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  {/* Destaque no Topo para Missão Prioritária da Seção */}
                  {isThisTopPriority && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] border border-[#cba135] text-[11px] font-black flex items-center justify-between gap-1 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-[#dfb642] text-[#dfb642]" />
                        <span>MISSÃO PRIORITÁRIA DA SEÇÃO</span>
                      </div>
                      {mission.priorityDesignatedBy && (
                        <span className="text-[10px] text-amber-200 font-mono truncate">
                          por: {mission.priorityDesignatedBy}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Topo do Card */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-[#1e3316] tracking-tight bg-slate-100 px-2.5 py-1 rounded-lg">
                        {mission.code}
                      </span>
                      {areaConfig && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${areaConfig.badge}`}>
                          {areaConfig.title.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canSetPriority && mission.status !== 'concluida' && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleTopPriority(e, mission)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            mission.isTopPriority
                              ? 'bg-amber-400 text-amber-950 hover:bg-amber-500 shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900 border border-slate-200'
                          }`}
                          title={mission.isTopPriority ? 'Remover prioridade da seção' : 'Definir como prioridade da seção'}
                        >
                          <Star className={`w-3.5 h-3.5 ${mission.isTopPriority ? 'fill-amber-950 text-amber-950' : 'text-slate-500'}`} />
                          <span className="text-[10px] hidden sm:inline">{mission.isTopPriority ? 'Prioritária' : 'Prioridade'}</span>
                        </button>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${getPriorityBadge(mission.priority)}`}>
                        {mission.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${getStatusBadge(mission.status)}`}>
                        {getStatusLabel(mission.status)}
                      </span>
                    </div>
                  </div>

                  {/* Título e Descrição */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1e3316] transition-colors leading-snug">
                    {mission.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                    {mission.description}
                  </p>

                  {/* Barra de Progresso do Checklist */}
                  {totalChecklist > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-semibold">
                        <span>Checklist de Tarefas</span>
                        <span>{completedChecklist}/{totalChecklist} ({progressPct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            progressPct === 100 ? 'bg-emerald-500' : 'bg-[#27431e]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Militares Escalados */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Users className="w-3.5 h-3.5 text-[#27431e] shrink-0" />
                      <span className="truncate text-[11px] font-medium">
                        {assignedTechs.length > 0 
                          ? assignedTechs.map(t => t.name).join(', ')
                          : 'Sem militar escalado'}
                      </span>
                    </div>
                    {mission.notes && mission.notes.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
                        <MessageSquare className="w-3 h-3 text-amber-600" />
                        {mission.notes.length}
                      </span>
                    )}
                  </div>

                  {/* Lembrete de prioridade militar designada */}
                  {isThisTopPriority && mission.priorityDesignatedBy && (
                    <div className="mt-3 p-2 rounded-xl bg-amber-100/90 border border-amber-300 text-[10px] sm:text-[11px] font-mono text-amber-950 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-700 text-amber-700 shrink-0" />
                      <span className="truncate">
                        Designado como <strong>PRIORIDADE</strong> por: {mission.priorityDesignatedBy}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card com Ações Rápidas */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Status Rápido para o Técnico */}
                  {canInteract && mission.status !== 'concluida' ? (
                    <div className="flex items-center gap-1.5">
                      {mission.status === 'pendente' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onUpdateMission(mission.id, { status: 'em_andamento' });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Marcar início da operação"
                        >
                          <span>▶ Iniciar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const nowIso = new Date().toISOString();
                          const allDoneChecklist = (mission.checklist || []).map(c => ({ ...c, done: true }));
                          onUpdateMission(mission.id, { 
                            status: 'concluida', 
                            completedAt: nowIso,
                            checklist: allDoneChecklist
                          });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm border border-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Concluir esta missão em 1 único clique"
                      >
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                        <span>Concluir Missão</span>
                      </button>
                    </div>
                  ) : mission.status === 'concluida' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Concluída</span>
                      </span>
                      {canManageMissions && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onUpdateMission(mission.id, { status: 'em_andamento', completedAt: undefined });
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-800 underline font-mono cursor-pointer"
                          title="Reabrir missão"
                        >
                          (Reabrir)
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Botões de Copiar, Edição e Exclusão */}
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyMission(mission);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Copiar dados da ordem de missão"
                    >
                      {copiedMissionId === mission.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {canManageMissions && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(mission);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#1e3316] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar Missão (Chefe / Xerife)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteMissions && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingMissionId(mission.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir Missão (Exclusivo Chefe da Seção)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedMission(mission)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
                      title="Ver detalhes"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL DE CRIAÇÃO / EDIÇÃO DE MISSÃO ================= */}
      {(isCreateModalOpen || editingMission) && (
        <div 
          onClick={(e) => { 
            if (e.target === e.currentTarget) {
              setIsCreateModalOpen(false);
              setEditingMission(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 cursor-default"
          >
            <div className="bg-[#1e3316] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-[#dfb642]" />
                <div>
                  <h3 className="font-bold text-base">
                    {editingMission ? `Editar Missão (${editingMission.code})` : 'Nova Missão da Seção de TI'}
                  </h3>
                  <span className="text-xs text-emerald-200/80">
                    Ordens e escalações técnicas do 2º GAC
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingMission(null);
                }}
                className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-[#27431e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMission} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Título da Missão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Instalação de Cabeamento no Pavilhão do Comando"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-[#27431e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Descrição e Orientações Técnicas *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detalhe o que deve ser feito, locais, procedimentos e materiais a utilizar..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#27431e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Área Técnica da TI
                  </label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value as MissionArea)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-[#27431e]"
                  >
                    <option value="redes">Redes & Conectividade</option>
                    <option value="desenvolvimento">Desenvolvimento & Sistemas</option>
                    <option value="hardware">Hardware & Bancada</option>
                    <option value="geral">Geral & Infraestrutura</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Prioridade da Missão
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-[#27431e]"
                  >
                    <option value="urgente">Urgente (Imediato)</option>
                    <option value="alta">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Prazo Limite para Conclusão
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-[#27431e]"
                  />
                </div>
              </div>

              {/* Militares Escalados */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Militares Escalados para a Missão</span>
                  <span className="text-[11px] text-slate-400 font-normal">Selecione os responsáveis</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {technicians.filter(t => t.active && isTechAssignable(t)).map((tech) => {
                    const isSelected = formAssignedTechs.includes(tech.id);
                    return (
                      <label 
                        key={tech.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors border ${
                          isSelected ? 'bg-emerald-50 border-[#27431e] text-[#1e3316] font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormAssignedTechs(prev => [...prev, tech.id]);
                            } else {
                              setFormAssignedTechs(prev => prev.filter(id => id !== tech.id));
                            }
                          }}
                          className="rounded text-[#27431e] focus:ring-[#27431e]"
                        />
                        <span className="truncate">{tech.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Checklist de Etapas */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Checklist de Tarefas / Etapas</span>
                  <button
                    type="button"
                    onClick={() => setChecklistInputs(prev => [...prev, ''])}
                    className="text-xs text-[#27431e] font-bold hover:underline cursor-pointer"
                  >
                    + Adicionar Etapa
                  </button>
                </label>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {checklistInputs.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder={`Etapa ${idx + 1}...`}
                        value={val}
                        onChange={(e) => {
                          const updated = [...checklistInputs];
                          updated[idx] = e.target.value;
                          setChecklistInputs(updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#27431e]"
                      />
                      {checklistInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setChecklistInputs(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingMission(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] hover:bg-[#27431e] text-xs font-black shadow-md border border-[#cba135]/50 cursor-pointer"
                >
                  {editingMission ? 'Salvar Alterações' : 'Criar Missão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE DETALHES DA MISSÃO & DESPACHOS ================= */}
      {selectedMission && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedMission(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 cursor-default"
          >
            <div className="bg-[#1e3316] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-[#dfb642]" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-[#dfb642] text-[#192b14] px-2 py-0.5 rounded">
                      {selectedMission.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${getPriorityBadge(selectedMission.priority)}`}>
                      {selectedMission.priority}
                    </span>
                  </div>
                  <h3 className="font-bold text-base mt-1">
                    {selectedMission.title}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyMission(selectedMission)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#dfb642] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar dados da missão"
                >
                  {copiedMissionId === selectedMission.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Dados</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setSelectedMission(null)}
                  className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-[#27431e] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Informações Gerais */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedMission.description}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-200">
                  <div>
                    <span>Criada por: </span>
                    <strong className="text-slate-800">{selectedMission.createdBy} ({selectedMission.createdByRole})</strong>
                  </div>
                  <div>
                    <span>Prazo: </span>
                    <strong className="text-slate-800">
                      {selectedMission.deadline ? new Date(selectedMission.deadline).toLocaleDateString('pt-BR') : 'Sem prazo fixo'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Status da Missão */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Status Atual:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getStatusBadge(selectedMission.status)}`}>
                    {getStatusLabel(selectedMission.status)}
                  </span>
                </div>

                {canInteract && (
                  <div className="flex items-center gap-2">
                    {selectedMission.status !== 'em_andamento' && selectedMission.status !== 'concluida' && (
                      <button
                        onClick={() => {
                          onUpdateMission(selectedMission.id, { status: 'em_andamento' });
                          setSelectedMission(prev => prev ? { ...prev, status: 'em_andamento' } : null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 cursor-pointer"
                      >
                        ▶ Marcar Em Andamento
                      </button>
                    )}
                    {selectedMission.status !== 'concluida' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const completedAt = new Date().toISOString();
                          const allDoneChecklist = (selectedMission.checklist || []).map(c => ({ ...c, done: true }));
                          onUpdateMission(selectedMission.id, { 
                            status: 'concluida', 
                            completedAt,
                            checklist: allDoneChecklist
                          });
                          setSelectedMission(prev => prev ? { 
                            ...prev, 
                            status: 'concluida', 
                            completedAt,
                            checklist: allDoneChecklist
                          } : null);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black border border-emerald-700 cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                        title="Concluir esta missão imediatamente"
                      >
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                        <span>Concluir Missão (1 Clique)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onUpdateMission(selectedMission.id, { status: 'em_andamento', completedAt: undefined });
                          setSelectedMission(prev => prev ? { ...prev, status: 'em_andamento', completedAt: undefined } : null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
                      >
                        <span>Reabrir Missão</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Checklist Interativo */}
              {selectedMission.checklist && selectedMission.checklist.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-[#27431e]" />
                    <span>Checklist Operacional</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedMission.checklist.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                          item.done ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 line-through' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          disabled={!canInteract}
                          onChange={() => {
                            onToggleChecklistItem(selectedMission.id, item.id);
                            setSelectedMission(prev => {
                              if (!prev || !prev.checklist) return prev;
                              return {
                                ...prev,
                                checklist: prev.checklist.map(c => c.id === item.id ? { ...c, done: !c.done } : c)
                              };
                            });
                          }}
                          className="rounded text-[#27431e] focus:ring-[#27431e] w-4 h-4"
                        />
                        <span className="flex-1 font-medium">{item.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Diário de Bordo / Despachos da Missão */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#27431e]" />
                  <span>Diário de Bordo / Registros Técnicos ({selectedMission.notes?.length || 0})</span>
                </h4>

                {/* Lista de notas */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedMission.notes && selectedMission.notes.length > 0 ? (
                    selectedMission.notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                          <strong className="text-[#1e3316] font-bold">{note.author} ({note.authorRole})</strong>
                          <span>{new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-800">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nenhum despacho ou observação técnica registrada ainda.</p>
                  )}
                </div>

                {/* Campo para adicionar novo despacho */}
                {canInteract && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newNoteText.trim()) return;
                      onAddMissionNote(selectedMission.id, newNoteText.trim());
                      const newNote = {
                        id: `n-${Date.now()}`,
                        author: currentUser?.name || 'Militar da TI',
                        authorRole: currentUser?.role || 'INF-TECNICO',
                        text: newNoteText.trim(),
                        createdAt: new Date().toISOString(),
                      };
                      setSelectedMission(prev => prev ? {
                        ...prev,
                        notes: [...(prev.notes || []), newNote]
                      } : null);
                      setNewNoteText('');
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Registrar despacho, andamento ou observação militar..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#27431e]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center gap-1 hover:bg-[#27431e] cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Registrar</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Botão de Excluir Missão (Exclusivo Chefe da Seção) */}
              {canDeleteMissions && (
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingMissionId(selectedMission.id);
                      setSelectedMission(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir esta Missão (Chefe da Seção)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ================= */}
      {deletingMissionId && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingMissionId(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-200 space-y-4 cursor-default"
          >
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-black text-base">Excluir Missão da Seção?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Esta ação excluirá permanentemente a missão e todo o histórico de execuções. A exclusão será registrada nos logs de auditoria.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingMissionId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteMission(deletingMissionId);
                  setDeletingMissionId(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black cursor-pointer shadow-sm"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Oficial de Tiragem de Faltas & Efetivo do 2º GAC */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        militaryUsers={militaryUsers}
        technicians={technicians}
        currentUser={currentUser}
        a11y={a11y}
        onAddAuditLog={onAddAuditLog}
      />

    </div>
  );
};
