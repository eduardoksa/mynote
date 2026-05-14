import http from 'k6/http';
import { check } from 'k6';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function uniqueId() {
  return `${__VU}${__ITER}${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
}

export function register(baseUrl) {
  const id = uniqueId();
  const email = `lt_${id}@load.test`;
  const password = 'LoadTest@1';

  const res = http.post(
    `${baseUrl}/api/v1/auth/register`,
    JSON.stringify({
      user: { name: `LT User ${__VU}`, email, password, password_confirmation: password },
    }),
    { headers: JSON_HEADERS }
  );

  check(res, { 'register: 201': (r) => r.status === 201 });
  if (res.status !== 201) return null;

  const body = res.json();
  return { email, password, accessToken: body.access_token, refreshToken: body.refresh_token };
}

export function login(baseUrl, email, password) {
  const res = http.post(
    `${baseUrl}/api/v1/auth/login`,
    JSON.stringify({ user: { email, password } }),
    { headers: JSON_HEADERS }
  );

  check(res, { 'login: 200': (r) => r.status === 200 });
  if (res.status !== 200) return null;

  const body = res.json();
  return { accessToken: body.access_token, refreshToken: body.refresh_token };
}

export function logout(baseUrl, accessToken, refreshToken) {
  const res = http.del(
    `${baseUrl}/api/v1/auth/logout`,
    JSON.stringify({ refresh_token: refreshToken }),
    { headers: { ...JSON_HEADERS, Authorization: `Bearer ${accessToken}` } }
  );

  check(res, { 'logout: 204': (r) => r.status === 204 });
}

export function refresh(baseUrl, refreshToken) {
  const res = http.post(
    `${baseUrl}/api/v1/auth/refresh`,
    JSON.stringify({ refresh_token: refreshToken }),
    { headers: JSON_HEADERS }
  );

  check(res, { 'refresh: 200': (r) => r.status === 200 });
  if (res.status !== 200) return null;

  const body = res.json();
  return { accessToken: body.access_token, refreshToken: body.refresh_token };
}

export function authHeaders(accessToken) {
  return { ...JSON_HEADERS, Authorization: `Bearer ${accessToken}` };
}
