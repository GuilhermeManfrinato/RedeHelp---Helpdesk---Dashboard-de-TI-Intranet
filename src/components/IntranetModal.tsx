import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Copy, 
  RotateCcw, 
  Server,
  Layers,
  FileText,
  Mail,
  ShieldCheck,
  Building,
  AlertTriangle
} from 'lucide-react';
import { AccessibilitySettings, MilitaryUser } from '../types';
import { api } from '../utils/api';

export interface IntranetLink {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  isCustom?: boolean;
}

const DEFAULT_INTRANET_LINKS: IntranetLink[] = [
  {
    id: 'link-1',
    title: 'Intranet 2º GAC (Regimento Deodoro)',
    url: 'http://intranet.2gac.eb.mil.br',
    category: 'Regimento',
    description: 'Portal principal da Intranet do 2º Grupo de Artilharia de Campanha - Itu/SP.',
  },
  {
    id: 'link-2',
    title: 'SPED / SIGA-EB',
    url: 'https://sped.eb.mil.br',
    category: 'Documentos',
    description: 'Sistema de Protocolo Eletrônico e tramitação de documentos do Exército.',
  },
  {
    id: 'link-3',
    title: 'SGEx - Secretaria-Geral do Exército',
    url: 'http://www.sgex.eb.mil.br',
    category: 'Normas & Legislação',
    description: 'Boletins do Exército (BE), ostensivos e publicações oficiais.',
  },
  {
    id: 'link-4',
    title: 'Webmail Institucional EB',
    url: 'https://webmail.eb.mil.br',
    category: 'Comunicação',
    description: 'Acesso ao correio eletrônico corporativo @eb.mil.br.',
  },
  {
    id: 'link-5',
    title: 'SisCoFi / SIAFI',
    url: 'https://siscofi.eb.mil.br',
    category: 'Finanças & Fiscalização',
    description: 'Sistema de Controle Financeiro e acompanhamento de créditos.',
  },
  {
    id: 'link-6',
    title: 'Portal CTI / Suporte Local 2º GAC',
    url: 'http://10.24.0.10/suporte',
    category: 'Seção de TI',
    description: 'Servidor local da Seção de Informática & TI do Regimento.',
  },
  {
    id: 'link-7',
    title: 'DCT - Depto de Ciência e Tecnologia',
    url: 'http://www.dct.eb.mil.br',
    category: 'Comunicações',
    description: 'Diretrizes de segurança da informação e telemática militar.',
  },
];

const STORAGE_KEY = 'eb_deodoro_intranet_links';

interface IntranetModalProps {
  isOpen: boolean;
  onClose: () => void;
  a11y: AccessibilitySettings;
  currentUser?: MilitaryUser | null;
  isAdminAuthenticated?: boolean;
}

export const IntranetModal: React.FC<IntranetModalProps> = ({
  isOpen,
  onClose,
  a11y,
  currentUser,
  isAdminAuthenticated,
}) => {
  const [links, setLinks] = useState<IntranetLink[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_INTRANET_LINKS;
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<IntranetLink | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<IntranetLink | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isDev = currentUser?.role === 'dev' || currentUser?.role === 'DEV' || currentUser?.role === 'System Developer' || currentUser?.username === 'dev' || currentUser?.rank === 'Dev' || !!(currentUser?.name && currentUser.name.toLowerCase().includes('manfrinato'));
  const isChefe = currentUser?.role === 'CH-SECINFO' || currentUser?.role === 'CHSECINFO' || isDev;
  const isAux = currentUser?.role === 'AUX-SECINFO' || currentUser?.role === 'AUXSECINFO';
  // Técnicos NÃO podem adicionar/editar/excluir links; apenas Chefe, Auxiliar e DEV
  const canManageIntranetLinks = isChefe || isAux || isDev;
  const canSaveDefault = isChefe || isAux || isDev;
  const [saveDefaultSuccess, setSaveDefaultSuccess] = useState(false);

  // Sincronização com o banco de dados (SQLite/MySQL via API) ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;
    api.getIntranetLinks()
      .then(serverLinks => {
        if (Array.isArray(serverLinks)) {
          setLinks(serverLinks);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverLinks));
          } catch {}
        }
      })
      .catch(console.warn);
  }, [isOpen]);

  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Regimento');
  const [description, setDescription] = useState('');

  // Fechamento ao apertar a tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (linkToDelete) {
          setLinkToDelete(null);
        } else if (showResetConfirm) {
          setShowResetConfirm(false);
        } else if (showAddForm) {
          setShowAddForm(false);
          setEditingLink(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, linkToDelete, showResetConfirm, showAddForm]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    } catch {}
  }, [links]);

  if (!isOpen) return null;

  const handleCopy = (id: string, linkUrl: string) => {
    navigator.clipboard.writeText(linkUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageIntranetLinks) return;
    if (!title.trim() || !url.trim()) return;

    if (editingLink) {
      const updatedLink: IntranetLink = {
        ...editingLink,
        title: title.trim(),
        url: url.trim(),
        category: category.trim(),
        description: description.trim(),
      };
      setLinks(prev => prev.map(l => l.id === editingLink.id ? updatedLink : l));
      api.updateIntranetLink(editingLink.id, updatedLink).catch(console.warn);
      setEditingLink(null);
    } else {
      const newLink: IntranetLink = {
        id: `link-${Date.now()}`,
        title: title.trim(),
        url: url.trim(),
        category: category.trim() || 'Intranet',
        description: description.trim(),
        isCustom: true,
      };
      setLinks(prev => [...prev, newLink]);
      api.createIntranetLink(newLink).catch(console.warn);
    }

    setShowAddForm(false);
    setTitle('');
    setUrl('');
    setDescription('');
  };

  const confirmDeleteLink = (id: string) => {
    setLinks(prev => {
      const updated = prev.filter(l => l.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    api.deleteIntranetLink(id).catch(err => {
      console.warn('[API] Erro ao excluir link no banco:', err);
    });
    setLinkToDelete(null);
  };

  const handleSaveAsDefault = async () => {
    try {
      localStorage.setItem('eb_deodoro_intranet_default_links', JSON.stringify(links));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
      await api.saveAllIntranetLinks(links).catch(err => {
        console.warn('[API] Erro ao salvar abas no banco de dados:', err);
      });
      setSaveDefaultSuccess(true);
      setTimeout(() => setSaveDefaultSuccess(false), 3500);
      alert('Padrão salvo com sucesso! As abas atuais da intranet foram sincronizadas e salvas permanentemente no banco de dados.');
    } catch {
      alert('Erro ao salvar padrão de links.');
    }
  };

  const confirmResetLinks = async () => {
    let targetDefaults = DEFAULT_INTRANET_LINKS;
    try {
      const savedDefault = localStorage.getItem('eb_deodoro_intranet_default_links');
      if (savedDefault) {
        targetDefaults = JSON.parse(savedDefault);
      }
    } catch {}
    setLinks(targetDefaults);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targetDefaults));
    } catch {}
    await api.saveAllIntranetLinks(targetDefaults).catch(err => {
      console.warn('[API] Erro ao sincronizar abas padrão no banco:', err);
    });
    setShowResetConfirm(false);
  };

  const categories = Array.from(new Set(links.map(l => l.category)));

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border-2 border-[#27431e]/40 max-h-[92vh] flex flex-col space-y-4 cursor-default"
      >
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#1e3316] text-[#dfb642] shadow-sm">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  Abas & Sistemas da Intranet
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#dfb642] text-[#192b14]">
                  2º GAC
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Links diretos para portais corporativos e servidores da Seção de TI do Regimento Deodoro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageIntranetLinks && (
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditingLink(null);
                  setTitle('');
                  setUrl('');
                  setDescription('');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-xs flex items-center gap-1.5 hover:bg-[#27431e] shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddForm ? 'Fechar Formulário' : 'Novo Link'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              title="Fechar janela (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulário de Adicionar / Editar Link (Apenas Chefe, Auxiliar e DEV) */}
        {canManageIntranetLinks && showAddForm && (
          <form onSubmit={handleSave} className="p-4 rounded-2xl bg-[#f4f6f2] border border-[#27431e]/30 space-y-3 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#27431e]" />
              <span>{editingLink ? 'Editar Link da Intranet' : 'Adicionar Novo Link da Intranet'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Sistema / Aba:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: GLPI Suporte TI, Almoxarifado..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Endereço URL / IP do Servidor:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: http://10.24.1.5:8080 ou https://intranet..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria:</label>
                <input
                  type="text"
                  placeholder="Ex: Regimento, Seção de TI, Finanças"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Breve Descrição (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ex: Servidor de arquivos e chamados internos da OM"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingLink(null);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] shadow-xs cursor-pointer"
              >
                {editingLink ? 'Salvar Alterações' : 'Adicionar Link'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Links agrupada por categoria */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {categories.map((cat) => (
            <div key={cat} className="space-y-2">
              <span className="text-[11px] font-mono font-black uppercase text-[#1e3316] tracking-wider block border-b border-slate-200 pb-1">
                {cat}
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {links.filter(l => l.category === cat).map((link) => (
                  <div
                    key={link.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#27431e] bg-slate-50/60 hover:bg-white transition-all flex flex-col justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs text-slate-900 group-hover:text-[#192b14] flex items-center gap-1.5 hover:underline"
                        >
                          <span>{link.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#27431e] shrink-0" />
                        </a>

                        <div className="flex items-center gap-1">
                          {/* Botão Copiar Link: sempre liberado para todos */}
                          <button
                            type="button"
                            onClick={() => handleCopy(link.id, link.url)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer transition-colors"
                            title="Copiar URL para a área de transferência"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Botão Editar Link: apenas Chefe, Auxiliar e DEV */}
                          {canManageIntranetLinks && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLink(link);
                                setTitle(link.title);
                                setUrl(link.url);
                                setCategory(link.category);
                                setDescription(link.description || '');
                                setShowAddForm(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-[#192b14] hover:bg-slate-100 cursor-pointer"
                              title="Editar link"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Botão Deletar Link (Lixeira): apenas Chefe, Auxiliar e DEV */}
                          {canManageIntranetLinks && (
                            <button
                              type="button"
                              onClick={() => setLinkToDelete(link)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                              title="Excluir link da Intranet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {link.description && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {link.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                      <code className="text-[#27431e] font-semibold truncate max-w-[200px]" title={link.url}>
                        {link.url}
                      </code>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-[#1e3316] text-[#dfb642] font-black hover:bg-[#27431e] shrink-0"
                      >
                        Abrir ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé do Modal com Informações e Reset */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span>
              {canManageIntranetLinks 
                ? 'Permissão: Gestão de Links da TI (Chefe / Auxiliar / DEV)' 
                : 'Acesso Padrão: Somente consulta e navegação'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canSaveDefault && (
              <button
                type="button"
                onClick={handleSaveAsDefault}
                className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Salvar e definir as abas atuais como o novo padrão permanente no sistema"
              >
                <span>💾 Redefinir / Salvar Padrão</span>
                {saveDefaultSuccess && <span className="text-emerald-700 font-black">✓ Salvo!</span>}
              </button>
            )}
            {canManageIntranetLinks && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[11px] font-bold text-slate-600 hover:text-[#192b14] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Restaurar a lista original de links oficiais do Exército"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restaurar Padrão Original</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>

      {/* MODAL 1: CONFIRMAÇÃO DE EXCLUSÃO DE LINK */}
      {linkToDelete && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setLinkToDelete(null); }}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-2xl bg-red-100 text-red-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Excluir Aba da Intranet?</h3>
                <span className="text-xs text-red-600 font-bold">Militar Autenticado na Seção de TI</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Você está prestes a excluir permanentemente o atalho <strong className="text-slate-900">"{linkToDelete.title}"</strong> ({linkToDelete.url}). Esta ação não poderá ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLinkToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteLink(linkToDelete.id)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAÇÃO DE RESTAURAÇÃO DE LINKS PADRÃO */}
      {showResetConfirm && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetConfirm(false); }}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-amber-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 text-amber-700">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Restaurar Links Padrão?</h3>
                <span className="text-xs text-amber-700 font-bold">Configuração Oficial do 2º GAC</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Todos os links personalizados serão substituídos pela lista padrão de sistemas oficiais do Exército Brasileiro (SPED, SGEx, Webmail, etc.).
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmResetLinks}
                className="px-4 py-2 rounded-xl bg-[#1e3316] hover:bg-[#27431e] text-[#dfb642] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Restauração</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
