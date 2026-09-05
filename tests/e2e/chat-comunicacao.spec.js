import { test, expect } from '@playwright/test';

test.describe.serial('Fluxos E2E - Chat e Comunicação', () => {
  test.use({ storageState: 'tests/e2e/.auth/inspetora.json' });

  test('acessa chat da equipe e visualiza interface de mensagens', async ({ page }) => {
    await page.goto('/inspetora/chat');
    await expect(page).toHaveURL(/\/inspetora\/chat$/);
    await expect(page.getByText(/Chat Geral da Equipe/i).first()).toBeVisible();
    await expect(page.locator('input.chat-input')).toBeVisible();
    await expect(page.locator('button.btn-send')).toBeVisible();
  });

  test('permite digitar e enviar uma nova mensagem no chat', async ({ page }) => {
    const userPromise = page.waitForResponse(resp => resp.url().includes('/api/user') && resp.status() === 200);
    await page.goto('/inspetora/chat');
    await userPromise;
    await expect(page.getByText(/Chat Geral da Equipe/i).first()).toBeVisible();
    
    const input = page.locator('input.chat-input');
    const sendButton = page.locator('button.btn-send');

    const testMessage = `Mensagem Teste E2E ${Date.now()}`;
    await input.fill(testMessage);
    await sendButton.click();

    await expect(page.getByText(testMessage).first()).toBeVisible({ timeout: 10000 });
  });
});
