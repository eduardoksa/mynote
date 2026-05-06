import { test, expect, type Page } from '@playwright/test'

const uniqueEmail = () => `e2e+notes+${Date.now()}@example.com`

async function loginAs(page: Page, email: string, password = 'Senha1234!') {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/notes')
}

test.describe('CRUD de notas', () => {
  let testEmail: string

  test.beforeAll(async ({ browser }) => {
    testEmail = uniqueEmail()
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/register')
    await page.locator('input[type="text"]').fill('Usuário Notas')
    await page.locator('input[type="email"]').fill(testEmail)
    await page.locator('input[type="password"]').first().fill('Senha1234!')
    await page.locator('input[type="password"]').last().fill('Senha1234!')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL('/notes')
    await context.close()
  })

  test('criar nota — aparece na lista', async ({ page }) => {
    await loginAs(page, testEmail)
    await page.getByRole('link', { name: 'Nova nota' }).click()
    await expect(page).toHaveURL('/notes/new')
    await page.getByPlaceholder('Título da nota').fill('Minha primeira nota E2E')
    await page.getByPlaceholder('Escreva sua nota aqui...').fill('Conteúdo da nota de teste.')
    await page.getByRole('button', { name: 'Criar nota' }).click()
    await expect(page).toHaveURL('/notes')
    await expect(page.getByText('Minha primeira nota E2E')).toBeVisible()
  })

  test('editar nota — título atualizado na lista', async ({ page }) => {
    await loginAs(page, testEmail)

    await page.getByRole('link', { name: 'Nova nota' }).click()
    await page.getByPlaceholder('Título da nota').fill('Nota para editar')
    await page.getByRole('button', { name: 'Criar nota' }).click()
    await expect(page).toHaveURL('/notes')

    await page.locator('article.card').filter({ hasText: 'Nota para editar' })
      .locator('button[title="Editar"]').click()
    await expect(page).toHaveURL(/\/edit/)

    await page.getByPlaceholder('Título da nota').fill('Nota editada com sucesso')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page).toHaveURL('/notes')
    await expect(page.getByText('Nota editada com sucesso')).toBeVisible()
  })

  test('título inválido exibe erro de validação', async ({ page }) => {
    await loginAs(page, testEmail)
    await page.getByRole('link', { name: 'Nova nota' }).click()
    await page.getByRole('button', { name: 'Criar nota' }).click()
    await expect(page.getByText('Título é obrigatório')).toBeVisible()
    await expect(page).toHaveURL('/notes/new')
  })

  test('busca por título filtra resultados', async ({ page }) => {
    await loginAs(page, testEmail)

    await page.getByRole('link', { name: 'Nova nota' }).click()
    await page.getByPlaceholder('Título da nota').fill('NotaBuscavel123')
    await page.getByRole('button', { name: 'Criar nota' }).click()
    await expect(page).toHaveURL('/notes')

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/notes') && res.status() === 200,
    )
    await page.getByPlaceholder('Buscar notas...').fill('NotaBuscavel123')
    await responsePromise

    await expect(page.getByText('NotaBuscavel123')).toBeVisible()
    await expect(page.locator('article.card')).toHaveCount(1)
  })

  test('deletar nota — some da lista', async ({ page }) => {
    await loginAs(page, testEmail)

    await page.getByRole('link', { name: 'Nova nota' }).click()
    await page.getByPlaceholder('Título da nota').fill('Nota para deletar')
    await page.getByRole('button', { name: 'Criar nota' }).click()
    await expect(page).toHaveURL('/notes')

    await page.locator('article.card').filter({ hasText: 'Nota para deletar' })
      .locator('button[title="Excluir"]').click()
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Excluir' }).click()
    await expect(page.locator('article.card').filter({ hasText: 'Nota para deletar' })).toHaveCount(0)
  })
})
