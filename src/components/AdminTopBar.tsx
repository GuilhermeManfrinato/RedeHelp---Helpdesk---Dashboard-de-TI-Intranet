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
  Shield,
  UserCheck,
  Target,
  ZoomIn,
  ZoomOut,
  Eye,
  Bell
} from 'lucide-react';
import { AccessibilitySettings, MilitaryUser, AdminTab, Ticket, Department } from '../types';
import { RegimentoDeodoroLogo } from './RegimentoDeodoroLogo';
import { TvAccessModal } from './TvAccessModal';
import { DoubtsModal } from './DoubtsModal';

interface AdminTopBarProps {
  adminTab: AdminTab;
  onToggleMobileSidebar: () => void;
  unreadMessagesCount: number;
  onOpenTvMode: () => void;
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
  onOpenTvMode,
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
  const [timeStr, setTimeStr] = useState<string>('');
  const [showTvModal, setShowTvModal] = useState<boolean>(false);
  const [showDoubtsModal, setShowDoubtsModal] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

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

  // Handler para clique no botão TV (Liberado para tvinfo e DEV)
  const isTvAllowed = currentUser?.role === 'CH-TVINFO' || currentUser?.username === 'dev';

  const handleTvClick = () => {
    if (isTvAllowed) {
      onOpenTvMode();
    } else {
      setShowTvModal(true);
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
                2º GAC · REGIMENTO DEODORO
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

        {/* Relógio Digital */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-[#27431e]" />
          <span>{timeStr}</span>
        </div>

        {/* Botão Painel TV (com alerta para quem não for CH-TVINFO) */}
        <button
          onClick={handleTvClick}
          className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center gap-1.5 sm:gap-2 hover:bg-[#27431e] transition-colors border border-[#cba135]/50 shadow-xs cursor-pointer"
          title="Abrir painel ampliado para televisão da sala (exclusivo para perfil tvinfo)"
        >
          <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Painel TV</span>
        </button>

        {/* Sair */}
        <button
          onClick={onLogoutAdmin}
          className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
          title="Encerrar sessão militar"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Modal de Alerta de Acesso ao Modo TV */}
      <TvAccessModal
        isOpen={showTvModal}
        onClose={() => setShowTvModal(false)}
        onSwitchLogin={() => {
          setShowTvModal(false);
          onLogoutAdmin();
        }}
        currentLogin={currentUser?.username}
        currentRole={currentUser?.role}
      />

      {/* Modal de Exibição de Chamados com Dúvidas/Notificações */}
      <DoubtsModal
        isOpen={showDoubtsModal}
        onClose={() => setShowDoubtsModal(false)}
        tickets={tickets}
        departments={departments}
        onOpenTicket={(ticket) => {
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

    </header>
  );
};
