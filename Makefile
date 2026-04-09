# ============================================================
# Canal de Denúncias HSFA - Makefile
# ============================================================

.DEFAULT_GOAL := help
SHELL := /bin/bash

ENV_FILE ?= .env

# Carrega variáveis do .env para os targets
-include $(ENV_FILE)
export

.PHONY: help
help: ## Exibe esta ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

# ---------- Stack ----------
.PHONY: up down restart build logs ps
up: ## Sobe todos os serviços em background
	docker compose up -d

down: ## Derruba o stack
	docker compose down

restart: down up ## Reinicia o stack

build: ## Build das imagens
	docker compose build

logs: ## Segue os logs de todos os serviços
	docker compose logs -f

ps: ## Lista containers
	docker compose ps

# ---------- Ferramentas (pgadmin etc) ----------
.PHONY: tools-up
tools-up: ## Sobe stack + pgAdmin
	docker compose --profile tools up -d

# ---------- Banco de dados ----------
.PHONY: db-shell db-dump db-restore db-reset
db-shell: ## Abre psql no container postgres
	docker compose exec postgres psql -U $(DB_USER) -d $(DB_NAME)

db-dump: ## Gera dump do banco local
	@mkdir -p backups
	docker compose exec -T postgres pg_dump -U $(DB_USER) -d $(DB_NAME) > backups/dump-$$(date +%Y%m%d-%H%M%S).sql
	@echo "✓ Dump salvo em backups/"

db-restore: ## Restaura dump (usar: make db-restore FILE=backups/xxx.sql)
	@test -n "$(FILE)" || (echo "❌ Informe FILE=caminho/do/dump.sql" && exit 1)
	docker compose exec -T postgres psql -U $(DB_USER) -d $(DB_NAME) < $(FILE)

db-reset: ## PERIGO: apaga o volume do postgres e reinicializa
	@echo "⚠  Isso apagará TODOS os dados do banco local. Ctrl+C para cancelar."
	@sleep 5
	docker compose down -v
	docker compose up -d postgres

# ---------- Migração Supabase ----------
.PHONY: migrate-from-supabase migrate-dry
migrate-from-supabase: ## Executa migração completa Supabase → local
	@test -n "$(SUPABASE_URL)" || (echo "❌ SUPABASE_URL não definida no .env" && exit 1)
	docker compose exec api npm run migrate:supabase

# ---------- Frontend dev ----------
.PHONY: dev-web dev-api
dev-web: ## Roda Vite em modo dev (sem container)
	npm run dev

dev-api: ## Roda API em modo dev (sem container)
	cd backend && npm run dev

# ---------- Limpeza ----------
.PHONY: clean
clean: ## Remove containers, volumes e imagens do projeto
	docker compose down -v --rmi local --remove-orphans

# ---------- Produção ----------
.PHONY: prod-up prod-down prod-deploy
prod-up: ## Sobe stack de produção
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down

prod-deploy: ## Pull + build + restart em produção
	git pull
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
