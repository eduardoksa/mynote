import http from 'k6/http';
import { check } from 'k6';
import { authHeaders } from './auth.js';

const WORD_POOL = [
  'Meeting', 'Ideas', 'Shopping', 'Project', 'Weekly',
  'Learning', 'Review', 'Tasks', 'Feedback', 'Plans',
  'Notes', 'Goals', 'Summary', 'Research', 'Draft',
];

function randomTitle() {
  const a = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
  const b = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
  return `${a} ${b} ${__VU}`;
}

export function createNote(baseUrl, accessToken) {
  const res = http.post(
    `${baseUrl}/api/v1/notes`,
    JSON.stringify({ note: { title: randomTitle(), content: 'Load test content.' } }),
    { headers: authHeaders(accessToken) }
  );

  check(res, { 'create note: 201': (r) => r.status === 201 });
  if (res.status !== 201) return null;
  return res.json().note;
}

export function listNotes(baseUrl, accessToken, page = 1) {
  const res = http.get(`${baseUrl}/api/v1/notes?page=${page}`, {
    headers: authHeaders(accessToken),
  });

  check(res, { 'list notes: 200': (r) => r.status === 200 });
  if (res.status !== 200) return null;
  return res.json();
}

export function getNote(baseUrl, accessToken, id) {
  const res = http.get(`${baseUrl}/api/v1/notes/${id}`, {
    headers: authHeaders(accessToken),
  });

  check(res, { 'get note: 200': (r) => r.status === 200 });
  if (res.status !== 200) return null;
  return res.json().note;
}

export function updateNote(baseUrl, accessToken, id) {
  const res = http.patch(
    `${baseUrl}/api/v1/notes/${id}`,
    JSON.stringify({ note: { title: randomTitle(), content: 'Updated by load test.' } }),
    { headers: authHeaders(accessToken) }
  );

  check(res, { 'update note: 200': (r) => r.status === 200 });
  if (res.status !== 200) return null;
  return res.json().note;
}

export function deleteNote(baseUrl, accessToken, id) {
  const res = http.del(`${baseUrl}/api/v1/notes/${id}`, null, {
    headers: authHeaders(accessToken),
  });

  check(res, { 'delete note: 204': (r) => r.status === 204 });
}

export function searchNotes(baseUrl, accessToken, query) {
  const res = http.get(
    `${baseUrl}/api/v1/notes?q=${encodeURIComponent(query)}`,
    { headers: authHeaders(accessToken) }
  );

  check(res, { 'search notes: 200': (r) => r.status === 200 });
  if (res.status !== 200) return null;
  return res.json();
}
