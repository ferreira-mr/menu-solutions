# Menu Solutions — Diretrizes para Agentes de IA (AGENTS.md)

Este documento estabelece as diretrizes arquiteturais, padrões de código, regras de negócio e procedimentos de validação obrigatórios para qualquer agente de IA ou desenvolvedor atuando no repositório **Menu Solutions (Contador V2)**.

---

## 1. Contexto do Projeto

- **Aplicação**: Sistema full stack de gestão de alimentação escolar, contagem de alunos, controle de produção/desperdício de refeições, dietas especiais (NES) e chat corporativo para o SESI.
- **Backend**: Laravel 11 rodando em PHP 8.4 (API RESTful protegida por Laravel Sanctum).
- **Frontend**: Single Page Application (SPA) em React 19 + Vite 7 + React Router 7.
- **Banco de Dados**: SQLite em memória para testes e desenvolvimento rápido; MySQL em produção ou SQLite autônomo na VM escolar.
- **Qualidade & Testes**: Suíte de testes automatizados (PHPUnit + Vitest + Playwright + ESLint).

---

## 2. Princípios Arquiteturais Obrigatórios

### 2.1. Backend (Clean Layered Architecture)
1. **Controllers Finos (Thin Controllers)**:
   - Controllers em `app/Http/Controllers/Api/` devem apenas validar a requisição (FormRequest ou `$request->validate`), delegar a lógica para a camada de serviços (`app/Services/`) e formatar a resposta JSON.
   - **NUNCA** insira regras de negócio complexas, cálculos de desperdício ou queries diretas de múltiplos passos nos controllers.
2. **Camada de Serviços (Service Layer)**:
   - Toda regra de negócio deve residir em `app/Services/`:
     - `ContagemService`: filtros de data, controle da janela de contagem (RN14), auditoria e agregação do dashboard.
     - `ProducaoConsumoService`: pesagens, sobras limpas, resto ingesta e soft-deletes auditados.
     - `AutorizadoService`: priorização de pendências e fluxo de aprovação pela diretoria.
     - `FileService`: upload seguro de fotos e cardápios PDF.
3. **Enums Nativos do PHP 8.4**:
   - **NUNCA** use números mágicos (`1`, `2`, `3`) ou strings literais soltas para perfis e status.
   - Use sempre:
     - `App\Enums\UserRole` (`Staff = 1`, `Nutri = 2`, `Diretor = 3`) com métodos `label()`, `isNutri()`, etc.
     - `App\Enums\AutorizadoStatus` (`Pendente`, `Confirmado`, `Recusado`) com helpers tipados.
4. **Nomenclatura Canônica e Retrocompatibilidade**:
   - O Model canônico é `App\Models\Contagem.php`.
   - Mantenha `App\Models\Contagen.php` como subclasse de compatibilidade (`class Contagen extends Contagem {}`).
   - A tabela física no banco permanece `contagens` para evitar migrations destrutivas.

### 2.2. Frontend (Feature-Driven Architecture)
1. **Organização por Funcionalidades (`resources/js/features/`)**:
   - Novas telas ou subcomponentes de domínio devem ser organizados em suas respectivas pastas (`auth`, `contagem`, `producao`, `autorizados`, `cardapios`, `chat`, `cronograma`, `planejamento`, `escolar`, `usuarios`, `dashboard`).
   - Mantenha os re-exports no `index.js` de cada feature para imports limpos.
2. **Camada de API Modular (`resources/js/services/`)**:
   - Endpoints HTTP são divididos por domínio em `resources/js/services/modules/*.api.js`.
   - O cliente base é `resources/js/services/http/client.js` (`apiFetch`).
   - **IMPORTANTE**: Toda nova função de API deve ser re-exportada em `resources/js/services/api.js` para manter compatibilidade absoluta com componentes legados e mocks do Vitest.
3. **Roteamento com `<Outlet />`**:
   - **NUNCA** instancie `<MainLayout>` diretamente em cada rota filha.
   - Utilize o `<RoleShell>` no `resources/js/App.jsx` e renderize páginas filhas via `<Outlet />` para evitar remontagens completas de layout e reflows do DOM.
4. **Permissões e Sessão**:
   - Utilize os hooks customizados:
     - `useAuth()` para estado de login, usuário corrente e logout.
     - `usePermissions()` para checagens declarativas (`isNutri`, `isStaff`, `isDiretor`, `canApprove`).
5. **Design Tokens**:
   - Utilize as variáveis CSS centralizadas em `resources/js/styles/variables.css` (`--primary-color`, `--bg-light`, etc.). Evite cores hexadecimais hardcoded em arquivos locais.

---

## 3. Matriz de Perfis e Regras de Negócio (RBAC & RNs)

- **Inspetora / Staff (`UserRole::Staff = 1`)**:
  - Pode registrar contagens diárias de turmas e necessidades especiais (NES).
  - Pode visualizar cardápios em PDF e conversar no chat.
  - **NÃO** tem acesso a rotas gerenciais nem pode aprovar autorizações.
- **Nutricionista (`UserRole::Nutri = 2`)**:
  - Gestora técnica plena: cria cardápios, controla produção/sobras, planeja categorias/alunos, solicita autorizações da direção e visualiza relatórios completos.
- **Diretoria (`UserRole::Diretor = 3`)**:
  - Painel gerencial, aprovação/recusa de autorizações de refeições e gerenciamento de usuários.
- **Regra RN14 (Janela Operacional)**:
  - Contagens só podem ser criadas ou editadas na data atual. Registros retroativos são somente leitura para preservar histórico e auditoria.
- **Contratos de Rotas Legadas**:
  - Rotas com nomes específicos como `/api/controle_de_producao` e `/api/autorizados/update/{id}` não devem ser alteradas ou removidas, pois clientes e testes E2E dependem dessas URLs exatas.

---

## 4. Bateria de Testes e Procedimentos de Validação

Antes de concluir qualquer tarefa ou realizar commits, execute a verificação completa das 3 camadas de teste:

```bash
# 1. Backend: 59 testes PHPUnit (266 asserções)
php artisan test

# 2. Frontend: 116 testes Vitest (32 arquivos)
npm run test:front

# 3. Linter: ESLint 9 (0 erros, 0 avisos)
npm run lint

# 4. Build de Produção Vite
npm run build

# 5. E2E: 20 cenários Playwright em navegador Chromium real
npm run test:e2e
```

> **Critério de Aceite**: Nenhuma alteração de código é considerada pronta se qualquer teste falhar ou se o ESLint acusar erros/avisos.

---

## 5. Infraestrutura e Implantação Escolar (VirtualBox + Terraform)

Para permitir a operação em escolas públicas ou unidades do SESI/SENAI em computadores comuns:

### 5.1. Restrição de Rede & Modo NAT Obrigatório
- Em redes escolares corporativas, os roteadores/switches bloqueiam a atribuição de IP DHCP a interfaces virtuais desconhecidas. Por isso, o modo *Bridged* **NÃO** deve ser utilizado.
- A VM é configurada obrigatoriamente em modo **NAT com Redirecionamento de Portas (Port Forwarding)**:
  - `Host :80 -> VM :80`: tráfego HTTP escuta em todas as interfaces físicas do host (`0.0.0.0:80`).
  - `Host 127.0.0.1:2222 -> VM :22`: tráfego SSH exclusivo para manutenção local.
  - Qualquer computador, celular ou tablet na rede escolar acessa a aplicação digitando o IP do computador hospedeiro (`http://<IP_HOST>`).

### 5.2. Fluxo de Inicialização "Zero-Touch" (`up`)
- O comando `up` (via [`up.bat`](up.bat) ou [`up.ps1`](up.ps1)) na raiz do repositório executa:
  1. `npm run build` para garantir que os assets do Vite estão atualizados.
  2. Chamada automatizada do Terraform (`deploy/terraform/`).
  3. Download e importação da imagem base do **Ubuntu 22.04 LTS Server** (em cache local).
  4. Configuração dos recursos (2 vCPUs, 2048 MB RAM, NAT e Port Forwarding).
  5. Sincronização e provisionamento do Nginx, PHP 8.3-FPM, SQLite e migrações/seeders oficiais.
  6. Validação do health check HTTP e exibição das URLs de acesso local e na rede escolar.

#### Regra obrigatória: Vite dev versus build de produção

- A VM escolar serve somente os assets compilados em `public/build` pelo Nginx.
- O arquivo `public/hot` é um marcador local do Vite em desenvolvimento e **nunca** pode ser enviado para a VM. Quando presente, o Laravel gera URLs para `http://[::1]:5173`, causando tela branca e erros `ERR_CONNECTION_REFUSED` para `@vite/client`, `app.css` e `main.jsx`.
- A view `resources/views/app.blade.php` só deve chamar `@viteReactRefresh` em ambiente `local`.
- O empacotamento Terraform deve excluir `public/hot`, o provisionamento deve removê-lo antes de criar o cache das views e o `up.ps1` deve rejeitar uma página que contenha referências a `5173`, `@vite/client` ou aos caminhos-fonte `resources/css`/`resources/js`.
- Após `npm run dev`, antes de empacotar uma VM, confirme que existe `public/build/manifest.json` e que `public/hot` não será incluído no pacote.

### 5.3. Portabilidade via Appliance (.OVA)
- Para escolas onde não é permitida a instalação do Terraform, a VM gerada pode ser empacotada em um único arquivo `.OVA` executando:
  ```powershell
  cd deploy\terraform
  powershell -ExecutionPolicy Bypass -File .\scripts\export-appliance.ps1
  ```
- O arquivo `.OVA` resultante pode ser copiado em um pendrive e importado em 2 cliques no VirtualBox de qualquer computador da escola (`Arquivo` > `Importar Appliance...`).

### 5.4. Documentação Operacional
- O guia completo passo a passo voltado a operadores e técnicos de TI da escola reside em [`deploy/docs/GUIA_IMPLANTACAO_ESCOLA.md`](deploy/docs/GUIA_IMPLANTACAO_ESCOLA.md).

---

## 6. Padrões de Commit

Siga estritamente o formato **Conventional Commits**:
- `feat:` nova funcionalidade para o usuário ou infraestrutura.
- `fix:` correção de bug ou divergência de contrato.
- `refactor:` reestruturação de código sem alteração de comportamento externo.
- `test:` adição ou ajuste de testes automatizados.
- `docs:` documentação técnica, manuais ou README.
- `chore:` tarefas de manutenção, limpeza ou configuração de ferramentas.
