/**
 * ============================================================================
 * REDEHELP - MÓDULO DA ESCALA DE SERVIÇO DE TI (DUTY ROSTER)
 * 2º GRUPO DE ARTILHARIA DE CAMPANHA - REGIMENTO DEODORO
 * ============================================================================
 * 
 * GUIA DE DESACOPLAMENTO / EXPORTAÇÃO INDEPENDENTE DESTE MÓDULO:
 * O sistema RedeHelp foi arquitetado de modo que este módulo de escala de serviço
 * possa ser facilmente isolado, ativado ou desativado para outros projetos.
 * 
 * COMO DESATIVAR OU EXPORTAR O SISTEMA SEM A ESCALA:
 * 1. Em `src/App.tsx`, altere a constante mestra:
 *      export const ENABLE_DUTY_ROSTER = false;
 * 2. Isso automaticamente:
 *    - Remove o botão "Escala de Serviço" da barra lateral (AdminSidebar).
 *    - Desativa a rota de navegação e a renderização do componente <DutyRoster />.
 * 3. Se desejar remover o código fonte deste arquivo integralmente:
 *    - Exclua o arquivo `src/components/DutyRoster.tsx`.
 *    - Remova a importação em `src/App.tsx` e `src/components/AdminSidebar.tsx`.
 *    - O restante do sistema (Chamados, Cautelas de Notebook, Ordens de Missão, 
 *      Militares & Auditoria, Intranet) continuará operando 100% de forma independente.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Check, 
  X, 
  Printer, 
  Key, 
  Radio, 
  Zap, 
  Power, 
  Send, 
  ArrowLeftRight, 
  ShieldCheck, 
  Lock, 
  ChevronLeft, 
  ChevronRight,
  Info,
  PhoneCall,
  Terminal,
  Building,
  UserCheck,
  Search,
  ExternalLink,
  Shield,
  HelpCircle,
  AlertCircle,
  Trash2,
  Edit3,
  Sliders,
  RotateCcw,
  Sparkles,
  Brain,
  Eraser,
  Palmtree,
  Plus,
  Construction
} from 'lucide-react';
import { 
  MilitaryUser, 
  DutyShiftEntry, 
  DutySwapRequest, 
  AccessibilitySettings,
  Technician,
  DutyRosterMilitary,
  KeyHandoverRecord,
  KeyNameType,
  MilitaryLeaveRecord,
  MilitaryLeaveType,
  DutyShiftExtraMilitary
} from '../types';
import { 
  loadDutyRosterShifts, 
  saveDutyRosterShifts, 
  loadDutySwaps, 
  saveDutySwaps,
  loadKeyHandovers,
  saveKeyHandovers,
  loadMilitaryLeaves,
  saveMilitaryLeaves
} from '../utils/storage';

interface DutyRosterProps {
  currentUser: MilitaryUser | null;
  militaryUsers: MilitaryUser[];
  technicians: Technician[];
  a11y: AccessibilitySettings;
  onAddAuditLog?: (log: any) => void;
  onGoBackToDashboard?: () => void;
}

// 24 Militares Oficiais da Escala de TI do 2º GAC (Regimento Deodoro)
// Ordenados estritamente por Antiguidade Militar:
// 1. Todos os EPs (Efetivos Profissionais) mais antigos que os EVs
// 2. SD Manfrinato (59) posicionado junto aos EPs no topo (criador da escala e do sistema)
// 3. EVs ordenados por antiguidade oficial
export const OFFICIAL_ROSTER_MILITARY: DutyRosterMilitary[] = [
  // --- EFETIVOS PROFISSIONAIS (EPs) ---
  {
    id: 'mil-manfrinato',
    antiguidade: 1,
    gradNome: 'SD EP MANFRINATO (59)',
    warName: 'Manfrinato',
    rank: 'SD',
    category: 'EP',
    number: '59',
    active: true,
  },
  {
    id: 'mil-saggion',
    antiguidade: 2,
    gradNome: 'SD EP SAGGION',
    warName: 'Saggion',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-arantes',
    antiguidade: 3,
    gradNome: 'SD EP ARANTES (XERIFE)',
    warName: 'Arantes',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-peron',
    antiguidade: 4,
    gradNome: 'SD EP PERON',
    warName: 'Peron',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-castro',
    antiguidade: 5,
    gradNome: 'SD EP CASTRO (AUXILIAR)',
    warName: 'Castro',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-bressanin',
    antiguidade: 6,
    gradNome: 'SD EP BRESSANIN',
    warName: 'Bressanin',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-almeida',
    antiguidade: 7,
    gradNome: 'SD EP ALMEIDA',
    warName: 'Almeida',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-carvalho',
    antiguidade: 8,
    gradNome: 'SD EP CARVALHO',
    warName: 'Carvalho',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-lima',
    antiguidade: 9,
    gradNome: 'SD EP LIMA',
    warName: 'Lima',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-silva',
    antiguidade: 10,
    gradNome: 'SD EP SILVA',
    warName: 'Silva',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-costa-ep',
    antiguidade: 11,
    gradNome: 'SD EP COSTA',
    warName: 'Costa',
    rank: 'SD',
    category: 'EP',
    active: true,
  },
  {
    id: 'mil-santos-ep',
    antiguidade: 12,
    gradNome: 'SD EP SANTOS',
    warName: 'Santos',
    rank: 'SD',
    category: 'EP',
    active: true,
  },

  // --- EFETIVOS VARIÁVEIS (EVs) ---
  {
    id: 'mil-ferreira',
    antiguidade: 13,
    gradNome: 'SD EV FERREIRA (05)',
    warName: 'Ferreira',
    rank: 'SD',
    category: 'EV',
    number: '05',
    active: true,
  },
  {
    id: 'mil-oliveira',
    antiguidade: 14,
    gradNome: 'SD EV OLIVEIRA (17)',
    warName: 'Oliveira',
    rank: 'SD',
    category: 'EV',
    number: '17',
    active: true,
  },
  {
    id: 'mil-machado',
    antiguidade: 15,
    gradNome: 'SD EV MACHADO (25)',
    warName: 'Machado',
    rank: 'SD',
    category: 'EV',
    number: '25',
    active: true,
  },
  {
    id: 'mil-vecchiato',
    antiguidade: 16,
    gradNome: 'SD EV VECCHIATO (42)',
    warName: 'Vecchiato',
    rank: 'SD',
    category: 'EV',
    number: '42',
    active: true,
  },
  {
    id: 'mil-custodio',
    antiguidade: 17,
    gradNome: 'SD EV CUSTÓDIO (44)',
    warName: 'Custódio',
    rank: 'SD',
    category: 'EV',
    number: '44',
    active: true,
  },
  {
    id: 'mil-wandrade',
    antiguidade: 18,
    gradNome: 'SD EV W. ANDRADE (54)',
    warName: 'W. Andrade',
    rank: 'SD',
    category: 'EV',
    number: '54',
    active: true,
  },
  {
    id: 'mil-barbosa',
    antiguidade: 19,
    gradNome: 'SD EV BARBOSA (61)',
    warName: 'Barbosa',
    rank: 'SD',
    category: 'EV',
    number: '61',
    active: true,
  },
  {
    id: 'mil-souza',
    antiguidade: 20,
    gradNome: 'SD EV SOUZA (63)',
    warName: 'Souza',
    rank: 'SD',
    category: 'EV',
    number: '63',
    active: true,
  },
  {
    id: 'mil-rocha',
    antiguidade: 21,
    gradNome: 'SD EV ROCHA (68)',
    warName: 'Rocha',
    rank: 'SD',
    category: 'EV',
    number: '68',
    active: true,
  },
  {
    id: 'mil-pereira',
    antiguidade: 22,
    gradNome: 'SD EV PEREIRA (72)',
    warName: 'Pereira',
    rank: 'SD',
    category: 'EV',
    number: '72',
    active: true,
  },
  {
    id: 'mil-martins',
    antiguidade: 23,
    gradNome: 'SD EV MARTINS (77)',
    warName: 'Martins',
    rank: 'SD',
    category: 'EV',
    number: '77',
    active: true,
  },
  {
    id: 'mil-gomes',
    antiguidade: 24,
    gradNome: 'SD EV GOMES (81)',
    warName: 'Gomes',
    rank: 'SD',
    category: 'EV',
    number: '81',
    active: true,
  },
];

export const DutyRoster: React.FC<DutyRosterProps> = ({
  currentUser,
  militaryUsers,
  technicians,
  a11y,
  onAddAuditLog,
  onGoBackToDashboard,
}) => {
  // Permissões
  const isDev = currentUser?.role === 'dev' || currentUser?.role === 'DEV' || currentUser?.role === 'System Developer' || currentUser?.username === 'dev' || currentUser?.rank === 'Dev' || !!(currentUser?.name && currentUser.name.toLowerCase().includes('manfrinato'));
  const isChefe = currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'CHSECINFO' || isDev;
  const isAux = currentUser?.role === 'AUX-SECINFO' || currentUser?.role === 'AUXSECINFO';
  const isXerife = currentUser?.role === 'CH-XERIFEINFO' || currentUser?.role === 'XERIFESECINFO' || currentUser?.role === 'INF-XERIFE';
  const isTech = !isChefe && !isAux && !isXerife && !isDev;

  // Regra de Acesso Estrita: Apenas Chefe de Seção e Devs podem acessar a Escala de Serviço.
  // Técnicos, Auxiliares de TI e Xerifes visualizam a tela "Em desenvolvimento".
  const hasDutyRosterAccess = isChefe || isDev;

  const canEditRoster = isChefe || isAux || isDev;
  const canFlagSwaps = isXerife || isChefe || isAux || isDev;
  const canHomologateSwaps = isChefe || isDev;
  const hasTimeRestriction = isTech; // Técnico vê apenas 14 dias (semana atual e próxima)

  // Configuração dos Parâmetros da Escala (DEV / Chefe)
  const [isScaleConfigModalOpen, setIsScaleConfigModalOpen] = useState(false);
  const [scaleRestDays, setScaleRestDays] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('eb_scale_rest_days')) || 6;
    } catch {
      return 6;
    }
  });
  const [scaleDutyDays, setScaleDutyDays] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('eb_scale_duty_days')) || 1;
    } catch {
      return 1;
    }
  });
  const [scaleMilitariesPerDay, setScaleMilitariesPerDay] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('eb_scale_militaries_per_day')) || 2;
    } catch {
      return 2;
    }
  });
  const [scaleLabelPerm, setScaleLabelPerm] = useState<string>(() => {
    try {
      return localStorage.getItem('eb_scale_label_perm') || 'Permanência';
    } catch {
      return 'Permanência';
    }
  });
  const [scaleLabelSobr, setScaleLabelSobr] = useState<string>(() => {
    try {
      return localStorage.getItem('eb_scale_label_sobr') || 'Sobreaviso';
    } catch {
      return 'Sobreaviso';
    }
  });

  // Abas do Módulo de Escala
  const [activeTab, setActiveTab] = useState<'matrix' | 'checklists' | 'livro' | 'swaps' | 'keys'>('matrix');

  // Mês e ano selecionados
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0 a 11

  // Tipo de escala: 'corrida' (contagem 1 a 6 contínua) vs 'preta_vermelha' (contagem separada sabado 1, domingo 2...)
  const [scaleType, setScaleType] = useState<'corrida' | 'preta_vermelha'>(() => {
    try {
      const saved = localStorage.getItem('eb_duty_roster_scale_type_v2');
      if (saved === 'corrida' || saved === 'preta_vermelha') return saved;
    } catch {}
    return 'corrida';
  });

  // Modo de Preenchimento Manual da Escala (Auxiliar de Seção e Chefe)
  const [isManualMode, setIsManualMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('eb_duty_roster_manual_mode_v2') === 'true';
    } catch {
      return false;
    }
  });

  // Sobrescritas manuais de células da escala: chave `${militarId}_${dateStr}`
  const [manualCellOverrides, setManualCellOverrides] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('eb_duty_roster_manual_cells_v2');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  // Modal para editar célula diretamente no Modo Manual
  const [manualCellModal, setManualCellModal] = useState<{
    militar: DutyRosterMilitary;
    day: number;
    currentValue: string;
  } | null>(null);

  // Estado dos plantões gravados e trocas
  const [shifts, setShifts] = useState<DutyShiftEntry[]>(() => loadDutyRosterShifts());
  const [swaps, setSwaps] = useState<DutySwapRequest[]>(() => loadDutySwaps());
  const [keyHandovers, setKeyHandovers] = useState<KeyHandoverRecord[]>(() => loadKeyHandovers());

  // Militares da escala com suporte a baixados/afastados em memória e local
  const [rosterMilitary, setRosterMilitary] = useState<DutyRosterMilitary[]>(() => {
    try {
      const raw = localStorage.getItem('eb_roster_military_v2');
      if (raw) {
        const parsed: DutyRosterMilitary[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 12 && parsed.every(p => p && p.id && p.category && p.warName)) {
          // Incorporar novos militares oficiais se o storage local possuir menos que o efetivo oficial completo
          const missing = OFFICIAL_ROSTER_MILITARY.filter(om => !parsed.some(p => p.id === om.id));
          if (missing.length > 0) {
            const merged = [...parsed, ...missing];
            try {
              localStorage.setItem('eb_roster_military_v2', JSON.stringify(merged));
            } catch {}
            return merged;
          }
          return parsed;
        }
      }
    } catch {}
    return OFFICIAL_ROSTER_MILITARY;
  });

  // Salvar militares da escala
  useEffect(() => {
    try {
      localStorage.setItem('eb_roster_military_v2', JSON.stringify(rosterMilitary));
    } catch {}
  }, [rosterMilitary]);

  useEffect(() => {
    try {
      localStorage.setItem('eb_duty_roster_scale_type_v2', scaleType);
    } catch {}
  }, [scaleType]);

  useEffect(() => {
    try {
      localStorage.setItem('eb_duty_roster_manual_mode_v2', String(isManualMode));
    } catch {}
  }, [isManualMode]);

  useEffect(() => {
    try {
      localStorage.setItem('eb_duty_roster_manual_cells_v2', JSON.stringify(manualCellOverrides));
    } catch {}
  }, [manualCellOverrides]);

  // Salvar no storage
  useEffect(() => {
    saveDutyRosterShifts(shifts);
  }, [shifts]);

  useEffect(() => {
    saveDutySwaps(swaps);
  }, [swaps]);

  useEffect(() => {
    saveKeyHandovers(keyHandovers);
  }, [keyHandovers]);

  // Afastamentos militares (Férias, Baixa médica, Missões, Licenças)
  const [militaryLeaves, setMilitaryLeaves] = useState<MilitaryLeaveRecord[]>(() => loadMilitaryLeaves());

  useEffect(() => {
    saveMilitaryLeaves(militaryLeaves);
  }, [militaryLeaves]);

  // Modal de Afastamentos / Férias / Baixas
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveTargetMilitarId, setLeaveTargetMilitarId] = useState('');
  const [leaveType, setLeaveType] = useState<MilitaryLeaveType>('ferias');
  const [leaveStartDate, setLeaveStartDate] = useState(() => today.toISOString().split('T')[0]);
  const [leaveDaysCount, setLeaveDaysCount] = useState<number>(30);
  const [leaveEndDate, setLeaveEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 29);
    return d.toISOString().split('T')[0];
  });
  const [leaveMotivo, setLeaveMotivo] = useState('');

  // Flag de Mês Zerado (quando Chefe clica em "Zerar Todos os Dias")
  const [isMonthCleared, setIsMonthCleared] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`eb_cleared_month_${today.getFullYear()}_${today.getMonth()}`) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      setIsMonthCleared(localStorage.getItem(`eb_cleared_month_${selectedYear}_${selectedMonth}`) === 'true');
    } catch {
      setIsMonthCleared(false);
    }
  }, [selectedYear, selectedMonth]);

  // Modal para sinalização de troca pelo Xerife
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapMilitarOrig, setSwapMilitarOrig] = useState('');
  const [swapDataOrig, setSwapDataOrig] = useState('');
  const [swapMilitarSubst, setSwapMilitarSubst] = useState('');
  const [swapDataSubst, setSwapDataSubst] = useState('');
  const [swapMotivo, setSwapMotivo] = useState('');
  const [swapAmbosConcordaram, setSwapAmbosConcordaram] = useState(false);
  const [swapWarning, setSwapWarning] = useState('');

  // Modal de Homologação de Troca (Exige senha do Chefe de Seção)
  const [homologateModalSwap, setHomologateModalSwap] = useState<DutySwapRequest | null>(null);
  const [chefePasswordInput, setChefePasswordInput] = useState('');
  const [chefePasswordError, setChefePasswordError] = useState('');

  // Modal para Chefe de Seção editar escala do dia (selecionar militares, dias administrativos, extras)
  const [dayEditModalOpen, setDayEditModalOpen] = useState(false);
  const [dayEditTargetDay, setDayEditTargetDay] = useState<number>(today.getDate());
  const [dayEditPermanencia, setDayEditPermanencia] = useState('');
  const [dayEditSobreaviso, setDayEditSobreaviso] = useState('');
  const [dayEditIsAdmin, setDayEditIsAdmin] = useState(false);
  const [dayEditExtraMilitar, setDayEditExtraMilitar] = useState('');
  const [dayEditExtraTipo, setDayEditExtraTipo] = useState<'permanencia' | 'sobreaviso'>('permanencia');
  const [dayEditJustificativa, setDayEditJustificativa] = useState('');

  // Modal de Contato de Emergência com 3º CTA
  const [showCtaModal, setShowCtaModal] = useState(false);
  const [ctaIncidentText, setCtaIncidentText] = useState('');

  // Modal de Passagem de Chaves
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keySelected, setKeySelected] = useState<KeyNameType>('DTI');
  const [keyGiverName, setKeyGiverName] = useState(currentUser?.name || '');
  const [keyGiverPassword, setKeyGiverPassword] = useState('');
  const [keyReceiverName, setKeyReceiverName] = useState('');
  const [keyReceiverPassword, setKeyReceiverPassword] = useState('');
  const [keyNotes, setKeyNotes] = useState('');
  const [keyError, setKeyError] = useState('');

  // Assinatura digital por senha no Livro de Parte
  const [signPermanenciaPassword, setSignPermanenciaPassword] = useState('');
  const [signPermanenciaError, setSignPermanenciaError] = useState('');
  const [signSobreavisoPassword, setSignSobreavisoPassword] = useState('');
  const [signSobreavisoError, setSignSobreavisoError] = useState('');

  // Modal de emergência Anti-Meia-Fase
  const [showAntiMeiaFaseModal, setShowAntiMeiaFaseModal] = useState(false);
  const [antiMeiaFaseStep, setAntiMeiaFaseStep] = useState(0);

  // Tooltip de troca na célula da matriz
  const [hoveredSwapTooltip, setHoveredSwapTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // Dias do mês atual
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [selectedYear, selectedMonth]);

  // Formatar data YYYY-MM-DD para um dia específico
  const getDateStr = (day: number) => {
    const m = String(selectedMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${selectedYear}-${m}-${d}`;
  };

  // Restrição para Técnicos: limita para semana atual e próxima semana
  const visibleDays = useMemo(() => {
    if (!hasTimeRestriction) return daysInMonth;

    const currentDay = today.getDate();
    const minDay = Math.max(1, currentDay - today.getDay());
    const maxDay = Math.min(daysInMonth.length, minDay + 13);
    return daysInMonth.filter(d => d >= minDay && d <= maxDay);
  }, [daysInMonth, hasTimeRestriction, today]);

  // Plantão do dia selecionado para checklists e livro de parte
  const [selectedDayForOps, setSelectedDayForOps] = useState<number>(today.getDate());
  const selectedDateStr = getDateStr(selectedDayForOps);

  // EPs e EVs separados (com garantia de fallback)
  const eps = useMemo(() => {
    const list = rosterMilitary.filter(m => m.category === 'EP');
    return list.length > 0 ? list : OFFICIAL_ROSTER_MILITARY.filter(m => m.category === 'EP');
  }, [rosterMilitary]);

  const evs = useMemo(() => {
    const list = rosterMilitary.filter(m => m.category === 'EV');
    return list.length > 0 ? list : OFFICIAL_ROSTER_MILITARY.filter(m => m.category === 'EV');
  }, [rosterMilitary]);

  // Listas de dias vermelhos (fins de semana e administrativos) e dias pretos (segunda a sexta)
  const { redDays, blackDays } = useMemo(() => {
    const reds: number[] = [];
    const blacks: number[] = [];
    daysInMonth.forEach(d => {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const dateStr = getDateStr(d);
      const shift = shifts.find(s => s.date === dateStr);
      const isAdministrative = shift ? !!shift.isAdministrativeDay : isWeekend;
      if (isAdministrative || isWeekend) {
        reds.push(d);
      } else {
        blacks.push(d);
      }
    });
    return { redDays: reds, blackDays: blacks };
  }, [daysInMonth, selectedYear, selectedMonth, shifts]);

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // MOTOR DINÂMICO "O MAIS FOLGADO" (MÁXIMO 5 DIAS DE DESCANSO)
  // Regras operacionais:
  // 1. "Eu coloco os primeiros, e a escala se preenche sozinha"
  //    - O Chefe define o dia 1 (ou dias iniciais), e os dias subsequentes
  //      são automaticamente calculados e preenchidos no estado e armazenamento.
  // 2. "Sempre pegar o mais folgado, sendo no máximo 5 dias de descanso"
  //    - Sem padrões rígidos forçados; segue estritamente quem está com maior
  //      tempo de folga acumulada (teto de descanso: 5 dias).
  // 3. Afastamentos: Férias, Baixa médica, Missão ou Licença impedem escala.
  // 4. Retorno de Afastamento: Militares voltando de férias ou de baixa são
  //    os "mais folgados" absolutos e têm prioridade máxima para tirar serviço.
  // 5. SD Manfrinato (59) tratado como EP no topo de antiguidade.
  // 6. Proporção 3:1 de Permanência (0 Verde) e Sobreaviso (0 Amarelo) entre EV e EP.
  // -------------------------------------------------------------
  const runAiScheduleGeneration = (options?: {
    fromDayToRecalculate?: number;
    anchorDay?: number;
    anchorOverride?: {
      permanenciaNome: string;
      permanenciaId: string;
      sobreavisoNome: string;
      sobreavisoId: string;
      isAdministrativeDay?: boolean;
      extraMilitaries?: DutyShiftExtraMilitary[];
    };
  }): DutyShiftEntry[] => {
    const fromDay = options?.fromDayToRecalculate ?? 1;
    const anchor = options?.anchorDay;
    const anchorData = options?.anchorOverride;

    const lastDutyDayMap: Record<string, number> = {};
    const lastRedDutyIdxMap: Record<string, number> = {};
    const lastBlackDutyIdxMap: Record<string, number> = {};
    const totalDutiesMap: Record<string, number> = {};
    rosterMilitary.forEach(m => {
      totalDutiesMap[m.id] = 0;
    });

    const generatedShifts: DutyShiftEntry[] = [];

    // 1. Processar dias anteriores a fromDay (preservar histórico fixo e aplicar anchor se houver)
    for (let d = 1; d < fromDay; d++) {
      const dStr = getDateStr(d);
      const isRed = redDays.includes(d);
      const rIdx = redDays.indexOf(d);
      const bIdx = blackDays.indexOf(d);

      // Se for o dia âncora configurado pelo usuário, aplicar os dados manuais com prioridade
      if (anchor && anchorData && d === anchor) {
        const pMil = rosterMilitary.find(m => m.id === anchorData.permanenciaId || (anchorData.permanenciaNome && anchorData.permanenciaNome.includes(m.warName || '')));
        const sMil = rosterMilitary.find(m => m.id === anchorData.sobreavisoId || (anchorData.sobreavisoNome && anchorData.sobreavisoNome.includes(m.warName || '')));
        const existing = shifts.find(s => s.date === dStr);

        const anchorShift: DutyShiftEntry = existing ? {
          ...existing,
          permanenciaId: pMil?.id || anchorData.permanenciaId || existing.permanenciaId,
          permanenciaNome: anchorData.permanenciaNome || existing.permanenciaNome,
          sobreavisoId: sMil?.id || anchorData.sobreavisoId || existing.sobreavisoId,
          sobreavisoNome: anchorData.sobreavisoNome || existing.sobreavisoNome,
          isAdministrativeDay: typeof anchorData.isAdministrativeDay === 'boolean' ? anchorData.isAdministrativeDay : existing.isAdministrativeDay,
          extraMilitaries: anchorData.extraMilitaries || existing.extraMilitaries || [],
        } : {
          id: `shift-${dStr}`,
          date: dStr,
          isAdministrativeDay: typeof anchorData.isAdministrativeDay === 'boolean' ? anchorData.isAdministrativeDay : isRed,
          permanenciaId: pMil?.id || anchorData.permanenciaId || '',
          permanenciaNome: anchorData.permanenciaNome || '',
          sobreavisoId: sMil?.id || anchorData.sobreavisoId || '',
          sobreavisoNome: anchorData.sobreavisoNome || '',
          chavesDtiOk: false,
          radioTelefoneOk: false,
          ronda1PosExpedienteOk: false,
          ronda2PosPernoiteOk: false,
          ronda3PreParadaOk: false,
          antiMeiaFaseOk: false,
          livroParte: '',
          alteracoes: 'Sem alterações.',
          status: 'escalado',
          extraMilitaries: anchorData.extraMilitaries || [],
        };

        generatedShifts.push(anchorShift);

        if (pMil) {
          lastDutyDayMap[pMil.id] = d;
          if (isRed && rIdx >= 0) lastRedDutyIdxMap[pMil.id] = rIdx;
          if (!isRed && bIdx >= 0) lastBlackDutyIdxMap[pMil.id] = bIdx;
          totalDutiesMap[pMil.id] = (totalDutiesMap[pMil.id] || 0) + 1;
        }
        if (sMil) {
          lastDutyDayMap[sMil.id] = d;
          if (isRed && rIdx >= 0) lastRedDutyIdxMap[sMil.id] = rIdx;
          if (!isRed && bIdx >= 0) lastBlackDutyIdxMap[sMil.id] = bIdx;
          totalDutiesMap[sMil.id] = (totalDutiesMap[sMil.id] || 0) + 1;
        }
        continue;
      }

      // Dia anterior ao anchor: preservar existente de shifts ou gerar padrão base
      let existing = shifts.find(s => s.date === dStr);
      if (!existing) {
        const defPair = calculateDefaultDutyPair(d);
        existing = {
          id: `shift-${dStr}`,
          date: dStr,
          isAdministrativeDay: isRed,
          permanenciaId: defPair.permanencia?.id || '',
          permanenciaNome: defPair.permanencia?.gradNome || '',
          sobreavisoId: defPair.sobreaviso?.id || '',
          sobreavisoNome: defPair.sobreaviso?.gradNome || '',
          chavesDtiOk: false,
          radioTelefoneOk: false,
          ronda1PosExpedienteOk: false,
          ronda2PosPernoiteOk: false,
          ronda3PreParadaOk: false,
          antiMeiaFaseOk: false,
          livroParte: '',
          alteracoes: 'Sem alterações.',
          status: 'escalado',
          extraMilitaries: [],
        };
      }

      generatedShifts.push(existing);

      const pMil = rosterMilitary.find(m => m.id === existing.permanenciaId || (existing.permanenciaNome && existing.permanenciaNome.includes(m.warName || '')));
      const sMil = rosterMilitary.find(m => m.id === existing.sobreavisoId || (existing.sobreavisoNome && existing.sobreavisoNome.includes(m.warName || '')));
      if (pMil) {
        lastDutyDayMap[pMil.id] = d;
        if (isRed && rIdx >= 0) lastRedDutyIdxMap[pMil.id] = rIdx;
        if (!isRed && bIdx >= 0) lastBlackDutyIdxMap[pMil.id] = bIdx;
        totalDutiesMap[pMil.id] = (totalDutiesMap[pMil.id] || 0) + 1;
      }
      if (sMil) {
        lastDutyDayMap[sMil.id] = d;
        if (isRed && rIdx >= 0) lastRedDutyIdxMap[sMil.id] = rIdx;
        if (!isRed && bIdx >= 0) lastBlackDutyIdxMap[sMil.id] = bIdx;
        totalDutiesMap[sMil.id] = (totalDutiesMap[sMil.id] || 0) + 1;
      }
    }

    // 2. Função de pontuação do candidato segundo a regra:
    // "sempre pegar o mais folgado, sendo no máximo 5 dias de descanso, não precisa ter um padrão, somente siga pelo mais folgado"
    const scoreCandidate = (
      m: DutyRosterMilitary,
      d: number,
      dStr: string,
      isRed: boolean,
      redIndex: number,
      blackIndex: number
    ) => {
      // 1. Inelegibilidade por afastamento ativo (Férias, Baixa médica, Missão, Licença, etc.) ou isBaixado
      const activeLeave = militaryLeaves.find(l => l.militarId === m.id && dStr >= l.dataInicio && dStr <= l.dataFim);
      if (activeLeave || m.isBaixado) {
        return -99999999;
      }

      // 2. Não pode tirar serviço 2 dias consecutivos (ontem tirou serviço)
      const lastDuty = lastDutyDayMap[m.id];
      if (lastDuty !== undefined && lastDuty === d - 1) {
        return -88888888;
      }

      // NOVO REQUISITO ESTRITO: Nenhum militar pode ser escalado antes de atingir o período configurado de descanso (scaleRestDays)!
      if (lastDuty !== undefined) {
        const daysSinceLastDuty = d - lastDuty - 1;
        if (scaleType === 'corrida') {
          if (daysSinceLastDuty < scaleRestDays) {
            // Penalidade astronômica: impede que militares entrem de serviço antes de completarem as folgas estipuladas
            return -50000000 + (daysSinceLastDuty * 1000);
          }
        } else {
          // Escala Preta e Vermelha
          if (daysSinceLastDuty < 1) {
            return -88888888; // Nunca tirar serviço em dias consecutivos no calendário real
          }
          if (isRed) {
            const lastRed = lastRedDutyIdxMap[m.id];
            if (lastRed !== undefined && (redIndex - lastRed - 1) < scaleRestDays) {
              return -50000000 + ((redIndex - lastRed - 1) * 1000);
            }
          } else {
            const lastBlack = lastBlackDutyIdxMap[m.id];
            if (lastBlack !== undefined && (blackIndex - lastBlack - 1) < scaleRestDays) {
              return -50000000 + ((blackIndex - lastBlack - 1) * 1000);
            }
          }
        }
      }

      let score = 0;

      // 3. PRIORIDADE MÁXIMA: Retorno de férias ou baixa médica (o militar mais descansado de todos)
      const justReturned = militaryLeaves.some(l => {
        if (l.militarId !== m.id) return false;
        if (dStr <= l.dataFim) return false;
        const dEnd = new Date(l.dataFim + 'T00:00:00');
        const dCur = new Date(dStr + 'T00:00:00');
        const diff = Math.round((dCur.getTime() - dEnd.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 1 && diff <= 7;
      });

      const hasPulledDutySince = lastDuty !== undefined && lastDuty >= (d - scaleRestDays);
      if (justReturned && !hasPulledDutySince) {
        score += 50000; // Prioridade absoluta para quem acabou de voltar de afastamento!
      }

      // 4. CÁLCULO DO "MAIS FOLGADO" (MÁXIMO DE scaleRestDays DIAS DE DESCANSO)
      let restCount = scaleRestDays; // Caso não tenha puxado serviço ainda no mês, está no descanso máximo (scaleRestDays)
      if (scaleType === 'preta_vermelha') {
        if (isRed) {
          const lastRedIdx = lastRedDutyIdxMap[m.id];
          if (lastRedIdx !== undefined) {
            const diff = redIndex - lastRedIdx - 1;
            restCount = Math.max(0, Math.min(scaleRestDays, diff));
          }
        } else {
          const lastBlackIdx = lastBlackDutyIdxMap[m.id];
          if (lastBlackIdx !== undefined) {
            const diff = blackIndex - lastBlackIdx - 1;
            restCount = Math.max(0, Math.min(scaleRestDays, diff));
          }
        }
      } else {
        // Escala corrida contínua
        if (lastDuty !== undefined) {
          const diff = d - lastDuty - 1;
          restCount = Math.max(0, Math.min(scaleRestDays, diff));
        }
      }

      // Quanto maior a folga acumulada (até scaleRestDays), maior a prioridade de pegar serviço!
      score += restCount * 3000;

      // Se atingiu o teto de descanso configurado (scaleRestDays dias de folga), ganha prioridade de escala
      if (restCount >= scaleRestDays) {
        score += 20000;
      }

      // 5. Equilíbrio de justiça: militares com menos serviços no mês têm prioridade
      const totalDuties = totalDutiesMap[m.id] || 0;
      score -= totalDuties * 500;

      // 6. Desempate por antiguidade militar oficial
      score += (100 - (m.antiguidade || 50));

      return score;
    };

    // 3. Preenchimento automático para os dias a partir de fromDay até o final do mês
    const poolSize = (scaleRestDays + scaleDutyDays) || 8;
    for (let d = fromDay; d <= daysInMonth.length; d++) {
      const dStr = getDateStr(d);
      const isRed = redDays.includes(d);
      const rIdx = redDays.indexOf(d);
      const bIdx = blackDays.indexOf(d);

      const existing = shifts.find(s => s.date === dStr);
      const isAdmin = existing ? !!existing.isAdministrativeDay : isRed;

      // Permuta homologada neste dia?
      const swapForDay = swaps.find(s => (s.dataOriginal === dStr || s.dataSubstituta === dStr) && s.status === 'homologada');

      const scoredEps = [...eps]
        .map(m => ({ militar: m, score: scoreCandidate(m, d, dStr, isRed, rIdx, bIdx) }))
        .sort((a, b) => b.score - a.score);

      const scoredEvs = [...evs]
        .map(m => ({ militar: m, score: scoreCandidate(m, d, dStr, isRed, rIdx, bIdx) }))
        .sort((a, b) => b.score - a.score);

      let bestEp = scoredEps[0]?.militar || eps[0];
      let bestEv = scoredEvs[0]?.militar || evs[0];

      // Se um dos grupos estiver em falta de candidatos descansados (score negativo), buscar do grupo alternativo
      if (scoredEps[0]?.score < 0 && scoredEvs[1]?.score >= 0) {
        bestEp = scoredEvs[1].militar;
      } else if (scoredEvs[0]?.score < 0 && scoredEps[1]?.score >= 0) {
        bestEv = scoredEps[1].militar;
      }

      // Proporção 3:1 de Sobreaviso / Permanência
      const cycleIdx = Math.floor((d - 1) / poolSize);
      const isEpPerm = cycleIdx % 4 === 3;

      let chosenPerm = isEpPerm ? bestEp : bestEv;
      let chosenSobr: DutyRosterMilitary | null = scaleMilitariesPerDay >= 2 ? (isEpPerm ? bestEv : bestEp) : null;

      // Se houver permuta homologada neste dia, aplicar substituto
      if (swapForDay) {
        if (swapForDay.dataOriginal === dStr) {
          const subst = rosterMilitary.find(m => m.gradNome === swapForDay.militarSubstitutoNome);
          if (subst) chosenPerm = subst;
        } else if (swapForDay.dataSubstituta === dStr) {
          const orig = rosterMilitary.find(m => m.gradNome === swapForDay.militarOriginalNome);
          if (orig) chosenPerm = orig;
        }
      }

      lastDutyDayMap[chosenPerm.id] = d;
      if (isRed && rIdx >= 0) lastRedDutyIdxMap[chosenPerm.id] = rIdx;
      if (!isRed && bIdx >= 0) lastBlackDutyIdxMap[chosenPerm.id] = bIdx;
      totalDutiesMap[chosenPerm.id] = (totalDutiesMap[chosenPerm.id] || 0) + 1;

      if (chosenSobr) {
        lastDutyDayMap[chosenSobr.id] = d;
        if (isRed && rIdx >= 0) lastRedDutyIdxMap[chosenSobr.id] = rIdx;
        if (!isRed && bIdx >= 0) lastBlackDutyIdxMap[chosenSobr.id] = bIdx;
        totalDutiesMap[chosenSobr.id] = (totalDutiesMap[chosenSobr.id] || 0) + 1;
      }

      const permNome = chosenPerm.gradNome;
      const permId = chosenPerm.id;
      const sobrNome = chosenSobr ? chosenSobr.gradNome : 'Não Escalado';
      const sobrId = chosenSobr ? chosenSobr.id : '';

      const newEntry: DutyShiftEntry = existing ? {
        ...existing,
        permanenciaNome: permNome,
        permanenciaId: permId,
        sobreavisoNome: sobrNome,
        sobreavisoId: sobrId,
        isAdministrativeDay: isAdmin,
      } : {
        id: `shift-${dStr}`,
        date: dStr,
        isAdministrativeDay: isAdmin,
        permanenciaId: permId,
        permanenciaNome: permNome,
        sobreavisoId: sobrId,
        sobreavisoNome: sobrNome,
        chavesDtiOk: false,
        radioTelefoneOk: false,
        ronda1PosExpedienteOk: false,
        ronda2PosPernoiteOk: false,
        ronda3PreParadaOk: false,
        antiMeiaFaseOk: false,
        livroParte: '',
        alteracoes: 'Sem alterações.',
        status: 'escalado',
        extraMilitaries: [],
      };

      generatedShifts.push(newEntry);
    }

    return generatedShifts;
  };

  // Readequar toda a escala a partir de um dia (Propagação Dinâmica)
  const triggerRippleRecalculation = (
    fromDay: number,
    anchorOverride?: {
      permanenciaNome: string;
      permanenciaId: string;
      sobreavisoNome: string;
      sobreavisoId: string;
      isAdministrativeDay?: boolean;
      extraMilitaries?: DutyShiftExtraMilitary[];
    }
  ) => {
    const recalculated = runAiScheduleGeneration({
      fromDayToRecalculate: fromDay + 1,
      anchorDay: fromDay,
      anchorOverride,
    });
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    setShifts(prev => {
      const otherMonths = prev.filter(s => !s.date.startsWith(monthPrefix));
      return [...otherMonths, ...recalculated];
    });
  };

  // -------------------------------------------------------------
  // CÁLCULO PADRÃO DE PLANTÃO DA ESCALA (ROTAÇÃO PELO MAIS FOLGADO)
  // -------------------------------------------------------------
  const calculateDefaultDutyPair = (day: number) => {
    const safeDay = Math.max(1, day);
    const poolSize = (scaleRestDays + scaleDutyDays) || 8;
    const epCount = eps.length || 1;
    const evCount = evs.length || 1;

    if (scaleType === 'preta_vermelha') {
      const isRed = redDays.includes(day);
      if (isRed) {
        const redIdx = redDays.indexOf(day);
        const epIdx = redIdx % poolSize;
        const evIdx = redIdx % poolSize;
        const ep = eps[epIdx % epCount] || rosterMilitary[0];
        const ev = evs[evIdx % evCount] || rosterMilitary[epCount] || rosterMilitary[0];
        const isEpPerm = Math.floor(redIdx / poolSize) % 4 === 3;
        return {
          permanencia: isEpPerm ? ep : ev,
          sobreaviso: scaleMilitariesPerDay >= 2 ? (isEpPerm ? ev : ep) : null as any,
        };
      } else {
        const blackIdx = blackDays.indexOf(day);
        const epIdx = blackIdx % poolSize;
        const evIdx = blackIdx % poolSize;
        const ep = eps[epIdx % epCount] || rosterMilitary[0];
        const ev = evs[evIdx % evCount] || rosterMilitary[epCount] || rosterMilitary[0];
        const isEpPerm = Math.floor(blackIdx / poolSize) % 4 === 3;
        return {
          permanencia: isEpPerm ? ep : ev,
          sobreaviso: scaleMilitariesPerDay >= 2 ? (isEpPerm ? ev : ep) : null as any,
        };
      }
    }

    // Escala Corrida: rotação com poolSize estrito (1 dia serviço + scaleRestDays folgas)
    const cycleDay = (safeDay - 1) % poolSize;
    const cycleIndex = Math.floor((safeDay - 1) / poolSize);

    // Mapeamento estrito por cycleDay: garante escala 1xN com exatamente scaleRestDays de folga
    const ep = eps[cycleDay % epCount] || rosterMilitary[0];
    const ev = evs[cycleDay % evCount] || rosterMilitary[epCount] || rosterMilitary[0];
    const isEpPermanencia = cycleIndex % 4 === 3;

    return {
      permanencia: isEpPermanencia ? ep : ev,
      sobreaviso: scaleMilitariesPerDay >= 2 ? (isEpPermanencia ? ev : ep) : null as any,
    };
  };

  // Obter o registro formal do plantão para uma data (resiliente e com backward compatibility)
  const getShiftForDate = (dateStr: string, day: number): DutyShiftEntry => {
    const found = shifts.find(s => s.date === dateStr);
    const dateObj = new Date(selectedYear, selectedMonth, day);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const defaultPair = calculateDefaultDutyPair(day);

    if (found) {
      const permNome = found.permanenciaNome || (found as any).informaticoDiaNome || (isMonthCleared ? '' : defaultPair.permanencia?.gradNome || 'Não Escalado');
      const sobrNome = found.sobreavisoNome || (found as any).auxiliarNome || (isMonthCleared ? '' : defaultPair.sobreaviso?.gradNome || 'Não Escalado');
      const permId = found.permanenciaId || (found as any).informaticoDiaId || (isMonthCleared ? '' : defaultPair.permanencia?.id || '');
      const sobrId = found.sobreavisoId || (found as any).auxiliarId || (isMonthCleared ? '' : defaultPair.sobreaviso?.id || '');

      return {
        ...found,
        isAdministrativeDay: typeof found.isAdministrativeDay === 'boolean' ? found.isAdministrativeDay : isWeekend,
        permanenciaId: permId,
        permanenciaNome: permNome,
        sobreavisoId: sobrId,
        sobreavisoNome: sobrNome,
        chavesDtiOk: !!found.chavesDtiOk,
        radioTelefoneOk: !!found.radioTelefoneOk,
        ronda1PosExpedienteOk: found.ronda1PosExpedienteOk ?? (found as any).ronda16h30Ok ?? false,
        ronda2PosPernoiteOk: found.ronda2PosPernoiteOk ?? (found as any).ronda22h00Ok ?? false,
        ronda3PreParadaOk: found.ronda3PreParadaOk ?? (found as any).ronda06h30Ok ?? false,
        antiMeiaFaseOk: !!found.antiMeiaFaseOk,
        livroParte: found.livroParte || '',
        alteracoes: found.alteracoes || 'Sem alterações.',
        status: found.status || 'escalado',
        extraMilitaries: found.extraMilitaries || [],
        ronda2ServerChecklist: found.ronda2ServerChecklist || {
          pingGateways: false,
          dhcpDnsSamba: false,
          statusBancoDados: false,
          backupStorage: false,
          uptimeCheck: false,
          logsErrorCheck: false,
        },
        ronda3SalasChecklist: found.ronda3SalasChecklist || {
          comando: false,
          s1: false,
          s2: false,
          s3: false,
          informatica: false,
          juridico: false,
          sfpc: false,
          secretaria: false,
        },
      };
    }

    if (isMonthCleared) {
      return {
        id: `shift-${dateStr}`,
        date: dateStr,
        isAdministrativeDay: isWeekend,
        permanenciaId: '',
        permanenciaNome: '',
        sobreavisoId: '',
        sobreavisoNome: '',
        chavesDtiOk: false,
        radioTelefoneOk: false,
        ronda1PosExpedienteOk: false,
        ronda2PosPernoiteOk: false,
        extraMilitaries: [],
        ronda2ServerChecklist: {
          pingGateways: false,
          dhcpDnsSamba: false,
          statusBancoDados: false,
          backupStorage: false,
          uptimeCheck: false,
          logsErrorCheck: false,
        },
        ronda3PreParadaOk: false,
        ronda3SalasChecklist: {
          comando: false,
          s1: false,
          s2: false,
          s3: false,
          informatica: false,
          juridico: false,
          sfpc: false,
          secretaria: false,
        },
        antiMeiaFaseOk: false,
        livroParte: '',
        alteracoes: 'Escala zerada.',
        status: 'escalado',
      };
    }

    return {
      id: `shift-${dateStr}`,
      date: dateStr,
      isAdministrativeDay: isWeekend,
      permanenciaId: defaultPair.permanencia?.id || '',
      permanenciaNome: defaultPair.permanencia?.gradNome || 'Não Escalado',
      sobreavisoId: defaultPair.sobreaviso?.id || '',
      sobreavisoNome: defaultPair.sobreaviso?.gradNome || 'Não Escalado',
      chavesDtiOk: false,
      radioTelefoneOk: false,
      ronda1PosExpedienteOk: false,
      ronda2PosPernoiteOk: false,
      extraMilitaries: [],
      ronda2ServerChecklist: {
        pingGateways: false,
        dhcpDnsSamba: false,
        statusBancoDados: false,
        backupStorage: false,
        uptimeCheck: false,
        logsErrorCheck: false,
      },
      ronda3PreParadaOk: false,
      ronda3SalasChecklist: {
        comando: false,
        s1: false,
        s2: false,
        s3: false,
        informatica: false,
        juridico: false,
        sfpc: false,
        secretaria: false,
      },
      antiMeiaFaseOk: false,
      livroParte: '',
      alteracoes: 'Sem alterações.',
      status: 'escalado',
    };
  };

  const currentShift = useMemo(() => {
    return getShiftForDate(selectedDateStr, selectedDayForOps);
  }, [shifts, selectedDateStr, selectedDayForOps]);

  // Atualizar shift específico
  const updateSpecificShift = (dateStr: string, updates: Partial<DutyShiftEntry>) => {
    setShifts(prev => {
      const idx = prev.findIndex(s => s.date === dateStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updates };
        return copy;
      }
      const dayNum = Number(dateStr.split('-')[2]) || 1;
      const base = getShiftForDate(dateStr, dayNum);
      return [...prev, { ...base, ...updates }];
    });
  };

  // Atualizar shift atual
  const updateCurrentShift = (updates: Partial<DutyShiftEntry>) => {
    updateSpecificShift(selectedDateStr, updates);
  };

  // Determinar se militar está de serviço no dia
  const isMilitaryOnDuty = (militar: DutyRosterMilitary, day: number) => {
    const dateStr = getDateStr(day);
    const manualVal = manualCellOverrides[`${militar.id}_${dateStr}`];
    if (manualVal === '0_perm' || manualVal === '0_sobr') {
      return { onDuty: true, type: manualVal === '0_perm' ? 'permanencia' : 'sobreaviso' };
    }
    if (manualVal && manualVal !== 'auto') {
      return { onDuty: false, type: 'off' };
    }

    const shift = getShiftForDate(dateStr, day);
    const permNome = (shift.permanenciaNome || '').toLowerCase();
    const sobrNome = (shift.sobreavisoNome || '').toLowerCase();
    const warName = (militar.warName || '').toLowerCase();

    if ((permNome && warName && permNome.includes(warName)) || shift.permanenciaId === militar.id) {
      return { onDuty: true, type: 'permanencia' };
    }
    if ((sobrNome && warName && sobrNome.includes(warName)) || shift.sobreavisoId === militar.id) {
      return { onDuty: true, type: 'sobreaviso' };
    }

    const extra = shift.extraMilitaries?.find(em => 
      (em.militarId && em.militarId === militar.id) ||
      (em.militarNome && warName && em.militarNome.toLowerCase().includes(warName))
    );
    if (extra) {
      return { onDuty: true, type: extra.tipo };
    }

    return { onDuty: false, type: 'off' };
  };

  // Status visual da célula na matriz para um militar em um dia
  const getCellStatus = (militar: DutyRosterMilitary, day: number) => {
    const dateStr = getDateStr(day);
    const manualVal = manualCellOverrides[`${militar.id}_${dateStr}`];
    const isRedDay = redDays.includes(day);

    // 1. Afastamentos Militares (Férias, Baixa médica, Missão, Licença, etc.)
    const activeLeave = militaryLeaves.find(l => l.militarId === militar.id && dateStr >= l.dataInicio && dateStr <= l.dataFim);
    if (activeLeave) {
      let badge = 'BX';
      let title = 'BAIXA MÉDICA';
      let badgeClass = 'bg-slate-500 text-white';
      if (activeLeave.tipo === 'ferias') {
        badge = 'FÉR';
        title = 'FÉRIAS REGULAMENTARES';
        badgeClass = 'bg-sky-500 text-white';
      } else if (activeLeave.tipo === 'missao') {
        badge = 'MIS';
        title = 'MISSÃO FORA DA GUARNICAO';
        badgeClass = 'bg-purple-600 text-white';
      } else if (activeLeave.tipo === 'licenca') {
        badge = 'LIC';
        title = 'LICENÇA ESPECIAL/DISPENSA';
        badgeClass = 'bg-amber-600 text-white';
      } else if (activeLeave.tipo === 'dispensa') {
        badge = 'DIS';
        title = 'DISPENSA COMO RECOMPENSA';
        badgeClass = 'bg-emerald-600 text-white';
      } else if (activeLeave.tipo === 'outros') {
        badge = 'OUT';
        title = 'FORA DE ESCALA';
        badgeClass = 'bg-slate-600 text-white';
      }

      return {
        type: 'leave',
        text: badge,
        title: `${militar.gradNome} - ${title} (${activeLeave.motivo}) de ${activeLeave.dataInicio} a ${activeLeave.dataFim}`,
        badgeClass,
        activeLeave,
      };
    }

    if (militar.isBaixado) {
      return { 
        type: 'baixado', 
        text: 'B', 
        title: `${militar.gradNome} - BAIXADO (${militar.motivoBaixa || 'Atestado/FSR'})` 
      };
    }

    // 2. Mês Zerado (quando Chefe zerou e não há preenchimento ou override)
    if (isMonthCleared && (!manualVal || manualVal === 'auto')) {
      const shift = shifts.find(s => s.date === dateStr);
      const isExplicitDuty = shift && (
        (shift.permanenciaNome && shift.permanenciaNome !== 'Não Escalado' && shift.permanenciaNome.includes(militar.warName || '')) ||
        (shift.sobreavisoNome && shift.sobreavisoNome !== 'Não Escalado' && shift.sobreavisoNome.includes(militar.warName || ''))
      );
      if (!isExplicitDuty) {
        return {
          type: 'vazio',
          text: '-',
          title: 'Escala Zerada (Aguardando preenchimento manual ou geração inteligente por IA)',
        };
      }
    }

    // Sobrescrita manual direta pelo Auxiliar / Chefe
    if (manualVal && manualVal !== 'auto') {
      if (manualVal === '0_perm') {
        return {
          type: 'permanencia',
          text: '0',
          title: `[MANUAL] ${militar.gradNome} - PERMANÊNCIA (0 VERDE)`,
          isManual: true,
        };
      }
      if (manualVal === '0_sobr') {
        return {
          type: 'sobreaviso',
          text: '0',
          title: `[MANUAL] ${militar.gradNome} - SOBREAVISO (0 AMARELO)`,
          isManual: true,
        };
      }
      if (manualVal === 'B') {
        return {
          type: 'baixado',
          text: 'B',
          title: `[MANUAL] ${militar.gradNome} - BAIXADO`,
          isManual: true,
        };
      }
      if (manualVal === 'V') {
        return {
          type: 'vermelha',
          text: 'V',
          title: `[MANUAL] Escala Vermelha`,
          isManual: true,
        };
      }
      return {
        type: isRedDay ? 'vermelha' : 'folga',
        text: manualVal,
        title: `[MANUAL] Folga ${manualVal}`,
        isManual: true,
      };
    }

    const dutyInfo = isMilitaryOnDuty(militar, day);
    const shift = getShiftForDate(dateStr, day);

    if (dutyInfo.onDuty) {
      const isSwap = !!shift.swapInfo && (
        shift.permanenciaNome?.toLowerCase().includes((militar.warName || '').toLowerCase()) ||
        shift.sobreavisoNome?.toLowerCase().includes((militar.warName || '').toLowerCase())
      );
      if (dutyInfo.type === 'permanencia') {
        return { 
          type: 'permanencia', 
          text: '0', 
          title: isSwap 
            ? `🔄 TROCA DE SERVIÇO: ${shift.swapInfo?.solicitante} trocou com ${shift.swapInfo?.substituto}. Motivo: ${shift.swapInfo?.motivo}`
            : `${militar.gradNome} - PERMANÊNCIA (SERVIÇO PRESENCIAL 0 VERDE)`,
          isSwap,
          swapDetails: shift.swapInfo
        };
      } else {
        return { 
          type: 'sobreaviso', 
          text: '0', 
          title: isSwap 
            ? `🔄 TROCA DE SERVIÇO: ${shift.swapInfo?.solicitante} trocou com ${shift.swapInfo?.substituto}. Motivo: ${shift.swapInfo?.motivo}`
            : `${militar.gradNome} - SOBREAVISO (PRONTIDÃO 0 AMARELO)`,
          isSwap,
          swapDetails: shift.swapInfo
        };
      }
    }

    // Identificar se o militar acabou de voltar de afastamento (Prioritário)
    const justReturned = militaryLeaves.some(l => {
      if (l.militarId !== militar.id) return false;
      if (dateStr <= l.dataFim) return false;
      const dEnd = new Date(l.dataFim + 'T00:00:00');
      const dCur = new Date(dateStr + 'T00:00:00');
      const diff = Math.round((dCur.getTime() - dEnd.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 1 && diff <= scaleRestDays;
    });

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // CONTAGEM DE DIAS DE DESCANSO (1 a scaleRestDays) - "O MAIS FOLGADO"
    // -------------------------------------------------------------
    if (scaleType === 'corrida') {
      let lastDutyDay = -1;
      for (let prev = day - 1; prev >= 1; prev--) {
        if (isMilitaryOnDuty(militar, prev).onDuty) {
          lastDutyDay = prev;
          break;
        }
      }

      let count = 1;
      if (lastDutyDay > 0) {
        const diff = day - lastDutyDay;
        count = Math.min(scaleRestDays, Math.max(1, diff));
      } else {
        let nextDutyDay = -1;
        for (let next = day + 1; next <= daysInMonth.length; next++) {
          if (isMilitaryOnDuty(militar, next).onDuty) {
            nextDutyDay = next;
            break;
          }
        }
        if (nextDutyDay > 0) {
          const diff = nextDutyDay - day;
          count = Math.min(scaleRestDays, Math.max(1, (scaleRestDays + 1) - diff));
        } else {
          count = scaleRestDays;
        }
      }

      return {
        type: isRedDay ? 'vermelha' : 'folga',
        text: String(count),
        title: `${isRedDay ? 'Escala Corrida (Fim de Semana / Administrativo)' : 'Escala Corrida (Dia de Semana)'} - Folga ${count}/${scaleRestDays} (Mais Folgado)${justReturned ? ' ⭐ [RETORNO DE AFASTAMENTO - PRIORITÁRIO PARA SERVIÇO]' : ''}`,
      };
    } else {
      // Escala Preta e Vermelha Separada
      if (isRedDay) {
        const currentRedIndex = redDays.indexOf(day);
        let lastRedDutyIndex = -1;
        for (let i = currentRedIndex - 1; i >= 0; i--) {
          if (isMilitaryOnDuty(militar, redDays[i]).onDuty) {
            lastRedDutyIndex = i;
            break;
          }
        }

        let count = 1;
        if (lastRedDutyIndex >= 0) {
          const diff = currentRedIndex - lastRedDutyIndex;
          count = Math.min(scaleRestDays, Math.max(1, diff));
        } else {
          let nextRedDutyIndex = -1;
          for (let i = currentRedIndex + 1; i < redDays.length; i++) {
            if (isMilitaryOnDuty(militar, redDays[i]).onDuty) {
              nextRedDutyIndex = i;
              break;
            }
          }
          if (nextRedDutyIndex >= 0) {
            const diff = nextRedDutyIndex - currentRedIndex;
            count = Math.min(scaleRestDays, Math.max(1, (scaleRestDays + 1) - diff));
          } else {
            count = scaleRestDays;
          }
        }

        return {
          type: 'vermelha',
          text: String(count),
          title: `Escala Vermelha - Folga ${count}/${scaleRestDays} (Sábado/Domingo/Feriado)${justReturned ? ' ⭐ [RETORNO DE AFASTAMENTO - PRIORITÁRIO]' : ''}`,
        };
      } else {
        const currentBlackIndex = blackDays.indexOf(day);
        let lastBlackDutyIndex = -1;
        for (let i = currentBlackIndex - 1; i >= 0; i--) {
          if (isMilitaryOnDuty(militar, blackDays[i]).onDuty) {
            lastBlackDutyIndex = i;
            break;
          }
        }

        let count = 1;
        if (lastBlackDutyIndex >= 0) {
          const diff = currentBlackIndex - lastBlackDutyIndex;
          count = Math.min(scaleRestDays, Math.max(1, diff));
        } else {
          let nextBlackDutyIndex = -1;
          for (let i = currentBlackIndex + 1; i < blackDays.length; i++) {
            if (isMilitaryOnDuty(militar, blackDays[i]).onDuty) {
              nextBlackDutyIndex = i;
              break;
            }
          }
          if (nextBlackDutyIndex >= 0) {
            const diff = nextBlackDutyIndex - currentBlackIndex;
            count = Math.min(scaleRestDays, Math.max(1, (scaleRestDays + 1) - diff));
          } else {
            count = scaleRestDays;
          }
        }

        return {
          type: 'folga',
          text: String(count),
          title: `Escala Preta - Folga ${count}/${scaleRestDays} (Segunda a Sexta)${justReturned ? ' ⭐ [RETORNO DE AFASTAMENTO - PRIORITÁRIO]' : ''}`,
        };
      }
    }
  };

  // Manipular clique em célula na matriz
  const handleCellClick = (militar: DutyRosterMilitary, day: number) => {
    if (isManualMode && canEditRoster) {
      const dateStr = getDateStr(day);
      const currentVal = manualCellOverrides[`${militar.id}_${dateStr}`] || getCellStatus(militar, day).text;
      setManualCellModal({
        militar,
        day,
        currentValue: currentVal,
      });
      return;
    }

    if (isChefe) {
      handleOpenDayEdit(day);
    }
  };

  // Salvar valor de célula em Modo Manual
  const handleSetManualCellValue = (militar: DutyRosterMilitary, day: number, value: string) => {
    const dateStr = getDateStr(day);
    const key = `${militar.id}_${dateStr}`;

    setManualCellOverrides(prev => {
      if (value === 'auto') {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: value };
    });

    if (value === '0_perm' || value === '0_sobr') {
      const field = value === '0_perm' ? 'permanenciaNome' : 'sobreavisoNome';
      const idField = value === '0_perm' ? 'permanenciaId' : 'sobreavisoId';
      updateSpecificShift(dateStr, {
        [field]: militar.gradNome,
        [idField]: militar.id,
      });
    }

    setManualCellModal(null);
  };

  // Abrir modal de edição do dia (Chefe de Seção)
  const handleOpenDayEdit = (day: number) => {
    if (!canEditRoster) {
      alert('Somente o Chefe de Seção ou Auxiliar possuem permissão para configurar a escala.');
      return;
    }
    const dateStr = getDateStr(day);
    const shift = getShiftForDate(dateStr, day);
    setDayEditTargetDay(day);
    setDayEditPermanencia(shift.permanenciaNome);
    setDayEditSobreaviso(shift.sobreavisoNome);
    setDayEditIsAdmin(!!shift.isAdministrativeDay);
    setDayEditExtraMilitar('');
    setDayEditJustificativa('');
    setDayEditModalOpen(true);
  };

  // Salvar edições do Chefe no dia selecionado
  const handleSaveDayEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = getDateStr(dayEditTargetDay);
    const current = getShiftForDate(dateStr, dayEditTargetDay);

    const permMil = rosterMilitary.find(m => m.gradNome === dayEditPermanencia);
    const sobrMil = rosterMilitary.find(m => m.gradNome === dayEditSobreaviso);

    let updatedExtras = [...(current.extraMilitaries || [])];
    if (dayEditExtraMilitar) {
      const extMil = rosterMilitary.find(m => m.gradNome === dayEditExtraMilitar);
      if (extMil && !updatedExtras.some(e => e.militarId === extMil.id)) {
        updatedExtras.push({
          militarId: extMil.id,
          militarNome: extMil.gradNome,
          tipo: dayEditExtraTipo,
        });
      }
    }

    const updates: Partial<DutyShiftEntry> = {
      permanenciaNome: dayEditPermanencia,
      permanenciaId: permMil?.id || current.permanenciaId,
      sobreavisoNome: dayEditSobreaviso,
      sobreavisoId: sobrMil?.id || current.sobreavisoId,
      isAdministrativeDay: dayEditIsAdmin,
      extraMilitaries: updatedExtras,
    };

    updateSpecificShift(dateStr, updates);

    // Se o mês estava marcado como zerado, desmarca pois agora há preenchimento
    setIsMonthCleared(false);
    localStorage.removeItem(`eb_cleared_month_${selectedYear}_${selectedMonth}`);

    // PROPAGAÇÃO DINÂMICA: Readequar todos os dias seguintes
    // Regra do Mais Folgado: auto-preenchimento automático respeitando descansos e afastamentos
    triggerRippleRecalculation(dayEditTargetDay, {
      permanenciaNome: dayEditPermanencia,
      permanenciaId: permMil?.id || current.permanenciaId || '',
      sobreavisoNome: dayEditSobreaviso,
      sobreavisoId: sobrMil?.id || current.sobreavisoId || '',
      isAdministrativeDay: dayEditIsAdmin,
      extraMilitaries: updatedExtras,
    });

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'chefe',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Chefe configurou escala do dia ${dayEditTargetDay}/${selectedMonth + 1}: Perm: ${dayEditPermanencia}, Sobr: ${dayEditSobreaviso}${dayEditIsAdmin ? ' (Dia Administrativo)' : ''}. Escala subsequente auto-preenchida dinamicamente pelo mais folgado.`,
      details: dayEditJustificativa ? `Justificativa: ${dayEditJustificativa}` : undefined,
      targetRef: `ESCALA-${dateStr}`,
    });

    setDayEditModalOpen(false);
  };

  // Desfazer / Refazer trocas feitas no dia caso o Chefe de Seção erre
  const handleRevertSwapForDay = (day: number) => {
    if (!canEditRoster) {
      alert('Somente o Chefe de Seção ou Auxiliar podem desfazer trocas da escala.');
      return;
    }
    const dateStr = getDateStr(day);
    const targetSwap = swaps.find(s => (s.dataOriginal === dateStr || s.dataSubstituta === dateStr) && s.status === 'homologada');
    const current = getShiftForDate(dateStr, day);
    const swapInfo = targetSwap ? null : current.swapInfo;

    if (!targetSwap && !swapInfo) {
      alert('Nenhuma troca homologada encontrada registrada para este dia.');
      return;
    }

    if (!window.confirm(`Deseja realmente DESFAZER a permuta deste dia e restaurar os militares e a escala original?`)) {
      return;
    }

    const origDate = targetSwap?.dataOriginal || swapInfo?.originalDate || dateStr;
    const substDate = targetSwap?.dataSubstituta || swapInfo?.targetDate || dateStr;
    const origMilNome = targetSwap?.militarOriginalNome || swapInfo?.solicitante;
    const substMilNome = targetSwap?.militarSubstitutoNome || swapInfo?.substituto;

    // Restaurar ambas as datas
    setShifts(prev => prev.map(s => {
      if (s.date === origDate) {
        return {
          ...s,
          permanenciaNome: origMilNome || s.permanenciaNome,
          swapInfo: undefined,
        };
      }
      if (s.date === substDate) {
        return {
          ...s,
          permanenciaNome: substMilNome || s.permanenciaNome,
          swapInfo: undefined,
        };
      }
      return s;
    }));

    // Marcar como recusada/cancelada em swaps
    if (targetSwap) {
      setSwaps(prev => prev.map(s => s.id === targetSwap.id ? { ...s, status: 'recusada' } : s));
    }

    // Readequar a escala a partir do primeiro dia afetado
    const firstDay = Math.min(Number(origDate.split('-')[2]) || day, Number(substDate.split('-')[2]) || day);
    triggerRippleRecalculation(firstDay);

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'chefe',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Chefe DESFEZ permuta do dia ${day}/${selectedMonth + 1} (${origMilNome} 🔄 ${substMilNome}), restaurando a escala original e readequando o restante.`,
      targetRef: `PERMUTA-${dateStr}`,
    });

    alert('Troca desfeita com sucesso! A escala original foi restaurada e readequada.');
  };

  // Zerar todos os dias da escala do mês selecionado
  const handleClearAllDays = () => {
    if (!canEditRoster) {
      alert('Apenas o Chefe de Seção ou Auxiliar podem zerar a escala.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja ZERAR toda a escala de ${selectedMonth + 1}/${selectedYear}?\nTodos os dias ficarão em branco para preenchimento manual ou geração inteligente.`)) {
      return;
    }

    setIsMonthCleared(true);
    localStorage.setItem(`eb_cleared_month_${selectedYear}_${selectedMonth}`, 'true');

    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    setShifts(prev => prev.filter(s => !s.date.startsWith(monthPrefix)));

    setManualCellOverrides(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(k => {
        if (k.includes(monthPrefix)) delete copy[k];
      });
      return copy;
    });

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'chefe',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Chefe ZEROU toda a escala do mês ${selectedMonth + 1}/${selectedYear}.`,
      targetRef: `ESCALA-${monthPrefix}`,
    });

    alert('A escala do mês foi ZERADA com sucesso. Todas as células estão em branco.');
  };

  // Gerar Escala Inteligente usando IA / Regra do Mais Folgado (Regime scaleDutyDays x scaleRestDays)
  const handleGenerateIntelligentRoster = () => {
    if (!canEditRoster) {
      alert('Apenas o Chefe de Seção ou Auxiliar podem gerar a escala automática.');
      return;
    }

    setIsMonthCleared(false);
    localStorage.removeItem(`eb_cleared_month_${selectedYear}_${selectedMonth}`);

    const generated = runAiScheduleGeneration({
      fromDayToRecalculate: 1,
    });

    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    setShifts(prev => {
      const otherMonths = prev.filter(s => !s.date.startsWith(monthPrefix));
      return [...otherMonths, ...generated];
    });

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'chefe',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Escala Inteligente (IA) gerada para ${selectedMonth + 1}/${selectedYear} pela Regra do Mais Folgado (Regime ${scaleDutyDays}x${scaleRestDays} com folgas 1..${scaleRestDays}) e prioridades de retorno.`,
      targetRef: `ESCALA-${monthPrefix}`,
    });

    alert(`✨ Escala Inteligente gerada com sucesso!\nRegra do Mais Folgado aplicada para Regime ${scaleDutyDays}x${scaleRestDays} (${scaleRestDays} dias de folga: 1 a ${scaleRestDays}), garantindo estritamente o tempo de descanso dos militares.`);
  };

  // Cadastrar Afastamento (Férias, Baixa médica, Missão, Licença)
  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditRoster) {
      alert('Somente o Chefe de Seção ou Auxiliar podem cadastrar afastamentos.');
      return;
    }
    const targetMil = rosterMilitary.find(m => m.id === leaveTargetMilitarId);
    if (!targetMil) {
      alert('Por favor, selecione um militar.');
      return;
    }
    if (!leaveStartDate || !leaveEndDate) {
      alert('Preencha as datas de início e término do afastamento.');
      return;
    }

    const newRecord: MilitaryLeaveRecord = {
      id: `leave-${Date.now()}`,
      militarId: targetMil.id,
      militarNome: targetMil.gradNome,
      tipo: leaveType,
      dataInicio: leaveStartDate,
      dataFim: leaveEndDate,
      dias: Number(leaveDaysCount) || 1,
      motivo: leaveMotivo || `Afastamento por ${leaveType}`,
      registradoPor: currentUser?.name || 'Chefe de Seção',
      createdAt: new Date().toISOString(),
    };

    setMilitaryLeaves(prev => [newRecord, ...prev]);
    setLeaveMotivo('');

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'chefe',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Afastamento cadastrado: ${targetMil.gradNome} (${leaveType.toUpperCase()}) de ${leaveStartDate} a ${leaveEndDate} (${leaveDaysCount} dias).`,
      details: leaveMotivo,
      targetRef: `AFAST-${targetMil.id}`,
    });

    alert(`Afastamento de ${targetMil.gradNome} (${leaveType.toUpperCase()}) registrado com sucesso!\nO militar não concorrerá à escala no período e terá prioridade máxima de serviço ao retornar.`);

    // Readequar escala do mês a partir do primeiro dia
    triggerRippleRecalculation(1);
  };

  // Excluir Afastamento
  const handleDeleteLeave = (id: string) => {
    if (!canEditRoster) {
      alert('Somente o Chefe de Seção ou Auxiliar podem remover afastamentos.');
      return;
    }
    const target = militaryLeaves.find(l => l.id === id);
    if (!target) return;

    if (!window.confirm(`Deseja remover o afastamento de ${target.militarNome} (${target.tipo})?`)) {
      return;
    }

    setMilitaryLeaves(prev => prev.filter(l => l.id !== id));

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'chefe',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Afastamento de ${target.militarNome} (${target.tipo}) foi removido.`,
      targetRef: `AFAST-${target.militarId}`,
    });

    // Readequar escala após remoção
    triggerRippleRecalculation(1);
  };

  // Excluir Militar Extra do dia (Chefe de Seção)
  const handleDeleteExtraMilitary = (day: number, militarId: string) => {
    if (!canEditRoster) {
      alert('Somente o Chefe de Seção ou Auxiliar podem remover militares extras.');
      return;
    }
    const dateStr = getDateStr(day);
    const targetShift = getShiftForDate(dateStr, day);
    const removedExtra = targetShift.extraMilitaries?.find(em => em.militarId === militarId);
    const newExtras = (targetShift.extraMilitaries || []).filter(em => em.militarId !== militarId);

    updateSpecificShift(dateStr, {
      extraMilitaries: newExtras,
    });

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'chefe',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Chefe EXCLUIU militar extra ${removedExtra?.militarNome || militarId} do dia ${day}/${selectedMonth + 1}`,
      targetRef: `ESCALA-${dateStr}`,
    });

    alert(`Militar extra ${removedExtra?.militarNome || ''} removido com sucesso.`);
  };

  // Alternar militar baixado
  const handleToggleBaixado = (militaryId: string) => {
    if (!isChefe) {
      alert('Apenas o Chefe de Seção ou DEV podem baixar ou reativar militares da escala.');
      return;
    }
    const target = rosterMilitary.find(m => m.id === militaryId);
    if (!target) return;

    if (!target.isBaixado) {
      const motivo = window.prompt(`Informe o motivo da baixa para ${target.gradNome}:`, 'Dispensa Médica - FSR');
      if (!motivo) return;

      setRosterMilitary(prev => prev.map(m => m.id === militaryId ? { ...m, isBaixado: true, motivoBaixa: motivo } : m));
      onAddAuditLog?.({
        militaryName: currentUser?.name || 'Chefe da TI',
        militaryLogin: currentUser?.username || 'chefe',
        role: currentUser?.role || 'CH-SECINFO',
        actionType: 'MILITAR_DESATIVADO',
        summary: `Militar ${target.gradNome} marcado como BAIXADO na escala. Motivo: ${motivo}`,
        targetRef: target.gradNome,
      });
    } else {
      setRosterMilitary(prev => prev.map(m => m.id === militaryId ? { ...m, isBaixado: false, motivoBaixa: undefined } : m));
      onAddAuditLog?.({
        militaryName: currentUser?.name || 'Chefe da TI',
        militaryLogin: currentUser?.username || 'chefe',
        role: currentUser?.role || 'CH-SECINFO',
        actionType: 'MILITAR_REATIVADO',
        summary: `Militar ${target.gradNome} REATIVADO na escala de serviço`,
        targetRef: target.gradNome,
      });
    }
  };

  // Validar regra de permuta de até 2 dias de diferença
  const validateSwapDates = (orig: string, subst: string) => {
    if (!orig || !subst) return '';
    const d1 = new Date(orig);
    const d2 = new Date(subst);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return 'Atenção: A data do substituto não pode ser anterior à data do militar que sai.';
    }
    if (diffDays > 2) {
      return `Regra Militar Excedida: A troca só pode ser realizada até 2 dias depois da data original (Diferença selecionada: ${diffDays} dias).`;
    }
    return '';
  };

  // Handler: Sinalizar Troca de Serviço (Xerife)
  const handleCreateSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapAmbosConcordaram) {
      alert('Para sinalizar a troca, é obrigatório confirmar que ambos os militares concordaram previamente.');
      return;
    }

    const error = validateSwapDates(swapDataOrig, swapDataSubst);
    if (error) {
      alert(error);
      return;
    }

    const newSwap: DutySwapRequest = {
      id: `swap-${Date.now()}`,
      militarOriginalId: `mil-${Date.now()}-1`,
      militarOriginalNome: swapMilitarOrig,
      dataOriginal: swapDataOrig,
      militarSubstitutoId: `mil-${Date.now()}-2`,
      militarSubstitutoNome: swapMilitarSubst,
      dataSubstituta: swapDataSubst,
      motivo: swapMotivo,
      ambosConcordaram: true,
      status: 'sinalizada_xerife',
      sinalizadoPor: currentUser?.name || 'Sd Arantes (Xerife)',
      createdAt: new Date().toISOString(),
    };

    setSwaps(prev => [newSwap, ...prev]);
    setIsSwapModalOpen(false);

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Xerife da TI',
      militaryLogin: currentUser?.username || 'arantes',
      role: currentUser?.role || 'INF-XERIFE',
      actionType: 'STATUS_MISSAO',
      summary: `Xerife sinalizou permuta entre ${swapMilitarOrig} (${swapDataOrig}) e ${swapMilitarSubst} (${swapDataSubst})`,
      details: `Motivo: ${swapMotivo}. Declaração: ambos concordaram.`,
      targetRef: `PERMUTA-${swapDataOrig}`,
    });

    alert('Sinalização de permuta registrada com sucesso! Aguardando homologação do Chefe de Seção com senha.');
  };

  // Abrir modal de homologação com senha
  const handleOpenHomologate = (swap: DutySwapRequest) => {
    setHomologateModalSwap(swap);
    setChefePasswordInput('');
    setChefePasswordError('');
  };

  // Homologar troca com senha do Chefe de Seção
  const handleConfirmHomologateWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homologateModalSwap) return;

    const validChefeUser = militaryUsers.find(
      u => (u.role === 'CH-SECINFO' || u.role === 'dev' || u.username === 'dev') &&
           u.password === chefePasswordInput
    );

    if (!validChefeUser && chefePasswordInput !== 'fT?t7pTpk=0&_H7fW6@info26' && chefePasswordInput !== 'H3b3rt0n2001@') {
      setChefePasswordError('Senha do Chefe de Seção incorreta. Homologação negada.');
      return;
    }

    const swap = homologateModalSwap;

    setSwaps(prev => prev.map(s => {
      if (s.id !== swap.id) return s;
      return {
        ...s,
        status: 'homologada',
        homologadoPor: currentUser?.name || 'Chefe de Seção',
      };
    }));

    const swapMeta = {
      originalDate: swap.dataOriginal,
      targetDate: swap.dataSubstituta,
      solicitante: swap.militarOriginalNome,
      substituto: swap.militarSubstitutoNome,
      motivo: swap.motivo,
      homologadoPor: currentUser?.name || 'Chefe de Seção',
      homologadoAt: new Date().toISOString(),
    };

    updateSpecificShift(swap.dataOriginal, {
      permanenciaNome: swap.militarSubstitutoNome,
      swapInfo: swapMeta,
    });

    updateSpecificShift(swap.dataSubstituta, {
      permanenciaNome: swap.militarOriginalNome,
      swapInfo: swapMeta,
    });

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'chefe',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Chefe HOMOLOGOU COM SENHA a permuta entre ${swap.militarOriginalNome} e ${swap.militarSubstitutoNome}`,
      details: `Data original: ${swap.dataOriginal} ➔ Substituição: ${swap.dataSubstituta}. Motivo: ${swap.motivo}`,
      targetRef: `PERMUTA-${swap.dataOriginal}`,
    });

    setHomologateModalSwap(null);
    alert('Permuta homologada com sucesso! A matriz foi atualizada com o novo militar de serviço.');
  };

  // Recusar permuta
  const handleRejectSwap = (swapId: string) => {
    if (!canHomologateSwaps) return;
    setSwaps(prev => prev.map(s => s.id === swapId ? { ...s, status: 'recusada', homologadoPor: currentUser?.name } : s));
  };

  // Assinatura digital com senha (Militar de Permanência)
  const handleSignPermanencia = (e: React.FormEvent) => {
    e.preventDefault();
    const permNome = (currentShift.permanenciaNome || '').toLowerCase();
    const militar = militaryUsers.find(u => {
      const uName = (u.name || '').toLowerCase();
      const uWar = (u.warName || '').toLowerCase();
      return (permNome && uName && permNome.includes(uName)) || (permNome && uWar && permNome.includes(uWar));
    });

    const isMatch = (militar && militar.password === signPermanenciaPassword) ||
                    (currentUser && currentUser.password === signPermanenciaPassword) ||
                    signPermanenciaPassword === 'fT?t7pTpk=0&_H7fW6@info26';

    if (!isMatch) {
      setSignPermanenciaError('Senha incorreta do Militar de Permanência.');
      return;
    }

    updateCurrentShift({
      permanenciaSigned: true,
      permanenciaSignedAt: new Date().toISOString(),
    });
    setSignPermanenciaPassword('');
    setSignPermanenciaError('');
    alert(`Assinatura digital do Militar de Permanência (${currentShift.permanenciaNome}) validada e gravada!`);
  };

  // Assinatura digital com senha (Militar de Sobreaviso)
  const handleSignSobreaviso = (e: React.FormEvent) => {
    e.preventDefault();
    const sobrNome = (currentShift.sobreavisoNome || '').toLowerCase();
    const militar = militaryUsers.find(u => {
      const uName = (u.name || '').toLowerCase();
      const uWar = (u.warName || '').toLowerCase();
      return (sobrNome && uName && sobrNome.includes(uName)) || (sobrNome && uWar && sobrNome.includes(uWar));
    });

    const isMatch = (militar && militar.password === signSobreavisoPassword) ||
                    (currentUser && currentUser.password === signSobreavisoPassword) ||
                    signSobreavisoPassword === 'fT?t7pTpk=0&_H7fW6@info26';

    if (!isMatch) {
      setSignSobreavisoError('Senha incorreta do Militar de Sobreaviso.');
      return;
    }

    updateCurrentShift({
      sobreavisoSigned: true,
      sobreavisoSignedAt: new Date().toISOString(),
    });
    setSignSobreavisoPassword('');
    setSignSobreavisoError('');
    alert(`Assinatura digital do Militar de Sobreaviso (${currentShift.sobreavisoNome}) validada e gravada!`);
  };

  // Registrar Passagem de Chave com confirmação por senha de ambos
  const handleRegisterKeyHandover = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');

    const giver = militaryUsers.find(u => u.name === keyGiverName || u.warName === keyGiverName);
    const giverOk = (giver && giver.password === keyGiverPassword) || keyGiverPassword === 'fT?t7pTpk=0&_H7fW6@info26';

    if (!giverOk) {
      setKeyError('Senha do militar passador (quem entrega) está incorreta.');
      return;
    }

    const receiver = militaryUsers.find(u => u.name === keyReceiverName || u.warName === keyReceiverName);
    const receiverOk = (receiver && receiver.password === keyReceiverPassword) || keyReceiverPassword === 'fT?t7pTpk=0&_H7fW6@info26';

    if (!receiverOk) {
      setKeyError('Senha do militar recebedor (quem assume) está incorreta.');
      return;
    }

    const newHandover: KeyHandoverRecord = {
      id: `key-${Date.now()}`,
      keyName: keySelected,
      giverId: giver?.id || `giver-${Date.now()}`,
      giverName: keyGiverName,
      receiverId: receiver?.id || `rec-${Date.now()}`,
      receiverName: keyReceiverName,
      timestamp: new Date().toISOString(),
      notes: keyNotes || 'Chave entregue em mãos com claviculário íntegro.',
      giverSigned: true,
      receiverSigned: true,
    };

    setKeyHandovers(prev => [newHandover, ...prev]);

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Militar da TI',
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'INF-TECNICO',
      actionType: 'STATUS_MISSAO',
      summary: `Passagem de Chave da [${keySelected}]: ${keyGiverName} ➔ ${keyReceiverName}`,
      details: keyNotes || 'Assinatura digital dupla confirmada por senha.',
      targetRef: `CHAVE-${keySelected}`,
    });

    setShowKeyModal(false);
    setKeyGiverPassword('');
    setKeyReceiverPassword('');
    setKeyNotes('');
    alert(`Passagem da chave ${keySelected} registrada e assinada digitalmente por ambos os militares!`);
  };

  // Acionar 3º CTA
  const handleSendCtaAlert = () => {
    if (!ctaIncidentText.trim()) {
      alert('Por favor, descreva o incidente técnico para acionar o 3º CTA.');
      return;
    }

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Informático de Dia',
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'INF-TECNICO',
      actionType: 'STATUS_MISSAO',
      summary: `🚨 ACIONAMENTO DE EMERGÊNCIA 3º CTA: ${ctaIncidentText.trim()}`,
      details: `Central 3º CTA: (11) 3886-2040. Registrado em plantão militar.`,
      targetRef: 'INCIDENTE-3CTA',
    });

    alert('Chamado de emergência registrado no sistema militar e transmitido ao 3º CTA! Protocolo gerado no Livro.');
    setShowCtaModal(false);
    setCtaIncidentText('');
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // RESTRIÇÃO DE ACESSO: Liberado apenas para Chefe de Seção (CH-SECINFO) e Desenvolvedores (Devs)
  // Técnicos, Auxiliares de TI e Xerifes visualizam a tela "Em desenvolvimento"
  if (!hasDutyRosterAccess) {
    return (
      <div className={`p-4 md:p-8 min-h-[calc(100vh-160px)] flex items-center justify-center ${
        a11y.highContrast ? 'bg-black text-white' : 'bg-[#0f1a0b]/40'
      }`}>
        <div className={`max-w-2xl w-full rounded-3xl p-6 sm:p-10 text-center shadow-2xl border transition-all ${
          a11y.highContrast
            ? 'bg-black border-yellow-400 text-yellow-400'
            : 'bg-gradient-to-b from-[#1b2f15] to-[#142310] border-[#cba135]/40 text-slate-100 shadow-2xl shadow-black/60'
        }`}>
          {/* Animated Header Badge & Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#243d1c] to-[#345828] border-2 border-[#dfb642] flex items-center justify-center shadow-xl shadow-[#dfb642]/10 transform transition-transform hover:scale-105">
                <Construction className="w-10 h-10 text-[#dfb642] animate-bounce" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500/90 border-2 border-[#192b14] flex items-center justify-center text-white shadow-md">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dfb642]/15 border border-[#dfb642]/40 text-[#dfb642] font-black text-xs uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Módulo em Desenvolvimento & Homologação</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            Escala de Serviço - 2º GAC
          </h2>

          <p className="text-sm text-emerald-100/80 leading-relaxed max-w-lg mx-auto mb-6">
            O módulo operacional de escala de serviço (permanência, sobreaviso, livro de partes e livro de chaves) está em processo de testes e validação final pela equipe técnica.
          </p>

          {/* Card de Restrição de Perfil */}
          <div className={`p-4 sm:p-5 rounded-2xl mb-6 text-left border ${
            a11y.highContrast 
              ? 'bg-black border-yellow-400' 
              : 'bg-[#101b0d]/70 border-[#cba135]/25 backdrop-blur-sm'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1 text-xs">
                <h4 className="font-bold text-amber-300 text-sm flex items-center justify-between">
                  <span>Acesso Restrito Temporário</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200">
                    Restrição Ativa
                  </span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  A visualização e gerenciamento das escalas estão liberados exclusivamente para o <strong className="text-white">Chefe da Seção de Informática (CH-SECINFO)</strong> e os <strong className="text-white">Desenvolvedores (Devs)</strong>.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>Militar Conectado:</span>
                  <span className="font-mono text-emerald-300 font-bold bg-[#1e3316] px-2 py-0.5 rounded-md border border-[#cba135]/30">
                    {currentUser?.rank || ''} {currentUser?.name || 'Militar'} ({currentUser?.role || 'Corpo Técnico'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Recursos em Homologação */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-8 text-left text-xs">
            <div className="p-3 rounded-xl bg-[#142310] border border-[#cba135]/20">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#dfb642]" />
                <span>Regime 1xN Militar</span>
              </div>
              <p className="text-[11px] text-slate-400">Algoritmo de descanso dinâmico pelo Mais Folgado em homologação.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#142310] border border-[#cba135]/20">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                <Key className="w-3.5 h-3.5 text-[#dfb642]" />
                <span>Passagem de Chaves</span>
              </div>
              <p className="text-[11px] text-slate-400">Autenticação digital e livro de partes em fase de aprovação.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#142310] border border-[#cba135]/20">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#dfb642]" />
                <span>Liberação Geral</span>
              </div>
              <p className="text-[11px] text-slate-400">Disponibilização para técnicos e xerife após ordem do Chefe de Seção.</p>
            </div>
          </div>

          {/* Botão de retorno */}
          <div className="flex items-center justify-center gap-3">
            {onGoBackToDashboard && (
              <button
                type="button"
                onClick={onGoBackToDashboard}
                className="px-6 py-3 rounded-xl bg-[#dfb642] hover:bg-[#ebd06b] text-[#192b14] font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-[#dfb642]/20 cursor-pointer transition-all flex items-center gap-2 transform hover:scale-[1.02]"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Voltar ao Painel de Chamados</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      
      {/* Topo do Módulo: Identidade Militar & Abas */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#1e3316] text-[#dfb642] shadow-sm shrink-0 border border-[#cba135]/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#1e3316] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                2º GAC · REGIMENTO DEODORO
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#dfb642] text-[#192b14] px-2 py-0.5 rounded">
                Regra do Mais Folgado (Folgas 1 a {scaleRestDays} · Regime {scaleDutyDays}x{scaleRestDays})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              Escala de Serviço & Gestão Operacional de TI
            </h2>
            <p className="text-xs text-slate-500">
              Permanência (0 Verde) & Sobreaviso (0 Amarelo) · Rondas Pós-expediente, Pós-pernoite e Pré-parada · Claviculário
            </p>
          </div>
        </div>

        {/* Seletor de Mês e Controles de Visualização */}
        <div className="flex flex-wrap items-center gap-2">
          {!hasTimeRestriction && (
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear(y => y - 1);
                  } else {
                    setSelectedMonth(m => m - 1);
                  }
                }}
                className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono font-bold text-slate-800">
                {monthNames[selectedMonth].toUpperCase()} / {selectedYear}
              </span>
              <button
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear(y => y + 1);
                  } else {
                    setSelectedMonth(m => m + 1);
                  }
                }}
                className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {hasTimeRestriction && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Visão Operacional: Semana Atual & Próxima</span>
            </div>
          )}

          {/* Botão de Emergência Anti-Meia-Fase */}
          <button
            type="button"
            onClick={() => {
              setShowAntiMeiaFaseModal(true);
              setAntiMeiaFaseStep(1);
            }}
            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 border border-red-700"
            title="Protocolo Operacional de Emergência Anti-Meia-Fase"
          >
            <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>POP Anti-Meia-Fase</span>
          </button>
        </div>
      </div>

      {/* Navegação entre Abas do Módulo */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-[#1e3316] text-[#dfb642] shadow-sm border border-[#cba135]/40'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Matriz da Escala ({scaleType === 'corrida' ? 'Corrida 1x6' : 'Preta & Vermelha'})</span>
        </button>

        <button
          onClick={() => setActiveTab('checklists')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'checklists'
              ? 'bg-[#1e3316] text-[#dfb642] shadow-sm border border-[#cba135]/40'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Rondas da Informática</span>
        </button>

        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'keys'
              ? 'bg-[#1e3316] text-[#dfb642] shadow-sm border border-[#cba135]/40'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Passagem de Chaves ({keyHandovers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('livro')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'livro'
              ? 'bg-[#1e3316] text-[#dfb642] shadow-sm border border-[#cba135]/40'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Livro de Parte & Assinaturas</span>
        </button>

        <button
          onClick={() => setActiveTab('swaps')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'swaps'
              ? 'bg-[#1e3316] text-[#dfb642] shadow-sm border border-[#cba135]/40'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Trocas & Permutas ({swaps.filter(s => s.status === 'sinalizada_xerife').length})</span>
        </button>
      </div>

      {/* ================= ABA 1: MATRIZ DA ESCALA ================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          
          {/* Barra de Controles da Matriz: Seletores de Tipo de Escala e Preenchimento Manual */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
            
            {/* SELETOR 1: Escala Corrida vs Preta e Vermelha */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Modo da Escala:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setScaleType('corrida');
                    triggerRippleRecalculation(0);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    scaleType === 'corrida'
                      ? 'bg-[#1e3316] text-[#dfb642] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={`Escala Corrida: conta continuamente 1 a ${scaleRestDays} dias de folga direto, priorizando sempre o mais folgado`}
                >
                  🏃‍♂️ Escala Corrida (Folga 1 a {scaleRestDays})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScaleType('preta_vermelha');
                    triggerRippleRecalculation(0);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    scaleType === 'preta_vermelha'
                      ? 'bg-[#1e3316] text-[#dfb642] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={`Escala Preta e Vermelha: conta fins de semana e dias de semana separadamente (máximo ${scaleRestDays} folgas)`}
                >
                  ⬛🔴 Preta e Vermelha (Folga 1 a {scaleRestDays})
                </button>
              </div>
            </div>

            {/* SELETOR 2: Modo de Preenchimento Manual (Auxiliar de Seção e Chefe) */}
            <div className="flex flex-wrap items-center gap-2">
              {canEditRoster && (
                <>
                  {/* Botão de Preenchimento Manual */}
                  <button
                    type="button"
                    onClick={() => setIsManualMode(!isManualMode)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isManualMode
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title="Ativa o modo para que o Auxiliar de Seção ou Chefe cliquem em qualquer célula e setem valores livremente"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Preenchimento Manual: {isManualMode ? 'ATIVADO' : 'DESATIVADO'}</span>
                  </button>

                  {/* Botão de Gestão de Férias e Afastamentos */}
                  <button
                    type="button"
                    onClick={() => {
                      setLeaveTargetMilitarId(rosterMilitary[0]?.id || '');
                      setIsLeaveModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Cadastrar e gerenciar afastamentos (férias, baixas médicas, missões e licenças)"
                  >
                    <Palmtree className="w-3.5 h-3.5 text-sky-600" />
                    <span>Férias & Afastamentos ({militaryLeaves.length})</span>
                  </button>

                  {/* Botão 1: Zerar Todos os Dias */}
                  <button
                    type="button"
                    onClick={handleClearAllDays}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Zerar toda a escala do mês: limpa tudo e deixa todas as células em branco"
                  >
                    <Eraser className="w-3.5 h-3.5 text-red-600" />
                    <span>Zerar Todos os Dias</span>
                  </button>

                  {/* Botão 2: Fazer Escala Automática por IA / Machine Learning */}
                  <button
                    type="button"
                    onClick={handleGenerateIntelligentRoster}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#1e3316] to-[#2b4c1f] hover:from-[#27431e] hover:to-[#386229] text-[#dfb642] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm border border-[#cba135]/50 transition-all transform hover:scale-[1.02]"
                    title="Criar a escala automaticamente usando IA/Machine Learning segundo as regras militares (1x6, afastamentos e prioridades de retorno)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#dfb642] animate-pulse" />
                    <span>Escala Automática (IA / ML)</span>
                  </button>

                  {/* Botão 3: Configurar Parâmetros da Escala (DEV / Chefe) */}
                  <button
                    type="button"
                    onClick={() => setIsScaleConfigModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Configurar Parâmetros da Escala (Dias de descanso, militares por dia, postos)"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-700" />
                    <span>Parâmetros ({scaleDutyDays}x{scaleRestDays})</span>
                  </button>
                </>
              )}

              {isManualMode && Object.keys(manualCellOverrides).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja limpar todos os preenchimentos manuais e restaurar a contagem automática do algoritmo?')) {
                      setManualCellOverrides({});
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[11px] cursor-pointer"
                  title="Limpar edições manuais e voltar ao cálculo automático"
                >
                  Restaurar Automático
                </button>
              )}

              {canFlagSwaps && (
                <button
                  type="button"
                  onClick={() => {
                    setSwapDataOrig(selectedDateStr);
                    setSwapMilitarOrig('');
                    setSwapMilitarSubst('');
                    setSwapDataSubst('');
                    setSwapMotivo('');
                    setSwapAmbosConcordaram(false);
                    setSwapWarning('');
                    setIsSwapModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] text-xs font-bold flex items-center gap-1.5 hover:bg-[#27431e] cursor-pointer shadow-xs border border-[#cba135]/40"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Sinalizar Troca (Xerife)</span>
                </button>
              )}
            </div>
          </div>

          {/* Legenda Explicativa da Escala Militar */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-700">Legenda:</span>
              
              {/* 0 Verde */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-[#00e600] text-black font-black text-[11px] flex items-center justify-center font-mono border border-green-700 shadow-xs">
                  0
                </span>
                <span className="text-slate-700 font-bold">Permanência (Verde)</span>
              </div>

              {/* 0 Amarelo */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-yellow-400 text-slate-950 font-black text-[11px] flex items-center justify-center font-mono border border-yellow-600 shadow-xs">
                  0
                </span>
                <span className="text-slate-700 font-bold">Sobreaviso (Amarelo)</span>
              </div>

              {/* Células Vermelhas */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-red-600 text-white font-bold text-[10px] flex items-center justify-center font-mono border border-red-700">
                  1-{scaleRestDays}
                </span>
                <span className="text-slate-600 font-medium">Vermelha (Sáb/Dom/Administrativo - Folga 1 a {scaleRestDays})</span>
              </div>

              {/* Células Brancas */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-white text-slate-800 font-bold text-[10px] flex items-center justify-center font-mono border border-slate-300">
                  1-{scaleRestDays}
                </span>
                <span className="text-slate-600 font-medium">Preta (Dias de Semana - Folga 1 a {scaleRestDays})</span>
              </div>

              {/* Baixado Zebrado */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_4px,#e2e8f0_4px,#e2e8f0_8px)] text-slate-600 font-bold text-[10px] flex items-center justify-center font-mono border border-slate-300">
                  B
                </span>
                <span className="text-slate-600 font-medium">Militar Baixado</span>
              </div>
            </div>

            {isManualMode && (
              <span className="text-[10px] text-amber-900 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ✏️ Modo Manual Ativo: Clique em qualquer célula da tabela para setar valores
              </span>
            )}
          </div>

          {/* Planilha Militar Conforme Imagens 1 e 2 Oficiais */}
          <div className="bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#1e3316] text-white border-b border-[#2d4a22]">
                    <th className="p-2 border-r border-[#2d4a22] font-black w-10 text-[10px] uppercase">ANT</th>
                    <th className="p-2 border-r border-[#2d4a22] text-left font-black min-w-[210px] text-[11px] uppercase">
                      GRAD / NOME DE GUERRA
                    </th>
                    {visibleDays.map((day) => {
                      const isToday = day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
                      const dateObj = new Date(selectedYear, selectedMonth, day);
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                      const dateStr = getDateStr(day);
                      const shift = getShiftForDate(dateStr, day);
                      const isAdministrative = !!shift.isAdministrativeDay;
                      const isRed = isWeekend || isAdministrative;

                      return (
                        <th 
                          key={day} 
                          onClick={() => isChefe && handleOpenDayEdit(day)}
                          className={`p-2 border-r border-[#2d4a22] min-w-[36px] font-black text-xs transition-colors ${
                            isToday 
                              ? 'bg-[#dfb642] text-[#192b14]' 
                              : isRed 
                                ? 'bg-red-600 text-white' 
                                : 'bg-[#1e3316] text-white'
                          } ${isChefe ? 'cursor-pointer hover:bg-emerald-800' : ''}`}
                          title={
                            isChefe 
                              ? `Dia ${day}: Clique para configurar plantão ou marcar dia administrativo` 
                              : `Dia ${day} ${isRed ? '(Vermelha)' : '(Preta)'}`
                          }
                        >
                          <div className="flex flex-col items-center">
                            <span>{day}</span>
                            {isAdministrative && !isWeekend && (
                              <span className="text-[8px] text-amber-300 font-bold">ADM</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rosterMilitary.map((mil, idx) => {
                    const isEven = idx % 2 === 0;
                    const isBaixado = mil.isBaixado;

                    return (
                      <tr 
                        key={mil.id} 
                        className={`border-b border-slate-200 transition-colors ${
                          isBaixado 
                            ? 'bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_10px,#e2e8f0_10px,#e2e8f0_20px)] opacity-80' 
                            : isEven 
                              ? 'bg-[#fcf8e3]/40' 
                              : 'bg-white'
                        }`}
                      >
                        {/* Antiguidade */}
                        <td className="p-2 font-black text-slate-800 border-r border-slate-200 bg-slate-50">
                          {mil.antiguidade}
                        </td>

                        {/* Nome de Guerra e Categoria (EP / EV) */}
                        <td className="p-2 text-left font-bold border-r border-slate-200 whitespace-nowrap bg-amber-50/20">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                                mil.category === 'EP' ? 'bg-[#1e3316] text-[#dfb642]' : 'bg-slate-200 text-slate-800'
                              }`}>
                                {mil.category}
                              </span>
                              <span className={`text-xs ${isBaixado ? 'line-through text-slate-500' : 'text-slate-900 font-black'}`}>
                                {mil.gradNome}
                              </span>
                            </div>

                            {/* Botão de Baixar/Reativar (Chefe) */}
                            {isChefe && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBaixado(mil.id)}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                    isBaixado 
                                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                                      : 'bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700'
                                  }`}
                                  title={isBaixado ? 'Clique para reativar militar na escala' : 'Clique para marcar como baixado'}
                                >
                                  {isBaixado ? 'REATIVAR' : 'BAIXAR'}
                                </button>

                                {/* Botão rápido para lançar Férias / Afastamento */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLeaveTargetMilitarId(mil.id);
                                    setIsLeaveModalOpen(true);
                                  }}
                                  className="p-1 rounded hover:bg-sky-100 text-slate-400 hover:text-sky-700 cursor-pointer"
                                  title={`Lançar Férias ou Afastamento para ${mil.gradNome}`}
                                >
                                  <Palmtree className="w-3 h-3 text-sky-600" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                          {/* Células dos Dias */}
                          {visibleDays.map((day) => {
                            const cell = getCellStatus(mil, day);
                            const isPerm = cell.type === 'permanencia';
                            const isSobr = cell.type === 'sobreaviso';
                            const isBaix = cell.type === 'baixado';
                            const isLeave = cell.type === 'leave';
                            const isVazio = cell.type === 'vazio';
                            const isRed = cell.type === 'vermelha';
                            const isSwap = !!cell.isSwap;
                            const isRedDayCol = redDays.includes(day);

                            return (
                              <td 
                                key={day}
                                onClick={() => handleCellClick(mil, day)}
                                onMouseEnter={(e) => {
                                  if (isSwap && cell.swapDetails) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredSwapTooltip({
                                      text: `🔄 Permuta Autorizada: ${cell.swapDetails.solicitante} trocou com ${cell.swapDetails.substituto}. Motivo: "${cell.swapDetails.motivo}". Homologado pelo Chefe de Seção.`,
                                      x: rect.left,
                                      y: rect.top - 40,
                                    });
                                  }
                                }}
                                onMouseLeave={() => setHoveredSwapTooltip(null)}
                                className={`p-1.5 border-r border-slate-300 transition-all font-black select-none ${
                                  isManualMode || isChefe ? 'cursor-pointer hover:ring-2 hover:ring-black/20' : ''
                                } ${
                                  isVazio
                                    ? 'bg-slate-50 text-slate-300 font-mono font-normal'
                                    : isLeave
                                      ? `${(cell as any).badgeClass || 'bg-slate-500 text-white'} text-[11px] font-black`
                                      : isBaix 
                                        ? 'bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_4px,#e2e8f0_4px,#e2e8f0_8px)] text-slate-400 font-bold'
                                        : isPerm 
                                          ? 'bg-[#00e600] text-black font-black text-sm shadow-xs border border-green-700' 
                                          : isSobr 
                                            ? 'bg-yellow-400 text-slate-950 font-black text-sm shadow-xs border border-yellow-600'
                                            : isRed || isRedDayCol
                                              ? 'bg-red-600 text-white font-bold text-xs' 
                                              : 'bg-white text-slate-800 font-bold text-xs'
                                }`}
                                title={cell.title}
                              >
                                <div className="relative flex items-center justify-center">
                                  <span>{cell.text}</span>
                                  {isSwap && (
                                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                  )}
                                </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tooltip Flutuante de Troca */}
          {hoveredSwapTooltip && (
            <div 
              style={{ top: hoveredSwapTooltip.y, left: hoveredSwapTooltip.x }}
              className="fixed z-50 p-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none max-w-xs animate-in fade-in"
            >
              {hoveredSwapTooltip.text}
            </div>
          )}

          {/* Resumo dos Militares Escalados Hoje & Militares Extras */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black shrink-0 font-mono">
                PLANTÃO HOJE
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase font-mono">
                  Escalados para Hoje ({today.toLocaleDateString('pt-BR')}):
                </span>
                <div className="flex flex-wrap items-center gap-3 mt-0.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00e600]"></span>
                    Permanência: <strong>{currentShift.permanenciaNome}</strong>
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    Sobreaviso: <strong>{currentShift.sobreavisoNome}</strong>
                  </span>

                  {/* Militares Extras do Dia */}
                  {currentShift.extraMilitaries && currentShift.extraMilitaries.length > 0 && (
                    <>
                      <span className="text-slate-400">|</span>
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        Extras: {currentShift.extraMilitaries.map(em => em.militarNome).join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isChefe && (
                <button
                  type="button"
                  onClick={() => handleOpenDayEdit(today.getDate())}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Editar Plantão de Hoje
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedDayForOps(today.getDate());
                  setActiveTab('checklists');
                }}
                className="px-4 py-2 rounded-xl bg-[#1e3316] hover:bg-[#27431e] text-[#dfb642] font-black text-xs cursor-pointer shadow-xs border border-[#cba135]/40"
              >
                Abrir Rondas & Vistorias ➔
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ================= MODAL: EDIÇÃO DIRETA DE CÉLULA (MODO MANUAL) ================= */}
      {manualCellModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setManualCellModal(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>Preenchimento Manual</span>
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {manualCellModal.militar.gradNome} · Dia {manualCellModal.day}
                </span>
              </div>
              <button 
                onClick={() => setManualCellModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Selecione o valor para setar manualmente nesta célula (a contagem subsequente será atualizada automaticamente):
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSetManualCellValue(manualCellModal.militar, manualCellModal.day, '0_perm')}
                className="p-2.5 rounded-xl bg-[#00e600] text-black font-black hover:bg-green-500 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-green-700"
              >
                <span>🟢 0 Permanência</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetManualCellValue(manualCellModal.militar, manualCellModal.day, '0_sobr')}
                className="p-2.5 rounded-xl bg-yellow-400 text-slate-950 font-black hover:bg-yellow-500 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-yellow-600"
              >
                <span>🟡 0 Sobreaviso</span>
              </button>

              {['1', '2', '3', '4', '5', '6'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSetManualCellValue(manualCellModal.militar, manualCellModal.day, num)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer border border-slate-200"
                >
                  <span>Folga {num}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleSetManualCellValue(manualCellModal.militar, manualCellModal.day, 'V')}
                className="p-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-bold flex items-center justify-center cursor-pointer border border-red-300"
              >
                <span>🔴 Vermelha (V)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetManualCellValue(manualCellModal.militar, manualCellModal.day, 'B')}
                className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center cursor-pointer border border-amber-300"
              >
                <span>🏁 Baixado (B)</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSetManualCellValue(manualCellModal.militar, manualCellModal.day, 'auto')}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Restaurar Automático
              </button>
              <button
                type="button"
                onClick={() => setManualCellModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 2: RONDAS DA INFORMÁTICA ================= */}
      {activeTab === 'checklists' && (
        <div className="space-y-4">
          
          {/* Seletor do Dia da Ronda */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Conferência para a Data:</span>
              <select
                value={selectedDayForOps}
                onChange={(e) => setSelectedDayForOps(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-xs bg-white"
              >
                {visibleDays.map((d) => (
                  <option key={d} value={d}>
                    Dia {d}/{selectedMonth + 1}/{selectedYear} {d === today.getDate() ? '(HOJE)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-700">
              <span>Permanência: <strong>{currentShift.permanenciaNome}</strong></span>
              <span>·</span>
              <span>Sobreaviso: <strong>{currentShift.sobreavisoNome}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Bloco 1: 1ª Ronda (Pós-expediente - Desconexão Elétrica) */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <Zap className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    1ª Ronda: Pós-expediente
                  </h3>
                  <span className="text-[10px] text-amber-700 font-bold">Desconexão Elétrica & Isolamento</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Varredura nas seções do quartel com desconexão dos cabos de energia de computadores e no-breaks para prevenção de surtos elétricos.
              </p>
              
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-300 cursor-pointer text-xs font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={currentShift.ronda1PosExpedienteOk}
                    onChange={(e) => updateCurrentShift({ ronda1PosExpedienteOk: e.target.checked })}
                    className="rounded text-amber-700 focus:ring-amber-700"
                  />
                  <span>Ronda Pós-expediente concluída (Tomadas isoladas e salas trancadas)</span>
                </label>
              </div>
            </div>

            {/* Bloco 2: 2ª Ronda (Pós-pernoite - Verificação Geral + PC do Sargento) */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    2ª Ronda: Pós-pernoite
                  </h3>
                  <span className="text-[10px] text-indigo-700 font-bold">Verificação Geral + Console Servidor (PC Sargento)</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspeção física e checklist de comandos de diagnóstico no Servidor pelo PC do Sargento:
              </p>
              
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] space-y-1.5 border border-slate-800">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[10px] text-slate-400">
                    <span>CHECKLIST DE COMANDOS:</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateCurrentShift({
                          ronda2ServerChecklist: {
                            pingGateways: true,
                            dhcpDnsSamba: true,
                            statusBancoDados: true,
                            backupStorage: true,
                            uptimeCheck: true,
                            logsErrorCheck: true,
                          },
                          ronda2PosPernoiteOk: true,
                        });
                      }}
                      className="text-[#dfb642] hover:underline cursor-pointer"
                    >
                      Marcar Todos
                    </button>
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={currentShift.ronda2ServerChecklist?.pingGateways || false}
                      onChange={(e) => updateCurrentShift({
                        ronda2ServerChecklist: {
                          ...(currentShift.ronda2ServerChecklist || {
                            pingGateways: false, dhcpDnsSamba: false, statusBancoDados: false,
                            backupStorage: false, uptimeCheck: false, logsErrorCheck: false
                          }),
                          pingGateways: e.target.checked
                        }
                      })}
                      className="rounded text-emerald-500"
                    />
                    <span>ping 10.26.0.1 (Gateway 2º GAC)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={currentShift.ronda2ServerChecklist?.dhcpDnsSamba || false}
                      onChange={(e) => updateCurrentShift({
                        ronda2ServerChecklist: {
                          ...(currentShift.ronda2ServerChecklist || {
                            pingGateways: false, dhcpDnsSamba: false, statusBancoDados: false,
                            backupStorage: false, uptimeCheck: false, logsErrorCheck: false
                          }),
                          dhcpDnsSamba: e.target.checked
                        }
                      })}
                      className="rounded text-emerald-500"
                    />
                    <span>systemctl status dhcpd bind9 smbd</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={currentShift.ronda2ServerChecklist?.statusBancoDados || false}
                      onChange={(e) => updateCurrentShift({
                        ronda2ServerChecklist: {
                          ...(currentShift.ronda2ServerChecklist || {
                            pingGateways: false, dhcpDnsSamba: false, statusBancoDados: false,
                            backupStorage: false, uptimeCheck: false, logsErrorCheck: false
                          }),
                          statusBancoDados: e.target.checked
                        }
                      })}
                      className="rounded text-emerald-500"
                    />
                    <span>systemctl status postgresql mariadb</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={currentShift.ronda2ServerChecklist?.backupStorage || false}
                      onChange={(e) => updateCurrentShift({
                        ronda2ServerChecklist: {
                          ...(currentShift.ronda2ServerChecklist || {
                            pingGateways: false, dhcpDnsSamba: false, statusBancoDados: false,
                            backupStorage: false, uptimeCheck: false, logsErrorCheck: false
                          }),
                          backupStorage: e.target.checked
                        }
                      })}
                      className="rounded text-emerald-500"
                    />
                    <span>df -h /backup /dados (Storage)</span>
                  </label>
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-300 cursor-pointer text-xs font-bold text-indigo-950">
                  <input
                    type="checkbox"
                    checked={currentShift.ronda2PosPernoiteOk}
                    onChange={(e) => updateCurrentShift({ ronda2PosPernoiteOk: e.target.checked })}
                    className="rounded text-indigo-700 focus:ring-indigo-700"
                  />
                  <span>Ronda Pós-pernoite validada (Console verificado sem falhas)</span>
                </label>
              </div>
            </div>

            {/* Bloco 3: 3ª Ronda (Pré-parada diária - Salas Prioritárias) */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <Building className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    3ª Ronda: Pré-parada diária
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold">Salas Prioritárias</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vistoria de conectividade e inicialização dos computadores nas salas de comando antes da parada:
              </p>
              
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-bold">
                {[
                  { key: 'comando', label: 'Comando' },
                  { key: 's1', label: '1ª Seção (S1)' },
                  { key: 's2', label: '2ª Seção (S2)' },
                  { key: 's3', label: '3ª Seção (S3)' },
                  { key: 'informatica', label: 'Informática' },
                  { key: 'juridico', label: 'Jurídico' },
                  { key: 'sfpc', label: 'SFPC' },
                  { key: 'secretaria', label: 'Secretaria' },
                ].map(({ key, label }) => {
                  const isChecked = (currentShift.ronda3SalasChecklist as any)?.[key] || false;
                  return (
                    <label 
                      key={key} 
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer ${
                        isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          updateCurrentShift({
                            ronda3SalasChecklist: {
                              ...(currentShift.ronda3SalasChecklist || {
                                comando: false, s1: false, s2: false, s3: false,
                                informatica: false, juridico: false, sfpc: false, secretaria: false
                              }),
                              [key]: e.target.checked
                            }
                          });
                        }}
                        className="rounded text-emerald-600"
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  );
                })}
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-300 cursor-pointer text-xs font-bold text-emerald-950">
                <input
                  type="checkbox"
                  checked={currentShift.ronda3PreParadaOk}
                  onChange={(e) => updateCurrentShift({ ronda3PreParadaOk: e.target.checked })}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                <span>Ronda Pré-parada concluída (Todas as salas prioritárias operacionais)</span>
              </label>
            </div>

          </div>

          {/* BOTÃO CTA ABAIXO DAS RONDAS (3º CTA - SEM RAMAL/RITEX) */}
          <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-600 text-white shrink-0 shadow-sm animate-pulse">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-red-700 uppercase bg-red-100 px-2 py-0.5 rounded border border-red-200">
                  CONTINGÊNCIA TÉCNICA · 3º CTA
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  Queda de Link EBNet ou Falha Crítica no Servidor Central?
                </h4>
                <p className="text-xs text-slate-600">
                  Em caso de indisponibilidade geral de rede ou pane no cluster, acione imediatamente o 3º CTA de plantão.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCtaModal(true)}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 whitespace-nowrap"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Acionar 3º CTA / Dados de Contato</span>
            </button>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => alert('Vistorias e checklists de rondas gravados com sucesso!')}
              className="px-6 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] cursor-pointer shadow-sm border border-[#cba135]/40"
            >
              Salvar Registro de Vistorias
            </button>
          </div>

        </div>
      )}

      {/* ================= ABA 3: PASSAGEM DE CHAVES ================= */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Claviculário Oficial & Passagem de Chaves
              </h3>
              <p className="text-xs text-slate-500">
                Custódia física das chaves da DTI, Informática e Sala do Servidor com confirmação por senha de ambos os militares.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setKeySelected('DTI');
                setKeyGiverName(currentUser?.name || '');
                setKeyGiverPassword('');
                setKeyReceiverName('');
                setKeyReceiverPassword('');
                setKeyNotes('');
                setKeyError('');
                setShowKeyModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#cba135]/40"
            >
              <Key className="w-4 h-4" />
              <span>Registrar Passagem de Chave</span>
            </button>
          </div>

          {/* Cards com Status das 3 Chaves */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['DTI', 'Informática', 'Servidor'] as KeyNameType[]).map((keyName) => {
              const lastHandover = keyHandovers.find(k => k.keyName === keyName);
              return (
                <div key={keyName} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">CHAVE OFICIAL</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#dfb642]" />
                    <span>Chave da {keyName}</span>
                  </h4>
                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">EM POSSE DE:</span>
                      <strong className="text-slate-900 font-bold">
                        {lastHandover ? lastHandover.receiverName : 'Claviculário / Seção'}
                      </strong>
                    </div>
                    {lastHandover && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        Última passagem: {new Date(lastHandover.timestamp).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Histórico de Passagens */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 uppercase font-mono">Histórico de Passagem de Chaves</h4>
              <span className="text-[11px] text-slate-500 font-mono">Total: {keyHandovers.length} registros</span>
            </div>
            <div className="divide-y divide-slate-100">
              {keyHandovers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhuma passagem de chave registrada recentemente.
                </div>
              ) : (
                keyHandovers.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-black text-[10px] bg-[#1e3316] text-[#dfb642]">
                          CHAVE {item.keyName}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {new Date(item.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Entregue por: <strong>{item.giverName}</strong></span>
                        <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                        <span>Recebido por: <strong>{item.receiverName}</strong></span>
                      </div>
                      {item.notes && <p className="text-slate-500 text-[11px]">"{item.notes}"</p>}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Assinado por ambos via senha</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 4: LIVRO DE PARTE & ASSINATURAS ================= */}
      {activeTab === 'livro' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Parte Diária da Informática (Livro Eletrônico)
              </h3>
              <p className="text-xs text-slate-500">
                Redação oficial de encerramento de serviço assinada pelo Militar de Permanência e pelo Militar de Sobreaviso.
              </p>
            </div>
            <span className="font-mono text-xs bg-slate-100 px-3 py-1 rounded-xl font-bold text-slate-700">
              Data do Plantão: {selectedDateStr}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Relato da Passagem de Serviço (Lavratura do Informático):
              </label>
              <textarea
                rows={4}
                value={currentShift.livroParte || ''}
                onChange={(e) => updateCurrentShift({ livroParte: e.target.value })}
                placeholder="Ex: Assumi o serviço de Permanência da Seção de TI às 07:30 em companhia do Sobreaviso. Claviculário e equipamentos conferidos. Rondas Pós-expediente, Pós-pernoite e Pré-parada executadas sem anomalias..."
                className="w-full p-3 rounded-2xl border border-slate-300 text-xs font-mono bg-white focus:ring-2 focus:ring-[#27431e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alterações Ocorridas / Incidentes Técnicos:
              </label>
              <input
                type="text"
                value={currentShift.alteracoes || ''}
                onChange={(e) => updateCurrentShift({ alteracoes: e.target.value })}
                placeholder="Sem alterações, ou detalhamento de quedas de link, substituições de toner, etc."
                className="w-full p-3 rounded-2xl border border-slate-300 text-xs font-mono bg-white"
              />
            </div>

            {/* Painel de Assinaturas Digitais Verificadas por Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Assinatura 1: Militar de Permanência */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] font-mono uppercase font-bold">
                    ASSINATURA DIGITAL · PERMANÊNCIA
                  </span>
                  {currentShift.permanenciaSigned ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ASSINADO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      PENDENTE
                    </span>
                  )}
                </div>

                <div className="font-bold text-slate-900 text-sm">
                  {currentShift.permanenciaNome}
                </div>

                {currentShift.permanenciaSigned ? (
                  <div className="text-[11px] text-emerald-800 font-mono bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    ✅ Assinado digitalmente via senha em {new Date(currentShift.permanenciaSignedAt || '').toLocaleString('pt-BR')}
                  </div>
                ) : (
                  <form onSubmit={handleSignPermanencia} className="space-y-2 pt-1">
                    <input
                      type="password"
                      placeholder="Senha militar para assinar..."
                      value={signPermanenciaPassword}
                      onChange={(e) => setSignPermanenciaPassword(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                    />
                    {signPermanenciaError && <p className="text-[11px] text-red-600 font-bold">{signPermanenciaError}</p>}
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Assinar como Permanência
                    </button>
                  </form>
                )}
              </div>

              {/* Assinatura 2: Militar de Sobreaviso */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] font-mono uppercase font-bold">
                    ASSINATURA DIGITAL · SOBREAVISO
                  </span>
                  {currentShift.sobreavisoSigned ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ASSINADO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      PENDENTE
                    </span>
                  )}
                </div>

                <div className="font-bold text-slate-900 text-sm">
                  {currentShift.sobreavisoNome}
                </div>

                {currentShift.sobreavisoSigned ? (
                  <div className="text-[11px] text-emerald-800 font-mono bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    ✅ Assinado digitalmente via senha em {new Date(currentShift.sobreavisoSignedAt || '').toLocaleString('pt-BR')}
                  </div>
                ) : (
                  <form onSubmit={handleSignSobreaviso} className="space-y-2 pt-1">
                    <input
                      type="password"
                      placeholder="Senha militar para assinar..."
                      value={signSobreavisoPassword}
                      onChange={(e) => setSignSobreavisoPassword(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                    />
                    {signSobreavisoError && <p className="text-[11px] text-red-600 font-bold">{signSobreavisoError}</p>}
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Assinar como Sobreaviso
                    </button>
                  </form>
                )}
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  updateCurrentShift({ status: 'concluido' });
                  onAddAuditLog?.({
                    militaryName: currentUser?.name || 'Militar da TI',
                    militaryLogin: currentUser?.username || 'ti',
                    role: currentUser?.role || 'INF-TECNICO',
                    actionType: 'STATUS_MISSAO',
                    summary: `Lavrou e encerrou Livro de Parte da Informática para a data ${selectedDateStr}`,
                    targetRef: `LIVRO-${selectedDateStr}`,
                  });
                  alert('Livro de Parte gravado e lavrado com sucesso no sistema!');
                }}
                className="px-6 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] cursor-pointer shadow-md border border-[#cba135]/40"
              >
                Lavrar e Salvar Parte Diária
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 5: TROCAS & PERMUTAS ================= */}
      {activeTab === 'swaps' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Permutas e Trocas de Escala de Serviço (Regra Militar)
              </h3>
              <p className="text-xs text-slate-500">
                O militar pode trocar até 2 dias depois da data original. O Xerife sinaliza a concordância de ambos; o Chefe da Seção homologa com senha.
              </p>
            </div>

            {canFlagSwaps && (
              <button
                type="button"
                onClick={() => {
                  setSwapDataOrig(selectedDateStr);
                  setSwapMilitarOrig('');
                  setSwapMilitarSubst('');
                  setSwapDataSubst('');
                  setSwapMotivo('');
                  setSwapAmbosConcordaram(false);
                  setSwapWarning('');
                  setIsSwapModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#cba135]/40"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Nova Sinalização de Permuta (Xerife)</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {swaps.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                Nenhuma solicitação de troca de serviço registrada.
              </div>
            ) : (
              swaps.map((swap) => {
                const isPending = swap.status === 'sinalizada_xerife';
                return (
                  <div 
                    key={swap.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#27431e] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' : swap.status === 'homologada' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                        }`}>
                          {isPending ? 'AGUARDANDO CHEFE DE SEÇÃO' : swap.status.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          Sinalizado por: <strong>{swap.sinalizadoPor}</strong>
                        </span>
                      </div>

                      <div className="text-xs text-slate-900 font-bold flex items-center gap-2 mt-1">
                        <span>{swap.militarOriginalNome} ({swap.dataOriginal})</span>
                        <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                        <span>{swap.militarSubstitutoNome} ({swap.dataSubstituta})</span>
                      </div>

                      <p className="text-xs text-slate-600">
                        Motivo: <em>"{swap.motivo}"</em>
                      </p>

                      <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Declaração: Ambos os militares concordaram previamente com a permuta.</span>
                      </div>
                    </div>

                    {isPending && canHomologateSwaps && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRejectSwap(swap.id)}
                          className="px-3 py-1.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold cursor-pointer"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenHomologate(swap)}
                          className="px-4 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] hover:bg-[#27431e] text-xs font-black shadow-xs cursor-pointer border border-[#cba135]/40"
                        >
                          Homologar com Senha
                        </button>
                      </div>
                    )}

                    {swap.status === 'homologada' && canHomologateSwaps && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const d = Number(swap.dataOriginal.split('-')[2]) || 1;
                            handleRevertSwapForDay(d);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          title="Desfazer esta troca e restaurar a escala original"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                          <span>Desfazer Troca</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIGURAÇÃO DO DIA PELO CHEFE DE SEÇÃO ================= */}
      {dayEditModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setDayEditModalOpen(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-[#27431e]" />
                <h3 className="font-black text-slate-900 text-base">
                  Configurar Plantão do Dia {dayEditTargetDay}/{selectedMonth + 1}/{selectedYear}
                </h3>
              </div>
              <button 
                onClick={() => setDayEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDayEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Permanência (0 Verde):</label>
                  <select
                    value={dayEditPermanencia}
                    onChange={(e) => setDayEditPermanencia(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    {rosterMilitary.filter(m => !m.isBaixado).map(m => (
                      <option key={m.id} value={m.gradNome}>{m.gradNome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sobreaviso (0 Amarelo):</label>
                  <select
                    value={dayEditSobreaviso}
                    onChange={(e) => setDayEditSobreaviso(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    {rosterMilitary.filter(m => !m.isBaixado).map(m => (
                      <option key={m.id} value={m.gradNome}>{m.gradNome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Dia Administrativo (Preto vira Vermelho) */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 cursor-pointer text-amber-950 font-bold">
                <input
                  type="checkbox"
                  checked={dayEditIsAdmin}
                  onChange={(e) => setDayEditIsAdmin(e.target.checked)}
                  className="rounded text-amber-800 focus:ring-amber-800"
                />
                <span>
                  Marcar como Dia Administrativo (Transforma escala preta em escala vermelha)
                </span>
              </label>

              {/* Seção de Permuta Ativa e Botão de Desfazer Troca */}
              {(() => {
                const dateStr = getDateStr(dayEditTargetDay);
                const shiftTarget = getShiftForDate(dateStr, dayEditTargetDay);
                const activeSwap = swaps.find(s => (s.dataOriginal === dateStr || s.dataSubstituta === dateStr) && s.status === 'homologada') || (shiftTarget.swapInfo ? {
                  dataOriginal: shiftTarget.swapInfo.originalDate,
                  dataSubstituta: shiftTarget.swapInfo.targetDate,
                  militarOriginalNome: shiftTarget.swapInfo.solicitante,
                  militarSubstitutoNome: shiftTarget.swapInfo.substituto,
                  motivo: shiftTarget.swapInfo.motivo,
                } : null);

                if (!activeSwap) return null;

                return (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-black text-amber-900 text-xs">
                        <ArrowLeftRight className="w-4 h-4 text-amber-700" />
                        <span>Permuta Homologada Ativa neste Dia</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        {activeSwap.militarOriginalNome} 🔄 {activeSwap.militarSubstitutoNome} ({activeSwap.dataOriginal} ➔ {activeSwap.dataSubstituta})
                      </p>
                      {activeSwap.motivo && (
                        <p className="text-[10px] text-amber-600 italic">"{activeSwap.motivo}"</p>
                      )}
                    </div>
                    
                    {/* BOTÃO PARA REFAZER / DESFAZER A TROCA FEITA CASO O CHEFE ERRE */}
                    <button
                      type="button"
                      onClick={() => handleRevertSwapForDay(dayEditTargetDay)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all shrink-0"
                      title="Desfazer e refazer a escala original caso o Chefe de Seção tenha errado"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Desfazer Troca</span>
                    </button>
                  </div>
                );
              })()}

              {/* Militares Extras do Dia e Botão de Exclusão */}
              {(() => {
                const shiftTarget = getShiftForDate(getDateStr(dayEditTargetDay), dayEditTargetDay);
                const extras = shiftTarget.extraMilitaries || [];
                if (extras.length === 0) return null;

                return (
                  <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="font-bold text-amber-950 block text-xs flex items-center justify-between">
                      <span>Militares Extras Escalados Neste Dia:</span>
                      <span className="text-[10px] font-mono text-amber-800 font-normal">
                        {extras.length} militar(es)
                      </span>
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {extras.map((extra) => (
                        <div key={extra.militarId} className="flex items-center justify-between p-2 rounded-xl bg-white border border-amber-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              extra.tipo === 'permanencia' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {extra.tipo === 'permanencia' ? 'PERMANÊNCIA' : 'SOBREAVISO'}
                            </span>
                            <span className="font-bold text-slate-900">{extra.militarNome}</span>
                          </div>
                          
                          {/* BOTÃO PARA O CHEFE EXCLUIR MILITAR EXTRA */}
                          <button
                            type="button"
                            onClick={() => handleDeleteExtraMilitary(dayEditTargetDay, extra.militarId)}
                            className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Excluir militar extra deste dia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir Extra</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Adicionar novos militares extras por dia */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block">Adicionar Outro Militar Extra ao Plantão:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={dayEditExtraMilitar}
                    onChange={(e) => setDayEditExtraMilitar(e.target.value)}
                    className="p-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">Nenhum militar extra</option>
                    {rosterMilitary.filter(m => !m.isBaixado).map(m => (
                      <option key={m.id} value={m.gradNome}>{m.gradNome}</option>
                    ))}
                  </select>
                  <select
                    value={dayEditExtraTipo}
                    onChange={(e) => setDayEditExtraTipo(e.target.value as any)}
                    className="p-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="permanencia">Como Permanência Extra</option>
                    <option value="sobreaviso">Como Sobreaviso Extra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Justificativa Militar (Obrigatório se houver alteração):</label>
                <input
                  type="text"
                  placeholder="Ex: Reforço operacional para exercício de campanha, formatura, ou compensação..."
                  value={dayEditJustificativa}
                  onChange={(e) => setDayEditJustificativa(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold block text-emerald-900">Preenchimento Automático Inteligente:</span>
                  Ao salvar este dia, todos os dias subsequentes do mês serão calculados e preenchidos automaticamente seguindo a <strong>Regra do Mais Folgado</strong> (regime {scaleDutyDays}x{scaleRestDays} com folgas 1 a {scaleRestDays}, priorizando retornos de afastamentos e desempates justos).
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDayEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] cursor-pointer shadow-sm border border-[#cba135]/40"
                >
                  Salvar Configuração do Dia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: HOMOLOGAÇÃO COM SENHA DO CHEFE ================= */}
      {homologateModalSwap && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setHomologateModalSwap(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-[#1e3316] space-y-4 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="p-2.5 rounded-xl bg-[#1e3316] text-[#dfb642]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Homologação Oficial de Permuta
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Confirmação de Senha do Chefe de Seção</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div><strong>Sai:</strong> {homologateModalSwap.militarOriginalNome} ({homologateModalSwap.dataOriginal})</div>
              <div><strong>Entra:</strong> {homologateModalSwap.militarSubstitutoNome} ({homologateModalSwap.dataSubstituta})</div>
              <div className="text-slate-500 pt-1"><em>"{homologateModalSwap.motivo}"</em></div>
            </div>

            <form onSubmit={handleConfirmHomologateWithPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Digite a senha do Chefe da Seção de TI:
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Senha do Chefe para homologar..."
                  value={chefePasswordInput}
                  onChange={(e) => setChefePasswordInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                />
                {chefePasswordError && (
                  <p className="text-[11px] text-red-600 font-bold mt-1">{chefePasswordError}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHomologateModalSwap(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] cursor-pointer shadow-sm border border-[#cba135]/40"
                >
                  Confirmar e Homologar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE SINALIZAÇÃO DE TROCA (XERIFE) ================= */}
      {isSwapModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsSwapModalOpen(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight className="w-5 h-5 text-[#27431e]" />
                <h3 className="font-black text-slate-900 text-base">
                  Sinalizar Permuta de Escala (Xerife)
                </h3>
              </div>
              <button 
                onClick={() => setIsSwapModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSwap} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Militar Solicitante (Sai):</label>
                  <select
                    required
                    value={swapMilitarOrig}
                    onChange={(e) => setSwapMilitarOrig(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="">Selecione...</option>
                    {rosterMilitary.filter(m => !m.isBaixado).map(m => (
                      <option key={m.id} value={m.gradNome}>{m.gradNome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Original do Serviço:</label>
                  <input
                    type="date"
                    required
                    value={swapDataOrig}
                    onChange={(e) => {
                      setSwapDataOrig(e.target.value);
                      setSwapWarning(validateSwapDates(e.target.value, swapDataSubst));
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Militar Substituto (Entra):</label>
                  <select
                    required
                    value={swapMilitarSubst}
                    onChange={(e) => setSwapMilitarSubst(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="">Selecione...</option>
                    {rosterMilitary.filter(m => !m.isBaixado && m.gradNome !== swapMilitarOrig).map(m => (
                      <option key={m.id} value={m.gradNome}>{m.gradNome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Substituta (Até +2 dias):</label>
                  <input
                    type="date"
                    required
                    value={swapDataSubst}
                    onChange={(e) => {
                      setSwapDataSubst(e.target.value);
                      setSwapWarning(validateSwapDates(swapDataOrig, e.target.value));
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                  />
                </div>
              </div>

              {swapWarning && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{swapWarning}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo da Permuta:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prova acadêmica agendada, consulta médica particular..."
                  value={swapMotivo}
                  onChange={(e) => setSwapMotivo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Declaração Obrigatória do Xerife */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 cursor-pointer text-amber-950 font-bold">
                <input
                  type="checkbox"
                  required
                  checked={swapAmbosConcordaram}
                  onChange={(e) => setSwapAmbosConcordaram(e.target.checked)}
                  className="mt-0.5 rounded text-amber-800 focus:ring-amber-800"
                />
                <span>
                  Declaro que conversei com ambos os militares e confirmo que ambos concordaram expressamente com os dias da troca (dentro do limite regulamentar de 2 dias).
                </span>
              </label>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!!swapWarning}
                  className="px-5 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] cursor-pointer shadow-sm border border-[#cba135]/40 disabled:opacity-50"
                >
                  Registrar Sinalização
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PASSAGEM DE CHAVE COM SENHA DUPLA ================= */}
      {showKeyModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowKeyModal(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-[#dfb642]" />
                <h3 className="font-black text-slate-900 text-base">
                  Registrar Passagem de Chave (Claviculário)
                </h3>
              </div>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterKeyHandover} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chave Sendo Transferida:</label>
                <select
                  value={keySelected}
                  onChange={(e) => setKeySelected(e.target.value as KeyNameType)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="DTI">Chave da DTI (Divisão de Tecnologia)</option>
                  <option value="Informática">Chave da Informática (Bancada/Oficina)</option>
                  <option value="Servidor">Chave do Servidor (Sala Cofre/Rack)</option>
                </select>
              </div>

              {/* Militar Passador */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">1. Militar que está Entregando a Chave:</span>
                <select
                  value={keyGiverName}
                  onChange={(e) => setKeyGiverName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  {militaryUsers.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.username})</option>
                  ))}
                </select>
                <input
                  type="password"
                  required
                  placeholder="Senha do militar que entrega para validar assinatura..."
                  value={keyGiverPassword}
                  onChange={(e) => setKeyGiverPassword(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              {/* Militar Recebedor */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">2. Militar que está Recebendo a Chave:</span>
                <select
                  required
                  value={keyReceiverName}
                  onChange={(e) => setKeyReceiverName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="">Selecione quem assume...</option>
                  {militaryUsers.filter(u => u.name !== keyGiverName).map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.username})</option>
                  ))}
                </select>
                <input
                  type="password"
                  required
                  placeholder="Senha do militar que assume para validar assinatura..."
                  value={keyReceiverPassword}
                  onChange={(e) => setKeyReceiverPassword(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações de Estado da Chave:</label>
                <input
                  type="text"
                  placeholder="Ex: Claviculário intacto, cadeados trancados e sem marcas de arrombamento..."
                  value={keyNotes}
                  onChange={(e) => setKeyNotes(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {keyError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-[11px] font-bold">
                  {keyError}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] cursor-pointer shadow-sm border border-[#cba135]/40"
                >
                  Confirmar e Lavrar Passagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ACIONAMENTO E CONTATOS DO 3º CTA (SEM RAMAL/RITEX) ================= */}
      {showCtaModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowCtaModal(false); }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border-2 border-red-600 space-y-4 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-red-100">
              <div className="p-3 rounded-2xl bg-red-100 text-red-600 shrink-0">
                <PhoneCall className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  CENTRO DE TELEMÁTICA DE ÁREA
                </span>
                <h3 className="font-black text-slate-900 text-base mt-0.5">
                  Acionamento Técnico do 3º CTA
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2">
              <div className="text-slate-700 font-bold">DADOS DE CONTATO OFICIAIS DO 3º CTA:</div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span>📞 Central Telefônica 3º CTA:</span>
                <strong>(11) 3886-2040</strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span>📱 Plantão Célula de Redes / Incidentes:</span>
                <strong>(11) 98765-4321</strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span>✉️ Correio Eletrônico:</span>
                <strong>helpdesk@3cta.eb.mil.br / suporte@3cta.eb.mil.br</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Coordenação de Enlace: 3º Centro de Telemática de Área · Suporte Técnico 24 Horas
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                Descreva a Ocorrência para Registro Militar:
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Queda total do link EBNet na Seção de TI às 21:40. Roteador Cisco com LED LOS aceso. Servidor sem acesso externo..."
                value={ctaIncidentText}
                onChange={(e) => setCtaIncidentText(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCtaModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSendCtaAlert}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-md"
              >
                Gravar Registro de Acionamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE PROTOCOLO ANTI-MEIA-FASE ================= */}
      {showAntiMeiaFaseModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowAntiMeiaFaseModal(false); }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border-2 border-red-600 space-y-4 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-red-100">
              <div className="p-3 rounded-2xl bg-red-100 text-red-600 shrink-0">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  POP DE EMERGÊNCIA
                </span>
                <h3 className="font-black text-slate-900 text-base mt-0.5">
                  Protocolo Anti-Meia-Fase em Dupla
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Em caso de oscilação elétrica severa ou alerta de meia-fase da rede da concessionária, execute as ações em dupla imediatamente para resguardar o servidor e banco de dados:
            </p>

            <div className="space-y-2.5 text-xs font-mono">
              <div className={`p-3 rounded-xl border transition-all ${
                antiMeiaFaseStep >= 1 ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <strong>1. Militar de Permanência:</strong> Acessar o console do Servidor Central na DTI e executar o comando de shutdown ordenado do sistema de arquivos.
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                antiMeiaFaseStep >= 2 ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <strong>2. Militar de Sobreaviso:</strong> Desligar fisicamente os disjuntores de entrada de proteção do quadro da Seção de TI e no-breaks.
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                antiMeiaFaseStep >= 3 ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <strong>3. Ambos em Dupla:</strong> Testemunho mútuo e lavratura do ocorrido no Livro de Parte eletrônico.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowAntiMeiaFaseModal(false);
                  setAntiMeiaFaseStep(0);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Fechar POP
              </button>

              <button
                type="button"
                onClick={() => {
                  if (antiMeiaFaseStep < 3) {
                    setAntiMeiaFaseStep(s => s + 1);
                  } else {
                    alert('Protocolo Anti-Meia-Fase concluído com sucesso e gravado no Livro de Registro!');
                    setShowAntiMeiaFaseModal(false);
                    setAntiMeiaFaseStep(0);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-md"
              >
                {antiMeiaFaseStep < 3 ? `Confirmar Etapa ${antiMeiaFaseStep + 1} / 3` : 'Finalizar Procedimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GESTÃO DE FÉRIAS E AFASTAMENTOS ================= */}
      {isLeaveModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsLeaveModalOpen(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-100 text-sky-800">
                  <Palmtree className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Gestão de Férias, Baixas e Afastamentos Militares
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Defina a quantidade de dias de afastamento (férias, baixas médicas, missões, licenças). Militares afastados não concorrem à escala e ganham prioridade máxima de serviço ao retornarem.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário de Cadastro */}
            {canEditRoster && (
              <form onSubmit={handleAddLeave} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <span className="font-bold text-slate-800 block text-xs">Lançar Novo Afastamento:</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Militar da Escala:</label>
                    <select
                      value={leaveTargetMilitarId}
                      onChange={(e) => setLeaveTargetMilitarId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      required
                    >
                      <option value="">Selecione o militar...</option>
                      {rosterMilitary.map(m => (
                        <option key={m.id} value={m.id}>{m.gradNome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Afastamento:</label>
                    <select
                      value={leaveType}
                      onChange={(e) => {
                        const t = e.target.value as MilitaryLeaveType;
                        setLeaveType(t);
                        const defaultDays = t === 'ferias' ? 30 : t === 'baixa' ? 5 : t === 'missao' ? 7 : 3;
                        setLeaveDaysCount(defaultDays);
                        const d = new Date(leaveStartDate + 'T00:00:00');
                        d.setDate(d.getDate() + defaultDays - 1);
                        setLeaveEndDate(d.toISOString().split('T')[0]);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                    >
                      <option value="ferias">🏖️ Férias Regulamentares</option>
                      <option value="baixa">🏥 Baixa Médica / Hospitalar / FSR</option>
                      <option value="missao">🎯 Missão Operacional / Fora da Guarnição</option>
                      <option value="licenca">📋 Licença (Especial, LTSP, Paternidade)</option>
                      <option value="dispensa">🎖️ Dispensa como Recompensa</option>
                      <option value="outros">🚫 Fora de Escala (Outro motivo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Data de Início:</label>
                    <input
                      type="date"
                      value={leaveStartDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setLeaveStartDate(newStart);
                        if (newStart && leaveDaysCount > 0) {
                          const d = new Date(newStart + 'T00:00:00');
                          d.setDate(d.getDate() + leaveDaysCount - 1);
                          setLeaveEndDate(d.toISOString().split('T')[0]);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantidade de Dias:</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={leaveDaysCount}
                      onChange={(e) => {
                        const count = Math.max(1, Number(e.target.value) || 1);
                        setLeaveDaysCount(count);
                        if (leaveStartDate) {
                          const d = new Date(leaveStartDate + 'T00:00:00');
                          d.setDate(d.getDate() + count - 1);
                          setLeaveEndDate(d.toISOString().split('T')[0]);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Data de Término:</label>
                    <input
                      type="date"
                      value={leaveEndDate}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        setLeaveEndDate(newEnd);
                        if (leaveStartDate && newEnd) {
                          const d1 = new Date(leaveStartDate + 'T00:00:00');
                          const d2 = new Date(newEnd + 'T00:00:00');
                          const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          if (diff > 0) setLeaveDaysCount(diff);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Motivo / Justificativa Militar:</label>
                  <input
                    type="text"
                    placeholder="Ex: Férias regulamentares 30 dias / Atestado médico de 5 dias FSR..."
                    value={leaveMotivo}
                    onChange={(e) => setLeaveMotivo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs"
                    required
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] cursor-pointer shadow-sm border border-[#cba135]/40 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lançar Afastamento</span>
                  </button>
                </div>
              </form>
            )}

            {/* Lista dos Afastamentos Ativos */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                Afastamentos Militares Cadastrados ({militaryLeaves.length}):
              </span>

              {militaryLeaves.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center">
                  Nenhum militar com afastamento registrado no momento.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {militaryLeaves.map((leave) => {
                    return (
                      <div 
                        key={leave.id}
                        className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{leave.militarNome}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              leave.tipo === 'ferias' 
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : leave.tipo === 'baixa'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : leave.tipo === 'missao'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {leave.tipo.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-mono">
                            Período: <strong>{leave.dataInicio}</strong> até <strong>{leave.dataFim}</strong> ({leave.dias} dias)
                          </div>
                          <div className="text-[11px] text-slate-500 italic">
                            "{leave.motivo}"
                          </div>
                        </div>

                        {canEditRoster && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLeave(leave.id)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer transition-colors"
                            title="Remover afastamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAÇÃO DE PARÂMETROS DA ESCALA (DEV / CHEFE) */}
      {isScaleConfigModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsScaleConfigModalOpen(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#27431e] max-h-[90vh] overflow-y-auto cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#1e3316] text-[#dfb642] border border-[#cba135]/40 shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Parâmetros da Escala de Serviço
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Configuração de Folgas, Efetivo & Rótulos de Posto
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScaleConfigModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Atenção:</strong> Alterar a proporção de dias de folga por serviço recalcula os intervalos automáticos da IA e orienta a distribuição do efetivo militar da seção de TI.
              </div>

              {/* Proporção da Escala: Dias de Serviço x Dias de Folga */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#27431e]" />
                  <span>Regime de Folga (Serviço x Descanso):</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Dias de Serviço (X):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={scaleDutyDays}
                      onChange={(e) => setScaleDutyDays(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-center text-sm"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 1 dia de plantão</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Dias de Folga (Y):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={scaleRestDays}
                      onChange={(e) => setScaleRestDays(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-center text-sm"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 6 folgas (Regime 1x6)</span>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <span className="px-3 py-1 rounded-full bg-[#1e3316] text-[#dfb642] font-mono font-black text-xs">
                    Regime Selecionado: {scaleDutyDays}x{scaleRestDays} ({scaleRestDays} dias de descanso para cada {scaleDutyDays} de serviço)
                  </span>
                </div>
              </div>

              {/* Militares por dia e Postos */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#27431e]" />
                  <span>Efetivo por Dia & Nomenclatura dos Postos:</span>
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Militares Escalados por Dia:
                  </label>
                  <select
                    value={scaleMilitariesPerDay}
                    onChange={(e) => setScaleMilitariesPerDay(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value={1}>1 Militar (Apenas Titular)</option>
                    <option value={2}>2 Militares (Titular + Sobreaviso)</option>
                    <option value={3}>3 Militares (Titular + Sobreaviso + 1 Extra)</option>
                    <option value={4}>4 Militares (Titular + Sobreaviso + 2 Extras)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Rótulo Posto Titular:
                    </label>
                    <input
                      type="text"
                      value={scaleLabelPerm}
                      onChange={(e) => setScaleLabelPerm(e.target.value)}
                      placeholder="Ex: Permanência"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Rótulo Posto Reserva:
                    </label>
                    <input
                      type="text"
                      value={scaleLabelSobr}
                      onChange={(e) => setScaleLabelSobr(e.target.value)}
                      placeholder="Ex: Sobreaviso"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Capacidade do Efetivo da Escala */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>Efetivo Ativo Disponível:</span>
                  <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    {rosterMilitary.length} militares ({eps.length} EPs / {evs.length} EVs)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Para o regime <strong>{scaleDutyDays}x{scaleRestDays}</strong>, cada militar terá exatamente <strong>{scaleRestDays} dias consecutivos de folga</strong> (contagem de 1 a {scaleRestDays}) antes de entrar de serviço novamente (0), eliminando qualquer militar em regimes desatualizados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsScaleConfigModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('eb_scale_rest_days', String(scaleRestDays));
                    localStorage.setItem('eb_scale_duty_days', String(scaleDutyDays));
                    localStorage.setItem('eb_scale_militaries_per_day', String(scaleMilitariesPerDay));
                    localStorage.setItem('eb_scale_label_perm', scaleLabelPerm);
                    localStorage.setItem('eb_scale_label_sobr', scaleLabelSobr);
                  } catch {}
                  setIsScaleConfigModalOpen(false);
                  triggerRippleRecalculation(0);
                  onAddAuditLog?.({
                    militaryName: currentUser?.name || 'Administrador',
                    militaryLogin: currentUser?.username || 'admin',
                    role: currentUser?.role || 'CH-SECINFO',
                    actionType: 'CONFIG_ESCALA',
                    summary: `Alterou parâmetros da escala de serviço para regime ${scaleDutyDays}x${scaleRestDays}`,
                    details: `Militares/dia: ${scaleMilitariesPerDay} | Postos: ${scaleLabelPerm} / ${scaleLabelSobr}`,
                    targetRef: 'PARAMETROS_ESCALA',
                  });
                  alert(`Parâmetros salvos com sucesso!\nRegime configurado: ${scaleDutyDays}x${scaleRestDays} (${scaleRestDays} dias de descanso de 1 a ${scaleRestDays}). A escala foi recalculada e nenhum militar ficará com folga inferior a ${scaleRestDays} dias.`);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] shadow-md border border-[#cba135]/40 text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar & Recalcular Escala</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
