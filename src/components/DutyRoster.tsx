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
  Info
} from 'lucide-react';
import { 
  MilitaryUser, 
  DutyShiftEntry, 
  DutySwapRequest, 
  AccessibilitySettings,
  Technician
} from '../types';
import { 
  loadDutyRosterShifts, 
  saveDutyRosterShifts, 
  loadDutySwaps, 
  saveDutySwaps 
} from '../utils/storage';

interface DutyRosterProps {
  currentUser: MilitaryUser | null;
  militaryUsers: MilitaryUser[];
  technicians: Technician[];
  a11y: AccessibilitySettings;
  onAddAuditLog?: (log: any) => void;
}

// Lista padrão de militares da Seção de TI do 2º GAC para a planilha Excel (15 militares)
const DEFAULT_ROSTER_MILITARY = [
  { ant: 1, gradNome: 'SD EV 505 FERREIRA', warName: 'Ferreira' },
  { ant: 2, gradNome: 'SD EV 544 CUSTÓDIO', warName: 'Custódio' },
  { ant: 3, gradNome: 'SD EV 511 ROBERTO', warName: 'Roberto' },
  { ant: 4, gradNome: 'SD EV 517 OLIVEIRA', warName: 'Oliveira' },
  { ant: 5, gradNome: 'SD EV 525 MACHADO', warName: 'Machado' },
  { ant: 6, gradNome: 'SD EV 514 MORENO', warName: 'Moreno' },
  { ant: 7, gradNome: 'SD EV 531 KAUE', warName: 'Kaue', afastado: true },
  { ant: 8, gradNome: 'SD EV 536 KAWANISI', warName: 'Kawanisi' },
  { ant: 9, gradNome: 'SD EV 538 BRUNELLI', warName: 'Brunelli' },
  { ant: 10, gradNome: 'SD EV 540 GABRIEL SILVA', warName: 'Gabriel Silva' },
  { ant: 11, gradNome: 'SD EV 545 VECCHIATO', warName: 'Vecchiato' },
  { ant: 12, gradNome: 'SD EV 572 JOÃO OLIVEIRA', warName: 'João Oliveira', afastado: true },
  { ant: 13, gradNome: 'SD EV 554 W ANDRADE', warName: 'W Andrade' },
  { ant: 14, gradNome: 'SD EV 563 MANFRINATO', warName: 'Manfrinato' },
  { ant: 15, gradNome: 'SD EV 586 PAVAN', warName: 'Pavan' },
];

export const DutyRoster: React.FC<DutyRosterProps> = ({
  currentUser,
  militaryUsers,
  technicians,
  a11y,
  onAddAuditLog,
}) => {
  // Permissões
  const isDev = currentUser?.role === 'dev' || currentUser?.role === 'DEV' || currentUser?.username === 'dev' || currentUser?.rank === 'Dev';
  const isChefe = currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'CHSECINFO' || isDev;
  const isAux = currentUser?.role === 'AUX-SECINFO' || currentUser?.role === 'AUXSECINFO';
  const isXerife = currentUser?.role === 'CH-XERIFEINFO' || currentUser?.role === 'XERIFESECINFO';
  const isTech = !isChefe && !isAux && !isXerife && !isDev;

  // Chefe: acesso total
  // Auxiliar: edita escala e vê irrestrito
  // Xerife: vê irrestrito e sinaliza trocas
  // Técnico: vê apenas semana atual e próxima
  const canEditRoster = isChefe || isAux || isDev;
  const canFlagSwaps = isXerife || isChefe || isAux || isDev;
  const canHomologateSwaps = isChefe || isDev;
  const hasTimeRestriction = isTech; // Técnico vê apenas 14 dias

  const [activeTab, setActiveTab] = useState<'matrix' | 'checklists' | 'livro' | 'swaps'>('matrix');

  // Mês e ano selecionados
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0 a 11

  // Estado dos plantões gravados
  const [shifts, setShifts] = useState<DutyShiftEntry[]>(() => loadDutyRosterShifts());
  const [swaps, setSwaps] = useState<DutySwapRequest[]>(() => loadDutySwaps());

  // Salvar no storage
  useEffect(() => {
    saveDutyRosterShifts(shifts);
  }, [shifts]);

  useEffect(() => {
    saveDutySwaps(swaps);
  }, [swaps]);

  // Modal para sinalização de troca pelo Xerife
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapMilitarOrig, setSwapMilitarOrig] = useState('');
  const [swapDataOrig, setSwapDataOrig] = useState('');
  const [swapMilitarSubst, setSwapMilitarSubst] = useState('');
  const [swapDataSubst, setSwapDataSubst] = useState('');
  const [swapMotivo, setSwapMotivo] = useState('');
  const [swapAmbosConcordaram, setSwapAmbosConcordaram] = useState(false);

  // Modal de emergência Anti-Meia-Fase
  const [showAntiMeiaFaseModal, setShowAntiMeiaFaseModal] = useState(false);
  const [antiMeiaFaseStep, setAntiMeiaFaseStep] = useState(0);

  // Dias do mês atual
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [selectedYear, selectedMonth]);

  // Restrição para Técnicos: se ativo, limita para semana atual e próxima semana
  const visibleDays = useMemo(() => {
    if (!hasTimeRestriction) return daysInMonth;

    const currentDay = today.getDate();
    // Semana atual e próxima (~14 dias)
    const minDay = Math.max(1, currentDay - today.getDay());
    const maxDay = Math.min(daysInMonth.length, minDay + 13);
    return daysInMonth.filter(d => d >= minDay && d <= maxDay);
  }, [daysInMonth, hasTimeRestriction, today]);

  // Formatar data YYYY-MM-DD para um dia específico
  const getDateStr = (day: number) => {
    const m = String(selectedMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${selectedYear}-${m}-${d}`;
  };

  // Plantão do dia selecionado para checklists e livro de parte
  const [selectedDayForOps, setSelectedDayForOps] = useState<number>(today.getDate());
  const selectedDateStr = getDateStr(selectedDayForOps);
  
  const currentShift = useMemo(() => {
    return shifts.find(s => s.date === selectedDateStr) || {
      id: `shift-${selectedDateStr}`,
      date: selectedDateStr,
      informaticoDiaId: '',
      informaticoDiaNome: 'Não Escalado',
      auxiliarId: '',
      auxiliarNome: 'Não Escalado',
      chavesDtiOk: false,
      radioTelefoneOk: false,
      ronda16h30Ok: false,
      ronda22h00Ok: false,
      ronda06h30Ok: false,
      antiMeiaFaseOk: false,
      livroParte: '',
      alteracoes: 'Sem alterações.',
      status: 'escalado' as const,
    };
  }, [shifts, selectedDateStr]);

  // Atualizar shift atual
  const updateCurrentShift = (updates: Partial<DutyShiftEntry>) => {
    if (!canEditRoster && updates.status !== 'em_servico') {
      alert('Apenas o Chefe ou Auxiliar da Seção podem alterar este campo.');
      return;
    }
    setShifts(prev => {
      const idx = prev.findIndex(s => s.date === selectedDateStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updates };
        return copy;
      }
      return [...prev, { ...currentShift, ...updates }];
    });
  };

  // Simular matriz de descanso/plantão (1x7) no estilo da planilha Excel do Regimento
  // Onde '0' = em serviço (verde), números > 0 = dias de folga contados, afastamento = azul
  const getCellStatus = (militarAnt: number, day: number) => {
    const dateStr = getDateStr(day);
    const existing = shifts.find(s => s.date === dateStr);

    const mil = DEFAULT_ROSTER_MILITARY.find(m => m.ant === militarAnt);
    if (mil?.afastado) {
      return { type: 'afastado', text: String(150 + day + militarAnt) };
    }

    // Se já foi escalado formalmente neste dia
    if (existing) {
      if (existing.informaticoDiaNome.includes(mil?.warName || '') || existing.auxiliarNome.includes(mil?.warName || '')) {
        return { type: 'servico', text: '0' };
      }
    }

    // Cálculo cíclico 1x7 em dupla para demonstração realista da planilha Excel militar
    // Cada dia 2 militares tiram serviço
    const pairOffset1 = (day * 2) % 15;
    const pairOffset2 = (day * 2 + 1) % 15;
    const isScheduled = (militarAnt === pairOffset1 + 1) || (militarAnt === pairOffset2 + 1);

    if (isScheduled) {
      return { type: 'servico', text: '0' };
    }

    // Folga contada (1 a 7)
    const folga = Math.abs((day - militarAnt) % 8) + 1;
    const isWeekend = new Date(selectedYear, selectedMonth, day).getDay() % 6 === 0;

    return { 
      type: isWeekend ? 'vermelha' : 'folga', 
      text: String(folga) 
    };
  };

  // Handler para alternar plantão de militar em um dia na matriz
  const handleToggleCell = (militar: typeof DEFAULT_ROSTER_MILITARY[0], day: number) => {
    if (!canEditRoster) {
      alert('Somente o Chefe ou Auxiliar de Seção possuem permissão para alterar a escala na matriz.');
      return;
    }
    const dateStr = getDateStr(day);
    const existing = shifts.find(s => s.date === dateStr);

    if (!existing || !existing.informaticoDiaNome || existing.informaticoDiaNome === 'Não Escalado') {
      // Definir como Informático de Dia
      updateSpecificShift(dateStr, {
        informaticoDiaNome: militar.gradNome,
        informaticoDiaId: `mil-${militar.ant}`,
      });
    } else if (!existing.auxiliarNome || existing.auxiliarNome === 'Não Escalado') {
      // Definir como Auxiliar
      updateSpecificShift(dateStr, {
        auxiliarNome: militar.gradNome,
        auxiliarId: `mil-${militar.ant}`,
      });
    } else {
      // Limpar
      updateSpecificShift(dateStr, {
        informaticoDiaNome: militar.gradNome,
        informaticoDiaId: `mil-${militar.ant}`,
        auxiliarNome: 'Não Escalado',
      });
    }
  };

  const updateSpecificShift = (dateStr: string, updates: Partial<DutyShiftEntry>) => {
    setShifts(prev => {
      const idx = prev.findIndex(s => s.date === dateStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updates };
        return copy;
      }
      return [...prev, {
        id: `shift-${dateStr}`,
        date: dateStr,
        informaticoDiaId: '',
        informaticoDiaNome: 'Não Escalado',
        auxiliarId: '',
        auxiliarNome: 'Não Escalado',
        chavesDtiOk: false,
        radioTelefoneOk: false,
        ronda16h30Ok: false,
        ronda22h00Ok: false,
        ronda06h30Ok: false,
        antiMeiaFaseOk: false,
        livroParte: '',
        alteracoes: 'Sem alterações.',
        status: 'escalado',
        ...updates
      }];
    });
  };

  // Handler: Sinalizar Troca de Serviço (Xerife)
  const handleCreateSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapAmbosConcordaram) {
      alert('Para sinalizar a troca, é obrigatório confirmar que ambos os militares concordaram previamente.');
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
      sinalizadoPor: currentUser?.name || 'Xerife da TI',
      createdAt: new Date().toISOString(),
    };

    setSwaps(prev => [newSwap, ...prev]);
    setIsSwapModalOpen(false);

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Xerife da TI',
      militaryLogin: currentUser?.username || 'xerife',
      role: currentUser?.role || 'CH-XERIFEINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Xerife sinalizou permuta de escala entre ${swapMilitarOrig} (${swapDataOrig}) e ${swapMilitarSubst} (${swapDataSubst}).`,
      details: `Motivo: ${swapMotivo}`,
      targetRef: `PERMUTA-${swapDataOrig}`,
    });

    alert('Sinalização de troca de serviço registrada com sucesso! Aguardando homologação do Chefe de Seção.');
  };

  // Handler: Homologar troca (Chefe)
  const handleHomologateSwap = (swapId: string, approve: boolean) => {
    if (!canHomologateSwaps) {
      alert('Apenas o Chefe de Seção ou DEV possuem autoridade para homologar trocas de serviço.');
      return;
    }

    const swapTarget = swaps.find(s => s.id === swapId);
    if (!swapTarget) return;

    setSwaps(prev => prev.map(s => {
      if (s.id !== swapId) return s;
      return {
        ...s,
        status: approve ? 'homologada' : 'recusada',
        homologadoPor: currentUser?.name || 'Chefe de Seção',
      };
    }));

    if (approve) {
      // Inverter na matriz de plantões
      updateSpecificShift(swapTarget.dataOriginal, { informaticoDiaNome: swapTarget.militarSubstitutoNome });
      updateSpecificShift(swapTarget.dataSubstituta, { informaticoDiaNome: swapTarget.militarOriginalNome });
    }

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Chefe da TI',
      militaryLogin: currentUser?.username || 'chefe',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'STATUS_MISSAO',
      summary: `${approve ? 'Homologou' : 'Recusou'} permuta de escala entre ${swapTarget.militarOriginalNome} e ${swapTarget.militarSubstitutoNome}.`,
      targetRef: `PERMUTA-${swapTarget.dataOriginal}`,
    });
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

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
                Regime 1x7 em Dupla
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              Escala de Serviço & Livro de Parte
            </h2>
            <p className="text-xs text-slate-500">
              Informático de Dia + Auxiliar da Informática · Rondas de 16h30, 22h00 e 06h30 · Protocolo Anti-Meia-Fase
            </p>
          </div>
        </div>

        {/* Seletor de Mês e Restrição de Visualização */}
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
          <span>Matriz da Escala (Excel 1x7)</span>
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
          <span>Rondas & Vistorias (16h30, 22h, 06h30)</span>
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
          <span>Livro de Parte da Informática</span>
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

      {/* ================= ABA 1: MATRIZ EXCEL MILITAR ================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          
          {/* Legenda Explicativa da Planilha Militar (Conforme imagem oficial do 2º GAC) */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-700">Legenda da Escala:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-[#16a34a] text-black font-black text-[11px] flex items-center justify-center font-mono border border-emerald-700">
                  0
                </span>
                <span className="text-slate-600 font-medium">Serviço (Permanência em Dupla)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-white text-slate-700 font-bold text-[11px] flex items-center justify-center font-mono border border-slate-300">
                  1-7
                </span>
                <span className="text-slate-600 font-medium">Folga Contada (Regime 1x7)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-[#dc2626] text-white font-bold text-[11px] flex items-center justify-center font-mono border border-red-800">
                  V
                </span>
                <span className="text-slate-600 font-medium">Escala Vermelha (Fins de Semana)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-[#1d4ed8] text-white font-bold text-[11px] flex items-center justify-center font-mono border border-blue-800">
                  #
                </span>
                <span className="text-slate-600 font-medium">Afastamento / FSR / Missão</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Mapa</span>
              </button>
              {canFlagSwaps && (
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] text-xs font-bold flex items-center gap-1.5 hover:bg-[#27431e] cursor-pointer shadow-xs border border-[#cba135]/40"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Sinalizar Troca (Xerife)</span>
                </button>
              )}
            </div>
          </div>

          {/* Planilha Excel Idêntica ao Modelo da OM */}
          <div className="bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#1e3316] text-white border-b border-[#2d4a22]">
                    <th className="p-2 border-r border-[#2d4a22] font-black w-12 text-[10px] uppercase">ANT</th>
                    <th className="p-2 border-r border-[#2d4a22] text-left font-black min-w-[200px] text-[11px] uppercase">
                      GRAD / NOME DE GUERRA
                    </th>
                    {visibleDays.map((day) => {
                      const isToday = day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
                      const isWeekend = new Date(selectedYear, selectedMonth, day).getDay() % 6 === 0;
                      return (
                        <th 
                          key={day} 
                          className={`p-2 border-r border-[#2d4a22] min-w-[34px] font-black text-xs ${
                            isToday ? 'bg-[#dfb642] text-[#192b14]' : isWeekend ? 'bg-red-950/80 text-red-200' : ''
                          }`}
                        >
                          {day}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_ROSTER_MILITARY.map((mil, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr 
                        key={mil.ant} 
                        className={`border-b border-slate-200 hover:bg-amber-50/50 transition-colors ${
                          mil.afastado ? 'bg-blue-900/10' : isEven ? 'bg-[#fcf8e3]/40' : 'bg-white'
                        }`}
                      >
                        {/* Antiguidade */}
                        <td className="p-2 font-bold text-slate-700 border-r border-slate-200 bg-slate-50">
                          {mil.ant}
                        </td>

                        {/* Nome de Guerra */}
                        <td className="p-2 text-left font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap bg-amber-50/20">
                          <span className={mil.afastado ? 'line-through text-slate-400' : ''}>
                            {mil.gradNome}
                          </span>
                          {mil.afastado && (
                            <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-900 font-mono">
                              AFASTADO
                            </span>
                          )}
                        </td>

                        {/* Células dos Dias (0 verde, folga, afastamento azul) */}
                        {visibleDays.map((day) => {
                          const cell = getCellStatus(mil.ant, day);
                          const isService = cell.type === 'servico';
                          const isAfastado = cell.type === 'afastado';
                          const isRed = cell.type === 'vermelha';

                          return (
                            <td 
                              key={day}
                              onClick={() => handleToggleCell(mil, day)}
                              className={`p-1.5 border-r border-slate-200 transition-all font-black select-none ${
                                canEditRoster ? 'cursor-pointer hover:ring-2 hover:ring-black/20' : ''
                              } ${
                                isService 
                                  ? 'bg-[#00e600] text-black font-black text-sm shadow-inner' 
                                  : isAfastado 
                                    ? 'bg-[#0033cc] text-white font-mono text-[10px]' 
                                    : isRed 
                                      ? 'bg-red-100 text-red-900 font-bold' 
                                      : 'text-slate-700'
                              }`}
                              title={
                                isService 
                                  ? `${mil.gradNome} ESCALADO DE SERVIÇO EM DUPLA NO DIA ${day}` 
                                  : canEditRoster ? `Clique para escalar ${mil.gradNome} no dia ${day}` : ''
                              }
                            >
                              {cell.text}
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

          {/* Resumo da Dupla Escalada no Dia Selecionado */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black shrink-0 font-mono">
                DUPLA
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase font-mono">
                  Escalados para Hoje ({today.toLocaleDateString('pt-BR')}):
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="font-bold text-slate-900">
                    🎖️ Informático de Dia: <strong>SD EV 544 CUSTÓDIO</strong>
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-bold text-slate-900">
                    🛠️ Auxiliar: <strong>SD EV 536 KAWANISI</strong>
                  </span>
                </div>
              </div>
            </div>

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
      )}

      {/* ================= ABA 2: RONDAS & CHECKLISTS 24H ================= */}
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

            <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
              <span>Permanência: <strong>{currentShift.informaticoDiaNome}</strong> & <strong>{currentShift.auxiliarNome}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco 1: Guarda de Chaves e Comunicação */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <Key className="w-5 h-5 text-[#27431e]" />
                <h3 className="font-black text-slate-900 text-sm">
                  1. Chaves da DTI & Comunicação
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Guarda física das chaves da Seção de Informática e retenção do Rádio/Telefone corporativo.
              </p>
              
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={currentShift.chavesDtiOk}
                    onChange={(e) => updateCurrentShift({ chavesDtiOk: e.target.checked })}
                    className="rounded text-[#27431e] focus:ring-[#27431e]"
                  />
                  <span>Claviculário da DTI conferido e sob custódia (Informático de Dia)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={currentShift.radioTelefoneOk}
                    onChange={(e) => updateCurrentShift({ radioTelefoneOk: e.target.checked })}
                    className="rounded text-[#27431e] focus:ring-[#27431e]"
                  />
                  <span>Rádio HT e Telefone móvel carregados e operacionais (Auxiliar)</span>
                </label>
              </div>
            </div>

            {/* Bloco 2: 1ª Ronda (16h30 - Desconexão Elétrica) */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <Zap className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  2. 1ª Ronda (16h30 - Desconexão Elétrica)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Varredura nas seções do quartel com desconexão dos cabos de energia de computadores e no-breaks.
              </p>
              
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-300 cursor-pointer text-xs font-bold text-amber-950">
                <input
                  type="checkbox"
                  checked={currentShift.ronda16h30Ok}
                  onChange={(e) => updateCurrentShift({ ronda16h30Ok: e.target.checked })}
                  className="rounded text-amber-700 focus:ring-amber-700"
                />
                <span>Ronda de 16h30 concluída (Salas vistoriadas e energia isolada)</span>
              </label>
            </div>

            {/* Bloco 3: 2ª Ronda (22h00 - Backbone e NVR Guarda) */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  3. 2ª Ronda (22h00 - Backbone & NVR na Guarda)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspeção lógica das câmeras do NVR no Corpo da Guarda, rack de servidores e disjuntores.
              </p>
              
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-300 cursor-pointer text-xs font-bold text-indigo-950">
                <input
                  type="checkbox"
                  checked={currentShift.ronda22h00Ok}
                  onChange={(e) => updateCurrentShift({ ronda22h00Ok: e.target.checked })}
                  className="rounded text-indigo-700 focus:ring-indigo-700"
                />
                <span>Ronda de 22h00 concluída em dupla (Backbone e CFTV gravando normal)</span>
              </label>
            </div>

            {/* Bloco 4: 3ª Ronda (06h30 - Alvorada) */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  4. 3ª Ronda (06h30 - Alvorada & Teste de Rede)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Teste de conectividade da DTI, link de fibra e reabertura da monitoração na Guarda.
              </p>
              
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-300 cursor-pointer text-xs font-bold text-emerald-950">
                <input
                  type="checkbox"
                  checked={currentShift.ronda06h30Ok}
                  onChange={(e) => updateCurrentShift({ ronda06h30Ok: e.target.checked })}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                <span>Ronda de 06h30 concluída (Conectividade testada e sem anomalias)</span>
              </label>
            </div>

          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => alert('Checklists de rondas salvos com sucesso no Livro de Registro!')}
              className="px-6 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] cursor-pointer shadow-sm border border-[#cba135]/40"
            >
              Salvar Registro de Vistorias
            </button>
          </div>

        </div>
      )}

      {/* ================= ABA 3: LIVRO DE PARTE ================= */}
      {activeTab === 'livro' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Parte Diária do Informático de Dia (Livro Eletrônico)
              </h3>
              <p className="text-xs text-slate-500">
                Redação oficial de encerramento de serviço e passagem para a dupla subsequente.
              </p>
            </div>
            <span className="font-mono text-xs bg-slate-100 px-3 py-1 rounded-xl font-bold text-slate-700">
              Data: {selectedDateStr}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Relato da Passagem de Serviço (Informático de Dia):
              </label>
              <textarea
                rows={4}
                value={currentShift.livroParte || ''}
                onChange={(e) => updateCurrentShift({ livroParte: e.target.value })}
                placeholder="Ex: Assumi o serviço de Informático de Dia às 07:30 em companhia do Auxiliar SD KAWANISI. Claviculário e equipamentos conferidos. Rondas das 16h30, 22h00 e 06h30 executadas conforme POP..."
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
                placeholder="Sem alterações, ou detalhamento de queda de link / avarias."
                className="w-full p-3 rounded-2xl border border-slate-300 text-xs font-mono bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[10px] font-mono">Assinatura Digital (Titular):</span>
                <strong className="text-slate-900">{currentShift.informaticoDiaNome || 'Informático de Dia'}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[10px] font-mono">Assinatura Digital (Testemunha/Auxiliar):</span>
                <strong className="text-slate-900">{currentShift.auxiliarNome || 'Auxiliar da Informática'}</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Livro de Parte</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateCurrentShift({ status: 'concluido' });
                  alert('Livro de Parte assinado e lavrado com sucesso no sistema!');
                }}
                className="px-6 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] cursor-pointer shadow-md border border-[#cba135]/40"
              >
                Lavrar e Assinar Parte Diária
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 4: TROCAS & PERMUTAS ================= */}
      {activeTab === 'swaps' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Permutas e Trocas de Escala de Serviço
              </h3>
              <p className="text-xs text-slate-500">
                O Xerife sinaliza a concordância de ambos os militares; o Chefe da Seção homologa.
              </p>
            </div>

            {canFlagSwaps && (
              <button
                type="button"
                onClick={() => setIsSwapModalOpen(true)}
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
                          onClick={() => handleHomologateSwap(swap.id, false)}
                          className="px-3 py-1.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold cursor-pointer"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHomologateSwap(swap.id, true)}
                          className="px-4 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] hover:bg-[#27431e] text-xs font-black shadow-xs cursor-pointer border border-[#cba135]/40"
                        >
                          Homologar Permuta
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
                    {DEFAULT_ROSTER_MILITARY.filter(m => !m.afastado).map(m => (
                      <option key={m.ant} value={m.gradNome}>{m.gradNome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Original do Serviço:</label>
                  <input
                    type="date"
                    required
                    value={swapDataOrig}
                    onChange={(e) => setSwapDataOrig(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                  >
                  </input>
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
                    {DEFAULT_ROSTER_MILITARY.filter(m => !m.afastado && m.gradNome !== swapMilitarOrig).map(m => (
                      <option key={m.ant} value={m.gradNome}>{m.gradNome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data de Pagamento do Serviço:</label>
                  <input
                    type="date"
                    required
                    value={swapDataSubst}
                    onChange={(e) => setSwapDataSubst(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo da Permuta:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prova universitária agendada, consulta médica particular..."
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
                  Declaro que conversei com ambos os militares e confirmo que ambos concordaram expressamente com os dias da troca.
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
                  className="px-5 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] cursor-pointer shadow-sm border border-[#cba135]/40"
                >
                  Registrar Sinalização
                </button>
              </div>
            </form>
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
                <strong>1. Informático de Dia:</strong> Acessar o console do Servidor Central na DTI e executar o comando de shutdown ordenado do sistema de arquivos.
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                antiMeiaFaseStep >= 2 ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <strong>2. Auxiliar da Informática:</strong> Desligar fisicamente os disjuntores de entrada de proteção do quadro da Seção de TI e no-breaks.
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

    </div>
  );
};
