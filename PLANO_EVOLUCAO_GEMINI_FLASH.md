# Plano de Auditoria, Correção de Erros e Evolução UI/UX — Menu Solutions (Contador V2)
> **Guia Passo a Passo Otimizado para Execução pelo Modelo Gemini Flash**

Este documento consolida a auditoria técnica completa de **Backend (Laravel 12)**, **Frontend (React 19 + Vite 7)**, **Testes Automatizados** e **Boas Práticas de UI/UX e Acessibilidade (WCAG AA)** do projeto **Menu Solutions (Contador V2)**.

Como o objetivo é executar as correções e evoluções utilizando o modelo **Gemini Flash** (que opera com máxima eficiência quando recebe instruções diretas, escopo fechado por etapa, caminhos exatos de arquivos, linhas de referência, snippets de código *Antes/Depois* e comandos determinísticos de teste), este plano foi estruturado em **7 Etapas Independentes e Sequenciais**.

---

## Como Executar este Plano com o Gemini Flash

Para obter 100% de precisão ao usar o **Gemini Flash**, envie um prompt por etapa:
> **Exemplo de Prompt para o Gemini Flash:**
> *"Leia o arquivo `PLANO_EVOLUCAO_GEMINI_FLASH.md` e implemente exclusivamente a **Etapa 1** seguindo exatamente os arquivos, snippets e regras do `AGENTS.md`. Ao concluir as edições da Etapa 1, execute os comandos de validação da Etapa 1 e aguarde minha confirmação antes de ir para a Etapa 2."*

### Regras Inegociáveis para o Agente Executor (`AGENTS.md`):
1. **NUNCA** altere ou remova rotas legadas (`/api/controle_de_producao`, `/api/autorizados/update/{id}`, `/api/login` com `{ nif, password }`).
2. **NUNCA** instancie `<MainLayout>` diretamente nas páginas; mantenha o `<RoleShell>` com `<Outlet />` em `resources/js/App.jsx`.
3. **NUNCA** deixe `eslint`, `vitest` ou `phpunit` quebrados ao finalizar uma etapa.

---

## Diagnóstico Executivo dos Erros Encontrados

### 1. Bugs Críticos de Frontend & Vazamento de CSS Global
1. **Travamento do Scroll em Celulares em Todo o App (`ChatPage.css:329-334`)**:
   - Como `ChatPage` é importado estaticamente em `App.jsx`, seu CSS é injetado globalmente no `<head>` em todas as rotas. Nas linhas 329–334 existe `@media (max-width: 768px) { body { overflow: hidden; position: fixed; width: 100%; } }`. Isso congela a rolagem vertical do `<body>` em **todas as páginas do sistema** (Login, Contagem, Dashboard, Autorizados, etc.) em qualquer celular!
2. **Poluição Global de `:root` e `.swal2-*`**:
   - `ContagemPage.css:8-20` e `ChatPage.css:2-18` redefinem `:root` globalmente.
   - `ProducaoManagementView.css:122-128` sobrescreve `.swal2-container { z-index: 10000 !important; }` e `.swal2-input { width: 90% !important; }` globalmente, conflitando com `MainLayout.css`.
3. **Spinners de Carregamento Invisíveis (`.spinner-border`)**:
   - `ViewCardapioPage.jsx`, `CardapiosPage.jsx`, `AutorizadosPage.jsx`, `ChatPage.jsx` e `UsuariosPage.jsx` usam `<div className="spinner-border">`, mas o Bootstrap CSS **não está instalado** (apenas `bootstrap-icons`). Esses spinners renderizam como `<div>` vazias e invisíveis.
4. **Filtro de Relatório "Semanal" Não Implementado (`ReportView.jsx:69-94`)**:
   - O menu lateral (`ReportTypeSidebar.jsx`) e o painel de filtros (`ReportFilterPanel.jsx`) permitem selecionar `Semanal` e preencher `Data Início` e `Data Fim`. Porém, `ReportView.jsx` contém apenas `// TODO: Adicionar "semanal"`, caindo no `default:` e gerando um relatório de apenas 1 dia com título em branco (`""`).
5. **Tag HTML Literal `<i>` Renderizada como Texto (`CalendarView.jsx:55`)**:
   - Quando um aluno não possui descrição, `CalendarView.jsx:55` define `'<i>Nenhuma descrição disponível.</i>'`. O React escapa a string em `DetailsPanel.jsx:102`, exibindo literalmente os caracteres `<i>` e `</i>` na interface.
6. **Status `recusado` Sem Estilo Visual (`AutorizadosPage.css`)**:
   - `AutorizadosPage.jsx` aplica as classes `.auth-card.recusado` e `.status-pill.recusado`, mas elas não existem em `AutorizadosPage.css`.
7. **Modal de Contagem Trava Infinitamente em Caso de Erro de Rede (`ContagemPage.jsx:301`)**:
   - `abrirModalContagem` abre um `Swal` de carregamento (`Preparando Contagem...`) antes de chamar a API. Se ocorrer erro, o `catch` apenas faz `console.error(error)` sem fechar o `Swal`, travando a tela da inspetora.
8. **Classes CSS Inexistentes em `ProfilePage.css` e Ícone Desalinhado em `ControleProducaoPage.css`**:
   - `ProfilePage.jsx` usa `.profile-header-top`, `.grid-2-col`, `.input-disabled` (em input `readOnly`), `.helper-text` e `.user-email-display`, que não existem em `ProfilePage.css`.
   - `ControleProducaoPage.css:158` define `.search-icon` com `position: absolute` sem `left: 1rem;`.
   - `InicioPage.css:97` aplica `.buttons-section.wide-grid .main-button:last-child { grid-column: 2; }` assumindo 10 botões (Nutricionista), o que empurra o 6º botão da Diretora para uma linha extra isolada.
9. **Datas em UTC (`toISOString`) Após 21h BRT**:
   - `ControleProducaoPage.jsx:85` e `ProducaoManagementView.jsx:23` usam `new Date().toISOString().split('T')[0]`, que após as 21h no Brasil retorna a data do dia seguinte.

### 2. Bugs de Regra de Negócio, Condições de Corrida e Arquitetura no Backend
1. **Hierarquia Invertida nos Models `Contagem` e `Contagen` (Violação do `AGENTS.md` §2.1.4)**:
   - O `AGENTS.md` determina que `App\Models\Contagem` seja o Model canônico e `class Contagen extends Contagem {}` seja a subclasse de compatibilidade. Hoje está invertido (`class Contagem extends Contagen`).
2. **Desmarcar Presença NES via `/api/contagens/operacao` Bloqueia Permanentemente a Remoção do Vínculo (`409`)**:
   - `DELETE /api/contagem-nes/{id}` usa `forceDelete()`, mas desmarcar a presença no mesmo dia via `POST /api/contagens/operacao` (`presente: false`) chama `$presence->delete()` (soft delete). Como `VinculoService::removeStudentFromNeed` verifica `ContagemNe::withTrashed()->exists()`, o registro soft-deleted impede para sempre que a nutricionista desvincule o aluno da necessidade!
3. **Duplicidade de Presença NES no Mesmo Dia Quebra `/api/contagens/operacao`**:
   - `VinculoService::createPresence` (`POST /api/contagem-nes`) não verifica se já existe presença ativa para a relação no dia escolar atual. Se chamado duas vezes no mesmo dia, cria registros duplicados e faz `ContagemOperationService::savePresencas` abortar com `409 Conflict`.
4. **Destinatário Não Consegue Marcar Mensagem como Vista no Chat (`ChatController.php:63`)**:
   - `ChatController::update` exige `users_id === auth()->id()` tanto para editar texto quanto para atualizar `visto = 's'`, retornando `403 Forbidden` quando o destinatário tenta marcar a mensagem como lida.
5. **Coluna `inclui_total_regular` Ignorada em `Categoria` e `CategoriaRequest`**:
   - `Categoria::$fillable` e `CategoriaRequest::rules()` não incluem `inclui_total_regular`, impedindo criar ou atualizar categorias que contabilizem em `total_outros` via API.
6. **Condições de Corrida (Falta de `lockForUpdate`) e Destruição de Auditoria**:
   - `UserService::ensureAnotherManagerExists` roda fora da transação e sem `lockForUpdate()`.
   - `AutorizadoService::update`, `approve` e `delete` não usam `DB::transaction` + `lockForUpdate()`, e `delete()` permite excluir autorizações já confirmadas/recusadas pela Diretoria.
   - `AlunoController::destroy` verifica `$aluno->necessidades()->exists()` (que ignora necessidades soft-deleted) em vez de `$aluno->alunosHasNecessidades()->exists()`.
   - `ContagemOperacaoRequest` não filtra `whereNull('deleted_at')` em `exists:contagens,id` e `exists:contagem_nes,id`.
   - `RetryFileCleanup` ignora a coluna `next_attempt_at`.

### 3. Problemas de UI/UX, Responsividade e Acessibilidade (a11y)
1. **Ausência de `@media` Queries em Telas de Gestão**:
   - `PlanejamentoPage.css` (`320px 1fr 340px` com `overflow: hidden`), `ControleProducaoPage.css` (`240px 1fr 320px`), `CalendarView.css` (`12vw 43vw 22vw`) e `ReportView.css` (`14vw 49vw 20vw`) quebram ou cortam conteúdo em tablets e celulares (`<= 1024px`).
2. **Armadilhas de `:hover` em Telas Touch e Teclado**:
   - Os botões de ação dos cards de alunos em `PlanejamentoPage.css` (`.card-actions`) e a gaveta/botão de exclusão em `CronogramaPage.css` (`.sidebar-drawer`, `.delete-schedule-button`) só aparecem em `:hover`, ficando inacessíveis em tablets/celulares.
3. **Menu Lateral Fechado Permanece na Ordem de Tabulação (`Tab`)**:
   - `InspetoraNav`, `NutriNav` e `DiretoraNav` movem `.menu-lateral` para `right: -250px` quando fechado, mas sem `visibility: hidden` ou `aria-hidden={!isOpen}`, fazendo o usuário navegar por links invisíveis ao apertar `Tab`.
4. **Inputs Sem `<label>` nos Modais de Produção e Falta de Contraste WCAG**:
   - No modal de Controle de Produção (`ControleProducaoPage.jsx` e `ProducaoManagementView.jsx`), os 7 inputs numéricos/texto possuem apenas `placeholder`. Ao editar um item existente, o usuário vê apenas números sem saber qual campo representa "Quantidade", "Pessoas", "Sobra Limpa" ou "Desperdício".
   - O cabeçalho amarelo `.nai-card` em `DashboardNutri.css` usa fundo `#FFC000` com texto branco `#fff` (contraste `1.63:1`, reprovado no WCAG AA que exige `4.5:1`).

---

## Roteiro Detalhado de Implementação (7 Etapas)

---

### ETAPA 1: Correção de Bugs Críticos de CSS Global e Estados Visuais (Frontend)

#### Tarefa 1.1: Corrigir `ChatPage.css` (Remover trava global do `body` no mobile e `:root`)
- **Arquivo**: `resources/js/pages/Chat/ChatPage.css`
- **Alterações**:
  1. Na linha 2, substituir `:root {` por `.chat-container {`.
  2. No seletor `.chat-container` (linhas 24–43), remover `margin-bottom: -30vh;` e ajustar `margin: 1rem auto;`.
  3. Em `.chat-header` (linha 172) e `.messages-area` (linha 211), substituir `width: 60vw;` por `width: 100%;`.
  4. Nas linhas 329–338, **remover completamente** `body { overflow: hidden; position: fixed; width: 100%; }`, deixando:
     ```css
     @media (max-width: 768px) {
         .chat-container {
             height: calc(100dvh - 80px);
             width: 100%;
             margin: 0;
             border-radius: 0;
         }
     ```

#### Tarefa 1.2: Escopar variáveis em `ContagemPage.css` e limpar overrides `.swal2-*` em `ProducaoManagementView.css`
- **Arquivo 1**: `resources/js/pages/Inspetora/ContagemPage.css`
  - Na linha 8, substituir `:root {` por `.contagem-section, .swal2-popup {`.
- **Arquivo 2**: `resources/js/components/ControleProducao/ProducaoManagementView.css`
  - Remover as linhas 122–128 (`.swal2-container { z-index: 10000 !important; }` e `.swal2-input, .swal2-select { width: 90% !important; }`), pois o tema global já é gerenciado por `MainLayout.css`.

#### Tarefa 1.3: Criar suporte CSS global para `.spinner-border` em `index.css`
- **Arquivo**: `resources/js/index.css`
- **Alteração**: Adicionar ao final do arquivo:
  ```css
  @keyframes spinner-border-spin {
    to { transform: rotate(360deg); }
  }
  .spinner-border {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    vertical-align: -0.125em;
    border: 0.25em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: 0.75s linear infinite spinner-border-spin;
  }
  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
    border-width: 0.2em;
  }
  ```

#### Tarefa 1.4: Estilizar status `.recusado` em `AutorizadosPage.css`
- **Arquivo**: `resources/js/pages/Autorizados/AutorizadosPage.css`
- **Alteração**: Logo após `.auth-card.confirmado` (linha 92) e `.status-pill.confirmado` (linha 142), adicionar:
  ```css
  .auth-card.recusado { border-left-color: var(--color-danger, #dc3545); }
  ```
  e
  ```css
  .status-pill.recusado { background-color: #f8d7da; color: #721c24; }
  ```

#### Tarefa 1.5: Corrigir ícone de busca em `ControleProducaoPage.css`, grid em `InicioPage.css` e classes em `ProfilePage.css`
- **Arquivo 1**: `resources/js/pages/ControleProducao/ControleProducaoPage.css` (linhas 158–164)
  ```css
  .producao-container-v2 .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #adb5bd;
      pointer-events: none;
  }
  ```
- **Arquivo 2**: `resources/js/pages/Inicio/InicioPage.css` (linhas 97–99)
  ```css
  .buttons-section.wide-grid .main-button:nth-child(10):last-child {
      grid-column: 2;
  }
  ```
- **Arquivo 3**: `resources/js/pages/ProfilePage/ProfilePage.css`
  - Trocar `.profile-header {` (linha 15) por `.profile-header, .profile-header-top {`.
  - Trocar `.form-input:disabled {` (linha 194) por `.form-input:disabled, .form-input[readonly], .form-input.input-disabled {`.
  - Adicionar ao final do arquivo (antes das media queries):
    ```css
    .grid-2-col {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
    }
    .helper-text {
        font-size: 0.78rem;
        color: var(--color-text-muted, #6c757d);
        margin-top: -0.25rem;
    }
    .user-email-display {
        font-size: 0.9rem;
        color: var(--color-text-secondary, #555);
        margin: 0.25rem 0 0;
    }
    ```

#### Validação Obrigatória da Etapa 1:
```powershell
npm run lint
npm run test:front
npm run build
```

---

### ETAPA 2: Correção de Bugs Funcionais de Frontend (Relatórios, Calendário, Cardápios, Datas e Modais)

#### Tarefa 2.1: Implementar filtro `'semanal'` em `ReportView.jsx`
- **Arquivo**: `resources/js/components/ContagemGeral/ReportView.jsx` (linhas 84–95)
- **Alteração**:
  ```javascript
  case 'semanal':
      startDate = filters.startDate;
      endDate = filters.endDate;
      title = `Relatório Semanal: ${formatFriendlyDate(startDate)} a ${formatFriendlyDate(endDate)}`;
      break;
  case 'personalizado':
      startDate = filters.startDate;
      endDate = filters.endDate;
      title = `Relatório Personalizado: ${formatFriendlyDate(startDate)} a ${formatFriendlyDate(endDate)}`;
      break;
  ```

#### Tarefa 2.2: Remover tag HTML literal `<i>` em `CalendarView.jsx`
- **Arquivo**: `resources/js/components/ContagemGeral/CalendarView.jsx` (linha 55)
- **Alteração**:
  ```javascript
  // Antes:
  dMap.set(String(relacaoId), aluno.descricao || '<i>Nenhuma descrição disponível.</i>');
  // Depois:
  dMap.set(String(relacaoId), aluno.descricao || 'Nenhuma descrição disponível.');
  ```

#### Tarefa 2.3: Fechar modal de loading e exibir alerta de erro em `ContagemPage.jsx`
- **Arquivo**: `resources/js/pages/Inspetora/ContagemPage.jsx` (linhas 300–303)
- **Alteração**:
  ```javascript
  } catch (error) {
      console.error("Erro no fluxo de contagem:", error);
      Swal.fire('Erro!', error?.message || 'Não foi possível preparar a contagem. Tente novamente.', 'error');
  }
  ```

#### Tarefa 2.4: Usar data do fuso escolar (`getSchoolDate`) em `ControleProducaoPage.jsx`, `ProducaoManagementView.jsx` e `ReportPreview.jsx`
- **Arquivo 1**: `resources/js/pages/ControleProducao/ControleProducaoPage.jsx`
  - Importar `{ getSchoolDate } from '../../features/contagem';`
  - Na linha 85, substituir `new Date().toISOString().split('T')[0]` por `getSchoolDate()`.
- **Arquivo 2**: `resources/js/components/ControleProducao/ProducaoManagementView.jsx`
  - Importar `{ getSchoolDate } from '../../features/contagem';`
  - Na linha 23, substituir `new Date().toISOString().split('T')[0]` por `getSchoolDate()`.
- **Arquivo 3**: `resources/js/components/ContagemGeral/ReportPreview.jsx`
  - Importar `{ getSchoolDateFromInstant } from '../../features/contagem/schoolCalendar';`
  - Na linha 78, substituir:
    ```javascript
    const dateStr = getSchoolDateFromInstant(item.data_hora_contagem) || String(item.data_hora_contagem).slice(0, 10);
    ```

#### Tarefa 2.5: Normalizar caminho de PDF em `CardapiosPage.jsx`
- **Arquivo**: `resources/js/pages/Cardapios/CardapiosPage.jsx` (linhas 83–91)
- **Alteração**:
  ```javascript
  const handleView = (path) => {
      if (!path) return;
      let url = path;
      if (!/^https?:\/\//i.test(path)) {
          const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
          const cleanFilePath = path.replace(/^\/?(uploads\/pdf\/|uploads\/)/, '');
          url = `${cleanBaseUrl}/uploads/pdf/${cleanFilePath}`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
  };
  ```

#### Tarefa 2.6: Prevenir duplo envio em `ChatPage.jsx` e `ProfilePage.jsx`
- **Arquivo 1**: `resources/js/pages/Chat/ChatPage.jsx`
  - Adicionar `const [isSending, setIsSending] = useState(false);`.
  - No `handleSendMessage`, retornar se `!newMessage.trim() || !selectedContact || isSending`. Definir `setIsSending(true)` no início e `setIsSending(false)` no `finally`.
  - No botão `.btn-send`, usar `disabled={!newMessage.trim() || isSending}`.
  - No `setInterval` de polling (linha 153), adicionar `if (document.visibilityState === 'hidden') return;` antes de chamar `fetchAllMessages(false)`.
- **Arquivo 2**: `resources/js/pages/ProfilePage/ProfilePage.jsx`
  - Adicionar estados `isSavingProfile` e `isSavingPassword` para desabilitar os respectivos botões `<button type="submit" className="btn-save">` durante a requisição, e atualizar `localStorage.setItem('userName', name)` ao atualizar o perfil com sucesso.

#### Validação Obrigatória da Etapa 2:
- Adicionar teste em `resources/js/pages/ContagemGeral/ContagemGeralPage.test.jsx` validando a geração do relatório `Semanal`.
```powershell
npm run lint
npm run test:front
```

---

### ETAPA 3: Correção de Bugs de Regra de Negócio, Condições de Corrida e Arquitetura no Backend (Laravel)

#### Tarefa 3.1: Inverter a herança entre `Contagem` e `Contagen` conforme `AGENTS.md` §2.1.4
- **Arquivos**: `app/Models/Contagem.php` e `app/Models/Contagen.php`
- **Alterações**:
  1. Mover todo o conteúdo de `app/Models/Contagen.php` para `app/Models/Contagem.php`, garantindo:
     ```php
     namespace App\Models;

     use Database\Factories\ContagenFactory;
     use Illuminate\Database\Eloquent\Factories\HasFactory;
     use Illuminate\Database\Eloquent\Model;
     use Illuminate\Database\Eloquent\SoftDeletes;

     class Contagem extends Model
     {
         use HasFactory, SoftDeletes;

         protected $table = 'contagens';
         // ... (manter $fillable, $casts e relacionamentos turma(), user() e contagens_nes())

         protected static function newFactory(): ContagenFactory
         {
             return ContagenFactory::new();
         }
     }
     ```
  2. Em `app/Models/Contagen.php`, deixar apenas:
     ```php
     <?php

     namespace App\Models;

     class Contagen extends Contagem
     {
     }
     ```

#### Tarefa 3.2: Unificar remoção de presença do dia (`forceDelete`) e tornar `createPresence` idempotente no dia escolar
- **Arquivos**:
  - `app/Services/ContagemOperationService.php` (linha 192)
  - `app/Services/VinculoService.php` (linhas 91–104)
  - `app/Http/Requests/ContagemOperacaoRequest.php` (linhas 28 e 33)
- **Alterações**:
  1. Em `ContagemOperationService::savePresencas` (linha 192), trocar `$presence->delete();` por `$presence->forceDelete();` (para que desmarcar presença no dia atual via `/api/contagens/operacao` tenha o mesmo comportamento de `DELETE /api/contagem-nes/{id}` e não bloqueie `VinculoService::removeStudentFromNeed` com registro soft-deleted).
  2. Em `VinculoService::createPresence` (linhas 91–104), evitar duplicatas no mesmo dia escolar:
     ```php
     public function createPresence(int $relacaoId): ContagemNe
     {
         return DB::transaction(function () use ($relacaoId): ContagemNe {
             $relacao = AlunosHasNecessidade::query()
                 ->whereKey($relacaoId)
                 ->whereHas('aluno', fn ($query) => $query->whereNull('deleted_at'))
                 ->whereHas('necessidade', fn ($query) => $query->whereNull('deleted_at'))
                 ->lockForUpdate()
                 ->first();

             if (! $relacao) {
                 throw ValidationException::withMessages([
                     'id_relacao' => ['A relação entre aluno e necessidade é inválida ou inativa.'],
                 ]);
             }

             [$startUtc, $endUtc] = $this->schoolCalendar->utcWindowForDate($this->schoolCalendar->currentDate());

             $existing = ContagemNe::query()
                 ->where('alunos_has_necessidades_id', $relacao->id)
                 ->where('created_at', '>=', $startUtc)
                 ->where('created_at', '<', $endUtc)
                 ->lockForUpdate()
                 ->first();

             if ($existing) {
                 return $existing;
             }

             return ContagemNe::create([
                 'alunos_has_necessidades_id' => $relacao->id,
             ]);
         });
     }
     ```
     *(Injetar `private readonly SchoolCalendarService $schoolCalendar` no construtor de `VinculoService`).*
  3. Em `ContagemOperacaoRequest.php`, alterar:
     ```php
     'contagem_id' => ['nullable', 'integer', Rule::exists('contagens', 'id')->whereNull('deleted_at')],
     'presencas.*.presenca_id' => ['nullable', 'integer', Rule::exists('contagem_nes', 'id')->whereNull('deleted_at')],
     ```

#### Tarefa 3.3: Permitir que destinatários marquem mensagens como vistas (`visto = 's'`) em `ChatController`
- **Arquivo**: `app/Http/Controllers/Api/ChatController.php` (linhas 40–72)
- **Alterações**:
  1. Em `store()`, carregar `$chat->load('user')` antes de retornar `new ChatResource($chat)`.
  2. Em `show()`, carregar `$chat->load('user')`.
  3. Em `update(Request $request, Chat $chat)`:
     ```php
     public function update(Request $request, Chat $chat)
     {
         $validated = $request->validate([
             'mensagem_chat' => 'sometimes|string|max:100',
             'visto' => 'sometimes|in:s,n',
         ]);

         if (array_key_exists('mensagem_chat', $validated) || ! array_key_exists('visto', $validated)) {
             abort_unless((int) $chat->users_id === (int) auth()->id(), 403, 'Você só pode editar suas próprias mensagens');
         }

         $chat->update($validated);

         return (new ChatResource($chat->load('user')))->response();
     }
     ```

#### Tarefa 3.4: Permitir `inclui_total_regular` em `Categoria` e `CategoriaRequest`
- **Arquivos**:
  - `app/Models/Categoria.php` (linha 36): alterar para `protected $fillable = ['nome_categoria', 'inclui_total_regular'];`
  - `app/Http/Requests/CategoriaRequest.php` (linha 26): adicionar `'inclui_total_regular' => ['sometimes', 'boolean'],`

#### Tarefa 3.5: Transações com `lockForUpdate` em `UserService` e `AutorizadoService` + Correção em `AlunoController` e `RetryFileCleanup`
- **Arquivo 1**: `app/Services/UserService.php`
  - Mover `$this->ensureAnotherManagerExists($user)` para dentro do `DB::transaction(...)` em `update()` e `delete()`, adicionando `->lockForUpdate()` na query de gestores.
- **Arquivo 2**: `app/Services/AutorizadoService.php`
  - Na linha 18, usar query parametrizada: `->orderByRaw('CASE WHEN status = ? THEN 0 ELSE 1 END', [AutorizadoStatus::Pendente->value])`.
  - Em `update()`, `approve()` e `delete()`, envolver em `DB::transaction` usando `$locked = Autorizado::query()->lockForUpdate()->findOrFail($autorizado->id);` e em `delete()` verificar:
    ```php
    if (! $locked->status->isPendente()) {
        throw new ConflictHttpException('Não é possível excluir uma solicitação já decidida pela diretoria.');
    }
    ```
- **Arquivo 3**: `app/Http/Controllers/Api/AlunoController.php` (linha 69)
  - Trocar `if ($aluno->necessidades()->exists())` por `if ($aluno->alunosHasNecessidades()->exists())`.
- **Arquivo 4**: `app/Console/Commands/RetryFileCleanup.php` (linhas 17–21)
  - Quando `! $this->option('id')`, filtrar `$query->where(fn ($q) => $q->whereNull('next_attempt_at')->orWhere('next_attempt_at', '<=', now()));`.
- **Arquivo 5**: `app/Http/Controllers/Api/ContagemNeController.php`
  - Em `store()`, `show()` e `update()`, encadear `->load(['alunosHasNecessidade.aluno', 'alunosHasNecessidade.necessidade'])` antes de instanciar `ContagemNeResource`.

#### Validação Obrigatória da Etapa 3:
- Adicionar testes em `tests/Feature/BusinessRules/` validando as correções acima.
```powershell
php artisan test
```

---

### ETAPA 4: Padronização Arquitetural Frontend (`useAuth`, `usePermissions` e Otimização do `MainLayout`)

#### Tarefa 4.1: Alinhar `usePermissions.js` com `AGENTS.md` §2.2.4
- **Arquivo**: `resources/js/hooks/usePermissions.js`
- **Alteração**: Garantir que o hook retorne `isStaff`, `isInspetora`, `isNutri`, `isDiretor`, `isDiretora`, `canApprove` e `canApproveAutorizado`.

#### Tarefa 4.2: Substituir leituras manuais de `localStorage` e números mágicos nas páginas
- **Arquivos**:
  - `resources/js/pages/Autorizados/AutorizadosPage.jsx`: Usar `const { isNutri, isDiretor } = usePermissions();` em vez de constantes locais `LEVEL_*`.
  - `resources/js/pages/Login/LoginPage.jsx`: Usar `ROLE_HOME_ROUTES[String(level)] || '/'` de `../../constants/roles`.
  - `resources/js/pages/Chat/ChatPage.jsx`, `resources/js/pages/GerenciarUsuarios/UsuariosPage.jsx` e `resources/js/pages/ProfilePage/ProfilePage.jsx`: Usar `ROLE_LABELS` de `../../constants/roles`.

#### Tarefa 4.3: Evitar chamadas repetidas a `GET /api/user` em `MainLayout.jsx`
- **Arquivo**: `resources/js/layouts/MainLayout/MainLayout.jsx` (linhas 47–64)
- **Alteração**: Remover `location.pathname` do array de dependências do `useEffect` que chama `getUserData()`, mantendo `location.pathname` apenas no `useEffect` que fecha o menu lateral (`setIsMenuOpen(false)`).

#### Validação Obrigatória da Etapa 4:
```powershell
npm run lint
npm run test:front
```

---

### ETAPA 5: Responsividade Mobile/Tablet e Interação Touch (UI/UX)

#### Tarefa 5.1: Adicionar Media Queries Responsivas às telas de Gestão e Relatórios
- **Arquivos**:
  1. `resources/js/pages/Planejamento/PlanejamentoPage.css`:
     - Em `.search-input:focus` (linha 109), trocar `width: 400px;` por `width: min(400px, 100%);`.
     - Na linha 473, substituir a propriedade inexistente `ring: 2px solid rgba(139, 0, 0, 0.1);` por `box-shadow: var(--focus-ring);`.
     - Adicionar ao final:
       ```css
       @media (max-width: 1100px) {
           .planejamento-container-grid {
               grid-template-columns: 1fr;
               height: auto;
               overflow: visible;
           }
           .grid-column {
               max-height: 520px;
           }
       }
       ```
  2. `resources/js/pages/ControleProducao/ControleProducaoPage.css`:
     - Adicionar ao final:
       ```css
       @media (max-width: 1024px) {
           .producao-layout-grid-v2,
           .producao-layout-grid-v2.mode-report {
               grid-template-columns: 1fr;
               height: auto;
           }
           .content-header {
               height: auto;
               padding: 1rem;
               flex-wrap: wrap;
           }
           .header-actions {
               width: 100%;
               flex-wrap: wrap;
           }
           .search-bar-wrapper {
               width: 100%;
               flex: 1 1 200px;
           }
       }
       ```
  3. `resources/js/components/ContagemGeral/CalendarView.css` e `ReportView.css`:
     - Adicionar `@media (max-width: 1024px)` convertendo `.calendar-main-grid` e `.report-main-grid-v2` para `grid-template-columns: 1fr;` e reduzindo o `padding` de `.calendar-grid-area` para `1rem`.
  4. `resources/js/components/ContagemGeral/ReportPreview.css` e `resources/js/components/ControleProducao/ProducaoReportPreview.css`:
     - Ajustar `.report-page-a4` para `width: 100%; max-width: 210mm; box-sizing: border-box;` e em `@media (max-width: 768px)` usar `padding: 1rem;`.

#### Tarefa 5.2: Corrigir interações presas em `:hover` para dispositivos Touch e Teclado
- **Arquivos**:
  1. `resources/js/pages/Planejamento/PlanejamentoPage.css` (linhas 335–353):
     - Permitir que `.card-actions` apareça também em `:focus-within` e em telas touch:
       ```css
       .aluno-card:hover .card-actions,
       .aluno-card:focus-within .card-actions {
           transform: translateY(0%);
       }
       @media (hover: none), (max-width: 1024px) {
           .card-actions {
               transform: translateY(0%);
           }
       }
       ```
  2. `resources/js/pages/Cronograma/CronogramaPage.jsx` e `CronogramaPage.css`:
     - Em `CronogramaPage.jsx`, adicionar `const [isDrawerOpen, setIsDrawerOpen] = useState(false);`, aplicar a classe `${isDrawerOpen ? 'is-open' : ''}` em `.sidebar-drawer` e adicionar `onClick={() => setIsDrawerOpen((prev) => !prev)}` na `.drawer-tab`.
     - Em `CronogramaPage.css`, incluir `.sidebar-drawer.is-open` e `.sidebar-drawer:focus-within` junto com `.sidebar-drawer:hover`, e tornar `.delete-schedule-button` visível (`opacity: 1`) em `:focus-visible` e `@media (hover: none), (max-width: 1024px)`.

#### Validação Obrigatória da Etapa 5:
```powershell
npm run lint
npm run test:front
npm run build
```

---

### ETAPA 6: Acessibilidade (a11y), Labels de Formulários e Contraste WCAG AA

#### Tarefa 6.1: Adicionar `<label>` visíveis aos modais de Controle de Produção e associar `htmlFor` nos formulários
- **Arquivos**:
  - `resources/js/pages/ControleProducao/ControleProducaoPage.jsx` (linhas 81–102)
  - `resources/js/components/ControleProducao/ProducaoManagementView.jsx` (linhas 19–41)
  - `resources/js/pages/ProfilePage/ProfilePage.jsx` (linhas 148–216)
  - `resources/js/components/ControleProducao/ProducaoFilterPanel.jsx` (linhas 108–135)
  - `resources/js/components/ContagemGeral/ReportFilterPanel.jsx` (linhas 53–146)
- **Alterações**:
  1. No HTML do modal de Produção (`ControleProducaoPage.jsx` e `ProducaoManagementView.jsx`), adicionar `<label for="swal-...">` acima de cada campo (`Alimento`, `Data`, `Quantidade`, `Medida`, `Pessoas`, `Sobra Limpa`, `Desperdício`).
  2. Em `ProfilePage.jsx`, `ProducaoFilterPanel.jsx` e `ReportFilterPanel.jsx`, associar cada `<label htmlFor="...">` ao `id` do seu respectivo `<input>` ou `<select>`.

#### Tarefa 6.2: Acessibilidade de Teclado no Menu Lateral, Header e Chat
- **Arquivos**:
  - `resources/js/components/Header/Header.jsx`
  - `resources/js/components/navigation/InspetoraNav/InspetoraNav.jsx`
  - `resources/js/components/navigation/NutriNav/NutriNav.jsx`
  - `resources/js/components/navigation/DiretoraNav/DiretoraNav.jsx`
  - `resources/js/components/navigation/InspetoraNav/InspetoraNav.css`
  - `resources/js/pages/Chat/ChatPage.jsx`
- **Alterações**:
  1. Em `Header.jsx`, adicionar `aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}` no botão `.menu-hamburguer`.
  2. Em `InspetoraNav.jsx`, `NutriNav.jsx` e `DiretoraNav.jsx`, adicionar `aria-hidden={!isOpen}` na tag `<nav>` e preencher `Data de Hoje:` no `<small>` de `InspetoraNav.jsx` e `NutriNav.jsx`.
  3. Em `InspetoraNav.css` (e nos CSS de navegação), adicionar `visibility: hidden;` em `.menu-lateral` e `visibility: visible;` em `.menu-lateral.ativo` para evitar que o usuário navegue com `Tab` pelos links ocultos quando o menu estiver fechado.
  4. Em `ChatPage.jsx`, adicionar `aria-label="Escreva uma mensagem"` no input `.chat-input`, `aria-label="Enviar mensagem"` no botão `.btn-send` e `role="log" aria-live="polite"` na `.messages-area`.

#### Tarefa 6.3: Corrigir Contraste WCAG no Card Amarelo do Dashboard e Estados `:focus-visible`
- **Arquivo 1**: `resources/js/pages/DashboardNutri/DashboardNutri.css` (linhas 86 e 105)
  - Em `.dash-card.nai-card .dash-card-header`, adicionar `color: #212529;` e em `.dash-card.nai-card .dash-card-header .header-icon`, definir `color: #212529;` (elevando o contraste de `1.63:1` para `10.4:1`).
- **Arquivo 2**: `resources/js/pages/Autorizados/AutorizadosPage.css` (linha 189) e `resources/js/pages/Cronograma/CronogramaPage.css` (linha 139)
  - Adicionar `box-shadow: var(--focus-ring);` no estado `:focus`.

#### Validação Obrigatória da Etapa 6:
```powershell
npm run lint
npm run test:front
```

---

### ETAPA 7: Consolidação de Design Tokens, Limpeza de Código Morto e Homologação Final Completa

#### Tarefa 7.1: Remover Arquivos Mortos e CSS Duplicado de Navegação
- **Arquivos para unificar**:
  - Alterar `NutriNav.jsx` e `DiretoraNav.jsx` para importarem `../InspetoraNav/InspetoraNav.css` e remover os arquivos idênticos `NutriNav.css` e `DiretoraNav.css`.
  - Remover arquivos órfãos sem uso no projeto:
    - `resources/js/components/ContagemGeral/ReportFilters.jsx`
    - `resources/js/components/DashboardWelcomeModal.jsx`
    - `app/Http/Controllers/Api/NecessidadesHasCronogramaController.php`
    - `app/Http/Requests/AlunosHasNecessidadeRequest.php`
    - `app/Http/Requests/NecessidadesHasCronogramaRequest.php`
  - Padronizar `font-family: var(--font-family-base);` nos arquivos CSS de páginas.

#### Tarefa 7.2: Bateria Completa de Homologação (Critério de Aceite Final do `AGENTS.md`)
Ao finalizar a Etapa 7, executar todos os 5 comandos obrigatórios na ordem abaixo:

```powershell
# 1. Testes Backend (PHPUnit)
php artisan test

# 2. Testes Frontend (Vitest)
npm run test:front

# 3. Linter (ESLint)
npm run lint

# 4. Build de Produção (Vite)
npm run build

# 5. Testes End-to-End em Chromium Real (Playwright)
npm run test:e2e
```
