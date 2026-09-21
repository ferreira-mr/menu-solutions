# Menu Solutions — Contador V2

Sistema integrado full stack para gestão de contagens de alunos, planejamento nutricional, controle de produção e desperdício de refeições, cronograma de dietas especiais e comunicação em tempo real no ambiente escolar (SESI).

O projeto é construído em uma arquitetura desacoplada e moderna:
- **Backend (Laravel 11 / PHP 8.4)**: API RESTful protegida por tokens Laravel Sanctum, arquitetura em camadas com Enums nativos, Service Layer para regras de negócio (RN01 a RN17) e RBAC estrito.
- **Frontend (React 19 + Vite)**: SPA responsiva orientada a funcionalidades (*Feature-Driven Architecture*), cliente de API modular por domínio, roteamento aninhado com `<Outlet />` e Design System com tokens CSS centralizados.

---

## Sumário

- [Tecnologias](#tecnologias)
- [Arquitetura & Organização](#arquitetura--organização)
- [Perfis de Acesso (RBAC)](#perfis-de-acesso-rbac)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Execução em Desenvolvimento](#execução-em-desenvolvimento)
- [Implantação em Máquina Virtual (Escola)](#implantação-em-máquina-virtual-escola)
- [Build de Produção](#build-de-produção)
- [Testes Automatizados & Qualidade](#testes-automatizados--qualidade)
- [Documentação Técnica e Manuais](#documentação-técnica-e-manuais)

---

## Tecnologias

### Backend
- **Laravel 11** & **PHP 8.4**
- **Laravel Sanctum**: autenticação via Bearer Tokens para API
- **SQLite** (testes e desenvolvimento rápido) / **MySQL** (produção)
- **PHPUnit 11**: suíte de testes unitários e de integração de regras de negócio

### Frontend
- **React 19** com **Vite 7**
- **React Router 7**: roteamento client-side com layouts aninhados e `<Outlet />`
- **SweetAlert2** & **Lucide React** / **Bootstrap Icons**: feedback visual e iconografia
- **Vitest 3** + **Testing Library**: testes unitários de componentes e hooks
- **ESLint 9**: padronização e linting estrito de código JavaScript

### End-to-End (E2E)
- **Playwright**: testes ponta a ponta com navegador Chromium real simulando jornadas completas dos três perfis de usuários.

---

## Arquitetura & Organização

O projeto segue padrões de **Clean Architecture**, **Domain-Driven Design (DDD)** e **Feature-Driven Development**:

### Backend: Clean Layered Architecture
- **Enums Nativos (`app/Enums/`)**: tipos estritos para papéis de usuário (`UserRole`) e status de autorizações (`AutorizadoStatus`).
- **Camada de Serviços (`app/Services/`)**: isolamento das regras de negócio complexas fora dos controllers:
  - `ContagemService`: filtros de data, controle da janela operacional diária (RN14) e consolidação do dashboard.
  - `ProducaoConsumoService`: pesagens, sobras limpas, resto ingesta e soft deletes auditados.
  - `AutorizadoService`: priorização de pendências e fluxo de aprovação pela diretoria.
  - `FileService`: upload seguro de imagens e cardápios em PDF.
- **Controllers Finos (`app/Http/Controllers/Api/`)**: apenas validam requests, delegam para a Service Layer e retornam recursos JSON.
- **Model Canônico com Retrocompatibilidade (`app/Models/`)**: `Contagem.php` como model canônico e `Contagen.php` mantido como alias de compatibilidade.

### Frontend: Feature-Driven Architecture
- **API Modular (`resources/js/services/`)**:
  - `http/client.js`: cliente centralizado com interceptor de autenticação e tratamento de exceções.
  - `modules/*.api.js`: clientes específicos por domínio funcional (`auth`, `users`, `cardapios`, `autorizados`, `producao`, `cronograma`, `escolar`, `contagens`, `chat`, `files`).
  - `api.js`: fachada de re-exportação unificada retrocompatível.
- **Roteamento Otimizado com `<Outlet />` (`resources/js/App.jsx`)**: o layout principal (`MainLayout`) é mantido em memória via `<RoleShell>`, evitando reconstruções e reflows do DOM a cada transição de rota.
- **Custom Hooks (`resources/js/hooks/`)**: `useAuth` para sessão e logout; `usePermissions` para checagem declarativa de permissões.
- **Módulos de Domínio (`resources/js/features/`)**: agrupamento coeso de telas e subcomponentes por funcionalidade.
- **Design Tokens (`resources/js/styles/variables.css`)**: variáveis CSS padronizadas para paleta de cores, tipografia, superfícies e sombras.

### Estrutura de Diretórios

```
contador-v2/
├── app/
│   ├── Enums/                     # UserRole.php, AutorizadoStatus.php
│   ├── Http/
│   │   ├── Controllers/Api/       # Controllers enxutos por domínio
│   │   └── Middleware/            # RBAC baseado em Enums (StaffOrNutri, Nutri, Diretor)
│   ├── Models/                    # Contagem.php, Contagen.php, User.php, Autorizado.php
│   └── Services/                  # ContagemService, ProducaoConsumoService, AutorizadoService
├── database/
│   ├── migrations/                # Esquema de banco de dados
│   └── seeders/                   # E2eSeeder.php e seeders de desenvolvimento
├── docs/                          # Manuais operacionais (PDFs) e documentação técnica
├── resources/
│   ├── js/
│   │   ├── App.jsx                # Roteamento unificado com <RoleShell> e <Outlet />
│   │   ├── constants/             # roles.js (constantes e labels de perfis)
│   │   ├── hooks/                 # useAuth.js, usePermissions.js
│   │   ├── layouts/               # MainLayout (compartilhado com Outlet)
│   │   ├── services/
│   │   │   ├── http/client.js     # Cliente HTTP base com Bearer Token
│   │   │   ├── modules/           # 10 módulos de API desacoplados
│   │   │   └── api.js             # Ponto de re-exportação unificado
│   │   ├── features/              # Barrel exports das 11 áreas funcionais
│   │   ├── pages/                 # Componentes de páginas do sistema
│   │   ├── components/            # Componentes reutilizáveis (Header, Navs, Modais)
│   │   └── styles/                # variables.css e estilos globais
│   └── views/
│       └── app.blade.php          # Shell HTML que hospeda a SPA React
├── routes/
│   ├── api.php                    # Endpoints RESTful da API
│   └── web.php                    # Fallback SPA para o React Router
├── tests/
│   ├── Feature/
│   │   ├── ApiCoverageTest.php    # Cobertura de rotas e Sanctum
│   │   └── BusinessRules/         # Testes de regras de negócio (RN01 a RN17)
│   └── e2e/                       # Cenários ponta a ponta Playwright (Chromium)
├── eslint.config.js               # Configuração do ESLint 9
├── playwright.config.js           # Configuração do Playwright com webServer integrado
└── vitest.config.js               # Configuração do Vitest para React
```

---

## Perfis de Acesso (RBAC)

| Perfil | Nível | Enum (`UserRole`) | Principais Responsabilidades |
| :--- | :---: | :---: | :--- |
| **Inspetora / Staff** | `1` | `UserRole::Staff` | Registro diário de contagem de turmas, contagem de dietas especiais (NES), visualização de cardápios e chat. |
| **Nutricionista** | `2` | `UserRole::Nutri` | Gestão completa do sistema: cadastro de cardápios (PDF), controle de produção e sobras, planejamento de dietas, solicitação de autorizações, gerenciamento de turmas/alunos e dashboard analítico. |
| **Diretoria** | `3` | `UserRole::Diretor` | Painel gerencial, aprovação/recusa de autorizações de refeições e gerenciamento de usuários da equipe escolar. |

---

## Requisitos

- **PHP 8.2+** (recomendado **PHP 8.4**) com extensões `pdo_sqlite`, `pdo_mysql`, `mbstring`, `fileinfo`
- **Composer 2+**
- **Node.js 20+** e **npm**
- **SQLite** ou **MySQL**

---

## Instalação

```bash
# 1. Clonar o repositório e acessar a pasta
git clone <url-do-repositorio>
cd contador-v2

# 2. Instalar dependências do Backend (PHP)
composer install

# 3. Instalar dependências do Frontend (Node.js)
npm install

# 4. Configurar variáveis de ambiente
cp .env.example .env
php artisan key:generate

# 5. Executar as migrações do banco de dados
php artisan migrate
```

Os PDFs de cardápio continuam referenciados pelo nome relativo e expostos através de `/uploads/pdf`; por padrão, o disco configurado `CARDAPIO_FILESYSTEM_DISK=uploads` grava em `public/uploads`. A criação, substituição e exclusão registram falhas de limpeza para retentativa sem alterar o contrato de URL.

Fotos de alunos usam o disco privado `STUDENT_PHOTOS_DISK=student_photos` e são entregues somente por `GET /api/alunos/{id}/foto` com autenticação Sanctum. Em uma instalação que já tenha referências em `public/uploads`, faça primeiro uma simulação e depois a migração verificada; a remoção pública é opcional e específica por arquivo:

```bash
php artisan photos:migrate-to-private --dry-run
php artisan photos:migrate-to-private --remove-public
```

O comando mantém referências e dados históricos, calcula e confere SHA-256 antes de remover a origem e pode ser repetido. Ele não percorre nem apaga diretórios inteiros e não deve ser executado em produção sem backup e janela operacional autorizada.

---

## Execução em Desenvolvimento

Em terminais separados:

```bash
# Terminal 1: Servidor Backend Laravel
php artisan serve

# Terminal 2: Servidor de desenvolvimento Vite (com Hot Module Replacement)
npm run dev
```

Ou execute ambos em conjunto:

```bash
composer run dev
```

Acesse no navegador: `http://localhost:8000`.

---

## Implantação em Máquina Virtual (Escola)

Para escolas públicas ou unidades do SESI/SENAI onde o sistema rodará em um computador comum acessado por 2 a 3 pessoas simultaneamente na rede local:

### 1. Inicialização Rápida em 1 Comando (`up`)

Na raiz do projeto, execute:

```cmd
up
```
*(ou no PowerShell: `.\up`)*

**O que o comando faz automaticamente:**
1. Compila os assets otimizados do React 19 via Vite (`npm run build`).
2. Obtém a imagem oficial do **Ubuntu 22.04 LTS Server** (mantida em cache local).
3. Cria a VM no **VirtualBox** dimensionada com 2 vCPUs e 2048 MB de RAM.
4. Configura a placa de rede em modo **NAT com Redirecionamento de Portas (Port Forwarding)**:
   - Porta `80` do computador hospedeiro redirecionada para a porta `80` da VM (Nginx).
   - Porta `2222` do computador hospedeiro para SSH (`22`).
5. Provisiona os serviços dentro do Ubuntu (Nginx, PHP 8.3-FPM, SQLite, Composer, migrações e catálogo inicial; contas são criadas pelo bootstrap protegido do primeiro gestor).
6. Valida a disponibilidade e exibe os links de acesso.

> **Importante — assets da VM:** a VM usa exclusivamente o build de produção em `public/build`. O arquivo `public/hot`, criado pelo `npm run dev`, aponta o Laravel para o servidor Vite local na porta `5173` e causa tela branca/`ERR_CONNECTION_REFUSED` quando é levado para a VM. O fluxo `up` exclui esse arquivo do pacote, remove qualquer resíduo dentro da VM e valida que o HTML final referencia `/build/assets/`.

---

### 1.1. Bootstrap do primeiro gestor

O provisionamento cria apenas o catálogo inicial e não instala contas E2E, senhas conhecidas ou fatos de demonstração. Depois de iniciar a VM, execute dentro dela:

```bash
cd /var/www/contador-v2
sudo php artisan app:bootstrap-admin \
  --name="Nome do gestor" \
  --nif="NIF_DO_GESTOR" \
  --email="gestor@escola.local"
```

A senha será solicitada em entrada oculta, com confirmação, e nunca será exibida. Se o NIF já existir, o comando não altera as credenciais existentes. O `E2eSeeder` é reservado ao runtime descartável dos testes e não deve ser executado em produção.

---

### 2. Por que Modo NAT com Port Forwarding?

Em redes escolares corporativas, os roteadores/switches bloqueiam a atribuição de IP via DHCP para adaptadores virtuais (filtro MAC / 802.1x). Em modo *Bridged*, a VM não recebe IP.

Com **NAT e Port Forwarding**:
- A VM compartilha a conexão e o endereço IP do computador físico hospedeiro.
- **No próprio computador**: acesse via `http://localhost`.
- **Nos outros aparelhos (celulares das inspetoras, notebooks da nutrição e direção)**: acesse pelo IP do computador hospedeiro na rede escolar (ex: `http://192.168.1.50`).

---

### 3. Transporte em Pendrive via Appliance (.OVA)

Caso o computador definitivo da escola não possua ferramentas de desenvolvedor (Terraform/Git):
1. No computador onde a VM foi gerada, execute:
   ```powershell
   cd deploy\terraform
   powershell -ExecutionPolicy Bypass -File .\scripts\export-appliance.ps1
   ```
2. Copie o arquivo gerado `deploy/MenuSolutions-ContadorV2.ova` para um pendrive.
3. No computador da escola (com VirtualBox instalado), abra o menu **Arquivo** > **Importar Appliance...** e selecione o `.ova`.
4. A VM já será importada com sistema, Nginx, PHP, banco de dados e regras de rede da porta 80 100% configurados.

---

### 4. Alternativa via Vagrant

O repositório também inclui um [`Vagrantfile`](Vagrantfile) pronto. Se preferir:
```bash
vagrant up
```

> **Manual Completo da Escola:** Consulte [`deploy/docs/GUIA_IMPLANTACAO_ESCOLA.md`](deploy/docs/GUIA_IMPLANTACAO_ESCOLA.md) para detalhes de firewall, regras do Windows e solução de dúvidas.

---

## Build de Produção

```bash
# Compilar assets otimizados do frontend
npm run build

# Otimizar caches do Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

O servidor web de produção (Nginx ou Apache) deve apontar o document root para a pasta `public/`.

Em produção, não execute `npm run dev` nem mantenha `public/hot` no diretório servido. Se uma tela branca aparecer, verifique:

```bash
test ! -e public/hot
test -f public/build/manifest.json
```

O HTML da aplicação deve referenciar arquivos em `/build/assets/`, nunca `:5173`, `@vite/client`, `resources/css/app.css` ou `resources/js/main.jsx`.

---

## Testes Automatizados & Qualidade

O projeto conta com **173 testes automatizados** distribuídos em 3 camadas complementares:

```
Total: 173 Testes Verdes (100% PASS)
├── Backend (PHPUnit): 53 testes (245 asserções)
├── Frontend (Vitest): 100 testes (32 arquivos)
└── E2E (Playwright): 20 testes completos em navegador real
```

### 1. Testes do Backend (PHPUnit / Laravel)
Testa autenticação Sanctum, matriz de RBAC, limites de contagem (RN14), upload estrito de PDF, ciclo de vida de autorizações e integridade relacional.

```bash
php artisan test
# ou: composer test
```

### 2. Testes do Frontend (Vitest + React Testing Library)
Testa componentes de páginas, cliente de API modular, modais, custom hooks (`useAuth`, `usePermissions`), filtros e relatórios.

```bash
# Execução padrão
npm run test:front

# Execução com relatório de cobertura de código
npm run test:front:coverage
```

### 3. Análise Estática de Código (ESLint)
Verificação de sintaxe, boas práticas do React 19 e consistência de imports.

```bash
npm run lint
```

### 4. Testes Ponta a Ponta (Playwright E2E)
Executa cenários reais em navegadores Chromium simulando login, troca de perfis, navegação sem reflows e envio de mensagens assíncronas no chat.

```bash
# 1. Preparar a base de dados isolada para E2E (executa E2eSeeder)
npm run test:e2e:prepare

# 2. Executar a suíte Playwright
npm run test:e2e

# Opcional: Executar com interface interativa
npx playwright test --ui
```

> **Credenciais de Teste E2E (criadas pelo `E2eSeeder`):**
> - **Inspetora**: Usuário `inspetora` | Senha: `inspetora`
> - **Nutricionista**: Usuário `nutricionista` | Senha: `nutricionista`
> - **Diretora**: Usuário `diretora` | Senha: `diretora`

---

## Documentação Técnica e Manuais

A pasta [`docs/`](docs/) contém a documentação detalhada do sistema:
- `docs/MANUAL_DEPLOY_MENU_SOLUTIONS.pdf`: guia de implantação e infraestrutura.
- `docs/MANUAL_DESENVOLVIMENTO_HISTORIA_ROADMAP.pdf`: histórico do projeto, arquitetura e roadmap.
- `docs/MANUAL_INSPETORA_MENU_SOLUTIONS.pdf`: manual operacional do perfil Inspetora.
- `docs/MANUAL_NUTRICIONISTA_MENU_SOLUTIONS.pdf`: manual operacional do perfil Nutricionista.
- `docs/docs/`: documentação dividida em tópicos (visão de negócio, requisitos, arquitetura, design system, QA e operação).
