DC        = docker compose
WEB       = $(DC) exec web
WEB_TEST  = $(DC) exec -e RAILS_ENV=test web
RAILS     = $(WEB) bin/rails
BUNDLE    = $(WEB) bundle exec
FE        = $(DC) exec frontend

.DEFAULT_GOAL := help

.PHONY: help build up down logs setup \
        db-create db-migrate db-seed db-reset \
        test rubocop rubocop-fix brakeman bundle-audit \
        console bash \
        fe-logs fe-bash fe-typecheck fe-test fe-test-watch fe-e2e \
        load-smoke load-test load-stress load-soak load

help: ## Lista todos os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ── Ambiente ──────────────────────────────────────────────────────────────────

.env: .env.example
	@cp .env.example .env
	@echo ""
	@echo "  .env criado a partir do .env.example"
	@echo "  Edite o arquivo se necessário antes de continuar."
	@echo ""

# ── Infraestrutura ────────────────────────────────────────────────────────────

build: ## Constrói as imagens Docker
	@$(DC) build

up: ## Sobe todos os serviços em background
	@$(DC) up -d

down: ## Para e remove os containers
	@$(DC) down

logs: ## Acompanha os logs de todos os serviços
	@$(DC) logs -f

setup: .env build up db-create db-migrate db-seed ## Configuração inicial completa (build + up + db)

# ── Banco de dados ────────────────────────────────────────────────────────────

db-create: ## Cria os bancos de dados
	@$(RAILS) db:create
	@$(WEB_TEST) bin/rails db:create

db-migrate: ## Roda as migrations pendentes
	@$(RAILS) db:migrate

db-seed: ## Popula o banco com dados iniciais
	@$(RAILS) db:seed

db-reset: ## Recria o banco (drop + create + migrate + seed)
	@$(RAILS) db:reset

# ── Testes e qualidade ────────────────────────────────────────────────────────

test: ## Roda todos os testes: backend (RSpec), frontend (Vitest) e E2E (Playwright)
	@$(WEB_TEST) bin/rails db:test:prepare
	@$(WEB_TEST) bundle exec rspec
	@$(FE) npm run test:run

rubocop: ## Verifica estilo de código com RuboCop
	@$(BUNDLE) rubocop

rubocop-fix: ## Corrige automaticamente as ofensas do RuboCop
	@$(BUNDLE) rubocop -a

brakeman: ## Análise de segurança estática com Brakeman
	@$(BUNDLE) brakeman -q

bundle-audit: ## Verifica vulnerabilidades nas dependências
	@$(BUNDLE) bundler-audit check --update

# ── Utilitários ───────────────────────────────────────────────────────────────

console: ## Abre o Rails console no container web
	@$(RAILS) console

bash: ## Abre um shell bash no container web
	@$(WEB) bash

# ── Frontend ──────────────────────────────────────────────────────────────────

fe-logs: ## Acompanha os logs do serviço frontend
	@$(DC) logs -f frontend

fe-bash: ## Abre um shell no container frontend
	@$(FE) sh

fe-typecheck: ## Roda verificação de tipos TypeScript no frontend
	@$(FE) npm run type-check

fe-test: ## Roda os testes unitários do frontend (execução única)
	@$(FE) npm run test:run

fe-test-watch: ## Roda os testes do frontend em modo watch
	@$(DC) exec -it frontend npm test

fe-e2e: ## Roda os testes E2E com Playwright (requer `make up`)
	@$(DC) --profile e2e run --rm e2e sh -c "npm install && npx playwright test"

# ── Testes de carga ───────────────────────────────────────────────────────────

LOAD_DC = $(DC) -f docker-compose.yml -f docker-compose.load-test.yml

load-smoke: ## Smoke test: 2 VUs por 60s — sanidade básica (requer `make up`)
	@$(LOAD_DC) run --rm k6 run /scripts/smoke.js

load-test: ## Load test: 50 VUs por 5min — carga típica (requer `make up`)
	@$(LOAD_DC) run --rm k6 run /scripts/load.js

load-stress: ## Stress test: ramp-up 0→200 VUs por 9min — ponto de ruptura (requer `make up`)
	@$(LOAD_DC) run --rm k6 run /scripts/stress.js

load-soak: ## Soak test: 30 VUs por 30min — resistência e memory leaks (requer `make up`)
	@$(LOAD_DC) run --rm k6 run /scripts/soak.js

load: load-smoke load-test load-stress load-soak ## Roda todos os testes de carga em sequência: smoke → load → stress → soak (requer `make up`)
