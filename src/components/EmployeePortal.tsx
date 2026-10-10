import React, { useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  Printer, 
  Wifi, 
  Monitor, 
  KeyRound, 
  Mail, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  Building2, 
  FileText, 
  Star, 
  AlertTriangle,
  Printer as PrintIcon,
  Shield,
  Layers, 
  ArrowRight,
  MessageSquare,
  Send,
  Download,
  Loader2,
  X,
  Camera
} from 'lucide-react';
import { Ticket, Department, Category, AccessibilitySettings, Priority } from '../types';
import { generateTicketPdf } from '../utils/ticketPdf';

interface EmployeePortalProps {
  tickets: Ticket[];
  departments: Department[];
  categories: Category[];
  a11y: AccessibilitySettings;
  onCreateTicket: (ticketData: {
    title: string;
    description: string;
    category: string;
    departmentId: string;
    requesterName: string;
    requesterAvatar?: string;
    priority: Priority;
  }) => Ticket;
  onUpdateTicketRating: (ticketId: string, rating: number, comment?: string) => void;
  onSendMessage: (ticketId: string, content: string, sender: 'solicitante' | 'ti', senderName: string) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  tickets,
  departments,
  categories,
  a11y,
  onCreateTicket,
  onUpdateTicketRating,
  onSendMessage,
}) => {
  const [activeView, setActiveView] = useState<'create' | 'track'>('create');
  
  // Form State
  const [requesterName, setRequesterName] = useState('');
  const [requesterAvatar, setRequesterAvatar] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-printer');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('media');

  const handleRequesterAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('A foto deve ter no máximo 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setRequesterAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Track State: Apenas por código do chamado
  const [searchCodeInput, setSearchCodeInput] = useState('');
  const [searchedCode, setSearchedCode] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<Ticket | null>(null);
  const [clientChatInput, setClientChatInput] = useState('');

  // Category Icon helper
  const renderCategoryIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case 'Printer': return <Printer className={className} />;
      case 'Wifi': return <Wifi className={className} />;
      case 'Monitor': return <Monitor className={className} />;
      case 'KeyRound': return <KeyRound className={className} />;
      case 'Mail': return <Mail className={className} />;
      case 'Layers': return <Layers className={className} />;
      default: return <HelpCircle className={className} />;
    }
  };

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat.id);
    if (!title || categories.some(c => c.name === title)) {
      setTitle(cat.name);
    }
    setPriority(cat.defaultPriority);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterName.trim() || !departmentId || !description.trim()) {
      alert('Por favor, informe seu Posto/Graduação com Nome de Guerra, selecione sua seção e descreva o problema.');
      return;
    }

    const currentCat = categories.find(c => c.id === selectedCategory);
    const finalTitle = title.trim() || currentCat?.name || 'Solicitação de Suporte TI';

    const newTicket = onCreateTicket({
      title: finalTitle,
      description: description.trim(),
      category: currentCat?.name || 'Geral',
      departmentId,
      requesterName: requesterName.trim(),
      requesterAvatar: requesterAvatar || undefined,
      priority,
    });

    setSubmittedTicket(newTicket);

    // Limpa campos
    setTitle('');
    setDescription('');
    setPriority('media');
    setRequesterAvatar('');
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrintProof = async (targetTicket?: Ticket | null) => {
    const t = targetTicket || submittedTicket;
    if (!t) return;
    try {
      setIsGeneratingPdf(true);
      const deptName = departments.find(d => d.id === t.departmentId)?.name;
      await generateTicketPdf(t, deptName);
    } catch (err) {
      console.error('Erro ao gerar PDF do comprovante:', err);
      // Fallback
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Busca estrita de chamado por código
  const handleSearchByCode = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedCode(searchCodeInput.trim());
  };

  // Busca instantânea estrita:
  // Requisito obrigatório do usuário: É estritamente obrigatório conter o traço "-" no código (ex: TICKET-1001).
  // Sem o traço "-", a busca não é executada.
  const rawInput = searchCodeInput.trim().toUpperCase();
  const hasHyphen = rawInput.includes('-');
  const digitsOnly = rawInput.replace(/\D/g, '');
  const hasDigits = digitsOnly.length > 0;

  const foundTicket = (hasHyphen && hasDigits)
    ? tickets.find(t => {
        const ticketUpper = t.code.toUpperCase();
        if (ticketUpper === rawInput) return true;
        if (ticketUpper.endsWith(rawInput)) return true;
        const ticketParts = ticketUpper.split('-');
        const searchParts = rawInput.split('-');
        const ticketNum = ticketParts[1] || '';
        const searchNum = searchParts[1] || '';
        if (searchNum && ticketNum === searchNum) {
          const searchPrefix = searchParts[0];
          if (!searchPrefix || searchPrefix === 'TICKET' || ticketParts[0].includes(searchPrefix)) {
            return true;
          }
        }
        return false;
      })
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      
      {/* Banner Institucional do Exército Brasileiro */}
      <div className={`mb-8 p-6 sm:p-8 rounded-3xl border-2 transition-all shadow-md ${
        a11y.highContrast 
          ? 'bg-neutral-950 border-yellow-400 text-white' 
          : 'bg-gradient-to-r from-[#1e3316] via-[#27431e] to-[#1e3316] border-[#cba135]/50 text-white'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-black uppercase tracking-widest bg-[#dfb642] text-[#192b14]">
                2º GAC
              </span>
              <span className="text-xs text-emerald-200/80 font-mono">
                Seção de Informática & TI
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Central de Chamados do Regimento Deodoro
            </h1>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Abertura e consulta de ordens de serviço de informática para todas as Baterias e Seções da OM.
            </p>
          </div>

          <div className="shrink-0 p-3 rounded-2xl bg-[#192b14]/70 border border-[#cba135]/40 text-[#dfb642]">
            <Shield className="w-10 h-10" />
          </div>
        </div>

        {/* Abas Grandes de Escolha: "Abrir Chamado" ou "Consultar Chamado" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => {
              setActiveView('create');
              setSubmittedTicket(null);
            }}
            className={`p-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all border-2 ${
              activeView === 'create'
                ? a11y.highContrast
                  ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                  : 'bg-[#dfb642] text-[#192b14] border-[#cba135] shadow-lg scale-[1.01]'
                : a11y.highContrast
                  ? 'bg-black text-white border-neutral-700'
                  : 'bg-[#192b14]/80 text-emerald-100 border-[#385e2b] hover:bg-[#192b14]'
            }`}
          >
            <PlusCircle className="w-6 h-6" />
            <span>1. Abrir Novo Chamado</span>
          </button>

          <button
            onClick={() => {
              setActiveView('track');
              setSubmittedTicket(null);
            }}
            className={`p-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all border-2 ${
              activeView === 'track'
                ? a11y.highContrast
                  ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                  : 'bg-[#dfb642] text-[#192b14] border-[#cba135] shadow-lg scale-[1.01]'
                : a11y.highContrast
                  ? 'bg-black text-white border-neutral-700'
                  : 'bg-[#192b14]/80 text-emerald-100 border-[#385e2b] hover:bg-[#192b14]'
            }`}
          >
            <Search className="w-6 h-6" />
            <span>2. Consultar Chamado (Por Código)</span>
          </button>
        </div>
      </div>

      {/* Visualização 1: Formulário de Abertura de Chamado */}
      {activeView === 'create' && !submittedTicket && (
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ETAPA 1: Identificação do Militar e Seção da OM */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            a11y.highContrast 
              ? 'bg-neutral-950 border-neutral-700' 
              : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                a11y.highContrast ? 'bg-yellow-400 text-black' : 'bg-[#27431e] text-[#dfb642]'
              }`}>
                1
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                Identificação do Militar e Seção da OM
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome Militar */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-800">
                  <User className="w-4 h-4 text-[#27431e]" />
                  <span>Posto / Graduação e Nome de Guerra:</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cap Silva Ramos, 1º Sgt Oliveira, Cb Souza"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-base font-medium focus:ring-2 focus:ring-[#27431e] ${
                    a11y.highContrast
                      ? 'bg-black border-yellow-400 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>

              {/* Seção da OM */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-800">
                  <Building2 className="w-4 h-4 text-[#27431e]" />
                  <span>Selecione a sua Seção da OM:</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-base font-semibold focus:ring-2 focus:ring-[#27431e] ${
                    a11y.highContrast
                      ? 'bg-black border-yellow-400 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                  }`}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {departments.find(d => d.id === departmentId)?.description}
                </p>
              </div>

              {/* Foto de Identificação do Solicitante (Opcional) */}
              <div className="md:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1e3316] text-[#dfb642] flex items-center justify-center font-bold overflow-hidden shrink-0 border border-[#cba135]/40 shadow-inner">
                  {requesterAvatar ? (
                    <img src={requesterAvatar} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 opacity-60" />
                  )}
                </div>
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-[#27431e] font-bold text-xs text-slate-700 cursor-pointer shadow-2xs inline-block">
                      <span>Anexar Foto de Identificação (Opcional)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleRequesterAvatarUpload}
                      />
                    </label>
                    {requesterAvatar && (
                      <button
                        type="button"
                        onClick={() => setRequesterAvatar('')}
                        className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                      >
                        Remover Foto
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Facilita a identificação visual do militar pelo técnico de informática durante o atendimento no quartel.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ETAPA 2: Seleção Rápida de Categoria */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            a11y.highContrast 
              ? 'bg-neutral-950 border-neutral-700' 
              : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                a11y.highContrast ? 'bg-yellow-400 text-black' : 'bg-[#27431e] text-[#dfb642]'
              }`}>
                2
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Selecione o tipo de ocorrência:
                </h2>
                <p className="text-sm text-slate-500">
                  Clique no item que mais se aproxima da sua solicitação.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`p-4 rounded-2xl text-left transition-all border-2 flex items-start gap-3.5 ${
                      isSelected
                        ? a11y.highContrast
                          ? 'bg-yellow-400 text-black border-yellow-400 ring-2 ring-yellow-400'
                          : 'bg-[#27431e]/10 border-[#27431e] ring-2 ring-[#27431e]/20 text-[#192b14]'
                        : a11y.highContrast
                          ? 'bg-black text-white border-neutral-700 hover:border-yellow-400'
                          : 'bg-white border-slate-200 hover:border-[#385e2b] hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected
                        ? a11y.highContrast ? 'bg-black text-yellow-400' : 'bg-[#27431e] text-[#dfb642]'
                        : a11y.highContrast ? 'bg-neutral-800 text-white' : 'bg-slate-100 text-[#27431e]'
                    }`}>
                      {renderCategoryIcon(cat.icon, 'w-6 h-6')}
                    </div>
                    <div>
                      <div className="font-bold text-base leading-snug">
                        {cat.name}
                      </div>
                      <div className={`mt-1 text-xs line-clamp-2 ${
                        isSelected 
                          ? a11y.highContrast ? 'text-neutral-900' : 'text-[#27431e]' 
                          : 'text-slate-500'
                      }`}>
                        {cat.simpleInstructions}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ETAPA 3: Prioridade Escolhida Diretamente pelo Solicitante */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            a11y.highContrast 
              ? 'bg-neutral-950 border-neutral-700' 
              : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                a11y.highContrast ? 'bg-yellow-400 text-black' : 'bg-[#27431e] text-[#dfb642]'
              }`}>
                3
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Prioridade do Atendimento:
                </h2>
                <p className="text-sm text-slate-500">
                  Defina o nível de urgência com base no impacto nas atividades da seção.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Baixa */}
              <button
                type="button"
                onClick={() => setPriority('baixa')}
                className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                  priority === 'baixa'
                    ? 'border-slate-800 bg-slate-100 ring-2 ring-slate-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      Baixa
                    </span>
                    {priority === 'baixa' && <CheckCircle2 className="w-5 h-5 text-slate-800" />}
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-2">Dúvida ou Ajuste</div>
                  <div className="text-xs text-slate-500 mt-1">Pode aguardar sem comprometer o expediente da seção.</div>
                </div>
              </button>

              {/* Média */}
              <button
                type="button"
                onClick={() => setPriority('media')}
                className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                  priority === 'media'
                    ? 'border-[#27431e] bg-emerald-50 ring-2 ring-[#27431e]/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-[#27431e] text-[#dfb642]">
                      Média
                    </span>
                    {priority === 'media' && <CheckCircle2 className="w-5 h-5 text-[#27431e]" />}
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-2">Ocorrência de Rotina</div>
                  <div className="text-xs text-slate-500 mt-1">Gera transtorno pontual, mas o trabalho continua.</div>
                </div>
              </button>

              {/* Alta */}
              <button
                type="button"
                onClick={() => setPriority('alta')}
                className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                  priority === 'alta'
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-orange-500 text-white">
                      Alta
                    </span>
                    {priority === 'alta' && <CheckCircle2 className="w-5 h-5 text-orange-600" />}
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-2">Urgência Elevada</div>
                  <div className="text-xs text-slate-500 mt-1">Prejudica prazos urgentes, pregões ou confecção de ordens.</div>
                </div>
              </button>

              {/* Crítica */}
              <button
                type="button"
                onClick={() => setPriority('critica')}
                className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                  priority === 'critica'
                    ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                      Crítica
                    </span>
                    {priority === 'critica' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-2">Emergência Operacional</div>
                  <div className="text-xs text-slate-500 mt-1">Bloqueio total de missão, fechamento de BI ou máquina inoperante.</div>
                </div>
              </button>

            </div>
          </div>

          {/* ETAPA 4: Descrição do Problema */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            a11y.highContrast 
              ? 'bg-neutral-950 border-neutral-700' 
              : 'bg-white border-slate-200/90 shadow-xs'
          }`}>
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                a11y.highContrast ? 'bg-yellow-400 text-black' : 'bg-[#27431e] text-[#dfb642]'
              }`}>
                4
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Descreva a Ocorrência:
                </h2>
                <p className="text-sm text-slate-500">
                  Forneça informações claras para facilitar o diagnóstico pela equipe de TI.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-800">
                  <FileText className="w-4 h-4 text-[#27431e]" />
                  <span>Assunto / Resumo da Falha:</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Impressora travando no BI ou falha de acesso ao SISBOL"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-base font-medium focus:ring-2 focus:ring-[#27431e] ${
                    a11y.highContrast
                      ? 'bg-black border-yellow-400 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-slate-800">
                  Detalhamento da solicitação:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Exemplo: Ao tentar imprimir o Boletim Interno de hoje, a impressora HP da 1ª Seção acusou emperramento de papel na gaveta 2 e está com luz vermelha fixa."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-base font-medium focus:ring-2 focus:ring-[#27431e] ${
                    a11y.highContrast
                      ? 'bg-black border-yellow-400 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-5 px-8 rounded-2xl font-black text-lg sm:text-xl tracking-wide uppercase transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.99] border-2 ${
                a11y.highContrast
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-[#1e3316] text-[#dfb642] border-[#cba135] hover:bg-[#27431e]'
              }`}
            >
              <CheckCircle2 className="w-7 h-7" />
              <span>ENVIAR CHAMADO PARA A SEÇÃO DE INFORMÁTICA</span>
            </button>
          </div>
        </form>
      )}

      {/* TELA DE COMPROVANTE APÓS ABERTURA DO CHAMADO */}
      {submittedTicket && (
        <div className={`p-8 rounded-3xl border-2 transition-all text-center max-w-2xl mx-auto ${
          a11y.highContrast 
            ? 'bg-neutral-950 border-yellow-400 text-white' 
            : 'bg-white border-[#27431e] shadow-2xl'
        }`}>
          <div className="w-20 h-20 bg-[#27431e]/15 text-[#27431e] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#27431e]/30">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="font-mono text-xs font-black tracking-widest text-[#27431e] uppercase">
            Exército Brasileiro · Seção de Informática
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
            Chamado Registrado na OM!
          </h2>
          <p className="mt-2 text-base text-slate-600">
            A equipe de TI já recebeu o seu chamado na fila de atendimento da Seção de Informática.
          </p>

          <div className={`my-6 p-6 rounded-2xl border text-left space-y-3 ${
            a11y.highContrast ? 'bg-black border-yellow-400' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-500">Número do Registro:</span>
              <span className="text-3xl font-black font-mono text-[#27431e]">
                {submittedTicket.code}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Militar Solicitante:</span>
              <span className="text-base font-bold text-slate-900">{submittedTicket.requesterName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Seção da OM:</span>
              <span className="text-base font-bold text-slate-900">
                {departments.find(d => d.id === submittedTicket.departmentId)?.name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Assunto:</span>
              <span className="text-base font-bold text-slate-900">{submittedTicket.title}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Prioridade Indicada:</span>
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase font-mono ${
                submittedTicket.priority === 'critica' ? 'bg-red-600 text-white' :
                submittedTicket.priority === 'alta' ? 'bg-orange-600 text-white' :
                submittedTicket.priority === 'media' ? 'bg-[#27431e] text-[#dfb642]' :
                'bg-slate-600 text-white'
              }`}>
                {submittedTicket.priority}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => handlePrintProof(submittedTicket)}
              disabled={isGeneratingPdf}
              className="px-6 py-3 rounded-xl border border-slate-300 font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors cursor-pointer bg-white text-slate-800 shadow-xs"
              title="Baixar comprovante oficial em formato PDF com timbre do 2º GAC"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-5 h-5 text-[#27431e] animate-spin" />
                  <span>Gerando Comprovante PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 text-[#27431e]" />
                  <span>Imprimir Comprovante (.PDF)</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setSubmittedTicket(null);
                setActiveView('track');
                setSearchCodeInput('');
                setSearchedCode('');
              }}
              className="px-6 py-3 rounded-xl bg-[#27431e] text-[#dfb642] font-black flex items-center justify-center gap-2 hover:bg-[#1e3316] transition-colors shadow-md cursor-pointer"
            >
              <Search className="w-5 h-5" />
              <span>Consultar Andamento do Chamado</span>
            </button>

            <button
              onClick={() => {
                setSubmittedTicket(null);
                setActiveView('create');
              }}
              className="px-6 py-3 rounded-xl bg-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2 hover:bg-slate-300 transition-colors cursor-pointer"
            >
              <span>Abrir Outro Chamado</span>
            </button>
          </div>
        </div>
      )}

      {/* Visualização 2: Consulta de Chamado EXCLUSIVAMENTE POR CÓDIGO (Só exibido quando não está na tela de conclusão) */}
      {!submittedTicket && activeView === 'track' && (
        <div className="space-y-6">
          <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
            a11y.highContrast 
              ? 'bg-neutral-950 border-neutral-700' 
              : 'bg-white border-slate-200/90 shadow-sm'
          }`}>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-2">
              Consultar Andamento do Chamado
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Para acompanhar o andamento, digite o <strong>código do seu chamado com o hífen</strong> presente no comprovante de abertura (ex: <code className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-[#1e3316]">TICKET-1001</code>). É obrigatório incluir o traço <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold text-red-600">-</code>. Ao digitar o código completo, o sistema localiza os dados automaticamente sem necessidade de clicar em botões.
            </p>

            <div className="relative w-full">
              <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Digite o código com traço (ex: TICKET-1001)..."
                value={searchCodeInput}
                onChange={(e) => setSearchCodeInput(e.target.value)}
                className={`w-full pl-13 pr-12 py-4 rounded-2xl border text-lg font-mono font-bold uppercase focus:ring-2 focus:ring-[#27431e] ${
                  a11y.highContrast
                    ? 'bg-black border-yellow-400 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
              {searchCodeInput && (
                <button
                  type="button"
                  onClick={() => setSearchCodeInput('')}
                  title="Limpar campo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Estado 1: Quando campo está vazio */}
          {!searchCodeInput.trim() && (
            <div className="p-10 text-center rounded-3xl bg-white border border-slate-200/80 text-slate-500 space-y-2">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-base text-slate-700">Aguardando código do chamado...</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Digite o código com o traço (ex: <code className="font-mono font-bold text-[#1e3316]">TICKET-1001</code>). O sistema puxará os dados instantaneamente.
              </p>
            </div>
          )}

          {/* Estado 2: Quando digitou sem o traço '-' */}
          {searchCodeInput.trim() && !hasHyphen && (
            <div className="p-8 text-center rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="font-bold text-base">Hífen obrigatório no código</p>
              <p className="text-xs text-amber-800 max-w-md mx-auto">
                O código do chamado deve conter obrigatoriamente o traço <code className="font-mono font-black text-red-600">-</code> (ex: <code className="font-mono font-black">TICKET-{digitsOnly || '1001'}</code>). Insira o traço para consultar.
              </p>
            </div>
          )}

          {/* Estado 3: Quando digitou com traço mas não encontrou */}
          {hasHyphen && hasDigits && !foundTicket && (
            <div className="p-10 text-center rounded-3xl bg-white border border-red-200 text-slate-600 space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Chamado não localizado
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Nenhum chamado foi encontrado com o número <strong className="font-mono text-red-600">"{searchCodeInput.trim()}"</strong>. Certifique-se de digitar o número que consta no seu comprovante.
              </p>
            </div>
          )}

          {/* Estado 3: Chamado Encontrado Automaticamente com Nome Puxado */}
          {foundTicket && (
            <div className="space-y-4 animate-in fade-in">
              {/* Notificação destacada com o Nome do Chamado no Sistema */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1e3316] text-[#dfb642] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-2 border-[#cba135]/50 shadow-md">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#27431e] text-[#dfb642] shrink-0 border border-[#cba135]/40">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider block text-emerald-200 truncate">
                      Chamado Localizado no Sistema · 2º GAC
                    </span>
                    <h3 className="text-sm sm:text-lg font-black text-white leading-tight break-words">
                      {foundTicket.title}
                    </h3>
                  </div>
                </div>
                <span className="font-mono font-black text-xs px-3 py-1.5 rounded-xl bg-[#dfb642] text-[#192b14] shrink-0 self-start sm:self-auto">
                  {foundTicket.code}
                </span>
              </div>
              {(() => {
                const t = foundTicket;
                const dept = departments.find(d => d.id === t.departmentId);
                const isResolved = t.status === 'resolvido';
                const isInProgress = t.status === 'em_atendimento';
                const isWaiting = t.status === 'aguardando';

                return (
                  <div
                    key={t.id}
                    className={`p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 transition-all ${
                      a11y.highContrast
                        ? 'bg-neutral-950 border-neutral-700 text-white'
                        : isResolved
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : isInProgress
                            ? 'bg-[#eef3eb] border-[#27431e]/40'
                            : 'bg-white border-slate-200 shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-mono font-black text-xl sm:text-2xl text-[#1e3316]">
                            {t.code}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-700">
                            {dept?.name}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-[11px] sm:text-xs text-slate-500">
                            Aberto em {new Date(t.createdAt).toLocaleDateString('pt-BR')} às {new Date(t.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-2xl font-black mt-1 text-slate-900 break-words">
                          {t.title}
                        </h3>
                      </div>

                      {/* Status Visual e Comprovante */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePrintProof(t)}
                          disabled={isGeneratingPdf}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 bg-white text-slate-800 shadow-2xs cursor-pointer transition-colors"
                          title="Baixar o arquivo .pdf oficial com as informações deste chamado"
                        >
                          {isGeneratingPdf ? (
                            <Loader2 className="w-3.5 h-3.5 text-[#27431e] animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-[#27431e]" />
                          )}
                          <span>Comprovante (.PDF)</span>
                        </button>

                        {isResolved ? (
                          <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center gap-2 shadow-sm">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>RESOLVIDO</span>
                          </span>
                        ) : isInProgress ? (
                          <span className="px-4 py-2 rounded-xl bg-[#27431e] text-[#dfb642] font-black text-sm flex items-center gap-2 animate-pulse shadow-sm">
                            <Clock className="w-5 h-5" />
                            <span>EM ATENDIMENTO</span>
                          </span>
                        ) : isWaiting ? (
                          <span className="px-4 py-2 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center gap-2 shadow-sm">
                            <Clock className="w-5 h-5" />
                            <span>AGUARDANDO PEÇA</span>
                          </span>
                        ) : (
                          <span className="px-4 py-2 rounded-xl bg-slate-700 text-white font-black text-sm flex items-center gap-2 shadow-sm">
                            <Clock className="w-5 h-5" />
                            <span>NA FILA DA TI</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Descrição e Solicitante */}
                    <div className="py-4">
                      <p className="text-base text-slate-800 leading-relaxed font-medium">
                        {t.description}
                      </p>
                      <div className="mt-3 text-xs text-slate-600 flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
                        <span><strong>Militar:</strong> {t.requesterName}</span>
                        <span><strong>Categoria:</strong> {t.category}</span>
                        <span><strong>Prioridade:</strong> <span className="uppercase font-bold">{t.priority}</span></span>
                      </div>
                    </div>

                    {/* Linha do Tempo Visual */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        Andamento do Atendimento na Seção de TI:
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className={`p-3 rounded-xl font-bold ${
                          t.status !== 'cancelado' ? 'bg-[#27431e]/15 text-[#192b14]' : 'bg-slate-100 text-slate-500'
                        }`}>
                          ✓ 1. Chamado Registrado
                        </div>
                        <div className={`p-3 rounded-xl font-bold ${
                          isInProgress || isResolved ? 'bg-[#27431e] text-[#dfb642]' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isInProgress || isResolved ? '✓' : '○'} 2. Mecânico/Técnico Atribuído
                        </div>
                        <div className={`p-3 rounded-xl font-bold ${
                          isResolved ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isResolved ? '✓' : '○'} 3. Concluído
                        </div>
                      </div>
                    </div>

                    {/* CANAL DIRETO COM A SEÇÃO DE TI (MINI-CHAT / NOTIFICAÇÃO) */}
                    <div className="mt-5 p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#27431e]/30 shadow-xs space-y-4 text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#1e3316] text-[#dfb642] flex items-center justify-center shadow-xs">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 leading-tight">
                              Canal Direto com a Seção de Informática
                            </h4>
                            <span className="text-[11px] text-slate-500">
                              Tire dúvidas sobre previsão, andamento ou informe urgências diretamente aos mecânicos de TI
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                          ● Canal Aberto
                        </span>
                      </div>

                      {/* Histórico de Mensagens / Mini-Chat */}
                      <div className="space-y-2.5 max-h-60 overflow-y-auto p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        {(!t.messages || t.messages.length === 0) ? (
                          <div className="text-center py-4 text-xs text-slate-400 font-medium">
                            Nenhuma dúvida enviada ainda. Clique em uma das perguntas rápidas abaixo ou digite sua mensagem.
                          </div>
                        ) : (
                          t.messages.map((msg) => {
                            const isIntervention = msg.content.includes('[INTERVENÇÃO') || msg.content.includes('INTERVENÇÃO GERAL');

                            if (isIntervention) {
                              return (
                                <div 
                                  key={msg.id}
                                  className="flex flex-col items-center my-1.5 w-full"
                                >
                                  <div className="w-full max-w-[96%] p-3.5 rounded-2xl text-xs bg-red-50 border-2 border-red-500 text-red-950 shadow-md">
                                    <div className="flex items-center justify-between gap-3 mb-1.5 text-[10px] font-mono">
                                      <span className="font-bold flex items-center gap-1.5 flex-wrap">
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                                          <span>⚠️</span> INTERVENÇÃO GERAL
                                        </span>
                                        <span className="text-red-900 font-bold">{msg.senderName || 'Xerife da TI'}</span>
                                      </span>
                                      <span className="shrink-0 text-red-700 font-bold">
                                        {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="leading-relaxed font-semibold whitespace-pre-wrap text-red-900">
                                      {msg.content}
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div 
                                key={msg.id}
                                className={`flex flex-col ${msg.sender === 'solicitante' ? 'items-end' : 'items-start'}`}
                              >
                                <div className={`max-w-[90%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs ${
                                  msg.sender === 'solicitante'
                                    ? 'bg-[#1e3316] text-[#dfb642] rounded-br-xs shadow-xs'
                                    : 'bg-white border-2 border-[#cba135] text-slate-900 rounded-bl-xs shadow-sm'
                                }`}>
                                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-90 font-mono">
                                    <span className="font-bold flex items-center gap-1.5 flex-wrap">
                                      {msg.sender === 'solicitante' ? (
                                        <>
                                          <span className="inline-block px-1.5 py-0.5 rounded bg-[#dfb642] text-[#1e3316] font-black text-[9px] uppercase">
                                            VOCÊ
                                          </span>
                                          <span>Militar Solicitante</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="inline-block px-1.5 py-0.5 rounded bg-[#1e3316] text-[#dfb642] font-black text-[9px] uppercase">
                                            TI
                                          </span>
                                          <span className="text-[#1e3316] font-bold">{msg.senderName || 'Militar da TI'}</span>
                                        </>
                                      )}
                                    </span>
                                    <span className="shrink-0 text-slate-400">
                                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="leading-relaxed font-medium whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Botões de Perguntas Rápidas */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                          Perguntas Frequentes (Clique para enviar automaticamente):
                        </span>
                        <div className="flex flex-wrap gap-1.5 w-full">
                          {[
                            'Como está o andamento do atendimento?',
                            'Tem previsão de término / conclusão?',
                            'Preciso com urgência para o Boletim Interno / Expediente.',
                            'O militar da TI já está a caminho da seção?'
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                onSendMessage(t.id, preset, 'solicitante', t.requesterName);
                              }}
                              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 text-left"
                            >
                              <span>💬</span>
                              <span>{preset}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Formulário de Envio de Mensagem */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!clientChatInput.trim()) return;
                          onSendMessage(t.id, clientChatInput.trim(), 'solicitante', t.requesterName);
                          setClientChatInput('');
                        }}
                        className="flex flex-col sm:flex-row gap-2 pt-1 w-full"
                      >
                        <input
                          type="text"
                          placeholder="Digite sua dúvida ou mensagem para a Seção de TI..."
                          value={clientChatInput}
                          onChange={(e) => setClientChatInput(e.target.value)}
                          className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-[#27431e]"
                        />
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center justify-center gap-1.5 hover:bg-[#27431e] transition-colors border border-[#cba135] shadow-xs shrink-0 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar</span>
                        </button>
                      </form>
                    </div>

                    {/* Avaliação */}
                    {isResolved && (
                      <div className="mt-5 p-5 rounded-2xl bg-white border border-emerald-300 space-y-3 shadow-xs">
                        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                          <span>Como você avalia o atendimento da Seção de Informática?</span>
                        </div>
                        {t.resolutionNotes && (
                          <div className="text-xs text-slate-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            <strong>Despacho / Resolução da TI:</strong> {t.resolutionNotes}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => onUpdateTicketRating(t.id, star, t.userFeedback)}
                              className={`p-1.5 rounded-lg hover:scale-110 transition-transform cursor-pointer ${
                                (t.rating || 0) >= star ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
                              }`}
                              title={`Avaliar com ${star} estrelas`}
                            >
                              <Star className="w-8 h-8 fill-current" />
                            </button>
                          ))}
                          <span className="text-xs text-slate-700 ml-2 font-bold">
                            {t.rating ? `Avaliação: ${t.rating} de 5 estrelas` : 'Clique nas estrelas para avaliar'}
                          </span>
                        </div>

                        <div className="pt-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Comentário ou feedback sobre o atendimento (opcional):
                          </label>
                          <input
                            type="text"
                            defaultValue={t.userFeedback || ''}
                            placeholder="Deixe um elogio ou observação sobre a solução..."
                            onBlur={(e) => {
                              if (e.target.value !== (t.userFeedback || '')) {
                                onUpdateTicketRating(t.id, t.rating || 5, e.target.value);
                              }
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
