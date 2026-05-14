import { sleep } from 'k6';
import { register } from './helpers/auth.js';
import { listNotes, createNote, searchNotes, deleteNote } from './helpers/notes.js';

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // aquecimento gradual
        { duration: '3m', target: 100 },  // carga moderada
        { duration: '2m', target: 200 },  // pico — ponto de ruptura
        { duration: '2m', target: 0 },    // resfriamento
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

let state = null;

const OPS = [
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => listNotes(BASE_URL, s.accessToken),
  (s) => { const n = createNote(BASE_URL, s.accessToken); if (n) deleteNote(BASE_URL, s.accessToken, n.id); },
  (s) => searchNotes(BASE_URL, s.accessToken, 'test'),
];

export default function () {
  if (!state) {
    state = register(BASE_URL);
    if (!state) return;
  }

  OPS[Math.floor(Math.random() * OPS.length)](state);
  sleep(0.5);
}
