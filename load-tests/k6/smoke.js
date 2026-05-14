import { sleep } from 'k6';
import { register } from './helpers/auth.js';
import { listNotes, createNote, searchNotes, deleteNote } from './helpers/notes.js';

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    auth_smoke: {
      executor: 'constant-vus',
      exec: 'authFlow',
      vus: 2,
      duration: '60s',
    },
    notes_smoke: {
      executor: 'constant-vus',
      exec: 'notesFlow',
      vus: 2,
      duration: '60s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

// Per-VU state — persists across iterations for the same VU instance
let state = null;

function init() {
  if (!state) state = register(BASE_URL);
  return state;
}

export function authFlow() {
  const s = init();
  if (!s) return;
  listNotes(BASE_URL, s.accessToken);
  sleep(1);
}

export function notesFlow() {
  const s = init();
  if (!s) return;
  const note = createNote(BASE_URL, s.accessToken);
  listNotes(BASE_URL, s.accessToken);
  searchNotes(BASE_URL, s.accessToken, 'load');
  if (note) deleteNote(BASE_URL, s.accessToken, note.id);
  sleep(1);
}
