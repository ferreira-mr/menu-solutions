import { test, expect } from '@playwright/test';
import { authState } from './auth-paths.js';

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test.describe('Privacidade das fotos de alunos', () => {
  test.use({ storageState: authState('nutri') });

  test('vincula foto, bloqueia acesso público e usa object URL autenticada após recarregar', async ({ page }) => {
    await page.goto('/');
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const headers = { Authorization: `Bearer ${token}` };
    const turmaResponse = await page.request.get('/api/turmas?limit=1', { headers });
    expect(turmaResponse.ok()).toBeTruthy();
    const turma = (await turmaResponse.json()).data[0];

    const studentName = `Aluno Foto E2E ${Date.now()}`;
    const studentResponse = await page.request.post('/api/alunos', {
      headers,
      data: {
        nome: studentName,
        genero: 'Feminino',
        descricao: 'Foto protegida',
        turmas_id: turma.id,
        data_nascimento: '2018-01-01',
        rm: `FOTO-${Date.now()}`,
      },
    });
    expect(studentResponse.ok()).toBeTruthy();
    const student = (await studentResponse.json()).data;

    const uploadResponse = await page.request.post(`/api/alunos/${student.id}/foto`, {
      headers,
      multipart: {
        file: { name: 'aluno.png', mimeType: 'image/png', buffer: onePixelPng },
      },
    });
    expect(uploadResponse.ok()).toBeTruthy();
    const uploaded = (await uploadResponse.json()).data;

    const unauthenticatedPhoto = await page.request.get(`/api/alunos/${student.id}/foto`);
    expect(unauthenticatedPhoto.status()).toBe(401);

    const authenticatedPhoto = await page.request.get(`/api/alunos/${student.id}/foto`, { headers });
    expect(authenticatedPhoto.ok()).toBeTruthy();
    expect((await authenticatedPhoto.body()).byteLength).toBeGreaterThan(0);

    const oldPublicPhoto = await page.request.get(`/uploads/${uploaded.foto}`);
    expect(oldPublicPhoto.ok()).toBeFalsy();

    await page.goto('/nutri/planejamento');
    const photo = page.locator(`img.card-photo[alt="${studentName}"]`);
    await expect(photo).toHaveAttribute('src', /^blob:/);

    await page.reload();
    await expect(photo).toHaveAttribute('src', /^blob:/);
  });
});
