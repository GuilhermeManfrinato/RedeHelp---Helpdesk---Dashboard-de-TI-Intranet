import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize, 
  Minimize, 
  X, 
  User, 
  Building2, 
  Wrench,
  Layers,
  Flame
} from 'lucide-react';
import { Ticket, Department, Technician } from '../types';
import { RegimentoDeodoroLogo } from './RegimentoDeodoroLogo';
import malletBg from '../assets/mallet_bg.jpg';

interface TVDashboardProps {
  tickets: Ticket[];
  departments: Department[];
  technicians: Technician[];
  onClose: () => void;
}

export const TVDashboard: React.FC<TVDashboardProps> = ({
  tickets,
  departments,
  technicians,
  onClose,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Travar scroll do body enquanto o painel de TV estiver ativo e escutar tecla ESC
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Separação dos chamados
  const openTickets = tickets.filter(t => t.status === 'aberto');
  const inProgressTickets = tickets.filter(t => t.status === 'em_atendimento');
  const waitingTickets = tickets.filter(t => t.status === 'aguardando');
  const resolvedTickets = tickets.filter(t => t.status === 'resolvido');
  const criticalTickets = tickets.filter(t => t.priority === 'critica' && t.status !== 'resolvido');

  const formatElapsed = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    if (diffMins < 60) return `${diffMins} min atrás`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''} atrás`;
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-[#0d160a] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Marca d'água artística do General Mallet & Obuseiros de Artilharia */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.08] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${malletBg})` }}
        aria-hidden="true"
      />
      
      {/* Barra de Topo do Painel de TV */}
      <div className="bg-[#152311] border-b-2 border-[#cba135]/50 px-6 py-3 flex items-center justify-between shadow-lg shrink-0 relative z-10">
        
        {/* Identidade Militar da OM */}
        <div className="flex items-center gap-4">
          <div className="p-1 rounded-2xl bg-[#1e3316] border-2 border-[#cba135] shadow-md shrink-0">
            <RegimentoDeodoroLogo size={48} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-black uppercase tracking-widest bg-[#dfb642] text-[#192b14]">
                2º GAC - REGIMENTO DEODORO
              </span>
              <span className="text-xs text-emerald-300 font-mono tracking-wider">
                ITU - SP · ARTILHARIA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              SEÇÃO DE INFORMÁTICA · PAINEL DE SALA
            </h1>
          </div>
        </div>

        {/* Relógio Digital Militar e Ações */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="font-mono text-3xl sm:text-4xl font-black text-[#dfb642] tracking-wider tabular-nums leading-none">
              {currentTime.toLocaleTimeString('pt-BR')}
            </div>
            <div className="text-xs font-mono text-emerald-200/80 mt-1 uppercase">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-[#2d4a22] pl-4">
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-xl bg-[#1e3316] text-[#dfb642] hover:bg-[#27431e] border border-[#cba135]/40 transition-colors"
              title="Tela cheia"
            >
              {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-red-950/80 text-red-200 hover:bg-red-900 border border-red-700/60 transition-colors"
              title="Sair do Modo TV"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

      </div>

      {/* Indicadores Numéricos Gigantes */}
      <div className="grid grid-cols-5 gap-3 p-4 bg-[#111c0e] border-b border-[#2d4a22]/60 shrink-0">
        
        <div className="p-3.5 rounded-2xl bg-[#172713] border border-[#2d4a22] text-center">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-300/80 block">
            Fila de Espera
          </span>
          <span className="text-4xl font-black font-mono text-white tabular-nums block mt-1">
            {openTickets.length}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#172713] border border-amber-600/50 text-center">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300 block">
            Em Atendimento
          </span>
          <span className="text-4xl font-black font-mono text-amber-400 tabular-nums block mt-1">
            {inProgressTickets.length}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#172713] border border-purple-600/50 text-center">
          <span className="text-xs font-black uppercase tracking-wider text-purple-300 block">
            Aguardando Peça
          </span>
          <span className="text-4xl font-black font-mono text-purple-400 tabular-nums block mt-1">
            {waitingTickets.length}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#172713] border border-[#2d4a22] text-center">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
            Concluídos
          </span>
          <span className="text-4xl font-black font-mono text-emerald-400 tabular-nums block mt-1">
            {resolvedTickets.length}
          </span>
        </div>

        <div className={`p-3.5 rounded-2xl text-center border-2 ${
          criticalTickets.length > 0 
            ? 'bg-red-950/90 border-red-600 animate-pulse' 
            : 'bg-[#172713] border-[#2d4a22]'
        }`}>
          <span className="text-xs font-black uppercase tracking-wider text-red-300 block flex items-center justify-center gap-1">
            {criticalTickets.length > 0 && <Flame className="w-4 h-4 text-red-500 fill-current" />}
            <span>Urgência Crítica</span>
          </span>
          <span className={`text-4xl font-black font-mono tabular-nums block mt-1 ${criticalTickets.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {criticalTickets.length}
          </span>
        </div>

      </div>

      {/* Grade de 3 Colunas Amplas para a Televisão */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
        
        {/* COLUNA 1: FILA DE ESPERA / TRIAGEM */}
        <div className="flex flex-col bg-[#142111] rounded-2xl border border-[#2d4a22] overflow-hidden">
          <div className="bg-[#1b2d16] px-4 py-3 border-b border-[#2d4a22] flex items-center justify-between">
            <span className="font-black text-sm uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              1. Fila de Espera ({openTickets.length})
            </span>
            <span className="text-xs font-mono text-emerald-300 font-bold">Aguardando Atribuição</span>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {openTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-bold text-sm">
                Nenhum chamado pendente na fila.
              </div>
            ) : (
              openTickets.map((t) => {
                const dept = departments.find(d => d.id === t.departmentId);
                const isCrit = t.priority === 'critica';

                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border-2 transition-all shadow-md ${
                      isCrit
                        ? 'bg-red-950/80 border-red-500 shadow-red-900/30'
                        : 'bg-[#182914] border-[#2d4a22]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xl font-black text-[#dfb642]">
                        {t.code}
                      </span>
                      <span className={`px-2.5 py-1 rounded text-xs font-black uppercase font-mono tracking-wider ${
                        isCrit ? 'bg-red-600 text-white' :
                        t.priority === 'alta' ? 'bg-orange-500 text-white' :
                        t.priority === 'media' ? 'bg-blue-600 text-white' :
                        'bg-slate-600 text-white'
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5">
                      <Building2 className="w-4 h-4 text-[#cba135] shrink-0" />
                      <span>{dept?.name}</span>
                    </div>

                    <h3 className="text-lg font-black text-white leading-snug line-clamp-2 mb-2">
                      {t.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#2d4a22]/60 font-mono">
                      <span>{t.requesterName}</span>
                      <span className="text-[#dfb642] font-bold">{formatElapsed(t.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA 2: EM ATENDIMENTO NA BANCADA */}
        <div className="flex flex-col bg-[#142111] rounded-2xl border border-amber-600/40 overflow-hidden">
          <div className="bg-[#1b2d16] px-4 py-3 border-b border-amber-600/40 flex items-center justify-between">
            <span className="font-black text-sm uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
              2. Em Atendimento / Na Bancada ({inProgressTickets.length})
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold">Mecânicos em Ação</span>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {inProgressTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-bold text-sm">
                Nenhum chamado em atendimento no momento.
              </div>
            ) : (
              inProgressTickets.map((t) => {
                const dept = departments.find(d => d.id === t.departmentId);
                const tech = technicians.find(tc => tc.id === t.technicianId);

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border-2 border-amber-500/60 bg-[#1e2d19] shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xl font-black text-[#dfb642]">
                        {t.code}
                      </span>
                      {tech ? (
                        <span className="px-3 py-1 rounded-lg bg-[#dfb642] text-[#192b14] font-black text-xs uppercase flex items-center gap-1.5 shadow-sm">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{tech.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 font-bold italic">Sem técnico atribuído</span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5">
                      <Building2 className="w-4 h-4 text-[#cba135] shrink-0" />
                      <span>{dept?.name}</span>
                    </div>

                    <h3 className="text-lg font-black text-white leading-snug line-clamp-2 mb-2">
                      {t.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#2d4a22]/60 font-mono">
                      <span>Solicitante: {t.requesterName}</span>
                      <span className="text-amber-400 font-bold">{formatElapsed(t.updatedAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA 3: ÚLTIMOS CONCLUÍDOS */}
        <div className="flex flex-col bg-[#142111] rounded-2xl border border-emerald-600/40 overflow-hidden">
          <div className="bg-[#1b2d16] px-4 py-3 border-b border-emerald-600/40 flex items-center justify-between">
            <span className="font-black text-sm uppercase tracking-wider text-emerald-300 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              3. Concluídos Recentemente ({resolvedTickets.length})
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">Missão Cumprida</span>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {resolvedTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-bold text-sm">
                Nenhum chamado concluído registrado.
              </div>
            ) : (
              resolvedTickets.slice(0, 6).map((t) => {
                const dept = departments.find(d => d.id === t.departmentId);
                const tech = technicians.find(tc => tc.id === t.technicianId);

                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-emerald-800/60 bg-[#162714] opacity-90"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-base font-black text-emerald-400">
                        {t.code}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>RESOLVIDO</span>
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-300 truncate mb-1">
                      {dept?.name} · {t.title}
                    </div>

                    {tech && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        Atendido por: <strong className="text-slate-200">{tech.name}</strong>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Rodapé Oficial do Painel de TV */}
      <footer className="bg-[#152311] border-t border-[#cba135]/40 py-2 px-6 flex items-center justify-between text-xs text-emerald-200/70 shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#dfb642]">2º GAC - REGIMENTO DEODORO</span>
          <span>·</span>
          <span>Seção de Informática & Telemática</span>
          <span>·</span>
          <span className="font-mono text-emerald-300">BRAÇO FORTE, MÃO AMIGA</span>
        </div>
        <div className="font-mono text-[11px] text-[#dfb642]/90">
          desenvolvido com &lt;3 por Manfrinato | INFO/26
        </div>
      </footer>

    </div>,
    document.body
  );
};
