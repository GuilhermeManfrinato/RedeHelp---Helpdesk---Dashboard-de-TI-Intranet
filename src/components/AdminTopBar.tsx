import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Tv, 
  MessageSquare, 
  LogOut, 
  Layers, 
  Laptop, 
  Users,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Shield,
  UserCheck,
  Target,
  ZoomIn,
  ZoomOut,
  Eye,
  Bell,
  Sliders,
  RotateCcw,
  Calendar,
  X
} from 'lucide-react';
import { AccessibilitySettings, MilitaryUser, AdminTab, Ticket, Department } from '../types';
import { RegimentoDeodoroLogo } from './RegimentoDeodoroLogo';
import { DoubtsModal } from './DoubtsModal';

interface AdminTopBarProps {
  adminTab: AdminTab;
  onToggleMobileSidebar: () => void;
  unreadMessagesCount: number;
  onOpenTvMode?: () => void;
  onLogoutAdmin: () => void;
  criticalCount: number;
  onFilterCritical?: () => void;
  currentUser?: MilitaryUser | null;
  tickets?: Ticket[];
  departments?: Department[];
  onOpenTicketWithDoubts?: (ticket: Ticket) => void;
  onFilterByDoubts?: () => void;
  isFilterDoubtsActive?: boolean;
  a11y?: AccessibilitySettings;
  onUpdateA11y?: (updater: (prev: AccessibilitySettings) => AccessibilitySettings) => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  adminTab,
  onToggleMobileSidebar,
  unreadMessagesCount,
  onLogoutAdmin,
  criticalCount,
  onFilterCritical,
  currentUser,
  tickets = [],
  departments = [],
  onOpenTicketWithDoubts,
  onFilterByDoubts,
  isFilterDoubtsActive = false,
  a11y,
  onUpdateA11y,
}) => {
  const isDev = currentUser?.role === 'dev' || currentUser?.role === 'DEV' || currentUser?.username === 'dev';
  const [clockOffsetMs, setClockOffsetMs] = useState<number>(() => {
    const saved = localStorage.getItem('redehelp_dev_clock_offset');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [timeStr, setTimeStr] = useState<string>('');
  const [nowDate, setNowDate] = useState<Date>(new Date());
  const [showDoubtsModal, setShowDoubtsModal] = useState<boolean>(false);
  const [showExpedienteAlert, setShowExpedienteAlert] = useState<boolean>(false);
  const [showDevClockModal, setShowDevClockModal] = useState<boolean>(false);
  const [devCustomTimeInput, setDevCustomTimeInput] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date(Date.now() + clockOffsetMs);
      setNowDate(now);
      setTimeStr(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

      // Verificar alerta das 15:30 (aviso de fim de expediente em 15 minutos)
      const hour = now.getHours();
      const minute = now.getMinutes();
      if (hour === 15 && minute >= 30 && minute <= 45) {
        const key = `eb_exp_alert_${now.toDateString()}`;
        if (sessionStorage.getItem(key) !== 'true') {
          setShowExpedienteAlert(true);
        }
      }
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [clockOffsetMs]);

  const currentHour = nowDate.getHours();
  // Regra Militar: antes das 08:00 e a partir das 16:00 é fora de expediente / ausente (dormindo 💤)
  const isOffHours = currentHour < 8 || currentHour >= 16;
  // Intervalo de almoço: 12:00 às 13:00 (prato de comida 🍽️)
  const isLunch = !isOffHours && currentHour === 12;

  const dayName = nowDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  const formattedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const dateFormatted = nowDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getTabTitle = () => {
    switch (adminTab) {
      case 'it':
        return {
          title: 'Fila de Atendimento da TI',
          subtitle: 'Triagem, bancada técnica e histórico de ordens',
          icon: <Layers className="w-5 h-5 text-[#27431e]" />
        };
      case 'notebooks':
        return {
          title: 'Cautela de Notebooks',
          subtitle: 'Registro de cautelas, descautelas e conferência de CTI',
          icon: <Laptop className="w-5 h-5 text-[#27431e]" />
        };
      case 'missions':
        return {
          title: 'Missões & Ordens de Operações da TI',
          subtitle: 'Escalações técnicas e tiragem de faltas da Seção',
          icon: <Target className="w-5 h-5 text-[#27431e]" />
        };
      case 'technicians':
        return {
          title: 'Gestão de Militares & Auditoria',
          subtitle: 'Cadastro de login/senha individual e logs detalhados',
          icon: <Users className="w-5 h-5 text-[#27431e]" />
        };
      case 'duty_roster':
        return {
          title: 'Escala de Serviço & Livro de Parte',
          subtitle: 'Informático de Dia em dupla (1x7), rondas e passagem de serviço',
          icon: <ShieldCheck className="w-5 h-5 text-[#27431e]" />
        };
    }
  };

  const { title } = getTabTitle();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'CH-SECINFO':
      case 'CHSECINFO':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'AUX-SECINFO':
      case 'AUXSECINFO':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'CH-XERIFEINFO':
      case 'XERIFESECINFO':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'CH-TECNICOINFO':
      case 'TECINFO':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'CH-TVINFO':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };


  const cycleFontSize = (direction: 'increase' | 'decrease') => {
    if (!onUpdateA11y) return;
    onUpdateA11y(prev => {
      if (direction === 'increase') {
        if (prev.fontSize === 'normal') return { ...prev, fontSize: 'large' };
        if (prev.fontSize === 'large') return { ...prev, fontSize: 'extralarge' };
        return prev;
      } else {
        if (prev.fontSize === 'extralarge') return { ...prev, fontSize: 'large' };
        if (prev.fontSize === 'large') return { ...prev, fontSize: 'normal' };
        return prev;
      }
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-8 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 shadow-xs">
      
      {/* Lado Esquerdo: Botão Mobile & Título */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
          title="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="hidden sm:flex p-1.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <RegimentoDeodoroLogo size={32} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider text-[#27431e] bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-200 truncate">
                2º GAC
              </span>
            </div>
            <h1 className="text-sm sm:text-xl font-black text-slate-900 leading-tight truncate">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Lado Direito: Perfil do Militar, Notificações & Atalhos */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        
        {/* Identificação do Militar Conectado */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="w-7 h-7 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-[11px] flex items-center justify-center border border-[#cba135]/40 shrink-0">
              {currentUser.warName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-900 block leading-tight text-xs">
                {currentUser.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-1.5 py-0.2 rounded font-mono font-black text-[9px] border ${getRoleBadge(currentUser.role)}`}>
                  {currentUser.role}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botão Interativo "Dúvidas: [X]" com Abertura da Lista de Notificações */}
        <button
          type="button"
          onClick={() => setShowDoubtsModal(true)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
            unreadMessagesCount > 0
              ? 'bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-950 animate-pulse'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
          }`}
          title="Clique para ver todos os chamados com perguntas e notificações dos solicitantes"
        >
          <MessageSquare className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${unreadMessagesCount > 0 ? 'text-amber-700' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Dúvidas:</span>
          <span className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] sm:text-[11px] font-black ${
            unreadMessagesCount > 0 ? 'bg-amber-600 text-white' : 'bg-slate-300 text-slate-700'
          }`}>
            {unreadMessagesCount}
          </span>
        </button>

        {/* Controle Sincronizado de Acessibilidade (Tamanho da Fonte & Contraste) */}
        {a11y && onUpdateA11y && (
          <div className="hidden sm:flex items-center rounded-xl border border-slate-300 overflow-hidden divide-x divide-slate-300 bg-slate-50">
            <button
              onClick={() => cycleFontSize('decrease')}
              disabled={a11y.fontSize === 'normal'}
              title="Diminuir tamanho da letra e botões"
              className="px-2 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="px-2 py-1 text-xs font-mono font-bold select-none text-[#1e3316]">
              {a11y.fontSize === 'normal' ? 'A' : a11y.fontSize === 'large' ? 'A+' : 'A++'}
            </div>
            <button
              onClick={() => cycleFontSize('increase')}
              disabled={a11y.fontSize === 'extralarge'}
              title="Aumentar tamanho da letra e botões"
              className="px-2 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Relógio Digital & Indicador de Expediente Militar com Data e Dia da Semana ALINHADOS */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#27431e]" />
            <span>{formattedDay}, {dateFormatted}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <div 
              className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
                isOffHours 
                  ? 'bg-indigo-950 text-indigo-200 border-indigo-700' 
                  : isLunch 
                    ? 'bg-amber-100 text-amber-950 border-amber-300' 
                    : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={
                isOffHours 
                  ? 'Fora de Expediente Militar (Antes das 08:00 ou após as 16:00) - Modo Ausente' 
                  : isLunch 
                    ? 'Horário de Almoço (12:00 às 13:00) - Intervalo da Seção' 
                    : 'Expediente Militar Ativo'
              }
            >
              {isOffHours ? (
                <span className="text-sm" role="img" aria-label="dormindo">💤</span>
              ) : isLunch ? (
                <span className="text-sm" role="img" aria-label="almoco">🍽️</span>
              ) : (
                <Clock className="w-3.5 h-3.5 text-[#27431e]" />
              )}
              <span>{timeStr}</span>
              {isOffHours && (
                <span className="text-[10px] bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded font-sans font-bold">
                  Ausente
                </span>
              )}
              {isLunch && (
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-sans font-bold">
                  Almoço
                </span>
              )}
              {clockOffsetMs !== 0 && (
                <span className="text-[9px] bg-purple-200 text-purple-900 px-1 rounded font-mono font-black" title="Horário Simulado pelo Desenvolvedor">
                  SIM
                </span>
              )}
            </div>

            {/* Simulador manual exclusivo do DEV */}
            {isDev && (
              <button
                type="button"
                onClick={() => setShowDevClockModal(true)}
                className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#1e3316] transition-colors cursor-pointer"
                title="Módulo de Simulação de Relógio (Exclusivo DEV)"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sair */}
        <button
          onClick={onLogoutAdmin}
          className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
          title="Encerrar sessão militar"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Alerta de 15 minutos para encerramento de expediente (15:30) */}
      {showExpedienteAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-amber-500 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-3xl">
              ⏰
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                15:30 · Aviso de Encerramento
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Expediente encerra em 15 minutos!
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                <strong>Atenção Técnicos de TI e Xerife:</strong> Favor organizar e arrumar a Seção de Informática e lembrar da <strong>tiragem de falta final do expediente</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem(`eb_exp_alert_${new Date().toDateString()}`, 'true');
                setShowExpedienteAlert(false);
              }}
              className="w-full py-3 rounded-2xl bg-[#1e3316] hover:bg-[#27431e] text-[#dfb642] font-black text-xs uppercase tracking-wider border border-[#cba135] shadow-md cursor-pointer transition-colors"
            >
              Ciente / Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Exibição de Chamados com Dúvidas/Notificações */}
      <DoubtsModal
        isOpen={showDoubtsModal}
        onClose={() => setShowDoubtsModal(false)}
        tickets={tickets}
        departments={departments}
        onOpenTicket={(ticket) => {
          setShowDoubtsModal(false);
          if (onOpenTicketWithDoubts) {
            onOpenTicketWithDoubts(ticket);
          }
        }}
        onFilterByDoubts={() => {
          if (onFilterByDoubts) {
            onFilterByDoubts();
          }
        }}
        isFilterActive={isFilterDoubtsActive}
      />

      {/* MODAL SIMULADOR DE HORÁRIO DO SISTEMA (EXCLUSIVO DEV) */}
      {showDevClockModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowDevClockModal(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-[#27431e]/50 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#1e3316] text-[#dfb642]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Simulador de Relógio do Sistema</h3>
                  <span className="text-xs text-amber-700 font-mono font-bold">Painel de Testes Exclusivo do Desenvolvedor</span>
                </div>
              </div>
              <button 
                onClick={() => setShowDevClockModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Altere manualmente o relógio do sistema para validar as regras de <strong>ausente (&lt;08h e &ge;16h)</strong>, <strong>almoço (12h-13h)</strong> e <strong>alerta de fim de expediente (15:30)</strong>.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono">
                <span className="text-slate-500">Horário simulado atual:</span>
                <span className="text-sm font-bold text-[#1e3316]">{timeStr} ({formattedDay})</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Cenários Rápidos de Teste:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { label: '07:30 · Fora de Expediente (Modo Ausente / Dormindo)', time: '07:30' },
                    { label: '10:00 · Expediente Normal da TI (Ativo)', time: '10:00' },
                    { label: '12:30 · Horário de Almoço (Ícone Comida)', time: '12:30' },
                    { label: '15:35 · 15min Fim de Expediente (Pop-up Alerta)', time: '15:35' },
                    { label: '17:00 · Após 16h (Modo Ausente / Dormindo)', time: '17:00' },
                  ].map((scenario) => (
                    <button
                      key={scenario.time}
                      type="button"
                      onClick={() => {
                        const [h, m] = scenario.time.split(':').map(Number);
                        const target = new Date();
                        target.setHours(h, m, 0, 0);
                        const offset = target.getTime() - Date.now();
                        setClockOffsetMs(offset);
                        localStorage.setItem('redehelp_dev_clock_offset', String(offset));
                      }}
                      className="text-left px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1e3316] font-bold border border-emerald-200 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{scenario.label}</span>
                      <span className="font-mono text-xs">{scenario.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Definir Horário Personalizado (HH:MM):
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={devCustomTimeInput}
                    onChange={(e) => setDevCustomTimeInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!devCustomTimeInput) return;
                      const [h, m] = devCustomTimeInput.split(':').map(Number);
                      const target = new Date();
                      target.setHours(h, m, 0, 0);
                      const offset = target.getTime() - Date.now();
                      setClockOffsetMs(offset);
                      localStorage.setItem('redehelp_dev_clock_offset', String(offset));
                    }}
                    className="px-4 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setClockOffsetMs(0);
                    localStorage.removeItem('redehelp_dev_clock_offset');
                    setShowDevClockModal(false);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Hora Real</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDevClockModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
