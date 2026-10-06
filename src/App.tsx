import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Header } from './components/Header';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminTopBar } from './components/AdminTopBar';
import { EmployeePortal } from './components/EmployeePortal';
import { ITDashboard } from './components/ITDashboard';
import { NotebookLoans } from './components/NotebookLoans';
import { TechniciansManager } from './components/TechniciansManager';
import { MissionsManager } from './components/MissionsManager';
import { TVDashboard } from './components/TVDashboard';
import { AdminLogin } from './components/AdminLogin';
import { DutyRoster } from './components/DutyRoster';
import { 
  Ticket, 
  Department, 
  Technician, 
  Category, 
  AccessibilitySettings, 
  Priority, 
  TicketStatus,
  NotebookLoan,
  TicketMessage,
  MilitaryUser,
  SystemAuditLog,
  LoanHistoryItem,
  LoanMessage,
  Mission,
  MissionPriority,
  MissionArea,
  AdminTab
} from './types';
import { 
  loadTickets, 
  saveTickets, 
  loadDepartments, 
  saveDepartments, 
  loadTechnicians, 
  saveTechnicians, 
  loadCategories, 
  saveCategories, 
  loadNotebookLoans,
  saveNotebookLoans,
  loadMilitaryUsers,
  saveMilitaryUsers,
  loadAuditLogs,
  saveAuditLogs,
  addAuditLog,
  loadCurrentUser,
  saveCurrentUser,
  loadAccessibilitySettings, 
  saveAccessibilitySettings,
  loadMissions,
  saveMissions,
  syncAllFromBackend,
  loadUserAccessibilitySettings,
  saveUserAccessibilitySettings,
  onRealtimeSync,
  broadcastSyncEvent,
  STORAGE_KEYS
} from './utils/storage';
import { api } from './utils/api';
import { Lock, Globe, ShieldAlert } from 'lucide-react';
import { IntranetModal } from './components/IntranetModal';
import malletBg from './assets/mallet_bg.jpg';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RedeHelp ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-900/60 text-red-400 flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-white">Recuperação de Interface</h2>
            <p className="text-xs text-slate-300">
              Ocorreu uma inconsistência transitória na tela. Os dados do quartel foram preservados com integridade.
            </p>
            {this.state.error && (
              <div className="text-left bg-black/40 border border-red-900/50 p-2.5 rounded-xl text-red-300 font-mono text-[10px] overflow-auto max-h-24">
                <strong>Diagnóstico:</strong> {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="flex-1 py-3 rounded-xl bg-[#27431e] hover:bg-[#1e3316] text-[#dfb642] font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Recarregar Aplicação
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('eb_duty_roster_shifts_v1');
                    localStorage.removeItem('eb_roster_military_v2');
                  } catch {}
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="px-4 py-3 rounded-xl bg-red-800/80 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-red-700"
                title="Limpar caches transitórios e reiniciar"
              >
                Limpar Cache
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  // Controle de Rota por URL (/admin vs /)
  const getIsAdminPath = () => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('/admin') || 
      window.location.hash.includes('admin') ||
      window.location.search.includes('view=admin')
    );
  };

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(getIsAdminPath);
  const [adminTab, setAdminTab] = useState<AdminTab>('it');
  const [isTvModeOpen, setIsTvModeOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isIntranetModalOpen, setIsIntranetModalOpen] = useState<boolean>(false);
  const [focusedTicket, setFocusedTicket] = useState<Ticket | null>(null);
  
  // Usuário militar conectado e autenticação
  const [currentUser, setCurrentUser] = useState<MilitaryUser | null>(() => loadCurrentUser());
  const [originalUser, setOriginalUser] = useState<MilitaryUser | null>(() => {
    try {
      const raw = sessionStorage.getItem('eb_original_authenticated_user');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('eb_ti_admin_authenticated') === 'true' || !!loadCurrentUser();
    } catch {
      return false;
    }
  });

  // Listener para sincronizar navegação por URL
  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminRoute(getIsAdminPath());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateToAdmin = () => {
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', '/admin');
    } else {
      window.location.hash = 'admin';
    }
    setIsAdminRoute(true);
  };

  const navigateToClient = () => {
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', '/');
    } else {
      window.location.hash = '';
    }
    setIsAdminRoute(false);
  };

  // Estados de dados
  const [tickets, setTickets] = useState<Ticket[]>(() => loadTickets());
  const [departments, setDepartments] = useState<Department[]>(() => loadDepartments());
  const [technicians, setTechnicians] = useState<Technician[]>(() => loadTechnicians());
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [notebookLoans, setNotebookLoans] = useState<NotebookLoan[]>(() => loadNotebookLoans());
  const [militaryUsers, setMilitaryUsers] = useState<MilitaryUser[]>(() => loadMilitaryUsers());
  const [missions, setMissions] = useState<Mission[]>(() => loadMissions());
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(() => loadAuditLogs());
  const [a11y, setA11y] = useState<AccessibilitySettings>(() => loadAccessibilitySettings());

  // Sincronização inicial com o Banco Sequelize (MySQL / SQLite)
  useEffect(() => {
    syncAllFromBackend({
      setTickets,
      setDepartments,
      setTechnicians,
      setMilitaryUsers,
      setNotebookLoans,
      setMissions,
      setAuditLogs,
    });
  }, []);

  // Escuta instantânea de sincronização via BroadcastChannel e Storage Events (multi-abas e multi-janelas em tempo real)
  useEffect(() => {
    const unsubscribe = onRealtimeSync((data) => {
      if (data.type === 'TICKETS_CHANGED') {
        if (Array.isArray(data.payload)) {
          setTickets(data.payload);
        } else {
          setTickets(loadTickets());
        }
      } else if (data.type === 'NOTEBOOK_LOANS_CHANGED') {
        if (Array.isArray(data.payload)) {
          setNotebookLoans(data.payload);
        } else {
          setNotebookLoans(loadNotebookLoans());
        }
      } else if (data.type === 'MISSIONS_CHANGED' || data.type === 'MISSIONS_UPDATED') {
        if (Array.isArray(data.payload)) {
          setMissions(data.payload);
        } else {
          setMissions(loadMissions());
        }
      } else if (data.type === 'STORAGE_CHANGED') {
        if (data.payload === STORAGE_KEYS.TICKETS) setTickets(loadTickets());
        if (data.payload === STORAGE_KEYS.NOTEBOOK_LOANS) setNotebookLoans(loadNotebookLoans());
        if (data.payload === STORAGE_KEYS.MISSIONS) setMissions(loadMissions());
      }
    });
    return unsubscribe;
  }, []);

  // Polling contínuo em background para sincronização em tempo real entre múltiplos dispositivos (PC e Celular)
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const [freshTickets, freshLoans, freshMissions] = await Promise.all([
          api.getTickets().catch(() => null),
          api.getNotebookLoans().catch(() => null),
          api.getMissions().catch(() => null),
        ]);
        if (!isMounted) return;

        if (freshTickets) {
          setTickets(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(freshTickets)) {
              return freshTickets;
            }
            return prev;
          });
        }
        if (freshLoans) {
          setNotebookLoans(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(freshLoans)) {
              return freshLoans;
            }
            return prev;
          });
        }
        if (freshMissions) {
          setMissions(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(freshMissions)) {
              return freshMissions;
            }
            return prev;
          });
        }
      } catch (err) {
        // Silêncio em falha transitória de polling
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Salvar no localStorage quando o estado mudar
  useEffect(() => {
    saveTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    saveDepartments(departments);
  }, [departments]);

  useEffect(() => {
    saveTechnicians(technicians);
  }, [technicians]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveNotebookLoans(notebookLoans);
  }, [notebookLoans]);

  useEffect(() => {
    saveMilitaryUsers(militaryUsers);
  }, [militaryUsers]);

  useEffect(() => {
    saveMissions(missions);
  }, [missions]);

  useEffect(() => {
    saveAuditLogs(auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveAccessibilitySettings(a11y);
    if (currentUser?.username) {
      saveUserAccessibilitySettings(currentUser.username, a11y);
    }
  }, [a11y, currentUser]);

  // Função utilitária para registrar logs de auditoria
  const handleAddAuditLog = (logItem: Omit<SystemAuditLog, 'id' | 'timestamp'>) => {
    const newLog = addAuditLog(logItem);
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAdminLoginSuccess = (user: MilitaryUser) => {
    setCurrentUser(user);
    setOriginalUser(user);
    sessionStorage.setItem('eb_original_authenticated_user', JSON.stringify(user));
    setIsAdminAuthenticated(true);
    saveCurrentUser(user);

    // Carregar configurações de acessibilidade do usuário se existirem
    const userA11y = loadUserAccessibilitySettings(user.username);
    if (userA11y) {
      setA11y(userA11y);
    }

    handleAddAuditLog({
      militaryName: user.name,
      militaryLogin: user.username,
      role: user.role,
      actionType: 'LOGIN_SUCESSO',
      summary: `Militar autenticou-se no painel da TI com perfil ${user.role}.`,
    });

    if (user.role === 'CH-TVINFO') {
      setAdminTab('it');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('eb_original_authenticated_user');
    setOriginalUser(null);
    if (currentUser) {
      handleAddAuditLog({
        militaryName: currentUser.name,
        militaryLogin: currentUser.username,
        role: currentUser.role,
        actionType: 'LOGIN_SUCESSO',
        summary: `Sessão encerrada (logoff) no painel da TI.`,
      });
    }
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
    saveCurrentUser(null);
  };

  // Handler: Criação de novo chamado (Solicitante)
  const handleCreateTicket = (ticketData: {
    title: string;
    description: string;
    category: string;
    departmentId: string;
    requesterName: string;
    priority: Priority;
  }): Ticket => {
    const nextCodeNumber = 1000 + tickets.length + 1;
    const newTicket: Ticket = {
      id: `t-${Date.now()}`,
      code: `TICKET-${nextCodeNumber}`,
      title: ticketData.title,
      description: ticketData.description,
      category: ticketData.category,
      departmentId: ticketData.departmentId,
      requesterName: ticketData.requesterName,
      priority: ticketData.priority,
      status: 'aberto',
      technicianId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      slaLimitHours: ticketData.priority === 'critica' ? 1 : ticketData.priority === 'alta' ? 2 : ticketData.priority === 'media' ? 4 : 24,
      history: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          author: ticketData.requesterName,
          action: 'Chamado Aberto pelo Militar',
          comment: `Prioridade indicada: ${ticketData.priority.toUpperCase()}.`,
        }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);

    // Persistir no banco Sequelize
    api.createTicket(newTicket).catch(err => {
      console.warn('[API] Falha temporária ao salvar novo chamado no banco:', err);
    });

    return newTicket;
  };

  // Handler: Mudar status do chamado (Movimentar de bloco)
  const handleUpdateTicketStatus = (ticketId: string, newStatus: TicketStatus, notes?: string) => {
    const ticketTarget = tickets.find(t => t.id === ticketId);
    const author = currentUser?.name || 'Seção de TI';

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const isResolving = newStatus === 'resolvido' && t.status !== 'resolvido';
      return {
        ...t,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        resolvedAt: isResolving ? new Date().toISOString() : t.resolvedAt,
        resolutionNotes: notes || t.resolutionNotes,
        history: [
          ...t.history,
          {
            id: `h-${Date.now()}`,
            date: new Date().toISOString(),
            author,
            action: `Bloco alterado para: ${newStatus.replace('_', ' ').toUpperCase()}`,
            comment: notes,
          }
        ]
      };
    }));

    api.updateTicketStatus(ticketId, newStatus, notes).catch(err => {
      console.warn('[API] Erro ao atualizar status no banco:', err);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Militar da TI',
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-TECNICOINFO',
      actionType: 'STATUS_CHAMADO',
      summary: `Moveu o chamado ${ticketTarget?.code || ticketId} para "${newStatus.replace('_', ' ').toUpperCase()}"`,
      details: notes ? `Despacho: ${notes}` : undefined,
      targetRef: ticketTarget?.code || ticketId,
    });
  };

  // Handler: Mudar prioridade do chamado (Preservando histórico e persistindo no banco)
  const handleUpdateTicketPriority = (ticketId: string, newPriority: Priority) => {
    const ticketTarget = tickets.find(t => t.id === ticketId);
    const newSla = newPriority === 'critica' ? 1 : newPriority === 'alta' ? 2 : newPriority === 'media' ? 4 : 24;
    const author = currentUser?.name || 'Militar da TI';

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author,
      action: `Prioridade ajustada para: ${newPriority.toUpperCase()} (SLA: ${newSla}h)`,
    };

    const updatedHistory = [...(ticketTarget?.history || []), newHistoryItem];

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        priority: newPriority,
        slaLimitHours: newSla,
        updatedAt: new Date().toISOString(),
        history: updatedHistory
      };
    }));

    api.updateTicketPriority(ticketId, newPriority, author).catch(err => {
      console.warn('[API] Falha em updateTicketPriority, tentando updateTicket fallback:', err);
      api.updateTicket(ticketId, { priority: newPriority, slaLimitHours: newSla, history: updatedHistory }).catch(console.error);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Militar da TI',
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'PRIORIDADE_CHAMADO',
      summary: `Alterou a prioridade do chamado ${ticketTarget?.code || ticketId} para "${newPriority.toUpperCase()}"`,
      targetRef: ticketTarget?.code || ticketId,
    });
  };

  // Handler: Editar Nome/Título do Chamado
  const handleUpdateTicketTitle = (ticketId: string, newTitle: string) => {
    const ticketTarget = tickets.find(t => t.id === ticketId);
    const oldTitle = ticketTarget?.title || '';
    const author = currentUser?.name || 'Militar da TI';

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author,
      action: `Título do chamado renomeado`,
      comment: `Anterior: "${oldTitle}" → Novo: "${newTitle.trim()}"`,
    };

    const updatedHistory = [...(ticketTarget?.history || []), newHistoryItem];

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        title: newTitle.trim(),
        updatedAt: new Date().toISOString(),
        history: updatedHistory
      };
    }));

    api.updateTicketTitle(ticketId, newTitle.trim(), author).catch(err => {
      console.warn('[API] Erro ao atualizar título no banco, tentando fallback:', err);
      api.updateTicket(ticketId, { title: newTitle.trim(), history: updatedHistory }).catch(console.error);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Militar da TI',
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'EDITAR_TITULO_CHAMADO',
      summary: `Editou o nome/título do chamado ${ticketTarget?.code || ticketId} para "${newTitle.trim()}"`,
      details: `Título anterior: "${oldTitle}"`,
      targetRef: ticketTarget?.code || ticketId,
    });
  };

  // Handler: Alterar informações completas do card (título, descrição, prioridade, seção, técnico)
  const handleUpdateTicketCard = (ticketId: string, updates: Partial<Ticket>) => {
    const author = currentUser?.name || 'Militar da TI';
    const ticketTarget = tickets.find(t => t.id === ticketId);
    if (!ticketTarget) return;

    let effectiveUpdates = { ...updates };
    // Regra estrita: se tiver alguém designado, obrigatoriamente status deve ser "em_atendimento"
    if (effectiveUpdates.technicianId && ticketTarget.status !== 'resolvido' && ticketTarget.status !== 'cancelado') {
      effectiveUpdates.status = 'em_atendimento';
    }

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author,
      action: 'Informações do card alteradas na TI',
      comment: effectiveUpdates.title ? `Título: "${effectiveUpdates.title}"` : undefined,
    };

    const updatedHistory = [...ticketTarget.history, newHistoryItem];

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        ...effectiveUpdates,
        updatedAt: new Date().toISOString(),
        history: updatedHistory
      };
    }));

    api.updateTicket(ticketId, { ...effectiveUpdates, history: updatedHistory }).catch(err => {
      console.warn('[API] Erro ao atualizar dados do card no banco:', err);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Militar da TI',
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'EDITAR_TITULO_CHAMADO',
      summary: `Alterou informações do card do chamado ${ticketTarget.code || ticketId}`,
      targetRef: ticketTarget.code || ticketId,
    });
  };

  // Handler: Excluir chamado definitivamente (Lixeira)
  const handleDeleteTicket = (ticketId: string) => {
    const ticketTarget = tickets.find(t => t.id === ticketId);
    setTickets(prev => prev.filter(t => t.id !== ticketId));

    // Excluir definitivamente no banco Sequelize (MySQL / SQLite)
    api.deleteTicket(ticketId).catch(err => {
      console.warn('[API] Erro ao deletar chamado do banco:', err);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Militar da TI',
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'EXCLUSAO_CHAMADO',
      summary: `Excluiu definitivamente o chamado ${ticketTarget?.code || ticketId} (${ticketTarget?.title || ''})`,
      targetRef: ticketTarget?.code || ticketId,
    });
  };

  // HANDLERS PARA MISSÕES DA TI (ORDENS DE OPERAÇÕES)
  const handleAddMission = (missionData: {
    title: string;
    description: string;
    priority: MissionPriority;
    area?: MissionArea;
    assignedTechnicianIds: string[];
    deadline?: string;
    checklistItems: string[];
  }) => {
    const nextNum = 100 + missions.length + 1;
    const nowIso = new Date().toISOString();
    const createdBy = currentUser?.name || 'Chefe da TI';
    const createdByRole = currentUser?.role || 'CH-SECINFO';

    const newMission: Mission = {
      id: `m-${Date.now()}`,
      code: `OP-${nextNum}`,
      title: missionData.title,
      description: missionData.description,
      priority: missionData.priority,
      area: missionData.area || 'geral',
      status: 'pendente',
      assignedTechnicianIds: missionData.assignedTechnicianIds,
      createdBy,
      createdByRole,
      createdAt: nowIso,
      updatedAt: nowIso,
      deadline: missionData.deadline,
      checklist: (missionData.checklistItems || []).map((text, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        text,
        done: false,
      })),
      notes: [],
    };

    setMissions(prev => [newMission, ...prev]);

    api.createMission(newMission).catch(err => {
      console.warn('[API] Erro ao salvar missão no banco:', err);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'secinfo',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'CRIACAO_MISSAO',
      summary: `Criou a missão ${newMission.code}: "${newMission.title}"`,
      targetRef: newMission.code,
    });
  };

  const handleUpdateMission = (missionId: string, updates: Partial<Mission>) => {
    setMissions(prev => prev.map(m => {
      if (m.id !== missionId) return m;
      return { ...m, ...updates };
    }));

    api.updateMission(missionId, updates).catch(err => {
      console.warn('[API] Erro ao atualizar missão no banco:', err);
    });
  };

  const handleDeleteMission = (missionId: string) => {
    const target = missions.find(m => m.id === missionId);
    setMissions(prev => prev.filter(m => m.id !== missionId));

    api.deleteMission(missionId).catch(err => {
      console.warn('[API] Erro ao excluir missão do banco:', err);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'secinfo',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'EXCLUSAO_MISSAO',
      summary: `Excluiu a ordem de missão ${target?.code || missionId}`,
      targetRef: target?.code || missionId,
    });
  };

  const handleAddMissionNote = (missionId: string, noteText: string) => {
    const author = currentUser?.name || 'Militar da TI';
    const authorRole = currentUser?.role || 'CH-TECNICOINFO';
    const target = missions.find(m => m.id === missionId);
    const newNote = {
      id: `mn-${Date.now()}`,
      author,
      authorRole,
      text: noteText,
      createdAt: new Date().toISOString(),
    };

    const updatedMissions = missions.map(m => {
      if (m.id !== missionId) return m;
      const updatedNotes = [...(m.notes || []), newNote];
      api.updateMission(missionId, { notes: updatedNotes }).catch(() => {});
      return {
        ...m,
        notes: updatedNotes,
      };
    });

    setMissions(updatedMissions);
    saveMissions(updatedMissions);

    handleAddAuditLog({
      militaryName: author,
      militaryLogin: currentUser?.username || 'ti',
      role: authorRole,
      actionType: 'DESPACHO_MISSAO',
      summary: `Despacho na missão ${target?.code || missionId}: "${noteText.slice(0, 50)}${noteText.length > 50 ? '...' : ''}"`,
      targetRef: target?.code || missionId,
    });
  };

  const handleToggleChecklistItem = (missionId: string, itemId: string) => {
    setMissions(prev => prev.map(m => {
      if (m.id !== missionId) return m;
      const updatedChecklist = (m.checklist || []).map(c => 
        c.id === itemId ? { ...c, done: !c.done } : c
      );
      api.updateMission(missionId, { checklist: updatedChecklist }).catch(() => {});
      return { ...m, checklist: updatedChecklist };
    }));
  };

  // Handler: Intervenção Geral / em Massa (Xerife envia mensagem em todos os chamados abertos)
  const handleMassIntervention = (message: string) => {
    const author = currentUser?.name ? `${currentUser.name} (Xerife)` : 'Xerife da TI';
    const activeTicketsCount = tickets.filter(t => t.status !== 'resolvido' && t.status !== 'cancelado').length;

    const updatedTickets = tickets.map(t => {
      if (t.status === 'resolvido' || t.status === 'cancelado') return t;
      const interventionMsg: TicketMessage = {
        id: `msg-interv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'ti',
        senderName: author,
        content: `[INTERVENÇÃO GERAL / XERIFE DA TI]: ${message}`,
        createdAt: new Date().toISOString(),
        readByTi: true,
      };
      // Persistir no banco de dados para cada chamado ativo
      api.sendTicketMessage(t.id, interventionMsg.content, 'ti', author).catch(() => {});
      return {
        ...t,
        messages: [...(t.messages || []), interventionMsg],
        updatedAt: new Date().toISOString(),
      };
    });

    setTickets(updatedTickets);
    saveTickets(updatedTickets);

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Xerife da TI',
      militaryLogin: currentUser?.username || 'xerife',
      role: currentUser?.role || 'CH-XERIFEINFO',
      actionType: 'INTERVENCAO_XERIFE',
      summary: `Realizou intervenção geral enviando despacho para ${activeTicketsCount} chamado(s) em aberto`,
      details: `Mensagem: "${message}"`,
      targetRef: 'TODOS_CHAMADOS',
    });
  };

  // Handler: Enviar mensagem no mini-chat do chamado (solicitante ou TI) sincronizando com banco
  const handleSendMessage = (ticketId: string, content: string, sender: 'solicitante' | 'ti', senderName: string) => {
    const ticketTarget = tickets.find(t => t.id === ticketId);
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender,
      senderName,
      content,
      createdAt: new Date().toISOString(),
      readByTi: sender === 'ti',
    };

    // Atualização otimista no estado local e salvamento imediato no storage com broadcast
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        const currentMessages = t.messages || [];
        return {
          ...t,
          messages: [...currentMessages, newMsg],
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    saveTickets(updatedTickets);

    // Sincronizar e salvar no banco de dados (MySQL / SQLite / JSON)
    api.sendTicketMessage(ticketId, content, sender, senderName)
      .then(res => {
        if (res?.ticket?.messages) {
          setTickets(prev => {
            const next = prev.map(t => t.id === ticketId ? { ...t, messages: res.ticket.messages } : t);
            saveTickets(next);
            return next;
          });
        }
      })
      .catch(err => {
        console.warn('[Sync Chat] Fallback para updateTicket ao salvar mensagem:', err);
        const updatedList = (ticketTarget?.messages || []).concat(newMsg);
        api.updateTicket(ticketId, { messages: updatedList } as any).catch(console.error);
      });

    if (sender === 'ti') {
      handleAddAuditLog({
        militaryName: currentUser?.name || senderName,
        militaryLogin: currentUser?.username || 'ti',
        role: currentUser?.role || 'CH-TECNICOINFO',
        actionType: 'MENSAGEM_CHAMADO',
        summary: `Respondeu no chat do chamado ${ticketTarget?.code || ticketId}: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
        targetRef: ticketTarget?.code || ticketId,
      });
    }
  };

  // Handler: Marcar mensagens do chamado como lidas pela TI e sincronizar
  const handleMarkMessagesAsRead = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId && t.messages) {
        const hasUnread = t.messages.some(m => !m.readByTi);
        if (!hasUnread) return t;
        const updated = t.messages.map(m => m.readByTi ? m : { ...m, readByTi: true });
        // Salva estado de lido no banco
        api.updateTicket(ticketId, { messages: updated } as any).catch(console.warn);
        return { ...t, messages: updated };
      }
      return t;
    }));
  };

  // Handler: Atribuir militar da TI (Exclusivo Xerife e Chefe)
  const handleAssignTechnician = (ticketId: string, technicianId: string) => {
    const tech = technicians.find(tc => tc.id === technicianId);
    const ticketTarget = tickets.find(t => t.id === ticketId);
    const author = currentUser?.name || 'Xerife da TI';

    // Regra estrita: todo chamado com alguém designado obrigatoriamente está EM ANDAMENTO (a menos que já resolvido ou cancelado)
    const shouldBeEmAtendimento = !!technicianId && ticketTarget?.status !== 'resolvido' && ticketTarget?.status !== 'cancelado';
    const newStatus = shouldBeEmAtendimento ? 'em_atendimento' : (ticketTarget?.status || 'aberto');

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author,
      action: tech ? `Atribuído ao técnico: ${tech.name}` : 'Militar desvinculado',
    };

    const updatedHistory = [...(ticketTarget?.history || []), newHistoryItem];

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        technicianId: technicianId || null,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        history: updatedHistory
      };
    }));

    api.assignTechnician(ticketId, technicianId, author, tech?.name).catch(err => {
      console.warn('[API] Erro ao atribuir técnico no banco, tentando fallback:', err);
      api.updateTicket(ticketId, {
        technicianId: technicianId || null,
        status: newStatus,
        history: updatedHistory
      } as any).catch(console.error);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Xerife da TI',
      militaryLogin: currentUser?.username || 'xerife',
      role: currentUser?.role || 'CH-XERIFEINFO',
      actionType: 'ATRIBUIR_TECNICO',
      summary: tech 
        ? `Atribuiu o chamado ${ticketTarget?.code || ticketId} para o técnico ${tech.name}` 
        : `Removeu atribuição de técnico do chamado ${ticketTarget?.code || ticketId}`,
      targetRef: ticketTarget?.code || ticketId,
    });
  };

  // Handler: Adicionar despacho técnico (Sincronizado e persistido no banco)
  const handleAddTicketHistory = (ticketId: string, comment: string, author: string) => {
    const ticketTarget = tickets.find(t => t.id === ticketId);
    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author,
      action: 'Despacho Técnico',
      comment,
    };

    const updatedHistory = [...(ticketTarget?.history || []), newHistoryItem];

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        updatedAt: new Date().toISOString(),
        history: updatedHistory
      };
    }));

    api.addTicketHistory(ticketId, comment, author).catch(err => {
      console.warn('[API] Erro ao registrar despacho no banco, tentando fallback:', err);
      api.updateTicket(ticketId, { history: updatedHistory } as any).catch(console.error);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || author,
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-TECNICOINFO',
      actionType: 'DESPACHO_TECNICO',
      summary: `Adicionou despacho no chamado ${ticketTarget?.code || ticketId}: "${comment.slice(0, 60)}${comment.length > 60 ? '...' : ''}"`,
      targetRef: ticketTarget?.code || ticketId,
    });
  };

  // Handler: Avaliação de atendimento (estrelas)
  const handleUpdateTicketRating = (ticketId: string, rating: number, comment?: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        rating,
        userFeedback: comment || t.userFeedback,
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  // Handler: Cadastrar Nova Cautela de Notebook (Sincronizado com Banco)
  const handleAddNotebookLoan = (loanData: Omit<NotebookLoan, 'id'>) => {
    const newLoan: NotebookLoan = {
      ...loanData,
      id: `loan-${Date.now()}`,
      originalExpectedReturnDate: loanData.expectedReturnDate,
      extensionCount: 0,
      history: [
        {
          id: `lh-${Date.now()}`,
          date: new Date().toISOString(),
          author: loanData.authorizedBy || currentUser?.name || 'Seção de TI',
          action: 'criacao',
          summary: `Cautela autorizada e notebook entregue para ${loanData.borrowerName}. Previsão de devolução: ${new Date(loanData.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}.`,
        }
      ],
      messages: [
        {
          id: `lm-${Date.now()}`,
          sender: 'ti',
          senderName: loanData.authorizedBy || currentUser?.name || 'Seção de TI',
          content: `Cautela registrada no sistema. Equipamento retirado na Seção de TI.`,
          createdAt: new Date().toISOString(),
        }
      ]
    };

    setNotebookLoans(prev => [newLoan, ...prev]);

    // Persistir no banco de dados Sequelize
    api.createNotebookLoan(newLoan).catch(err => {
      console.warn('[API] Erro ao salvar cautela no banco:', err);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || loanData.authorizedBy,
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'NOVA_CAUTELA',
      summary: `Cadastrou nova cautela do notebook ${newLoan.notebookNumber} para ${newLoan.borrowerName}`,
      targetRef: newLoan.notebookNumber,
    });
  };

  // Handler: Prorrogar Prazo de Devolução do Notebook (Sincronizado com Banco)
  const handleExtendNotebookLoan = (
    loanId: string,
    newExpectedDate: string,
    justification: string,
    authorizedBy: string
  ) => {
    const targetLoan = notebookLoans.find(l => l.id === loanId);
    const author = authorizedBy || currentUser?.name || 'Seção de TI';
    const oldDateStr = targetLoan ? new Date(targetLoan.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR') : '';
    const newDateStr = new Date(newExpectedDate + 'T00:00:00').toLocaleDateString('pt-BR');

    setNotebookLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;

      const newHistoryItem: LoanHistoryItem = {
        id: `lh-${Date.now()}`,
        date: new Date().toISOString(),
        author,
        action: 'prorrogacao',
        summary: `Prorrogação de entrega autorizada de ${oldDateStr} para ${newDateStr}. Motivo: ${justification}`,
        previousDate: l.expectedReturnDate,
        newDate: newExpectedDate,
        justification,
      };

      const newChatMessage: LoanMessage = {
        id: `lm-${Date.now()}`,
        sender: 'ti',
        senderName: author,
        content: `[PRORROGAÇÃO CONCEDIDA] Devolução prorrogada de ${oldDateStr} até ${newDateStr}.\nJustificativa militar: ${justification}`,
        createdAt: new Date().toISOString(),
      };

      const updated = {
        ...l,
        originalExpectedReturnDate: l.originalExpectedReturnDate || l.expectedReturnDate,
        expectedReturnDate: newExpectedDate,
        extensionCount: (l.extensionCount || 0) + 1,
        lastExtensionReason: justification,
        history: [...(l.history || []), newHistoryItem],
        messages: [...(l.messages || []), newChatMessage],
      };

      // Persistir no banco de dados
      api.updateNotebookLoan(loanId, updated).catch(err => {
        console.warn('[API] Erro ao sincronizar prorrogação no banco:', err);
      });

      return updated;
    }));

    handleAddAuditLog({
      militaryName: currentUser?.name || author,
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'PRORROGACAO_CAUTELA',
      summary: `Prorrogou a entrega do notebook ${targetLoan?.notebookNumber || loanId} até ${newDateStr}`,
      details: `Justificativa militar: ${justification}`,
      targetRef: targetLoan?.notebookNumber || loanId,
    });
  };

  // Handler: Enviar Mensagem no Chat da Cautela do Notebook (Sincronizado com Banco)
  const handleSendLoanMessage = (
    loanId: string,
    content: string,
    sender: 'militar' | 'ti',
    senderName: string
  ) => {
    const targetLoan = notebookLoans.find(l => l.id === loanId);
    const newMsg: LoanMessage = {
      id: `lm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender,
      senderName,
      content,
      createdAt: new Date().toISOString(),
    };

    const updatedLoans = notebookLoans.map(l => {
      if (l.id !== loanId) return l;
      const updatedMessages = [...(l.messages || []), newMsg];
      
      // Sincronizar com banco de dados
      api.updateNotebookLoan(loanId, { messages: updatedMessages }).catch(err => {
        console.warn('[API] Erro ao salvar mensagem da cautela no banco:', err);
      });

      return {
        ...l,
        messages: updatedMessages,
      };
    });

    setNotebookLoans(updatedLoans);
    saveNotebookLoans(updatedLoans);

    handleAddAuditLog({
      militaryName: currentUser?.name || senderName,
      militaryLogin: currentUser?.username || (sender === 'ti' ? 'ti' : 'solicitante'),
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'MENSAGEM_CAUTELA',
      summary: `Mensagem no chat do notebook ${targetLoan?.notebookNumber || loanId}: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
      targetRef: targetLoan?.notebookNumber || loanId,
    });
  };

  // Handler: Realizar Descautela / Devolução (Sincronizado com Banco)
  const handleReturnNotebookLoan = (
    loanId: string, 
    returnData: {
      returnDate: string;
      hasIssues: boolean;
      issues: string[];
      notes: string;
      authorizedBy: string;
    }
  ) => {
    const targetLoan = notebookLoans.find(l => l.id === loanId);
    const author = returnData.authorizedBy || currentUser?.name || 'Seção de TI';

    setNotebookLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;

      const returnHistory: LoanHistoryItem = {
        id: `lh-${Date.now()}`,
        date: new Date().toISOString(),
        author,
        action: 'devolucao',
        summary: returnData.hasIssues 
          ? `Descautela com apontamento de avarias: ${returnData.issues.join(', ')}`
          : 'Descautela realizada sem avarias. Equipamento conferido e recolhido ao estoque.',
        justification: returnData.notes,
      };

      const returnMsg: LoanMessage = {
        id: `lm-${Date.now()}`,
        sender: 'ti',
        senderName: author,
        content: `[DESCAUTELA REALIZADA] Equipamento devolvido à TI em ${new Date(returnData.returnDate + 'T00:00:00').toLocaleDateString('pt-BR')}.${returnData.hasIssues ? ` Laudo: ${returnData.notes}` : ''}`,
        createdAt: new Date().toISOString(),
      };

      const updated = {
        ...l,
        actualReturnDate: returnData.returnDate,
        status: 'devolvido' as const,
        hasIssuesOnReturn: returnData.hasIssues,
        returnIssues: returnData.issues,
        returnNotes: returnData.notes,
        returnedAuthorizedBy: returnData.authorizedBy,
        history: [...(l.history || []), returnHistory],
        messages: [...(l.messages || []), returnMsg],
      };

      // Persistir no banco de dados
      api.updateNotebookLoan(loanId, updated).catch(err => {
        console.warn('[API] Erro ao sincronizar devolução no banco:', err);
      });

      return updated;
    }));

    handleAddAuditLog({
      militaryName: currentUser?.name || author,
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'DEVOLUCAO_CAUTELA',
      summary: `Realizou a descautela do notebook ${targetLoan?.notebookNumber || loanId}`,
      details: returnData.hasIssues ? `Avarias: ${returnData.issues.join(', ')}` : 'Devolvido sem avarias',
      targetRef: targetLoan?.notebookNumber || loanId,
    });
  };

  // Handler: Excluir definitivamente cautela de notebook (Exclusivo Chefe da Seção)
  const handleDeleteNotebookLoan = (loanId: string) => {
    const loanTarget = notebookLoans.find(l => l.id === loanId);
    setNotebookLoans(prev => prev.filter(l => l.id !== loanId));

    // Excluir definitivamente no banco de dados Sequelize
    api.deleteNotebookLoan(loanId).catch(err => {
      console.warn('[API] Erro ao deletar cautela do banco:', err);
    });

    handleAddAuditLog({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'secinfo',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'EXCLUSAO_CAUTELA',
      summary: `Excluiu permanentemente a cautela do notebook ${loanTarget?.notebookNumber || loanId} (${loanTarget?.borrowerName || ''})`,
      targetRef: loanTarget?.notebookNumber || loanId,
    });
  };

  // Handler: Atualizar Cautela de Notebook (Status, Datas, etc. via Kanban Drag & Drop)
  const handleUpdateNotebookLoan = (loanId: string, updates: Partial<NotebookLoan>) => {
    setNotebookLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;
      const updated = { ...l, ...updates };
      api.updateNotebookLoan(loanId, updated).catch(err => {
        console.warn('[API] Erro ao atualizar cautela no banco:', err);
      });
      return updated;
    }));
  };

  // Handler: Abrir Modo TV (exclusivo para login CH-TVINFO ou DEV)
  const handleOpenTvMode = () => {
    if (currentUser?.role === 'CH-TVINFO' || currentUser?.username === 'dev' || currentUser?.rank === 'Dev') {
      setIsTvModeOpen(true);
    } else {
      alert('Acesso ao Modo Painel TV é restrito à conta da TV (CH-TVINFO) ou DEV.');
    }
  };

  // Alternar militar na sessão (para testar permissões)
  const handleSwitchUser = (user: MilitaryUser) => {
    if (!originalUser && currentUser) {
      setOriginalUser(currentUser);
      sessionStorage.setItem('eb_original_authenticated_user', JSON.stringify(currentUser));
    }
    setCurrentUser(user);
    saveCurrentUser(user);

    const userA11y = loadUserAccessibilitySettings(user.username);
    if (userA11y) {
      setA11y(userA11y);
    }

    handleAddAuditLog({
      militaryName: user.name,
      militaryLogin: user.username,
      role: user.role,
      actionType: 'LOGIN_SUCESSO',
      summary: `Sessão alternada para o militar ${user.name} (${user.role}).`,
    });
  };

  // Classes de Acessibilidade
  const fontSizeClass = a11y.fontSize === 'extralarge' 
    ? 'font-size-extralarge' 
    : a11y.fontSize === 'large' 
      ? 'font-size-large' 
      : '';

  const contrastClass = a11y.highContrast ? 'high-contrast' : '';

  const openTicketsCount = tickets.filter(t => t.status !== 'resolvido' && t.status !== 'cancelado').length;
  const activeLoansCount = notebookLoans.filter(l => l.status === 'cautelado').length;
  const unreadMessagesCount = tickets.reduce((acc, t) => {
    const unread = t.messages?.filter(m => m.sender === 'solicitante' && !m.readByTi).length || 0;
    return acc + unread;
  }, 0);
  const criticalCount = tickets.filter(t => t.priority === 'critica' && t.status !== 'resolvido' && t.status !== 'cancelado').length;
  const openMissionsCount = missions.filter(m => m.status !== 'concluida').length;

  return (
    <div className={`min-h-screen flex flex-col w-full max-w-full overflow-x-clip transition-colors ${fontSizeClass} ${contrastClass} ${
      a11y.highContrast ? 'bg-black text-white' : 'bg-[#f4f6f2] text-slate-900'
    }`}>
      
      {/* SEÇÃO 1: LAYOUT DASHBOARD COM BARRA LATERAL (ADMIN AUTENTICADO) */}
      {isAdminRoute && isAdminAuthenticated ? (
        <div className="min-h-screen flex w-full max-w-full bg-[#152311]">
          {/* Barra Lateral / Sidebar */}
          <AdminSidebar
            adminTab={adminTab}
            onSelectAdminTab={setAdminTab}
            openTicketsCount={openTicketsCount}
            activeLoansCount={activeLoansCount}
            techniciansCount={militaryUsers.length}
            missionsCount={openMissionsCount}
            unreadMessagesCount={unreadMessagesCount}
            onOpenTvMode={handleOpenTvMode}
            onLogoutAdmin={handleAdminLogout}
            onNavigateToClient={navigateToClient}
            a11y={a11y}
            onUpdateA11y={setA11y}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            currentUser={currentUser}
          />

          {/* Área Principal Direita do Dashboard */}
          <div className="flex-1 flex flex-col min-w-0 max-w-full min-h-screen bg-[#f4f6f2] overflow-x-clip">
            {/* Banner de Simulação de Permissões com Botão para Restaurar Conta Original */}
            {originalUser && currentUser && originalUser.username !== currentUser.username && (
              <div className="sticky top-0 z-40 bg-[#1e3316] text-[#dfb642] px-4 py-2 border-b-2 border-[#dfb642] flex flex-wrap items-center justify-between gap-2 text-xs font-bold shadow-md">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldAlert className="w-4 h-4 text-[#dfb642] animate-pulse shrink-0" />
                  <span className="truncate">
                    SIMULAÇÃO DE PERMISSÕES ATIVA: Você está operando como <strong>{currentUser.name}</strong> ({currentUser.role}).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentUser(originalUser);
                    saveCurrentUser(originalUser);
                    sessionStorage.removeItem('eb_original_authenticated_user');
                    setOriginalUser(null);
                    const origA11y = loadUserAccessibilitySettings(originalUser.username);
                    if (origA11y) setA11y(origA11y);
                  }}
                  className="px-3.5 py-1 bg-[#dfb642] text-[#192b14] hover:bg-yellow-400 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  <span>↩ Voltar para {originalUser.name} ({originalUser.role})</span>
                </button>
              </div>
            )}

            <AdminTopBar
              adminTab={adminTab}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
              unreadMessagesCount={unreadMessagesCount}
              onOpenTvMode={handleOpenTvMode}
              onLogoutAdmin={handleAdminLogout}
              criticalCount={criticalCount}
              currentUser={currentUser}
              tickets={tickets}
              departments={departments}
              onOpenTicketWithDoubts={(ticket) => {
                setFocusedTicket(ticket);
                setAdminTab('it');
              }}
              a11y={a11y}
              onUpdateA11y={setA11y}
            />

            <main className="flex-1">
              {adminTab === 'it' && (
                <ITDashboard
                  tickets={tickets}
                  departments={departments}
                  technicians={technicians}
                  a11y={a11y}
                  currentUser={currentUser}
                  onUpdateTicketStatus={handleUpdateTicketStatus}
                  onUpdateTicketPriority={handleUpdateTicketPriority}
                  onUpdateTicketTitle={handleUpdateTicketTitle}
                  onUpdateTicketCard={handleUpdateTicketCard}
                  onAssignTechnician={handleAssignTechnician}
                  onAddTicketHistory={handleAddTicketHistory}
                  onDeleteTicket={handleDeleteTicket}
                  onOpenTvMode={() => setIsTvModeOpen(true)}
                  onSendMessage={handleSendMessage}
                  onMarkMessagesAsRead={handleMarkMessagesAsRead}
                  onMassIntervention={handleMassIntervention}
                  initialActiveTicket={focusedTicket}
                  onClearInitialTicket={() => setFocusedTicket(null)}
                />
              )}

              {adminTab === 'notebooks' && (
                <NotebookLoans
                  loans={notebookLoans}
                  departments={departments}
                  a11y={a11y}
                  adminPassword="admin"
                  currentUser={currentUser}
                  onAddLoan={handleAddNotebookLoan}
                  onReturnLoan={handleReturnNotebookLoan}
                  onExtendLoan={handleExtendNotebookLoan}
                  onSendLoanMessage={handleSendLoanMessage}
                  onDeleteLoan={handleDeleteNotebookLoan}
                  onUpdateLoan={handleUpdateNotebookLoan}
                />
              )}

              {adminTab === 'missions' && (
                <MissionsManager
                  missions={missions}
                  technicians={technicians}
                  militaryUsers={militaryUsers}
                  currentUser={currentUser}
                  a11y={a11y}
                  onAddMission={handleAddMission}
                  onUpdateMission={handleUpdateMission}
                  onDeleteMission={handleDeleteMission}
                  onAddMissionNote={handleAddMissionNote}
                  onToggleChecklistItem={handleToggleChecklistItem}
                  onAddAuditLog={handleAddAuditLog}
                />
              )}

              {adminTab === 'technicians' && (
                <TechniciansManager
                  technicians={technicians}
                  militaryUsers={militaryUsers}
                  auditLogs={auditLogs}
                  currentUser={currentUser}
                  a11y={a11y}
                  onUpdateTechnicians={setTechnicians}
                  onUpdateMilitaryUsers={setMilitaryUsers}
                  onAddAuditLog={handleAddAuditLog}
                  onSwitchUser={handleSwitchUser}
                />
              )}

              {adminTab === 'duty_roster' && currentUser?.role !== 'CH-TVINFO' && (
                <DutyRoster
                  currentUser={currentUser}
                  militaryUsers={militaryUsers}
                  technicians={technicians}
                  a11y={a11y}
                  onAddAuditLog={handleAddAuditLog}
                />
              )}
            </main>

            {/* Rodapé Oficial do Dashboard */}
            <footer className={`border-t py-4 px-6 text-xs transition-colors relative z-10 ${
              a11y.highContrast 
                ? 'bg-black border-yellow-400 text-yellow-400' 
                : 'bg-[#192b14] border-[#cba135]/30 text-emerald-100/70'
            }`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="font-bold text-[#dfb642]">
                    2º GAC
                  </span>
                  <span>·</span>
                  <span>Seção de Informática & TI</span>
                  <span>·</span>
                  <span className="font-mono text-emerald-300">BRAÇO FORTE, MÃO AMIGA</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {/* Botão de Abas da Intranet */}
                  <button
                    onClick={() => setIsIntranetModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#27431e] hover:bg-[#345c27] text-[#dfb642] hover:text-white border border-[#3e682e] font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Configurar e abrir abas da Intranet do 2º GAC"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Abas da Intranet</span>
                  </button>

                  <button
                    onClick={navigateToClient}
                    className="hover:text-white flex items-center gap-1 font-mono text-[11px] text-emerald-200/80 hover:text-[#dfb642] transition-colors"
                  >
                    <span>Portal do Solicitante →</span>
                  </button>
                </div>
              </div>

              {/* Linha de Crédito Oficial */}
              <div className="mt-2 pt-2 border-t border-[#27431e]/60 flex items-center justify-center text-[11px] font-mono text-emerald-300/80">
                <a
                  href="https://linkedin.com/in/manfrinato"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#dfb642] hover:underline transition-colors"
                >
                  desenvolvido com &lt;3 por Manfrinato | INFO/26
                </a>
              </div>
            </footer>
          </div>
        </div>
      ) : (
        /* SEÇÃO 2: LAYOUT INSTITUCIONAL PADRÃO (PORTAL DO SOLICITANTE OU LOGIN TI) */
        <div className="flex-1 flex flex-col relative z-10 w-full max-w-full overflow-x-hidden">
          <Header
            isAdminRoute={isAdminRoute}
            adminTab={adminTab}
            onSelectAdminTab={setAdminTab}
            isAdminAuthenticated={isAdminAuthenticated}
            onLogoutAdmin={handleAdminLogout}
            onNavigateToClient={navigateToClient}
            onNavigateToAdmin={navigateToAdmin}
            onOpenTvMode={() => setIsTvModeOpen(true)}
            a11y={a11y}
            onUpdateA11y={setA11y}
            openTicketsCount={openTicketsCount}
            activeLoansCount={activeLoansCount}
          />

          <main className="flex-1">
            {/* PORTAL DO SOLICITANTE COM CONSULTA E MINI-CHAT */}
            {!isAdminRoute && (
              <EmployeePortal
                tickets={tickets}
                departments={departments}
                categories={categories}
                a11y={a11y}
                onCreateTicket={handleCreateTicket}
                onUpdateTicketRating={handleUpdateTicketRating}
                onSendMessage={handleSendMessage}
              />
            )}

            {/* TELA DE LOGIN PARA A ADMINISTRAÇÃO DA TI */}
            {isAdminRoute && !isAdminAuthenticated && (
              <AdminLogin
                militaryUsers={militaryUsers}
                onLoginSuccess={handleAdminLoginSuccess}
                onGoBackToPortal={navigateToClient}
                a11y={a11y}
                onUpdateMilitaryUsers={setMilitaryUsers}
                onAddAuditLog={handleAddAuditLog}
              />
            )}
          </main>

          {/* Rodapé Militar Oficial */}
          <footer className={`border-t py-4 px-4 sm:px-8 text-xs transition-colors ${
            a11y.highContrast 
              ? 'bg-black border-yellow-400 text-yellow-400' 
              : 'bg-[#192b14] border-[#cba135]/30 text-emerald-100/70'
          }`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="font-bold text-[#dfb642]">
                  2º GAC
                </span>
                <span>·</span>
                <span>Seção de Informática & TI</span>
                <span>·</span>
                <span className="font-mono text-emerald-300">BRAÇO FORTE, MÃO AMIGA</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Botão de Abas da Intranet */}
                <button
                  onClick={() => setIsIntranetModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#27431e] hover:bg-[#345c27] text-[#dfb642] hover:text-white border border-[#3e682e] font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Configurar e abrir atalhos da Intranet"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Abas da Intranet</span>
                </button>

                {!isAdminRoute ? (
                  <button
                    onClick={navigateToAdmin}
                    className="hover:text-white flex items-center gap-1 font-mono text-[11px] text-emerald-200/60 hover:text-[#dfb642] transition-colors"
                    title="Acesso exclusivo da Seção de TI via URL /admin"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Acesso TI (/admin)</span>
                  </button>
                ) : (
                  <button
                    onClick={navigateToClient}
                    className="hover:text-white font-mono text-[11px] text-[#dfb642] hover:underline"
                  >
                    ← Voltar para Central do Solicitante
                  </button>
                )}

                <span>·</span>

                <button
                  onClick={() => {
                    setA11y(prev => ({ ...prev, highContrast: !prev.highContrast }));
                  }}
                  className="hover:underline font-semibold cursor-pointer"
                >
                  {a11y.highContrast ? 'Desativar Alto Contraste' : 'Alto Contraste'}
                </button>
              </div>
            </div>

            {/* Linha de Crédito Oficial */}
            <div className="mt-2 pt-2 border-t border-[#27431e]/60 flex items-center justify-center text-[11px] font-mono text-emerald-300/80">
              <a
                href="https://linkedin.com/in/manfrinato"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#dfb642] hover:underline transition-colors"
              >
                desenvolvido com &lt;3 por Manfrinato{!(isAdminRoute && !isAdminAuthenticated) ? ' | INFO/26' : ''}
              </a>
            </div>
          </footer>
        </div>
      )}

      {/* Fundo Artilharia / General Mallet e Obuseiros */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.045] bg-cover bg-center bg-no-repeat mix-blend-multiply"
        style={{ backgroundImage: `url(${malletBg})` }}
        aria-hidden="true"
      />

      {/* Modal de Abas da Intranet configurável */}
      <IntranetModal
        isOpen={isIntranetModalOpen}
        onClose={() => setIsIntranetModalOpen(false)}
        a11y={a11y}
        currentUser={currentUser}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Painel Modo TV em Tela Ampla para a Sala de TI */}
      {isTvModeOpen && (
        <TVDashboard
          tickets={tickets}
          departments={departments}
          technicians={technicians}
          onClose={() => setIsTvModeOpen(false)}
        />
      )}

    </div>
  );
}
