import { 
  Ticket, 
  Department, 
  Technician, 
  Category, 
  AccessibilitySettings, 
  NotebookLoan, 
  MilitaryUser, 
  SystemAuditLog,
  Mission,
  AttendanceRecord,
  DutyShiftEntry,
  DutySwapRequest,
  KeyHandoverRecord,
  MilitaryLeaveRecord
} from '../types';
import { 
  initialTickets, 
  initialDepartments, 
  initialTechnicians, 
  initialCategories, 
  initialNotebookLoans,
  initialMilitaryUsers,
  initialAuditLogs,
  initialMissions
} from '../data/mockData';
import { api } from './api';

export const STORAGE_KEYS = {
  TICKETS: 'eb_tickets_v6',
  DEPARTMENTS: 'eb_departments_v4',
  TECHNICIANS: 'eb_technicians_v5',
  CATEGORIES: 'eb_categories_v4',
  NOTEBOOK_LOANS: 'eb_notebook_loans_v6',
  A11Y: 'eb_a11y_v4',
  MILITARY_USERS: 'eb_military_users_v5',
  AUDIT_LOGS: 'eb_audit_logs_v5',
  CURRENT_USER: 'eb_current_user_v5',
  MISSIONS: 'eb_missions_v6',
  LAST_PAGE: 'eb_deodoro_last_page_v1',
  ATTENDANCE_RECORDS: 'eb_attendance_records_v1',
  DUTY_ROSTER_SHIFTS: 'eb_duty_roster_shifts_v1',
  DUTY_SWAPS: 'eb_duty_swaps_v1',
  KEY_HANDOVERS: 'eb_key_handovers_v1',
  MILITARY_LEAVES: 'eb_military_leaves_v1',
};

// Sincronização inicial com o banco Sequelize em background
export const syncAllFromBackend = async (callbacks?: {
  setTickets?: (tickets: Ticket[]) => void;
  setDepartments?: (departments: Department[]) => void;
  setTechnicians?: (technicians: Technician[]) => void;
  setMilitaryUsers?: (users: MilitaryUser[]) => void;
  setNotebookLoans?: (loans: NotebookLoan[]) => void;
  setMissions?: (missions: Mission[]) => void;
  setAuditLogs?: (logs: SystemAuditLog[]) => void;
}) => {
  try {
    const [tickets, departments, technicians, militaryUsers, loans, missions, logs] = await Promise.allSettled([
      api.getTickets(),
      api.getDepartments(),
      api.getTechnicians(),
      api.getMilitaryUsers(),
      api.getNotebookLoans(),
      api.getMissions(),
      api.getAuditLogs(),
    ]);

    if (tickets.status === 'fulfilled') {
      saveTickets(tickets.value);
      callbacks?.setTickets?.(tickets.value);
    }
    if (departments.status === 'fulfilled' && departments.value.length > 0) {
      saveDepartments(departments.value);
      callbacks?.setDepartments?.(departments.value);
    }
    if (technicians.status === 'fulfilled' && technicians.value.length > 0) {
      saveTechnicians(technicians.value);
      callbacks?.setTechnicians?.(technicians.value);
    }
    if (militaryUsers.status === 'fulfilled' && militaryUsers.value.length > 0) {
      saveMilitaryUsers(militaryUsers.value);
      callbacks?.setMilitaryUsers?.(militaryUsers.value);
    }
    if (loans.status === 'fulfilled') {
      saveNotebookLoans(loans.value);
      callbacks?.setNotebookLoans?.(loans.value);
    }
    if (missions.status === 'fulfilled') {
      saveMissions(missions.value);
      callbacks?.setMissions?.(missions.value);
    }
    if (logs.status === 'fulfilled' && logs.value.length > 0) {
      saveAuditLogs(logs.value);
      callbacks?.setAuditLogs?.(logs.value);
    }
  } catch (err) {
    console.warn('[Sync] Falha temporária de sincronização com backend:', err);
  }
};

export const loadTickets = (): Ticket[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(initialTickets));
      return initialTickets;
    }
    const parsed: Ticket[] = JSON.parse(raw);
    return parsed.map(t => ({
      ...t,
      code: t.code?.startsWith('CH-') ? t.code.replace('CH-', 'TICKET-') : (t.code || `TICKET-${t.id}`)
    }));
  } catch (e) {
    console.error('Erro ao ler tickets do localStorage:', e);
    return initialTickets;
  }
};

export const saveTickets = (tickets: Ticket[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    broadcastSyncEvent('TICKETS_CHANGED', tickets);
  } catch (e) {
    console.error('Erro ao salvar tickets:', e);
  }
};

export const loadDepartments = (): Department[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(initialDepartments));
      return initialDepartments;
    }
    return JSON.parse(raw);
  } catch (e) {
    return initialDepartments;
  }
};

export const saveDepartments = (depts: Department[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(depts));
  } catch (e) {
    console.error('Erro ao salvar seções:', e);
  }
};

export const loadTechnicians = (): Technician[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TECHNICIANS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(initialTechnicians));
      return initialTechnicians;
    }
    const parsed: Technician[] = JSON.parse(raw);
    const missing = initialTechnicians.filter(it => !parsed.some(p => p.id === it.id || p.name === it.name));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch (e) {
    return initialTechnicians;
  }
};

export const saveTechnicians = (techs: Technician[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(techs));
  } catch (e) {
    console.error('Erro ao salvar técnicos:', e);
  }
};

export const loadCategories = (): Category[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
      return initialCategories;
    }
    return JSON.parse(raw);
  } catch (e) {
    return initialCategories;
  }
};

export const saveCategories = (cats: Category[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.error('Erro ao salvar categorias:', e);
  }
};

export const loadNotebookLoans = (): NotebookLoan[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTEBOOK_LOANS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTEBOOK_LOANS, JSON.stringify(initialNotebookLoans));
      return initialNotebookLoans;
    }
    const parsed: NotebookLoan[] = JSON.parse(raw);
    return parsed.map(l => ({
      ...l,
      history: l.history || [],
      messages: l.messages || [],
      extensionCount: l.extensionCount ?? 0,
      originalExpectedReturnDate: l.originalExpectedReturnDate || l.expectedReturnDate,
    }));
  } catch (e) {
    return initialNotebookLoans;
  }
};

export const saveNotebookLoans = (loans: NotebookLoan[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTEBOOK_LOANS, JSON.stringify(loans));
    broadcastSyncEvent('NOTEBOOK_LOANS_CHANGED', loans);
  } catch (e) {
    console.error('Erro ao salvar cautelas de notebook:', e);
  }
};

export const loadMilitaryUsers = (): MilitaryUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MILITARY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MILITARY_USERS, JSON.stringify(initialMilitaryUsers));
      return initialMilitaryUsers;
    }
    const parsed: MilitaryUser[] = JSON.parse(raw);
    const missing = initialMilitaryUsers.filter(iu => !parsed.some(p => p.username === iu.username));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(STORAGE_KEYS.MILITARY_USERS, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch (e) {
    return initialMilitaryUsers;
  }
};

export const saveMilitaryUsers = (users: MilitaryUser[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MILITARY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Erro ao salvar militares:', e);
  }
};

export const loadAuditLogs = (): SystemAuditLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialAuditLogs));
      return initialAuditLogs;
    }
    return JSON.parse(raw);
  } catch (e) {
    return initialAuditLogs;
  }
};

export const saveAuditLogs = (logs: SystemAuditLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Erro ao salvar logs:', e);
  }
};

export const addAuditLog = (logItem: Omit<SystemAuditLog, 'id' | 'timestamp'>): SystemAuditLog => {
  const currentLogs = loadAuditLogs();
  const newLog: SystemAuditLog = {
    ...logItem,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
  };
  const updatedLogs = [newLog, ...currentLogs].slice(0, 300); // Manter últimos 300 logs
  saveAuditLogs(updatedLogs);
  return newLog;
};

export const loadCurrentUser = (): MilitaryUser | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

export const saveCurrentUser = (user: MilitaryUser | null) => {
  try {
    if (user) {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      sessionStorage.setItem('eb_ti_admin_authenticated', 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem('eb_ti_admin_authenticated');
    }
  } catch {}
};

export const loadAccessibilitySettings = (): AccessibilitySettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.A11Y);
    if (!raw) {
      return {
        fontSize: 'normal',
        highContrast: false,
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      fontSize: 'normal',
      highContrast: false,
    };
  }
};

export const saveAccessibilitySettings = (settings: AccessibilitySettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.A11Y, JSON.stringify(settings));
  } catch (e) {
    console.error('Erro ao salvar a11y:', e);
  }
};

// ==================== MISSÕES MILITARES ====================
export const loadMissions = (): Mission[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MISSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(initialMissions));
      return initialMissions;
    }
    return JSON.parse(raw);
  } catch {
    return initialMissions;
  }
};

export const saveMissions = (missions: Mission[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
    broadcastSyncEvent('MISSIONS_CHANGED', missions);
    broadcastSyncEvent('MISSIONS_UPDATED', missions);
  } catch (e) {
    console.error('Erro ao salvar missões:', e);
  }
};

// ==================== ÚLTIMA PÁGINA / ROTA ACESSADA ====================
export interface LastPageState {
  isAdminRoute: boolean;
  adminTab: 'it' | 'notebooks' | 'missions' | 'technicians';
  isTvOpen?: boolean;
}

export const loadLastPage = (): LastPageState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_PAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isAdminRoute: Boolean(parsed.isAdminRoute),
        adminTab: ['it', 'notebooks', 'missions', 'technicians'].includes(parsed.adminTab) ? parsed.adminTab : 'it',
        isTvOpen: Boolean(parsed.isTvOpen)
      };
    }
  } catch {}
  return {
    isAdminRoute: false,
    adminTab: 'it',
    isTvOpen: false
  };
};

export const saveLastPage = (page: LastPageState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PAGE, JSON.stringify(page));
  } catch {}
};

// ==================== SINCRONIZAÇÃO EM TEMPO REAL MULTI-USUÁRIO ====================
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('eb_deodoro_realtime_sync');
  }
} catch {}

export const broadcastSyncEvent = (eventType: string, payload?: any) => {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ type: eventType, payload, timestamp: Date.now() });
    }
    // Disparar também evento customizado local para o mesmo documento
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eb_sync_event', { detail: { type: eventType, payload } }));
    }
  } catch {}
};

export const onRealtimeSync = (callback: (data: { type: string; payload?: any }) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type) {
      callback(event.data);
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key.startsWith('eb_')) {
      callback({ type: 'STORAGE_CHANGED', payload: event.key });
    }
  };

  const handleCustom = (event: Event) => {
    const ce = event as CustomEvent;
    if (ce.detail) {
      callback(ce.detail);
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleBroadcast);
  }
  window.addEventListener('storage', handleStorage);
  window.addEventListener('eb_sync_event', handleCustom);

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('eb_sync_event', handleCustom);
  };
};

// ==================== TIRAGEM DE FALTAS / EFETIVO ====================
export const loadAttendanceRecords = (): AttendanceRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveAttendanceRecords = (records: AttendanceRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(records));
    broadcastSyncEvent('ATTENDANCE_CHANGED', records.length);
  } catch (e) {
    console.error('Erro ao salvar registros de faltas:', e);
  }
};

// ==================== ESCALA DE SERVIÇO (1x6 PRETA E VERMELHA) ====================
export const loadDutyRosterShifts = (): DutyShiftEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DUTY_ROSTER_SHIFTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s: any) => ({
      ...s,
      permanenciaId: s.permanenciaId || s.informaticoDiaId || '',
      permanenciaNome: s.permanenciaNome || s.informaticoDiaNome || 'Não Escalado',
      sobreavisoId: s.sobreavisoId || s.auxiliarId || '',
      sobreavisoNome: s.sobreavisoNome || s.auxiliarNome || 'Não Escalado',
      isAdministrativeDay: typeof s.isAdministrativeDay === 'boolean' ? s.isAdministrativeDay : false,
      chavesDtiOk: !!s.chavesDtiOk,
      radioTelefoneOk: !!s.radioTelefoneOk,
      ronda1PosExpedienteOk: s.ronda1PosExpedienteOk ?? s.ronda16h30Ok ?? false,
      ronda2PosPernoiteOk: s.ronda2PosPernoiteOk ?? s.ronda22h00Ok ?? false,
      ronda3PreParadaOk: s.ronda3PreParadaOk ?? s.ronda06h30Ok ?? false,
      antiMeiaFaseOk: !!s.antiMeiaFaseOk,
      livroParte: s.livroParte || '',
      alteracoes: s.alteracoes || 'Sem alterações.',
      status: s.status || 'escalado',
    }));
  } catch (e) {
    return [];
  }
};

export const saveDutyRosterShifts = (shifts: DutyShiftEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DUTY_ROSTER_SHIFTS, JSON.stringify(shifts));
    broadcastSyncEvent('DUTY_ROSTER_CHANGED', shifts.length);
  } catch (e) {
    console.error('Erro ao salvar escala de serviço:', e);
  }
};

export const loadDutySwaps = (): DutySwapRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DUTY_SWAPS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveDutySwaps = (swaps: DutySwapRequest[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DUTY_SWAPS, JSON.stringify(swaps));
    broadcastSyncEvent('DUTY_SWAPS_CHANGED', swaps.length);
  } catch (e) {
    console.error('Erro ao salvar trocas de escala:', e);
  }
};

// ==================== PASSAGEM DE CHAVES (DTI, INFORMÁTICA, SERVIDOR) ====================
export const loadKeyHandovers = (): KeyHandoverRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KEY_HANDOVERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveKeyHandovers = (handovers: KeyHandoverRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.KEY_HANDOVERS, JSON.stringify(handovers));
    broadcastSyncEvent('KEY_HANDOVERS_CHANGED', handovers.length);
  } catch (e) {
    console.error('Erro ao salvar passagem de chaves:', e);
  }
};

// ==================== AFASTAMENTOS, FÉRIAS E BAIXAS ====================
export const loadMilitaryLeaves = (): MilitaryLeaveRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MILITARY_LEAVES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveMilitaryLeaves = (leaves: MilitaryLeaveRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MILITARY_LEAVES, JSON.stringify(leaves));
    broadcastSyncEvent('MILITARY_LEAVES_CHANGED', leaves.length);
  } catch (e) {
    console.error('Erro ao salvar afastamentos militares:', e);
  }
};

// ==================== ACESSIBILIDADE INDIVIDUAL POR USUÁRIO ====================
export const saveUserAccessibilitySettings = (username: string, settings: AccessibilitySettings) => {
  if (!username) return;
  try {
    localStorage.setItem(`eb_user_a11y_${username.toLowerCase()}`, JSON.stringify(settings));
  } catch (e) {
    console.error('Erro ao salvar acessibilidade do usuário:', e);
  }
};

export const loadUserAccessibilitySettings = (username: string): AccessibilitySettings | null => {
  if (!username) return null;
  try {
    const raw = localStorage.getItem(`eb_user_a11y_${username.toLowerCase()}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

