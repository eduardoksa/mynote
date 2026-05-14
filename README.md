# MyNote

Aplicação full-stack de notas pessoais

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Ruby 4.0 / Rails 8.1 (API only) |
| Frontend | Vue 3 + Vite + TypeScript |
| State management | Pinia |
| i18n | Vue i18n (pt-BR padrão + en) |
| Banco de dados | PostgreSQL 18 |
| Cache / Filas | Redis 7 (Solid Queue) |
| Rate limiting | Rack::Attack |
| Testes backend | RSpec |
| Testes frontend | Vitest (unit) + Playwright (E2E) |
| Testes de carga | K6 (Grafana) |
| Infra | Docker + Docker Compose |

## Pré-requisitos

- Docker e Docker Compose

## Quick start

```bash
cp .env.example .env   # ajuste as variáveis se necessário
make setup             # build + up + db:create + migrate + seed
```

A API fica disponível em `http://localhost:3000` e o frontend em `http://localhost:5173`.

## Comandos

```bash
# Infraestrutura
make up            # sobe todos os serviços em background
make down          # para e remove os containers
make logs          # acompanha logs em tempo real

# Banco de dados
make db-create     # cria os bancos (dev + test)
make db-migrate    # roda migrations pendentes
make db-seed       # popula com dados iniciais
make db-reset      # drop + create + migrate + seed

# Testes e qualidade
make test          # roda backend (RSpec) + frontend (Vitest)
make rubocop       # lint de código Ruby
make rubocop-fix   # corrige automaticamente as ofensas do RuboCop
make brakeman      # análise de segurança estática
make bundle-audit  # verifica vulnerabilidades de dependências

# Utilitários
make console       # Rails console
make bash          # shell no container web

# Frontend
make fe-test       # testes unitários (execução única)
make fe-test-watch # testes em modo watch
make fe-typecheck  # verificação de tipos TypeScript
make fe-e2e        # testes E2E com Playwright (requer make up)

# Testes de carga (requer make up)
make load          # todos os cenários em sequência
make load-smoke    # 2 VUs / 60s — sanidade básica
make load-test     # 50 VUs / 5min — carga típica
make load-stress   # ramp-up 0→200 VUs / 9min — ponto de ruptura
make load-soak     # 30 VUs / 30min — resistência e memory leaks
```

## CI

[![CI](https://github.com/eduardoksa/mynote/actions/workflows/ci.yml/badge.svg)](https://github.com/eduardoksa/mynote/actions/workflows/ci.yml)

O pipeline roda automaticamente em push e pull requests para `main`, executando testes, lint e análise de segurança de ambas as camadas.

## Decisões técnicas

Esta seção registra as principais escolhas arquiteturais, para deixar explícito o racional por trás do que foi construído.

### Rails API-only

- Separação clara de responsabilidades; o backend vira um contrato estável que pode ser consumido por qualquer cliente (web, mobile, CLI).

### Autenticação JWT + Refresh Token

- Stateless por design; escalabilidade horizontal sem precisar de session store compartilhada entre instâncias.

### Armazenamento de tokens no cliente

- **Access token** vive apenas em memória JavaScript (nunca persiste em storage); se a aba fechar, some — elimina risco de XSS roubar o token.
- **Refresh token** fica em `localStorage` para sobreviver a reloads; tradeoff consciente mitigado por CSP.
- **No banco**, o refresh token é gravado como digest SHA-256 — o valor bruto nunca toca o banco, mesmo que haja SQL injection.

### Fila de refresh em 401 paralelos

- Se múltiplas requisições expiram ao mesmo tempo, todas fazem fila e aguardam **um único** pedido de refresh, depois reenviam em paralelo.
- Evita thundering herd de `POST /auth/refresh` que causaria race condition e invalidaria tokens válidos.

### Sincronização de logout multi-tab

- Um logout em qualquer aba dispara `window.storage` event nas demais, que limpam o estado de autenticação imediatamente.
- Sem isso, abas abertas continuariam exibindo conteúdo autenticado após logout — inconsistência visível ao usuário.

### Rate limiting por camada (Rack::Attack)

| Alvo | Limite |
|------|--------|
| Login por IP | 5 tentativas / 20 s |
| Login por e-mail | 10 tentativas / hora |
| Registro por IP | 10 tentativas / hora |
| Reset de senha por IP | 5 tentativas / hora |
| Global por IP | 300 req / 5 min |

- IPs privados e loopback são isentos para não bloquear testes de integração.
- Respostas bloqueadas retornam HTTP 429 com header `Retry-After`.

### Rotação de refresh token (uso único)

- A cada chamada a `POST /auth/refresh`, o token anterior é **revogado** e um novo é emitido.
- Se um atacante roubar o refresh token e usá-lo primeiro, o próximo refresh legítimo do usuário falha — a rotação funciona como sensor de roubo. Sem rotação, um token roubado seria válido por 30 dias sem qualquer alarme.

### Prevenção de enumeração de usuários

- **Login:** retorna a mesma mensagem genérica (`invalid_credentials`) seja qual for a causa — e-mail inexistente ou senha errada.
- **Reset de senha:** sempre responde HTTP 200, independente de o e-mail estar cadastrado ou não.
- Respostas distintas permitiriam a um atacante confirmar quais e-mails existem na base sem precisar de senha.

### Segurança do fluxo de reset de senha

- O token de reset é **derivado do `password_digest` atual** via `generates_token_for` — trocar a senha invalida todos os links de reset pendentes imediatamente.
- TTL agressivo: **15 minutos**.
- Ao concluir o reset, todos os refresh tokens do usuário em todos os dispositivos são revogados (`update_all(revoked: true)`), forçando re-login universal.

### Content Security Policy em modo enforce

- Política aplicada: `default_src :none`, `script_src :self`, `connect_src :self`, `frame_ancestors :none`.
- `frame_ancestors :none` bloqueia clickjacking — a app não pode ser embutida em nenhum iframe.
- Modo **enforce** (`content_security_policy_report_only = false`): violações são bloqueadas ativamente, não apenas logadas.
- Reforça a mitigação de XSS para o refresh token em `localStorage`; sem CSP efetiva, scripts injetados poderiam ler o storage.

### HTTPS e validação de host em produção

- `config.force_ssl = true` redireciona HTTP → HTTPS e envia o header `Strict-Transport-Security` automaticamente.
- `config.assume_ssl = true` confia no `X-Forwarded-Proto` do reverse proxy (Nginx/Caddy), evitando loop de redirect.
- `config.hosts` restrito via variável `ALLOWED_HOST` — qualquer request com Host header diferente é rejeitado com 403.
- Previne ataques de DNS rebinding e Host header injection; sem isso, um atacante pode forjar o host para gerar links maliciosos (password reset, por exemplo).

### Filtragem de dados sensíveis nos logs

- Parâmetros contendo `:passw`, `:email`, `:secret`, `:token`, `:_key`, `:crypt`, `:salt` e similares são substituídos por `[FILTERED]` nos logs de request.
- Atributos `:token` e `:password_digest` também são mascarados nas queries SQL do verbose log.
- Logs são acessados por mais pessoas e sistemas que o banco de dados; vazar tokens nos logs anularia a proteção do digest no banco.

### Fila com Solid Queue

- Nativo do Rails 8; sem gem extra, sem adapter, integração direta com Active Record e sem dependência de thread pool separado.

### PostgreSQL 18

- Versão mais recente com melhorias de performance, melhor suporte a JSON e novos tipos de dados nativos.

### Versionamento de API (`/api/v1`)

- Permite evoluir a API sem quebrar contratos com clientes existentes; boa prática desde o início evita refatoração dolorosa depois.

## Estratégia de testes

| Ferramenta | Escopo |
|-----------|--------|
| RSpec | Modelos, controllers, serviços — backend |
| Vitest | Componentes Vue, composables, stores — frontend |
| Playwright | Fluxos completos ponta a ponta (login, CRUD de notas, logout) |
| K6 | Carga, stress, soak e smoke — performance e estabilidade da API |

## Documentação por camada

- [Backend](backend/README.md) — API REST, endpoints, autenticação e variáveis de ambiente
- [Frontend](frontend/README.md) — Vue 3, estrutura de pastas e comandos de desenvolvimento
