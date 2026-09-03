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

## Organização

- `app/`: controllers, models, requests, resources e middleware Laravel
- `routes/api.php`: endpoints da API
- `routes/web.php`: entrada e fallback do React Router
- `resources/js/`: páginas, componentes, estilos e serviços React
- `resources/views/app.blade.php`: shell HTML que inicializa o React
- `vite.config.js`: integração Laravel + Vite + React
