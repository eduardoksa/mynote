import { sleep } from 'k6';
import { register, login, logout } from './helpers/auth.js';
import { listNotes, createNote, getNote, updateNote, deleteNote, searchNotes } from './helpers/notes.js';

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    // 10 VUs simulando ciclo completo de auth (login → uso → logout)
    auth_flow: {
      executor: 'constant-vus',
      exec: 'authFlow',
      vus: 10,
      duration: '5m',
    },
    // 30 VUs fazendo CRUD de notas (sessão mantida por VU)
    notes_crud: {
      executor: 'constant-vus',
      exec: 'notesCrud',
      vus: 30,
      duration: '5m',
    },
    // 10 VUs com mix aleatório de operações (simula uso real)
    mixed_flow: {
      executor: 'constant-vus',
      exec: 'mixedFlow',
      vus: 10,
      duration: '5m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<600'],
    http_req_failed: ['rate<0.01'],
  },
};

// Per-VU state — cada VU registra seu próprio usuário na primeira iteração
let state = null;

function init() {
  if (!state) state = register(BASE_URL);
  return state;
}

export function authFlow() {
  const s = init();
  if (!s) return;

  const tokens = login(BASE_URL, s.email, s.password);
  if (!tokens) return;
  listNotes(BASE_URL, tokens.accessToken);
  logout(BASE_URL, tokens.accessToken, tokens.refreshToken);
  sleep(1);
}

export function notesCrud() {
  const s = init();
  if (!s) return;

  const created = [];
  for (let i = 0; i < 3; i++) {
    const note = createNote(BASE_URL, s.accessToken);
    if (note) created.push(note.id);
  }

  listNotes(BASE_URL, s.accessToken);
  searchNotes(BASE_URL, s.accessToken, 'notes');

  if (created.length > 0) {
    getNote(BASE_URL, s.accessToken, created[0]);
    updateNote(BASE_URL, s.accessToken, created[0]);
  }

  for (const id of created) {
    deleteNote(BASE_URL, s.accessToken, id);
  }

  sleep(1);
}

const MIXED_OPS = [
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => { const n = createNote(BASE_URL, s.accessToken); if (n) deleteNote(BASE_URL, s.accessToken, n.id); },
  (s) => { const n = createNote(BASE_URL, s.accessToken); if (n) deleteNote(BASE_URL, s.accessToken, n.id); },
  (s) => { const n = createNote(BASE_URL, s.accessToken); if (n) deleteNote(BASE_URL, s.accessToken, n.id); },
  (s) => searchNotes(BASE_URL, s.accessToken, 'meeting'),
  (s) => searchNotes(BASE_URL, s.accessToken, 'review'),
  (s) => { const t = login(BASE_URL, s.email, s.password); if (t) logout(BASE_URL, t.accessToken, t.refreshToken); },
];

export function mixedFlow() {
  const s = init();
  if (!s) return;

  MIXED_OPS[Math.floor(Math.random() * MIXED_OPS.length)](s);
  sleep(0.5);
}
