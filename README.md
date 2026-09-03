# Contador V2

Aplicação full stack para gestão de contagens, cardápios, planejamento,
cronogramas, produção e comunicação entre os perfis do sistema.

O Laravel fornece a API, autenticação, regras de acesso e persistência. O
React mantém a interface SPA, o React Router e os estilos existentes. O Vite
compila o React diretamente dentro do projeto Laravel.

## Requisitos

- PHP 8.2+
- Composer
- Node.js 20+
- SQLite ou outro banco configurado no `.env`

## Instalação

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
npm install
```

Os arquivos enviados são gravados em `public/uploads` e ficam disponíveis
pelas URLs `/uploads` e `/uploads/pdf`.

## Desenvolvimento

Em um terminal, execute:

```bash
php artisan serve
npm run dev
```

Abra `http://localhost:8000`. O Laravel entrega a página inicial e o Vite
atualiza os módulos React durante o desenvolvimento.

Para iniciar os processos Laravel e Vite juntos, também é possível usar:

```bash
composer run dev
```

## Produção

```bash
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

O servidor web deve apontar para a pasta `public` do Laravel. As rotas da API
ficam sob `/api`; as demais rotas da SPA são encaminhadas pelo Laravel para a
view React.

## Testes

Os testes são separados por camada e podem ser executados no CI ou localmente:

```bash
# Backend: PHPUnit + Laravel RefreshDatabase (SQLite em memória)
composer test

# Frontend: Vitest + Testing Library + MSW
npm run lint
npm run test:front
npm run test:front:coverage

# E2E: Playwright/Chromium contra Laravel servindo o build React
npm run test:e2e:prepare
npm run test:e2e
```

`test:e2e:prepare` recria a base SQLite local e usa `E2eSeeder`, que cria as
contas de teste dos três perfis. A senha padrão é `password`; o NIF da
nutricionista é `22222222222` (ou use `E2E_NIF` e `E2E_PASSWORD`). Nunca use
essas contas em ambiente real. O estado autenticado do Playwright e os
relatórios ficam em pastas ignoradas pelo Git.

O PHPUnit cobre autenticação Sanctum, validações, CRUD, uploads, vínculos,
contagens, produção, chat e a matriz de permissões. O Vitest cobre o cliente
HTTP, serialização JSON/FormData, datas, login e mensagens de erro. O Playwright
valida o shell entregue pelo Laravel, fallback de rotas, navegação autenticada
e redirecionamento após remoção da sessão.

## Organização

- `app/`: controllers, models, requests, resources e middleware Laravel
- `routes/api.php`: endpoints da API
- `routes/web.php`: entrada e fallback do React Router
- `resources/js/`: páginas, componentes, estilos e serviços React
- `resources/views/app.blade.php`: shell HTML que inicializa o React
- `vite.config.js`: integração Laravel + Vite + React
