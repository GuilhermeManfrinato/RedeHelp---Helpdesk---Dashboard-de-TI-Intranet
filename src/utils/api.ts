import { 
  Ticket, 
  Department, 
  Technician, 
  Category, 
  NotebookLoan, 
  MilitaryUser, 
  SystemAuditLog, 
  Mission, 
  AttendanceRecord 
} from '../types';

// API Client para o Backend Node.js / Sequelize (MySQL / SQLite)
const API_BASE = '/api';

export const api = {
  // Chamados (Tickets)
  async getTickets(): Promise<Ticket[]> {
    const res = await fetch(`${API_BASE}/tickets`);
    if (!res.ok) throw new Error('Falha ao buscar chamados no banco de dados');
    return res.json();
  },

  async createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
    if (!res.ok) throw new Error('Falha ao salvar chamado no banco de dados');
    return res.json();
  },

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Falha ao atualizar chamado');
    return res.json();
  },

  async deleteTicket(id: string, authorInfo?: { name?: string; login?: string; role?: string }): Promise<void> {
    const params = new URLSearchParams();
    if (authorInfo?.name) params.set('authorName', authorInfo.name);
    if (authorInfo?.login) params.set('authorLogin', authorInfo.login);
    if (authorInfo?.role) params.set('authorRole', authorInfo.role);

    const res = await fetch(`${API_BASE}/tickets/${id}?${params.toString()}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao excluir chamado do banco de dados');
  },

  async updateTicketStatus(id: string, status: string, notes?: string, author?: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolutionNotes: notes, author }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar status');
    return res.json();
  },

  async updateTicketPriority(id: string, priority: string, author?: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets/${id}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority, author }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar prioridade');
    return res.json();
  },

  async updateTicketTitle(id: string, title: string, author?: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets/${id}/title`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar título');
    return res.json();
  },

  async assignTechnician(id: string, technicianId: string, author?: string, techName?: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, author, techName }),
    });
    if (!res.ok) throw new Error('Falha ao atribuir técnico');
    return res.json();
  },

  async sendTicketMessage(id: string, content: string, sender: 'solicitante' | 'ti', senderName: string): Promise<any> {
    const res = await fetch(`${API_BASE}/tickets/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sender, senderName }),
    });
    if (!res.ok) throw new Error('Falha ao enviar mensagem');
    return res.json();
  },

  async addTicketHistory(id: string, comment: string, author: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets/${id}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment, author }),
    });
    if (!res.ok) throw new Error('Falha ao registrar despacho');
    return res.json();
  },

  // Departamentos
  async getDepartments(): Promise<Department[]> {
    const res = await fetch(`${API_BASE}/departments`);
    if (!res.ok) throw new Error('Falha ao buscar seções');
    return res.json();
  },

  // Categorias
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Falha ao buscar categorias');
    return res.json();
  },

  // Militares (Usuários do Sistema)
  async getMilitaryUsers(): Promise<MilitaryUser[]> {
    const res = await fetch(`${API_BASE}/military-users`);
    if (!res.ok) throw new Error('Falha ao buscar militares');
    return res.json();
  },

  async createMilitaryUser(user: MilitaryUser): Promise<MilitaryUser> {
    const res = await fetch(`${API_BASE}/military-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Falha ao cadastrar militar');
    return res.json();
  },

  async updateMilitaryUser(id: string, updates: Partial<MilitaryUser>): Promise<MilitaryUser> {
    const res = await fetch(`${API_BASE}/military-users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Falha ao atualizar militar');
    return res.json();
  },

  async deleteMilitaryUser(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/military-users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao remover militar');
  },

  // Técnicos
  async getTechnicians(): Promise<Technician[]> {
    const res = await fetch(`${API_BASE}/technicians`);
    if (!res.ok) throw new Error('Falha ao buscar técnicos');
    return res.json();
  },

  // Cautelas de Notebooks
  async getNotebookLoans(): Promise<NotebookLoan[]> {
    const res = await fetch(`${API_BASE}/notebook-loans`);
    if (!res.ok) throw new Error('Falha ao buscar cautelas');
    return res.json();
  },

  async createNotebookLoan(loan: Partial<NotebookLoan>): Promise<NotebookLoan> {
    const res = await fetch(`${API_BASE}/notebook-loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loan),
    });
    if (!res.ok) throw new Error('Falha ao registrar cautela');
    return res.json();
  },

  async updateNotebookLoan(id: string, updates: Partial<NotebookLoan>): Promise<NotebookLoan> {
    const res = await fetch(`${API_BASE}/notebook-loans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Falha ao atualizar cautela');
    return res.json();
  },

  async deleteNotebookLoan(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/notebook-loans/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao remover cautela');
  },

  // Missões da TI
  async getMissions(): Promise<Mission[]> {
    const res = await fetch(`${API_BASE}/missions`);
    if (!res.ok) throw new Error('Falha ao buscar missões');
    return res.json();
  },

  async createMission(mission: Partial<Mission>): Promise<Mission> {
    const res = await fetch(`${API_BASE}/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });
    if (!res.ok) throw new Error('Falha ao cadastrar missão');
    return res.json();
  },

  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission> {
    const res = await fetch(`${API_BASE}/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Falha ao atualizar missão');
    return res.json();
  },

  async updateMissionStatus(id: string, status: string, completedAt?: string): Promise<Mission> {
    const res = await fetch(`${API_BASE}/missions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, completedAt }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar status da missão');
    return res.json();
  },

  async deleteMission(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/missions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao excluir missão');
  },

  // Logs de Auditoria
  async getAuditLogs(): Promise<SystemAuditLog[]> {
    const res = await fetch(`${API_BASE}/audit-logs`);
    if (!res.ok) throw new Error('Falha ao buscar logs');
    return res.json();
  },

  async createAuditLog(log: Partial<SystemAuditLog>): Promise<SystemAuditLog> {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error('Falha ao registrar log de auditoria');
    return res.json();
  },

  // Tiragem de Faltas (Formatura do Dia)
  async getAttendanceRecords(date?: string): Promise<AttendanceRecord[]> {
    const url = date ? `${API_BASE}/attendance?date=${date}` : `${API_BASE}/attendance`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao buscar registros de formatura/faltas');
    return res.json();
  },

  async createAttendanceRecord(record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const res = await fetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Falha ao registrar tiragem de faltas');
    return res.json();
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/attendance/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao excluir registro de formatura');
  },

  // Links da Intranet
  async getIntranetLinks(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/intranet-links`);
    if (!res.ok) throw new Error('Falha ao buscar links');
    return res.json();
  },

  async createIntranetLink(link: any): Promise<any> {
    const res = await fetch(`${API_BASE}/intranet-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(link),
    });
    if (!res.ok) throw new Error('Falha ao salvar link');
    return res.json();
  },

  async updateIntranetLink(id: string, updates: any): Promise<any> {
    const res = await fetch(`${API_BASE}/intranet-links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Falha ao atualizar link');
    return res.json();
  },

  async deleteIntranetLink(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/intranet-links/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao excluir link');
  },
};
