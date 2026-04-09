import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  bigserial,
  jsonb,
  primaryKey,
  char,
  bigint,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ============================================================
// ENUMs
// ============================================================
export const denunciaStatusEnum = pgEnum('denuncia_status', [
  'Pendente',
  'Em Análise',
  'Em Investigação',
  'Concluída',
  'Arquivada',
])

export const denunciaPrioridadeEnum = pgEnum('denuncia_prioridade', [
  'Baixa',
  'Média',
  'Alta',
  'Urgente',
])

// ============================================================
// Tabelas
// ============================================================

export const categorias = pgTable('categorias', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull().unique(),
  descricao: text('descricao'),
  cor: text('cor').default('#01717B'),
  icone: text('icone'),
  ordem: integer('ordem').default(0),
  ativo: boolean('ativo').default(true),
  requerAprovacao: boolean('requer_aprovacao').default(false),
  dataCriacao: timestamp('data_criacao', { withTimezone: true }).defaultNow(),
  dataAtualizacao: timestamp('data_atualizacao', { withTimezone: true }).defaultNow(),
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  usuario: text('usuario').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  ativo: boolean('ativo').default(true),
  tentativasLogin: integer('tentativas_login').default(0),
  bloqueadoAte: timestamp('bloqueado_ate', { withTimezone: true }),
  ultimoAcesso: timestamp('ultimo_acesso', { withTimezone: true }),
  forcePasswordChange: boolean('force_password_change').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
})

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull().unique(),
  descricao: text('descricao'),
  nivel: integer('nivel').notNull(),
  ativo: boolean('ativo').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const userRole = pgTable(
  'user_role',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId] }),
  }),
)

export const rolePermission = pgTable(
  'role_permission',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
  }),
)

export const denuncias = pgTable(
  'denuncias',
  {
    id: serial('id').primaryKey(),
    protocolo: char('protocolo', { length: 8 }).notNull().unique(),
    descricao: text('descricao').notNull(),
    status: denunciaStatusEnum('status').notNull().default('Pendente'),
    prioridade: denunciaPrioridadeEnum('prioridade').notNull().default('Média'),
    ipDenunciante: text('ip_denunciante'),
    userAgent: text('user_agent'),
    dataOcorrencia: date('data_ocorrencia'),
    localOcorrencia: text('local_ocorrencia'),
    pessoasEnvolvidas: text('pessoas_envolvidas'),
    dataCriacao: timestamp('data_criacao', { withTimezone: true }).defaultNow(),
    dataAtualizacao: timestamp('data_atualizacao', { withTimezone: true }).defaultNow(),
    dataConclusao: timestamp('data_conclusao', { withTimezone: true }),
    conclusaoDescricao: text('conclusao_descricao'),
    adminResponsavelId: integer('admin_responsavel_id').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (t) => ({
    idxProtocolo: index('idx_denuncias_protocolo').on(t.protocolo),
    idxStatus: index('idx_denuncias_status').on(t.status),
    idxDataCriacao: index('idx_denuncias_data_criacao').on(t.dataCriacao),
  }),
)

export const denunciaCategoria = pgTable(
  'denuncia_categoria',
  {
    denunciaId: integer('denuncia_id')
      .notNull()
      .references(() => denuncias.id, { onDelete: 'cascade' }),
    categoriaId: integer('categoria_id')
      .notNull()
      .references(() => categorias.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.denunciaId, t.categoriaId] }),
  }),
)

export const anexos = pgTable('anexos', {
  id: serial('id').primaryKey(),
  denunciaId: integer('denuncia_id')
    .notNull()
    .references(() => denuncias.id, { onDelete: 'cascade' }),
  nomeArquivo: text('nome_arquivo').notNull(),
  tipoArquivo: text('tipo_arquivo'),
  tamanho: bigint('tamanho', { mode: 'number' }),
  storagePath: text('storage_path').notNull(),
  dataUpload: timestamp('data_upload', { withTimezone: true }).defaultNow(),
})

export const historicoStatus = pgTable('historico_status', {
  id: serial('id').primaryKey(),
  denunciaId: integer('denuncia_id')
    .notNull()
    .references(() => denuncias.id, { onDelete: 'cascade' }),
  statusAnterior: denunciaStatusEnum('status_anterior'),
  statusNovo: denunciaStatusEnum('status_novo').notNull(),
  adminId: integer('admin_id').references(() => users.id, { onDelete: 'set null' }),
  observacao: text('observacao'),
  dataAlteracao: timestamp('data_alteracao', { withTimezone: true }).defaultNow(),
})

export const respostas = pgTable('respostas', {
  id: serial('id').primaryKey(),
  denunciaId: integer('denuncia_id')
    .notNull()
    .references(() => denuncias.id, { onDelete: 'cascade' }),
  adminId: integer('admin_id').references(() => users.id, { onDelete: 'set null' }),
  resposta: text('resposta').notNull(),
  dataCriacao: timestamp('data_criacao', { withTimezone: true }).defaultNow(),
})

export const notificacoes = pgTable('notificacoes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(),
  titulo: text('titulo').notNull(),
  mensagem: text('mensagem').notNull(),
  lida: boolean('lida').default(false),
  denunciaId: integer('denuncia_id').references(() => denuncias.id, { onDelete: 'set null' }),
  dataCriacao: timestamp('data_criacao', { withTimezone: true }).defaultNow(),
})

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entity: text('entity'),
  entityId: integer('entity_id'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
