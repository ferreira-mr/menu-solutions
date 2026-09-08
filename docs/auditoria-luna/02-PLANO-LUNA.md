# Plano de implementação para o Luna

Raiz exclusiva: `C:\Projetos\contador-v2`. Este é um plano a executar; nenhuma tarefa abaixo foi implementada na auditoria. Leia também `AGENTS.md`, os achados e os contratos do documento 04. Os caminhos nesta documentação são relativos à raiz indicada.

## Método de execução

1. Conferir `git status` e o commit atual. Preservar alterações posteriores à auditoria. Revalidar cada achado no código atual; registrar quando já tiver sido corrigido.
2. Concluir T00 antes de executar qualquer teste com banco ou upload. Não usar o comando E2E antigo de preparação.
3. Em cada tarefa, implementar primeiro o menor teste permanente que demonstra o defeito. A falha precisa vir da asserção de comportamento, não de dependência ausente, autenticação errada ou fixture inválida.
4. Fazer a correção com controllers pequenos e regras em serviços/FormRequests. Componentes novos ficam em `resources/js/features`; preservar os exports públicos de `resources/js/services/api.js`.
5. Rodar os testes da tarefa e dos consumidores afetados. Registrar comando, resultado, arquivos, decisões e pendências em `CONTROLE-DE-EXECUCAO.md`.
6. Ao concluir cada bloco abaixo, executar as verificações de integração indicadas. Não repetir toda a suíte após mera edição de documentação.
7. Não marcar uma tarefa como concluída se o teste foi ignorado ou se resta parte obrigatória. Não substituir uma asserção de conteúdo por uma de título, status genérico ou existência de mock.

Mudanças devem ser pequenas e revisáveis. Não fazer refatoração geral, renomeação em massa, deploy, reset de banco normal ou limpeza de arquivos alheios. Se houver controle de versão, separar as alterações por tarefa sem incorporar trabalho de terceiros.

## Sequência e dependências

Executar nesta ordem; os números identificam tarefas, não uma autorização para executá-las em paralelo:

`T00 → T01 → T02 → T03 → T04 → T05 → T08 → T09 → T22 → T06 → T07 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19 → T23 → T24 → T20 → T21`.

- Bloco inicial: T00–T04, segurança e execução segura dos testes.
- Fluxo escolar: T05, T08, T09, T22, T06, T07, contratos e gravação de contagens.
- Consistência funcional: T10–T19, T23, T24, listas, permissões, dados, arquivos e relatórios.
- Implantação: T20–T21, somente preparar/validar em ambiente descartável. Uma implantação na escola não faz parte desta tarefa.

Ao terminar cada um dos três primeiros blocos: backend + frontend + lint + build + E2E isolado. Ao terminar implantação: verificações estáticas e ensaio descartável de preservação/rollback. Se a infraestrutura não estiver disponível, registrar essa homologação como pendente; não declarar implantação aprovada.

## T00 — Isolar banco, uploads e servidor dos testes

**Achado A20. Sem dependências. Testes Q01–Q03.**

Arquivos: `tests/TestCase.php`, `phpunit.xml`, `tests/Feature/BusinessRules/CardapioAndStorageTest.php`, `package.json`, `playwright.config.js`; criar runners em `scripts/testing/`.

1. Fixar o ambiente PHP de teste e validar a conexão efetiva antes de `RefreshDatabase`/migrações. Em SQLite, aceitar `:memory:`; em teste de integração, somente arquivo/banco explicitamente criado pelo runner. Recusar cache de configuração que sobreponha esses valores.
2. Isolar o caminho público por execução antes de bootar os serviços que o capturam. Substituir `cleanDirectory` de upload compartilhado por limpeza exclusiva de diretório temporário criado pela própria suíte. Usar `Storage::fake` quando o fluxo for movido para discos em T18/T24; até lá, `usePublicPath` temporário também precisa proteger código que chama `move` diretamente.
3. Criar um runner E2E multiplataforma, preferencialmente Node já disponível no projeto: criar pasta exclusiva dentro de `test-results`, SQLite novo, public/uploads e views separados, env explícito, token de identificação da execução e porta exclusiva. O servidor e a preparação devem receber exatamente a mesma configuração.
4. Não aceitar URL arbitrária por variável para preparar banco. Desabilitar `reuseExistingServer`; porta ocupada deve falhar. Um marcador de execução só pode existir no ambiente de teste, sem endpoint de diagnóstico em produção.
5. Preparar apenas esse banco, executar build/seed de teste e Playwright, encerrar somente o processo criado pelo runner. Verificar códigos de saída; falha de preparação impede o navegador de prosseguir. Arquivos de sessão não entram no Git. Inicialmente usar um worker, pois as fixtures atuais compartilham usuários e dados mutáveis.
6. Manter `npm run test:e2e` como entrada segura que prepara e executa o ambiente isolado. Se preservar `test:e2e:prepare`, fazê-lo passar pelas mesmas guardas. Nunca delegar segurança apenas ao nome do arquivo ou a uma confirmação manual.

**Concluído quando:** Q01–Q03 passam, os comandos normais de teste são seguros e a baseline existente é reproduzida. Não “resolver” removendo o teste de upload.

## T01 — Fechar os atalhos de autenticação

**A01/A02. Depende T00. S01–S03.** Arquivos: `AuthController.php`, `routes/api.php`, `AuthenticationTest.php`, testes de cadastro em `ApiCoverageTest.php` e frontend de login se necessário.

Remover as senhas alternativas do login. Preservar limite de tentativas, validação e contrato de token. Na rota legada `/api/register`, devolver 403 sem criar usuário/token; manter a criação administrativa autenticada. Ajustar as expectativas antigas de cadastro aberto e documentar a decisão. Não remover `Hash::check` nem permitir bypass de demonstração. Validar os três ambientes e um fluxo administrativo completo.

## T02 — Eliminar HTML dinâmico executável

**A03. Depende T00. S04–S06.** Arquivos: `UsuariosPage.jsx`, `PlanejamentoPage.jsx`, `AutorizadosPage.jsx`, `CategoriasPage.jsx`, componentes de produção/contagem, `DetailsPanel.jsx`, `utils/modals.js`, `utils/sweetAlert.js` e demais ocorrências encontradas.

1. Inventariar `html:`, `dangerouslySetInnerHTML`, `innerHTML`, interpolação em atributos e geração de conteúdo para PDF.
2. No modal de usuário, usar elemento DOM/React e atribuições `.value`/texto; nunca construir um atributo com nome/email interpolado. Aplicar o mesmo padrão nos outros formulários.
3. Renderizar descrição como texto. URLs de imagem devem vir de contrato controlado, sem interpolação de HTML; bloquear esquemas executáveis.
4. Testar texto adversarial em todas as famílias de componentes afetadas e a exploração demonstrada com SweetAlert real no E2E.

O teste precisa provar que o texto permaneceu visível e editável e que o marcador não executou. Mockar `Swal.fire` em todos os testes não comprova a correção.

## T03 — Separar bootstrap de dados E2E

**A04. Depende T00/T01. S07–S09.** Arquivos: `DatabaseSeeder.php`, `E2eSeeder.php`, demais seeders, novo comando em `app/Console/Commands/`, `provision-vm.sh` e guia de instalação.

Extrair o catálogo mínimo e definir a política de reexecução para registros excluídos logicamente, sem violar índices únicos. Retirar contas de teste e fatos de exemplo do seeder padrão. Exigir ambiente de teste e identificação de banco descartável no E2eSeeder. Criar comando para o primeiro gestor com senha fornecida por entrada protegida, validada e nunca impressa; se a identidade já existir, encerrar sem redefinir credenciais. Retirar a chamada automática ao seeder de demonstração da implantação e documentar bootstrap separado. Provar reexecução sem alteração de senhas/histórico.

## T04 — Revogar sessões após mudanças sensíveis

**A05. Depende T00. S10–S12.** Arquivos: `UserController.php`, serviço de usuários a criar e testes de autenticação/gestão.

Centralizar alteração de senha/perfil/exclusão em transação. Validar primeiro; persistir a mudança e remover tokens do usuário afetado no mesmo commit. Simples edição de nome/email não revoga tokens. Reutilizar a política no reset próprio existente. Se o usuário atual perde a sessão, o cliente deve voltar ao login após 401; nunca manter uma tela operacional como se a sessão fosse válida. No teste, emitir Bearer real e limpar os guards entre chamadas; `actingAs` sozinho não verifica revogação.

## T05 — Corrigir as datas dos Resources

**A06. Depende T00. C01–C04.** Arquivos: `ContagenResource.php`, `DashboardResource.php`, `AlunoResource.php`, `ControleDeProducaoEConsumoResource.php` e todos os Resources com datas civis.

Formatar cada data civil explicitamente como `Y-m-d`; preservar `null`. Manter timestamps ISO. Ajustar fixtures MSW para o contrato HTTP real e adicionar asserções exatas, substituindo os testes que só conferem prefixo. Validar totais e inputs de data nas telas e após recarga. Essa tarefa corrige serialização; o cálculo do dia pertence a T22.

## T06 — Gravação atômica e repetição segura de contagem

**A07. Depende T05/T08/T22. C08–C10.** Arquivos: `ContagemService.php`, controllers de contagens, novo FormRequest/serviço de operação, rotas e nova migração de idempotência.

1. Desempatar listagem/dashboard por data, hora e ID descendentes. Todos os consumidores devem escolher a mesma revisão; não somar revisões da mesma turma/dia como se fossem turmas distintas.
2. Criar operação aditiva `POST /api/contagens/operacao`, antes das rotas com parâmetro, conforme documento 04. Validar todos os dados, relação ativa, turma correspondente, permissão e dia antes da gravação.
3. Criar/atualizar contagem e aplicar as mudanças NES na mesma transação. A entrada NES identifica cada vínculo e, ao remover/editar um registro existente, o ID daquela presença. Não remover todas as presenças diárias para contornar duplicatas antigas.
4. Persistir chave de idempotência com índice único por usuário+operação+chave, hash canônico do payload e resposta final. Mesma chave e payload retornam resultado anterior; mesma chave e payload diferente retornam 409. Falha da operação reverte gravações e não deixa resultado fictício de sucesso. Tratar corrida pela restrição conhecida e consultar o resultado confirmado; não converter toda falha SQL em replay.
5. Levar a mesma proteção opcional às rotas legadas de criação quando recebem a chave; preservar chamadas antigas sem chave. Não impor unicidade diária de negócio sem D04. A interface nova sempre deve enviar a chave e reutilizá-la em retry da mesma operação.

**Não ampliar escopo:** não criar conceito de refeição nem apagar histórico. A idempotência resolve repetição da mesma solicitação; operações diferentes continuam sujeitas à decisão D04. Atualizações concorrentes independentes ainda precisam da política de conflito registrada nessa decisão.

## T07 — Modal de contagem com rascunho e confirmação

**A07. Depende T02/T05/T09/T06. C05–C07 e E2E de C08–C09.** Arquivos: `ContagemPage.jsx`, componente novo em `features/contagem`, `contagens.api.js` e exports.

Ao abrir, carregar somente dados; inicializar a quantidade existente ou zero para novo registro, salvo valor sugerido explícito em requisito futuro. Quantidade e seleções NES ficam em estado local. Salvar envia uma operação T06 com chave estável para o payload em andamento; bloquear clique duplo. Cancelar, Esc e fechar descartam o rascunho. Em erro, manter valores e apresentar mensagem; em sucesso, recarregar dados confirmados. Não usar `Promise.all` de várias mutações como substituto de transação. Não fechar o modal anunciando sucesso antes da resposta.

## T08 — Contratos de vínculo na API e adaptadores

**A08. Depende T05. C11–C13.** Arquivos: `AlunoResource.php`, Resources de necessidades/cronograma/vínculos, `escolar.api.js`, `cronograma.api.js`, fixtures MSW e testes de API.

Adicionar identificador do vínculo e alias de compatibilidade apenas quando o pivot correto estiver carregado. Manter envelopes e relações aninhadas. No serviço frontend, desembrulhar o detalhe de necessidade e normalizar cronograma para DTOs do documento 04. Mapear IDs explicitamente. Localizar consumidores de `getDiasDaRelacao`; remover export morto ou fornecer implementação compatível com uma rota existente, sem inventar URL. Usar IDs diferentes para aluno, necessidade, vínculo, dia e agendamento nos testes.

## T09 — Consumidores de planejamento, cronograma e NES

**A08. Depende T08. C14–C15.** Arquivos: `PlanejamentoPage.jsx`, `CronogramaPage.jsx`, `DashboardNutri.jsx`, `ContagemPage.jsx`, relatórios correspondentes.

Consumir os DTOs normalizados. Listas de presença e seleção devem ser indexadas por `relacao_id`, não por aluno nem agendamento. Um aluno com duas necessidades não pode colapsar em uma única entrada. Associar aluno, agendar, remover dia e recarregar devem preservar a mesma relação. Manter os endereços corretos do integrado: `/alunos-necessidades/{relacao}/dias` para POST e DELETE.

## T10 — Paginação e filtros no servidor

**A09. Depende T00. C16–C17.** Arquivos: controllers de alunos/necessidades/turmas/categorias/cronogramas/usuários/contagens, `ProducaoConsumoService.php`, requests de listagem.

Padronizar `page>=1`, `limit` inteiro entre 1 e 1000, mantendo limites padrão existentes documentados. Aplicar filtros antes de paginar; manter `data`, alias `date` e intervalos já existentes. Ordenação sempre com desempate por ID. Não retornar tudo de forma irrestrita e não ignorar parâmetros inválidos. `data_fim < data_inicio` retorna 422. Conferir paginação também de produção e consultas de dashboard que dependem das listas.

## T11 — Listas e relatórios completos no cliente

**A09. Depende T10/T08/T22. C18–C19.** Arquivos: módulos de serviços, helper HTTP de paginação a criar, telas de gestão e relatórios.

Separar operações `getPagina...` de `getTodos...`. Percorrer páginas pelo número/meta validado da mesma rota, conservando filtros; não seguir URL arbitrária de resposta com Bearer. Limitar páginas/itens e informar falha explícita ao exceder o teto, nunca apresentar resultado parcial como completo. Deduplicar por ID, detectar página repetida, permitir cancelamento e interromper se qualquer página falhar. Não manter valor padrão de 1000 supondo que resolveu mais de 1000 registros. Consultas NES de um dia precisam enviar a data escolar. Interface paginada de gestão deve tornar os demais itens acessíveis.

## T12 — Revisão de autorizações e persistência de recusa

**A10. Depende T00. P01–P04.** Arquivos: `AutorizadoService.php`, `Autorizado`/enum, requests, `AutorizadoController.php`, `AutorizadosPage.jsx`, nova migração e documentação RN17.

Adotar D01: conteúdo gerido pela Nutri e decisão exclusiva da direção. Rejeitar tentativa de status na atualização comum; usar enum para os três valores. Implementar transições do documento 04, campos opcionais de ator/data da decisão e nova migração para bancos existentes. Testar SQLite e MySQL, inclusive upgrade com autorizações pendentes/confirmadas já gravadas. Manter a rota `/autorizados/update/{id}`. Não preencher autor histórico por suposição nem reabrir autorização decidida ao editar conteúdo silenciosamente.

## T13 — Unificar permissões de backend e telas

**A11. Depende T01/T04/T12. P05–P08.** Arquivos: rotas, middleware/policy de gestão de usuários, `UserController.php`, `bootstrap/app.php`, `App.jsx`, `usePermissions.js`, navegações.

Criar permissão específica de gestão de usuários para Nutri/Diretoria. Aplicar em index/show alheio/create/update alheio/delete, sem quebrar perfil próprio do Staff. Validar atribuição de perfil somente nesse fluxo. Manter NutriRole para gestão operacional. Restringir escrita de contagem comum como NES. Remover botões/rotas frontend que oferecem ações negadas; o servidor continua responsável pela autorização. Consultas diretas e payloads forjados devem ser testados. Não abrir todos os recursos Nutri à Diretoria para fazer um E2E passar.

## T14 — Unicidade no create e update

**A12. Depende T00. V01–V03.** Arquivos: requests/modelos/controllers de aluno, turma e cronograma; serviço de persistência quando necessário.

Usar `Rule::unique` com ID do modelo vinculado pela rota no `ignore`. Para turma, validar nome+categoria resultantes do PATCH, inclusive alteração só da categoria. Preservar índices do banco e política de identidade com soft delete. Provar que o próprio RM/nome não bloqueia update. Em corrida, mapear somente a violação dos índices conhecidos a erro por campo/409; exceções de conexão continuam erro interno. Não remover índices para evitar 500.

## T15 — Limites compatíveis com o schema

**A12. Depende T14. V04–V05.** Arquivos: requests de turma/contagens/produção, campos HTML e mensagens de validação.

Aplicar 45 caracteres para nome da turma tanto na criação como edição; quantidades inteiras de 0 a 2147483647; `decimal(8,2)` até 999999.99, não negativo e no máximo duas casas. Confirmar todos os campos reais nas migrações antes de reutilizar regras. Valores decimais em input devem ser validados no servidor, sem arredondar silenciosamente. Executar a fronteira também em MySQL descartável. Ampliar tipo SQL exige requisito separado, não é necessário para rejeitar dados inválidos.

## T16 — Integridade de vínculos e remoção estrita

**A13/A14. Depende T08/T14. V06–V10.** Arquivos: requests com `exists`, `AlunoController`, `NecessidadeController`, `ContagemNeRequest`, serviço de vínculos novo.

Validar pais ativos quando a tabela usa soft delete; validar os dois pais da relação NES. Unificar checagem/gravação/exclusão no serviço com transação e bloqueio coerente quando houver corrida. Preservar leitura histórica e impedimento de remover relação que já tem contagem. Normalizar `alunos` para um único inteiro positivo ou array unitário de inteiro; rejeitar os demais formatos antes de qualquer cast. Manter 404 de vínculo inexistente e 409 de histórico. Remover agendamentos dependentes apenas dentro da mesma operação permitida.

## T17 — Atualização e histórico do chat

**A15. Depende T00. C20–C22.** Arquivos: `ChatPage.jsx`, `chat.api.js`, `ChatController.php` e testes.

Retirar a comparação exclusiva de tamanho. Atualizar a página recente pelo conteúdo, mesclar histórico por ID e ordenar deterministicamente. Introduzir ação simples de carregar anteriores. Cancelar polling ao desmontar e proteger contra resposta mais antiga sobrescrevendo a recente. Usar estado funcional para preservar o rascunho e as páginas anteriores. Testar mensagens 21/22 e edição com total constante no navegador real.

## T18 — Consistência entre PDF e banco

**A16. Depende T00. F01–F04.** Arquivos: `CardapioController`, `FileController`, `FileService`, serviço de cardápio novo, config de discos e testes de storage.

Usar disco configurado e guardar referência relativa controlada. Criar/substituir com compensação: novo arquivo é removido se a transação falhar; antigo só é removido depois do commit. Falha de limpeza precisa de registro e retentativa identificável; não simular atomicidade entre filesystem e SQL. Exclusão e uploads avulsos também precisam de dono/ciclo de vida documentado. Manter resposta 422 para entrada inválida, resposta 500 genérica para falhas internas e não expor caminho/stack. Testar `put`/`delete` retornando false e lançando exceção.

## T19 — Atualizar e validar as bibliotecas PDF

**A17. Depende T02/T11. F05–F07.** Arquivos: `package.json`, `package-lock.json`, componentes exportadores.

Reconsultar avisos oficiais/registry. Usar como ponto inicial jsPDF 4.2.1 e html2pdf.js 0.14.0, mantendo autotable compatível (5.0.8 aceita jsPDF 4 na consulta da auditoria). Atualizar dependências e lock coordenadamente, inspecionar versões transitivas, rodar audit e corrigir chamadas quebradas. Não usar `audit fix --force` nem sobrescrever metadados para ocultar aviso. Gerar os três relatórios em Chromium e conferir texto, linhas finais e paginação. Adiar otimização de bundle se não for necessária à compatibilidade.

## T20 — Separar release de dados persistentes

**A18. Depende T03/T18/T24. I01–I03.** Arquivos: `deploy/terraform/main.tf`, `provision-vm.sh`, script de empacotamento novo e guia.

Definir manifesto de código incluindo os dois locks; excluir `.env`, SQLite, uploads, logs, caches, `public/hot`, dependências locais e estado Terraform. Usar releases versionadas e diretório persistente compartilhado para banco/arquivos/configuração. Preservar chave existente; criar apenas em instalação vazia. Instalar dependências a partir do lock, executar migrações sem `fresh`, sem dados de demonstração. Documentar backup consistente de SQLite e teste de restauração; guardar backup fora da release. Publicar nova release somente após saúde validada e permitir retorno à anterior, observando compatibilidade de schema.

## T21 — Separar gestão de VM e atualização da aplicação

**A19. Depende T20. I04–I06.** Arquivos: Terraform, `up.ps1`, scripts de provisionamento/exportação e guia.

Retirar destruição de disco do caminho de atualização/substituição automática. Separar criação da VM, ajuste de hardware e publicação por hash/versão do pacote. Uma mudança de memória não deve substituir armazenamento. Checar `$LASTEXITCODE` imediatamente após cada comando nativo PowerShell; impedir mensagem de sucesso se build, tar, SCP, SSH, migrate ou saúde falhar. Preservar NAT e regras de encaminhamento do AGENTS. Preparar operação explícita de descarte separada, sem executá-la durante a auditoria/implementação. Validar plano e ensaio somente com VM descartável identificada.

## T22 — Unificar o dia escolar e a virada de data

**A21. Depende T05. C23–C25.** Arquivos: config nova ou existente para escola, serviços/controllers de contagem/dashboard/NES, helper/hook frontend em `features/contagem` e consultas.

Manter timezone de timestamps em UTC. Adicionar `SCHOOL_TIMEZONE=America/Sao_Paulo`, resolver dia escolar com relógio injetável/congelável e comparar datas civis. Filtro NES usa intervalo `[início local convertido a UTC, início do próximo dia convertido a UTC)`, não `whereDate` UTC. Compartilhar informação de data/fuso com frontend por contrato autenticado; calcular dia da semana no mesmo fuso. Revalidar na virada e ao voltar à aba. Adotar D03: editar só o dia escolar atual; não implementar prazo rígido de 07h30 nem exceção histórica sem requisito confirmado. Não converter linhas antigas automaticamente.

## T23 — Separar totais regulares e Outros

**A22. Depende T05/T11. C26–C27.** Arquivos: categoria/Resource, nova migração, dashboards, relatório de contagem e utilitário compartilhado.

Adicionar atributo explícito `inclui_total_regular` com default true para preservar categorias normais. Backfill controlado da categoria existente Outros para false, sem alterar contagens. Expor o atributo e reutilizar uma regra única de agregação que selecione a contagem efetiva de cada turma/dia antes de somar. Mostrar totais regulares/Outros/combinados com rótulos claros. Uma mudança futura do atributo com efeito histórico exige política D05; não oferecer essa edição como parte desta correção.

## T24 — Proteger fotos e reduzir dados do chat

**A23. Depende T02/T09/T18/T13. S13–S15.** Arquivos: `FileService`, rotas/controllers de foto, config de discos, `AlunoResource`, componentes de imagem, `ChatResource`, `getChatMembers` e Resource de participante novo.

Mover novas fotos a disco privado e responder apenas por endpoint autorizado. Vincular upload ao aluno ou usar identificador temporário opaco com dono, sem aceitar caminho arbitrário do cliente. Consumir com Bearer e object URL; revogar URL ao substituir/desmontar. Migrar arquivos existentes em procedimento idempotente com inventário, hash, cópia verificada e atualização de referência; remover cópia pública somente após verificar integridade. Não apagar o diretório inteiro, que pode conter PDFs e outros arquivos. Garantir que rota estática/Nginx não continue expondo a foto antiga. Chat/membros recebem Resource mínimo sem NIF/email; próprio perfil e gestão autorizada mantêm seus contratos completos.

## Verificação final e entrega

Depois de T00, os comandos de entrada esperados são:

```powershell
Set-Location C:\Projetos\contador-v2
php artisan test
npm run test:front
npm run lint
npm run build
npm run test:e2e
composer validate --no-check-publish
composer audit --locked
npm audit --json
```

O runner de T00 deve abortar se a conexão/armazenamento não estiverem isolados; não executar migrações destrutivas diretamente. Para testes por tarefa, usar `php artisan test --filter=NomeDaClasseOuMetodo`, `npm run test:front -- caminho/do/arquivo.test.jsx` e seleção equivalente no runner E2E seguro. Estes comandos são instruções futuras; não representam testes já executados sobre as correções.

Entregar relatório final com achados resolvidos, testes novos e resultados, migrações, compatibilidade preservada e verificações pendentes. Se MySQL/VM não estiverem disponíveis, manter pendência explícita. Um teste ignorado não equivale a aprovação. Não publicar nem aplicar as correções na escola automaticamente.
