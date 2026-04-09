-- ============================================================
-- Seeds iniciais - Canal de Denúncias HSFA
-- ============================================================

-- Roles
INSERT INTO roles (nome, descricao, nivel, ativo) VALUES
  ('admin',      'Administrador com acesso total',                10, TRUE),
  ('gestor',     'Gestor com acesso à maioria dos recursos',       8, TRUE),
  ('analista',   'Analista que trata e responde denúncias',        5, TRUE),
  ('visualizador','Acesso somente leitura',                         2, TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Permissions
INSERT INTO permissions (nome, descricao, slug) VALUES
  ('Visualizar denúncias',   'Listar e visualizar denúncias',            'denuncias.view'),
  ('Editar denúncias',       'Atualizar status e dados de denúncias',    'denuncias.edit'),
  ('Excluir denúncias',      'Excluir denúncias',                        'denuncias.delete'),
  ('Gerenciar usuários',     'CRUD de usuários admin',                   'users.manage'),
  ('Visualizar relatórios',  'Acessar relatórios e estatísticas',        'reports.view'),
  ('Exportar dados',         'Exportar Excel/PDF',                       'reports.export'),
  ('Gerenciar categorias',   'CRUD de categorias',                       'categorias.manage'),
  ('Visualizar audit log',   'Acessar histórico de auditoria',           'audit.view')
ON CONFLICT (slug) DO NOTHING;

-- admin: todas as permissões
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.nome = 'admin'
ON CONFLICT DO NOTHING;

-- gestor: tudo exceto audit e delete
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
 WHERE r.nome = 'gestor'
   AND p.slug IN ('denuncias.view','denuncias.edit','users.manage','reports.view','reports.export','categorias.manage')
ON CONFLICT DO NOTHING;

-- analista: ver e editar denúncias, ver relatórios
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
 WHERE r.nome = 'analista'
   AND p.slug IN ('denuncias.view','denuncias.edit','reports.view')
ON CONFLICT DO NOTHING;

-- visualizador: somente leitura
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
 WHERE r.nome = 'visualizador'
   AND p.slug IN ('denuncias.view','reports.view')
ON CONFLICT DO NOTHING;

-- Categorias padrão HSFA
INSERT INTO categorias (nome, descricao, cor, ordem, ativo) VALUES
  ('Assédio Moral',          'Condutas que constrangem repetidamente o trabalhador', '#DC2626', 1, TRUE),
  ('Assédio Sexual',         'Conduta de natureza sexual não consentida',             '#DC2626', 2, TRUE),
  ('Discriminação',          'Tratamento desigual por raça, gênero, religião, etc.',  '#D97706', 3, TRUE),
  ('Fraude',                 'Suspeita de fraude financeira ou operacional',          '#D97706', 4, TRUE),
  ('Desvio de Conduta',      'Quebra de código de ética ou regulamento interno',      '#0891B2', 5, TRUE),
  ('Negligência',            'Negligência no atendimento ou nos cuidados',            '#0891B2', 6, TRUE),
  ('Corrupção',              'Suborno, propina ou conflito de interesse',             '#DC2626', 7, TRUE),
  ('Má Conduta Profissional','Comportamento inadequado de profissionais',             '#D97706', 8, TRUE),
  ('Segurança do Paciente',  'Problemas que comprometem a segurança do paciente',     '#059669', 9, TRUE),
  ('Outros',                 'Denúncias que não se enquadram nas demais categorias',  '#6B7280', 99, TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Usuário admin inicial (senha: admin@hsfa2025 - bcrypt cost 12)
-- Hash gerado com bcrypt.hashSync('admin@hsfa2025', 12)
-- IMPORTANTE: TROCAR ESTA SENHA NO PRIMEIRO LOGIN
INSERT INTO users (nome, email, usuario, senha_hash, ativo, force_password_change)
VALUES (
  'Administrador',
  'admin@hsfasaude.com.br',
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgyytlMGBwWvgdu',
  TRUE,
  TRUE
)
ON CONFLICT (usuario) DO NOTHING;

-- Atribuir role admin ao usuário inicial
INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
 WHERE u.usuario = 'admin' AND r.nome = 'admin'
ON CONFLICT DO NOTHING;
