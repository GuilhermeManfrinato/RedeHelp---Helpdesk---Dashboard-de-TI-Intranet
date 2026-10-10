import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  initDatabase, 
  TicketModel, 
  DepartmentModel, 
  CategoryModel, 
  TechnicianModel, 
  MilitaryUserModel, 
  NotebookLoanModel, 
  MissionModel, 
  SystemAuditLogModel, 
  AttendanceRecordModel, 
  IntranetLinkModel 
} from './src/server/db';
import { hashPassword, verifyPassword, encryptPayload, decryptPayload } from './src/server/crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ==================== SEGURANÇA E PROTEÇÃO MILITAR DO BACKEND ====================
// Cabeçalhos de Proteção HTTP (OWASP / Padrões de Segurança Governamental)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Mecanismo Anti-Força Bruta em Memória (Rate Limiter de Autenticação)
const failedAttemptsMap = new Map<string, { count: number; lockedUntil: number }>();

const isIpOrUserBlocked = (key: string): boolean => {
  const record = failedAttemptsMap.get(key);
  if (!record) return false;
  if (record.lockedUntil > Date.now()) return true;
  return false;
};

const recordFailedLogin = (key: string) => {
  const now = Date.now();
  const record = failedAttemptsMap.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  // Bloquear por 2 minutos após 5 tentativas falhas seguidas
  if (record.count >= 5) {
    record.lockedUntil = now + 120000;
  }
  failedAttemptsMap.set(key, record);
};

const clearFailedLogin = (key: string) => {
  failedAttemptsMap.delete(key);
};

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== ROTAS DA API REST COM SEQUELIZE ====================

// Status e Saúde com Criptografia de Diagnóstico
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    system: '2º GAC - Regimento Deodoro | Seção de Informática & TI',
    security: 'AES-256-CBC Encrypted / SHA-512 Salted PBKDF2 Active'
  });
});

// Autenticação Segura com Proteção Anti-Força Bruta e Criptografia
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const limitKey = `${clientIp}:${username}`;

    if (isIpOrUserBlocked(limitKey)) {
      return res.status(429).json({ 
        error: 'Muitas tentativas incorretas. Acesso bloqueado temporariamente por 2 minutos por razões de segurança militar.' 
      });
    }

    const cleanUser = String(username || '').toLowerCase().trim();
    const user = await MilitaryUserModel.findOne({ where: { username: cleanUser } });
    if (!user) {
      recordFailedLogin(limitKey);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const userData = (user as any).dataValues || user;
    if (userData.active === false) {
      return res.status(403).json({ error: 'Usuário desativado ou desligado da Seção de TI.' });
    }

    // Validação da senha (suporta texto direto do mock ou hash PBKDF2 com salt)
    const isDirectMatch = userData.password === password;
    const isHashMatch = userData.salt ? verifyPassword(password, userData.password, userData.salt) : false;

    if (!isDirectMatch && !isHashMatch) {
      recordFailedLogin(limitKey);
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    clearFailedLogin(limitKey);
    const { password: _, salt: __, ...safeUser } = userData;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. TICKETS (CHAMADOS)
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await TicketModel.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      data.id = `t-${Date.now()}`;
    }
    const ticket = await TicketModel.create(data);
    res.status(201).json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await TicketModel.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });
    
    const updateData = { ...req.body };
    if (updateData.history === undefined) {
      delete updateData.history;
    }
    const currentStatus = (ticket as any).status;
    const finalTechId = updateData.technicianId !== undefined ? updateData.technicianId : (ticket as any).technicianId;
    if (finalTechId && currentStatus !== 'resolvido' && currentStatus !== 'cancelado' && !updateData.status) {
      updateData.status = 'em_atendimento';
    }

    await ticket.update(updateData);
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rota de exclusão definitiva do chamado
app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await TicketModel.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });
    
    const code = (ticket as any).code;
    const title = (ticket as any).title;
    await ticket.destroy();

    // Registrar log de auditoria
    await SystemAuditLogModel.create({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      militaryName: req.query.authorName as string || 'Administrador da TI',
      militaryLogin: req.query.authorLogin as string || 'ti',
      role: (req.query.authorRole as string) || 'CH-SECINFO',
      actionType: 'EXCLUSAO_CHAMADO',
      summary: `Excluiu definitivamente o chamado ${code} (${title}) do banco de dados`,
      targetRef: code,
    } as any);

    res.json({ success: true, message: `Chamado ${code} excluído com sucesso.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar status do chamado
app.patch('/api/tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes, author } = req.body;
    const ticket = await TicketModel.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });

    const currentHistory = (ticket as any).history || [];
    const isResolving = status === 'resolvido' && (ticket as any).status !== 'resolvido';

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author: author || 'Seção de TI',
      action: `Bloco alterado para: ${status.replace('_', ' ').toUpperCase()}`,
      comment: resolutionNotes,
    };

    await ticket.update({
      status,
      resolvedAt: isResolving ? new Date() : (ticket as any).resolvedAt,
      resolutionNotes: resolutionNotes || (ticket as any).resolutionNotes,
      history: [...currentHistory, newHistoryItem]
    });

    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar prioridade
app.patch('/api/tickets/:id/priority', async (req, res) => {
  try {
    const { id } = req.params;
    const { priority, author } = req.body;
    const ticket = await TicketModel.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });

    const newSla = priority === 'critica' ? 1 : priority === 'alta' ? 2 : priority === 'media' ? 4 : 24;
    const currentHistory = (ticket as any).history || [];

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author: author || 'Xerife da TI',
      action: `Prioridade ajustada para: ${priority.toUpperCase()} (SLA: ${newSla}h)`,
    };

    await ticket.update({
      priority,
      slaLimitHours: newSla,
      history: [...currentHistory, newHistoryItem]
    });

    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar título
app.patch('/api/tickets/:id/title', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author } = req.body;
    const ticket = await TicketModel.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });

    const oldTitle = (ticket as any).title;
    const currentHistory = (ticket as any).history || [];

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author: author || 'Xerife da TI',
      action: 'Título do chamado renomeado',
      comment: `Anterior: "${oldTitle}" → Novo: "${title.trim()}"`,
    };

    await ticket.update({
      title: title.trim(),
      history: [...currentHistory, newHistoryItem]
    });

    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Atribuir técnico
app.patch('/api/tickets/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId, author, techName } = req.body;
    const ticket = await TicketModel.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });

    const currentHistory = (ticket as any).history || [];
    const currentStatus = (ticket as any).status;
    const newStatus = (technicianId && currentStatus !== 'resolvido' && currentStatus !== 'cancelado')
      ? 'em_atendimento'
      : (technicianId ? currentStatus : (currentStatus === 'em_atendimento' ? 'aberto' : currentStatus));

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author: author || 'Xerife da TI',
      action: technicianId ? `Atribuído ao técnico: ${techName || technicianId}` : 'Militar desvinculado',
    };

    await ticket.update({
      technicianId: technicianId || null,
      status: newStatus,
      history: [...currentHistory, newHistoryItem]
    });

    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mensagens no Mini-Chat do Chamado
app.post('/api/tickets/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, sender, senderName } = req.body;
    const ticket = await TicketModel.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });

    let currentMessages = (ticket as any).messages || [];
    if (typeof currentMessages === 'string') {
      try { currentMessages = JSON.parse(currentMessages); } catch { currentMessages = []; }
    }
    if (!Array.isArray(currentMessages)) currentMessages = [];

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender,
      senderName,
      content,
      createdAt: new Date().toISOString(),
      readByTi: sender === 'ti',
    };

    await ticket.update({
      messages: [...currentMessages, newMsg]
    });

    res.json({ message: newMsg, ticket });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Despacho no histórico
app.post('/api/tickets/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, author } = req.body;
    const ticket = await TicketModel.findByPk(id);
    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });

    let currentHistory = (ticket as any).history || [];
    if (typeof currentHistory === 'string') {
      try { currentHistory = JSON.parse(currentHistory); } catch { currentHistory = []; }
    }
    if (!Array.isArray(currentHistory)) currentHistory = [];

    const newHistoryItem = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      author: author || 'Seção de TI',
      action: 'Despacho Técnico',
      comment: (comment || '').trim(),
    };

    await ticket.update({
      history: [...currentHistory, newHistoryItem]
    });

    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SEÇÕES DA OM (DEPARTAMENTOS)
app.get('/api/departments', async (req, res) => {
  try {
    const depts = await DepartmentModel.findAll();
    res.json(depts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const dept = await DepartmentModel.create(req.body);
    res.status(201).json(dept);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CATEGORIAS DE OCORRÊNCIA
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await CategoryModel.findAll();
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. MILITARES DO SISTEMA (USUÁRIOS COM LOGIN & SENHA)
app.get('/api/military-users', async (req, res) => {
  try {
    const users = await MilitaryUserModel.findAll();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/military-users', async (req, res) => {
  try {
    const user = await MilitaryUserModel.create(req.body);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/military-users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await MilitaryUserModel.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Militar não encontrado' });
    await user.update(req.body);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/military-users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await MilitaryUserModel.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Militar não encontrado' });
    await user.destroy();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. TÉCNICOS DA BANCADA
app.get('/api/technicians', async (req, res) => {
  try {
    const techs = await TechnicianModel.findAll();
    res.json(techs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/technicians', async (req, res) => {
  try {
    const tech = await TechnicianModel.create(req.body);
    res.status(201).json(tech);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. CAUTELA DE NOTEBOOKS
app.get('/api/notebook-loans', async (req, res) => {
  try {
    const loans = await NotebookLoanModel.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(loans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notebook-loans', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) data.id = `loan-${Date.now()}`;
    const loan = await NotebookLoanModel.create(data);
    res.status(201).json(loan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notebook-loans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await NotebookLoanModel.findByPk(id);
    if (!loan) return res.status(404).json({ error: 'Cautela não encontrada' });
    await loan.update(req.body);
    res.json(loan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notebook-loans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await NotebookLoanModel.findByPk(id);
    if (!loan) return res.status(404).json({ error: 'Cautela não encontrada' });
    await loan.destroy();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. MISSÕES DA SEÇÃO DE TI
app.get('/api/missions', async (req, res) => {
  try {
    const missions = await MissionModel.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(missions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/missions', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) data.id = `m-${Date.now()}`;
    if (!data.code) {
      const count = await MissionModel.count();
      data.code = `MISSAO-${101 + count}`;
    }
    const mission = await MissionModel.create(data);
    res.status(201).json(mission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/missions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mission = await MissionModel.findByPk(id);
    if (!mission) return res.status(404).json({ error: 'Missão não encontrada' });
    await mission.update(req.body);
    res.json(mission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/missions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completedAt } = req.body;
    const mission = await MissionModel.findByPk(id);
    if (!mission) return res.status(404).json({ error: 'Missão não encontrada' });
    
    await mission.update({
      status,
      completedAt: status === 'concluida' ? (completedAt || new Date()) : (status === 'pendente' ? null : (mission as any).completedAt)
    });
    res.json(mission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/missions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mission = await MissionModel.findByPk(id);
    if (!mission) return res.status(404).json({ error: 'Missão não encontrada' });
    await mission.destroy();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. LOGS DE AUDITORIA
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await SystemAuditLogModel.findAll({
      order: [['createdAt', 'DESC']],
      limit: 500
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) data.id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    if (!data.timestamp) data.timestamp = new Date().toISOString();
    const log = await SystemAuditLogModel.create(data);
    res.status(201).json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. TIRAGEM DE FALTAS & MAPA DE EFETIVO (ROLL CALL / FORMATURA)
app.get('/api/attendance', async (req, res) => {
  try {
    const { date } = req.query;
    const where: any = {};
    if (date) where.date = date;

    const records = await AttendanceRecordModel.findAll({
      where,
      order: [['date', 'DESC'], ['time', 'DESC']]
    });
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) data.id = `att-${Date.now()}`;
    const record = await AttendanceRecordModel.create(data);

    // Também registrar no log geral de auditoria para visualização de superiores
    await SystemAuditLogModel.create({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      militaryName: data.supervisorName || 'Xerife / Chefe TI',
      militaryLogin: 'secinfo',
      role: data.supervisorRole || 'CH-XERIFEINFO',
      actionType: 'STATUS_MISSAO',
      summary: `Tiragem de Faltas realizada (${data.shift} - ${data.date}): ${data.totalPresent} presentes de ${data.totalStrength} militares`,
      details: data.notes ? `Observações do oficial/sargento: ${data.notes}` : undefined,
      targetRef: `FORMATURA-${data.date}`,
    } as any);

    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/attendance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await AttendanceRecordModel.findByPk(id);
    if (!record) return res.status(404).json({ error: 'Registro de chamada não encontrado' });
    await record.destroy();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. LINKS DA INTRANET
app.get('/api/intranet-links', async (req, res) => {
  try {
    const links = await IntranetLinkModel.findAll({
      order: [['category', 'ASC'], ['title', 'ASC']]
    });
    res.json(links);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/intranet-links', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) data.id = `link-${Date.now()}`;
    const link = await IntranetLinkModel.create(data);
    res.status(201).json(link);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/intranet-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const link = await IntranetLinkModel.findByPk(id);
    if (!link) return res.status(404).json({ error: 'Link não encontrado' });
    await link.update(req.body);
    res.json(link);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/intranet-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const link = await IntranetLinkModel.findByPk(id);
    if (link) {
      await link.destroy();
    }
    // Garante exclusão direta por critério caso o findByPk retorne nulo
    await IntranetLinkModel.destroy({ where: { id } }).catch(() => {});
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/intranet-links/save-all', async (req, res) => {
  try {
    const { links } = req.body;
    if (Array.isArray(links)) {
      const existing = await IntranetLinkModel.findAll();
      for (const el of existing) {
        await IntranetLinkModel.destroy({ where: { id: el.id } }).catch(() => {});
      }
      for (const l of links) {
        const item = { ...l };
        if (!item.id) item.id = `link-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await IntranetLinkModel.create(item).catch(() => {});
      }
    }
    const all = await IntranetLinkModel.findAll({
      order: [['category', 'ASC'], ['title', 'ASC']]
    });
    res.json(all);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== INTEGRAÇÃO VITE / FRONTEND ESTÁTICO ====================

const startServer = async () => {
  // Inicializa o banco de dados Sequelize (MySQL ou SQLite fallback)
  await initDatabase();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[2º GAC - Regimento Deodoro] Servidor operacional em http://localhost:${PORT} e http://127.0.0.1:${PORT}`);
    console.log(`[Intranet Ready] Modo autônomo sem dependências externas de internet`);
  });
};

startServer().catch((err) => {
  console.error('Falha crítica ao iniciar servidor:', err);
  process.exit(1);
});
