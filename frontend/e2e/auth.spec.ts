import { test, expect, type Page } from '@playwright/test'

const uniqueEmail = () => `e2e+${Date.now()}@example.com`

async function fillRegisterForm(
  page: Page,
  opts: { name: string; email: string; password: string; confirm: string },
) {
  await expect(page).toHaveURL(/\/register/)
  await page.locator('input[type="text"]').fill(opts.name)
  await page.locator('input[type="email"]').fill(opts.email)
  await page.locator('input[type="password"]').first().fill(opts.password)
  await page.locator('input[type="password"]').last().fill(opts.confirm)
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await expect(page).toHaveURL(/\/login/)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
}

test.describe('Registro', () => {
  test('cadastro com dados válidos redireciona para /notes', async ({ page }) => {
    await page.goto('/register')
    await fillRegisterForm(page, {
      name: 'Usuário Teste',
      email: uniqueEmail(),
      password: 'Senha1234!',
      confirm: 'Senha1234!',
    })
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL('/notes')
  })

  test('nome muito curto exibe erro de validação', async ({ page }) => {
    await page.goto('/register')
    await fillRegisterForm(page, {
      name: 'ab',
      email: uniqueEmail(),
      password: 'Senha1234!',
      confirm: 'Senha1234!',
    })
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('Nome deve ter no mínimo 3 caracteres')).toBeVisible()
  })

  test('email já cadastrado exibe erro da API', async ({ page }) => {
    const email = uniqueEmail()
    await page.goto('/register')
    await fillRegisterForm(page, { name: 'Usuário Teste', email, password: 'Senha1234!', confirm: 'Senha1234!' })
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL('/notes')

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL('/login')

    await page.goto('/register')
    await fillRegisterForm(page, { name: 'Outro Usuário', email, password: 'Senha1234!', confirm: 'Senha1234!' })
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})

test.describe('Login', () => {
  let testEmail: string

  test.beforeAll(async ({ browser }) => {
    testEmail = uniqueEmail()
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/register')
    await page.locator('input[type="text"]').fill('Usuário Login')
    await page.locator('input[type="email"]').fill(testEmail)
    await page.locator('input[type="password"]').first().fill('Senha1234!')
    await page.locator('input[type="password"]').last().fill('Senha1234!')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL('/notes')
    await context.close()
  })

  test('login com credenciais válidas redireciona para /notes', async ({ page }) => {
    await page.goto('/login')
    await fillLoginForm(page, testEmail, 'Senha1234!')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL('/notes')
  })

  test('login com senha errada exibe mensagem de erro', async ({ page }) => {
    await page.goto('/login')
    await fillLoginForm(page, testEmail, 'senhaerrada')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('logout redireciona para /login', async ({ page }) => {
    await page.goto('/login')
    await fillLoginForm(page, testEmail, 'Senha1234!')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL('/notes')
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Proteção de rotas', () => {
  test('acesso a /notes sem autenticação redireciona para /login', async ({ page }) => {
    await page.goto('/notes')
    await expect(page).toHaveURL(/\/login/)
  })

  test('acesso a /login autenticado redireciona para /notes', async ({ page }) => {
    const email = uniqueEmail()
    await page.goto('/register')
    await page.locator('input[type="text"]').fill('Usuário Rota')
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').first().fill('Senha1234!')
    await page.locator('input[type="password"]').last().fill('Senha1234!')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL('/notes')

    await page.goto('/login')
    await expect(page).toHaveURL('/notes')
  })
})
