export type Priority = 'baixa' | 'media' | 'alta' | 'critica';

export type TicketStatus = 'aberto' | 'em_atendimento' | 'aguardando' | 'resolvido' | 'cancelado';

export interface TicketHistoryItem {
  id: string;
  date: string;
  author: string;
  action: string;
  comment?: string;
}

export interface TicketMessage {
  id: string;
  sender: 'solicitante' | 'ti';
  senderName: string;
  content: string;
  createdAt: string;
  readByTi?: boolean;
}

export interface Ticket {
  id: string;
  code: string; // ex: TICKET-1001
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: TicketStatus;
  requesterName: string; // Posto/Graduação e Nome de Guerra (ex: 1º Ten Silva, Sgt Mendes)
  departmentId: string; // Seção da OM (1ª Seç, 2ª Seç, SALC, etc)
  technicianId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  slaLimitHours: number;
  resolutionNotes?: string;
  rating?: number; // 1 a 5
  userFeedback?: string;
  history: TicketHistoryItem[];
  messages?: TicketMessage[];
}

export interface Department {
  id: string;
  name: string; // ex: 1ª Seção (SPes), 4ª Seção (SLog), etc.
  code: string;
  color: string;
  iconName: string;
  managerName: string;
  description: string;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  active: boolean;
  specialty: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  defaultPriority: Priority;
  simpleInstructions: string;
}

export type UserRole = 
  | 'CH-SECINFO' 
  | 'AUX-SECINFO' 
  | 'CH-XERIFEINFO' 
  | 'CH-TECNICOINFO' 
  | 'CH-TVINFO'
  | 'CHSECINFO'
  | 'AUXSECINFO'
  | 'XERIFESECINFO'
  | 'TECINFO';

export interface MilitaryUser {
  id: string;
  username: string; // Login único (ex: dev, dasdeves, cavalcanti, castro, arantes, machado, oliveira, vecchiato, tvinfo)
  password: string; // Senha do militar
  name: string; // Posto/Graduação e Nome (ex: 3º Sgt Das Deves, Sd Castro)
  rank: string; // Posto/Graduação (ex: 3º Sgt, Sd, Dev)
  warName: string; // Nome de Guerra (ex: Das Deves, Castro, Arantes)
  role: UserRole;
  active: boolean;
  deactivationReason?: string; // Motivo do desligamento/afastamento
  deactivatedAt?: string; // Data do desligamento
  email?: string;
  specialty?: string;
  createdAt: string;
  failedAttempts?: number; // Contador de tentativas erradas (bloqueia com 3)
  isLocked?: boolean; // Se o login está bloqueado por erro de senha
  lockedAt?: string; // Data do bloqueio de segurança
}

export interface SystemAuditLog {
  id: string;
  timestamp: string; // ISO
  militaryName: string; // Ex: "3º Sgt Das Deves"
  militaryLogin: string; // Ex: "dasdeves"
  role: UserRole;
  actionType: 
    | 'PRORROGACAO_CAUTELA'
    | 'DEVOLUCAO_CAUTELA'
    | 'NOVA_CAUTELA'
    | 'EXCLUSAO_CAUTELA'
    | 'MENSAGEM_CAUTELA'
    | 'STATUS_CHAMADO'
    | 'PRIORIDADE_CHAMADO'
    | 'EDITAR_TITULO_CHAMADO'
    | 'ATRIBUIR_TECNICO'
    | 'EXCLUSAO_CHAMADO'
    | 'INTERVENCAO_XERIFE'
    | 'MENSAGEM_CHAMADO'
    | 'DESPACHO_TECNICO'
    | 'USUARIO_CRIADO'
    | 'USUARIO_EDITADO'
    | 'USUARIO_SENHA_ALTERADA'
    | 'USUARIO_BLOQUEADO'
    | 'USUARIO_DESBLOQUEADO'
    | 'LOGIN_SUCESSO'
    | 'CRIACAO_MISSAO'
    | 'STATUS_MISSAO'
    | 'EDICAO_MISSAO'
    | 'DESPACHO_MISSAO'
    | 'EXCLUSAO_MISSAO'
    | 'MILITAR_DESATIVADO'
    | 'MILITAR_REATIVADO';
  summary: string;
  details?: string;
  targetRef?: string; // ex: "TICKET-1002" ou "DEODORO-NTB-014"
}

export type MissionPriority = 'urgente' | 'alta' | 'normal' | 'baixa';
export type MissionStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';

export interface MissionChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface MissionNote {
  id: string;
  author: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export type MissionArea = 'redes' | 'desenvolvimento' | 'hardware' | 'geral';

export interface Mission {
  id: string;
  code: string; // Ex: "MISSAO-101"
  title: string;
  description: string;
  priority: MissionPriority;
  status: MissionStatus;
  area?: MissionArea;
  assignedTechnicianIds: string[];
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  completedAt?: string;
  checklist?: MissionChecklistItem[];
  notes?: MissionNote[];
  isTopPriority?: boolean;
  priorityDesignatedBy?: string;
}

export interface LoanHistoryItem {
  id: string;
  date: string;
  author: string;
  action: 'criacao' | 'prorrogacao' | 'mensagem' | 'devolucao' | 'inspecao';
  summary: string;
  previousDate?: string;
  newDate?: string;
  justification?: string;
}

export interface LoanMessage {
  id: string;
  sender: 'militar' | 'ti';
  senderName: string;
  content: string;
  createdAt: string;
}

export interface NotebookLoan {
  id: string;
  notebookNumber: string; // Número de Patrimônio / Registro EB
  notebookName: string; // Modelo
  borrowerName: string; // Militar responsável pela cautela
  departmentId: string; // Seção cautelada
  loanDate: string; // Data da cautela
  expectedReturnDate: string; // Data prevista para devolução
  originalExpectedReturnDate?: string; // Data prevista inicial antes de prorrogações
  extensionCount?: number; // Quantidade de vezes prorrogado
  lastExtensionReason?: string; // Motivo da última prorrogação
  actualReturnDate?: string | null;
  status: 'cautelado' | 'devolvido';
  hasIssuesOnReturn?: boolean;
  returnIssues?: string[];
  returnNotes?: string;
  authorizedBy: string;
  returnedAuthorizedBy?: string;
  history?: LoanHistoryItem[];
  messages?: LoanMessage[];
}

export type AdminTab = 'it' | 'notebooks' | 'missions' | 'technicians';

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extralarge';
  highContrast: boolean;
}

export type AttendanceStatus = 
  | 'PRESENTE' 
  | 'FALTA' 
  | 'DISPENSA_MEDICA' 
  | 'MISSAO_EXTERNA' 
  | 'SERVICO_ESCALA' 
  | 'FERIAS_LUTO';

export interface AttendanceRosterItem {
  militaryId: string;
  militaryName: string;
  warName: string;
  rank: string;
  status: AttendanceStatus;
  reason?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  shift: string;
  supervisorName: string;
  supervisorRole: string;
  totalPresent: number;
  totalAbsent: number;
  totalStrength: number;
  notes?: string;
  roster: AttendanceRosterItem[];
  createdAt?: string;
}
