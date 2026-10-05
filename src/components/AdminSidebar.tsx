import React, { useState } from 'react';
import { 
  Layers, 
  Laptop, 
  Users, 
  Tv, 
  LogOut, 
  MessageSquare, 
  ExternalLink, 
  X,
  ZoomIn,
  ZoomOut,
  Eye,
  CheckCircle2,
  Clock,
  ShieldAlert,
  UserCheck,
  Lock,
  Unlock,
  ChevronRight,
  ChevronLeft,
  Target
} from 'lucide-react';
import { AccessibilitySettings, MilitaryUser, AdminTab } from '../types';
import { RegimentoDeodoroLogo } from './RegimentoDeodoroLogo';
import { TvAccessModal } from './TvAccessModal';

interface AdminSidebarProps {
  adminTab: AdminTab;
  onSelectAdminTab: (tab: AdminTab) => void;
  openTicketsCount: number;
  activeLoansCount: number;
  techniciansCount: number;
  missionsCount?: number;
  unreadMessagesCount: number;
  onOpenTvMode: () => void;
  onLogoutAdmin: () => void;
  onNavigateToClient: () => void;
  a11y: AccessibilitySettings;
  onUpdateA11y: (updater: (prev: AccessibilitySettings) => AccessibilitySettings) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  currentUser?: MilitaryUser | null;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  adminTab,
  onSelectAdminTab,
  openTicketsCount,
  activeLoansCount,
  techniciansCount,
  missionsCount = 0,
  unreadMessagesCount,
  onOpenTvMode,
  onLogoutAdmin,
  onNavigateToClient,
  a11y,
  onUpdateA11y,
  isMobileOpen,
  onCloseMobile,
  currentUser,
}) => {
  // Controle de estado minimizado, hover e trava de cadeado
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('eb_sidebar_locked') === 'true';
    } catch {
      return false;
    }
  });

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isManualExpanded, setIsManualExpanded] = useState<boolean>(false);
  const [showTvModal, setShowTvModal] = useState<boolean>(false);

  const isSecInfo = currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'AUX-SECINFO' || currentUser?.role === 'AUXSECINFO' || currentUser?.role === 'CHSECINFO' || currentUser?.username === 'dev';
  const isTech = currentUser?.role === 'CH-TECNICOINFO' || currentUser?.role === 'TECINFO';
  const isTvAllowed = currentUser?.role === 'CH-TVINFO' || currentUser?.username === 'dev' || currentUser?.rank === 'Dev';

  const handleTvClick = () => {
    if (isTvAllowed) {
      onOpenTvMode();
      onCloseMobile();
    } else {
      setShowTvModal(true);
    }
  };

  // Está expandido se for mobile, se foi expandido manualmente, ou se houver hover E não estiver trancado
  const isExpanded = isMobileOpen || isManualExpanded || (isHovered && !isLocked);

  const toggleLock = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsLocked(prev => {
      const next = !prev;
      try {
        localStorage.setItem('eb_sidebar_locked', String(next));
      } catch {}
      return next;
    });
  };

  const toggleContrast = () => {
    onUpdateA11y(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const cycleFontSize = (direction: 'increase' | 'decrease') => {
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
    <>
      {/* Backdrop para telas móveis */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Barra Lateral / Sidebar (se estende até o rodapé sempre) */}
      <aside 
        onMouseEnter={() => {
          if (!isLocked) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        className={`shrink-0 transition-[width] duration-200 ease-out border-r shadow-2xl flex flex-col ${
          isExpanded ? 'w-72' : 'w-20'
        } ${
          a11y.highContrast
            ? 'bg-neutral-950 border-yellow-400 text-white'
            : 'bg-[#152311] border-[#2d4a22] text-slate-100'
        } ${
          isMobileOpen 
            ? 'fixed inset-y-0 left-0 z-50 h-full translate-x-0' 
            : 'fixed inset-y-0 left-0 z-50 h-full -translate-x-full lg:translate-x-0 lg:static lg:self-stretch lg:min-h-full'
        }`}
      >
        <div className="lg:sticky lg:top-0 h-screen max-h-screen flex flex-col justify-between w-full overflow-hidden">
        
        {/* Cabeçalho da Sidebar: Brasão Militar & Identidade 2º GAC */}
        <div className={`p-4 border-b border-[#2d4a22] bg-[#1a2c15] transition-all flex items-center justify-between ${
          !isExpanded ? 'flex-col gap-2' : ''
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Ícone Próprio do Regimento Deodoro com Canhões Cruzados */}
            <div 
              onClick={() => setIsManualExpanded(!isManualExpanded)}
              className="cursor-pointer hover:scale-105 transition-transform shrink-0" 
              title="2º GAC - Regimento Deodoro"
            >
              <RegimentoDeodoroLogo 
                size={isExpanded ? 40 : 36} 
                highContrast={a11y.highContrast} 
              />
            </div>

            {isExpanded && (
              <div className="min-w-0 truncate">
                <span className="text-[10px] font-mono font-black tracking-widest uppercase text-[#dfb642] block truncate">
                  Exército Brasileiro
                </span>
                <h1 className="text-sm font-black tracking-tight text-white leading-tight truncate">
                  2º GAC
                </h1>
                <span className="text-[11px] text-emerald-200/80 font-mono tracking-tight block truncate">
                  Seção de Informática & TI
                </span>
              </div>
            )}
          </div>

          {/* Controles do Cabeçalho: Cadeado de Tranca & Fechar Mobile */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Botão de Cadeado */}
            <button
              onClick={toggleLock}
              className={`p-1.5 rounded-lg border transition-all ${
                isLocked 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/60 hover:bg-amber-500/30' 
                  : 'bg-[#27431e] text-emerald-200 border-[#385e2b] hover:bg-[#325727] hover:text-white'
              }`}
              title={
                isLocked 
                  ? 'Cadeado TRANCADO: o menu NÃO abre ao passar o mouse. Clique para destrancar.' 
                  : 'Cadeado DESTRANCADO: o menu expande automaticamente ao passar o mouse. Clique para trancar recolhido.'
              }
            >
              {isLocked ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <Unlock className="w-4 h-4 text-emerald-300" />
              )}
            </button>

            {/* Fechar no Mobile */}
            <button 
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#27431e]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Links de Navegação Principal */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 overflow-x-hidden">
          
          {/* Aviso se for perfil TVINFO (somente expandido) */}
          {currentUser?.role === 'CH-TVINFO' && isExpanded && (
            <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-500/60 text-purple-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-purple-300">
                <Tv className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Perfil CH-TVINFO</span>
              </div>
              <p className="text-[11px] leading-tight text-purple-100">
                Acesso limitado à exibição de chamados sem interação.
              </p>
            </div>
          )}

          <div>
            {isExpanded && (
              <div className="px-3 mb-2 text-[10px] font-mono font-black tracking-wider uppercase text-emerald-400/80 flex items-center justify-between">
                <span>Painel de Controle</span>
                <span className="text-[9px] text-slate-400 font-normal">
                  {isLocked ? '🔒 Trancado' : '🔓 Hover ativo'}
                </span>
              </div>
            )}

            <nav className="space-y-1.5">
              {/* Item 1: Fila de Chamados */}
              <button
                onClick={() => {
                  onSelectAdminTab('it');
                  onCloseMobile();
                }}
                title="Fila de Chamados (Triagem e Atendimentos)"
                className={`w-full rounded-2xl text-left text-xs font-bold transition-all flex items-center group ${
                  isExpanded ? 'px-3.5 py-3 justify-between' : 'p-3 justify-center'
                } ${
                  adminTab === 'it'
                    ? a11y.highContrast
                      ? 'bg-yellow-400 text-black font-black shadow-md'
                      : 'bg-[#dfb642] text-[#192b14] font-black shadow-lg scale-[1.01]'
                    : 'text-slate-200 hover:bg-[#1e3316] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    adminTab === 'it' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#1e3316] text-emerald-300 group-hover:bg-[#27431e]'
                  }`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  {isExpanded && (
                    <div className="min-w-0 truncate">
                      <span className="block text-sm truncate">Fila de Chamados</span>
                      <span className={`text-[10px] font-normal block truncate ${adminTab === 'it' ? 'text-[#192b14]/80' : 'text-slate-400'}`}>
                        Triagem e Atendimentos
                      </span>
                    </div>
                  )}
                </div>

                {isExpanded ? (
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
                    {openTicketsCount > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                        adminTab === 'it' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#dfb642] text-[#192b14]'
                      }`}>
                        {openTicketsCount}
                      </span>
                    )}
                    {unreadMessagesCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white animate-pulse">
                        💬 {unreadMessagesCount}
                      </span>
                    )}
                  </div>
                ) : openTicketsCount > 0 ? (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#dfb642]"></span>
                ) : null}
              </button>

              {/* Item 2: Cautela de Notebooks (Exclusivo CH-SECINFO) */}
              {isSecInfo && (
                <button
                  onClick={() => {
                    onSelectAdminTab('notebooks');
                    onCloseMobile();
                  }}
                  title="Cautela de Notebooks (Prorrogações & Histórico)"
                  className={`w-full rounded-2xl text-left text-xs font-bold transition-all flex items-center group ${
                    isExpanded ? 'px-3.5 py-3 justify-between' : 'p-3 justify-center'
                  } ${
                    adminTab === 'notebooks'
                      ? a11y.highContrast
                        ? 'bg-yellow-400 text-black font-black shadow-md'
                        : 'bg-[#dfb642] text-[#192b14] font-black shadow-lg scale-[1.01]'
                      : 'text-slate-200 hover:bg-[#1e3316] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      adminTab === 'notebooks' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#1e3316] text-emerald-300 group-hover:bg-[#27431e]'
                    }`}>
                      <Laptop className="w-4 h-4" />
                    </div>
                    {isExpanded && (
                      <div className="min-w-0 truncate">
                        <span className="block text-sm truncate">Cautela de Notebooks</span>
                        <span className={`text-[10px] font-normal block truncate ${adminTab === 'notebooks' ? 'text-[#192b14]/80' : 'text-slate-400'}`}>
                          Prorrogações & Histórico
                        </span>
                      </div>
                    )}
                  </div>

                  {isExpanded && activeLoansCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ml-1 ${
                      adminTab === 'notebooks' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#dfb642] text-[#192b14]'
                    }`}>
                      {activeLoansCount}
                    </span>
                  )}
                </button>
              )}

              {/* Item 3: Missões & Ordens da TI */}
              <button
                onClick={() => {
                  onSelectAdminTab('missions');
                  onCloseMobile();
                }}
                title="Missões & Ordens da TI (Escalações & Tiragem de Faltas)"
                className={`w-full rounded-2xl text-left text-xs font-bold transition-all flex items-center group ${
                  isExpanded ? 'px-3.5 py-3 justify-between' : 'p-3 justify-center'
                } ${
                  adminTab === 'missions'
                    ? a11y.highContrast
                      ? 'bg-yellow-400 text-black font-black shadow-md'
                      : 'bg-[#dfb642] text-[#192b14] font-black shadow-lg scale-[1.01]'
                    : 'text-slate-200 hover:bg-[#1e3316] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    adminTab === 'missions' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#1e3316] text-emerald-300 group-hover:bg-[#27431e]'
                  }`}>
                    <Target className="w-4 h-4" />
                  </div>
                  {isExpanded && (
                    <div className="min-w-0 truncate">
                      <span className="block text-sm truncate">Missões da TI</span>
                      <span className={`text-[10px] font-normal block truncate ${adminTab === 'missions' ? 'text-[#192b14]/80' : 'text-slate-400'}`}>
                        Ordens & Faltas
                      </span>
                    </div>
                  )}
                </div>

                {isExpanded && missionsCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ml-1 ${
                    adminTab === 'missions' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#dfb642] text-[#192b14]'
                  }`}>
                    {missionsCount}
                  </span>
                )}
              </button>

              {/* Item 4: Militares & Auditoria (Exclusivo CH-SECINFO) */}
              {isSecInfo && (
                <button
                  onClick={() => {
                    onSelectAdminTab('technicians');
                    onCloseMobile();
                  }}
                  title="Militares & Auditoria (Logins, Senhas & Logs)"
                  className={`w-full rounded-2xl text-left text-xs font-bold transition-all flex items-center group ${
                    isExpanded ? 'px-3.5 py-3 justify-between' : 'p-3 justify-center'
                  } ${
                    adminTab === 'technicians'
                      ? a11y.highContrast
                        ? 'bg-yellow-400 text-black font-black shadow-md'
                        : 'bg-[#dfb642] text-[#192b14] font-black shadow-lg scale-[1.01]'
                      : 'text-slate-200 hover:bg-[#1e3316] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      adminTab === 'technicians' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#1e3316] text-emerald-300 group-hover:bg-[#27431e]'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                    {isExpanded && (
                      <div className="min-w-0 truncate">
                        <span className="block text-sm truncate">Militares & Auditoria</span>
                        <span className={`text-[10px] font-normal block truncate ${adminTab === 'technicians' ? 'text-[#192b14]/80' : 'text-slate-400'}`}>
                          Logins, Senhas & Logs
                        </span>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ml-1 ${
                      adminTab === 'technicians' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#1e3316] text-emerald-300'
                    }`}>
                      {techniciansCount}
                    </span>
                  )}
                </button>
              )}

              {/* Item 5: Painel TV da Sala (Oculto para técnicos; acesso direto para DEV e TV) */}
              {!isTech && (
                <button
                  onClick={handleTvClick}
                  title="Painel TV da Sala (Telão Operacional)"
                  className={`w-full rounded-2xl text-left text-xs font-bold transition-all flex items-center group bg-[#1a2c15] text-[#dfb642] hover:bg-[#233c1d] border border-[#cba135]/40 shadow-xs cursor-pointer ${
                    isExpanded ? 'px-3.5 py-3 justify-between' : 'p-3 justify-center'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-[#27431e] text-[#dfb642] shrink-0">
                      <Tv className="w-4 h-4" />
                    </div>
                    {isExpanded && (
                      <div className="min-w-0 truncate">
                        <span className="block text-sm truncate">Painel TV da Sala</span>
                        <span className="text-[10px] text-emerald-200/70 font-normal block truncate">
                          Exibição Operacional
                        </span>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-[#dfb642] text-[#192b14] shrink-0 ml-1">
                      TELÃO
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Atalho para o Portal do Solicitante */}
          <div className="pt-2 border-t border-[#2d4a22]/60">
            <button
              onClick={() => {
                onNavigateToClient();
                onCloseMobile();
              }}
              title="Portal do Solicitante"
              className={`w-full rounded-xl bg-[#1e3316]/60 hover:bg-[#1e3316] text-emerald-200 hover:text-white text-xs font-semibold flex items-center transition-colors border border-[#2d4a22] ${
                isExpanded ? 'p-3 justify-between' : 'p-2.5 justify-center'
              }`}
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#dfb642] shrink-0" />
                {isExpanded && <span>Portal do Solicitante</span>}
              </div>
              {isExpanded && (
                <span className="text-[10px] font-mono text-emerald-400">Abrir ↗</span>
              )}
            </button>
          </div>

          {/* Notificações de Dúvidas Pendentes */}
          {unreadMessagesCount > 0 && isExpanded && (
            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-600/60 text-amber-200 space-y-1 animate-pulse">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Dúvidas do Solicitante!</span>
              </div>
              <p className="text-[11px] leading-tight text-amber-100">
                Existem <strong>{unreadMessagesCount} mensagem(ns)</strong> de militares aguardando resposta na fila.
              </p>
            </div>
          )}

        </div>

        {/* Rodapé da Barra Lateral: Sessão & Acessibilidade */}
        <div className={`p-3 border-t border-[#2d4a22] bg-[#1a2c15] space-y-2.5 mt-auto shrink-0 w-full ${
          !isExpanded ? 'flex flex-col items-center' : ''
        }`}>
          
          {/* Cartão do Usuário Conectado */}
          <div className={`flex items-center rounded-2xl bg-[#152311] border border-[#2d4a22] ${
            isExpanded ? 'justify-between p-2.5 w-full' : 'p-2 justify-center'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#27431e] text-[#dfb642] flex items-center justify-center font-bold text-xs border border-[#cba135]/40 font-mono shrink-0">
                {currentUser?.warName ? currentUser.warName.slice(0, 2).toUpperCase() : 'TI'}
              </div>
              {isExpanded && (
                <div className="leading-tight min-w-0">
                  <span className="text-xs font-bold text-white block truncate max-w-[130px]">
                    {currentUser?.name || 'Militar da TI'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="truncate">{currentUser?.role || 'Sessão Ativa'}</span>
                  </span>
                </div>
              )}
            </div>

            {isExpanded && (
              <button
                onClick={onLogoutAdmin}
                title="Encerrar sessão de TI (Logoff)"
                className="p-1.5 rounded-xl text-red-300 hover:text-white hover:bg-red-950/80 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botão Logoff quando minimizado */}
          {!isExpanded && (
            <button
              onClick={onLogoutAdmin}
              title="Encerrar sessão de TI (Logoff)"
              className="p-2 rounded-xl text-red-300 hover:text-white hover:bg-red-950/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Controles de Acessibilidade */}
          {isExpanded && (
            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                Leitura:
              </span>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded-lg border border-[#385e2b] overflow-hidden divide-x divide-[#385e2b] bg-[#27431e]">
                  <button
                    onClick={() => cycleFontSize('decrease')}
                    disabled={a11y.fontSize === 'normal'}
                    title="Diminuir fonte"
                    className="px-2 py-1 text-[11px] font-bold text-emerald-100 hover:bg-[#325727] disabled:opacity-30"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <div className="px-2 py-1 text-[11px] font-mono font-bold text-[#dfb642]">
                    {a11y.fontSize === 'normal' ? 'A' : a11y.fontSize === 'large' ? 'A+' : 'A++'}
                  </div>
                  <button
                    onClick={() => cycleFontSize('increase')}
                    disabled={a11y.fontSize === 'extralarge'}
                    title="Aumentar fonte"
                    className="px-2 py-1 text-[11px] font-bold text-emerald-100 hover:bg-[#325727] disabled:opacity-30"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={toggleContrast}
                  title="Alto contraste"
                  className={`p-1.5 rounded-lg border transition-colors ${
                    a11y.highContrast
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-[#27431e] text-emerald-100 border-[#385e2b] hover:bg-[#325727]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </aside>

      {/* Modal de Restrição de Acesso ao Telão TV */}
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
    </>
  );
};
