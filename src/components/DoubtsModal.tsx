import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  ArrowRight, 
  Clock, 
  User, 
  CheckCircle2, 
  Filter, 
  Building2,
  AlertCircle
} from 'lucide-react';
import { Ticket, Department } from '../types';

interface DoubtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  departments: Department[];
  onOpenTicket: (ticket: Ticket) => void;
  onFilterByDoubts: () => void;
  isFilterActive: boolean;
}

export const DoubtsModal: React.FC<DoubtsModalProps> = ({
  isOpen,
  onClose,
  tickets,
  departments,
  onOpenTicket,
  onFilterByDoubts,
  isFilterActive,
}) => {
  const [doubtTab, setDoubtTab] = useState<'all' | 'unread' | 'answered'>('all');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Helper seguro para obter array de mensagens de um chamado (suporta JSON string do SQLite/Storage)
  const getTicketMessages = (ticket: any) => {
    if (!ticket || !ticket.messages) return [];
    if (Array.isArray(ticket.messages)) return ticket.messages;
    if (typeof ticket.messages === 'string') {
      try {
        const parsed = JSON.parse(ticket.messages);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const safeTickets = (Array.isArray(tickets) ? tickets : []).filter(Boolean);
  const safeDepartments = (Array.isArray(departments) ? departments : []).filter(Boolean);

  // Filtrar chamados que possuem dúvidas/mensagens de solicitantes ou interações
  const ticketsWithDoubts = safeTickets.filter(t => {
    const msgs = getTicketMessages(t);
    const hasUnread = msgs.some((m: any) => m && m.sender === 'solicitante' && !m.readByTi);
    const hasAnySolicitanteMsg = msgs.some((m: any) => m && m.sender === 'solicitante');
    return hasUnread || hasAnySolicitanteMsg;
  });

  // Ordenar priorizando os que possuem mensagens não lidas
  const sortedTickets = [...ticketsWithDoubts].sort((a, b) => {
    const msgsA = getTicketMessages(a);
    const msgsB = getTicketMessages(b);
    const unreadA = msgsA.filter((m: any) => m && m.sender === 'solicitante' && !m.readByTi).length;
    const unreadB = msgsB.filter((m: any) => m && m.sender === 'solicitante' && !m.readByTi).length;
    if (unreadB !== unreadA) return unreadB - unreadA;
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
  });

  const totalUnread = safeTickets.reduce((acc, t) => {
    const msgs = getTicketMessages(t);
    return acc + msgs.filter((m: any) => m && m.sender === 'solicitante' && !m.readByTi).length;
  }, 0);

  const totalAnswered = sortedTickets.filter(t => {
    const msgs = getTicketMessages(t);
    const hasUnread = msgs.some((m: any) => m && m.sender === 'solicitante' && !m.readByTi);
    return !hasUnread;
  }).length;

  const displayedTickets = sortedTickets.filter(t => {
    const msgs = getTicketMessages(t);
    const hasUnread = msgs.some((m: any) => m && m.sender === 'solicitante' && !m.readByTi);
    if (doubtTab === 'unread') return hasUnread;
    if (doubtTab === 'answered') return !hasUnread;
    return true;
  });

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity duration-300 ease-out animate-in fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-3xl border-2 border-[#27431e] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900 cursor-default transform transition-all duration-300 ease-out animate-in fade-in zoom-in-95 slide-in-from-bottom-3"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho */}
        <div className="p-5 sm:p-6 bg-[#1e3316] text-white flex items-center justify-between border-b border-[#cba135]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#27431e] text-[#dfb642] border border-[#cba135]/40 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#dfb642]">
                  2º GAC · SEÇÃO DE TI
                </span>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse font-mono">
                    {totalUnread} não lida{totalUnread > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
                Central de Dúvidas & Notificações dos Solicitantes
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-[#27431e] transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas e Barra de Filtros */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Alternador de Abas */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setDoubtTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                doubtTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({sortedTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setDoubtTab('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                doubtTab === 'unread'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pendentes</span>
              <span className="text-[10px] font-mono px-1 rounded bg-black/20">{totalUnread}</span>
            </button>
            <button
              type="button"
              onClick={() => setDoubtTab('answered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                doubtTab === 'answered'
                  ? 'bg-[#27431e] text-[#dfb642] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Respondidas</span>
              <span className="text-[10px] font-mono px-1 rounded bg-black/20">{totalAnswered}</span>
            </button>
          </div>

          <button
            onClick={() => {
              onFilterByDoubts();
              onClose();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              isFilterActive
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#1e3316] text-[#dfb642] hover:bg-[#27431e] border border-[#cba135]/40 shadow-xs'
            }`}
            title="Filtrar os cartões da fila principal do ITDashboard"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isFilterActive ? 'Remover Filtro' : 'Filtrar na Fila'}</span>
          </button>
        </div>

        {/* Lista de Chamados com Dúvidas com Scroll Suave e Explícito */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] flex-1 space-y-3 scroll-smooth">
          {displayedTickets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-base text-slate-900">
                {doubtTab === 'unread' ? 'Nenhuma dúvida pendente de resposta!' : doubtTab === 'answered' ? 'Nenhuma dúvida respondida nesta categoria.' : 'Nenhuma dúvida registrada!'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {doubtTab === 'unread' ? 'Todos os militares solicitantes foram atendidos.' : 'As perguntas e respostas dos militares serão exibidas aqui.'}
              </p>
            </div>
          ) : (
            displayedTickets.map(t => {
              const dept = safeDepartments.find(d => d.id === t.departmentId);
              const msgs = getTicketMessages(t);
              const unreadCount = msgs.filter((m: any) => m && m.sender === 'solicitante' && !m.readByTi).length;
              const lastSolicitanteMsg = [...msgs]
                .reverse()
                .find((m: any) => m && m.sender === 'solicitante');
              const lastTiMsg = [...msgs]
                .reverse()
                .find((m: any) => m && m.sender === 'ti');

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    onOpenTicket(t);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all text-left group cursor-pointer hover:border-[#27431e] hover:shadow-md ${
                    unreadCount > 0 
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-[#1e3316] bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {t.code}
                      </span>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                        {dept?.name || 'Seção da OM'}
                      </span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        {t.requesterName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {unreadCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse font-mono">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''} mensagem{unreadCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                          ✓ Respondido
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        t.priority === 'critica' ? 'bg-red-100 text-red-800' :
                        t.priority === 'alta' ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mb-1 group-hover:text-[#1e3316] transition-colors">
                    {t.title}
                  </h4>

                  {lastSolicitanteMsg && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2 mt-2">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 mr-1.5">{lastSolicitanteMsg.senderName}:</span>
                        <span className="italic text-slate-600">"{lastSolicitanteMsg.content}"</span>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {new Date(lastSolicitanteMsg.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  )}

                  {lastTiMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2 mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-emerald-900 mr-1.5">Última Resposta da TI ({lastTiMsg.senderName}):</span>
                        <span className="text-emerald-800 font-medium">"{lastTiMsg.content}"</span>
                        <div className="text-[10px] text-emerald-600 mt-1 font-mono">
                          {new Date(lastTiMsg.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Status atual: <strong>{t.status.toUpperCase().replace('_', ' ')}</strong>
                    </span>

                    <span className="font-bold text-[#1e3316] flex items-center gap-1 group-hover:underline text-xs">
                      <span>Abrir Chat & Atender</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Seção de Informática & TI (INFO/26)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
