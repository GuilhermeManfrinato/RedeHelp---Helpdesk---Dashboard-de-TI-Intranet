import { Sequelize, DataTypes, Model } from 'sequelize';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { 
  initialTickets, 
  initialDepartments, 
  initialTechnicians, 
  initialCategories, 
  initialNotebookLoans, 
  initialMilitaryUsers, 
  initialAuditLogs, 
  initialMissions 
} from '../data/mockData';

dotenv.config();

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_NAME = process.env.DB_NAME || 'eb_deodoro_ti';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

// Instância principal do Sequelize configurada com MySQL (via mysql2)
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 3000
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 10000,
    idle: 5000
  }
});

let isMySQLConnected = false;
const DB_FILE_PATH = path.join(process.cwd(), 'database.json');

// ==================== DEFINIÇÃO DOS MODELOS SEQUELIZE (MYSQL) ====================

export class SqlDepartment extends Model {}
SqlDepartment.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  color: { type: DataTypes.STRING, allowNull: false },
  iconName: { type: DataTypes.STRING, allowNull: false },
  managerName: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, modelName: 'Department', tableName: 'departments', timestamps: true });

export class SqlCategory extends Model {}
SqlCategory.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  icon: { type: DataTypes.STRING, allowNull: false },
  defaultPriority: { type: DataTypes.STRING, allowNull: false },
  simpleInstructions: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, modelName: 'Category', tableName: 'categories', timestamps: true });

export class SqlMilitaryUser extends Model {}
SqlMilitaryUser.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  rank: { type: DataTypes.STRING, allowNull: false },
  warName: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  deactivationReason: { type: DataTypes.TEXT, allowNull: true },
  deactivatedAt: { type: DataTypes.STRING, allowNull: true },
  failedAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  isLocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  lockedAt: { type: DataTypes.STRING, allowNull: true },
}, { sequelize, modelName: 'MilitaryUser', tableName: 'military_users', timestamps: true });

export class SqlTechnician extends Model {}
SqlTechnician.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  specialty: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  currentTicketsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  avatarUrl: { type: DataTypes.STRING, allowNull: true },
}, { sequelize, modelName: 'Technician', tableName: 'technicians', timestamps: true });

export class SqlTicket extends Model {}
SqlTicket.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  departmentId: { type: DataTypes.STRING, allowNull: false },
  requesterName: { type: DataTypes.STRING, allowNull: false },
  priority: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  technicianId: { type: DataTypes.STRING, allowNull: true },
  slaLimitHours: { type: DataTypes.INTEGER, defaultValue: 4 },
  resolvedAt: { type: DataTypes.STRING, allowNull: true },
  resolutionNotes: { type: DataTypes.TEXT, allowNull: true },
  rating: { type: DataTypes.INTEGER, allowNull: true },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  history: { type: DataTypes.JSON, defaultValue: [] },
  messages: { type: DataTypes.JSON, defaultValue: [] },
}, { sequelize, modelName: 'Ticket', tableName: 'tickets', timestamps: true });

export class SqlNotebookLoan extends Model {}
SqlNotebookLoan.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  notebookNumber: { type: DataTypes.STRING, allowNull: false },
  notebookName: { type: DataTypes.STRING, allowNull: false },
  borrowerName: { type: DataTypes.STRING, allowNull: false },
  departmentId: { type: DataTypes.STRING, allowNull: false },
  loanDate: { type: DataTypes.STRING, allowNull: false },
  expectedReturnDate: { type: DataTypes.STRING, allowNull: false },
  originalExpectedReturnDate: { type: DataTypes.STRING, allowNull: true },
  extensionCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastExtensionReason: { type: DataTypes.TEXT, allowNull: true },
  actualReturnDate: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false },
  hasIssuesOnReturn: { type: DataTypes.BOOLEAN, defaultValue: false },
  returnIssues: { type: DataTypes.JSON, defaultValue: [] },
  returnNotes: { type: DataTypes.TEXT, allowNull: true },
  authorizedBy: { type: DataTypes.STRING, allowNull: false },
  returnedAuthorizedBy: { type: DataTypes.STRING, allowNull: true },
  history: { type: DataTypes.JSON, defaultValue: [] },
  messages: { type: DataTypes.JSON, defaultValue: [] },
}, { sequelize, modelName: 'NotebookLoan', tableName: 'notebook_loans', timestamps: true });

export class SqlMission extends Model {}
SqlMission.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  priority: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  assignedTechnicianIds: { type: DataTypes.JSON, defaultValue: [] },
  createdBy: { type: DataTypes.STRING, allowNull: false },
  createdByRole: { type: DataTypes.STRING, allowNull: false },
  deadline: { type: DataTypes.STRING, allowNull: true },
  completedAt: { type: DataTypes.STRING, allowNull: true },
  checklist: { type: DataTypes.JSON, defaultValue: [] },
  notes: { type: DataTypes.JSON, defaultValue: [] },
}, { sequelize, modelName: 'Mission', tableName: 'missions', timestamps: true });

export class SqlSystemAuditLog extends Model {}
SqlSystemAuditLog.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  timestamp: { type: DataTypes.STRING, allowNull: false },
  militaryName: { type: DataTypes.STRING, allowNull: false },
  militaryLogin: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  actionType: { type: DataTypes.STRING, allowNull: false },
  summary: { type: DataTypes.TEXT, allowNull: false },
  details: { type: DataTypes.TEXT, allowNull: true },
  targetRef: { type: DataTypes.STRING, allowNull: true },
}, { sequelize, modelName: 'SystemAuditLog', tableName: 'system_audit_logs', timestamps: true });

export class SqlAttendanceRecord extends Model {}
SqlAttendanceRecord.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  time: { type: DataTypes.STRING, allowNull: false },
  shift: { type: DataTypes.STRING, allowNull: false },
  supervisorName: { type: DataTypes.STRING, allowNull: false },
  supervisorRole: { type: DataTypes.STRING, allowNull: false },
  totalPresent: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalAbsent: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalStrength: { type: DataTypes.INTEGER, defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true },
  roster: { type: DataTypes.JSON, defaultValue: [] },
}, { sequelize, modelName: 'AttendanceRecord', tableName: 'attendance_records', timestamps: true });

export class SqlIntranetLink extends Model {}
SqlIntranetLink.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  isCustom: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, modelName: 'IntranetLink', tableName: 'intranet_links', timestamps: true });

// ==================== CAMADA AUTÔNOMA DE ARMAZENAMENTO PERSISTENTE (LOCAL / INTRANET) ====================

interface LocalDatabaseState {
  departments: any[];
  categories: any[];
  military_users: any[];
  technicians: any[];
  tickets: any[];
  notebook_loans: any[];
  missions: any[];
  system_audit_logs: any[];
  attendance_records: any[];
  intranet_links: any[];
}

const DEFAULT_INTRANET_LINKS = [
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
    description: 'Servidor local da Seção de Informática e Telemática do Regimento.',
  },
  {
    id: 'link-7',
    title: 'DCT - Depto de Ciência e Tecnologia',
    url: 'http://www.dct.eb.mil.br',
    category: 'Comunicações',
    description: 'Diretrizes de segurança da informação e telemática militar.',
  },
];

const loadLocalData = (): LocalDatabaseState => {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      if (raw.trim()) {
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.warn('[DB] Erro ao carregar database.json:', err);
  }

  const initialData: LocalDatabaseState = {
    departments: initialDepartments,
    categories: initialCategories,
    military_users: initialMilitaryUsers,
    technicians: initialTechnicians,
    tickets: initialTickets,
    notebook_loans: initialNotebookLoans,
    missions: initialMissions,
    system_audit_logs: initialAuditLogs,
    attendance_records: [],
    intranet_links: DEFAULT_INTRANET_LINKS,
  };

  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch {}

  return initialData;
};

const saveLocalData = (data: LocalDatabaseState) => {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Erro ao salvar database.json:', err);
  }
};

let localStore: LocalDatabaseState = loadLocalData();

// Cria um encapsulador que roteia para o Sequelize MySQL se conectado, ou para o armazenamento autônomo local
function createModelAdapter(tableName: keyof LocalDatabaseState, sqlModel: any) {
  const wrapItem = (item: any) => {
    if (!item) return null;
    return {
      ...item,
      toJSON: () => ({ ...item }),
      dataValues: { ...item },
      update: async (updates: any) => {
        if (isMySQLConnected) {
          try {
            const found = await sqlModel.findByPk(item.id);
            if (found) await found.update(updates);
          } catch {}
        }
        Object.assign(item, updates, { updatedAt: new Date().toISOString() });
        const list = localStore[tableName];
        const idx = list.findIndex((x: any) => x.id === item.id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
          saveLocalData(localStore);
        }
        return wrapItem(item);
      },
      destroy: async () => {
        if (isMySQLConnected) {
          try {
            const found = await sqlModel.findByPk(item.id);
            if (found) await found.destroy();
          } catch {}
        }
        localStore[tableName] = localStore[tableName].filter((x: any) => x.id !== item.id);
        saveLocalData(localStore);
      }
    };
  };

  return {
    rawAttributes: sqlModel.rawAttributes,

    findAll: async (options?: any) => {
      if (isMySQLConnected) {
        try {
          const res = await sqlModel.findAll(options);
          return res.map((r: any) => r.toJSON ? r.toJSON() : r);
        } catch (err) {
          console.warn(`[Sequelize MySQL] Falha na consulta ${tableName}, usando cache local:`, err);
        }
      }
      let items = [...localStore[tableName]];
      if (options?.where) {
        items = items.filter(item => {
          for (const key of Object.keys(options.where)) {
            if (item[key] !== options.where[key]) return false;
          }
          return true;
        });
      }
      return items.map(wrapItem);
    },

    findByPk: async (id: string) => {
      if (isMySQLConnected) {
        try {
          const res = await sqlModel.findByPk(id);
          if (res) return wrapItem(res.toJSON ? res.toJSON() : res);
        } catch {}
      }
      const item = localStore[tableName].find((x: any) => String(x.id) === String(id));
      return wrapItem(item);
    },

    findOne: async (options?: any) => {
      if (isMySQLConnected) {
        try {
          const res = await sqlModel.findOne(options);
          if (res) return wrapItem(res.toJSON ? res.toJSON() : res);
        } catch {}
      }
      if (options?.where) {
        const item = localStore[tableName].find((x: any) => {
          for (const key of Object.keys(options.where)) {
            if (x[key] !== options.where[key]) return false;
          }
          return true;
        });
        return wrapItem(item);
      }
      return wrapItem(localStore[tableName][0]);
    },

    create: async (data: any) => {
      const nowIso = new Date().toISOString();
      const newItem = {
        ...data,
        createdAt: data.createdAt || nowIso,
        updatedAt: nowIso,
      };

      if (isMySQLConnected) {
        try {
          await sqlModel.create(newItem);
        } catch (err) {
          console.warn(`[Sequelize MySQL] Falha ao criar registro em ${tableName}:`, err);
        }
      }

      localStore[tableName] = [newItem, ...localStore[tableName].filter((x: any) => x.id !== newItem.id)];
      saveLocalData(localStore);
      return wrapItem(newItem);
    },

    count: async (options?: any) => {
      if (isMySQLConnected) {
        try {
          return await sqlModel.count(options);
        } catch {}
      }
      return localStore[tableName].length;
    },

    destroy: async (options?: any) => {
      if (isMySQLConnected) {
        try {
          await sqlModel.destroy(options);
        } catch {}
      }
      if (options?.where) {
        localStore[tableName] = localStore[tableName].filter((item: any) => {
          for (const key of Object.keys(options.where)) {
            if (item[key] === options.where[key]) return false;
          }
          return true;
        });
        saveLocalData(localStore);
      }
    }
  };
}

// Exportação dos Modelos compatíveis com a API do Sequelize
export const DepartmentModel = createModelAdapter('departments', SqlDepartment);
export const CategoryModel = createModelAdapter('categories', SqlCategory);
export const MilitaryUserModel = createModelAdapter('military_users', SqlMilitaryUser);
export const TechnicianModel = createModelAdapter('technicians', SqlTechnician);
export const TicketModel = createModelAdapter('tickets', SqlTicket);
export const NotebookLoanModel = createModelAdapter('notebook_loans', SqlNotebookLoan);
export const MissionModel = createModelAdapter('missions', SqlMission);
export const SystemAuditLogModel = createModelAdapter('system_audit_logs', SqlSystemAuditLog);
export const AttendanceRecordModel = createModelAdapter('attendance_records', SqlAttendanceRecord);
export const IntranetLinkModel = createModelAdapter('intranet_links', SqlIntranetLink);

// ==================== INICIALIZAÇÃO & MIGRAÇÃO AUTOMÁTICA ====================

export const initDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    isMySQLConnected = true;
    console.log(`[Sequelize] ✅ Conexão estabelecida com sucesso com o banco MySQL real (${DB_NAME}@${DB_HOST}:${DB_PORT})!`);
    await sequelize.sync({ alter: true });
    console.log('[Sequelize] ✅ Tabelas MySQL sincronizadas.');

    // Se o MySQL estiver vazio, popula com os dados iniciais
    const countTickets = await SqlTicket.count();
    if (countTickets === 0) {
      console.log('[Sequelize] Semeando dados iniciais no MySQL...');
      for (const d of localStore.departments) await SqlDepartment.create(d).catch(() => {});
      for (const c of localStore.categories) await SqlCategory.create(c).catch(() => {});
      for (const u of localStore.military_users) await SqlMilitaryUser.create(u).catch(() => {});
      for (const t of localStore.technicians) await SqlTechnician.create(t).catch(() => {});
      for (const tk of localStore.tickets) await SqlTicket.create(tk).catch(() => {});
      for (const l of localStore.notebook_loans) await SqlNotebookLoan.create(l).catch(() => {});
      for (const m of localStore.missions) await SqlMission.create(m).catch(() => {});
      for (const a of localStore.system_audit_logs) await SqlSystemAuditLog.create(a).catch(() => {});
      for (const l of localStore.intranet_links) await SqlIntranetLink.create(l).catch(() => {});
      console.log('[Sequelize] ✅ Banco MySQL populado com sucesso.');
    }
  } catch (mysqlErr: any) {
    isMySQLConnected = false;
    console.log(`[Sequelize] ⚠️ MySQL não detectado no host ${DB_HOST}:${DB_PORT} (${mysqlErr?.message || 'Offline'}).`);
    console.log(`[Sequelize] 🚀 Modo Autônomo para Intranet Ativo: Dados persistidos com segurança em ${DB_FILE_PATH}.`);
    console.log(`[Sequelize] ℹ️ Quando o servidor MySQL for iniciado, o Sequelize se conectará automaticamente na próxima inicialização.`);
  }
};
