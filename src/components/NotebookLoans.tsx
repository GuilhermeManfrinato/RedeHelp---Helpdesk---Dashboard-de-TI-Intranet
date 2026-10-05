import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Plus, 
  Search, 
  RotateCcw, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Lock, 
  X,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Shield,
  MessageSquare,
  CalendarPlus,
  Send,
  History,
  User,
  Info,
  FileText,
  LayoutGrid,
  List,
  Trash2,
  Copy,
  Check,
  Edit3,
  GripVertical,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { NotebookLoan, Department, AccessibilitySettings, MilitaryUser, LoanHistoryItem, LoanMessage } from '../types';

interface NotebookLoansProps {
  loans: NotebookLoan[];
  departments: Department[];
  a11y: AccessibilitySettings;
  adminPassword: string;
  currentUser?: MilitaryUser | null;
  onAddLoan: (loan: Omit<NotebookLoan, 'id'>) => void;
  onReturnLoan: (
    loanId: string, 
    returnData: {
      returnDate: string;
      hasIssues: boolean;
      issues: string[];
      notes: string;
      authorizedBy: string;
    }
  ) => void;
  onExtendLoan?: (
    loanId: string,
    newExpectedDate: string,
    justification: string,
    authorizedBy: string
  ) => void;
  onSendLoanMessage?: (
    loanId: string,
    content: string,
    sender: 'militar' | 'ti',
    senderName: string
  ) => void;
  onDeleteLoan?: (loanId: string) => void;
  onUpdateLoan?: (loanId: string, updates: Partial<NotebookLoan>) => void;
  onAddAuditLog?: (log: any) => void;
}

const COMMON_ISSUES = [
  'LED queimado ou indicador apagado',
  'Teclado com defeito ou teclas falhando',
  'Tela danificada / trincada ou com listras',
  'Fonte / carregador com mau contato ou ausente',
  'Bateria viciada ou não segura carga',
  'Carcaça / dobradiça quebrada ou solta',
  'Lentidão extrema ou travamento contínuo',
  'Outro defeito físico ou operacional',
];

export const NotebookLoans: React.FC<NotebookLoansProps> = ({
  loans,
  departments,
  a11y,
  adminPassword,
  currentUser,
  onAddLoan,
  onReturnLoan,
  onExtendLoan,
  onSendLoanMessage,
  onDeleteLoan,
  onUpdateLoan,
  onAddAuditLog,
}) => {
  // Filtros
  const [filterStatus, setFilterStatus] = useState<'all' | 'cautelado' | 'devolvido' | 'atrasado'>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Drag and Drop de Cards no Quadro Kanban de Cautelas
  const [draggedLoanId, setDraggedLoanId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'em_uso' | 'prorrogado' | 'atrasado' | 'devolvido' | null>(null);
  const [quickReturnLoan, setQuickReturnLoan] = useState<NotebookLoan | null>(null);

  // Controle de Colunas Contraídas do Quadro Kanban
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({
    em_uso: false,
    prorrogado: false,
    atrasado: false,
    devolvido: false,
  });

  const toggleColumnCollapse = (colKey: string) => {
    setCollapsedColumns(prev => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  // Modal Exclusão de Cautela (Exclusivo Chefe da Seção)
  const [loanToDelete, setLoanToDelete] = useState<NotebookLoan | null>(null);

  // Modal Nova Cautela
  const [showNewModal, setShowNewModal] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerDept, setBorrowerDept] = useState(departments[0]?.id || '');
  const [notebookNumber, setNotebookNumber] = useState('');
  const [notebookName, setNotebookName] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [authorizedRole, setAuthorizedRole] = useState(currentUser?.name || '3º Sgt Das Deves (Ch Seç Info)');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Modal Devolução (Descautela)
  const [activeLoanForReturn, setActiveLoanForReturn] = useState<NotebookLoan | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasIssues, setHasIssues] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnAuthorizedRole, setReturnAuthorizedRole] = useState(currentUser?.name || '3º Sgt Das Deves (Ch Seç Info)');
  const [returnPassword, setReturnPassword] = useState('');
  const [returnAuthError, setReturnAuthError] = useState('');

  // Modal Prorrogação da Entrega
  const [activeLoanForExtension, setActiveLoanForExtension] = useState<NotebookLoan | null>(null);
  const [newExtensionDate, setNewExtensionDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [extensionJustification, setExtensionJustification] = useState('');
  const [extensionAuthorizedBy, setExtensionAuthorizedBy] = useState(currentUser?.name || '3º Sgt Das Deves');
  const [extensionError, setExtensionError] = useState('');

  // Modal Chat & Histórico da Cautela
  const [activeLoanForChat, setActiveLoanForChat] = useState<NotebookLoan | null>(null);
  const [loanChatInput, setLoanChatInput] = useState('');
  const [loanChatSender, setLoanChatSender] = useState<'ti' | 'militar'>('ti');

  // Sincronização em tempo real do modal de chat da cautela
  useEffect(() => {
    if (activeLoanForChat) {
      const fresh = loans.find(l => l.id === activeLoanForChat.id);
      if (fresh && JSON.stringify(fresh.messages) !== JSON.stringify(activeLoanForChat.messages)) {
        setActiveLoanForChat(fresh);
      }
    }
  }, [loans, activeLoanForChat]);

  // Modal Edição de Cautela
  const [editingLoan, setEditingLoan] = useState<NotebookLoan | null>(null);
  const [editBorrowerName, setEditBorrowerName] = useState('');
  const [editBorrowerDept, setEditBorrowerDept] = useState('');
  const [editNotebookNumber, setEditNotebookNumber] = useState('');
  const [editNotebookName, setEditNotebookName] = useState('');
  const [editExpectedReturnDate, setEditExpectedReturnDate] = useState('');
  const [editReturnNotes, setEditReturnNotes] = useState('');

  const handleOpenEditModal = (loan: NotebookLoan) => {
    setEditingLoan(loan);
    setEditBorrowerName(loan.borrowerName || '');
    setEditBorrowerDept(loan.departmentId || departments[0]?.id || '');
    setEditNotebookNumber(loan.notebookNumber || '');
    setEditNotebookName(loan.notebookName || '');
    setEditExpectedReturnDate(loan.expectedReturnDate || '');
    setEditReturnNotes(loan.returnNotes || '');
  };

  const handleSaveEditLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoan) return;

    const newHistoryItem: LoanHistoryItem = {
      id: `lh-${Date.now()}`,
      date: new Date().toISOString(),
      author: currentUser?.name || 'Seção de TI',
      action: 'inspecao',
      summary: `Dados da cautela alterados: Militar (${editBorrowerName}), Patrimônio (${editNotebookNumber}), Devolução (${editExpectedReturnDate}).`,
    };

    if (onUpdateLoan) {
      onUpdateLoan(editingLoan.id, {
        borrowerName: editBorrowerName.trim(),
        departmentId: editBorrowerDept,
        notebookNumber: editNotebookNumber.trim(),
        notebookName: editNotebookName.trim(),
        expectedReturnDate: editExpectedReturnDate,
        returnNotes: editReturnNotes.trim(),
        history: [...(editingLoan.history || []), newHistoryItem],
      });
    }

    onAddAuditLog?.({
      militaryName: currentUser?.name || 'Seção de TI',
      militaryLogin: currentUser?.username || 'ti',
      role: currentUser?.role || 'CH-SECINFO',
      actionType: 'EDICAO_CAUTELA',
      summary: `Editou os dados da cautela do notebook ${editNotebookNumber} (${editBorrowerName})`,
      targetRef: editNotebookNumber,
    });

    setEditingLoan(null);
  };

  // Fechamento de qualquer modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (loanToDelete) setLoanToDelete(null);
        else if (editingLoan) setEditingLoan(null);
        else if (quickReturnLoan) setQuickReturnLoan(null);
        else if (showNewModal) setShowNewModal(false);
        else if (activeLoanForReturn) setActiveLoanForReturn(null);
        else if (activeLoanForExtension) setActiveLoanForExtension(null);
        else if (activeLoanForChat) setActiveLoanForChat(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loanToDelete, editingLoan, quickReturnLoan, showNewModal, activeLoanForReturn, activeLoanForExtension, activeLoanForChat]);

  // Permissões militares
  const isChefe = currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'dev' || currentUser?.username === 'dev';
  const isXerife = currentUser?.role === 'CH-XERIFEINFO';
  const isTV = currentUser?.role === 'CH-TVINFO';
  const canManageLoans = Boolean(isChefe || isXerife); // Somente Chefe e Xerife criam ou autorizam novas cautelas
  const canDeleteLoans = Boolean(isChefe); // Exclusivo Chefe de Seção
  const canInteract = Boolean(currentUser && !isTV);

  // Sincronizar activeLoanForChat com o estado mais recente de loans (mensagens em tempo real)
  useEffect(() => {
    if (activeLoanForChat) {
      const updated = loans.find(l => l.id === activeLoanForChat.id);
      if (updated) {
        setActiveLoanForChat(updated);
      }
    }
  }, [loans]);

  // Função para copiar dados da cautela
  const [copiedLoanId, setCopiedLoanId] = useState<string | null>(null);
  const handleCopyLoan = (loan: NotebookLoan) => {
    const dept = departments.find(d => d.id === loan.departmentId);
    const text = `CAUTELA DE NOTEBOOK - 2º GAC\nPatrimônio: ${loan.notebookNumber}\nEquipamento: ${loan.notebookName}\nSeção: ${dept?.name || 'Não informada'}\nMilitar: ${loan.borrowerName}\nData Cautela: ${new Date(loan.loanDate + 'T00:00:00').toLocaleDateString('pt-BR')}\nPrazo Devolução: ${new Date(loan.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}\nStatus: ${loan.status.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedLoanId(loan.id);
    setTimeout(() => setCopiedLoanId(null), 2000);
  };

  // Verificação de atrasos
  const todayStr = new Date().toISOString().split('T')[0];
  const isLoanOverdue = (loan: NotebookLoan) => {
    return loan.status === 'cautelado' && loan.expectedReturnDate < todayStr;
  };

  // Handler para mover o card de uma tabela/coluna para outra no Quadro Kanban
  const handleDropOnLoanColumn = (targetCol: 'em_uso' | 'prorrogado' | 'atrasado' | 'devolvido') => {
    if (!draggedLoanId) return;
    const loan = loans.find(l => l.id === draggedLoanId);
    setDraggedLoanId(null);
    setDragOverColumn(null);
    if (!loan) return;

    const isOverdue = isLoanOverdue(loan);
    const isReturned = loan.status === 'devolvido';
    const isProrrogado = Boolean(loan.extensionCount && loan.extensionCount > 0);

    let currentColumn: 'em_uso' | 'prorrogado' | 'atrasado' | 'devolvido' = 'em_uso';
    if (isReturned) currentColumn = 'devolvido';
    else if (isOverdue) currentColumn = 'atrasado';
    else if (isProrrogado) currentColumn = 'prorrogado';
    else currentColumn = 'em_uso';

    if (currentColumn === targetCol) return;

    if (targetCol === 'devolvido') {
      // Abre modal rápido para descautela / devolução
      setQuickReturnLoan(loan);
    } else if (targetCol === 'prorrogado') {
      // Abre modal de prorrogação preenchido
      setActiveLoanForExtension(loan);
      const currExp = new Date(loan.expectedReturnDate + 'T00:00:00');
      currExp.setDate(currExp.getDate() + 7);
      setNewExtensionDate(currExp.toISOString().split('T')[0]);
      setExtensionJustification('Prorrogação de prazo via movimentação no Quadro Kanban');
      setExtensionError('');
    } else if (targetCol === 'em_uso') {
      // Retorna para "Em Uso (No Prazo)"
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const newDateStr = d.toISOString().split('T')[0];
      const newHistoryItem: LoanHistoryItem = {
        id: `lh-${Date.now()}`,
        date: new Date().toISOString(),
        author: currentUser?.name || 'Seção de TI',
        action: 'inspecao',
        summary: isReturned 
          ? `Cautela reativada no Quadro Kanban. Novo prazo regular até ${new Date(newDateStr + 'T00:00:00').toLocaleDateString('pt-BR')}.`
          : `Prazo regularizado no Quadro Kanban até ${new Date(newDateStr + 'T00:00:00').toLocaleDateString('pt-BR')}.`,
        newDate: newDateStr,
      };

      if (onUpdateLoan) {
        onUpdateLoan(loan.id, {
          status: 'cautelado',
          actualReturnDate: undefined,
          expectedReturnDate: newDateStr,
          extensionCount: 0,
          history: [...(loan.history || []), newHistoryItem],
        });
      }
    } else if (targetCol === 'atrasado') {
      // Move para "Em Atraso / Vencidos"
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const pastDateStr = d.toISOString().split('T')[0];
      const newHistoryItem: LoanHistoryItem = {
        id: `lh-${Date.now()}`,
        date: new Date().toISOString(),
        author: currentUser?.name || 'Seção de TI',
        action: 'inspecao',
        summary: 'Movido para a coluna de Atraso / Cobrança de Devolução no Quadro Kanban.',
        previousDate: loan.expectedReturnDate,
        newDate: pastDateStr,
      };

      if (onUpdateLoan) {
        onUpdateLoan(loan.id, {
          status: 'cautelado',
          expectedReturnDate: pastDateStr,
          history: [...(loan.history || []), newHistoryItem],
        });
      }
    }
  };

  // Contadores
  const totalCount = loans.length;
  const activeCount = loans.filter(l => l.status === 'cautelado').length;
  const returnedCount = loans.filter(l => l.status === 'devolvido').length;
  const overdueCount = loans.filter(l => isLoanOverdue(l)).length;

  // Filtragem
  const filteredLoans = loans.filter(l => {
    if (filterStatus === 'cautelado' && l.status !== 'cautelado') return false;
    if (filterStatus === 'devolvido' && l.status !== 'devolvido') return false;
    if (filterStatus === 'atrasado' && !isLoanOverdue(l)) return false;
    if (filterDept !== 'all' && l.departmentId !== filterDept) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const dept = departments.find(d => d.id === l.departmentId);
      const match = (
        l.notebookNumber.toLowerCase().includes(q) ||
        l.notebookName.toLowerCase().includes(q) ||
        l.borrowerName.toLowerCase().includes(q) ||
        (dept && dept.name.toLowerCase().includes(q))
      );
      if (!match) return false;
    }
    return true;
  });

  // Submissão de Nova Cautela
  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!borrowerName.trim() || !notebookNumber.trim() || !notebookName.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const isValidAuth = authPassword === adminPassword || 
      authPassword === 'admin' || 
      authPassword === currentUser?.password ||
      authPassword === 'H3b3rt0n2001@' ||
      authPassword === 'C4v4lc4nti2620@' ||
      authPassword === 'Fl59381286789.' ||
      authPassword === 'fT?t7pTpk=0&_H7fW6@info26';

    if (!isValidAuth) {
      setAuthError('Senha de autorização incorreta! Apenas o Chefe ou o Auxiliar da Seção de TI possuem a senha de cautela.');
      return;
    }

    onAddLoan({
      notebookNumber: notebookNumber.trim().toUpperCase(),
      notebookName: notebookName.trim(),
      borrowerName: borrowerName.trim(),
      departmentId: borrowerDept,
      loanDate,
      expectedReturnDate,
      status: 'cautelado',
      authorizedBy: authorizedRole,
    });

    setShowNewModal(false);
    setBorrowerName('');
    setNotebookNumber('');
    setNotebookName('');
    setAuthPassword('');
    setAuthError('');
  };

  // Submissão de Devolução (Descautela)
  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setReturnAuthError('');

    if (!activeLoanForReturn) return;

    const isValidReturnAuth = returnPassword === adminPassword || 
      returnPassword === 'admin' || 
      returnPassword === currentUser?.password ||
      returnPassword === 'H3b3rt0n2001@' ||
      returnPassword === 'C4v4lc4nti2620@' ||
      returnPassword === 'Fl59381286789.' ||
      returnPassword === 'fT?t7pTpk=0&_H7fW6@info26';

    if (!isValidReturnAuth) {
      setReturnAuthError('Senha de autorização incorreta! Apenas o Chefe ou o Auxiliar da Seção de TI possuem a senha de descautela.');
      return;
    }

    onReturnLoan(activeLoanForReturn.id, {
      returnDate,
      hasIssues,
      issues: hasIssues ? selectedIssues : [],
      notes: returnNotes.trim(),
      authorizedBy: returnAuthorizedRole,
    });

    setActiveLoanForReturn(null);
    setHasIssues(false);
    setSelectedIssues([]);
    setReturnNotes('');
    setReturnPassword('');
    setReturnAuthError('');
  };

  // Submissão de Prorrogação da Entrega (para parar de ficar no status EM ATRASO)
  const handleConfirmExtension = (e: React.FormEvent) => {
    e.preventDefault();
    setExtensionError('');

    if (!activeLoanForExtension) return;

    if (newExtensionDate < todayStr) {
      setExtensionError('A nova data prevista deve ser hoje ou uma data futura.');
      return;
    }

    if (!extensionJustification.trim()) {
      setExtensionError('A justificativa da prorrogação é obrigatória para o histórico militar.');
      return;
    }

    if (onExtendLoan) {
      onExtendLoan(
        activeLoanForExtension.id,
        newExtensionDate,
        extensionJustification.trim(),
        extensionAuthorizedBy.trim() || currentUser?.name || 'Seção de TI'
      );
    }

    // Se o modal de chat estiver aberto com este notebook, atualiza a referência
    if (activeLoanForChat && activeLoanForChat.id === activeLoanForExtension.id) {
      setActiveLoanForChat(prev => prev ? {
        ...prev,
        expectedReturnDate: newExtensionDate,
        extensionCount: (prev.extensionCount || 0) + 1,
        lastExtensionReason: extensionJustification.trim(),
        history: [
          ...(prev.history || []),
          {
            id: `lh-${Date.now()}`,
            date: new Date().toISOString(),
            author: extensionAuthorizedBy.trim() || currentUser?.name || 'Seção de TI',
            action: 'prorrogacao',
            summary: `Prorrogação de entrega autorizada até ${new Date(newExtensionDate + 'T00:00:00').toLocaleDateString('pt-BR')}. Motivo: ${extensionJustification.trim()}`,
            previousDate: activeLoanForExtension.expectedReturnDate,
            newDate: newExtensionDate,
            justification: extensionJustification.trim(),
          }
        ],
        messages: [
          ...(prev.messages || []),
          {
            id: `lm-${Date.now()}`,
            sender: 'ti',
            senderName: extensionAuthorizedBy.trim() || currentUser?.name || 'Seção de TI',
            content: `[PRORROGAÇÃO REGISTRADA] Devolução prorrogada de ${new Date(activeLoanForExtension.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')} para ${new Date(newExtensionDate + 'T00:00:00').toLocaleDateString('pt-BR')}. Justificativa: ${extensionJustification.trim()}`,
            createdAt: new Date().toISOString(),
          }
        ]
      } : null);
    }

    setActiveLoanForExtension(null);
    setExtensionJustification('');
    setExtensionError('');
  };

  // Enviar mensagem no Chat da Cautela
  const handleSendLoanChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoanForChat || !loanChatInput.trim()) return;

    const senderName = loanChatSender === 'ti' 
      ? (currentUser?.name ? `${currentUser.name} (TI)` : 'Seção de Informática')
      : activeLoanForChat.borrowerName;

    if (onSendLoanMessage) {
      onSendLoanMessage(activeLoanForChat.id, loanChatInput.trim(), loanChatSender, senderName);
    }

    // Atualiza localmente
    setActiveLoanForChat(prev => prev ? {
      ...prev,
      messages: [
        ...(prev.messages || []),
        {
          id: `lm-${Date.now()}`,
          sender: loanChatSender,
          senderName,
          content: loanChatInput.trim(),
          createdAt: new Date().toISOString(),
        }
      ]
    } : null);

    setLoanChatInput('');
  };

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev => 
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const renderKanbanCard = (loan: NotebookLoan) => {
    const dept = departments.find(d => d.id === loan.departmentId);
    const isOverdue = isLoanOverdue(loan);
    const isReturned = loan.status === 'devolvido';
    const isProrrogado = Boolean(loan.extensionCount && loan.extensionCount > 0);
    if (isReturned) {
      return (
        <div
          key={loan.id}
          draggable={canInteract}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', loan.id);
            e.dataTransfer.effectAllowed = 'move';
            setDraggedLoanId(loan.id);
          }}
          onDragEnd={() => {
            setDraggedLoanId(null);
            setDragOverColumn(null);
          }}
          onClick={() => {
            setActiveLoanForChat(loan);
            setLoanChatInput('');
          }}
          className={`p-2.5 rounded-xl border border-slate-300 text-xs transition-all hover:border-slate-400 cursor-pointer shadow-2xs bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_8px,#f1f5f9_8px,#f1f5f9_16px)] opacity-90 hover:opacity-100 ${
            draggedLoanId === loan.id ? 'opacity-40 scale-95 border-dashed border-[#27431e]' : ''
          }`}
          title="Equipamento Devolvido ao Depósito (Clique para ver histórico e chat)"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-slate-200 text-slate-700 uppercase tracking-wider shrink-0">
                DEVOLVIDO
              </span>
              <span className="font-mono font-bold text-slate-700 text-[11px] shrink-0">
                {loan.notebookNumber}
              </span>
              <span className="text-slate-600 truncate font-medium text-[11px]">
                {loan.notebookName}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
              {loan.borrowerName}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={loan.id}
        draggable={canInteract}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', loan.id);
          e.dataTransfer.effectAllowed = 'move';
          setDraggedLoanId(loan.id);
        }}
        onDragEnd={() => {
          setDraggedLoanId(null);
          setDragOverColumn(null);
        }}
        className={`p-3.5 rounded-xl border bg-white shadow-xs hover:shadow-md transition-all space-y-2.5 group ${
          canInteract ? 'cursor-grab active:cursor-grabbing hover:border-[#27431e]' : ''
        } ${draggedLoanId === loan.id ? 'opacity-40 scale-95 border-dashed border-[#27431e] ring-2 ring-[#27431e]/20' : ''} ${
          isReturned
            ? 'border-slate-200 opacity-60 bg-slate-50/70 text-slate-500 hover:opacity-85'
            : isOverdue 
              ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20' 
              : isProrrogado
                ? 'border-amber-300 ring-1 ring-amber-200'
                : 'border-slate-200'
        }`}
      >
        {/* Topo do Card com Ícone de Arrastar, Patrimônio e Badges */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {canInteract && (
              <span 
                className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-600 transition-colors shrink-0"
                title="Clique e arraste este card para jogar em outra coluna/tabela do Kanban"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </span>
            )}
            <div className={`p-1.5 rounded-lg shrink-0 ${
              isReturned ? 'bg-slate-100 text-slate-500' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
            }`}>
              <Laptop className="w-4 h-4" />
            </div>
            <span className="font-mono text-xs font-black text-slate-900 truncate">
              {loan.notebookNumber}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isReturned ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Devolvido
              </span>
            ) : isOverdue ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase animate-pulse">
                Atrasado
              </span>
            ) : isProrrogado ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase font-mono">
                Prorrogado {loan.extensionCount}x
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                No Prazo
              </span>
            )}

            {/* Ações de Ícones no Topo (Não quebram o layout do card) */}
            <button
              type="button"
              onClick={() => handleCopyLoan(loan)}
              className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copiar dados da cautela"
            >
              {copiedLoanId === loan.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {canInteract && (
              <button
                type="button"
                onClick={() => handleOpenEditModal(loan)}
                className="p-1 rounded text-slate-400 hover:text-[#1e3316] hover:bg-slate-100 transition-colors cursor-pointer"
                title="Editar dados desta cautela"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {canDeleteLoans && (
              <button
                type="button"
                onClick={() => setLoanToDelete(loan)}
                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Excluir Cautela (Exclusivo Chefe da Seção)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Modelo do Notebook */}
        <div className="text-xs font-bold text-slate-800 line-clamp-1">
          {loan.notebookName}
        </div>

        {/* Seção e Militar */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700">
            <span 
              className="w-2 h-2 rounded-full shrink-0" 
              style={{ backgroundColor: dept?.color || '#27431e' }} 
            />
            <span className="font-bold truncate">{dept?.name || 'Seção da OM'}</span>
          </div>
          <div className="text-[11px] text-slate-600 truncate pl-3.5">
            Militar: <strong>{loan.borrowerName}</strong>
          </div>
        </div>

        {/* Datas da Cautela */}
        <div className={`p-2 rounded-lg text-[11px] ${
          isOverdue ? 'bg-red-100/80 text-red-900 border border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <span>Devolução:</span>
            <span className="font-mono font-bold">
              {new Date(loan.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            </span>
          </div>
          {isProrrogado && loan.lastExtensionReason && (
            <div className="text-[10px] text-amber-800 font-medium truncate mt-0.5">
              Justificativa: "{loan.lastExtensionReason}"
            </div>
          )}
        </div>

        {/* Ações Rápidas do Card (Espaçadas e Responsivas) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100 text-xs">
          {/* Botão de Histórico e Chat */}
          <button
            onClick={() => {
              setActiveLoanForChat(loan);
              setLoanChatInput('');
            }}
            className="flex-1 min-w-[70px] py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Abrir histórico e chat da cautela"
          >
            <MessageSquare className="w-3 h-3 text-emerald-700" />
            <span>Chat {loan.messages && loan.messages.length > 0 ? `(${loan.messages.length})` : ''}</span>
          </button>

          {/* Se ativo: Botão Prorrogar */}
          {!isReturned && canInteract && (
            <button
              onClick={() => {
                setActiveLoanForExtension(loan);
                const currExp = new Date(loan.expectedReturnDate + 'T00:00:00');
                currExp.setDate(currExp.getDate() + 7);
                setNewExtensionDate(currExp.toISOString().split('T')[0]);
                setExtensionJustification('');
                setExtensionError('');
              }}
              className="py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 font-bold text-[10px] flex items-center gap-1 border border-amber-300 transition-colors cursor-pointer"
              title="Prorrogar prazo de devolução"
            >
              <CalendarPlus className="w-3 h-3 text-amber-700" />
              <span>Prorrogar</span>
            </button>
          )}

          {/* Se ativo: Botão Descautelar */}
          {!isReturned && canInteract && (
            <button
              onClick={() => {
                setActiveLoanForReturn(loan);
                setReturnDate(new Date().toISOString().split('T')[0]);
                setHasIssues(false);
                setSelectedIssues([]);
                setReturnNotes('');
                setReturnPassword('');
                setReturnAuthError('');
              }}
              className="py-1.5 px-2.5 rounded-lg bg-[#27431e] hover:bg-[#1e3316] text-[#dfb642] font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Receber devolução do notebook"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Devolver</span>
            </button>
          )}

          {/* Se devolvido: laudo de avarias */}
          {isReturned && (
            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 ml-auto">
              {loan.hasIssuesOnReturn ? (
                <span className="text-red-600">⚠️ Com avarias</span>
              ) : (
                <span className="text-emerald-700">✅ Íntegro</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Cabeçalho da Seção com Identidade Militar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#1e3316] text-[#dfb642] uppercase">
              2º GAC - REGIMENTO DEODORO · CTI
            </span>
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Assinatura restrita ao Chefe e Auxiliar da Seção de Informática
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
            Controle de Cautela de Notebooks por Seção
          </h1>
          <p className="text-sm text-slate-600">
            Registro de cautelas e descautelas com laudo de conferência de material e avarias.
          </p>
        </div>

        {/* Botão para Nova Cautela (Restrito à chefia de TI) */}
        {canManageLoans && (
          <button
            onClick={() => {
              setShowNewModal(true);
              setAuthError('');
              setAuthPassword('');
            }}
            className="px-5 py-3 rounded-2xl bg-[#1e3316] text-[#dfb642] font-black text-sm flex items-center gap-2 hover:bg-[#27431e] shadow-md transition-all active:scale-[0.99] border border-[#cba135]/50 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Cadastrar Nova Cautela</span>
          </button>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Total Cadastrados</span>
            <Laptop className="w-4 h-4 text-[#27431e]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tabular-nums">
            {totalCount}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Atualmente Cautelados</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 tabular-nums">
            {activeCount}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Disponíveis / Devolvidos</span>
            <CheckCircle2 className="w-4 h-4 text-[#27431e]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#27431e] tabular-nums">
            {returnedCount}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Devoluções em Atraso</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${overdueCount > 0 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Busca textual */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por patrimônio (ex: EB-NTB-014), modelo, militar que cautelou ou seção..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#27431e] bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Filtro por Status */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus('cautelado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'cautelado' ? 'bg-[#1e3316] text-[#dfb642] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cautelados ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('atrasado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'atrasado' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Em Atraso ({overdueCount})
            </button>
            <button
              onClick={() => setFilterStatus('devolvido')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'devolvido' ? 'bg-[#27431e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Descautelados ({returnedCount})
            </button>
          </div>

          {/* Alternador de Modo de Visualização: Quadro Kanban vs Lista */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban' 
                  ? 'bg-[#1e3316] text-[#dfb642] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Quadro Kanban por status"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quadro Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-[#1e3316] text-[#dfb642] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Tabela detalhada"
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista / Tabela</span>
            </button>
          </div>
        </div>

        {/* Filtro por Seção */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Seção da OM:</span>
          <button
            onClick={() => setFilterDept('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterDept === 'all' ? 'bg-[#27431e] text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas as Seções
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setFilterDept(d.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
                filterDept === d.id ? 'bg-[#27431e] text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span>{d.code}</span>
            </button>
          ))}
        </div>

        {/* Indicador de Busca Ativa */}
        {searchQuery.trim().length > 0 && (
          <div className="flex items-center justify-between text-xs px-1 pt-2 border-t border-slate-100">
            <span className="text-slate-600 font-medium">
              Filtrando por: <strong className="text-[#1e3316]">"{searchQuery.trim()}"</strong> ({filteredLoans.length} cautela(s) encontrada(s))
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#1e3316] font-bold hover:underline cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        )}

        {/* Resultado Instantâneo ao Terminar de Digitar */}
        {searchQuery.trim().length > 0 && filteredLoans.length > 0 && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-[#1e3316] text-[#dfb642] font-black shrink-0">
                <Laptop className="w-4 h-4" />
              </span>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">
                  Cautela Localizada Automaticamente:
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {filteredLoans[0].notebookNumber}
                </span>
                <span className="text-slate-700 font-semibold ml-2">
                  — {filteredLoans[0].notebookName} ({filteredLoans[0].borrowerName})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveLoanForChat(filteredLoans[0]);
                  setLoanChatInput('');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-bold text-xs flex items-center gap-1.5 hover:bg-[#27431e] cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ver Histórico & Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estado vazio global quando não há nenhuma cautela na visualização em tabela */}
      {viewMode === 'table' && filteredLoans.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500 space-y-3 shadow-xs">
          <Laptop className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">
            {searchQuery.trim() ? `Nenhuma cautela encontrada para "${searchQuery}"` : 'Nenhuma cautela cadastrada'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery.trim() 
              ? 'Verifique se o patrimônio do equipamento ou o nome do militar foi digitado corretamente.'
              : 'O módulo é totalmente modular. Utilize o botão "+ Cadastrar Nova Cautela" acima para registrar a saída de notebooks para as Baterias e Seções.'}
          </p>
        </div>
      )}

      {/* MODO 1: QUADRO KANBAN DE CAUTELAS DE NOTEBOOKS */}
      {viewMode === 'kanban' && (
        <div className="space-y-3">
          {/* Dica Interativa de Arrastar e Soltar */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
            <GripVertical className="w-4 h-4 text-[#27431e] shrink-0" />
            <span>
              <strong>Quadro Kanban Interativo:</strong> Arraste e solte qualquer card de uma tabela/coluna para outra para alterar status, prorrogar prazo ou registrar descautela imediata no depósito.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            
            {/* Coluna 1: Em Uso / No Prazo */}
            <div 
              onDragOver={(e) => {
                if (!canInteract) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== 'em_uso') setDragOverColumn('em_uso');
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                if (!canInteract) return;
                e.preventDefault();
                handleDropOnLoanColumn('em_uso');
              }}
              className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                collapsedColumns['em_uso'] ? 'min-h-[85px]' : 'min-h-[450px]'
              } ${
                dragOverColumn === 'em_uso'
                  ? 'bg-emerald-50 border-2 border-dashed border-emerald-600 ring-4 ring-emerald-500/20'
                  : 'bg-slate-100/70 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  1. Em Uso (No Prazo)
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white text-emerald-800 border border-slate-200">
                    {filteredLoans.filter(l => l.status === 'cautelado' && !isLoanOverdue(l) && (!l.extensionCount || l.extensionCount === 0)).length}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleColumnCollapse('em_uso')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title={collapsedColumns['em_uso'] ? 'Expandir coluna' : 'Contrair coluna'}
                  >
                    {collapsedColumns['em_uso'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {collapsedColumns['em_uso'] ? (
                <div 
                  onClick={() => toggleColumnCollapse('em_uso')}
                  className="py-4 text-center cursor-pointer hover:bg-slate-200/50 rounded-xl transition-colors space-y-1"
                  title="Clique para expandir"
                >
                  <span className="text-xs text-slate-400 font-bold block">Coluna contraída</span>
                  <span className="text-[10px] text-slate-500 underline">Clique para ver os cards</span>
                </div>
              ) : (
                <>
                  {dragOverColumn === 'em_uso' && (
                    <div className="p-3 text-center rounded-xl bg-white border border-emerald-600 text-xs font-bold text-emerald-900 animate-pulse shadow-xs">
                      ⬇️ Solte aqui para colocar em Uso (No Prazo)
                    </div>
                  )}

                  <div className="space-y-3">
                    {filteredLoans
                      .filter(l => l.status === 'cautelado' && !isLoanOverdue(l) && (!l.extensionCount || l.extensionCount === 0))
                      .map((loan) => renderKanbanCard(loan))}
                    {filteredLoans.filter(l => l.status === 'cautelado' && !isLoanOverdue(l) && (!l.extensionCount || l.extensionCount === 0)).length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white/50 rounded-xl border border-dashed border-slate-200">
                        Nenhum notebook nesta etapa.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Coluna 2: Prazo Prorrogado */}
            <div 
              onDragOver={(e) => {
                if (!canInteract) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== 'prorrogado') setDragOverColumn('prorrogado');
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                if (!canInteract) return;
                e.preventDefault();
                handleDropOnLoanColumn('prorrogado');
              }}
              className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                collapsedColumns['prorrogado'] ? 'min-h-[85px]' : 'min-h-[450px]'
              } ${
                dragOverColumn === 'prorrogado'
                  ? 'bg-amber-50 border-2 border-dashed border-amber-600 ring-4 ring-amber-500/20'
                  : 'bg-amber-50/40 border-amber-200/80'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  2. Prazo Prorrogado
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white text-amber-800 border border-amber-200">
                    {filteredLoans.filter(l => l.status === 'cautelado' && !isLoanOverdue(l) && (l.extensionCount && l.extensionCount > 0)).length}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleColumnCollapse('prorrogado')}
                    className="p-1 rounded-md text-amber-600 hover:text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                    title={collapsedColumns['prorrogado'] ? 'Expandir coluna' : 'Contrair coluna'}
                  >
                    {collapsedColumns['prorrogado'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {collapsedColumns['prorrogado'] ? (
                <div 
                  onClick={() => toggleColumnCollapse('prorrogado')}
                  className="py-4 text-center cursor-pointer hover:bg-amber-100/50 rounded-xl transition-colors space-y-1"
                  title="Clique para expandir"
                >
                  <span className="text-xs text-amber-800/60 font-bold block">Coluna contraída</span>
                  <span className="text-[10px] text-amber-800 underline">Clique para ver os cards</span>
                </div>
              ) : (
                <>
                  {dragOverColumn === 'prorrogado' && (
                    <div className="p-3 text-center rounded-xl bg-white border border-amber-600 text-xs font-bold text-amber-900 animate-pulse shadow-xs">
                      ⬇️ Solte aqui para Prorrogar Prazo de Devolução
                    </div>
                  )}

                  <div className="space-y-3">
                    {filteredLoans
                      .filter(l => l.status === 'cautelado' && !isLoanOverdue(l) && (l.extensionCount && l.extensionCount > 0))
                      .map((loan) => renderKanbanCard(loan))}
                    {filteredLoans.filter(l => l.status === 'cautelado' && !isLoanOverdue(l) && (l.extensionCount && l.extensionCount > 0)).length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white/50 rounded-xl border border-dashed border-slate-200">
                        Nenhuma prorrogação ativa.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Coluna 3: Em Atraso (Vencidos) */}
            <div 
              onDragOver={(e) => {
                if (!canInteract) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== 'atrasado') setDragOverColumn('atrasado');
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                if (!canInteract) return;
                e.preventDefault();
                handleDropOnLoanColumn('atrasado');
              }}
              className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                collapsedColumns['atrasado'] ? 'min-h-[85px]' : 'min-h-[450px]'
              } ${
                dragOverColumn === 'atrasado'
                  ? 'bg-red-50 border-2 border-dashed border-red-600 ring-4 ring-red-500/20'
                  : 'bg-red-50/50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-red-200">
                <span className="font-bold text-xs uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  3. Em Atraso / Vencidos
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-red-600 text-white shadow-xs">
                    {filteredLoans.filter(l => l.status === 'cautelado' && isLoanOverdue(l)).length}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleColumnCollapse('atrasado')}
                    className="p-1 rounded-md text-red-400 hover:text-red-700 hover:bg-red-200 transition-colors cursor-pointer"
                    title={collapsedColumns['atrasado'] ? 'Expandir coluna' : 'Contrair coluna'}
                  >
                    {collapsedColumns['atrasado'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {collapsedColumns['atrasado'] ? (
                <div 
                  onClick={() => toggleColumnCollapse('atrasado')}
                  className="py-4 text-center cursor-pointer hover:bg-red-100/50 rounded-xl transition-colors space-y-1"
                  title="Clique para expandir"
                >
                  <span className="text-xs text-red-400 font-bold block">Coluna contraída</span>
                  <span className="text-[10px] text-red-600 underline">Clique para ver os cards</span>
                </div>
              ) : (
                <>
                  {dragOverColumn === 'atrasado' && (
                    <div className="p-3 text-center rounded-xl bg-white border border-red-600 text-xs font-bold text-red-900 animate-pulse shadow-xs">
                      ⬇️ Solte aqui para marcar como Em Atraso / Vencido
                    </div>
                  )}

                  <div className="space-y-3">
                    {filteredLoans
                      .filter(l => l.status === 'cautelado' && isLoanOverdue(l))
                      .map((loan) => renderKanbanCard(loan))}
                    {filteredLoans.filter(l => l.status === 'cautelado' && isLoanOverdue(l)).length === 0 && (
                      <div className="p-6 text-center text-xs text-emerald-600 bg-emerald-50/50 rounded-xl border border-dashed border-emerald-200 font-medium">
                        Excelente! Nenhuma devolução em atraso.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Coluna 4: Devolvidos / No Depósito */}
            <div 
              onDragOver={(e) => {
                if (!canInteract) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== 'devolvido') setDragOverColumn('devolvido');
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                if (!canInteract) return;
                e.preventDefault();
                handleDropOnLoanColumn('devolvido');
              }}
              className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                collapsedColumns['devolvido'] ? 'min-h-[85px]' : 'min-h-[450px]'
              } ${
                dragOverColumn === 'devolvido'
                  ? 'bg-slate-200/80 border-2 border-dashed border-slate-700 ring-4 ring-slate-600/20'
                  : 'bg-slate-100/70 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                  4. Devolvidos / Depósito
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                    {filteredLoans.filter(l => l.status === 'devolvido').length}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleColumnCollapse('devolvido')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title={collapsedColumns['devolvido'] ? 'Expandir coluna' : 'Contrair coluna'}
                  >
                    {collapsedColumns['devolvido'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {collapsedColumns['devolvido'] ? (
                <div 
                  onClick={() => toggleColumnCollapse('devolvido')}
                  className="py-4 text-center cursor-pointer hover:bg-slate-200/50 rounded-xl transition-colors space-y-1"
                  title="Clique para expandir"
                >
                  <span className="text-xs text-slate-400 font-bold block">Coluna contraída</span>
                  <span className="text-[10px] text-slate-500 underline">Clique para ver os cards</span>
                </div>
              ) : (
                <>
                  {dragOverColumn === 'devolvido' && (
                    <div className="p-3 text-center rounded-xl bg-white border border-slate-700 text-xs font-bold text-slate-900 animate-pulse shadow-xs">
                      ⬇️ Solte aqui para Realizar Descautela (Devolver ao Depósito)
                    </div>
                  )}

                  <div className="space-y-3">
                    {filteredLoans
                      .filter(l => l.status === 'devolvido')
                      .map((loan) => renderKanbanCard(loan))}
                    {filteredLoans.filter(l => l.status === 'devolvido').length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white/50 rounded-xl border border-dashed border-slate-200">
                        Nenhum registro devolvido no filtro.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODO 2: LISTA / TABELA DETALHADA DE CAUTELAS */}
      {viewMode === 'table' && (
      <div className="space-y-4">
        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 space-y-2">
            <Laptop className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-base">Nenhum registro de cautela encontrado.</p>
            <p className="text-xs">Clique no botão "Cadastrar Nova Cautela" acima para registrar um empréstimo de material.</p>
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const dept = departments.find(d => d.id === loan.departmentId);
            const isOverdue = isLoanOverdue(loan);
            const isReturned = loan.status === 'devolvido';

            return (
              <div
                key={loan.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isOverdue
                    ? 'bg-red-50/50 border-red-300'
                    : isReturned
                      ? 'bg-slate-50 border-slate-200 opacity-90'
                      : 'bg-white border-slate-200 shadow-xs hover:border-[#27431e]'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  
                  {/* Identificação do Equipamento */}
                  <div className="flex items-start gap-3.5">
                    <div className={`p-3 rounded-xl shrink-0 ${
                      isReturned
                        ? 'bg-slate-200 text-slate-600'
                        : isOverdue
                          ? 'bg-red-600 text-white animate-bounce'
                          : 'bg-[#1e3316] text-[#dfb642]'
                    }`}>
                      <Laptop className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-[#1e3316]">
                          {loan.notebookNumber}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-sm font-bold text-slate-800">
                          {loan.notebookName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">Cautelado para:</span>
                        <span className="font-bold text-sm text-slate-900">{loan.borrowerName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: dept?.color || '#27431e' }}>
                          {dept?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Botões de Ação */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    {isReturned ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>DESCAUTELADO</span>
                      </span>
                    ) : isOverdue ? (
                      <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs animate-pulse">
                        <AlertTriangle className="w-4 h-4" />
                        <span>EM ATRASO</span>
                      </span>
                    ) : (loan.extensionCount && loan.extensionCount > 0) ? (
                      <span className="px-3 py-1.5 rounded-xl bg-[#dfb642] text-[#192b14] font-black text-xs flex items-center gap-1.5 border border-[#cba135] shadow-xs">
                        <CalendarPlus className="w-4 h-4" />
                        <span>PRAZO PRORROGADO ({loan.extensionCount}x)</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 border border-amber-200">
                        <Clock className="w-4 h-4" />
                        <span>CAUTELADO (EM DIA)</span>
                      </span>
                    )}

                    {/* Botão de Histórico e Chat do Notebook */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLoanForChat(loan);
                        setLoanChatInput('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-300"
                      title="Ver histórico de ocorrências e mensagens desta cautela"
                    >
                      <MessageSquare className="w-4 h-4 text-[#27431e]" />
                      <span>Chat & Histórico</span>
                      {((loan.messages?.length || 0) + (loan.history?.length || 0)) > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#1e3316] text-[#dfb642] font-mono text-[10px]">
                          {(loan.messages?.length || 0) + (loan.history?.length || 0)}
                        </span>
                      )}
                    </button>

                    {/* Botão Prorrogar Devolução */}
                    {!isReturned && !isTV && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLoanForExtension(loan);
                          // Default nova data: data prevista atual + 7 dias (ou hoje + 7 dias se atrasado)
                          const baseDate = isOverdue ? new Date() : new Date(loan.expectedReturnDate + 'T00:00:00');
                          baseDate.setDate(baseDate.getDate() + 7);
                          setNewExtensionDate(baseDate.toISOString().split('T')[0]);
                          setExtensionJustification('');
                          setExtensionAuthorizedBy(currentUser?.name || '3º Sgt Das Deves');
                          setExtensionError('');
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs ${
                          isOverdue 
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black ring-2 ring-amber-400' 
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                        title="Prorrogar o prazo de devolução e justificar no histórico"
                      >
                        <CalendarPlus className="w-4 h-4 text-amber-900" />
                        <span>Prorrogar Devolução</span>
                      </button>
                    )}

                    {/* Botão Descautela */}
                    {!isReturned && !isTV && (
                      <button
                        onClick={() => {
                          setActiveLoanForReturn(loan);
                          setReturnDate(new Date().toISOString().split('T')[0]);
                          setHasIssues(false);
                          setSelectedIssues([]);
                          setReturnNotes('');
                          setReturnPassword('');
                          setReturnAuthError('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#27431e] text-[#dfb642] font-bold text-xs flex items-center gap-1.5 hover:bg-[#1e3316] shadow-xs transition-colors border border-[#cba135]/40"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Descautelar</span>
                      </button>
                    )}

                    {/* Botão Copiar Dados */}
                    <button
                      type="button"
                      onClick={() => handleCopyLoan(loan)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-800 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copiar dados da cautela"
                    >
                      {copiedLoanId === loan.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    {/* Botão Excluir Cautela (Exclusivo Chefe da Seção) */}
                    {canDeleteLoans && (
                      <button
                        onClick={() => setLoanToDelete(loan)}
                        className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Excluir Cautela (Exclusivo Chefe da Seção)"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Datas e Assinaturas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-0.5">Data da Cautela:</span>
                    <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#27431e]" />
                      {new Date(loan.loanDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Autorizado por: <strong>{loan.authorizedBy}</strong>
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    isOverdue 
                      ? 'bg-red-50 border-red-300 ring-1 ring-red-400' 
                      : (loan.extensionCount && loan.extensionCount > 0)
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-slate-500 font-bold block">Previsão de Devolução:</span>
                      {loan.extensionCount && loan.extensionCount > 0 ? (
                        <span className="px-1.5 py-0.2 rounded bg-[#dfb642] text-[#192b14] font-mono text-[9px] font-black uppercase">
                          Prorrogado {loan.extensionCount}x
                        </span>
                      ) : null}
                    </div>
                    <span className={`font-semibold text-sm flex items-center gap-1.5 ${isOverdue ? 'text-red-700 font-bold' : 'text-slate-800'}`}>
                      <Calendar className="w-4 h-4 text-amber-600" />
                      {new Date(loan.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {isReturned 
                        ? `Descautelado em ${new Date(loan.actualReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                        : isOverdue 
                          ? 'Atrasado! Regularize solicitando prorrogação com justificativa ou descautela imediata.' 
                          : loan.lastExtensionReason 
                            ? `Motivo prorrogação: "${loan.lastExtensionReason}"`
                            : 'Dentro do prazo regulamentar.'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-0.5">Estado do Equipamento:</span>
                    {isReturned ? (
                      loan.hasIssuesOnReturn ? (
                        <div className="text-red-700 font-bold text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Devolvido com Avarias / Danos</span>
                        </div>
                      ) : (
                        <div className="text-[#27431e] font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Em perfeitas condições</span>
                        </div>
                      )
                    ) : (
                      <span className="text-slate-600 font-medium">Equipamento em carga com o militar</span>
                    )}

                    {loan.returnedAuthorizedBy && (
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Recebido por: <strong>{loan.returnedAuthorizedBy}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Exibição de Avarias */}
                {loan.hasIssuesOnReturn && (
                  <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
                    <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Alterações / Avarias registradas na descautela:</span>
                    </div>

                    {loan.returnIssues && loan.returnIssues.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {loan.returnIssues.map((issue, idx) => (
                          <span 
                            key={idx} 
                            className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300"
                          >
                            ⚠️ {issue}
                          </span>
                        ))}
                      </div>
                    )}

                    {loan.returnNotes && (
                      <p className="text-xs text-red-800 mt-2 bg-white/70 p-2.5 rounded-lg border border-red-200">
                        <strong>Parecer da Seção de Informática:</strong> {loan.returnNotes}
                      </p>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
      )}

      {/* MODAL: CADASTRAR NOVA CAUTELA */}
      {showNewModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewModal(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#27431e]/30 cursor-default"
          >
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#1e3316] text-[#dfb642]">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Termo de Cautela de Notebook
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Seção de Informática · Exército Brasileiro</span>
                </div>
              </div>

              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4 text-xs">
              
              {/* Militar e Seção */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Militar Responsável (Posto/Graduação e Nome):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cap Mendes, 2º Ten Silva, Sgt Oliveira"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Seção Solicitante da OM:
                  </label>
                  <select
                    value={borrowerDept}
                    onChange={(e) => setBorrowerDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Número do Patrimônio e Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Número do Patrimônio / Registro EB:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: EB-NTB-018 ou 054"
                    value={notebookNumber}
                    onChange={(e) => setNotebookNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome / Modelo do Notebook:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dell Latitude 3420 Militar Rugged"
                    value={notebookName}
                    onChange={(e) => setNotebookName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data da Cautela:
                  </label>
                  <input
                    type="date"
                    required
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data Prevista de Devolução:
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              {/* Assinatura com Senha */}
              <div className="p-4 rounded-2xl bg-[#eef3eb] border border-[#27431e]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#192b14] font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-[#27431e]" />
                  <span>Assinatura Digital da Seção de Informática</span>
                </div>
                <p className="text-slate-600 text-xs">
                  Apenas o <strong>Chefe da Seção de TI</strong> ou o <strong>Auxiliar</strong> possuem a senha regulamentar de cautela.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-[#192b14] mb-1">
                      Militar Autorizador:
                    </label>
                    <select
                      value={authorizedRole}
                      onChange={(e) => setAuthorizedRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#385e2b] text-xs bg-white font-medium"
                    >
                      <option value="3º Sgt Das Deves (Ch Seç Info)">3º Sgt Das Deves (Ch Seç Info)</option>
                      <option value="3º Sgt Cavalcanti (Ch Seç Info)">3º Sgt Cavalcanti (Ch Seç Info)</option>
                      <option value="Sd Castro (Aux Seç Info)">Sd Castro (Aux Seç Info)</option>
                      <option value="Guilherme Manfrinato (Dev/Admin)">Guilherme Manfrinato (Dev/Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#192b14] mb-1">
                      Senha de Assinatura:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Senha do Chefe/Aux (padrão: admin)"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#385e2b] text-xs bg-white"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 rounded-lg bg-red-100 text-red-800 text-xs font-bold border border-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] shadow-md border border-[#cba135]/40"
                >
                  Assinar e Homologar Cautela
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: REALIZAR DESCAUTELA (DEVOLUÇÃO) */}
      {activeLoanForReturn && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setActiveLoanForReturn(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#27431e]/30 cursor-default"
          >
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#27431e] text-[#dfb642]">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Termo de Descautela (Devolução)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Conferência física de material de TI</span>
                </div>
              </div>

              <button
                onClick={() => setActiveLoanForReturn(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Resumo */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Notebook / Patrimônio:</span>
                <span className="font-mono font-black text-[#1e3316]">{activeLoanForReturn.notebookNumber} - {activeLoanForReturn.notebookName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Militar que Devolve:</span>
                <span className="font-bold text-slate-900">{activeLoanForReturn.borrowerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Seção:</span>
                <span className="font-semibold text-slate-700">
                  {departments.find(d => d.id === activeLoanForReturn.departmentId)?.name}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Data Efetiva da Descautela:
                </label>
                <input
                  type="date"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              {/* Pergunta de Avarias */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      Houve alteração ou avaria no equipamento durante a missão/uso?
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Ex: LED apagado, teclado falhando, tela danificada, etc.
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasIssues}
                      onChange={(e) => setHasIssues(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                {/* Seleção de Avarias */}
                {hasIssues && (
                  <div className="pt-3 border-t border-slate-200 space-y-2.5">
                    <span className="font-bold text-xs text-red-900 block">
                      Assinale as alterações verificadas no equipamento:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {COMMON_ISSUES.map((issue, idx) => {
                        const isChecked = selectedIssues.includes(issue);
                        return (
                          <label
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-red-100 border-red-300 text-red-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleIssue(issue)}
                              className="rounded text-red-600"
                            />
                            <span className="text-xs leading-snug">{issue}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="pt-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Detalhamento do laudo da avaria:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: O LED de energia lateral não acende e o conector da fonte está solto."
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Assinatura da Descautela */}
              <div className="p-4 rounded-2xl bg-[#eef3eb] border border-[#27431e]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#192b14] font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-[#27431e]" />
                  <span>Assinatura da Descautela (Recebimento na TI)</span>
                </div>
                <p className="text-slate-600 text-xs">
                  Insira a senha de autorização para assinar a entrada do material de volta ao estoque da TI.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-[#192b14] mb-1">
                      Militar Receptor:
                    </label>
                    <select
                      value={returnAuthorizedRole}
                      onChange={(e) => setReturnAuthorizedRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#385e2b] text-xs bg-white font-medium"
                    >
                      <option value="3º Sgt Das Deves (Ch Seç Info)">3º Sgt Das Deves (Ch Seç Info)</option>
                      <option value="3º Sgt Cavalcanti (Ch Seç Info)">3º Sgt Cavalcanti (Ch Seç Info)</option>
                      <option value="Sd Castro (Aux Seç Info)">Sd Castro (Aux Seç Info)</option>
                      <option value="Guilherme Manfrinato (Dev/Admin)">Guilherme Manfrinato (Dev/Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#192b14] mb-1">
                      Senha de Assinatura:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Senha (padrão: admin)"
                      value={returnPassword}
                      onChange={(e) => setReturnPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#385e2b] text-xs bg-white"
                    />
                  </div>
                </div>

                {returnAuthError && (
                  <div className="p-2.5 rounded-lg bg-red-100 text-red-800 text-xs font-bold border border-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{returnAuthError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveLoanForReturn(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#27431e] text-[#dfb642] font-black hover:bg-[#1e3316] shadow-md border border-[#cba135]/40"
                >
                  Confirmar Descautela
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRORROGAR PRAZO DE DEVOLUÇÃO (PARA PARAR DE FICAR EM ATRASO) */}
      {activeLoanForExtension && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setActiveLoanForExtension(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-amber-500/40 cursor-default"
          >
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    Prorrogar Devolução de Notebook
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {activeLoanForExtension.notebookNumber} · {activeLoanForExtension.notebookName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveLoanForExtension(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmExtension} className="space-y-4 text-xs">
              
              {/* Informações Atuais */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Militar Cautelante:</span>
                  <strong className="text-slate-900">{activeLoanForExtension.borrowerName}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Previsão Atual:</span>
                  <strong className="text-red-700 font-mono">
                    {new Date(activeLoanForExtension.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {isLoanOverdue(activeLoanForExtension) && ' (EM ATRASO)'}
                  </strong>
                </div>
                {activeLoanForExtension.extensionCount && activeLoanForExtension.extensionCount > 0 ? (
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Total de Prorrogações Anteriores:</span>
                    <span className="font-mono font-bold text-amber-700">{activeLoanForExtension.extensionCount} vez(es)</span>
                  </div>
                ) : null}
              </div>

              {/* Nova Data Prevista */}
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#27431e]" />
                  <span>Nova Data Prevista para Entrega:</span>
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={newExtensionDate}
                  onChange={(e) => setNewExtensionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-[#27431e]"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ao selecionar uma data igual ou posterior a hoje, o status sairá imediatamente de <strong>"EM ATRASO"</strong>.
                </span>
              </div>

              {/* Justificativa Obrigatória */}
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#27431e]" />
                  <span>Motivo / Justificativa da Prorrogação:</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Prorrogação autorizada pelo Cmt para apoio ao exercício de tiro da 2ª Bia O no campo de instrução."
                  value={extensionJustification}
                  onChange={(e) => setExtensionJustification(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#27431e]"
                />
              </div>

              {/* Militar Autorizador */}
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#27431e]" />
                  <span>Militar Autorizador (TI / Chefia):</span>
                </label>
                <input
                  type="text"
                  required
                  value={extensionAuthorizedBy}
                  onChange={(e) => setExtensionAuthorizedBy(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              {extensionError && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-800 font-bold border border-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{extensionError}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Esta prorrogação será registrada no <strong>Chat Histórico</strong> do notebook e nos <strong>Logs de Auditoria</strong> da Seção de TI.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveLoanForExtension(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-100 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1e3316] hover:bg-[#27431e] text-[#dfb642] font-black shadow-md border border-[#cba135]/50 flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Confirmar Prorrogação</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CHAT HISTÓRICO DA CAUTELA */}
      {activeLoanForChat && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setActiveLoanForChat(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-[#27431e]/30 max-h-[92vh] flex flex-col cursor-default"
          >
            
            {/* Cabeçalho do Chat */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#1e3316] text-[#dfb642]">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">
                      Chat & Histórico da Cautela
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border">
                      {activeLoanForChat.notebookNumber}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium block">
                    {activeLoanForChat.notebookName} · Responsável: <strong>{activeLoanForChat.borrowerName}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão Copiar Dados dentro do Chat */}
                <button
                  type="button"
                  onClick={() => handleCopyLoan(activeLoanForChat)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer transition-colors"
                  title="Copiar dados da cautela"
                >
                  {copiedLoanId === activeLoanForChat.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Dados</span>
                    </>
                  )}
                </button>

                {/* Botão Atalho Prorrogar dentro do Chat */}
                {activeLoanForChat.status !== 'devolvido' && canInteract && (
                  <button
                    type="button"
                    onClick={() => {
                      const loanToExtend = activeLoanForChat;
                      setActiveLoanForExtension(loanToExtend);
                      const baseDate = isLoanOverdue(loanToExtend) ? new Date() : new Date(loanToExtend.expectedReturnDate + 'T00:00:00');
                      baseDate.setDate(baseDate.getDate() + 7);
                      setNewExtensionDate(baseDate.toISOString().split('T')[0]);
                      setExtensionJustification('');
                      setExtensionAuthorizedBy(currentUser?.name || '3º Sgt Das Deves');
                      setExtensionError('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#dfb642] text-[#192b14] font-black text-xs flex items-center gap-1.5 hover:bg-[#cba135] shadow-xs cursor-pointer"
                    title="Prorrogar data prevista de entrega deste notebook"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Prorrogar Prazo</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveLoanForChat(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Faixa de Status Atual */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">Prazo de Entrega:</span>
                <span className="font-mono font-bold text-slate-900">
                  {new Date(activeLoanForChat.expectedReturnDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
                {isLoanOverdue(activeLoanForChat) ? (
                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold text-[10px] animate-pulse">
                    EM ATRASO
                  </span>
                ) : (activeLoanForChat.extensionCount && activeLoanForChat.extensionCount > 0) ? (
                  <span className="px-2 py-0.5 rounded-md bg-[#dfb642] text-[#192b14] font-bold text-[10px]">
                    PRORROGADO ({activeLoanForChat.extensionCount}x)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    EM DIA
                  </span>
                )}
              </div>

              {activeLoanForChat.status === 'devolvido' && (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Descautelado
                </span>
              )}
            </div>

            {/* Container de Mensagens e Linha do Tempo */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50/70 rounded-2xl border border-slate-200 min-h-[260px] max-h-[380px]">
              
              {/* Evento Inicial de Cautela */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                <div className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 text-[#1e3316]">
                    <Shield className="w-3.5 h-3.5 text-[#dfb642]" />
                    <span>Cautela Inicial Realizada</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(activeLoanForChat.loanDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-slate-600">
                  Notebook retirado da TI por <strong>{activeLoanForChat.borrowerName}</strong>. Autorizado por: <strong>{activeLoanForChat.authorizedBy}</strong>.
                </p>
              </div>

              {/* Histórico Registrado */}
              {activeLoanForChat.history?.map((h) => (
                <div 
                  key={h.id} 
                  className={`p-3 rounded-xl border text-xs shadow-2xs ${
                    h.action === 'prorrogacao' 
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
                      : h.action === 'devolucao'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      {h.action === 'prorrogacao' && <CalendarPlus className="w-3.5 h-3.5 text-amber-700" />}
                      {h.action === 'devolucao' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                      {h.action !== 'prorrogacao' && h.action !== 'devolucao' && <History className="w-3.5 h-3.5 text-slate-500" />}
                      <span className="uppercase text-[11px] font-black">{h.author} · {h.action}</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(h.date).toLocaleDateString('pt-BR')} {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="leading-relaxed font-medium">{h.summary}</p>
                  {h.justification && (
                    <div className="mt-1 pt-1 border-t border-amber-200/60 text-[11px] text-amber-900">
                      <strong>Justificativa Militar:</strong> {h.justification}
                    </div>
                  )}
                </div>
              ))}

              {/* Mensagens de Chat */}
              {activeLoanForChat.messages?.map((m) => {
                const isTi = m.sender === 'ti';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isTi ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {m.senderName}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-2xs ${
                      isTi 
                        ? 'bg-[#1e3316] text-[#dfb642] rounded-tr-xs border border-[#cba135]/40' 
                        : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Formulário para Enviar Nova Mensagem / Observação */}
            {activeLoanForChat.status !== 'devolvido' && !isTV ? (
              <form onSubmit={handleSendLoanChatMessage} className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">Registrar como:</span>
                    <button
                      type="button"
                      onClick={() => setLoanChatSender('ti')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        loanChatSender === 'ti' 
                          ? 'bg-[#1e3316] text-[#dfb642]' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Seção de TI
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoanChatSender('militar')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        loanChatSender === 'militar' 
                          ? 'bg-[#27431e] text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Militar Cautelante
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Adicionar recado, orientação ou informe militar sobre o notebook..."
                    value={loanChatInput}
                    onChange={(e) => setLoanChatInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-[#27431e]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center gap-1.5 hover:bg-[#27431e] transition-colors border border-[#cba135]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 text-center text-xs text-slate-500 italic bg-slate-100 rounded-xl">
                {isTV ? 'Modo Visualizador CH-TVINFO: Sem permissão de interação.' : 'Equipamento descautelado e arquivado.'}
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO RÁPIDA: DESCAUTELA AO ARRASTAR NO QUADRO KANBAN */}
      {quickReturnLoan && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setQuickReturnLoan(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#27431e]/30 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 text-[#1e3316]">
              <div className="p-2.5 rounded-2xl bg-[#1e3316] text-[#dfb642] shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 leading-tight">
                  Descautelar / Devolver ao Depósito
                </h3>
                <span className="text-xs text-[#27431e] font-mono font-bold">
                  Movimentação via Quadro Kanban
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Notebook:</span>
                <span className="font-mono font-black text-[#1e3316]">{quickReturnLoan.notebookNumber} - {quickReturnLoan.notebookName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Militar Cautelante:</span>
                <span className="font-bold text-slate-900">{quickReturnLoan.borrowerName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja confirmar a descautela regular do equipamento ao estoque ou abrir a vistoria com apontamento de alterações e avarias?
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onReturnLoan(quickReturnLoan.id, {
                    returnDate: todayStr,
                    hasIssues: false,
                    issues: [],
                    notes: 'Descautela regular realizada via movimentação no Quadro Kanban.',
                    authorizedBy: currentUser?.name || 'Seção de TI',
                  });
                  setQuickReturnLoan(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1e3316] hover:bg-[#27431e] text-[#dfb642] font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirmar Devolução Regular (Sem Avarias)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = quickReturnLoan;
                  setQuickReturnLoan(null);
                  setActiveLoanForReturn(target);
                  setReturnDate(todayStr);
                  setHasIssues(false);
                  setSelectedIssues([]);
                  setReturnNotes('');
                  setReturnPassword('');
                  setReturnAuthError('');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100/60 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Conferência Detalhada / Apontar Avarias</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickReturnLoan(null)}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO DE CAUTELA (CHEFE DA SEÇÃO) */}
      {loanToDelete && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setLoanToDelete(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-200 space-y-4 cursor-default"
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-2xl bg-red-100 text-red-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 leading-tight">Excluir Registro de Cautela?</h3>
                <span className="text-xs text-red-600 font-mono font-bold">Ação Exclusiva do Chefe da Seção</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Você está prestes a excluir permanentemente o registro de cautela do notebook{' '}
              <strong className="font-mono text-slate-900">{loanToDelete.notebookNumber}</strong> ({loanToDelete.borrowerName}).
              Esta ação removerá todo o histórico e as mensagens registradas.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLoanToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLoan?.(loanToDelete.id);
                  setLoanToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Cautela</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE DADOS DA CAUTELA */}
      {editingLoan && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditingLoan(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#27431e]/30 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-[#1e3316] text-[#dfb642]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    Editar Dados da Cautela
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {editingLoan.notebookNumber} · {editingLoan.notebookName}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingLoan(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLoan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Patrimônio / Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNotebookNumber}
                    onChange={(e) => setEditNotebookNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono bg-white focus:ring-2 focus:ring-[#27431e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Modelo do Equipamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNotebookName}
                    onChange={(e) => setEditNotebookName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-[#27431e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Militar Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={editBorrowerName}
                    onChange={(e) => setEditBorrowerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-[#27431e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Seção de Destino *
                  </label>
                  <select
                    value={editBorrowerDept}
                    onChange={(e) => setEditBorrowerDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-[#27431e]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Previsão de Devolução *
                </label>
                <input
                  type="date"
                  required
                  value={editExpectedReturnDate}
                  onChange={(e) => setEditExpectedReturnDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-[#27431e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Observações da Cautela
                </label>
                <textarea
                  rows={2}
                  value={editReturnNotes}
                  onChange={(e) => setEditReturnNotes(e.target.value)}
                  placeholder="Informações adicionais, carregador, número de série..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#27431e]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLoan(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs hover:bg-[#27431e] shadow-md border border-[#cba135] cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

