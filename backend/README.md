# MyNote — Backend

API REST em Rails 8.1 para gerenciamento de notas pessoais com autenticação JWT.

## Stack

- Ruby 3.x / Rails 8.1 (API only)
- PostgreSQL 18
- Redis 7 (filas via Solid Queue)
- Autenticação: JWT (access token) + Refresh Token (armazenado em banco)

## Pré-requisitos

- Docker e Docker Compose

## Setup inicial

```bash
cp .env.example .env   # na raiz do projeto
make setup             # build + up + db:create + migrate + seed
```

## Comandos disponíveis

```bash
make up            # sobe todos os serviços
make down          # para os containers
make logs          # acompanha logs em tempo real
make test          # roda backend (RSpec) + frontend (Vitest)
make rubocop       # lint de código
make brakeman      # análise de segurança estática
make bundle-audit  # verifica vulnerabilidades de dependências
make console       # Rails console
make bash          # shell no container web
```

## Variáveis de ambiente

| Variável            | Descrição                          | Exemplo                                |
|---------------------|------------------------------------|----------------------------------------|
| `POSTGRES_PASSWORD` | Senha do PostgreSQL                | `changeme`                             |
| `DATABASE_URL`      | URL de conexão com o banco         | `postgres://postgres:changeme@db:5432` |
| `REDIS_URL`         | URL do Redis                       | `redis://redis:6379/0`                 |
| `RAILS_MASTER_KEY`  | Chave mestra do Rails (produção)   | conteúdo de `config/master.key`        |
| `CORS_ORIGINS`      | Origens permitidas pelo CORS       | `http://localhost:5173`                |
| `PORT`              | Porta do servidor Puma             | `3000`                                 |
| `RAILS_MAX_THREADS` | Threads do Puma/conexões do pool   | `3`                                    |

## API

Base URL: `/api/v1`

### Autenticação

Endpoints públicos (não requerem token):

| Método | Endpoint                      | Descrição                              |
|--------|-------------------------------|----------------------------------------|
| POST   | `/auth/register`              | Cadastro de usuário                    |
| POST   | `/auth/login`                 | Login — retorna access + refresh token |
| POST   | `/auth/refresh`               | Renova o access token                  |
| POST   | `/auth/password-reset`        | Solicita reset de senha por email      |
| PATCH  | `/auth/password-reset/:token` | Confirma o reset de senha              |

Endpoints autenticados (requer `Authorization: Bearer <access_token>`):

| Método | Endpoint       | Descrição                  |
|--------|----------------|----------------------------|
| DELETE | `/auth/logout` | Revoga o refresh token     |

### Notas

Todos os endpoints requerem `Authorization: Bearer <access_token>`.

| Método | Endpoint      | Descrição                                 |
|--------|---------------|-------------------------------------------|
| GET    | `/notes`      | Lista notas paginadas (`?page=1&q=busca`) |
| POST   | `/notes`      | Cria uma nota                             |
| GET    | `/notes/:id`  | Retorna uma nota                          |
| PATCH  | `/notes/:id`  | Atualiza uma nota                         |
| DELETE | `/notes/:id`  | Remove uma nota                           |

#### Paginação

`GET /api/v1/notes` retorna:

```json
{
  "notes": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_count": 42,
    "total_pages": 5,
    "next_page": 2,
    "prev_page": null
  }
}
```

### Formato de erros

Erros de validação:
```json
{ "errors": ["Title can't be blank", "Title is too long"] }
```

Erros de autenticação/negócio:
```json
{ "error": "Email ou senha inválidos" }
```

### Fluxo de autenticação

1. `POST /auth/register` ou `POST /auth/login` → recebe `access_token` (JWT, 1h) e `refresh_token` (opaco, 30 dias)
2. Inclui `Authorization: Bearer <access_token>` em todas as requisições autenticadas
3. Quando o access token expirar, usa `POST /auth/refresh` com o `refresh_token` para obter um novo
4. `DELETE /auth/logout` revoga o refresh token no banco

## Documentação da API

O spec OpenAPI 3.0 está em [`openapi.yaml`](openapi.yaml). Você pode visualizá-lo no [Swagger Editor](https://editor.swagger.io/) (File → Import file) ou em qualquer cliente que suporte OpenAPI.

## Rodando os testes

```bash
make test
# ou somente backend:
docker compose exec -e RAILS_ENV=test web bundle exec rspec
```
