import { sleep } from 'k6';
import { register } from './helpers/auth.js';
import { listNotes, createNote, searchNotes, deleteNote, updateNote } from './helpers/notes.js';

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus: 30,
      duration: '30m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.005'],
  },
};

let state = null;
// Mantém um pool limitado de notas para evitar crescimento ilimitado no banco
const noteIds = [];
const MAX_NOTES = 5;

export default function () {
  if (!state) {
    state = register(BASE_URL);
    if (!state) return;
  }

  // Distribui operações por iteração: 60% leitura, 20% escrita, 20% busca/atualização
  const roll = __ITER % 5;

  switch (roll) {
    case 0:
    case 1:
    case 2:
      listNotes(BASE_URL, state.accessToken);
      break;

    case 3: {
      const note = createNote(BASE_URL, state.accessToken);
      if (note) {
        noteIds.push(note.id);
        // Remove o mais antigo quando ultrapassa o limite
        if (noteIds.length > MAX_NOTES) {
          const old = noteIds.shift();
          deleteNote(BASE_URL, state.accessToken, old);
        }
      }
      break;
    }

    case 4:
      searchNotes(BASE_URL, state.accessToken, 'load');
      if (noteIds.length > 0) {
        updateNote(BASE_URL, state.accessToken, noteIds[0]);
      }
      break;
  }

  sleep(1);
}
