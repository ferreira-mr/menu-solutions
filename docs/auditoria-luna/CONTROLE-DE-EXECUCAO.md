# Controle de execução das correções

Estado inicial em 07/09/2026: **somente auditoria e documentação concluídas**. Todas as tarefas de implementação estão pendentes. O Luna deve atualizar este arquivo durante o trabalho.

Status permitidos: Pendente, Em execução, Concluída, Parcial, Dependência externa. “Concluída” exige código e verificação dos critérios; “Parcial” deve listar o que falta. Não usar o resultado da baseline como prova de correção.

## Tarefas na ordem do plano

| Tarefa | Entrega | Achados | Testes | Status | Evidência da implementação |
| --- | --- | --- | --- | --- | --- |
| T00 | Isolamento dos testes | A20 | Q01–Q03 | Concluída | Registro T00 abaixo; PHPUnit 62/62, Vitest 116/116, E2E 26/26 e guardas Q02/Q03 aprovados |
| T01 | Login e cadastro público | A01/A02 | S01–S03 | Concluída | Registro T01 abaixo; AuthenticationTest 7/7, backend 64/64 e E2E 26/26 aprovados |
| T02 | HTML seguro nos formulários | A03 | S04–S06 | Concluída | Registro T02 abaixo; Vitest 122/122, lint/build aprovados e E2E 27/27 |
| T03 | Bootstrap sem contas E2E | A04 | S07–S09 | Concluída | Registro T03 abaixo; PHPUnit 71/71 e E2E 27/27 aprovados |
| T04 | Revogação de tokens | A05 | S10–S12 | Concluída | Registro T04 abaixo; PHPUnit 77/77, frontend 122/122 e E2E 27/27 aprovados |
| T05 | Datas civis na API | A06 | C01–C04 | Concluída | Registro T05 abaixo; PHPUnit 79/79, frontend 122/122, lint/build e E2E 27/27 aprovados |
| T08 | Contratos dos vínculos | A08 | C11–C13 | Concluída | Registro T08 abaixo; contratos PHP 2/2 e adaptadores frontend 3/3 aprovados |
| T09 | Telas de planejamento/NES | A08 | C14–C15 | Concluída | Registro T09 abaixo; PHPUnit 82/82, frontend 127/127, lint/build e E2E 27/27 aprovados |
| T22 | Dia escolar e virada | A21 | C23–C25 | Concluída | Registro T22 abaixo; PHPUnit 87/87, frontend 132/132, lint/build e E2E 27/27 aprovados |
| T06 | Operação atômica/idempotência | A07 | C08–C10 | Concluída | Registro T06 abaixo; operação 7/7, PHPUnit 92/92, frontend 132/132 e E2E 27/27 aprovados |
| T07 | Rascunho e confirmação | A07 | C05–C09 | Concluída | Registro T07 abaixo; testes da tela 8/8, frontend 136/136, lint/build e E2E 29/29 aprovados |
| T10 | Paginação do servidor | A09 | C16–C17 | Concluída | Registro T10 abaixo; contratos 2/2, PHPUnit 96/96 aprovados |
| T11 | Listas/relatórios completos | A09 | C18–C19 | Concluída | Registro T11 abaixo; helper 5/5, serviços 2/2, frontend 143/143, lint/build e E2E 29/29 aprovados |
| T12 | Revisão de autorizações | A10 | P01–P04 | Concluída | Registro T12 abaixo; fluxo 7/7, migração 1/1, PHPUnit 104/104, frontend 144/144, lint/build e E2E 29/29 aprovados |
| T13 | Permissões consistentes | A11 | P05–P08 | Concluída | Registro T13 abaixo; matriz backend 5/5, PHPUnit 109/109, frontend 144/144, lint/build e E2E 31/31 aprovados |
| T14 | Validação de unicidade | A12 | V01–V03 | Concluída | Registro T14 abaixo; unicidade 3/3, PHPUnit 112/112, frontend 144/144, lint/build e E2E 31/31 aprovados |
| T15 | Limites de dados | A12 | V04–V05 | Concluída | Registro T15 abaixo; limites 3/3, PHPUnit 115/115, frontend 144/144, lint/build e E2E 31/31 aprovados |
| T16 | Integridade de relações | A13/A14 | V06–V10 | Concluída | Registro T16 abaixo; integridade 4/4, PHPUnit 119/119, frontend 144/144, lint/build e E2E 31/31 aprovados |
| T17 | Atualização/histórico do chat | A15 | C20–C22 | Concluída | Registro T17 abaixo; chat 6/6, ChatContractTest 5/5, PHPUnit 120/120, frontend 148/148, lint/build e E2E 33/33 aprovados |
| T18 | Consistência de PDFs/banco | A16 | F01–F04 | Concluída | Registro T18 abaixo; storage 10/10, PHPUnit 130/130, frontend 148/148, lint/build e E2E 33/33 aprovados |
| T19 | Dependências de PDF | A17 | F05–F07 | Concluída | Registro T19 abaixo; dependências 1/1, builders 2/2, E2E 36/36, frontend 151/151, PHPUnit 130/130, lint/build e audit npm aprovados |
| T23 | Total regular/Outros | A22 | C26–C27 | Concluída | Registro T23 abaixo; contrato explícito de classificação e totais 28/15/43 aprovados; PHPUnit 131/131, frontend 155/155, lint/build e E2E 36/36 aprovados |
| T24 | Fotos privadas/chat mínimo | A23 | S13–S15 | Concluída | Registro T24 abaixo; fotos privadas, migração idempotente e chat mínimo aprovados; PHPUnit 134/134, frontend 158/158, lint/build e E2E 37/37 aprovados |
| T20 | Release e dados persistentes | A18 | I01–I03 | Pendente | — |
| T21 | Atualização segura da VM | A19 | I04–I06 | Pendente | — |

## Registro por tarefa

### T00

```text
Tarefa: T00 — Isolamento dos testes
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree sobre cc86bac; apenas a documentação de auditoria estava adicionada antes da implementação.
Achado revalidado? Sim. O PHPUnit apontava para o public normal e CardapioAndStorageTest removia public/uploads/pdf no teardown; o runner E2E usava migrate:fresh sem ambiente/banco/diretório próprios e podia reutilizar servidor externo.
Arquivos alterados: bootstrap/app.php; tests/TestCase.php; tests/Feature/Testing/IsolationTest.php; tests/Feature/BusinessRules/CardapioAndStorageTest.php; app/Console/Commands/AssertTestingIsolation.php; config/view.php; scripts/testing/run-e2e.mjs; scripts/testing/run-e2e.test.mjs; playwright.config.js; tests/e2e/auth.setup.js; tests/e2e/auth-paths.js; cinco specs E2E; package.json; .github/workflows/tests.yml.
Teste que falhou antes (comando e motivo): php artisan test --filter=IsolationTest — 1 falha e 1 aprovação; a falha confirmou que o public efetivo ainda era o diretório normal.
Correção aplicada: PHPUnit cria public/storage/views próprios em test-results/phpunit-runtime, usa SQLite em memória e copia apenas public/build para renderização; o bootstrap rejeita cache/configuração insegura e exige token/path de teste; o runner E2E rejeita variáveis herdadas e cache, cria SQLite/uploads/storage/views/auth próprios, valida o runtime antes de migrar, usa porta exclusiva, servidor PHP próprio e workers=1; o teardown de upload normal foi removido; estados de autenticação são gravados somente no runtime.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=IsolationTest — 3 testes/12 asserções aprovados; node --test scripts/testing/run-e2e.test.mjs — 4 testes aprovados (Q02/Q03); npm run test:e2e:prepare — preparação isolada aprovada; npm run test:e2e — código 0, 26/26 cenários aprovados, runtime próprio e porta liberada; php artisan test — 62 testes/278 asserções aprovados; npm run test:front — 32 arquivos/116 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — build aprovado durante o runner E2E.
Contratos/migrações afetados: nenhuma migration, rota legada ou contrato de resposta alterado; migrate:fresh permanece restrito ao SQLite criado pelo runner E2E.
Decisões/defaults utilizados: SQLite em memória no PHPUnit; SQLite físico exclusivo por execução E2E; public/storage/views/auth e relatórios sob test-results; sem cache de configuração; servidor e preparação compartilham a mesma configuração; nenhuma sessão é gravada em tests/e2e/.auth.
Limitações e trabalho restante: a auditoria não cobriu MySQL real; não foram feitos ensaios de VM/Nginx/Terraform; os testes reais de negócio das tarefas T01+ permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T01

```text
Tarefa: T01 — Fechar os atalhos de autenticação
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T00, sem commit criado.
Achado revalidado? Sim. AuthController aceitava as senhas fixas password/password123 quando o ambiente efetivo era local; POST anônimo /api/register criava Staff e aceitava payload com nivel_user elevado, retornando 201.
Arquivos alterados: app/Http/Controllers/AuthController.php; tests/Feature/Api/AuthenticationTest.php; tests/Feature/ApiCoverageTest.php.
Teste que falhou antes (comando e motivo): php artisan test --filter=AuthenticationTest — 2 falhas: cadastro esperava 403 mas recebia 201; senhas fixas esperavam 401 mas recebiam 200 no ambiente local efetivo.
Correção aplicada: /api/register continua preservada, mas responde 403 explícito antes de validar/criar usuário ou token; o login valida exclusivamente Hash::check em local, testing e production; o fluxo administrativo autenticado permaneceu disponível.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=AuthenticationTest — 7 testes/36 asserções aprovados; php artisan test --filter=ApiCoverageTest — 16 testes/95 asserções aprovados; php artisan test — 64 testes/294 asserções aprovados; npm run test:front — 32 arquivos/116 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0; npm run test:e2e — código 0, 26/26 cenários aprovados no runtime próprio; node --test scripts/testing/run-e2e.test.mjs — 4 testes Q02/Q03 aprovados.
Contratos/migrações afetados: rota POST /api/register e contrato de resposta foram preservados com mudança intencional para 403; /api/login mantém token, UserResource e 401 para credenciais inválidas; nenhuma migration foi criada.
Decisões/defaults utilizados: cadastro público desativado conforme A02; criação de usuários segue /api/users autenticado e autorizado; mensagens de NIF inexistente e senha inválida permanecem uniformes; perfis continuam usando UserRole.
Limitações e trabalho restante: validação automatizada usa SQLite isolado; MySQL real e testes de implantação permanecem pendentes; os achados T02+ ainda não foram tratados.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T02

```text
Tarefa: T02 — HTML seguro nos formulários
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T01, sem commit criado.
Achado revalidado? Sim. DetailsPanel renderizava aluno.descricao com dangerouslySetInnerHTML; UsuariosPage interpolava nomes, NIF, opções e placeholders em html de SweetAlert; outras telas interpolavam dados de negócio em formulários/listas, títulos e URLs de imagens/PDF.
Arquivos alterados: resources/js/utils/safeDom.js; resources/js/utils/safeDom.test.js; resources/js/components/ContagemGeral/DetailsPanel.jsx; resources/js/components/ContagemGeral/DetailsPanel.test.jsx; resources/js/components/ControleProducao/ProducaoManagementView.jsx; resources/js/components/ControleProducao/ProducaoFilterPanel.test.jsx; resources/js/components/DashboardWelcomeModal.jsx; resources/js/components/DashboardWelcomeModal.test.jsx; resources/js/pages/Autorizados/AutorizadosPage.jsx; resources/js/pages/Cardapios/CardapiosPage.jsx; resources/js/pages/Chat/ChatPage.jsx; resources/js/pages/ControleProducao/ControleProducaoPage.jsx; resources/js/pages/DashboardNutri/DashboardNutri.jsx; resources/js/pages/GerenciarCategorias/CategoriasPage.jsx; resources/js/pages/GerenciarUsuarios/UsuariosPage.jsx; resources/js/pages/GerenciarUsuarios/UsuariosPage.test.jsx; resources/js/pages/Inspetora/ContagemPage.jsx; resources/js/pages/Inspetora/ContagemPage.test.jsx; resources/js/pages/Inspetora/ViewCardapioPage.jsx; resources/js/pages/Planejamento/PlanejamentoPage.jsx; resources/js/pages/ProfilePage/ProfilePage.jsx; tests/e2e/xss-safety.spec.js.
Teste que falhou antes (comando e motivo): npx vitest run resources/js/components/ContagemGeral/DetailsPanel.test.jsx resources/js/pages/GerenciarUsuarios/UsuariosPage.test.jsx — 2 falhas em 11 testes; a descrição adversarial virou elementos img/strong no DetailsPanel e o modal de usuário não expôs titleText nem valor literal no input.
Correção aplicada: formulários e listas de SweetAlert são montados com elementos DOM, textContent, value e options controladas; títulos com dados usam titleText/text; descrição é renderizada como texto React; URLs de imagens/PDF aceitam somente HTTP(S) e nomes de arquivo público seguros; paginação usa rótulos textuais. O contrato das requisições, permissões, rotas e payloads foi preservado.
Testes após correção (comando, ambiente, resultado): npx vitest run nos alvos T02 — 4 arquivos/18 testes aprovados; npm run test:front — 34 arquivos/122 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com o aviso já existente de chunks maiores que 500 kB; php artisan test — 64 testes/294 asserções aprovados; npm run test:e2e — código 0, 27/27 cenários aprovados no runtime isolado, incluindo o cenário real de SweetAlert com nome adversarial, edição e salvamento; git diff --check — aprovado.
Contratos/migrações afetados: nenhum contrato HTTP, rota legada, migration, banco ou regra de negócio foi alterado.
Decisões/defaults utilizados: conteúdo dinâmico fica em nós DOM/React; somente conteúdo legal fixo continua em html estático; fallback de imagem mantém avatar padrão; URLs externas de PDF são bloqueadas quando não são HTTP(S); o E2E grava o usuário Staff apenas no banco/runtime isolado.
Limitações e trabalho restante: a validação cobre jsdom, build e Chromium local; MySQL real, implantação e os achados T03+ permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T03

```text
Tarefa: T03 — Separar bootstrap de dados E2E
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T02, sem commit criado.
Achado revalidado? Sim. DatabaseSeeder chamava E2eSeeder, que criava contas com senha conhecida, catálogo e fatos de demonstração; updateOrCreate redefinia credenciais em reexecuções; o provisionamento executava db:seed sem separar dados de demonstração.
Arquivos alterados: database/seeders/DatabaseSeeder.php; database/seeders/CatalogSeeder.php; database/seeders/E2eSeeder.php; app/Console/Commands/BootstrapAdmin.php; deploy/terraform/scripts/provision-vm.sh; deploy/docs/GUIA_IMPLANTACAO_ESCOLA.md; README.md; tests/Feature/Testing/SeederSafetyTest.php.
Teste que falhou antes (comando e motivo): php artisan test --filter=SeederSafetyTest — 4 falhas; o seeder padrão encontrou 3 usuários/fatos operacionais, o E2eSeeder não recusou produção ou SQLite não identificado e o comando de bootstrap não existia.
Correção aplicada: DatabaseSeeder chama somente CatalogSeeder; o catálogo restaura a linha canônica soft-deleted antes de criar e usa chaves existentes; E2eSeeder exige APP_ENV=testing, token e SQLite dentro de runtime identificado sob test-results, cria contas com firstOrCreate e mantém fixtures apenas no E2E; BootstrapAdmin coleta a senha com secret(), valida tamanho/confirmação, cria UserRole::Diretor e não altera NIF existente; o provisionamento chama explicitamente CatalogSeeder e o guia documenta o bootstrap protegido.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=SeederSafetyTest — 7 testes/29 asserções aprovados; php artisan test — 71 testes/323 asserções aprovados; cinco arquivos PHP novos/alterados passaram em php -l; npm run test:e2e — código 0, 27/27 cenários aprovados após preparar o E2eSeeder no runtime isolado; a bateria frontend/lint/build de T02 permanece aprovada e não houve alteração frontend nesta tarefa.
Contratos/migrações afetados: nenhuma migration, rota ou contrato HTTP foi alterado; a execução de produção deixou de carregar fixtures E2E, mantendo o catálogo inicial.
Decisões/defaults utilizados: registros de catálogo soft-deleted são restaurados mantendo seus IDs; fixtures operacionais continuam somente no E2eSeeder; o primeiro gestor é um Diretor e sua senha nunca é argumento nem saída; identidade existente por NIF é preservada sem reset.
Limitações e trabalho restante: MySQL real, interação operacional na VM e implantação escolar não foram executados; T04 e demais achados do plano continuam pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T04

```text
Tarefa: T04 — Revogar sessões após mudanças sensíveis
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T03, sem commit criado.
Achado revalidado? Sim. UserController atualizava senha/perfil e fazia soft-delete sem revogar tokens da gestão; somente o reset próprio revogava, fora de uma transação explícita.
Arquivos alterados: app/Services/UserService.php; app/Http/Controllers/Api/UserController.php; tests/Feature/Api/UserSessionSecurityTest.php.
Teste que falhou antes (comando e motivo): php artisan test --filter=UserSessionSecurityTest — 3 falhas em 5 testes; o token antigo continuava respondendo 200 após senha/perfil administrativos e permanecia no banco após exclusão.
Correção aplicada: UserService concentra update, delete e troca de senha em DB::transaction; alteração de senha ou perfil revoga todos os tokens do usuário afetado, exclusão revoga antes de concluir o soft-delete e edição simples de nome mantém a sessão. O reset próprio reutiliza o mesmo serviço após validar a senha atual; falhas durante a revogação fazem rollback da alteração.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=UserSessionSecurityTest — 6 testes/20 asserções aprovados; php artisan test — 77 testes/343 asserções aprovados; npm run test:front — 34 arquivos/122 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com aviso não bloqueante de chunks maiores que 500 kB; npm run test:e2e — código 0, 27/27 cenários aprovados no runtime isolado; git diff --check — aprovado.
Contratos/migrações afetados: nenhuma rota, resposta, migration ou regra de permissão foi alterada; tokens de edição simples seguem válidos e respostas de reset permanecem compatíveis.
Decisões/defaults utilizados: senha e mudança efetiva de perfil são sensíveis; nome/e-mail não revogam sessão; o token usado no reset próprio também é revogado e o cliente deve autenticar novamente; não foi criado campo de desativação.
Limitações e trabalho restante: o cenário de falha transacional usa erro de query simulado em SQLite; validação concorrente em MySQL real e os achados T05+ permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T05

```text
Tarefa: T05 — Corrigir as datas dos Resources
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T04, sem commit criado.
Achado revalidado? Sim. Os quatro Resources devolviam os atributos date como Carbon diretamente; o endpoint de detalhe de contagem respondeu 2026-09-07T00:00:00.000000Z, contrariando o contrato civil YYYY-MM-DD usado pelos filtros e inputs.
Arquivos alterados: app/Http/Resources/ContagenResource.php; app/Http/Resources/DashboardResource.php; app/Http/Resources/AlunoResource.php; app/Http/Resources/ControleDeProducaoEConsumoResource.php; tests/Feature/Api/ResourceContractsTest.php.
Teste que falhou antes (comando e motivo): php artisan test --filter=ResourceContractsTest — 1 teste falhou; data.data_contagem retornava 2026-09-07T00:00:00.000000Z em vez de 2026-09-07.
Correção aplicada: os campos civis data_contagem, data_nascimento e data_alimento agora usam toDateString() nos Resources, preservando null; timestamps continuam sendo serializados pelo Laravel como ISO/UTC.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=ResourceContractsTest — 2 testes/12 asserções aprovados; php artisan test — 79 testes/355 asserções aprovados; npm run test:front — 34 arquivos/122 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com o aviso não bloqueante de chunks maiores que 500 kB; npm run test:e2e — código 0, 27/27 cenários aprovados no runtime isolado, incluindo fluxos de contagem, dashboard e produção.
Contratos/migrações afetados: contrato HTTP de datas civis foi alinhado a YYYY-MM-DD; timestamps ISO/UTC, quantidades e IDs foram preservados; nenhuma rota legada, migration ou regra de negócio foi alterada.
Decisões/defaults utilizados: datas sem horário representam dias civis e não devem sofrer conversão de fuso; datas nulas permanecem null; a correção ficou restrita à camada Resource, sem ampliar T05 para o ajuste de timezone civil previsto em T22.
Limitações e trabalho restante: MySQL real, implantação/VM e validação de exportações não foram executados; consumidores que ainda usam conversão de data por ISO e o comportamento de virada do dia ficam para T22; T06 em diante permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T08

```text
Tarefa: T08 — Contratos de vínculo na API e adaptadores
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T05, sem commit criado.
Achado revalidado? Sim. O detalhe de necessidade enviava alunos relacionados sem o ID da relação; o serviço frontend devolvia o envelope inteiro, enquanto os consumidores liam o objeto; cronograma trazia IDs misturados no registro aninhado; getDiasDaRelacao apontava para uma rota GET inexistente.
Arquivos alterados: app/Http/Resources/AlunoResource.php; resources/js/services/modules/escolar.api.js; resources/js/services/modules/cronograma.api.js; resources/js/services/api.test.js; tests/Feature/Api/RelationshipContractsTest.php; resources/js/services/relationshipContracts.test.js.
Teste que falhou antes (comando e motivo): php artisan test --filter=RelationshipContractsTest — 1 de 2 testes falhou porque alunos.0.alunos_has_necessidades_id era null; npx vitest run resources/js/services/relationshipContracts.test.js — 3 de 3 testes falharam por envelope não desembrulhado, cronograma não normalizado e agendamento inválido não filtrado.
Correção aplicada: AlunoResource expõe alunos_has_necessidades_id e pivot.id apenas quando o pivot da tabela correta está carregado; getNecessidadeComAlunos retorna response.data; getCronograma preserva meta/links e normaliza cada agendamento para agendamento_id, relacao_id, cronograma_id, aluno_id e necessidade_id, mantendo aluno/necessidade aninhados; registros sem relação válida são ignorados e registrados; o export morto getDiasDaRelacao foi removido sem criar rota nova.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=RelationshipContractsTest — 2 testes/15 asserções aprovados; npx vitest run resources/js/services/relationshipContracts.test.js — 1 arquivo/3 testes aprovados; a suíte completa e o E2E do bloco de fluxo escolar serão repetidos após T09/T22, que atualizam os consumidores para os DTOs normalizados.
Contratos/migrações afetados: envelopes HTTP, rotas POST/DELETE de agendamento e relações aninhadas foram preservados; IDs de aluno, necessidade, vínculo, agendamento e cronograma são separados no DTO frontend; nenhuma migration foi criada.
Decisões/defaults utilizados: pivot.id só aparece no contexto de Necessidade::alunos(); aluno isolado não recebe vínculo inventado; IDs vindos da API são convertidos para inteiros positivos; agendamento sem relação aluno+necessidade não fica disponível para mutação; a rota GET não existente não foi inventada.
Limitações e trabalho restante: Planejamento, Cronograma, dashboard e Contagem ainda consumem aliases antigos e serão ajustados em T09; MySQL real, exportações e homologação de implantação continuam pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T09

```text
Tarefa: T09 — Consumidores de planejamento, cronograma e NES
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T08, sem commit criado.
Achado revalidado? Sim. Cronograma, Planejamento, Contagem e Dashboard usavam IDs de aluno, presença, agendamento e vínculo de forma intercambiável; isso podia colapsar o mesmo aluno com duas necessidades e enviar uma mutação para a relação errada.
Arquivos alterados: app/Http/Resources/ContagemNeResource.php; resources/js/pages/Cronograma/CronogramaPage.jsx; resources/js/pages/Planejamento/PlanejamentoPage.jsx; resources/js/pages/Inspetora/ContagemPage.jsx; resources/js/pages/DashboardNutri/DashboardNutri.jsx; resources/js/components/ContagemGeral/CalendarView.jsx; tests/Feature/Api/RelationshipContractsTest.php; resources/js/pages/Cronograma/CronogramaPage.test.jsx; resources/js/pages/Planejamento/PlanejamentoPage.test.jsx; resources/js/pages/Inspetora/ContagemPage.test.jsx; resources/js/pages/DashboardNutri/DashboardNutri.test.jsx.
Teste que falhou antes (comando e motivo): php artisan test --filter=RelationshipContractsTest — 2 testes aprovados e 1 falha após a inclusão do contrato de presença, pois relacao_id não existia; npx vitest run nos consumidores de Cronograma/Planejamento — 3 falhas no Cronograma porque os consumidores ainda esperavam os IDs/aliases antigos.
Correção aplicada: ContagemNeResource passou a separar relacao_id, aluno_id, necessidade_id e o id da presença; Cronograma e Planejamento usam o vínculo explícito para seleção e mutação, mantendo aluno_id apenas para filtrar a participação do aluno; Contagem grava e consulta presenças pelo vínculo; Dashboard e CalendarView deixam de usar aluno.id como relação; relações ausentes bloqueiam a mutação e são registradas; chaves de ocorrência do cronograma são determinísticas.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=RelationshipContractsTest — 3 testes/21 asserções aprovados; npx vitest run resources/js/services/relationshipContracts.test.js resources/js/pages/Cronograma/CronogramaPage.test.jsx resources/js/pages/Planejamento/PlanejamentoPage.test.jsx resources/js/pages/Inspetora/ContagemPage.test.jsx resources/js/pages/DashboardNutri/DashboardNutri.test.jsx resources/js/components/ContagemGeral/CalendarView.test.jsx — 6 arquivos/22 testes aprovados; php artisan test — 82 testes/376 asserções aprovados em execução isolada; npm run test:front — 35 arquivos/127 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com aviso não bloqueante de chunks maiores que 500 kB; npm run test:e2e — código 0, 27/27 cenários aprovados no runtime isolado.
Contratos/migrações afetados: o contrato de presença ganhou os IDs explícitos sem remover o id do registro; aluno.id no objeto aninhado continua sendo o aluno, e relacao_id identifica o vínculo NES; rotas POST/DELETE de dias continuam usando /alunos-necessidades/{relacao}/dias; nenhuma migration ou rota legada foi alterada.
Decisões/defaults utilizados: o mesmo aluno com necessidades distintas permanece em relações distintas; o filtro de agenda usa aluno_id, mas associação, agenda, presença e remoção usam relacao_id; agendamento inválido sem relação não é mutável; não foi criado fallback para IDs aninhados ambíguos.
Limitações e trabalho restante: não houve validação contra MySQL real nem homologação de interação escolar/VM; os cenários E2E gerais passaram, mas não foi criado um cenário Chromium dedicado para duas necessidades do mesmo aluno; T22 e as demais tarefas do plano continuam pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T22

```text
Tarefa: T22 — Unificar o dia escolar e a virada de data
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T09, sem commit criado.
Achado revalidado? Sim. O backend calculava criação, edição, dashboard e bloqueios com today()/now() em UTC; o filtro NES usava whereDate em UTC; as telas usavam toISOString()/getDay() do navegador e o layout mantinha a data até a remontagem.
Arquivos alterados: app/Services/SchoolCalendarService.php; app/Http/Controllers/Api/SchoolCalendarController.php; app/Http/Controllers/Api/ContagemNeController.php; app/Http/Controllers/Api/ContagenController.php; app/Http/Controllers/DashboardController.php; app/Services/ContagemService.php; config/app.php; .env.example; routes/api.php; tests/Feature/Api/SchoolCalendarTest.php; tests/Feature/ApiCoverageTest.php; tests/Feature/BusinessRules/ContagemBusinessRulesTest.php; tests/Feature/BusinessRules/ContagemNesBusinessRulesTest.php; resources/js/features/contagem/schoolCalendar.js; resources/js/features/contagem/schoolCalendar.test.js; resources/js/features/contagem/useSchoolCalendar.js; resources/js/features/contagem/useSchoolCalendar.test.js; resources/js/features/contagem/index.js; resources/js/services/modules/contextoEscolar.api.js; resources/js/services/modules/contagens.api.js; resources/js/services/api.js; resources/js/services/api.test.js; resources/js/pages/Inspetora/ContagemPage.jsx; resources/js/pages/Inspetora/ContagemPage.test.jsx; resources/js/pages/DashboardNutri/DashboardNutri.jsx; resources/js/pages/DashboardNutri/DashboardNutri.test.jsx; resources/js/layouts/MainLayout/MainLayout.jsx; resources/js/layouts/MainLayout/MainLayout.test.jsx; resources/js/components/ContagemGeral/CalendarView.jsx; resources/js/components/ContagemGeral/CalendarView.test.jsx.
Teste que falhou antes (comando e motivo): php artisan test --filter=SchoolCalendarTest — 3 falhas: endpoint 404, contagem gravada em 2026-09-08 em vez do dia escolar 2026-09-07 e filtro NES incluindo registro antes da janela; a execução inicial da suíte também expôs testes antigos que comparavam today() UTC ao contrato escolar.
Correção aplicada: SCHOOL_TIMEZONE é configurável e mantém app.timezone em UTC; SchoolCalendarService converte instantes para a data/hora civil escolar e calcula o próximo início de dia no fuso configurado; GET /api/contexto-escolar autenticado retorna somente data_atual, timezone e agora; criação/edição/dashboard usam a data escolar; o filtro NES usa [início UTC, próximo início UTC), incluindo o início e excluindo o fim; o frontend normaliza datas e dia da semana com Intl.DateTimeFormat, consulta o contexto e revalida ao retomar a aba e a cada minuto; o layout e calendário também usam a data escolar.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=SchoolCalendarTest — 5 testes/15 asserções aprovados; npx vitest run nos testes de calendário, hook, API, layout, calendário, Contagem e Dashboard — 7 arquivos/35 testes aprovados; php artisan test — 87 testes/391 asserções aprovados; npm run test:front — 37 arquivos/132 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com aviso não bloqueante de chunks maiores que 500 kB; npm run test:e2e — código 0, 27/27 cenários aprovados no runtime isolado; git diff --check — sem erros de whitespace após a correção do único espaço final introduzido.
Contratos/migrações afetados: novo endpoint autenticado aditivo /api/contexto-escolar; data_atual é YYYY-MM-DD, agora é timestamp UTC e timezone é o fuso operacional; rotas de contagem/NES/dashboard e envelopes existentes foram preservados; nenhuma migration foi criada e nenhum registro histórico foi convertido automaticamente.
Decisões/defaults utilizados: America/Sao_Paulo é o padrão; timestamps continuam UTC; o dia escolar muda à meia-noite local, não à meia-noite UTC; edição permanece restrita ao dia escolar atual, sem corte de 07h30 ou retificação histórica; consultas de datas civis são comparadas por strings/intervalos calculados no fuso, sem assumir que todo dia tem 24 horas.
Limitações e trabalho restante: não houve validação contra MySQL real nem ensaio de VM/infraestrutura; o E2E integrado não simula a passagem real do relógio do navegador, embora o hook e as fronteiras sejam cobertos em testes; T06 e as demais tarefas do plano continuam pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T06

```text
Tarefa: T06 — Gravação atômica e repetição segura de contagem
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T22, sem commit criado.
Achado revalidado? Sim. A tela e as rotas antigas permitiam POST da contagem e mutações NES separadas; a primeira execução do teste da operação retornou 405 na rota inexistente e o dashboard escolheu a revisão antiga (10 em vez de 20) quando data e hora eram iguais.
Arquivos alterados: app/Http/Controllers/Api/ContagemOperationController.php; app/Http/Requests/ContagemOperacaoRequest.php; app/Models/ContagemOperacao.php; app/Services/ContagemOperationService.php; app/Services/ContagemService.php; app/Models/Turma.php; database/migrations/2026_09_07_120000_create_contagem_operacoes_table.php; routes/api.php; resources/js/services/modules/contagens.api.js; resources/js/services/api.test.js; tests/Feature/Api/ContagemOperationTest.php.
Teste que falhou antes (comando e motivo): php artisan test --filter=ContagemOperationTest — 4 testes falharam em 5 asserções; a rota nova ainda respondia 405, a validação/rollback não podia ocorrer e o dashboard devolvia a quantidade 10 da primeira revisão empatada.
Correção aplicada: criada a rota aditiva POST /api/contagens/operacao com FormRequest e middleware StaffOrNutriRole; a operação recebe Idempotency-Key UUID, normaliza/hash do payload, grava resultado e status em contagem_operacoes com índice único por usuário+operação+chave, faz contagem e presenças NES na mesma transação e repete exatamente a resposta anterior para a mesma chave/payload; payload diferente retorna 409, falhas de vínculo revertem a contagem e presença, e uma colisão SQL conhecida consulta o resultado confirmado sem converter outras falhas em replay. Presenças existentes são identificadas pelo vínculo e pela janela do dia escolar, remoções usam o ID recebido e soft-delete, e não há unicidade diária de negócio nem remoção de histórico. Listagem e dashboard agora desempateiam por data, hora e ID descendentes.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=ContagemOperationTest — 7 testes/34 asserções aprovados; npm run test:front -- --run resources/js/services/api.test.js — 1 arquivo/16 testes aprovados; php artisan test — 92 testes/415 asserções aprovados; npm run test:front — 37 arquivos/132 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com o aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 27/27 cenários aprovados com banco, uploads, servidor e porta isolados; php -l nos cinco arquivos PHP novos — sem erros; git diff --check — sem erros de whitespace.
Contratos/migrações afetados: nova migration cria contagem_operacoes com users_id, operacao, chave, payload_hash, status_http, resposta e índice único composto; novo contrato preserva o envelope data.contagem/presencas, responde 201 para criação, 200 para atualização/replay de atualização e 409 para conflito; as rotas legadas /api/contagens e /api/contagem-nes permanecem disponíveis e sem chave continuam compatíveis.
Decisões/defaults utilizados: a operação é escopada ao usuário autenticado; contagem_id nulo cria usando dia/hora escolares do servidor e contagem_id preenchido só atualiza a mesma turma no dia escolar atual; relação NES precisa pertencer à turma; resposta idempotente é persistida para sobreviver ao retry; revisões independentes não são apagadas e o dashboard usa somente a de maior ID no empate.
Limitações e trabalho restante: a operação foi validada em SQLite isolado; a corrida concorrente com dois clientes e o plano de execução MySQL real continuam pendentes; a migração da tela para manter o rascunho e enviar uma única operação ocorrerá na T07; não houve implantação ou operação em VM/banco real.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T07

```text
Tarefa: T07 — Rascunho local e confirmação única
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T06, sem commit criado.
Achado revalidado? Sim. A tela antiga criava a contagem ao abrir o modal, enviava alterações NES imediatamente e podia fechar sem uma confirmação transacional; isso deixava cancelamento, duplo clique e falha de rede com efeitos parciais.
Arquivos alterados: resources/js/pages/Inspetora/ContagemPage.jsx; resources/js/pages/Inspetora/ContagemPage.test.jsx; resources/js/features/contagem/schoolCalendar.js; resources/js/features/contagem/schoolCalendar.test.js; tests/e2e/inspetora-contagem.spec.js.
Teste que falhou antes (comando e motivo): não foi executado um baseline automatizado antes da troca da tela; a revalidação no código confirmou as escritas no carregamento/alteração e os testes de regressão foram escritos para falhar contra esse fluxo, sem atribuir ao baseline um resultado não observado.
Correção aplicada: abrir o modal apenas carrega dados; quantidade e seleções NES permanecem em estado local; cancelar, Esc e fechamento descartam o rascunho; confirmar valida quantidade, envia uma única POST /api/contagens/operacao com chave idempotente estável por payload, bloqueia duplo clique, mantém o modal aberto em erro e recarrega os dados somente após sucesso. O total da tela também seleciona a revisão efetiva mais recente por turma, desempateando por hora e ID.
Testes após correção (comando, ambiente, resultado): npx vitest run resources/js/pages/Inspetora/ContagemPage.test.jsx resources/js/features/contagem/schoolCalendar.test.js — 2 arquivos/12 testes aprovados; npm run test:front — 37 arquivos/136 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com o aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 29/29 cenários Chromium aprovados em runtime isolado, incluindo cancelamento sem mutação e salvar/recarregar com a operação única; git diff --check — verificação pendente neste registro.
Contratos/migrações afetados: a tela passa a consumir a rota aditiva de T06 e preserva rotas legadas; payloads de contagem e presença seguem os IDs explícitos e o modal mantém os contratos visuais existentes; nenhuma migration foi criada nesta tarefa.
Decisões/defaults utilizados: nova contagem começa com quantidade zero até confirmação; somente relações NES exibidas para a turma podem ser alteradas; relações não alteradas são omitidas do payload para preservar o histórico; retry do mesmo rascunho reutiliza a chave, e novo conteúdo recebe outra chave.
Limitações e trabalho restante: o E2E não simula queda real durante a resposta nem concorrência entre navegadores; a concorrência MySQL da operação continua pendente; a verificação global de whitespace e a bateria final serão repetidas após as próximas tarefas.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T10

```text
Tarefa: T10 — Paginação e filtros no servidor
Data e responsável: 07/09/2026 — Codex
Estado/commit de entrada: working tree após T07, sem commit criado.
Achado revalidado? Sim. Índices de alunos, necessidades, turmas, categorias, cronogramas e usuários ignoravam limit; produção usava a paginação padrão do modelo e não aplicava filtros de data; contagens não rejeitavam intervalo invertido.
Arquivos alterados: app/Http/Controllers/Api/AlunoController.php; app/Http/Controllers/Api/NecessidadeController.php; app/Http/Controllers/Api/TurmaController.php; app/Http/Controllers/Api/CategoriaController.php; app/Http/Controllers/Api/CronogramaController.php; app/Http/Controllers/Api/UserController.php; app/Http/Controllers/Api/ContagenController.php; app/Http/Controllers/Api/ContagemNeController.php; app/Http/Controllers/Api/ControleDeProducaoEConsumoController.php; app/Http/Controllers/Api/AutorizadoController.php; app/Http/Controllers/Api/CardapioController.php; app/Http/Controllers/Api/ChatController.php; app/Services/ProducaoConsumoService.php; app/Services/ContagemService.php; app/Services/AutorizadoService.php; tests/Feature/Api/PaginationContractsTest.php.
Teste que falhou antes (comando e motivo): php artisan test --filter=PaginationContractsTest — 2 testes falharam em 5 assertions; a página 3 de 23 alunos veio vazia por ignorar limit/page, e produção informou total 35 em vez dos 25 registros do filtro.
Correção aplicada: todos os índices paginados relevantes validam page inteiro >=1 e limit inteiro entre 1 e 1000, usam limites padrão explícitos e preservam os parâmetros nas URLs; as consultas receberam ordem determinística com ID de desempate. Contagens e produção filtram data/date e intervalos antes de paginar e rejeitam data_fim anterior a data_inicio; contagem NES, autorizações, cardápios e chat também passaram a respeitar page/limit e desempate.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=PaginationContractsTest — 2 testes/26 assertions aprovados; php artisan test — 96 testes/451 assertions aprovados no SQLite isolado; git diff --check — sem erros de whitespace (com avisos informativos de normalização CRLF em arquivos já alterados); frontend, lint, build e E2E serão repetidos na bateria final após T11+.
Contratos/migrações afetados: envelopes paginados data/links/meta, aliases date/data e rotas legadas foram preservados; limites válidos agora controlam a página efetiva; nenhuma migration foi criada.
Decisões/defaults utilizados: defaults existentes foram mantidos por domínio (15 para catálogos/contagens/produção/cardápios, 20 para chat/autorizações e 100 para contagem NES); filtros são aplicados no banco antes do paginate; IDs ordenam empates sem alterar o conteúdo dos registros.
Limitações e trabalho restante: a coleta de páginas completas por relatórios e telas fica para T11; não houve validação contra MySQL real; não foram feitas operações de deploy ou VM.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T11

```text
Tarefa: T11 — Listas e relatórios completos no cliente
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T10, sem commit criado.
Achado revalidado? Sim. Os consumidores ainda tratavam lotes paginados como listas completas; o helper de coleta não existia e havia chamadas de primeira página/limite alto sem garantia de percorrer o meta da resposta.
Arquivos alterados: resources/js/services/http/pagination.js; resources/js/services/http/pagination.test.js; resources/js/services/paginationServices.test.js; resources/js/services/modules/escolar.api.js; resources/js/services/modules/contagens.api.js; resources/js/services/modules/producao.api.js; resources/js/services/modules/cronograma.api.js; resources/js/services/modules/users.api.js; resources/js/services/modules/autorizados.api.js; resources/js/services/modules/cardapios.api.js; resources/js/pages/Planejamento/PlanejamentoPage.jsx; resources/js/pages/Cronograma/CronogramaPage.jsx; resources/js/pages/GerenciarCategorias/CategoriasPage.jsx; resources/js/pages/DashboardNutri/DashboardNutri.jsx; resources/js/pages/Inspetora/ContagemPage.jsx; resources/js/components/ContagemGeral/CalendarView.jsx; resources/js/components/ContagemGeral/ReportView.jsx; resources/js/pages/ControleProducao/ControleProducaoPage.jsx; resources/js/pages/Autorizados/AutorizadosPage.jsx; testes Vitest dos consumidores afetados.
Teste que falhou antes (comando e motivo): npm run test:front -- --run resources/js/services/http/pagination.test.js — 1 arquivo falhou porque o helper ainda não existia; os cenários C18 do helper foram então implementados como regressão. A revalidação dos consumidores confirmou o risco de usar apenas o primeiro lote.
Correção aplicada: criado coletor que percorre page+1 usando meta.current_page/last_page e preserva filtros, sem seguir links arbitrários; há deduplicação por ID, detecção de página repetida/inconsistente, cancelamento, limites de 100 páginas/100.000 itens e falha sem resultado parcial. Os serviços agora expõem getPagina... e getTodos..., mantendo aliases legados; telas e relatórios que dependem da lista completa usam os coletores e mantêm a data escolar nas consultas NES.
Testes após correção (comando, ambiente, resultado): npm run test:front -- --run resources/js/services/http/pagination.test.js — 1 arquivo/5 testes aprovados; npm run test:front -- --run resources/js/services/paginationServices.test.js — 1 arquivo/2 testes aprovados; npm run test:front — código 0, 39 arquivos/143 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 29/29 cenários Chromium aprovados com banco, uploads, servidor e porta isolados.
Contratos/migrações afetados: nenhuma migration; envelopes paginados, filtros, rotas legadas e exports por services/api.js foram preservados. O cliente segue somente páginas numéricas da mesma rota e não expõe resposta parcial como completa.
Decisões/defaults utilizados: limites operacionais documentados de 100 páginas/100.000 itens; cada coleta deduplica por ID e rejeita página vazia intermediária, meta inválido, repetição ou erro; links externos da API não são seguidos. A tela de gestão permanece compatível com paginação explícita quando aplicável.
Limitações e trabalho restante: a coleta foi exercitada com respostas sintéticas acima de uma página e com fluxo E2E real; não houve volume real superior a 1000 registros no navegador nem validação de concorrência/MySQL. A bateria completa de backend permanece com 96 testes/451 assertions aprovados após T10 e será repetida na validação final.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T12

```text
Tarefa: T12 — Revisão de autorizações e persistência de recusa
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T11, sem commit criado.
Achado revalidado? Sim. A baseline mostrou criação com status escolhido, Nutri alterando status pela rota comum, edição de autorização confirmada e recusa rejeitada pela rota legada.
Arquivos alterados: app/Enums/AutorizadoStatus.php; app/Models/Autorizado.php; app/Http/Requests/AutorizadoRequest.php; app/Http/Requests/AutorizarUpdateRequest.php; app/Services/AutorizadoService.php; app/Http/Controllers/Api/AutorizadoController.php; app/Http/Resources/AutorizadoResource.php; database/migrations/2026_09_08_120000_extend_autorizados_decision.php; resources/js/services/modules/autorizados.api.js; resources/js/pages/Autorizados/AutorizadosPage.jsx; resources/js/pages/Autorizados/AutorizadosPage.test.jsx; resources/js/services/api.test.js; tests/Feature/BusinessRules/AuthorizationWorkflowContractsTest.php; tests/Feature/Database/AutorizadoMigrationCompatibilityTest.php; testes de cobertura de API atualizados para o contrato de decisão.
Teste que falhou antes (comando e motivo): php artisan test --filter=AuthorizationWorkflowContractsTest — 6 falhas em 13 assertions: criação e update comum retornavam 201/200 com status indevido, edição de decisão retornava 200, recusa não era aceita e não havia auditoria; o teste de acesso exclusivo da Diretoria já passava. A UI ainda não tinha ação de recusa.
Correção aplicada: criação e edição comum rejeitam status com 422; somente conteúdo pendente pode ser editado pela Nutri. A rota legada /api/autorizados/update/{id} continua intacta e exclusiva da Diretoria, aceita confirmar/recusar enumados, registra decidido_por/decidido_em, repete a mesma decisão sem tocar na auditoria e retorna 409 para troca de decisão final. A UI exibe recusado, oferece confirmar/recusar à Diretoria e envia somente status na revisão; o formulário de conteúdo permanece com a Nutri.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=AuthorizationWorkflowContractsTest — 7 testes/28 assertions aprovados; php artisan test --filter=AutorizadoMigrationCompatibilityTest — 1 teste/8 assertions aprovados em SQLite temporário com schema anterior, upgrade, recusa e rollback protegido; php artisan test --filter="AutorizadosBusinessRulesTest|AuthorizationMatrixTest|ApiCoverageTest" — 26 testes/128 assertions aprovados; php artisan test — código 0, 104 testes/488 assertions aprovados; npm run test:front -- --run resources/js/pages/Autorizados/AutorizadosPage.test.jsx resources/js/services/api.test.js — 2 arquivos/23 testes aprovados; npm run test:front — código 0, 39 arquivos/144 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 29/29 cenários Chromium aprovados com banco, uploads, servidor e porta isolados.
Contratos/migrações afetados: nova migration compatível com instalações existentes amplia o enum para pendente/confirmado/recusado e adiciona decidido_por/decidido_em nullable; dados antigos permanecem sem ator presumido. Rollback lança erro se houver recusas e só remove os campos quando não há decisão que seria perdida. A URL /api/autorizados/update/{id} e os envelopes Resource foram preservados.
Decisões/defaults utilizados: D01 foi aplicado: Diretoria decide; Nutri gerencia conteúdo pendente. Decisões finais são imutáveis até existir fluxo de reabertura; replay da mesma decisão é 200 idempotente; status no create é atribuído pelo servidor e não enviado pelo cliente.
Limitações e trabalho restante: não há driver/servidor MySQL disponível neste ambiente, portanto o upgrade MySQL continua pendente; a migração SQLite foi exercitada isoladamente. Não houve deploy, VM ou alteração em banco real. Reabertura, troca de decisão final e eventual delegação continuam dependências de D01.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T13

```text
Tarefa: T13 — Permissões consistentes
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T12, sem commit criado.
Achado revalidado? Sim. A API retornava 403 para a listagem de usuários da Diretoria, embora a matriz e a tela previssem gestão; o Staff podia editar o próprio nome, mas a edição comum ainda permitia payload de nível sem uma proibição explícita; a Diretoria conseguia POST /api/contagens porque a escrita comum estava no grupo autenticado geral; a navegação oferecia produção, cadastros e cronograma sem permissão correspondente no backend.
Arquivos alterados: app/Http/Middleware/UserManagementRole.php; app/Models/User.php; app/Services/UserService.php; app/Http/Requests/UserRequest.php; app/Http/Controllers/Api/UserController.php; bootstrap/app.php; routes/api.php; tests/Feature/Api/UserManagementAuthorizationTest.php; tests/Feature/ApiCoverageTest.php; resources/js/App.jsx; resources/js/components/navigation/DiretoraNav/DiretoraNav.jsx; resources/js/pages/Inicio/InicioPage.jsx; resources/js/hooks/usePermissions.js; resources/js/components/navigation/NavComponents.test.jsx; resources/js/hooks/hooks.test.jsx; tests/e2e/diretora-autorizados.spec.js.
Teste que falhou antes (comando e motivo): php artisan test --filter=UserManagementAuthorizationTest — baseline inicial com 3 falhas e 6 assertions: Diretoria não listava usuários, autoalteração de nível era aceita e a proteção do último gestor não existia no serviço; após incluir o caso de contagem, a versão anterior retornava 201 em vez de 403 e gravava a contagem.
Correção aplicada: criada a permissão UserManagementRole para Nutri/Diretoria, aplicada às rotas de criação/exclusão e refletida em index/show/update alheio; o próprio perfil continua editável, mas nivel_user e senha são proibidos na edição de si mesmo. O UserService bloqueia autoalteração de nível, remoção/rebaixamento do último gestor e mantém alteração válida por outro gestor. As escritas de contagem comum foram movidas para StaffOrNutriRole, preservando index/show e as URLs existentes. A Diretoria mantém leitura de dados autorizados, aprovação e gestão de usuários, enquanto os atalhos/rotas de gestão operacional negados foram removidos e o cardápio passou a usar tela de leitura.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=UserManagementAuthorizationTest — 5 testes/21 assertions aprovados; php artisan test --filter="UserManagementAuthorizationTest|ApiCoverageTest" — 21 testes/118 assertions aprovados; npm run test:front -- --run resources/js/components/navigation/NavComponents.test.jsx resources/js/hooks/hooks.test.jsx resources/js/pages/Inicio/InicioPage.test.jsx — 3 arquivos/11 testes aprovados; npm run test:front — 39 arquivos/144 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com o aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 31/31 cenários Chromium aprovados em runtime isolado, incluindo criação/edição/reload de usuário pela Diretoria e bloqueio de API/rota para Staff; git diff --check — sem erros de whitespace, somente avisos informativos de normalização CRLF; php -l nos arquivos PHP alterados — sem erros.
Contratos/migrações afetados: nenhuma migration foi criada; /api/users, /api/contagens e /api/contagem-nes mantêm suas URLs e envelopes, com autorização alinhada à matriz; rotas Nutri de gestão operacional permanecem inalteradas para preservar a operação.
Decisões/defaults utilizados: D02 foi aplicado: gestão de usuários para Diretoria, operação para Nutri, leituras já autorizadas preservadas e nenhuma abertura indiscriminada de recursos Nutri; contagem comum/NES só pode ser gravada por Staff/Nutri; capacidade administrativa é Nutri ou Diretoria; último gestor ativo não pode ser removido ou rebaixado.
Limitações e trabalho restante: a concorrência entre gestores para a última conta não foi ensaiada em MySQL real; não houve deploy, VM ou banco real. O escopo adicional de leitura gerencial da produção permanece dependência D02; tarefas T14 em diante continuam pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T14

```text
Tarefa: T14 — Unicidade no create e update
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T13, sem commit criado.
Achado revalidado? Sim. Aluno update não validava RM; Turma create/update não verificava o nome e a categoria resultantes e update não limitava nome a 45 caracteres; Cronograma create/update deixava o índice único devolver 500.
Arquivos alterados: app/Http/Controllers/Api/AlunoController.php; app/Models/Aluno.php; app/Http/Requests/TurmaRequest.php; app/Models/Turma.php; app/Http/Controllers/Api/TurmaController.php; app/Http/Requests/CronogramaRequest.php; tests/Feature/Api/UniquenessContractsTest.php.
Teste que falhou antes (comando e motivo): php artisan test --filter=UniquenessContractsTest — 3 testes falharam; duplicações de RM e dia chegaram aos índices únicos do SQLite e retornaram 500, e a combinação final de turma não era validada antes da persistência.
Correção aplicada: Rule::unique(...)->ignore(id) no update de Aluno e nas operações de Cronograma; unicidade composta nome+categoria no create de Turma; update de Turma avalia a combinação final tanto em PATCH do nome quanto da categoria, ignora o próprio ID e aplica limite de 45 caracteres. Os índices únicos do banco foram preservados.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=UniquenessContractsTest — 3 testes/28 assertions aprovados; php artisan test — código 0, 112 testes/538 assertions no SQLite isolado; npm run test:front — código 0, 39 arquivos/144 testes; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 31/31 cenários Chromium no runtime isolado; git diff --check — verificação de whitespace sem erros, com avisos informativos de normalização CRLF.
Contratos/migrações afetados: nenhuma migration; índices únicos existentes e política de identidade de registros preservados; envelopes e URLs de create/update não foram alterados; duplicação validável retorna 422 em vez de erro SQL 500.
Decisões/defaults utilizados: a identidade própria de Aluno, Turma e Cronograma é permitida por ignore; o mesmo nome de turma é permitido em outra categoria; PATCH somente da categoria usa o nome atual; registros soft-deleted continuam sujeitos à política de unicidade do índice existente.
Limitações e trabalho restante: corrida concorrente específica de unicidade em MySQL não foi executada por ausência de driver/servidor; não houve deploy, VM ou banco real. T15 e demais tarefas permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T15

```text
Tarefa: T15 — Limites compatíveis com o schema
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T14, sem commit criado.
Achado revalidado? Sim. Contagem em update e na operação atômica aceitava valores acima de inteiro de 32 bits; produção aceitava valores acima de decimal(8,2), com mais de duas casas e sem limite equivalente no update. O limite de 45 caracteres da turma já havia sido aplicado em T14 e foi coberto novamente aqui em create/update.
Arquivos alterados: app/Http/Requests/ContagenRequest.php; app/Http/Requests/ContagemOperacaoRequest.php; app/Models/Contagen.php; app/Http/Requests/ControleDeProducaoEConsumoRequest.php; app/Models/ControleDeProducaoEConsumo.php; tests/Feature/Api/ValidationBoundariesTest.php.
Teste que falhou antes (comando e motivo): php artisan test --filter=ValidationBoundariesTest — 3 testes falharam em 14 assertions; update/operação de contagem aceitaram 2147483648 e update de produção aceitou valores fora de decimal(8,2).
Correção aplicada: regras de criação e edição de contagem passaram a aceitar somente inteiros de 0 a 2147483647; o mesmo limite foi aplicado à operação atômica e a pessoas_alimento. Os três campos decimal(8,2) de produção agora exigem valor numérico entre 0 e 999999.99 e no máximo duas casas, sem arredondamento silencioso; turma mantém max:45 nos dois sentidos.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=ValidationBoundariesTest — 3 testes/79 assertions aprovados; php artisan test — código 0, 115 testes/617 assertions no SQLite isolado; npm run test:front — código 0, 39 arquivos/144 testes; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 31/31 cenários Chromium no runtime isolado; php -l nos arquivos PHP alterados — sem erros; git diff --check — sem erros de whitespace, com avisos informativos de normalização CRLF.
Contratos/migrações afetados: nenhuma migration; tipos e limites das colunas existentes foram preservados; envelopes, rotas legadas e payloads válidos não foram alterados. Payload inválido retorna 422 antes da persistência, sem expor erro SQL.
Decisões/defaults utilizados: o inteiro máximo segue 2147483647; decimal(8,2) segue 999999.99 com escala máxima de duas casas; zero é válido; valores decimais não são arredondados para caber no schema.
Limitações e trabalho restante: o mesmo conjunto de fronteiras não foi executado em MySQL descartável por ausência de driver/servidor; SQLite isolado, frontend, build e Chromium foram validados. Não houve deploy, VM ou banco real. T16 e demais tarefas permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T16

```text
Tarefa: T16 — Integridade de vínculos e remoção estrita
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T15, sem commit criado.
Achado revalidado? Sim. Regras exists aceitavam categoria, turma, necessidade e cronograma soft-deleted; presença aceitava relação com aluno/necessidade excluído; o DELETE de aluno convertia IDs numéricos não inteiros e removia somente o primeiro item de arrays múltiplos.
Arquivos alterados: app/Http/Requests/DisableAlunoRequest.php; app/Services/VinculoService.php; app/Http/Requests/AlunoRequest.php; app/Http/Requests/TurmaRequest.php; app/Http/Requests/ContagenRequest.php; app/Models/Contagen.php; app/Models/Aluno.php; app/Models/Turma.php; app/Http/Requests/AlunosHasNecessidadeRequest.php; app/Http/Requests/NecessidadesHasCronogramaRequest.php; app/Http/Requests/ContagemNeRequest.php; app/Http/Requests/ContagemOperacaoRequest.php; app/Http/Controllers/Api/AlunoController.php; app/Http/Controllers/Api/NecessidadeController.php; app/Http/Controllers/Api/ContagemNeController.php; app/Services/ContagemOperationService.php; tests/Feature/Api/RelationshipIntegrityTest.php.
Teste que falhou antes (comando e motivo): php artisan test --filter=RelationshipIntegrityTest — 3 testes falharam em 12 assertions: turma em categoria excluída retornou 201, presença com aluno excluído retornou 201 e ID decimal do DELETE retornou 204; o caso de remoção válida já passava.
Correção aplicada: relações com categorias, turmas, necessidades e cronogramas agora usam exists filtrado por deleted_at; presença legada e operação de contagem verificam os dois pais ativos. VinculoService concentra associação, agendamento, presença e remoção sob transação com locks, remove dependentes permitidos e bloqueia qualquer histórico de presença. DisableAlunoRequest aceita somente inteiro positivo ou array unitário de inteiro positivo, antes de qualquer cast; formatos inválidos não alteram vínculos.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=RelationshipIntegrityTest — 4 testes/50 assertions aprovados; php artisan test --filter="RelationshipIntegrityTest|RelationshipContractsTest|ContagemNesBusinessRulesTest|ContagemOperationTest|ApiCoverageTest" — 33 testes/212 assertions aprovados; php artisan test — código 0, 119 testes/667 assertions no SQLite isolado; npm run test:front — código 0, 39 arquivos/144 testes; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 31/31 cenários Chromium no runtime isolado; php -l nos arquivos PHP alterados — sem erros; git diff --check — sem erros de whitespace, com avisos informativos de normalização CRLF.
Contratos/migrações afetados: nenhuma migration; tabelas de vínculo sem soft delete não receberam coluna artificial; pais soft-deleted não podem originar novos vínculos, enquanto histórico permanece consultável e protegido. Rotas e envelopes legados foram preservados, inclusive DELETE com array unitário e respostas 404/409.
Decisões/defaults utilizados: `Rule::exists(...)->whereNull('deleted_at')` foi aplicada somente às tabelas que possuem soft delete; o cliente continua usando array unitário; vínculo com qualquer presença, inclusive soft-deleted, não pode ser removido; associação e dependentes são removidos na mesma transação.
Limitações e trabalho restante: concorrência entre criação/remoção e locks específicos de MySQL não foram ensaiados por ausência de driver/servidor; o SQLite isolado cobriu atomicidade e estados de histórico. Não houve deploy, VM ou banco real. T17 e demais tarefas permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T17

```text
Tarefa: T17 — Atualização, edição e histórico do chat
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T16, sem commit criado.
Achado revalidado? Sim. O ChatPage só atualizava quando o número de mensagens mudava, portanto ignorava mensagem nova ou edição com o mesmo total; não havia carregamento de páginas anteriores; o CSS mantinha overflow-y:hidden; o cleanup removia apenas o intervalo e não cancelava requisições pendentes.
Arquivos alterados: resources/js/pages/Chat/ChatPage.jsx; resources/js/pages/Chat/ChatPage.css; resources/js/pages/Chat/ChatPage.test.jsx; resources/js/services/modules/chat.api.js; resources/js/services/api.test.js; tests/Feature/BusinessRules/ChatContractTest.php; tests/e2e/chat-comunicacao.spec.js.
Teste que falhou antes (comando e motivo): npm exec vitest run resources/js/pages/Chat/ChatPage.test.jsx — 4 de 6 testes falharam após o ajuste do harness: polling com mesmo tamanho não mostrava a mensagem nova, edição não era aplicada, não existia controle de histórico e a requisição não recebia AbortSignal; os dois testes legados de carregamento/envio passavam.
Correção aplicada: ChatPage consulta páginas de 20 mensagens, mescla por ID, aplica conteúdo pela versão updated_at e ordena por data civil/ID; respostas recentes fora de ordem são ignoradas por sequência e versões antigas não regridem uma edição. O histórico pode ser carregado progressivamente, o rascunho permanece no estado local, polling e requisições são cancelados no desmontar e a área de mensagens voltou a permitir rolagem. chat.api adiciona getChatMessagesPage e mantém getChatMessages() sem parâmetros com a URL /api/chats legada; o controller já tinha paginação e ordenação created_at/id, cobertas pelo contrato backend.
Testes após correção (comando, ambiente, resultado): npm exec vitest run resources/js/pages/Chat/ChatPage.test.jsx resources/js/services/api.test.js — 2 arquivos/22 testes aprovados; php artisan test --filter=ChatContractTest — 5 testes/37 asserções aprovados; php artisan test — código 0, 120 testes/689 asserções aprovados no SQLite isolado; npm run test:front — código 0, 39 arquivos/148 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 33/33 cenários Chromium aprovados no runtime isolado, incluindo polling com 20 mensagens e histórico paginado; php -l app/Http/Controllers/Api/ChatController.php tests/Feature/BusinessRules/ChatContractTest.php — sem erros; git diff --check — sem erros de whitespace.
Contratos/migrações afetados: nenhuma migration; o envelope paginado `{data, links, meta}` e a URL /api/chats foram preservados; chamadas sem parâmetros continuam compatíveis; page/limit são acrescentados somente para o fluxo novo; timestamps e campos de mensagem existentes permanecem no resource.
Decisões/defaults utilizados: a página inicial usa 20 mensagens, o avanço de histórico usa meta.current_page/last_page, IDs são a chave de deduplicação e updated_at define a versão do conteúdo; em empate, a resposta mais recente do polling prevalece; dados sem ID continuam sendo exibidos sem substituir mensagens identificadas.
Limitações e trabalho restante: os cenários novos de Chromium interceptam o envelope da API para controlar polling/histórico, enquanto o envio legado continua exercitado contra o backend isolado; o contrato real de paginação foi validado no PHPUnit. Não há driver/servidor MySQL disponível, não houve deploy, VM ou banco real. T18 e demais tarefas permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T18

```text
Tarefa: T18 — Consistência entre PDF e banco
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T17, sem commit criado.
Achado revalidado? Sim. CardapioController/FileService moviam o PDF antes da persistência, o update podia deixar o arquivo novo órfão, falhas internas eram convertidas em 422 e a exclusão ignorava retorno false/exceção do disco.
Arquivos alterados: config/filesystems.php; .env.example; app/Services/FileService.php; app/Services/CardapioService.php; app/Models/FileCleanupFailure.php; app/Console/Commands/RetryFileCleanup.php; app/Http/Controllers/Api/CardapioController.php; app/Http/Controllers/FileController.php; database/migrations/2026_09_08_130000_create_file_cleanup_failures_table.php; tests/Feature/BusinessRules/CardapioConsistencyTest.php; tests/Feature/BusinessRules/FileServiceStorageTest.php; README.md; docs/docs/06-operacao-e-manuais/03-guia-de-implantacao-e-deploy.md.
Teste que falhou antes (comando e motivo): php artisan test --filter=CardapioConsistencyTest — 2 testes falharam: as falhas injetadas de criação e atualização retornavam 422 em vez de 500 genérico; a implementação antiga gravava o arquivo antes de salvar o modelo.
Correção aplicada: o disco `uploads` configurável por `CARDAPIO_FILESYSTEM_DISK` mantém o root público e as referências relativas/URLs legadas. FileService grava via Storage e sinaliza false ou exceção; CardapioService grava/substitui sob transação, remove o novo arquivo em falha e só tenta remover o antigo após commit. Falhas de limpeza são persistidas com disco, caminho, operação, tentativas e próxima tentativa, recebem log estruturado e podem ser reexecutadas pelo serviço ou `files:retry-cleanup`; a remoção é específica e nunca limpa diretório inteiro. Validações continuam 422, enquanto erros internos retornam 500 genérico.
Testes após correção (comando, ambiente, resultado): php artisan test --filter="CardapioConsistencyTest|FileServiceStorageTest" — 10 testes/50 asserções aprovados; php artisan test — código 0, 130 testes/739 asserções aprovados no SQLite e runtime de arquivos isolados; npm run test:front — código 0, 39 arquivos/148 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com o aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 33/33 cenários Chromium aprovados no runtime isolado; php -l nos arquivos PHP da T18 — sem erros; git diff --check — sem erros de whitespace, com avisos informativos de normalização CRLF.
Contratos/migrações afetados: `cardapio.path` continua sendo o nome relativo retornado pela API e consumido em `/uploads/pdf/{path}`; endpoints `/api/cardapios` e `/api/upload/pdf` mantêm suas URLs e respostas de sucesso/validação. Nova tabela `file_cleanup_failures` guarda tentativas pendentes sem foreign key destrutiva sobre o histórico de cardápios; nenhum dado existente é removido por migration.
Decisões/defaults utilizados: o disco padrão `uploads` aponta para `public/` para preservar o contrato legado; testes podem substituí-lo por `Storage::fake` ou outro disco configurado. PDF avulso de `/api/upload/pdf` permanece sem registro de cardápio e seu chamador é o dono da associação/limpeza; a documentação operacional registra essa responsabilidade e o comando de retentativa. Falha de remoção após commit não desfaz o estado SQL, mas deixa registro identificável e reexecutável.
Limitações e trabalho restante: as falhas foram injetadas em SQLite/storage fake; não há driver ou servidor MySQL para validar o comportamento transacional no motor de produção. O ciclo de fotos ainda será tratado na T24; não houve deploy, VM ou operação em banco real. T23, T24, T20 e T21 permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T19

```text
Tarefa: T19 — Atualização das dependências PDF e compatibilidade das exportações
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T18, sem commit criado.
Achado revalidado? Sim. O package.json usava html2pdf.js 0.12.1 e jsPDF 3.0.4, enquanto jspdf-autotable estava em 5.0.8; npm audit reportava 3 vulnerabilidades críticas nos pacotes/transitivas de PDF. A baseline do teste de dependências falhou porque jsPDF era inferior ao piso corrigido 4.2.1.
Arquivos alterados: package.json; package-lock.json; resources/js/pdfDependencies.test.js; resources/js/pdfExports.test.js; resources/js/pages/Planejamento/PlanejamentoPage.jsx; resources/js/components/ControleProducao/ProducaoFilterPanel.jsx; resources/js/components/ControleProducao/ProducaoFilterPanel.test.jsx; tests/e2e/pdf-exports.spec.js.
Teste que falhou antes (comando e motivo): npm exec vitest run resources/js/pdfDependencies.test.js — 1 teste falhou porque jsPDF 3.0.4 não atendia ao piso 4.2.1; npm ls confirmou html2pdf.js 0.12.1, jspdf 3.0.4 e jspdf-autotable 5.0.8; npm audit --json reportou 3 críticas.
Correção aplicada: html2pdf.js foi atualizado para ^0.14.0, jsPDF para ^4.2.1 e jspdf-autotable para ^5.0.8, com lockfile regenerado por npm ci. Os consumidores passaram a importar o construtor nomeado compatível com jsPDF 4; os builders de Planejamento e Produção foram isolados para teste sem alterar nomes de arquivos, opções ou rotas. Os testes exercitam 100 registros, acentos, texto adversarial, última linha, paginação e download Chromium válido; não foi usado npm audit fix --force nem feita otimização de bundle.
Testes após correção (comando, ambiente, resultado): npm ci — instalação limpa pelo lockfile, 418 pacotes adicionados e 0 vulnerabilidades; npm ls jspdf html2pdf.js jspdf-autotable --depth=0 — html2pdf.js 0.14.0, jspdf 4.2.1 e jspdf-autotable 5.0.8; npm audit --json — 0 vulnerabilidades; npm exec vitest run resources/js/pdfDependencies.test.js resources/js/pdfExports.test.js resources/js/components/ControleProducao/ProducaoFilterPanel.test.jsx resources/js/pages/Planejamento/PlanejamentoPage.test.jsx — 10/10 testes aprovados; php artisan test — 130 testes/739 asserções aprovados no SQLite isolado; npm run test:front — 41 arquivos/151 testes aprovados; npm run lint — código 0, sem erros/avisos; npx eslint tests/e2e/pdf-exports.spec.js — código 0; npm run build — código 0, com o aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 36/36 cenários Chromium aprovados no runtime isolado.
Contratos/migrações afetados: nenhuma rota, API, migration, payload ou nome de arquivo de exportação foi alterado; a importação interna de jsPDF foi ajustada à API nomeada da versão 4. O lockfile passa a fixar a árvore compatível e sem vulnerabilidades conhecidas.
Decisões/defaults utilizados: foram adotados os pisos corrigidos publicados pelos projetos oficiais — jsPDF >=4.2.1, html2pdf.js >=0.14.0 e jspdf-autotable >=5.0.8. O teste unitário dos builders valida texto da última linha e mais de uma página; o E2E valida as 100 linhas na tela, acentos/texto adversarial, nomes sugeridos e estrutura `%PDF-...%%EOF` dos três downloads.
Limitações e trabalho restante: a inspeção automatizada verifica bytes, texto produzido pelo builder e renderização Chromium; não foi feita comparação visual manual de cada página PDF nem ensaio em navegador fora do Chromium. Não há MySQL/VM real disponível e T23, T24, T20 e T21 permanecem pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T23

```text
Tarefa: T23 — Total regular/Outros
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T19, sem commit criado.
Achado revalidado? Sim. DashboardNutri, ContagemPage e relatórios somavam todas as categorias no mesmo total e não tinham uma classificação explícita para separar a categoria Outros; a regressão RN15 apenas verificava a presença das categorias, não o total efetivo por classe nem a seleção da revisão mais recente.
Arquivos alterados: database/migrations/2026_09_08_140000_add_inclui_total_regular_to_categorias_table.php; app/Models/Categoria.php; app/Http/Resources/CategoriaResource.php; app/Http/Resources/DashboardResource.php; app/Services/ContagemTotalsService.php; app/Services/ContagemService.php; database/seeders/CatalogSeeder.php; tests/Feature/Api/CategoryTotalsContractTest.php; tests/Feature/BusinessRules/BackendHomologationBusinessRulesTest.php; resources/js/features/contagem/schoolCalendar.js; resources/js/features/contagem/countTotals.js; resources/js/features/contagem/countTotals.test.js; resources/js/pages/DashboardNutri/DashboardNutri.jsx; resources/js/pages/DashboardNutri/DashboardNutri.test.jsx; resources/js/pages/Inspetora/ContagemPage.jsx; resources/js/pages/Inspetora/ContagemPage.test.jsx; resources/js/pages/Inspetora/ContagemPage.css; resources/js/components/ContagemGeral/ReportView.jsx; resources/js/components/ContagemGeral/ReportPreview.jsx; resources/js/components/ContagemGeral/ReportPreview.css; resources/js/components/ContagemGeral/ReportPreview.test.jsx; resources/js/components/ContagemGeral/CalendarView.jsx; resources/js/components/ContagemGeral/DetailsPanel.jsx; resources/js/components/ContagemGeral/DetailsPanel.css.
Teste que falhou antes (comando e motivo): php artisan test --filter=BackendHomologationBusinessRulesTest — o teste RN15 falhou em 1 de 6 assertions porque a resposta não expunha totais separados e o agregado esperado era 28; npx vitest run nos alvos T23 — 2 testes da ContagemPage falharam somente porque a expectativa antiga assumia uma única ocorrência visual do valor 25 após a inclusão dos subtotais e do combinado.
Correção aplicada: Categorias ganhou o atributo explícito inclui_total_regular, com default true e backfill controlado de categorias existentes cujo nome canônico é Outros para false, sem alterar contagens, IDs ou histórico. O atributo é exposto nos Resources e não é editável pelo endpoint comum. O backend calcula totals.total_regular, totals.total_outros e totals.total_combinado usando a revisão efetiva por turma. O frontend compartilha a mesma seleção e regra de classificação no dashboard, tela de contagem, calendário, painel de detalhes e relatório/PDF, exibindo os rótulos Regular, Outros e Combinado. Mocks legados sem turmas_id continuam visíveis, enquanto respostas reais com ID são deduplicadas por dia/turma.
Testes após correção (comando, ambiente, resultado): php artisan test --filter="CategoryTotalsContractTest|BackendHomologationBusinessRulesTest" — 2 testes/18 assertions aprovados; npx vitest run resources/js/features/contagem/countTotals.test.js resources/js/pages/DashboardNutri/DashboardNutri.test.jsx resources/js/pages/Inspetora/ContagemPage.test.jsx resources/js/components/ContagemGeral/ReportPreview.test.jsx resources/js/components/ContagemGeral/CalendarView.test.jsx resources/js/components/ContagemGeral/DetailsPanel.test.jsx resources/js/features/contagem/schoolCalendar.test.js — 8 arquivos/28 testes aprovados; php artisan test — código 0, 131 testes/752 assertions no SQLite isolado; npm run test:front — código 0, 42 arquivos/155 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, com o aviso não bloqueante de chunks maiores que 500 kB; npm run test:e2e — código 0, 36/36 cenários Chromium aprovados em runtime isolado, incluindo exportações PDF e fluxos de contagem; git diff --check — sem erros de whitespace.
Contratos/migrações afetados: nova migration aditiva cria categorias.inclui_total_regular boolean default true e classifica somente linhas existentes com nome Outros como false; o down remove apenas a coluna. Os envelopes e URLs existentes foram preservados; o dashboard ganhou o campo adicional totals com total_regular, total_outros e total_combinado, e os Resources de categoria/dashboard expõem a classificação. Nenhuma contagem ou registro histórico é reclassificado, removido ou regravado.
Decisões/defaults utilizados: D05 aplicado conforme orientação atual: Outros é segregado no total, sem editor de reclassificação. Categorias sem o atributo em payloads legados continuam incluídas no total regular; somente false separa explicitamente. Para cada turma e dia, a revisão de maior data/hora/ID é a efetiva e não é somada novamente; o combinado é regular + Outros.
Limitações e trabalho restante: a política futura para reclassificar categorias permanece pendência de D05; não houve validação em MySQL real, comparação visual manual de cada página PDF, deploy, VM ou banco real. T24, T20 e T21 continuam pendentes.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

### T24

```text
Tarefa: T24 — Proteger fotos e reduzir dados do chat
Data e responsável: 08/09/2026 — Codex
Estado/commit de entrada: working tree após T23, sem commit criado.
Achado revalidado? Sim. Fotos de alunos ainda podiam ser gravadas em `public/uploads` e servidas por caminho estático sem autenticação; o upload não tinha vínculo obrigatório com um aluno; e ChatResource/getChatMembers reutilizavam UserResource, expondo NIF e e-mail aos participantes.
Arquivos alterados: .env.example; README.md; config/filesystems.php; app/Models/Aluno.php; app/Http/Requests/AlunoRequest.php; app/Http/Requests/StudentPhotoRequest.php; app/Http/Resources/AlunoResource.php; app/Http/Resources/ChatParticipantResource.php; app/Http/Resources/ChatResource.php; app/Http/Controllers/FileController.php; app/Http/Controllers/Api/ChatController.php; app/Services/FileService.php; app/Services/StudentPhotoMigrationService.php; app/Console/Commands/MigrateStudentPhotos.php; routes/api.php; routes/web.php; deploy/terraform/scripts/nginx-menu.conf; deploy/terraform/scripts/provision-vm.sh; docs/docs/06-operacao-e-manuais/03-guia-de-implantacao-e-deploy.md; resources/js/services/modules/files.api.js; resources/js/services/api.test.js; resources/js/components/common/ProtectedStudentPhoto.jsx; resources/js/components/common/ProtectedStudentPhoto.test.jsx; resources/js/pages/Planejamento/PlanejamentoPage.jsx; resources/js/pages/Planejamento/PlanejamentoPage.test.jsx; resources/js/pages/Inspetora/ContagemPage.jsx; resources/js/pages/Chat/ChatPage.jsx; tests/Feature/Api/StudentPhotoAuthorizationTest.php; tests/Feature/BusinessRules/ChatContractTest.php; tests/e2e/student-photo-security.spec.js.
Teste que falhou antes (comando e motivo): php artisan test --filter="StudentPhotoAuthorizationTest|ChatContractTest" — baseline com 3 falhas/40 assertions: a rota da foto ainda respondia 404 em vez de exigir autenticação, o comando de migração não existia e o contrato do chat continha NIF/e-mail no participante.
Correção aplicada: criado disco privado configurável para fotos, com upload obrigatório vinculado a `aluno_id`/model binding e somente para Nutri; a API autenticada serve os bytes sem token em query, rejeita referência ausente/traversal e mantém `foto` legado junto de `foto_url` protegido. O `FileService` usa nomes gerados e troca/limpeza compensatória sem aceitar caminho arbitrário. O comando `photos:migrate-to-private` inventaria alunos com foto, suporta dry-run, copia em arquivo temporário, verifica SHA-256, é idempotente e só remove o arquivo público exato com `--remove-public`; não remove diretórios inteiros. Rotas/configuração Nginx deixam PDFs legados públicos e bloqueiam `/uploads/` de fotos antigas fora da rota autenticada. O frontend busca as fotos com Bearer, usa object URLs e revoga URLs/aborta requisições no cleanup. O chat passou a expor somente id, name e nivel_user; o perfil próprio continua usando o recurso completo e as permissões existentes.
Testes após correção (comando, ambiente, resultado): php artisan test --filter=StudentPhotoAuthorizationTest — 2 testes/33 assertions aprovados; php artisan test --filter="StudentPhotoAuthorizationTest|ChatContractTest" — 8 testes/78 assertions aprovados; npm run test:front -- --run resources/js/components/common/ProtectedStudentPhoto.test.jsx resources/js/services/api.test.js resources/js/pages/Planejamento/PlanejamentoPage.test.jsx resources/js/pages/Inspetora/ContagemPage.test.jsx — 4 arquivos/34 testes aprovados; php artisan test — código 0, 134 testes/793 assertions aprovados no SQLite e runtime de arquivos isolados; npm run test:front — código 0, 43 arquivos/158 testes aprovados; npm run lint — código 0, sem erros/avisos; npm run build — código 0, 424 módulos transformados, com o aviso conhecido de chunks maiores que 500 kB; npm run test:e2e — código 0, 37/37 cenários Chromium aprovados com banco, uploads, servidor e porta isolados, incluindo bloqueio público e recarga da foto; composer validate --no-check-publish — código 0; composer audit --locked — código 0, sem advisories; npm audit --json — código 0, 0 vulnerabilidades; git diff --check — código 0, sem erros de whitespace, apenas avisos informativos de normalização CRLF.
Contratos/migrações afetados: nenhuma migration destrutiva; o campo `alunos.foto` e os endpoints legados continuam compatíveis, enquanto `foto_url` aponta para `GET /api/alunos/{aluno}/foto`, protegido por Sanctum. O upload existente `/api/upload` exige vínculo explícito e o endpoint canônico `/api/alunos/{aluno}/foto` foi adicionado para Nutri. PDFs continuam no disco/URL legado. A resposta de chat/membros preserva envelope e paginação, mas remove NIF, e-mail, hash de senha, token e foto pública dos participantes.
Decisões/defaults utilizados: o disco padrão de fotos é `student_photos`, privado em `storage/app/private/student-photos`; `STUDENT_PHOTOS_DISK` permite configuração por ambiente. A leitura segue a permissão de leitura do aluno. A migração pública é somente opt-in no comando, com inventário, erros e hashes; não foi executada em dados de produção. Referências históricas são preservadas e não há exclusão ampla nem token na URL.
Limitações e trabalho restante: não há driver/servidor MySQL, VM ou Nginx real disponível para ensaio; a configuração Nginx foi revisada estaticamente e o E2E usou o servidor PHP isolado. A migração de produção não foi executada. Não houve implantação escolar, banco real ou inspeção visual manual fora do Chromium. Permanecem pendentes T20 e T21, além das decisões D01–D06 registradas na tabela.
Estado final da tarefa: Concluída.
Referência do diff/commit, se houver: working tree; sem commit criado.
```

Copiar este bloco para cada tarefa iniciada, sem substituir os resultados históricos:

```text
Tarefa:
Data e responsável:
Estado/commit de entrada:
Achado revalidado? Evidência:
Arquivos alterados:
Teste que falhou antes (comando e motivo):
Correção aplicada:
Testes após correção (comando, ambiente, resultado):
Contratos/migrações afetados:
Decisões/defaults utilizados:
Limitações e trabalho restante:
Estado final da tarefa:
Referência do diff/commit, se houver:
```

## Decisões e homologação pendentes

| Item | Orientação atual | O que falta |
| --- | --- | --- |
| D01 | Diretoria revisa; decisões finais não se alteram silenciosamente | Confirmação de eventual reabertura/delegação |
| D02 | Gestão de usuários para Diretoria, operação para Nutri | Escopo adicional de leitura gerencial da produção |
| D03 | Dia escolar atual, sem novo corte automático de horário | Prazo 07h30 e eventual retificação histórica |
| D04 | Histórico preservado, última revisão, retries idempotentes | Refeições múltiplas, unicidade de negócio e concorrência entre editores |
| D05 | Outros separado no total; sem editor de reclassificação | Política de efeito histórico de categoria |
| D06 | Não renomear NAI/NAE automaticamente | Significado e equivalência dos códigos |
| MySQL | Testes preparados para motor de produção | Ambiente com driver/servidor; auditoria usou SQLite |
| VM/Nginx/Terraform | Revisão estática feita na auditoria | Ensaio descartável de atualização, preservação e restauração |

## Verificação final das correções

- [ ] Todas as tarefas implementadas têm testes/evidências próprias e pendências explícitas.
- [x] Backend aprovado no ambiente isolado.
- [x] Frontend, lint e build aprovados.
- [x] E2E isolado com operações reais e recarga aprovado.
- [x] Dependências PDF verificadas e exportações inspecionadas.
- [ ] Migrações de instalação e upgrade com dados verificadas nos motores exigidos.
- [ ] Pacote sem dados locais; atualização e rollback ensaiados em instalação descartável.
- [x] Nenhum dado/arquivo normal usado como descartável pelos testes.
- [x] Contratos, guia operacional e decisões documentados.
- [ ] Relatório final distingue concluído, parcial e não executado.
