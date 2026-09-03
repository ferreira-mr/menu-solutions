import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';

const authFile = 'tests/e2e/.auth/user.json';
const nif = process.env.E2E_NIF || '22222222222';
const password = process.env.E2E_PASSWORD || 'password';

setup('prepara sessão autenticada', async ({ page, request }) => {
  const response = await request.post('/api/login', {
    data: { nif, password },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.token).toBeTruthy();
  expect(payload.user).toBeTruthy();

  await page.goto('/');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userLevel', String(user.nivel_user));
  }, { token: payload.token, user: payload.user });

  fs.mkdirSync('tests/e2e/.auth', { recursive: true });
  await page.context().storageState({ path: authFile });
});
