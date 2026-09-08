import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import { authState } from './auth-paths.js';

const password = process.env.E2E_PASSWORD || 'password';

const accounts = [
  { file: authState('user'), nif: '22222222222', role: 'Nutricionista Padrão' },
  { file: authState('nutri'), nif: '22222222222', role: 'Nutricionista' },
  { file: authState('inspetora'), nif: '11111111111', role: 'Inspetora' },
  { file: authState('diretora'), nif: '33333333333', role: 'Diretora' },
];

accounts.forEach(({ file, nif, role }) => {
  setup(`prepara sessão autenticada para ${role} (${nif})`, async ({ page, request }) => {
    const response = await request.post('/api/login', {
      data: { nif, password },
    });
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.token).toBeTruthy();
    expect(payload.user).toBeTruthy();

    await page.goto('/');
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userLevel', String(user.nivel_user));
      },
      { token: payload.token, user: payload.user }
    );

    fs.mkdirSync(process.env.E2E_AUTH_DIR, { recursive: true });
    await page.context().storageState({ path: file });
  });
});
