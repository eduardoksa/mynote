# MyNote — Frontend

Interface web em Vue 3 para gerenciamento de notas pessoais.

## Stack

- **Vue 3** + Composition API
- **Vite** — build e dev server
- **TypeScript**
- **Pinia** — gerenciamento de estado
- **Vue Router** — roteamento com guards de autenticação
- **Vue i18n** — internacionalização (pt-BR)
- **Vitest** + **@vue/test-utils** — testes unitários

## Desenvolvimento

Via Docker (recomendado, já inclui o backend):

```bash
make up         # sobe todos os serviços
make fe-logs    # acompanha logs do frontend
```

Local (requer Node.js LTS):

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

## Testes

```bash
make fe-test        # execução única (CI)
make fe-test-watch  # modo watch

# ou localmente:
npm run test:run
npm test
```

## Type check

```bash
make fe-typecheck

# ou localmente:
npm run type-check
```

## Estrutura de pastas

```
src/
├── api/          # cliente HTTP (axios) e interceptores
├── components/   # componentes reutilizáveis (AppInput, AppButton, etc.)
├── composables/  # lógica reutilizável (useForm, useDebounce)
├── locales/      # traduções (pt-BR.json)
├── router/       # definição de rotas e guards
├── stores/       # stores Pinia (auth, notes)
├── types/        # interfaces e tipos TypeScript
├── views/        # páginas da aplicação
│   ├── auth/     # Login, Register, ForgotPassword, ResetPassword
│   └── notes/    # NotesListView, NoteNewView, NoteEditView
└── tests/        # configuração global de testes
```
