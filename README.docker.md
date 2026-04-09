# Canal de Denúncias HSFA — Stack Docker

Sistema completo dockerizado com PostgreSQL local, MinIO para arquivos, Redis para rate limiting, API Fastify + Drizzle e frontend React servido via nginx.

## Arquitetura

```
  [ Browser ]
      │
      ▼
 ┌────────────┐    /api/*     ┌──────────┐
 │  nginx     │──────────────▶│  API     │
 │  :80/:443  │               │  :3001   │
 │  SPA +     │               │  Fastify │
 │  reverse   │               └────┬─────┘
 │  proxy     │                    │
 └────────────┘                    │
                         ┌─────────┼──────────┐
                         ▼         ▼          ▼
                  ┌──────────┐ ┌──────┐ ┌──────────┐
                  │ Postgres │ │Redis │ │  MinIO   │
                  │  :5432   │ │:6379 │ │  :9000   │
                  └──────────┘ └──────┘ └──────────┘
```

## Pré-requisitos

- Docker 24+ e Docker Compose v2
- Make (opcional, facilita comandos)
- Node 20+ (apenas para desenvolvimento local fora do Docker)

## Setup inicial

1. **Clone e entre no projeto:**
   ```bash
   cd denuncias.hsfasaude.com.br
   ```

2. **Crie o arquivo `.env`:**
   ```bash
   cp .env.example .env
   ```
   Edite `.env` e gere senhas fortes. Comandos úteis:
   ```bash
   openssl rand -base64 32    # senhas
   openssl rand -base64 64    # JWT_SECRET (mínimo 32 chars)
   ```

3. **Suba o stack:**
   ```bash
   make up
   # ou: docker compose up -d
   ```

4. **Verifique os serviços:**
   ```bash
   make ps
   docker compose logs -f api
   ```

5. **Acesse:**
   - Frontend: http://localhost
   - API healthcheck: http://localhost/health
   - MinIO Console: http://localhost:9001
   - pgAdmin (opcional): `make tools-up` → http://localhost:5050

## Usuário admin inicial

Após o primeiro `make up`, o banco é inicializado com um usuário admin:

- **Usuário**: `admin`
- **Senha**: `admin@hsfa2025`
- **IMPORTANTE**: troque imediatamente no primeiro login (`force_password_change = true`).

## Migração do Supabase

Para importar os dados do ambiente Supabase atual para o banco local:

1. **Adicione no `.env`:**
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<obter-em-Project-Settings-API>
   ```

2. **Execute a migração:**
   ```bash
   make migrate-from-supabase
   ```

   Isso executa, em sequência:
   - `01-export.ts` — exporta todas as tabelas para `./dump/*.json`
   - `02-import.ts` — importa no PostgreSQL local (idempotente)
   - `03-storage.ts` — baixa arquivos do Supabase Storage e envia ao MinIO
   - `04-validate.ts` — compara contagens entre Supabase e local

3. **Se quiser rodar passos individuais:**
   ```bash
   docker compose exec api tsx migrations-supabase/01-export.ts
   docker compose exec api tsx migrations-supabase/02-import.ts
   docker compose exec api tsx migrations-supabase/03-storage.ts
   docker compose exec api tsx migrations-supabase/04-validate.ts
   ```

## Comandos úteis

| Comando | Descrição |
|---|---|
| `make up` | Sobe o stack |
| `make down` | Derruba o stack |
| `make logs` | Segue logs de todos os serviços |
| `make db-shell` | Abre `psql` no container |
| `make db-dump` | Gera backup SQL em `./backups/` |
| `make db-restore FILE=backups/x.sql` | Restaura dump |
| `make db-reset` | **Destrutivo**: apaga volume e recria banco |
| `make tools-up` | Inclui pgAdmin |
| `make migrate-from-supabase` | Executa migração completa |
| `make clean` | Remove tudo (containers, volumes, imagens) |

## Produção

### Deploy em VPS

1. **No servidor:**
   ```bash
   git clone <repo>
   cd denuncias.hsfasaude.com.br
   cp .env.example .env
   # editar .env com senhas fortes e DOMINIO real
   ```

2. **Configurar TLS (Let's Encrypt):**
   ```bash
   sudo apt install certbot
   sudo certbot certonly --standalone -d denuncias.hsfasaude.com.br
   ```

3. **Ajustar nginx.conf para TLS:**
   - Adicionar bloco `listen 443 ssl;`
   - Apontar certs para `/etc/letsencrypt/live/denuncias.hsfasaude.com.br/`
   - Redirecionar :80 → :443

4. **Subir com overrides de produção:**
   ```bash
   make prod-up
   ```

5. **Verificar backups automáticos:**
   ```bash
   ls -la /var/backups/hsfa/
   ```

### Monitoramento mínimo

- **Healthchecks**: todos os containers têm healthcheck, verifique com `docker compose ps`
- **Logs**: `docker compose logs -f`
- **Uptime**: recomendado configurar UptimeRobot ou similar apontando para `/health`
- **Sentry** (opcional): adicionar variável `SENTRY_DSN` ao `.env`

## Estrutura de arquivos

```
.
├── docker-compose.yml              # dev stack
├── docker-compose.prod.yml         # overrides produção
├── Makefile                        # atalhos
├── .env.example                    # template de variáveis
├── docker/
│   ├── postgres/init/              # DDL + seeds
│   └── nginx/                      # Dockerfile + nginx.conf
├── backend/                        # API Fastify + Drizzle
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── server.ts
│   │   ├── config.ts
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   └── schema/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── denuncias.ts
│   │   │   ├── categorias.ts
│   │   │   ├── users.ts
│   │   │   ├── stats.ts
│   │   │   └── uploads.ts
│   │   ├── middleware/
│   │   └── services/
│   └── migrations-supabase/        # scripts de migração
└── src/                            # frontend React (já existente)
```

## Troubleshooting

**Postgres não inicia:**
- Verificar logs: `docker compose logs postgres`
- Problema comum: volume antigo incompatível → `make db-reset`

**API não conecta ao banco:**
- Verificar `DATABASE_URL` no `.env`
- Confirmar que `postgres` está healthy: `docker compose ps`

**MinIO "bucket does not exist":**
- O container `minio-init` cria o bucket automaticamente
- Verificar logs: `docker compose logs minio-init`

**Frontend /admin/login não carrega:**
- O nginx.conf tem `try_files ... /index.html` — deve funcionar
- Verificar se o build incluiu a rota catch-all no `App.tsx`

**Senha do admin esquecida:**
```bash
make db-shell
UPDATE users SET senha_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgyytlMGBwWvgdu'
 WHERE usuario = 'admin';
-- Senha: admin@hsfa2025
```
