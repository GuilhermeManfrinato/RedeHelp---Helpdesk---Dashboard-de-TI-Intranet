import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  UserCheck, 
  Search, 
  Layers, 
  List, 
  Building2, 
  AlertTriangle, 
  Send, 
  X, 
  ShieldAlert, 
  Wrench, 
  Tv, 
  Trash2, 
  CheckCircle2, 
  GripVertical, 
  Check, 
  HelpCircle, 
  ArrowRight,
  Shield,
  MessageSquare,
  Edit3,
  Zap,
  Radio,
  Lock,
  Sparkles,
  Download,
  ChevronDown,
  ChevronRight,
  Star,
  User
} from 'lucide-react';
import { Ticket, Department, Technician, Priority, TicketStatus, AccessibilitySettings, MilitaryUser } from '../types';
import { generateTicketPdf } from '../utils/ticketPdf';

interface ITDashboardProps {
  tickets: Ticket[];
  departments: Department[];
  technicians: Technician[];
  a11y: AccessibilitySettings;
  currentUser?: MilitaryUser | null;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus, notes?: string) => void;
  onUpdateTicketPriority: (ticketId: string, newPriority: Priority) => void;
  onUpdateTicketTitle?: (ticketId: string, newTitle: string) => void;
  onUpdateTicketCard?: (ticketId: string, updates: Partial<Ticket>) => void;
  onAssignTechnician: (ticketId: string, technicianId: string) => void;
  onAddTicketHistory: (ticketId: string, comment: string, author: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  onOpenTvMode: () => void;
  onSendMessage: (ticketId: string, content: string, sender: 'solicitante' | 'ti', senderName: string) => void;
  onMarkMessagesAsRead: (ticketId: string) => void;
  onMassIntervention?: (message: string) => void;
  initialActiveTicket?: Ticket | null;
  onClearInitialTicket?: () => void;
}

interface DropRequirement {
  ticket: Ticket;
  targetStatus: TicketStatus;
}

export const ITDashboard: React.FC<ITDashboardProps> = ({
  tickets,
  departments,
  technicians,
  a11y,
  currentUser,
  onUpdateTicketStatus,
  onUpdateTicketPriority,
  onUpdateTicketTitle,
  onUpdateTicketCard,
  onAssignTechnician,
  onAddTicketHistory,
  onDeleteTicket,
  onOpenTvMode,
  onSendMessage,
  onMarkMessagesAsRead,
  onMassIntervention,
  initialActiveTicket,
  onClearInitialTicket,
}) => {
  // Controle de Permissões baseado no Perfil Militar
  const userRole = currentUser?.role || '';
  const isDev = userRole === 'dev' || userRole === 'DEV' || userRole === 'System Developer' || currentUser?.username === 'dev';
  const isTV = userRole === 'CH-TVINFO' || userRole === 'INF-TV';
  const isTecnico = userRole === 'INF-TECNICO' || userRole === 'CH-TECNICOINFO' || userRole === 'TECINFO';
  const isXerife = userRole === 'INF-XERIFE' || userRole === 'CH-XERIFEINFO' || userRole === 'XERIFESECINFO';
  const isChefe = userRole === 'CH-SECINFO' || userRole === 'CHSECINFO' || isDev;

  // Regras estritas solicitadas:
  // dev: Superusuário com acesso irrestrito a todas as funções
  // CH-SECINFO: Chefe da Seção - Acesso irrestrito (exclui chamados, edita tudo, move cards)
  // CH-XERIFEINFO: Xerife da TI - Triagem operacional, mover cards no Kanban, intervir em massa, editar dados
  // CH-TECNICOINFO: Técnico de Atendimento - Atende chamados, responde dúvidas, adiciona notas internas
  // CH-TVINFO: Painel TV - Exclusivo para visualização ampliada na TV, sem nenhuma alteração
  const canDelete = isChefe || isDev; // Chefe da Seção e DEV excluem chamados
  const canEditTitle = isChefe || isXerife || isDev; // Chefe, Xerife e DEV renomeiam
  const canEditCard = isChefe || isXerife || isDev; // Chefe, Xerife e DEV editam dados do chamado
  const canAssignTech = isChefe || isXerife || isDev; // Chefe, Xerife e DEV atribuem técnicos
  const canChangePriority = isChefe || isXerife || isDev; // Chefe, Xerife e DEV alteram prioridade
  const canMassIntervene = isXerife || isDev; // Intervenção do Xerife: Xerife e DEV
  const canMoveStatus = isXerife || isChefe || isDev; // Xerife, Chefe da Seção e DEV movem cards no Kanban
  const canReplyChat = !isTV; // Chefe, Xerife, Técnicos e DEV respondem chat
  const canAddNotes = !isTV; // Chefe, Xerife, Técnicos e DEV despacham parecer técnico interno

  // Estado para contrair / colapsar categorias / colunas do Kanban
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});

  const toggleColumnCollapse = (statusKey: string) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [statusKey]: !prev[statusKey]
    }));
  };

  // Filtros
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Visualização: 'kanban' ou 'table'
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [mobileKanbanTab, setMobileKanbanTab] = useState<'all' | TicketStatus>('all');

  // Modal de Detalhes
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [newNote, setNewNote] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>(currentUser?.name || 'Seção de TI');
  const [resolutionText, setResolutionText] = useState<string>('');
  const [tiChatInput, setTiChatInput] = useState<string>('');

  // Militares elegíveis para atribuição operacional de chamados:
  // Regra solicitada: Remover sargentos (Das Neves, Cavalcanti), auxiliar (Sd Castro) e o dev (Guilherme Manfrinato).
  // Apenas técnicos operacionais (Sd Machado, Sd Oliveira, Sd Vecchiato, Sd Arantes) recebem atribuição direta.
  const assignableTechnicians = technicians.filter(tc => {
    const name = tc.name.toLowerCase();
    const role = (tc.role || '').toLowerCase();
    const id = tc.id.toLowerCase();
    if (id === 'tech-dev' || name.includes('manfrinato') || role.includes('desenvolvedor')) return false;
    if (name.includes('sgt') || name.includes('sargento') || name.includes('das neves') || name.includes('das deves') || name.includes('cavalcanti')) return false;
    if (name.includes('castro') || role.includes('auxiliar') || id === 'tech-castro') return false;
    return true;
  });

  // Sincronização e redirecionamento direto ao chamado
  useEffect(() => {
    if (initialActiveTicket) {
      setActiveTicket(initialActiveTicket);
      onMarkMessagesAsRead(initialActiveTicket.id);
      onClearInitialTicket?.();
    }
  }, [initialActiveTicket, onClearInitialTicket, onMarkMessagesAsRead]);

  // Manter activeTicket em sincronia em tempo real com a lista de tickets (mensagens instantâneas)
  useEffect(() => {
    if (activeTicket) {
      const fresh = tickets.find(t => t.id === activeTicket.id);
      if (fresh && JSON.stringify(fresh.messages) !== JSON.stringify(activeTicket.messages)) {
        setActiveTicket(fresh);
      }
    }
  }, [tickets, activeTicket]);

  // Modais de Ações do Card: Exclusão, Conclusão e Edição Completa
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [ticketToResolve, setTicketToResolve] = useState<Ticket | null>(null);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [resolveNoteInput, setResolveNoteInput] = useState<string>('Atendimento técnico concluído com sucesso pela Seção de TI.');

  // Form states para alteração completa das informações do card
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('media');
  const [editDeptId, setEditDeptId] = useState('');
  const [editTechId, setEditTechId] = useState('');
  const [editRequesterName, setEditRequesterName] = useState('');

  // Edição do Nome/Título do Chamado (Exclusivo Xerife e Chefe)
  const [editingTicketTitle, setEditingTicketTitle] = useState<{ id: string; code: string; title: string } | null>(null);
  const [newTitleInput, setNewTitleInput] = useState<string>('');

  // Intervenção em Massa do Xerife
  const [showMassInterventionModal, setShowMassInterventionModal] = useState<boolean>(false);
  const [massInterventionText, setMassInterventionText] = useState<string>('');

  // Drag and Drop State
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);
  
  // Modal de Requisito para Mudança de Coluna
  const [dropRequirement, setDropRequirement] = useState<DropRequirement | null>(null);
  const [reqTechnicianId, setReqTechnicianId] = useState<string>('');
  const [reqNote, setReqNote] = useState<string>('');

  // Fechamento de qualquer modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (ticketToDelete) setTicketToDelete(null);
        else if (ticketToResolve) setTicketToResolve(null);
        else if (ticketToEdit) setTicketToEdit(null);
        else if (editingTicketTitle) setEditingTicketTitle(null);
        else if (showMassInterventionModal) setShowMassInterventionModal(false);
        else if (dropRequirement) setDropRequirement(null);
        else if (activeTicket) setActiveTicket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ticketToDelete, ticketToResolve, ticketToEdit, editingTicketTitle, showMassInterventionModal, dropRequirement, activeTicket]);

  // Métricas rápidas
  const openCount = tickets.filter(t => t.status === 'aberto').length;
  const inProgressCount = tickets.filter(t => t.status === 'em_atendimento').length;
  const waitingCount = tickets.filter(t => t.status === 'aguardando').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolvido' || t.status === 'cancelado').length;
  const criticalCount = tickets.filter(t => t.priority === 'critica' && t.status !== 'resolvido' && t.status !== 'cancelado').length;

  // Filtragem dos chamados
  const filteredTickets = tickets.filter(t => {
    if (selectedDeptId !== 'all' && t.departmentId !== selectedDeptId) return false;
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'resolvido') {
        if (t.status !== 'resolvido' && t.status !== 'cancelado') return false;
      } else if (t.status !== selectedStatus) {
        return false;
      }
    }
    if (selectedTechnicianId !== 'all') {
      if (selectedTechnicianId === 'unassigned' && t.technicianId !== null) return false;
      if (selectedTechnicianId !== 'unassigned' && t.technicianId !== selectedTechnicianId) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const dept = departments.find(d => d.id === t.departmentId);
      const tech = technicians.find(tech => tech.id === t.technicianId);
      const match = (
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (dept && dept.name.toLowerCase().includes(q)) ||
        (tech && tech.name.toLowerCase().includes(q))
      );
      if (!match) return false;
    }
    return true;
  });

  // Helper para cor da prioridade
  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case 'critica':
        return {
          bg: 'bg-red-600 text-white',
          label: 'CRÍTICA',
        };
      case 'alta':
        return {
          bg: 'bg-orange-500 text-white',
        };
      case 'media':
        return {
          bg: 'bg-[#27431e] text-[#dfb642]',
          label: 'MÉDIA',
        };
      case 'baixa':
        return {
          bg: 'bg-slate-600 text-white',
          label: 'BAIXA',
        };
    }
  };

  // Toggle do Filtro de Críticos (ao clicar novamente, remove)
  const handleToggleCriticalFilter = () => {
    if (selectedPriority === 'critica') {
      setSelectedPriority('all');
    } else {
      setSelectedPriority('critica');
      setSelectedStatus('all');
    }
  };

  // Regra de exclusividade de diálogo: fechar outras caixas abertas ao disparar um modal
  const closeOtherModals = () => {
    setTicketToDelete(null);
    setTicketToResolve(null);
    setTicketToEdit(null);
    setEditingTicketTitle(null);
    setShowMassInterventionModal(false);
    setDropRequirement(null);
  };

  // Exclusão rápida de chamado com confirmação via modal (sem window.confirm)
  const handleDeleteTicket = (ticket: Ticket) => {
    closeOtherModals();
    setTicketToDelete(ticket);
  };

  const handleConfirmDelete = () => {
    if (!ticketToDelete) return;
    const tId = ticketToDelete.id;
    if (activeTicket?.id === tId) {
      setActiveTicket(null);
    }
    setTicketToDelete(null);
    onDeleteTicket(tId);
  };

  // Conclusão rápida de chamado com confirmação de despacho via modal (sem window.prompt)
  const handleQuickResolve = (ticket: Ticket) => {
    if (ticket.status === 'resolvido') return;
    closeOtherModals();
    setTicketToResolve(ticket);
    setResolveNoteInput('Atendimento técnico concluído com sucesso pela Seção de TI.');
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToResolve) return;
    const note = resolveNoteInput.trim() || 'Atendimento concluído pela Seção de TI.';
    onUpdateTicketStatus(ticketToResolve.id, 'resolvido', note);
    if (activeTicket?.id === ticketToResolve.id) {
      setActiveTicket(prev => prev ? {
        ...prev,
        status: 'resolvido',
        resolvedAt: new Date().toISOString(),
        resolutionNotes: note
      } : null);
    }
    setTicketToResolve(null);
  };

  // Alteração completa das informações do card
  const handleOpenEditCard = (ticket: Ticket) => {
    closeOtherModals();
    setTicketToEdit(ticket);
    setEditTitle(ticket.title);
    setEditDesc(ticket.description);
    setEditPriority(ticket.priority);
    setEditDeptId(ticket.departmentId);
    setEditTechId(ticket.technicianId || '');
    setEditRequesterName(ticket.requesterName || '');
  };

  const handleConfirmEditCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToEdit) return;
    const updates: Partial<Ticket> = {
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPriority,
      departmentId: editDeptId,
      technicianId: editTechId || null,
      requesterName: editRequesterName.trim() || ticketToEdit.requesterName,
      slaLimitHours: editPriority === 'critica' ? 1 : editPriority === 'alta' ? 2 : editPriority === 'media' ? 4 : 24,
    };
    if (onUpdateTicketCard) {
      onUpdateTicketCard(ticketToEdit.id, updates);
    } else {
      if (editTitle.trim() !== ticketToEdit.title && onUpdateTicketTitle) {
        onUpdateTicketTitle(ticketToEdit.id, editTitle.trim());
      }
      if (editPriority !== ticketToEdit.priority) {
        onUpdateTicketPriority(ticketToEdit.id, editPriority);
      }
      if (editTechId !== (ticketToEdit.technicianId || '')) {
        onAssignTechnician(ticketToEdit.id, editTechId);
      }
    }
    if (activeTicket?.id === ticketToEdit.id) {
      setActiveTicket(prev => prev ? { ...prev, ...updates } : null);
    }
    setTicketToEdit(null);
  };

  // Início do arrasto do card
  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    setDraggedTicketId(ticket.id);
    e.dataTransfer.setData('text/plain', ticket.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Soltar card na coluna
  const handleDropOnColumn = (targetStatus: TicketStatus) => {
    setDragOverColumn(null);
    if (!draggedTicketId) return;
    const ticket = tickets.find(t => t.id === draggedTicketId);
    setDraggedTicketId(null);
    if (!ticket || ticket.status === targetStatus) return;

    // Dispara modal de requisitos de acordo com a coluna alvo
    if (targetStatus === 'em_atendimento') {
      setReqTechnicianId(ticket.technicianId || technicians[0]?.id || '');
      setReqNote('');
      setDropRequirement({ ticket, targetStatus });
    } else if (targetStatus === 'aguardando') {
      setReqNote('Aguardando peça de reposição / manutenção externa');
      setDropRequirement({ ticket, targetStatus });
    } else if (targetStatus === 'resolvido') {
      setReqNote('Atendimento técnico concluído com sucesso pela Seção de TI.');
      setDropRequirement({ ticket, targetStatus });
    } else if (targetStatus === 'aberto') {
      setReqNote('Retornado para triagem na fila da OM.');
      setDropRequirement({ ticket, targetStatus });
    }
  };

  // Confirmar requisitos da mudança de coluna
  const handleConfirmRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropRequirement) return;
    const { ticket, targetStatus } = dropRequirement;

    if (targetStatus === 'em_atendimento') {
      if (reqTechnicianId) {
        onAssignTechnician(ticket.id, reqTechnicianId);
      }
      onUpdateTicketStatus(ticket.id, 'em_atendimento', reqNote.trim() || undefined);
    } else if (targetStatus === 'aguardando') {
      onUpdateTicketStatus(ticket.id, 'aguardando', reqNote.trim() || 'Aguardando peça');
    } else if (targetStatus === 'resolvido') {
      onUpdateTicketStatus(ticket.id, 'resolvido', reqNote.trim() || 'Atendimento concluído pela Seção de TI.');
    } else if (targetStatus === 'aberto') {
      onUpdateTicketStatus(ticket.id, 'aberto', reqNote.trim() || 'Retornado para fila');
    }

    setDropRequirement(null);
    setReqNote('');
    setReqTechnicianId('');
  };

  const handleSaveNote = () => {
    if (!activeTicket || !newNote.trim()) return;
    onAddTicketHistory(activeTicket.id, newNote.trim(), authorName);
    
    // Atualiza modal ativo
    setActiveTicket(prev => {
      if (!prev) return null;
      return {
        ...prev,
        history: [
          ...prev.history,
          {
            id: `h-${Date.now()}`,
            date: new Date().toISOString(),
            author: authorName,
            action: 'Despacho Técnico',
            comment: newNote.trim(),
          }
        ]
      };
    });
    setNewNote('');
  };

  const handleResolveFromModal = () => {
    if (!activeTicket) return;
    onUpdateTicketStatus(activeTicket.id, 'resolvido', resolutionText.trim() || 'Atendimento concluído pela Seção de TI.');
    setActiveTicket(null);
    setResolutionText('');
  };

  // Funções exclusivas do Xerife e Chefe da Seção
  const handleStartEditTitle = (ticket: Ticket) => {
    if (!canEditTitle) return;
    setEditingTicketTitle({ id: ticket.id, code: ticket.code, title: ticket.title });
    setNewTitleInput(ticket.title);
  };

  const handleConfirmEditTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicketTitle || !newTitleInput.trim()) return;
    if (onUpdateTicketTitle) {
      onUpdateTicketTitle(editingTicketTitle.id, newTitleInput.trim());
    }
    if (activeTicket && activeTicket.id === editingTicketTitle.id) {
      setActiveTicket(prev => prev ? { ...prev, title: newTitleInput.trim() } : null);
    }
    setEditingTicketTitle(null);
    setNewTitleInput('');
  };

  const handleConfirmMassIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!massInterventionText.trim() || !onMassIntervention) return;
    onMassIntervention(massInterventionText.trim());
    setShowMassInterventionModal(false);
    setMassInterventionText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Banner de Modo TV Sem Interação (CH-TVINFO) */}
      {isTV && (
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-yellow-400 text-yellow-300 text-xs font-mono font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-400 text-black">
              <Tv className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-sm font-black text-white block">
                MODO CH-TVINFO · EXIBIÇÃO DE CHAMADOS (SEM INTERAÇÃO)
              </span>
              <span className="text-slate-300 font-normal">
                Este perfil possui acesso exclusivo para monitoramento no telão da sala. Interações e respostas estão bloqueadas.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenTvMode}
            className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-black uppercase text-xs hover:bg-yellow-300 transition-colors shrink-0"
          >
            Abrir Telão Fullscreen →
          </button>
        </div>
      )}

      {/* Alerta de Chamado Crítico com Toggle de 2 cliques */}
      {criticalCount > 0 && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-md transition-all ${
          selectedPriority === 'critica'
            ? 'bg-amber-950 border-2 border-yellow-400 text-yellow-100'
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <span className="font-bold text-base block">
                {selectedPriority === 'critica'
                  ? `FILTRO ATIVO: Exibindo ${criticalCount} chamado(s) com prioridade CRÍTICA`
                  : `ATENÇÃO: Existem ${criticalCount} chamado(s) com prioridade CRÍTICA na fila da OM!`
                }
              </span>
              <span className="text-xs opacity-90 block">
                {selectedPriority === 'critica'
                  ? 'Clique novamente no botão ao lado para desativar o filtro e voltar a ver todos os chamados.'
                  : 'Atendimento urgente requerido pelo militar solicitante.'
                }
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleCriticalFilter}
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 ${
              selectedPriority === 'critica'
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 ring-2 ring-white font-black'
                : 'bg-white text-red-700 hover:bg-red-50'
            }`}
            title="Clique para filtrar ou clique novamente para remover o filtro de críticos"
          >
            {selectedPriority === 'critica' ? '✓ Filtro Ativo (Desativar)' : 'Filtrar Críticos'}
          </button>
        </div>
      )}

      {/* Cards de Resumo & Intervenção Geral */}
      <div className="w-full">
        {/* Contadores e Intervenção Geral com mesmo tamanho e layout responsivo */}
        <div className={`grid grid-cols-2 ${canMassIntervene ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-4'} gap-3`}>
          <div 
            onClick={() => setSelectedStatus(selectedStatus === 'aberto' ? 'all' : 'aberto')}
            className={`p-4 rounded-2xl bg-white border shadow-xs cursor-pointer transition-all ${
              selectedStatus === 'aberto' ? 'border-[#27431e] ring-2 ring-[#27431e]/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Fila (Triagem)</span>
              <AlertCircle className="w-4 h-4 text-[#27431e]" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 tabular-nums">
              {openCount}
            </div>
          </div>

          <div 
            onClick={() => setSelectedStatus(selectedStatus === 'em_atendimento' ? 'all' : 'em_atendimento')}
            className={`p-4 rounded-2xl bg-white border shadow-xs cursor-pointer transition-all ${
              selectedStatus === 'em_atendimento' ? 'border-amber-600 ring-2 ring-amber-600/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Em Atendimento</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-600 tabular-nums">
              {inProgressCount}
            </div>
          </div>

          <div 
            onClick={() => setSelectedStatus(selectedStatus === 'aguardando' ? 'all' : 'aguardando')}
            className={`p-4 rounded-2xl bg-white border shadow-xs cursor-pointer transition-all ${
              selectedStatus === 'aguardando' ? 'border-purple-600 ring-2 ring-purple-600/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Aguardando Peça</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black font-mono text-purple-600 tabular-nums">
              {waitingCount}
            </div>
          </div>

          <div 
            onClick={() => setSelectedStatus(selectedStatus === 'resolvido' ? 'all' : 'resolvido')}
            className={`p-4 rounded-2xl bg-white border shadow-xs cursor-pointer transition-all ${
              selectedStatus === 'resolvido' ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Resolvidos</span>
              <CheckCircle className="w-4 h-4 text-[#27431e]" />
            </div>
            <div className="text-2xl font-black font-mono text-[#27431e] tabular-nums">
              {resolvedCount}
            </div>
          </div>

          {/* Card de INTERVENÇÃO GERAL (Mobile e PC - mesmo tamanho e dimensões dos outros cards) */}
          {canMassIntervene && (
            <div 
              onClick={() => {
                setShowMassInterventionModal(true);
                setMassInterventionText('');
              }}
              className="p-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white border border-amber-700 shadow-sm cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between"
              title="Intervenção Geral: Enviar despacho em massa para todos os chamados em aberto"
            >
              <div className="flex items-center justify-between text-amber-100 text-xs font-semibold mb-1">
                <span className="uppercase font-bold tracking-wider text-[11px]">INTERVENÇÃO GERAL</span>
                <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-black text-white leading-tight">
                  DESPACHO GERAL
                </div>
                <div className="text-[10px] text-amber-100 font-mono mt-0.5 truncate">
                  Todos os Chamados
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Busca textual */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código (#TICKET-1001), militar solicitante, seção da OM ou técnico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#27431e] bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Alternador de Modo de Visualização */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Quadro Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Tabela Detalhada</span>
            </button>
          </div>
        </div>

        {/* Filtros em Linha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          
          {/* Filtro Seção */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#27431e]" />
              <span>Seção da OM:</span>
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="all">Todas as Seções</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Prioridade */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Prioridade:</span>
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="critica">Crítica (Emergência)</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          {/* Filtro Status */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Status da Ordem:</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="all">Todos os Status</option>
              <option value="aberto">Aberto (Não iniciado)</option>
              <option value="em_atendimento">Em Atendimento</option>
              <option value="aguardando">Aguardando Peça</option>
              <option value="resolvido">Resolvido</option>
            </select>
          </div>

          {/* Filtro Técnico */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[#27431e]" />
              <span>Militar Responsável:</span>
            </label>
            <select
              value={selectedTechnicianId}
              onChange={(e) => setSelectedTechnicianId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="all">Todos os Militares da TI</option>
              <option value="unassigned">Sem Militar Atribuído</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} ({tech.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dica de Arraste no Quadro */}
      {viewMode === 'kanban' && (
        <div className="flex items-center justify-between text-xs text-slate-500 bg-emerald-50/80 border border-emerald-200/80 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-950 font-medium">
            <GripVertical className="w-4 h-4 text-[#27431e]" />
            <span><strong>Dica:</strong> Você pode arrastar os cards entre as colunas para alterar o andamento. O sistema solicitará automaticamente os requisitos de cada etapa.</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-800 font-bold hidden sm:inline">
            Arraste & Solte Ativo
          </span>
        </div>
      )}

      {/* MODO 1: QUADRO KANBAN INTERATIVO COM DRAG & DROP */}
      {viewMode === 'kanban' && (
        <div className="space-y-3">
          {/* Seletor Rápido de Colunas para Dispositivos Móveis */}
          <div className="sm:hidden flex items-center gap-1.5 p-1 bg-slate-200/90 rounded-2xl overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setMobileKanbanTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                mobileKanbanTab === 'all'
                  ? 'bg-[#1e3316] text-[#dfb642] shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Todas ({filteredTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileKanbanTab('aberto')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                mobileKanbanTab === 'aberto'
                  ? 'bg-[#1e3316] text-[#dfb642] shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Abertos ({filteredTickets.filter(t => t.status === 'aberto').length})
            </button>
            <button
              type="button"
              onClick={() => setMobileKanbanTab('em_atendimento')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                mobileKanbanTab === 'em_atendimento'
                  ? 'bg-[#1e3316] text-[#dfb642] shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Atendimento ({filteredTickets.filter(t => t.status === 'em_atendimento').length})
            </button>
            <button
              type="button"
              onClick={() => setMobileKanbanTab('aguardando')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                mobileKanbanTab === 'aguardando'
                  ? 'bg-[#1e3316] text-[#dfb642] shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Aguardando ({filteredTickets.filter(t => t.status === 'aguardando').length})
            </button>
            <button
              type="button"
              onClick={() => setMobileKanbanTab('resolvido')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                mobileKanbanTab === 'resolvido'
                  ? 'bg-[#1e3316] text-[#dfb642] shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Resolvidos ({filteredTickets.filter(t => t.status === 'resolvido').length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            
            {/* Coluna 1: Abertos / Triagem */}
            <div 
              onDragOver={(e) => {
                if (!canMoveStatus) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== 'aberto') setDragOverColumn('aberto');
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                if (!canMoveStatus) return;
                e.preventDefault();
                handleDropOnColumn('aberto');
              }}
              className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                collapsedColumns['aberto'] ? 'min-h-[90px]' : 'min-h-[420px]'
              } ${
                mobileKanbanTab !== 'all' && mobileKanbanTab !== 'aberto' ? 'hidden sm:block' : 'block'
              } ${
                dragOverColumn === 'aberto'
                  ? 'bg-emerald-50 border-2 border-dashed border-[#27431e] ring-4 ring-[#27431e]/15'
                  : 'bg-slate-100/70 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e3316]"></span>
                  1. Abertos / Triagem
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                    {filteredTickets.filter(t => t.status === 'aberto').length}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleColumnCollapse('aberto')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title={collapsedColumns['aberto'] ? 'Expandir coluna' : 'Contrair coluna'}
                  >
                    {collapsedColumns['aberto'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {collapsedColumns['aberto'] ? (
                <div 
                  onClick={() => toggleColumnCollapse('aberto')}
                  className="py-4 text-center cursor-pointer hover:bg-slate-200/50 rounded-xl transition-colors space-y-1"
                  title="Clique para expandir"
                >
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                    Contraído ({filteredTickets.filter(t => t.status === 'aberto').length})
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block hover:underline">
                    Expandir ▾
                  </span>
                </div>
              ) : (
                <>
                  {dragOverColumn === 'aberto' && (
                    <div className="p-3 text-center rounded-xl bg-white border border-[#27431e] text-xs font-bold text-[#1e3316] animate-pulse">
                      Solte aqui para retornar à Triagem
                    </div>
                  )}

                  <div className="space-y-3">
                    {filteredTickets.filter(t => t.status === 'aberto').map(ticket => (
                      <KanbanTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        departments={departments}
                        technicians={technicians}
                        canAssign={canAssignTech}
                        canDelete={canDelete}
                        canEditTitle={canEditTitle}
                        canEditCard={canEditCard}
                        canMoveStatus={canMoveStatus}
                        onClick={() => {
                          setActiveTicket(ticket);
                          onMarkMessagesAsRead(ticket.id);
                        }}
                        onQuickAssign={(techId) => onAssignTechnician(ticket.id, techId)}
                        onQuickAdvance={() => {
                          setReqTechnicianId(ticket.technicianId || technicians[0]?.id || '');
                          setReqNote('');
                          setDropRequirement({ ticket, targetStatus: 'em_atendimento' });
                        }}
                        onQuickResolve={() => handleQuickResolve(ticket)}
                        onDelete={() => handleDeleteTicket(ticket)}
                        onEditTitle={() => handleStartEditTitle(ticket)}
                        onEditCard={() => handleOpenEditCard(ticket)}
                        onDragStart={(e) => handleDragStart(e, ticket)}
                      />
                    ))}

                    {filteredTickets.filter(t => t.status === 'aberto').length === 0 && dragOverColumn !== 'aberto' && (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium">
                        Nenhum chamado aberto na triagem.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          {/* Coluna 2: Em Atendimento */}
          <div 
            onDragOver={(e) => {
              if (!canMoveStatus) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverColumn !== 'em_atendimento') setDragOverColumn('em_atendimento');
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverColumn(null);
              }
            }}
            onDrop={(e) => {
              if (!canMoveStatus) return;
              e.preventDefault();
              handleDropOnColumn('em_atendimento');
            }}
            className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
              collapsedColumns['em_atendimento'] ? 'min-h-[90px]' : 'min-h-[420px]'
            } ${
              mobileKanbanTab !== 'all' && mobileKanbanTab !== 'em_atendimento' ? 'hidden sm:block' : 'block'
            } ${
              dragOverColumn === 'em_atendimento'
                ? 'bg-amber-50 border-2 border-dashed border-amber-600 ring-4 ring-amber-500/15'
                : 'bg-slate-100/70 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                2. Em Atendimento
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                  {filteredTickets.filter(t => t.status === 'em_atendimento').length}
                </span>
                <button
                  type="button"
                  onClick={() => toggleColumnCollapse('em_atendimento')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title={collapsedColumns['em_atendimento'] ? 'Expandir coluna' : 'Contrair coluna'}
                >
                  {collapsedColumns['em_atendimento'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {collapsedColumns['em_atendimento'] ? (
              <div 
                onClick={() => toggleColumnCollapse('em_atendimento')}
                className="py-4 text-center cursor-pointer hover:bg-slate-200/50 rounded-xl transition-colors space-y-1"
                title="Clique para expandir"
              >
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                  Contraído ({filteredTickets.filter(t => t.status === 'em_atendimento').length})
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block hover:underline">
                  Expandir ▾
                </span>
              </div>
            ) : (
              <>
                {dragOverColumn === 'em_atendimento' && (
                  <div className="p-3 text-center rounded-xl bg-white border border-amber-600 text-xs font-bold text-amber-900 animate-pulse">
                    Solte aqui para Iniciar Atendimento
                  </div>
                )}

                <div className="space-y-3">
                  {filteredTickets.filter(t => t.status === 'em_atendimento').map(ticket => (
                    <KanbanTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      departments={departments}
                      technicians={technicians}
                      canAssign={canAssignTech}
                      canDelete={canDelete}
                      canEditTitle={canEditTitle}
                      canEditCard={canEditCard}
                      canMoveStatus={canMoveStatus}
                      onClick={() => {
                        setActiveTicket(ticket);
                        onMarkMessagesAsRead(ticket.id);
                      }}
                      onQuickAssign={(techId) => onAssignTechnician(ticket.id, techId)}
                      onQuickAdvance={() => {
                        setReqNote('Atendimento técnico concluído com sucesso pela Seção de TI.');
                        setDropRequirement({ ticket, targetStatus: 'resolvido' });
                      }}
                      onQuickResolve={() => handleQuickResolve(ticket)}
                      onDelete={() => handleDeleteTicket(ticket)}
                      onEditTitle={() => handleStartEditTitle(ticket)}
                      onEditCard={() => handleOpenEditCard(ticket)}
                      onDragStart={(e) => handleDragStart(e, ticket)}
                    />
                  ))}

                  {filteredTickets.filter(t => t.status === 'em_atendimento').length === 0 && dragOverColumn !== 'em_atendimento' && (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium">
                      Nenhum chamado em atendimento no momento.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Coluna 3: Aguardando Peça */}
          <div 
            onDragOver={(e) => {
              if (!canMoveStatus) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverColumn !== 'aguardando') setDragOverColumn('aguardando');
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverColumn(null);
              }
            }}
            onDrop={(e) => {
              if (!canMoveStatus) return;
              e.preventDefault();
              handleDropOnColumn('aguardando');
            }}
            className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
              collapsedColumns['aguardando'] ? 'min-h-[90px]' : 'min-h-[420px]'
            } ${
              mobileKanbanTab !== 'all' && mobileKanbanTab !== 'aguardando' ? 'hidden sm:block' : 'block'
            } ${
              dragOverColumn === 'aguardando'
                ? 'bg-purple-50 border-2 border-dashed border-purple-600 ring-4 ring-purple-500/15'
                : 'bg-slate-100/70 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                3. Aguardando Peça
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                  {filteredTickets.filter(t => t.status === 'aguardando').length}
                </span>
                <button
                  type="button"
                  onClick={() => toggleColumnCollapse('aguardando')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title={collapsedColumns['aguardando'] ? 'Expandir coluna' : 'Contrair coluna'}
                >
                  {collapsedColumns['aguardando'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {collapsedColumns['aguardando'] ? (
              <div 
                onClick={() => toggleColumnCollapse('aguardando')}
                className="py-4 text-center cursor-pointer hover:bg-slate-200/50 rounded-xl transition-colors space-y-1"
                title="Clique para expandir"
              >
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                  Contraído ({filteredTickets.filter(t => t.status === 'aguardando').length})
                </span>
                <span className="text-[10px] text-purple-700 font-semibold block hover:underline">
                  Expandir ▾
                </span>
              </div>
            ) : (
              <>
                {dragOverColumn === 'aguardando' && (
                  <div className="p-3 text-center rounded-xl bg-white border border-purple-600 text-xs font-bold text-purple-900 animate-pulse">
                    Solte aqui para Aguardando Peça
                  </div>
                )}

                <div className="space-y-3">
                  {filteredTickets.filter(t => t.status === 'aguardando').map(ticket => (
                    <KanbanTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      departments={departments}
                      technicians={technicians}
                      canAssign={canAssignTech}
                      canDelete={canDelete}
                      canEditTitle={canEditTitle}
                      canEditCard={canEditCard}
                      canMoveStatus={canMoveStatus}
                      onClick={() => {
                        setActiveTicket(ticket);
                        onMarkMessagesAsRead(ticket.id);
                      }}
                      onQuickAssign={(techId) => onAssignTechnician(ticket.id, techId)}
                      onQuickAdvance={() => {
                        setReqTechnicianId(ticket.technicianId || technicians[0]?.id || '');
                        setReqNote('Peça recebida, retomando atendimento.');
                        setDropRequirement({ ticket, targetStatus: 'em_atendimento' });
                      }}
                      onQuickResolve={() => handleQuickResolve(ticket)}
                      onDelete={() => handleDeleteTicket(ticket)}
                      onEditTitle={() => handleStartEditTitle(ticket)}
                      onEditCard={() => handleOpenEditCard(ticket)}
                      onDragStart={(e) => handleDragStart(e, ticket)}
                    />
                  ))}

                  {filteredTickets.filter(t => t.status === 'aguardando').length === 0 && dragOverColumn !== 'aguardando' && (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium">
                      Nenhum chamado aguardando peça.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Coluna 4: Resolvidos */}
          <div 
            onDragOver={(e) => {
              if (!canMoveStatus) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverColumn !== 'resolvido') setDragOverColumn('resolvido');
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverColumn(null);
              }
            }}
            onDrop={(e) => {
              if (!canMoveStatus) return;
              e.preventDefault();
              handleDropOnColumn('resolvido');
            }}
            className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
              collapsedColumns['resolvido'] ? 'min-h-[90px]' : 'min-h-[420px]'
            } ${
              mobileKanbanTab !== 'all' && mobileKanbanTab !== 'resolvido' ? 'hidden sm:block' : 'block'
            } ${
              dragOverColumn === 'resolvido'
                ? 'bg-emerald-50 border-2 border-dashed border-emerald-600 ring-4 ring-emerald-500/15'
                : 'bg-slate-100/70 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#27431e]"></span>
                4. Resolvidos
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                  {filteredTickets.filter(t => t.status === 'resolvido' || t.status === 'cancelado').length}
                </span>
                <button
                  type="button"
                  onClick={() => toggleColumnCollapse('resolvido')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title={collapsedColumns['resolvido'] ? 'Expandir coluna' : 'Contrair coluna'}
                >
                  {collapsedColumns['resolvido'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {collapsedColumns['resolvido'] ? (
              <div 
                onClick={() => toggleColumnCollapse('resolvido')}
                className="py-4 text-center cursor-pointer hover:bg-slate-200/50 rounded-xl transition-colors space-y-1"
                title="Clique para expandir"
              >
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                  Contraído ({filteredTickets.filter(t => t.status === 'resolvido' || t.status === 'cancelado').length})
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block hover:underline">
                  Expandir ▾
                </span>
              </div>
            ) : (
              <>
                {dragOverColumn === 'resolvido' && (
                  <div className="p-3 text-center rounded-xl bg-white border border-emerald-600 text-xs font-bold text-emerald-900 animate-pulse">
                    Solte aqui para Concluir Chamado
                  </div>
                )}

                <div className="space-y-3">
                  {filteredTickets.filter(t => t.status === 'resolvido').map(ticket => (
                    <KanbanTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      departments={departments}
                      technicians={technicians}
                      canAssign={canAssignTech}
                      canDelete={canDelete}
                      canEditTitle={canEditTitle}
                      canEditCard={canEditCard}
                      canMoveStatus={canMoveStatus}
                      onClick={() => {
                        setActiveTicket(ticket);
                        onMarkMessagesAsRead(ticket.id);
                      }}
                      onQuickAssign={(techId) => onAssignTechnician(ticket.id, techId)}
                      onQuickResolve={() => handleQuickResolve(ticket)}
                      onDelete={() => handleDeleteTicket(ticket)}
                      onEditTitle={() => handleStartEditTitle(ticket)}
                      onEditCard={() => handleOpenEditCard(ticket)}
                      onDragStart={(e) => handleDragStart(e, ticket)}
                    />
                  ))}

                  {/* Chamados Cancelados: Contraídos e Zebrados dentro da aba de Concluídos */}
                  {filteredTickets.filter(t => t.status === 'cancelado').length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                        <span>Chamados Cancelados ({filteredTickets.filter(t => t.status === 'cancelado').length})</span>
                        <span className="text-[10px] font-mono text-slate-400">Contraídos</span>
                      </div>
                      {filteredTickets.filter(t => t.status === 'cancelado').map(ticket => (
                        <div
                          key={ticket.id}
                          onClick={() => {
                            setActiveTicket(ticket);
                            onMarkMessagesAsRead(ticket.id);
                          }}
                          className="p-2.5 rounded-xl border border-slate-300 text-xs cursor-pointer transition-all hover:border-slate-400 hover:shadow-2xs bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_10px,#f1f5f9_10px,#f1f5f9_20px)] opacity-90 hover:opacity-100"
                          title="Chamado Cancelado (Clique para visualizar histórico e detalhes)"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-slate-200 text-slate-700 uppercase tracking-wider shrink-0">
                                CANCELADO
                              </span>
                              <span className="font-mono font-bold text-slate-700 text-[11px] shrink-0">
                                {ticket.code}
                              </span>
                              <span className="text-slate-600 truncate font-medium text-[11px]">
                                {ticket.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {ticket.requesterName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredTickets.filter(t => t.status === 'resolvido' || t.status === 'cancelado').length === 0 && dragOverColumn !== 'resolvido' && (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium">
                      Nenhum chamado concluído ou cancelado.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          </div>
        </div>
      )}

      {/* MODO 2: TABELA DETALHADA COM AÇÕES RÁPIDAS (CHECK & LIXEIRA) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Seção da OM</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-4">Militar Solicitante</th>
                  <th className="py-3 px-4">Ocorrência</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Militar Atribuído</th>
                  <th className="py-3 px-4 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Nenhum chamado encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => {
                    const dept = departments.find(d => d.id === t.departmentId);
                    const tech = technicians.find(tc => tc.id === t.technicianId);
                    const pStyle = getPriorityStyle(t.priority);
                    const isResolved = t.status === 'resolvido';

                    return (
                      <tr 
                        key={t.id} 
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => {
                          setActiveTicket(t);
                          onMarkMessagesAsRead(t.id);
                        }}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1e3316]">
                          {t.code}
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: dept?.color || '#27431e' }}
                            />
                            <span>{dept?.name}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {canChangePriority ? (
                            <select
                              value={t.priority}
                              onChange={(e) => {
                                e.stopPropagation();
                                onUpdateTicketPriority(t.id, e.target.value as Priority);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`px-2 py-1 rounded text-[11px] font-bold uppercase font-mono ${pStyle.bg} cursor-pointer border-0 shadow-2xs`}
                            >
                              <option value="baixa">Baixa</option>
                              <option value="media">Média</option>
                              <option value="alta">Alta</option>
                              <option value="critica">Crítica</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono ${pStyle.bg}`}>
                              {t.priority}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{t.requesterName}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <span className="truncate">{t.title}</span>
                            {canEditTitle && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditTitle(t);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-[#192b14] hover:bg-slate-200 shrink-0"
                                title="Editar Nome do Chamado (Xerife / Chefe)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-slate-500 truncate text-[11px]">{t.description}</div>
                          {t.messages && t.messages.length > 0 && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                t.messages.some(m => m.sender === 'solicitante' && !m.readByTi)
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-mono animate-pulse'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                <MessageSquare className="w-3 h-3 text-amber-600" />
                                <span>💬 {t.messages.length} {t.messages.some(m => m.sender === 'solicitante' && !m.readByTi) ? '(Dúvida pendente)' : 'mensagens'}</span>
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            t.status === 'resolvido' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'em_atendimento' ? 'bg-[#27431e]/15 text-[#1e3316]' :
                            t.status === 'aguardando' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          {canAssignTech ? (
                            <select
                              value={t.technicianId || ''}
                              onChange={(e) => onAssignTechnician(t.id, e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                            >
                              <option value="">Não Atribuído</option>
                              {assignableTechnicians.map(tc => (
                                <option key={tc.id} value={tc.id}>
                                  {tc.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-600 font-bold text-xs bg-slate-100 px-2 py-1 rounded-md">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{tech ? tech.name : 'Não Atribuído'}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Botão de Fechar / Concluir (Check) */}
                            {!isResolved && canMoveStatus ? (
                              <button
                                onClick={() => handleQuickResolve(t)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors"
                                title="Concluir / Fechar Chamado"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            ) : isResolved ? (
                              <span className="p-1.5 text-emerald-600" title="Chamado já resolvido">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                            ) : null}

                            {/* Botão Alterar Informações do Card */}
                            {canEditCard && (
                              <button
                                onClick={() => handleOpenEditCard(t)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-[#1e3316] hover:bg-slate-100 border border-slate-200 transition-colors"
                                title="Alterar informações deste card (título, prioridade, seção, técnico)"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Botão de Excluir (Lixeira) */}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteTicket(t)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                                title="Excluir Definitivamente este Chamado"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Detalhes */}
                            <button
                              onClick={() => setActiveTicket(t)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                            >
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE REQUISITOS PARA MUDANÇA DE COLUNA (DRAG & DROP) */}
      {dropRequirement && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setDropRequirement(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-[#27431e]/40 animate-in fade-in zoom-in-95 duration-150 cursor-default"
          >
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1e3316] text-[#dfb642] flex items-center justify-center font-bold text-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Requisitos para Mudança de Etapa
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Chamado: <strong>{dropRequirement.ticket.code}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDropRequirement(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRequirement} className="space-y-4">
              
              {/* REQUISITO PARA EM ATENDIMENTO */}
              {dropRequirement.targetStatus === 'em_atendimento' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong>Etapa: Em Atendimento</strong> — É obrigatório indicar qual militar da Seção de TI assumirá a bancada deste chamado.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Selecione o Militar da TI Responsável:
                    </label>
                    <select
                      required
                      value={reqTechnicianId}
                      onChange={(e) => setReqTechnicianId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-[#27431e] text-xs font-bold bg-white text-slate-900"
                    >
                      <option value="">Selecione um militar...</option>
                      {assignableTechnicians.map(tc => (
                        <option key={tc.id} value={tc.id}>
                          {tc.name} ({tc.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Observação de Início (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Equipamento recolhido para a bancada da TI..."
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* REQUISITO PARA AGUARDANDO PEÇA */}
              {dropRequirement.targetStatus === 'aguardando' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                    <strong>Etapa: Aguardando Peça</strong> — Descreva o que está impedindo o avanço imediato do atendimento (peça, aprovação ou material).
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Motivo / Peça Necessária:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Aguardando toner preto, memória RAM ou troca de conector RJ-45..."
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-500 text-xs font-semibold bg-white"
                    />
                  </div>

                  {/* Sugestões rápidas */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Aguardando Toner', 
                      'Aguardando Cabo de Rede', 
                      'Aguardando Memória RAM / SSD',
                      'Aguardando Garantia / Manutenção Externa'
                    ].map(sug => (
                      <button
                        type="button"
                        key={sug}
                        onClick={() => setReqNote(sug)}
                        className="text-[10px] font-bold px-2 py-1 rounded-md bg-purple-100 text-purple-800 hover:bg-purple-200"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* REQUISITO PARA RESOLVIDO */}
              {dropRequirement.targetStatus === 'resolvido' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    <strong>Etapa: Conclusão do Chamado</strong> — Descreva a solução técnica aplicada para registro definitivo no histórico.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Despacho Técnico de Resolução:
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Descreva a solução executada..."
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-emerald-600 text-xs font-medium bg-white"
                    />
                  </div>
                </div>
              )}

              {/* REQUISITO PARA RETORNAR A ABERTO */}
              {dropRequirement.targetStatus === 'aberto' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-800">
                    Deseja retornar este chamado para a <strong>Fila de Triagem</strong>?
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Motivo do retorno à fila (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Redistribuição de tarefas da equipe..."
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDropRequirement(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] shadow-md border border-[#cba135]"
                >
                  Confirmar e Mudar Etapa
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL DETALHADO DO CHAMADO COM SISTEMA DE ATRIBUIÇÃO, EXCLUSÃO E CONCLUSÃO */}
      {activeTicket && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTicket(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#27431e]/30 cursor-default"
          >
            
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="font-mono text-xl font-black text-[#1e3316]">
                    {activeTicket.code}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm font-bold text-slate-700">
                    {departments.find(d => d.id === activeTicket.departmentId)?.name}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase shadow-2xs ${getPriorityStyle(activeTicket.priority).bg}`}>
                    {activeTicket.priority}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {activeTicket.title}
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
                {/* Botão de Comprovante Oficial em PDF */}
                <button
                  type="button"
                  onClick={async () => {
                    const deptName = departments.find(d => d.id === activeTicket.departmentId)?.name;
                    await generateTicketPdf(activeTicket, deptName);
                  }}
                  className="px-3 py-2 rounded-xl text-slate-700 hover:text-[#1e3316] hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Baixar Comprovante Oficial em PDF com assinatura e autenticação"
                >
                  <Download className="w-4 h-4 text-[#1e3316]" />
                  <span>Comprovante PDF</span>
                </button>

                {/* Botão de Alterar Informações do Card */}
                {canEditCard && (
                  <button
                    onClick={() => handleOpenEditCard(activeTicket)}
                    className="px-3 py-2 rounded-xl text-slate-600 hover:text-[#1e3316] hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
                    title="Alterar informações deste chamado"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar Dados</span>
                  </button>
                )}

                {/* Botão de Excluir */}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteTicket(activeTicket)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                    title="Excluir este chamado definitivamente"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={() => setActiveTicket(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Dados do Solicitante e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                {activeTicket.requesterAvatar ? (
                  <img src={activeTicket.requesterAvatar} alt={activeTicket.requesterName} className="w-11 h-11 rounded-2xl object-cover border border-[#27431e]/30 shrink-0 shadow-xs" />
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center justify-center shrink-0 border border-[#cba135]/40 shadow-xs">
                    {activeTicket.requesterName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-bold block">Militar Solicitante:</span>
                  <span className="text-slate-900 font-bold text-sm">{activeTicket.requesterName}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Data de Abertura:</span>
                <span className="text-slate-900 font-medium text-sm">
                  {new Date(activeTicket.createdAt).toLocaleDateString('pt-BR')} às {new Date(activeTicket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Descrição Completa */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Relato da Ocorrência:
              </h3>
              <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {activeTicket.description}
              </p>
            </div>

            {/* ÁREA DE ATRIBUIÇÃO DIRETA DO TÉCNICO E CONTROLE */}
            <div className="p-5 rounded-2xl bg-[#eef3eb] border-2 border-[#27431e]/40 space-y-4">
              
              <div className="flex items-center gap-2 text-[#192b14] font-black text-sm">
                <Wrench className="w-5 h-5 text-[#27431e]" />
                <span>Atribuição de Militar Responsável & Gestão do Chamado:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Selecionar Técnico */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-[#192b14] mb-1">
                    Atribuir a qual Militar da TI:
                  </label>
                  {canAssignTech ? (
                    <select
                      value={activeTicket.technicianId || ''}
                      onChange={(e) => {
                        const techId = e.target.value;
                        onAssignTechnician(activeTicket.id, techId);
                        setActiveTicket(prev => prev ? { ...prev, technicianId: techId || null, status: prev.status === 'aberto' ? 'em_atendimento' : prev.status } : null);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-[#27431e] text-xs font-bold bg-white text-slate-900 shadow-sm"
                    >
                      <option value="">Não Atribuído (Fila)</option>
                      {assignableTechnicians.map((tc) => (
                        <option key={tc.id} value={tc.id}>
                          {tc.name} ({tc.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{technicians.find(tc => tc.id === activeTicket.technicianId)?.name || 'Não Atribuído'}</span>
                    </div>
                  )}
                </div>

                {/* Alterar Prioridade */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-[#192b14] mb-1">
                    Alterar Prioridade:
                  </label>
                  {canChangePriority ? (
                    <select
                      value={activeTicket.priority}
                      onChange={(e) => {
                        const p = e.target.value as Priority;
                        onUpdateTicketPriority(activeTicket.id, p);
                        setActiveTicket(prev => prev ? { ...prev, priority: p } : null);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#385e2b] text-xs font-bold bg-white text-slate-900"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica (Urgência)</option>
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="uppercase font-mono">{activeTicket.priority}</span>
                    </div>
                  )}
                </div>

                {/* Alterar Status */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-black text-[#192b14] mb-1">
                    Mudar Status:
                  </label>
                  {canMoveStatus ? (
                    <select
                      value={activeTicket.status}
                      onChange={(e) => {
                        const st = e.target.value as TicketStatus;
                        onUpdateTicketStatus(activeTicket.id, st);
                        setActiveTicket(prev => prev ? { ...prev, status: st } : null);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#385e2b] text-xs font-bold bg-white text-slate-900"
                    >
                      <option value="aberto">Aberto (Fila)</option>
                      <option value="em_atendimento">Em Atendimento</option>
                      <option value="aguardando">Aguardando Peça</option>
                      <option value="resolvido">Resolvido</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="capitalize">{activeTicket.status.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Status do Técnico Atualmente Atribuído */}
              <div className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-[#27431e]/20 flex items-center justify-between">
                <span>
                  Militar designado no momento: <strong className="text-slate-900 font-bold">
                    {technicians.find(tc => tc.id === activeTicket.technicianId)?.name || 'Nenhum militar atribuído'}
                  </strong>
                </span>
                {activeTicket.technicianId && (
                  <span className="text-[11px] font-mono text-emerald-800 font-bold">
                    ● Atribuição Ativa
                  </span>
                )}
              </div>
            </div>

            {/* CANAL DIRETO COM O MILITAR SOLICITANTE (MINI-CHAT OPERACIONAL) */}
            <div className="p-5 rounded-2xl bg-white border-2 border-[#cba135]/60 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1e3316] text-[#dfb642] flex items-center justify-center font-bold text-xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Canal de Dúvidas & Notificações do Solicitante ({activeTicket.requesterName})
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Responda perguntas de andamento e previsão diretamente na tela do militar
                    </span>
                  </div>
                </div>

                {activeTicket.messages?.some(m => m.sender === 'solicitante' && !m.readByTi) && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                    Nova Mensagem!
                  </span>
                )}
              </div>

              {/* Lista de Mensagens do Chat */}
              <div className="space-y-2 max-h-56 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200">
                {(!activeTicket.messages || activeTicket.messages.length === 0) ? (
                  <div className="text-center py-4 text-xs text-slate-400 font-medium">
                    Nenhuma mensagem registrada neste chamado ainda. Você pode enviar uma previsão ou orientação ao solicitante abaixo.
                  </div>
                ) : (
                  activeTicket.messages.map((msg) => {
                    const isIntervention = msg.content.includes('[INTERVENÇÃO') || msg.content.includes('INTERVENÇÃO GERAL');

                    if (isIntervention) {
                      return (
                        <div 
                          key={msg.id}
                          className="flex flex-col items-center my-1.5 w-full"
                        >
                          <div className="w-full max-w-[96%] p-3.5 rounded-2xl text-xs bg-red-50 border-2 border-red-500 text-red-950 shadow-md">
                            <div className="flex items-center justify-between gap-3 mb-1.5 text-[10px] font-mono">
                              <span className="font-bold flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                                  <span>⚠️</span> INTERVENÇÃO GERAL
                                </span>
                                <span className="text-red-900 font-bold">{msg.senderName || 'Xerife da TI'}</span>
                              </span>
                              <span className="shrink-0 text-red-700 font-bold">
                                {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="leading-relaxed font-semibold whitespace-pre-wrap text-red-900">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'ti' ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[92%] sm:max-w-[85%] p-3 rounded-xl text-xs ${
                          msg.sender === 'ti'
                            ? 'bg-[#1e3316] text-[#dfb642] rounded-br-xs shadow-xs'
                            : 'bg-white border-2 border-amber-300 text-slate-900 rounded-bl-xs shadow-xs'
                        }`}>
                          <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-90 font-mono">
                            <span className="font-bold flex items-center gap-1.5 flex-wrap">
                              {msg.sender === 'ti' ? (
                                <>
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-[#dfb642] text-[#1e3316] font-black text-[9px] uppercase">
                                    TI
                                  </span>
                                  <span className="text-[#dfb642]">{msg.senderName || 'Seção de TI'}</span>
                                </>
                              ) : (
                                <>
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500 text-white font-black text-[9px] uppercase">
                                    SOLICITANTE
                                  </span>
                                  <span className="text-slate-800">{msg.senderName || activeTicket.requesterName}</span>
                                </>
                              )}
                            </span>
                            <span className="shrink-0 text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="leading-relaxed font-medium whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Respostas Rápidas da TI */}
              {canReplyChat && (
                <div>
                  <span className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                    Respostas Rápidas do Técnico (Clique para enviar imediatamente):
                  </span>
                  <div className="flex flex-wrap gap-1.5 w-full">
                    {[
                      'Recebido! Militar da TI em deslocamento até a sua Seção.',
                      'Estamos na bancada efetuando o reparo. Previsão de 30 minutos.',
                      'Equipamento pronto! Pode retirar na Seção de TI ou aguardar entrega.',
                      'Aguardando peça de reposição do almoxarifado para concluir.'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const tech = technicians.find(t => t.id === activeTicket.technicianId);
                          const isUserDev = currentUser?.role === 'System Developer' || currentUser?.role === 'dev' || currentUser?.role === 'DEV' || currentUser?.username === 'dev' || !!(currentUser?.name && currentUser.name.toLowerCase().includes('manfrinato'));
                          const roleTag = isUserDev ? 'DEV' : (currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'CHSECINFO') ? 'CHINFO' : currentUser?.role === 'INF-XERIFE' || currentUser?.role === 'CH-XERIFEINFO' || currentUser?.role === 'XERIFESECINFO' ? 'Xerife TI' : currentUser?.role === 'AUX-SECINFO' || currentUser?.role === 'AUXSECINFO' ? 'Auxiliar TI' : 'TI';
                          const senderName = currentUser ? `${currentUser.name} (${roleTag})` : (tech ? `${tech.name} (TI)` : 'Seção de TI');
                          onSendMessage(activeTicket.id, preset, 'ti', senderName);
                          setActiveTicket(prev => prev ? {
                            ...prev,
                            messages: [
                              ...(prev.messages || []),
                              {
                                id: `msg-${Date.now()}`,
                                sender: 'ti',
                                senderName,
                                content: preset,
                                createdAt: new Date().toISOString(),
                                readByTi: true
                              }
                            ]
                          } : null);
                        }}
                        className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#27431e] hover:text-[#dfb642] text-slate-800 text-[11px] font-semibold transition-colors text-left border border-slate-200"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Campo para Resposta Personalizada da TI */}
              {canReplyChat && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!tiChatInput.trim()) return;
                    const tech = technicians.find(t => t.id === activeTicket.technicianId);
                    const isUserDev = currentUser?.role === 'System Developer' || currentUser?.role === 'dev' || currentUser?.role === 'DEV' || currentUser?.username === 'dev' || !!(currentUser?.name && currentUser.name.toLowerCase().includes('manfrinato'));
                    const roleTag = isUserDev ? 'DEV' : (currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'CHSECINFO') ? 'CHINFO' : currentUser?.role === 'INF-XERIFE' || currentUser?.role === 'CH-XERIFEINFO' || currentUser?.role === 'XERIFESECINFO' ? 'Xerife TI' : currentUser?.role === 'AUX-SECINFO' || currentUser?.role === 'AUXSECINFO' ? 'Auxiliar TI' : 'TI';
                    const senderName = currentUser ? `${currentUser.name} (${roleTag})` : (tech ? `${tech.name} (TI)` : 'Seção de TI');
                    onSendMessage(activeTicket.id, tiChatInput.trim(), 'ti', senderName);
                    setActiveTicket(prev => prev ? {
                      ...prev,
                      messages: [
                        ...(prev.messages || []),
                        {
                          id: `msg-${Date.now()}`,
                          sender: 'ti',
                          senderName,
                          content: tiChatInput.trim(),
                          createdAt: new Date().toISOString(),
                          readByTi: true
                        }
                      ]
                    } : null);
                    setTiChatInput('');
                  }}
                  className="flex flex-col sm:flex-row gap-2 pt-1 w-full"
                >
                  <input
                    type="text"
                    placeholder="Escreva uma resposta para o militar solicitante..."
                    value={tiChatInput}
                    onChange={(e) => setTiChatInput(e.target.value)}
                    className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white text-slate-900"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center justify-center gap-1.5 hover:bg-[#27431e] transition-colors border border-[#cba135] shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Responder</span>
                  </button>
                </form>
              )}
            </div>

            {/* Fechamento / Resolução */}
            {canMoveStatus && activeTicket.status !== 'resolvido' ? (
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 space-y-3">
                <span className="font-bold text-sm text-emerald-950 block">
                  Encerrar Chamado / Despacho de Resolução:
                </span>
                <input
                  type="text"
                  placeholder="Descreva a solução executada..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 text-sm bg-white"
                />
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleResolveFromModal}
                    className="px-5 py-2.5 rounded-xl bg-[#27431e] text-[#dfb642] font-black text-xs hover:bg-[#1e3316] transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Concluir Chamado</span>
                  </button>
                </div>
              </div>
            ) : (activeTicket.status === 'resolvido') ? (
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 text-xs text-emerald-900 space-y-2">
                <span className="font-black text-sm block flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Chamado Concluído</span>
                </span>
                {activeTicket.resolvedAt && (
                  <p>
                    Data de resolução: {new Date(activeTicket.resolvedAt).toLocaleDateString('pt-BR')} às {new Date(activeTicket.resolvedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {activeTicket.resolutionNotes && (
                  <p className="mt-1 font-medium bg-white p-2 rounded-lg border border-emerald-200">
                    <strong>Solução:</strong> {activeTicket.resolutionNotes}
                  </p>
                )}

                {/* Avaliação do Atendimento pelo Solicitante */}
                <div className="mt-2 pt-2 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Avaliação do Solicitante:</span>
                    {activeTicket.rating ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= activeTicket.rating!
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                        <span className="font-mono font-black text-amber-900 ml-1">
                          ({activeTicket.rating}/5)
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Ainda não avaliado</span>
                    )}
                  </div>
                  {activeTicket.userFeedback && (
                    <div className="text-[11px] text-slate-700 italic bg-white px-2.5 py-1 rounded-md border border-emerald-200">
                      "{activeTicket.userFeedback}"
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Histórico */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Histórico & Despachos da Ordem de Serviço ({activeTicket.history.length})
              </h3>
              
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                {activeTicket.history.map((h) => (
                  <div key={h.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>{h.author} · {h.action}</span>
                      <span className="text-slate-400 font-mono font-normal">
                        {new Date(h.date).toLocaleDateString('pt-BR')} {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {h.comment && (
                      <p className="mt-1 text-slate-600">{h.comment}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Inserir novo despacho */}
              {canAddNotes && (
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input
                    type="text"
                    placeholder="Adicionar nota técnica ou andamento militar..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNote();
                    }}
                    className="w-full sm:flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#27431e] text-[#dfb642] font-black text-xs flex items-center justify-center gap-1 hover:bg-[#1e3316] shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Despachar</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR NOME DO CHAMADO (XERIFE E CHEFE) */}
      {editingTicketTitle && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditingTicketTitle(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-300 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#1e3316] text-[#dfb642]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Editar Nome do Chamado</h3>
                  <span className="text-xs text-slate-500 font-mono">{editingTicketTitle.code} · Gestão do Xerife / Chefe</span>
                </div>
              </div>
              <button 
                onClick={() => setEditingTicketTitle(null)} 
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEditTitle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Novo Título / Nome da Ocorrência:
                </label>
                <input
                  type="text"
                  required
                  value={newTitleInput}
                  onChange={(e) => setNewTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-[#27431e] bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTicketTitle(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1e3316] hover:bg-[#27431e] text-[#dfb642] font-black shadow-md border border-[#cba135]/50"
                >
                  Salvar Nome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA INTERVENÇÃO GERAL DO XERIFE EM TODOS OS CHAMADOS */}
      {showMassInterventionModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowMassInterventionModal(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl border-2 border-amber-500/60 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Intervenção do Xerife da TI</h3>
                  <span className="text-xs text-slate-500 font-mono">Despacho Simultâneo em Todos os Chamados Ativos</span>
                </div>
              </div>
              <button 
                onClick={() => setShowMassInterventionModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMassIntervention} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Mensagem de Intervenção Oficial:
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Digite o comunicado ou diretriz do Xerife para ser despachado em todos os chamados ativos..."
                  value={massInterventionText}
                  onChange={(e) => setMassInterventionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#27431e] bg-white text-slate-900"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1.5">Modelos Rápidos do Xerife:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Xerife determina prioridade máxima de atendimento às seções operacionais nesta manhã.',
                    'Corpo técnico em manutenção preventiva programada na rede do quartel.',
                    'Aguardar chegada de insumos do almoxarifado central para finalização dos chamados de impressão.'
                  ].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMassInterventionText(m)}
                      className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] text-left border border-amber-200"
                    >
                      + {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMassInterventionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md border border-amber-700 flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Disparar Intervenção em Todos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DEFINITIVA DO CHAMADO */}
      {ticketToDelete && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setTicketToDelete(null); }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-red-500/50 animate-in fade-in zoom-in-95 duration-150 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-100 text-red-700">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    Excluir Chamado?
                  </h3>
                  <span className="text-xs text-red-600 font-mono font-bold">
                    Ação Irreversível no Banco
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setTicketToDelete(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-2 text-xs">
              <p className="text-slate-800 font-medium">
                Você está prestes a excluir definitivamente o chamado da Seção de TI:
              </p>
              <div className="p-3 rounded-xl bg-white border border-red-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-[#1e3316]">{ticketToDelete.code}</span>
                  <span className="font-mono uppercase font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                    {ticketToDelete.priority}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">{ticketToDelete.title}</h4>
                <p className="text-[11px] text-slate-500">
                  Solicitante: <strong>{ticketToDelete.requesterName}</strong> · Seção: <strong>{departments.find(d => d.id === ticketToDelete.departmentId)?.name}</strong>
                </p>
              </div>
              <p className="text-[11px] text-red-700 font-semibold">
                ⚠️ O registro será apagado do sistema e do banco de dados MySQL/Sequelize.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md border border-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Sim, Excluir Chamado</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL DE CONCLUSÃO RÁPIDA (DESPACHO TÉCNICO) */}
      {ticketToResolve && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setTicketToResolve(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border-2 border-emerald-500/50 animate-in fade-in zoom-in-95 duration-150 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    Concluir Chamado
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {ticketToResolve.code} · Despacho de Finalização
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setTicketToResolve(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Despacho Técnico de Encerramento:
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolveNoteInput}
                  onChange={(e) => setResolveNoteInput(e.target.value)}
                  placeholder="Informe a solução técnica executada..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#27431e] bg-white text-slate-900"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Opções Rápidas de Despacho:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Atendimento técnico concluído com sucesso pela Seção de TI.',
                    'Equipamento reparado, testado e pronto para uso.',
                    'Configuração de rede e credenciais restabelecidas.',
                    'Impressora desobstruída e suprimento reposto.'
                  ].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setResolveNoteInput(opt)}
                      className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[10px] text-left border border-emerald-200 transition-colors"
                    >
                      + {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTicketToResolve(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md border border-emerald-700 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Concluir Chamado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL DE ALTERAÇÃO COMPLETA DAS INFORMAÇÕES DO CARD */}
      {ticketToEdit && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setTicketToEdit(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-4 shadow-2xl border-2 border-[#27431e]/40 my-6 animate-in fade-in zoom-in-95 duration-150 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#1e3316] text-[#dfb642]">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    Alterar Informações do Card
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {ticketToEdit.code} · Gestão da Informação
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setTicketToEdit(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEditCard} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Título / Nome da Ocorrência:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-[#27431e] bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Descrição Detalhada do Problema:
                </label>
                <textarea
                  required
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#27431e] bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Militar Solicitante:
                  </label>
                  <input
                    type="text"
                    required
                    value={editRequesterName}
                    onChange={(e) => setEditRequesterName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Seção / Bateria do 2º GAC:
                  </label>
                  <select
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Prioridade Operacional:
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900"
                  >
                    <option value="baixa">BAIXA (SLA 24h)</option>
                    <option value="media">MÉDIA (SLA 4h)</option>
                    <option value="alta">ALTA (SLA 2h)</option>
                    <option value="critica">CRÍTICA (SLA 1h - Urgente)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Militar Técnico Atribuído:
                  </label>
                  <select
                    value={editTechId}
                    onChange={(e) => setEditTechId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900"
                  >
                    <option value="">-- Não Atribuído --</option>
                    {assignableTechnicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    const t = ticketToEdit;
                    setTicketToEdit(null);
                    handleDeleteTicket(t);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Excluir este chamado"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTicketToEdit(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1e3316] hover:bg-[#27431e] text-[#dfb642] font-black text-xs shadow-md border border-[#cba135]/50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-[#dfb642]" />
                    <span>Salvar Informações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Componente do Cartão Kanban com Suporte a Drag & Drop e Ações Rápidas (Check & Lixeira)
interface KanbanTicketCardProps {
  ticket: Ticket;
  departments: Department[];
  technicians: Technician[];
  canAssign: boolean;
  canDelete: boolean;
  canEditTitle: boolean;
  canEditCard: boolean;
  canMoveStatus: boolean;
  onClick: () => void;
  onQuickAssign: (techId: string) => void;
  onQuickAdvance?: () => void;
  onQuickResolve: () => void;
  onDelete: () => void;
  onEditTitle: () => void;
  onEditCard: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

const KanbanTicketCard: React.FC<KanbanTicketCardProps> = ({
  ticket,
  departments,
  technicians,
  canAssign,
  canDelete,
  canEditTitle,
  canEditCard,
  canMoveStatus,
  onClick,
  onQuickAssign,
  onQuickAdvance,
  onQuickResolve,
  onDelete,
  onEditTitle,
  onEditCard,
  onDragStart,
}) => {
  const dept = departments.find(d => d.id === ticket.departmentId);
  const tech = technicians.find(t => t.id === ticket.technicianId);
  const isCritical = ticket.priority === 'critica';
  const isResolved = ticket.status === 'resolvido';

  return (
    <div
      draggable={canMoveStatus}
      onDragStart={canMoveStatus ? onDragStart : undefined}
      onClick={onClick}
      className={`group p-3.5 rounded-xl border bg-white shadow-xs hover:shadow-md transition-all relative select-none ${
        canMoveStatus ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        isResolved 
          ? 'border-slate-200/80 bg-slate-50/80 opacity-65' 
          : isCritical 
            ? 'border-red-500 ring-1 ring-red-500' 
            : 'border-slate-200'
      }`}
    >
      {/* Topo do Card com Grip de Arrasto e Ações Rápidas */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
        <div className="flex items-center gap-1 min-w-0 shrink-0">
          {canMoveStatus && (
            <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
          )}
          <span className="font-mono text-xs font-black text-[#1e3316] whitespace-nowrap tracking-tight">
            {ticket.code}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono whitespace-nowrap shrink-0 ${
            isResolved 
              ? 'bg-slate-200 text-slate-600'
              : ticket.priority === 'critica' ? 'bg-red-600 text-white' :
              ticket.priority === 'alta' ? 'bg-orange-500 text-white' :
              ticket.priority === 'media' ? 'bg-[#27431e] text-[#dfb642]' :
              'bg-slate-500 text-white'
          }`}>
            {ticket.priority}
          </span>

          {/* Botão Concluir Rápido (Check) */}
          {!isResolved && canMoveStatus ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickResolve();
              }}
              className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 border border-emerald-300/80 transition-colors shrink-0"
              title="Concluir / Fechar Chamado"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          ) : isResolved ? (
            <span className="text-emerald-600 shrink-0" title="Chamado Concluído">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          ) : null}

          {/* Botão Alterar Informações do Card */}
          {canEditCard && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditCard();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-[#1e3316] hover:bg-slate-100 border border-transparent hover:border-slate-300 transition-colors shrink-0"
              title="Alterar informações deste card (título, descrição, prioridade, seção)"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Botão Deletar Rápido (Lixeira) */}
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors shrink-0"
              title="Excluir Definitivamente este Chamado"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Seção */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
        <span 
          className="w-2 h-2 rounded-full shrink-0" 
          style={{ backgroundColor: dept?.color || '#27431e' }}
        />
        <span className="truncate">{dept?.name}</span>
      </div>

      {/* Título com botão de Edição para Xerife/Chefe */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
          {ticket.title}
        </h4>
        {canEditTitle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditTitle();
            }}
            className="p-1 rounded text-slate-400 hover:text-[#192b14] hover:bg-slate-100 shrink-0"
            title="Editar Nome do Chamado (Xerife / Chefe)"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Solicitante */}
      <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {ticket.requesterAvatar ? (
            <img src={ticket.requesterAvatar} alt={ticket.requesterName} className="w-4 h-4 rounded-full object-cover shrink-0" />
          ) : (
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="truncate font-semibold text-slate-700">{ticket.requesterName}</span>
        </div>
      </div>

      {/* Alerta de Mensagens / Chat com o Solicitante */}
      {ticket.messages && ticket.messages.length > 0 && (
        <div className={`mb-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-between border ${
          ticket.messages.some(m => m.sender === 'solicitante' && !m.readByTi)
            ? 'bg-amber-100 text-amber-900 border-amber-300 font-mono animate-pulse'
            : 'bg-slate-50 text-slate-700 border-slate-200'
        }`}>
          <span className="flex items-center gap-1.5 truncate min-w-0">
            <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{ticket.messages.some(m => m.sender === 'solicitante' && !m.readByTi) ? 'Dúvida do Solicitante!' : 'Canal com Solicitante'}</span>
          </span>
          <span className="font-mono font-bold shrink-0 ml-1">💬 {ticket.messages.length}</span>
        </div>
      )}

      {/* Avaliação do Solicitante no Card */}
      {ticket.rating && (
        <div className="mb-2 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>Avaliação:</span>
          </span>
          <span className="font-mono font-black text-amber-800">
            {ticket.rating}/5 ★
          </span>
        </div>
      )}

      {/* Atribuição direta de militar e avanço */}
      <div className="flex items-center justify-between gap-2 text-[11px] pt-1" onClick={(e) => e.stopPropagation()}>
        {canAssign ? (
          <select
            value={ticket.technicianId || ''}
            onChange={(e) => onQuickAssign(e.target.value)}
            className="text-[11px] font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 flex-1 min-w-0 truncate focus:bg-white"
          >
            <option value="">+ Atribuir Militar</option>
            {technicians
              .filter(tc => {
                const name = tc.name.toLowerCase();
                const role = (tc.role || '').toLowerCase();
                const id = tc.id.toLowerCase();
                if (id === 'tech-dev' || name.includes('manfrinato') || role.includes('desenvolvedor')) return false;
                if (name.includes('sgt') || name.includes('sargento') || name.includes('das neves') || name.includes('das deves') || name.includes('cavalcanti')) return false;
                if (name.includes('castro') || role.includes('auxiliar') || id === 'tech-castro') return false;
                return true;
              })
              .map(tc => (
                <option key={tc.id} value={tc.id}>{tc.name}</option>
              ))
            }
          </select>
        ) : (
          <div className="text-[11px] font-bold text-slate-600 bg-slate-100 rounded-lg px-2 py-1.5 flex items-center gap-1 flex-1 min-w-0 truncate">
            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{tech ? tech.name : 'Não Atribuído'}</span>
          </div>
        )}

        {onQuickAdvance && ticket.status !== 'resolvido' && canMoveStatus && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdvance();
            }}
            className="text-[10px] font-bold text-[#27431e] hover:text-[#192b14] bg-[#27431e]/10 hover:bg-[#27431e]/20 px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors"
          >
            Avançar →
          </button>
        )}
      </div>
    </div>
  );
};

