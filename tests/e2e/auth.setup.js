import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import { authState } from './auth-paths.js';

const passwordOverride = process.env.E2E_PASSWORD;

const accounts = [
  { file: authState('user'), nif: 'nutricionista', password: 'nutricionista', role: 'Nutricionista Padrão' },
  { file: authState('nutri'), nif: 'nutricionista', password: 'nutricionista', role: 'Nutricionista' },
  { file: authState('inspetora'), nif: 'inspetora', password: 'inspetora', role: 'Inspetora' },
  { file: authState('diretora'), nif: 'diretora', password: 'diretora', role: 'Diretora' },
];

accounts.forEach(({ file, nif, password, role }) => {
  setup(`prepara sessão autenticada para ${role} (${nif})`, async ({ page, request }) => {
    const response = await request.post('/api/login', {
      data: { nif, password: passwordOverride || password },
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
