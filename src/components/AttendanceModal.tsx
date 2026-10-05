import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  Check, 
  X, 
  Printer, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  FileText,
  Trash2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  MilitaryUser, 
  Technician, 
  AttendanceRecord, 
  AttendanceRosterItem, 
  AttendanceStatus, 
  AccessibilitySettings 
} from '../types';
import { api } from '../utils/api';
import { loadAttendanceRecords, saveAttendanceRecords } from '../utils/storage';
import { RegimentoDeodoroLogo } from './RegimentoDeodoroLogo';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  militaryUsers: MilitaryUser[];
  technicians: Technician[];
  currentUser: MilitaryUser | null;
  a11y: AccessibilitySettings;
  onAddAuditLog?: (log: any) => void;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; short: string; badge: string; icon: string }> = {
  PRESENTE: {
    label: 'Presente',
    short: 'PRES',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    icon: '🟢'
  },
  FALTA: {
    label: 'Falta Não Justificada',
    short: 'FALTA',
    badge: 'bg-red-100 text-red-900 border-red-300 font-bold',
    icon: '🔴'
  },
  DISPENSA_MEDICA: {
    label: 'Dispensa Médica (FSR)',
    short: 'FSR',
    badge: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    icon: '🟡'
  },
  MISSAO_EXTERNA: {
    label: 'Missão Externa do 2º GAC',
    short: 'MISSÃO',
    badge: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
    icon: '🔵'
  },
  SERVICO_ESCALA: {
    label: 'Serviço de Escala / Guarda',
    short: 'ESCALA',
    badge: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
    icon: '🟣'
  },
  FERIAS_LUTO: {
    label: 'Férias / Dispensa Regulamentar',
    short: 'AFAST',
    badge: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
    icon: '⚪'
  }
};

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  militaryUsers,
  currentUser,
  a11y,
  onAddAuditLog,
}) => {
  const [activeTab, setActiveTab] = useState<'new_roll' | 'history'>('new_roll');
  
  // Data selecionada (padrão hoje YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  const [rollDate, setRollDate] = useState(todayStr);
  const [rollTime, setRollTime] = useState(currentTimeStr);
  const [rollShift, setRollShift] = useState('Formatura Matinal');
  const [rollNotes, setRollNotes] = useState('');
  
  // Lista de militares para a chamada atual
  const [roster, setRoster] = useState<AttendanceRosterItem[]>([]);
  
  // Registros de chamadas salvos no banco
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AttendanceRecord | null>(null);
  
  // Filtro de consulta por data
  const [queryDate, setQueryDate] = useState(todayStr);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // Helper seguro para formatar data sem quebras de fuso ou Invalid Date
  const formatDateSafe = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') {
      try {
        const parts = val.split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
        return val;
      } catch {
        return val;
      }
    }
    if (val instanceof Date) {
      return val.toLocaleDateString('pt-BR');
    }
    return String(val || '');
  };

  const parseRosterSafe = (roster: any): AttendanceRosterItem[] => {
    if (Array.isArray(roster)) return roster;
    if (typeof roster === 'string') {
      try {
        const parsed = JSON.parse(roster);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  };

  // Inicializar o roster quando abre
  useEffect(() => {
    if (isOpen) {
      const activeUsers = (militaryUsers || []).filter(u => u && u.active !== false && u.username !== 'dev' && u.role !== 'dev');
      const initialRoster: AttendanceRosterItem[] = activeUsers.map(u => ({
        militaryId: u.id || `mil-${Math.random()}`,
        militaryName: u.name || 'Militar',
        warName: u.warName || u.name || 'Militar',
        rank: u.rank || 'Mil',
        status: 'PRESENTE',
        reason: '',
      }));
      setRoster(initialRoster);
      loadRecords();
    }
  }, [isOpen, militaryUsers]);

  const loadRecords = async () => {
    try {
      const data = await api.getAttendanceRecords();
      if (Array.isArray(data) && data.length > 0) {
        setRecords(data);
        saveAttendanceRecords(data);
      } else {
        const local = loadAttendanceRecords();
        setRecords(local);
      }
    } catch (err) {
      console.warn('[AttendanceModal] Falha ao carregar registros do backend, usando local:', err);
      const local = loadAttendanceRecords();
      setRecords(local);
    }
  };

  if (!isOpen) return null;

  const handleStatusChange = (militaryId: string, status: AttendanceStatus) => {
    setRoster(prev => prev.map(item => item.militaryId === militaryId ? { ...item, status } : item));
  };

  const handleReasonChange = (militaryId: string, reason: string) => {
    setRoster(prev => prev.map(item => item.militaryId === militaryId ? { ...item, reason } : item));
  };

  const handleMarkAllPresent = () => {
    setRoster(prev => prev.map(item => ({ ...item, status: 'PRESENTE', reason: '' })));
  };

  const countPresent = roster.filter(i => i.status === 'PRESENTE').length;
  const countAbsent = roster.filter(i => i.status !== 'PRESENTE').length;
  const totalStrength = roster.length;
  const presencePct = totalStrength > 0 ? Math.round((countPresent / totalStrength) * 100) : 100;

  const handleSaveRollCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const supervisorName = currentUser?.name || 'Chefe da Seção de TI';
    const supervisorRole = currentUser?.role || 'CH-SECINFO';

    const newRecord: Partial<AttendanceRecord> = {
      id: `att-${Date.now()}`,
      date: rollDate,
      time: rollTime,
      shift: rollShift,
      supervisorName,
      supervisorRole,
      totalPresent: countPresent,
      totalAbsent: countAbsent,
      totalStrength,
      notes: rollNotes.trim(),
      roster,
    };

    try {
      try {
        await api.createAttendanceRecord(newRecord);
      } catch (apiErr) {
        console.warn('[AttendanceModal] Falha ao enviar para API backend, salvando localmente:', apiErr);
      }

      const fullRecord = {
        ...newRecord,
        id: newRecord.id || `att-${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as AttendanceRecord;

      const current = loadAttendanceRecords();
      const updated = [fullRecord, ...current.filter(r => r.id !== fullRecord.id)];
      saveAttendanceRecords(updated);
      setRecords(updated);
      
      // Registrar log no sistema
      onAddAuditLog?.({
        militaryName: supervisorName,
        militaryLogin: currentUser?.username || 'secinfo',
        role: supervisorRole,
        actionType: 'STATUS_MISSAO',
        summary: `Tiragem de Faltas realizada (${rollShift} - ${rollDate}): ${countPresent} presentes de ${totalStrength} militares`,
        details: rollNotes ? `Observações: ${rollNotes}` : undefined,
        targetRef: `FORMATURA-${rollDate}`,
      });

      setSaveSuccessMessage(true);
      setTimeout(() => setSaveSuccessMessage(false), 3000);
      setActiveTab('history');
    } catch (err: any) {
      alert(`Erro ao salvar tiragem de faltas: ${err?.message || 'Falha no banco de dados'}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredHistoryRecords = (Array.isArray(records) ? records : []).filter(r => {
    if (queryDate && r.date !== queryDate) return false;
    return true;
  });

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border-2 border-[#27431e]/50 max-h-[92vh] flex flex-col space-y-4 my-auto cursor-default"
      >
        
        {/* Topo do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#1e3316] text-[#dfb642] shadow-sm shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#1e3316] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  2º GAC
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#dfb642] text-[#192b14]">
                  Seção de Informática & TI
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                Tiragem de Faltas & Efetivo da Seção
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Abas Superiores: 1. Realizar Chamada | 2. Consultar Histórico por Data */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('new_roll')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              activeTab === 'new_roll'
                ? 'border-[#27431e] text-[#1e3316] bg-slate-50 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-[#27431e]" />
            <span>Realizar Chamada / Formatura</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#27431e] text-[#1e3316] bg-slate-50 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#27431e]" />
            <span>Consultar Efetivo por Data ({records.length} registros)</span>
          </button>
        </div>

        {saveSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Tiragem de faltas registrada com sucesso no banco de dados e nos logs de auditoria militar!</span>
          </div>
        )}

        {/* ABA 1: REALIZAR CHAMADA */}
        {activeTab === 'new_roll' && (
          <form onSubmit={handleSaveRollCall} className="flex-1 flex flex-col space-y-4 overflow-hidden">
            
            {/* Linha de Configuração da Formatura */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#27431e]" />
                  <span>Data da Formatura:</span>
                </label>
                <input
                  type="date"
                  required
                  value={rollDate}
                  onChange={(e) => setRollDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#27431e]" />
                  <span>Horário:</span>
                </label>
                <input
                  type="time"
                  required
                  value={rollTime}
                  onChange={(e) => setRollTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Formatura:</label>
                <select
                  value={rollShift}
                  onChange={(e) => setRollShift(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                >
                  <option value="Formatura Matinal">Formatura Matinal (07:30)</option>
                  <option value="Formatura do Meio-Dia">Formatura 12:00</option>
                  <option value="Formatura de Fim de Expediente">Fim de Expediente (17:00)</option>
                  <option value="Formatura Extraordinária">Formação Extraordinária</option>
                  <option value="Serviço de Plantão / Final de Semana">Plantão / Final de Semana</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Marcar Todos Presentes</span>
                </button>
              </div>
            </div>

            {/* Painel de Força do Efetivo */}
            <div className="grid grid-cols-4 gap-2 text-center p-2.5 rounded-xl bg-[#1e3316] text-white">
              <div>
                <span className="text-[10px] text-emerald-200/80 font-mono block">Efetivo Total</span>
                <strong className="text-base sm:text-lg font-black font-mono text-[#dfb642]">{totalStrength}</strong>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200/80 font-mono block">Presentes (Em Forma)</span>
                <strong className="text-base sm:text-lg font-black font-mono text-emerald-300">{countPresent}</strong>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200/80 font-mono block">Faltas / Ausências</span>
                <strong className="text-base sm:text-lg font-black font-mono text-red-300">{countAbsent}</strong>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200/80 font-mono block">Prontidão</span>
                <strong className="text-base sm:text-lg font-black font-mono text-white">{presencePct}%</strong>
              </div>
            </div>

            {/* Lista de Militares para a Chamada */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2 bg-slate-50/50 max-h-[40vh]">
              {roster.map((item, idx) => {
                const config = (item?.status && STATUS_CONFIG[item.status]) || STATUS_CONFIG.PRESENTE;
                return (
                  <div
                    key={item.militaryId}
                    className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                      item.status === 'PRESENTE' 
                        ? 'bg-white border-slate-200' 
                        : item.status === 'FALTA'
                          ? 'bg-red-50/70 border-red-300'
                          : 'bg-amber-50/70 border-amber-300'
                    }`}
                  >
                    {/* Identificação do Militar */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono font-bold text-slate-400 w-5">{idx + 1}.</span>
                      <div className="w-8 h-8 rounded-lg bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center justify-center font-mono shrink-0">
                        {(item.warName || item.militaryName || 'MI').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <strong className="text-xs font-bold text-slate-900 block truncate">
                          {item.militaryName}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Nome de Guerra: {item.warName || item.militaryName}
                        </span>
                      </div>
                    </div>

                    {/* Seleção do Status Militar */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((st) => {
                        const isSelected = item.status === st;
                        const cfg = STATUS_CONFIG[st];
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(item.militaryId, st)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                              isSelected
                                ? cfg.badge + ' ring-1 ring-black/20 shadow-xs scale-102'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{cfg.icon}</span>
                            <span className="ml-1">{cfg.short}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Justificativa se não for presente */}
                    {item.status !== 'PRESENTE' && (
                      <div className="w-full md:w-56">
                        <input
                          type="text"
                          placeholder="Justificativa da falta / missão..."
                          value={item.reason || ''}
                          onChange={(e) => handleReasonChange(item.militaryId, e.target.value)}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Observações Gerais do Superior */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações do Superior / Xerife da TI:
              </label>
              <input
                type="text"
                placeholder="Ex: Formatura regular sem alterações. 1 militar na guarda até 10:00."
                value={rollNotes}
                onChange={(e) => setRollNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            {/* Botões do Rodapé */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Registrado por: <strong>{currentUser?.name || 'Chefe da Seção de TI'}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] shadow-md border border-[#cba135] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSaving ? 'Gravando...' : 'Salvar Tiragem de Faltas'}</span>
                </button>
              </div>
            </div>

          </form>
        )}

        {/* ABA 2: CONSULTAR HISTÓRICO POR DATA X */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            
            {/* Barra de Filtro de Data */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="font-bold text-slate-700 whitespace-nowrap">Consultar Data X:</span>
                <input
                  type="date"
                  value={queryDate}
                  onChange={(e) => setQueryDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold bg-white text-xs"
                />
                <button
                  onClick={() => setQueryDate('')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Ver Todas
                </button>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Exibindo <strong>{filteredHistoryRecords.length}</strong> registro(s) arquivados
              </div>
            </div>

            {/* Lista de Registros Encontrados */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[48vh] pr-1">
              {filteredHistoryRecords.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Nenhum registro de formatura/faltas encontrado para a data <strong>{queryDate || 'selecionada'}</strong>.
                </div>
              ) : (
                filteredHistoryRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#27431e] shadow-xs space-y-3 transition-all"
                  >
                    {/* Cabeçalho do Registro */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-[#1e3316] text-[#dfb642] px-2.5 py-1 rounded-lg">
                          {formatDateSafe(record.date)} · {record.time || ''}
                        </span>
                        <span className="font-bold text-xs text-slate-900">
                          {record.shift}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {record.totalPresent}/{record.totalStrength} Presentes ({record.totalStrength > 0 ? Math.round((record.totalPresent / record.totalStrength) * 100) : 100}%)
                        </span>
                        {record.totalAbsent > 0 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-100 text-red-900 border border-red-300">
                            {record.totalAbsent} Falta(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Detalhes do Supervisor e Observações */}
                    <div className="text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span>Oficial/Sargento Responsável: </span>
                        <strong className="text-slate-900">{record.supervisorName} ({record.supervisorRole})</strong>
                      </div>
                      {record.notes && (
                        <div className="italic text-slate-500">
                          "{record.notes}"
                        </div>
                      )}
                    </div>

                    {/* Grade de Militares da Formatura */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      {parseRosterSafe(record.roster).map((m, idx) => {
                        if (!m) return null;
                        const statusKey = m.status as AttendanceStatus;
                        const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PRESENTE;
                        return (
                          <div 
                            key={m.militaryId || idx}
                            className={`p-2 rounded-lg border flex items-center justify-between gap-1.5 ${
                              m.status === 'PRESENTE' ? 'bg-slate-50 border-slate-200' : 'bg-red-50/60 border-red-200'
                            }`}
                          >
                            <span className="font-semibold text-slate-800 truncate">
                              {m.rank || ''} {m.warName || m.militaryName || 'Militar'}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${cfg.badge}`}>
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé com botão de impressão */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Mapa de Efetivo do Dia</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
