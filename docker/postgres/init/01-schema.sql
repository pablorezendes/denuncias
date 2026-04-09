-- ============================================================
-- Canal de Denúncias HSFA - Schema PostgreSQL
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMs
DO $$ BEGIN
  CREATE TYPE denuncia_status AS ENUM ('Pendente','Em Análise','Em Investigação','Concluída','Arquivada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE denuncia_prioridade AS ENUM ('Baixa','Média','Alta','Urgente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Tabelas
-- ============================================================

-- Categorias
CREATE TABLE IF NOT EXISTS categorias (
  id              SERIAL PRIMARY KEY,
  nome            TEXT NOT NULL UNIQUE,
  descricao       TEXT,
  cor             TEXT DEFAULT '#01717B',
  icone           TEXT,
  ordem           INT  DEFAULT 0,
  ativo           BOOLEAN DEFAULT TRUE,
  requer_aprovacao BOOLEAN DEFAULT FALSE,
  data_criacao    TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários
CREATE TABLE IF NOT EXISTS users (
  id                    SERIAL PRIMARY KEY,
  nome                  TEXT NOT NULL,
  email                 CITEXT UNIQUE NOT NULL,
  usuario               CITEXT UNIQUE NOT NULL,
  senha_hash            TEXT NOT NULL,
  ativo                 BOOLEAN DEFAULT TRUE,
  tentativas_login      INT DEFAULT 0,
  bloqueado_ate         TIMESTAMPTZ,
  ultimo_acesso         TIMESTAMPTZ,
  force_password_change BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL UNIQUE,
  descricao   TEXT,
  nivel       INT NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Relação User-Role (N:N)
CREATE TABLE IF NOT EXISTS user_role (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Relação Role-Permission (N:N)
CREATE TABLE IF NOT EXISTS role_permission (
  role_id       INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Denúncias
CREATE TABLE IF NOT EXISTS denuncias (
  id                   SERIAL PRIMARY KEY,
  protocolo            CHAR(8) UNIQUE NOT NULL,
  descricao            TEXT NOT NULL,
  status               denuncia_status NOT NULL DEFAULT 'Pendente',
  prioridade           denuncia_prioridade NOT NULL DEFAULT 'Média',
  ip_denunciante       INET,
  user_agent           TEXT,
  data_ocorrencia      DATE,
  local_ocorrencia     TEXT,
  pessoas_envolvidas   TEXT,
  data_criacao         TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao     TIMESTAMPTZ DEFAULT NOW(),
  data_conclusao       TIMESTAMPTZ,
  conclusao_descricao  TEXT,
  admin_responsavel_id INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_denuncias_protocolo ON denuncias(protocolo);
CREATE INDEX IF NOT EXISTS idx_denuncias_status ON denuncias(status);
CREATE INDEX IF NOT EXISTS idx_denuncias_data_criacao ON denuncias(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_denuncias_admin_resp ON denuncias(admin_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_descricao_trgm ON denuncias USING GIN (descricao gin_trgm_ops);

-- Denúncia-Categoria (N:N)
CREATE TABLE IF NOT EXISTS denuncia_categoria (
  denuncia_id  INT NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  PRIMARY KEY (denuncia_id, categoria_id)
);

-- Anexos
CREATE TABLE IF NOT EXISTS anexos (
  id           SERIAL PRIMARY KEY,
  denuncia_id  INT NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho      BIGINT,
  storage_path TEXT NOT NULL,
  data_upload  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anexos_denuncia ON anexos(denuncia_id);

-- Histórico de Status
CREATE TABLE IF NOT EXISTS historico_status (
  id               SERIAL PRIMARY KEY,
  denuncia_id      INT NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  status_anterior  denuncia_status,
  status_novo      denuncia_status NOT NULL,
  admin_id         INT REFERENCES users(id) ON DELETE SET NULL,
  observacao       TEXT,
  data_alteracao   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_denuncia ON historico_status(denuncia_id, data_alteracao DESC);

-- Respostas
CREATE TABLE IF NOT EXISTS respostas (
  id            SERIAL PRIMARY KEY,
  denuncia_id   INT NOT NULL REFERENCES denuncias(id) ON DELETE CASCADE,
  admin_id      INT REFERENCES users(id) ON DELETE SET NULL,
  resposta      TEXT NOT NULL,
  data_criacao  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_respostas_denuncia ON respostas(denuncia_id);

-- Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL,
  titulo        TEXT NOT NULL,
  mensagem      TEXT NOT NULL,
  lida          BOOLEAN DEFAULT FALSE,
  denuncia_id   INT REFERENCES denuncias(id) ON DELETE SET NULL,
  data_criacao  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON notificacoes(user_id, lida, data_criacao DESC);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity      TEXT,
  entity_id   INT,
  ip          INET,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);

-- ============================================================
-- Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_timestamp_users()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_denuncias_updated ON denuncias;
CREATE TRIGGER tg_denuncias_updated
  BEFORE UPDATE ON denuncias
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS tg_categorias_updated ON categorias;
CREATE TRIGGER tg_categorias_updated
  BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS tg_users_updated ON users;
CREATE TRIGGER tg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_users();

-- ============================================================
-- Function: incrementar tentativas de login
-- ============================================================

CREATE OR REPLACE FUNCTION increment_login_attempts(p_user_id INT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
     SET tentativas_login = tentativas_login + 1,
         bloqueado_ate = CASE
           WHEN tentativas_login + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
           ELSE bloqueado_ate
         END
   WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
