import React, { useState } from 'react';
import { 
  Shield, 
  Layers, 
  Laptop, 
  Users,
  Tv,
  Eye, 
  ZoomIn, 
  ZoomOut,
  LogOut,
  Target
} from 'lucide-react';
import { AccessibilitySettings, AdminTab, MilitaryUser } from '../types';
import { RegimentoDeodoroLogo } from './RegimentoDeodoroLogo';
import { TvAccessModal } from './TvAccessModal';

interface HeaderProps {
  isAdminRoute: boolean;
  adminTab: AdminTab;
  onSelectAdminTab: (tab: AdminTab) => void;
  isAdminAuthenticated: boolean;
  onLogoutAdmin: () => void;
  onNavigateToClient: () => void;
  onNavigateToAdmin: () => void;
  onOpenTvMode?: () => void;
  a11y: AccessibilitySettings;
  onUpdateA11y: (updater: (prev: AccessibilitySettings) => AccessibilitySettings) => void;
  openTicketsCount: number;
  activeLoansCount: number;
  currentUser?: MilitaryUser | null;
}

export const Header: React.FC<HeaderProps> = ({
  isAdminRoute,
  adminTab,
  onSelectAdminTab,
  isAdminAuthenticated,
  onLogoutAdmin,
  onOpenTvMode,
  a11y,
  onUpdateA11y,
  openTicketsCount,
  activeLoansCount,
  currentUser,
}) => {
  const [showTvModal, setShowTvModal] = useState<boolean>(false);
  const isSecInfo = currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'AUX-SECINFO' || currentUser?.role === 'AUXSECINFO' || currentUser?.role === 'CHSECINFO';

  const isTvAllowed = currentUser?.role === 'CH-TVINFO' || currentUser?.username === 'dev';

  const handleTvClick = () => {
    if (isTvAllowed) {
      onOpenTvMode?.();
    } else {
      setShowTvModal(true);
    }
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
    <header className={`border-b transition-colors ${
      a11y.highContrast 
        ? 'bg-black border-yellow-400 text-white' 
        : 'bg-[#192b14] border-[#cba135]/40 text-white shadow-md'
    }`}>
      {/* Faixa Superior Institucional do Exército Brasileiro */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[4rem] sm:h-18 py-2.5 sm:py-0 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Zona 1: Emblema & Identidade Militar */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="shrink-0">
              <RegimentoDeodoroLogo 
                size={34} 
                highContrast={a11y.highContrast} 
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm sm:text-lg font-black tracking-tight block leading-tight truncate ${
                  a11y.highContrast ? 'text-yellow-400' : 'text-[#dfb642]'
                }`}>
                  2º GAC - REGIMENTO DEODORO
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-emerald-200/80 font-mono tracking-tight block truncate">
                {isAdminRoute 
                  ? 'Seção de Informática · Módulo Administrativo' 
                  : 'Seção de Informática · Central de Chamados'}
              </span>
            </div>
          </div>
        </div>

        {/* Zona 2: Navegação */}
        {isAdminRoute && isAdminAuthenticated ? (
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Navegação Administrativa">
            <button
              onClick={() => onSelectAdminTab('it')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 whitespace-nowrap ${
                adminTab === 'it'
                  ? 'bg-[#dfb642] text-[#192b14] shadow-md'
                  : 'text-emerald-100 hover:text-white hover:bg-[#27431e]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Fila de Chamados</span>
              {openTicketsCount > 0 && (
                <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  adminTab === 'it' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#dfb642] text-[#192b14]'
                }`}>
                  {openTicketsCount}
                </span>
              )}
            </button>

            {isSecInfo && (
              <button
                onClick={() => onSelectAdminTab('notebooks')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 whitespace-nowrap ${
                  adminTab === 'notebooks'
                    ? 'bg-[#dfb642] text-[#192b14] shadow-md'
                    : 'text-emerald-100 hover:text-white hover:bg-[#27431e]'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Cautela de Notebooks</span>
                {activeLoansCount > 0 && (
                  <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                    adminTab === 'notebooks' ? 'bg-[#192b14] text-[#dfb642]' : 'bg-[#dfb642] text-[#192b14]'
                  }`}>
                    {activeLoansCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => onSelectAdminTab('missions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 whitespace-nowrap ${
                adminTab === 'missions'
                  ? 'bg-[#dfb642] text-[#192b14] shadow-md'
                  : 'text-emerald-100 hover:text-white hover:bg-[#27431e]'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Missões da TI</span>
            </button>

            {isSecInfo && (
              <button
                onClick={() => onSelectAdminTab('technicians')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 whitespace-nowrap ${
                  adminTab === 'technicians'
                    ? 'bg-[#dfb642] text-[#192b14] shadow-md'
                    : 'text-emerald-100 hover:text-white hover:bg-[#27431e]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Militares da TI</span>
              </button>
            )}

            <button
              onClick={handleTvClick}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 whitespace-nowrap bg-[#27431e] text-[#dfb642] hover:bg-[#325727] border border-[#cba135]/50 shadow-xs cursor-pointer"
              title="Abrir Painel de TV em tela cheia para a sala de TI"
            >
              <Tv className="w-4 h-4 text-[#dfb642]" />
              <span>Painel TV (Sala)</span>
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-100/90 font-mono">
            <span>2º GAC</span>
            <span>·</span>
            <span>REGIMENTO DEODORO</span>
            <span>·</span>
            <span>ITU - SP</span>
          </div>
        )}

        {/* Zona 3: Acessibilidade & Ações */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Se estiver no Admin autenticado: botão de sair */}
          {isAdminRoute && isAdminAuthenticated && (
            <button
              onClick={onLogoutAdmin}
              title="Encerrar sessão de TI"
              className="px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}

          {/* Controle de Tamanho de Letra A- / A+ */}
          <div className="flex items-center rounded-xl border border-[#385e2b] overflow-hidden divide-x divide-[#385e2b] bg-[#27431e]">
            <button
              onClick={() => cycleFontSize('decrease')}
              disabled={a11y.fontSize === 'normal'}
              title="Diminuir tamanho da letra"
              className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs font-bold text-emerald-100 transition-colors hover:bg-[#325727] disabled:opacity-30 cursor-pointer"
            >
              <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold select-none text-[#dfb642]">
              {a11y.fontSize === 'normal' ? 'A' : a11y.fontSize === 'large' ? 'A+' : 'A++'}
            </div>
            <button
              onClick={() => cycleFontSize('increase')}
              disabled={a11y.fontSize === 'extralarge'}
              title="Aumentar tamanho da letra"
              className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs font-bold text-emerald-100 transition-colors hover:bg-[#325727] disabled:opacity-30 cursor-pointer"
            >
              <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Botão de Alto Contraste */}
          <button
            onClick={toggleContrast}
            title={a11y.highContrast ? "Desativar Alto Contraste" : "Ativar Alto Contraste para melhor leitura"}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
              a11y.highContrast
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'bg-[#27431e] text-emerald-100 border-[#385e2b] hover:bg-[#325727]'
            }`}
            aria-label="Alternar modo de alto contraste"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Menu Mobile se estiver no Admin */}
      {isAdminRoute && isAdminAuthenticated && (
        <div className="lg:hidden flex items-center justify-around border-t border-[#385e2b] py-2 px-2 bg-[#1e3316] text-[11px] font-bold">
          <button
            onClick={() => onSelectAdminTab('it')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${
              adminTab === 'it' ? 'bg-[#dfb642] text-[#192b14]' : 'text-emerald-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fila ({openTicketsCount})</span>
          </button>

          {isSecInfo && (
            <button
              onClick={() => onSelectAdminTab('notebooks')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${
                adminTab === 'notebooks' ? 'bg-[#dfb642] text-[#192b14]' : 'text-emerald-100'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Cautelas ({activeLoansCount})</span>
            </button>
          )}

          <button
            onClick={() => onSelectAdminTab('missions')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${
              adminTab === 'missions' ? 'bg-[#dfb642] text-[#192b14]' : 'text-emerald-100'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Missões</span>
          </button>

          {isSecInfo && (
            <button
              onClick={() => onSelectAdminTab('technicians')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${
                adminTab === 'technicians' ? 'bg-[#dfb642] text-[#192b14]' : 'text-emerald-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Técnicos</span>
            </button>
          )}

          <button
            onClick={handleTvClick}
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1 bg-[#27431e] text-[#dfb642] border border-[#cba135]/40"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV</span>
          </button>
        </div>
      )}

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
    </header>
  );
};
