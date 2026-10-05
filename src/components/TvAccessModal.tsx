import React, { useEffect } from 'react';
import { Tv, AlertTriangle, X, LogOut, ArrowRight, ShieldAlert } from 'lucide-react';
import { RegimentoDeodoroLogo } from './RegimentoDeodoroLogo';

interface TvAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchLogin: () => void;
  currentRole?: string;
  currentLogin?: string;
}

export const TvAccessModal: React.FC<TvAccessModalProps> = ({
  isOpen,
  onClose,
  onSwitchLogin,
  currentRole,
  currentLogin,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl border-2 border-amber-500/80 shadow-2xl p-6 sm:p-7 relative text-slate-900 cursor-default"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Fechar aviso"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Emblema e Ícone de Alerta */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300">
            <Tv className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Controle de Exibição Pública · 2º GAC
            </span>
            <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
              Acesso Restrito ao Modo Telão
            </h3>
          </div>
        </div>

        {/* Mensagem Requisitada pelo Usuário */}
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-sm space-y-2 mb-5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="font-semibold leading-relaxed">
              Apenas o login <strong className="font-mono text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">tvinfo</strong> está autorizado a exibir todos os chamados em modo fullscreen. Troque de login para acessar esta funcionalidade.
            </div>
          </div>
          
          <div className="text-xs text-amber-800/90 pt-2 border-t border-amber-200 font-mono">
            Militar atual conectado: <strong>@{currentLogin || 'militar'}</strong> ({currentRole || 'Sem perfil'}).
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          O perfil <strong>CH-TVINFO</strong> é exclusivo para os aparelhos de televisão da sala de atendimento da Seção de Informática do Regimento Deodoro, projetado para rolagem autônoma e sem interação humana.
        </p>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={onSwitchLogin}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#1e3316] text-[#dfb642] hover:bg-[#27431e] font-black text-xs uppercase tracking-wider border border-[#cba135]/50 flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Trocar de Login</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
