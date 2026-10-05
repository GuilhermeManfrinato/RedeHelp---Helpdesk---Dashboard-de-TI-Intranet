import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ArrowLeft, 
  AlertTriangle, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert 
} from 'lucide-react';
import { AccessibilitySettings, MilitaryUser } from '../types';
import { RegimentoDeodoroLogo } from './RegimentoDeodoroLogo';
import malletBg from '../assets/mallet_bg.jpg';
import { api } from '../utils/api';

interface AdminLoginProps {
  militaryUsers: MilitaryUser[];
  onLoginSuccess: (user: MilitaryUser) => void;
  onGoBackToPortal: () => void;
  a11y: AccessibilitySettings;
  onOpenIntranet?: () => void;
  onUpdateMilitaryUsers?: (users: MilitaryUser[]) => void;
  onAddAuditLog?: (log: any) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  militaryUsers,
  onLoginSuccess,
  onGoBackToPortal,
  a11y,
  onUpdateMilitaryUsers,
  onAddAuditLog,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password;

    if (!cleanUser) {
      setErrorMsg('Informe o login do militar.');
      return;
    }

    if (!cleanPass) {
      setErrorMsg('Informe a senha de acesso militar.');
      return;
    }

    setIsSubmitting(true);

    // Buscar militar pelo username ou nome de guerra/cargo
    const cleanNoSpace = cleanUser.replace(/[\s\.\-_]/g, '');

    let matchedUser = militaryUsers.find(u => {
      const uLogin = u.username.toLowerCase();
      const uLoginNoSpace = uLogin.replace(/[\s\.\-_]/g, '');
      const uWar = u.warName.toLowerCase().replace(/[\s\.\-_]/g, '');
      const uName = u.name.toLowerCase().replace(/[\s\.\-_]/g, '');
      return uLogin === cleanUser || uLoginNoSpace === cleanNoSpace || uWar === cleanNoSpace || uName === cleanNoSpace;
    });

    // Se digitou o nome do cargo (ex: chsecinfo, auxsecinfo, xerifesecinfo, tecinfo)
    if (!matchedUser) {
      if (cleanUser === 'chsecinfo' || cleanUser === 'ch-secinfo') {
        matchedUser = militaryUsers.find(u => (u.role === 'CH-SECINFO' || u.username === 'dasdeves' || u.username === 'cavalcanti') && u.password === cleanPass) ||
                      militaryUsers.find(u => u.role === 'CH-SECINFO' && u.username !== 'dev');
      } else if (cleanUser === 'auxsecinfo' || cleanUser === 'aux-secinfo') {
        matchedUser = militaryUsers.find(u => u.role === 'AUX-SECINFO' || u.username === 'castro');
      } else if (cleanUser === 'xerifesecinfo' || cleanUser === 'xerife' || cleanUser === 'ch-xerifeinfo') {
        matchedUser = militaryUsers.find(u => u.role === 'CH-XERIFEINFO' || u.username === 'arantes');
      } else if (cleanUser === 'tecinfo' || cleanUser === 'tecnico' || cleanUser === 'ch-tecnicoinfo') {
        matchedUser = militaryUsers.find(u => u.role === 'CH-TECNICOINFO' && u.password === cleanPass) ||
                      militaryUsers.find(u => u.role === 'CH-TECNICOINFO');
      }
    }

    // Caso o militar não seja encontrado no array local, checar credenciais oficiais diretas de contingência
    if (!matchedUser) {
      if (cleanUser === 'dev' && cleanPass === 'fT?t7pTpk=0&_H7fW6@info26') {
        matchedUser = {
          id: 'usr-dev',
          username: 'dev',
          password: cleanPass,
          name: 'Guilherme Manfrinato',
          rank: 'Dev',
          warName: 'Manfrinato',
          role: 'CH-SECINFO',
          active: true,
          specialty: 'Desenvolvedor do Sistema & Administrador Geral (Acesso Total)',
          createdAt: new Date().toISOString(),
        };
      } else if ((cleanUser === 'dasdeves' || cleanNoSpace === 'dasdeves' || cleanUser === 'chsecinfo') && cleanPass === 'H3b3rt0n2001@') {
        matchedUser = {
          id: 'usr-dasdeves',
          username: 'dasdeves',
          password: cleanPass,
          name: '3º Sgt Das Deves',
          rank: '3º Sgt',
          warName: 'Das Deves',
          role: 'CH-SECINFO',
          active: true,
          specialty: 'Chefe da Seção de Informática & Telemática (CHSECINFO)',
          createdAt: new Date().toISOString(),
        };
      } else if ((cleanUser === 'cavalcanti' || cleanNoSpace === 'cavalcanti' || cleanUser === 'chsecinfo') && cleanPass === 'C4v4lc4nti2620@') {
        matchedUser = {
          id: 'usr-cavalcanti',
          username: 'cavalcanti',
          password: cleanPass,
          name: '3º Sgt Cavalcanti',
          rank: '3º Sgt',
          warName: 'Cavalcanti',
          role: 'CH-SECINFO',
          active: true,
          specialty: 'Chefe da Seção de Informática & Telemática (CHSECINFO)',
          createdAt: new Date().toISOString(),
        };
      } else if ((cleanUser === 'castro' || cleanNoSpace === 'castro' || cleanUser === 'auxsecinfo') && cleanPass === 'Fl59381286789.') {
        matchedUser = {
          id: 'usr-castro',
          username: 'castro',
          password: cleanPass,
          name: 'Sd Castro',
          rank: 'Sd',
          warName: 'Castro',
          role: 'AUX-SECINFO',
          active: true,
          specialty: 'Auxiliar da Seção de Informática (AUXSECINFO)',
          createdAt: new Date().toISOString(),
        };
      } else if ((cleanUser === 'arantes' || cleanNoSpace === 'arantes' || cleanUser === 'xerifesecinfo') && cleanPass === '4r4nt3s2620@') {
        matchedUser = {
          id: 'usr-arantes',
          username: 'arantes',
          password: cleanPass,
          name: 'Sd Arantes',
          rank: 'Sd',
          warName: 'Arantes',
          role: 'CH-XERIFEINFO',
          active: true,
          specialty: 'Xerife do Corpo Técnico (XERIFESECINFO)',
          createdAt: new Date().toISOString(),
        };
      } else if ((cleanUser === 'machado' || cleanNoSpace === 'machado') && cleanPass === 'm4ch4d02620@') {
        matchedUser = {
          id: 'usr-machado',
          username: 'machado',
          password: cleanPass,
          name: 'Sd Machado',
          rank: 'Sd',
          warName: 'Machado',
          role: 'CH-TECNICOINFO',
          active: true,
          specialty: 'Técnico de Informática (TECINFO)',
          createdAt: new Date().toISOString(),
        };
      } else if ((cleanUser === 'oliveira' || cleanNoSpace === 'oliveira') && cleanPass === '0liv3ir42620@') {
        matchedUser = {
          id: 'usr-oliveira',
          username: 'oliveira',
          password: cleanPass,
          name: 'Sd Oliveira',
          rank: 'Sd',
          warName: 'Oliveira',
          role: 'CH-TECNICOINFO',
          active: true,
          specialty: 'Técnico de Informática (TECINFO)',
          createdAt: new Date().toISOString(),
        };
      } else if ((cleanUser === 'vecchiato' || cleanNoSpace === 'vecchiato') && cleanPass === 'v3cchi4t02620@') {
        matchedUser = {
          id: 'usr-vecchiato',
          username: 'vecchiato',
          password: cleanPass,
          name: 'Sd Vecchiato',
          rank: 'Sd',
          warName: 'Vecchiato',
          role: 'CH-TECNICOINFO',
          active: true,
          specialty: 'Técnico de Informática (TECINFO)',
          createdAt: new Date().toISOString(),
        };
      } else if (cleanUser === 'tvinfo' && cleanPass === '123') {
        matchedUser = {
          id: 'usr-tvinfo',
          username: 'tvinfo',
          password: cleanPass,
          name: 'Painel TV da Seção',
          rank: 'TI',
          warName: 'Telão Sala TI',
          role: 'CH-TVINFO',
          active: true,
          specialty: 'Exibição de Status e Chamados (Sem Interação)',
          createdAt: new Date().toISOString(),
        };
      }
    }

    if (!matchedUser) {
      setIsSubmitting(false);
      setErrorMsg('Militar não encontrado. Verifique o login digitado.');
      return;
    }

    // 1. Verificar se o militar está com acesso desativado
    if (!matchedUser.active) {
      setIsSubmitting(false);
      setErrorMsg('Este militar está com o acesso inativo no sistema. Procure o Chefe da Seção (CH-SECINFO).');
      return;
    }

    // 2. Verificar se o login está bloqueado por excesso de tentativas (3 erros)
    const isLocked = Boolean(matchedUser.isLocked || (matchedUser.failedAttempts && matchedUser.failedAttempts >= 3));
    if (isLocked) {
      setIsSubmitting(false);
      setErrorMsg('Este login está BLOQUEADO por motivos de segurança (3 tentativas incorretas). Para liberar o acesso, solicite a autorização do Chefe da Seção (CHINFO) ou Auxiliar.');
      return;
    }

    // 3. Validação estrita da Senha
    if (matchedUser.password === cleanPass) {
      // Senha correta: resetar contador de tentativas erradas se houver
      if (matchedUser.failedAttempts && matchedUser.failedAttempts > 0) {
        const resetUser: MilitaryUser = {
          ...matchedUser,
          failedAttempts: 0,
          isLocked: false,
        };
        if (onUpdateMilitaryUsers) {
          onUpdateMilitaryUsers(
            militaryUsers.map(u => u.id === matchedUser.id ? resetUser : u)
          );
        }
        api.updateMilitaryUser(matchedUser.id, { failedAttempts: 0, isLocked: false } as any).catch(console.warn);
      }

      setIsSubmitting(false);
      onLoginSuccess(matchedUser);
      return;
    }

    // 4. Senha incorreta: contabilizar erro e bloquear ao atingir 3 tentativas
    const currentAttempts = (matchedUser.failedAttempts || 0) + 1;
    const lockNow = currentAttempts >= 3;

    const updatedUser: MilitaryUser = {
      ...matchedUser,
      failedAttempts: currentAttempts,
      isLocked: lockNow,
      lockedAt: lockNow ? new Date().toISOString() : matchedUser.lockedAt,
    };

    if (onUpdateMilitaryUsers) {
      onUpdateMilitaryUsers(
        militaryUsers.map(u => u.id === matchedUser.id ? updatedUser : u)
      );
    }

    api.updateMilitaryUser(matchedUser.id, {
      failedAttempts: currentAttempts,
      isLocked: lockNow,
      lockedAt: updatedUser.lockedAt,
    } as any).catch(console.warn);

    setIsSubmitting(false);

    if (lockNow) {
      setErrorMsg('Senha incorreta! Login BLOQUEADO por excesso de tentativas incorretas (3 erros). Para segurança da OM, solicite a liberação ao Chefe da Sec Info (CHINFO) ou Auxiliar.');
      
      if (onAddAuditLog) {
        onAddAuditLog({
          militaryName: matchedUser.name,
          militaryLogin: matchedUser.username,
          role: matchedUser.role,
          actionType: 'USUARIO_BLOQUEADO',
          summary: `Login militar ${matchedUser.username} foi bloqueado após 3 tentativas de senha incorreta.`,
          targetRef: matchedUser.username,
        });
      }
    } else {
      const remaining = 3 - currentAttempts;
      setErrorMsg(`Senha incorreta! Você tem mais ${remaining} tentativa(s) antes do bloqueio automático do login.`);
    }
  };

  return (
    <div className={`min-h-[85vh] flex items-center justify-center p-4 py-8 relative overflow-hidden ${
      a11y.highContrast ? 'bg-black text-white' : 'bg-[#f4f6f2]'
    }`}>
      {/* Marca d'água militar: General Mallet & Artilharia */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.06] bg-cover bg-center bg-no-repeat mix-blend-multiply"
        style={{ backgroundImage: `url(${malletBg})` }}
        aria-hidden="true"
      />

      <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border-2 transition-all shadow-xl relative z-10 ${
        a11y.highContrast 
          ? 'bg-neutral-950 border-yellow-400 text-white' 
          : 'bg-white/95 backdrop-blur-xs border-[#2d4a22]/40'
      }`}>
        
        {/* Emblema Próprio do 2º GAC com Canhões Cruzados */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-[#1e3316] shadow-md border border-[#cba135]/40 mb-1">
            <RegimentoDeodoroLogo size={56} highContrast={a11y.highContrast} />
          </div>

          <div className="font-mono text-xs font-black tracking-widest text-[#2d4a22] uppercase">
            2º GAC - REGIMENTO DEODORO
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Seção de Informática & Telemática
          </h2>
          <p className="text-xs text-slate-600">
            Acesso Restrito · Autenticação Individual Militar
          </p>
        </div>

        {/* Formulário de Login Seguro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#2d4a22]" />
              <span>Login do Militar:</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              autoComplete="username"
              placeholder="Digite seu login..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-[#2d4a22] ${
                a11y.highContrast
                  ? 'bg-black border-yellow-400 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#2d4a22]" />
                <span>Senha Militar:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Máximo: 3 tentativas
              </span>
            </label>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Digite sua senha de acesso..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm font-mono focus:ring-2 focus:ring-[#2d4a22] ${
                  a11y.highContrast
                    ? 'bg-black border-yellow-400 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showPassword ? "Ocultar senha" : "Ver senha digitada"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mensagem de Erro / Alerta de Bloqueio */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-900 border border-red-300 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Botão de Autenticação */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-[#1e3316] text-[#dfb642] font-black text-sm tracking-wider uppercase hover:bg-[#27431e] shadow-md transition-all active:scale-[0.99] border border-[#cba135]/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>Autenticar no Sistema</span>
          </button>
        </form>

        {/* Informações de Segurança da OM */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed text-left flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#27431e] shrink-0 mt-0.5" />
            <span>
              O sistema monitora tentativas inválidas. Em caso de 3 erros consecutivos, o login é trancado preventivamente e só pode ser liberado pelo <strong>Chefe da Sec Info (CHINFO)</strong> ou <strong>Auxiliar</strong>.
            </span>
          </div>
        </div>

        {/* Link para Voltar ao Portal */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center text-center">
          <button
            type="button"
            onClick={onGoBackToPortal}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Voltar para Central do Solicitante</span>
          </button>
        </div>

        {/* Crédito do Desenvolvedor */}
        <div className="mt-4 pt-3 text-center text-[11px] font-mono text-[#27431e] font-semibold border-t border-slate-100">
          Desenvolvido com &lt;3 por Manfrinato
        </div>

      </div>
    </div>
  );
};
