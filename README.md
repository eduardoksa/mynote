# MyNote

Aplicação full-stack de notas pessoais com autenticação JWT.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Ruby 4.0 / Rails 8.1 (API only) |
| Frontend | Vue 3 + Vite + TypeScript |
| Banco de dados | PostgreSQL 18 |
| Cache / Filas | Redis 7 (Solid Queue) |
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
make up            # sobe todos os serviços em background
make down          # para e remove os containers
make logs          # acompanha logs em tempo real
make test          # roda backend (RSpec) + frontend (Vitest)
make rubocop       # lint de código Ruby
make brakeman      # análise de segurança estática
make bundle-audit  # verifica vulnerabilidades de dependências
make console       # Rails console
make bash          # shell no container web
make fe-test       # testes do frontend (execução única)
make fe-typecheck  # verificação de tipos TypeScript
```

## CI

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

O pipeline roda automaticamente em push e pull requests para `main`, executando testes, lint e análise de segurança de ambas as camadas.

## Documentação por camada

- [Backend](backend/README.md) — API REST, endpoints, autenticação e variáveis de ambiente
- [Frontend](frontend/README.md) — Vue 3, estrutura de pastas e comandos de desenvolvimento
