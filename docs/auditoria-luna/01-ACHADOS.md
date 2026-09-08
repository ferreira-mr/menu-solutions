# Achados da auditoria

Os caminhos abaixo são relativos à raiz `C:\Projetos\contador-v2`. As linhas referem-se ao commit registrado no README desta auditoria. P1 = tratar antes de liberar uso/atualização na escola; P2 = corrigir na sequência, antes da homologação final. "Reproduzido" significa execução com dados sintéticos; "estático" significa evidência no código, sem executar implantação ou ataque em ambiente real.

## A01 — P1 — Senhas universais no login local

**Onde:** `app/Http/Controllers/AuthController.php:38`.

O login aceita a senha armazenada **ou**, quando `app()->isLocal()`, uma das duas senhas fixas presentes no código. Assim, conhecer o NIF basta para acessar qualquer conta em uma instalação iniciada com `.env.example`, cujo `APP_ENV` é `local`.

**Reprodução:** `atalho_senha_local` em `reproducao.json`: a senha não confere com o hash e o login retorna 200. O teste existente valida apenas `APP_ENV=testing` e não detecta o desvio.

**Correção:** remover a alternativa de senha fixa. Todos os ambientes precisam validar o hash. Dados de demonstração devem ser criados por seeders de teste isolados, com credenciais restritas àquele conjunto de dados. Não introduzir outro bypass por flag.

**Aceite:** senha errada retorna 401 em `local`, `testing` e `production`; senha correta continua gerando token. Testes S01–S02. Tarefa T01.

## A02 — P1 — Cadastro público concede acesso operacional sem aprovação

**Onde:** `routes/api.php:31`, `AuthController::register`.

Qualquer pessoa que alcance a API pode criar uma conta Staff, ler alunos/necessidades e registrar contagens. Não há convite, aprovação ou comprovação de vínculo com a escola. O nível não é elevado para Nutri pelo payload, mas **Staff já possui acesso restrito pela RN12**.

**Reprodução:** `cadastro_publico`: cadastro 201, leitura de alunos 200, gravação de contagem 201.

**Correção proposta:** desativar o cadastro anônimo; manter `/api/register` com resposta 403 explícita, preservando o endereço sem conceder acesso. Criar usuários pela gestão autenticada. Se futuramente houver cadastro público, deverá criar uma conta sem permissões até aprovação, como requisito separado.

**Aceite:** nenhuma conta/token é criada por chamada anônima; o fluxo administrativo continua funcionando. Atualizar os testes antigos que esperavam cadastro público, registrando a mudança intencional. S03. T01.

## A03 — P1 — XSS armazenado permite executar código no navegador administrativo

**Onde:** `resources/js/pages/GerenciarUsuarios/UsuariosPage.jsx:50` e `:53`; também há interpolação de HTML em formulários de alunos, autorizações, categorias e produção. `resources/js/components/ContagemGeral/DetailsPanel.jsx:93` usa `dangerouslySetInnerHTML` com descrição de aluno.

O próprio Staff pode alterar seu nome via API. O nome é interpolado no atributo `value` de um HTML passado ao SweetAlert, sem escape. Quando a Nutri abre "Editar", esse conteúdo passa a ser HTML executável. O token da aplicação fica em `localStorage` e o código injetado roda na mesma origem.

**Reprodução em Chromium:** `browser.json`, campo `xss`: um marcador local inofensivo no nome foi executado no navegador da Nutri. Nenhum token foi lido ou transmitido no diagnóstico.

**Correção:** montar campos com React/DOM e atribuir texto por `textContent` e valores por `.value`. Para descrições, renderizar texto por padrão. Caso formatação rica seja um requisito confirmado, adotar sanitização com lista explícita de elementos/atributos permitidos; não fazer escape ad hoc por substituições incompletas. Procurar todos os `html:`/`dangerouslySetInnerHTML`; dados dinâmicos não podem formar HTML cru, nem URLs sem validação.

**Aceite:** nomes com aspas, `<`, `>`, acentos e marcadores HTML aparecem literalmente e são editáveis. Nenhum evento/elemento executável é criado. Testar a biblioteca real de modal pelo menos em um E2E, sem mock. S04–S06. T02.

## A04 — P1 — Implantação cria usuários E2E e restaura senhas conhecidas

**Onde:** `database/seeders/DatabaseSeeder.php:16`, `E2eSeeder.php:13`; `deploy/terraform/scripts/provision-vm.sh:89`.

O seeder padrão chama `E2eSeeder`, e o provisionamento executa o seeder padrão em produção. `updateOrCreate` regrava senhas de contas predefinidas, incluindo a Nutri. Um novo provisionamento pode restaurar uma senha pública depois que ela já foi alterada. O seeder também insere produção e autorização de exemplo em dados operacionais.

**Reprodução:** `seeder_producao_simulada` usa o ambiente de configuração de produção sobre banco em memória: criou nível 2 e repôs a senha pública na segunda execução. Nenhum banco de produção foi usado. O seeder também colide com índices únicos quando encontra um dia padrão previamente excluído logicamente.

**Correção:** separar catálogo inicial, usuário inicial e exemplos E2E. O seeder E2E deve recusar execução fora de teste e exigir banco explicitamente destinado a E2E. O catálogo inicial não deve regravar senhas nem inserir fatos operacionais de exemplo. Criar o primeiro gestor por comando controlado, sem senha literal e sem imprimir a senha no log. Reexecutar o bootstrap não deve alterar conta existente.

**Aceite:** duas execuções preservam senha e registros existentes; produção não contém contas/dados E2E criados pelo processo. S07–S09. T03.

## A05 — P1 — Reset administrativo não revoga tokens antigos

**Onde:** `app/Http/Controllers/Api/UserController.php:76` até `update($validated)`.

O fluxo de troca da própria senha revoga tokens; a alteração de senha pela gestão apenas atualiza o hash. Um token emitido antes do reset administrativo continua utilizável.

**Reprodução:** `reset_admin_token_antigo`: reset 200 e acesso posterior com o token antigo 200. Foi descartado o guard entre requisições, portanto não é reaproveitamento artificial do usuário pelo teste.

**Correção:** ao mudar senha administrativamente, revogar todos os tokens do usuário afetado na mesma transação. Aplicar a política também a desativação e mudanças de perfil, para obrigar o cliente a obter o novo perfil. Não revogar tokens por simples edição do nome.

**Aceite:** token anterior recebe 401 em requisição nova; login com a nova senha funciona. S10–S12. T04.

## A06 — P1 — Contrato de data faz contagens válidas aparecerem como zero

**Onde:** `app/Http/Resources/ContagenResource.php:19`, `DashboardResource.php:22`, `AlunoResource.php:25`, `ControleDeProducaoEConsumoResource.php:20`; `resources/js/pages/Inspetora/ContagemPage.jsx:70`, `:75`; `DashboardNutri.jsx:110`.

Os Resources retornam objetos Carbon. A API entrega, por exemplo, `2026-09-07T00:00:00.000000Z`, e as telas comparam por igualdade com `2026-09-07`. O cast `date:Y-m-d` do modelo não resolve quando o Resource devolve diretamente o objeto. Datas de nascimento/produção também chegam a campos HTML `type=date` em formato incompatível.

**Reprodução em navegador:** contagem de 12 alunos persistida, total exibido 0 e turma apresentada como não contada. `browser.json/contagem`.

**Correção:** datas civis devem ser strings `YYYY-MM-DD` explícitas nos Resources, usando `?->toDateString()`. Timestamps como `created_at` continuam ISO com fuso. Definir DTOs de frontend com essas distinções. Não usar substring indiscriminadamente em timestamps para resolver a data operacional; isso pertence a A21.

**Aceite:** contagem, dashboard, edição de aluno e produção usam datas corretas após recarregar a página; nulos continuam nulos. C01–C04. T05.

## A07 — P1 — Abrir/fechar contagem grava 32; repetição e empates distorcem o resultado

**Onde:** `resources/js/pages/Inspetora/ContagemPage.jsx:78–115`, `:169–199`; `app/Services/ContagemService.php:21–26` e `getDashboard`; `DashboardResource.php:16`; `ContagemNeController::store`.

O formulário cria uma contagem com valor inicial 32 **antes** da confirmação. Fechar mantém a gravação. As chaves de presença NES também gravam imediatamente. A06 faz uma contagem existente não ser reconhecida, agravando a criação de duplicatas. O backend aceita repetição de POST; duas contagens no mesmo segundo não têm desempate por ID e o dashboard pode escolher a mais antiga. NES aceita dois POSTs iguais como duas presenças.

**Reprodução:** no navegador, existia 1 contagem; abrir e fechar sem salvar deixou 2. No PHP, contagens 10 e 20 no mesmo segundo fizeram o dashboard mostrar 10; dois POSTs NES retornaram 201.

**Correção imediata:** estado de rascunho no modal, nenhuma mutação antes de Salvar, confirmação desabilitada enquanto salva e tratamento visível de falha. Se já há contagem atual, atualizar o ID existente; ao criar, enviar o valor escolhido, sem lançamento inicial fictício. Ordenar por data/hora/ID para desempate determinístico.

**Integridade adicional:** coordenar contagem e presenças em serviço transacional; usar chave de idempotência para repetição da mesma operação. Não apagar registros antigos para impor unicidade diária. A regra sobre várias refeições/revisões por turma precisa da decisão D04 antes de adicionar índice único de negócio.

**Aceite:** Fechar/Esc/cancelar não alteram banco; falha parcial não fica como sucesso; clique duplo/retry da mesma operação não duplica; última contagem em empate é determinística. C05–C10. T06/T07.

## A08 — P1 — Contratos de vínculos quebram planejamento, cronograma e NES

**Onde:** `AlunoResource.php`, `NecessidadeResource.php`, `CronogramaResource.php`; `resources/js/services/modules/escolar.api.js:5`; `CronogramaPage.jsx:43–71`; `PlanejamentoPage.jsx:101` e `:286`; `DashboardNutri.jsx:81–88`; `ContagemPage.jsx:89–100`.

Há três divergências independentes: (1) detalhe de necessidade retorna `{data:{...}}`, mas consumidores leem `nec.alunos`; (2) `AlunoResource` omite `pivot.id`, necessário para identificar aluno+necessidade; (3) `cronograma.alunos` contém registros de vínculo com `aluno_has_necessidade`, mas telas esperam alunos com `necessidade_relacionada`. IDs de aluno, vínculo e agendamento são confundidos. Muitos mocks já fornecem o formato que a tela espera, por isso passam.

**Reprodução:** respostas reais em `contrato_necessidade` e `contrato_cronograma`. As rotas POST/DELETE de agendamento do integrado estão corretas; não aplicar a correção de URLs da API separada. O helper `getDiasDaRelacao` exporta um GET que não existe; localizar usos antes de mantê-lo.

**Correção:** preservar os envelopes HTTP da API; normalizar detalhe de necessidade na função de serviço do frontend. Expor `alunos_has_necessidades_id` e um alias transitório `pivot.id` apenas quando o pivot estiver carregado. Normalizar os agendamentos em DTO explícito, mantendo distintos `aluno_id`, `relacao_id` e `agendamento_id`. Ajustar todas as telas consumidoras, incluindo relatórios. Ver documento 04 para os formatos.

**Aceite:** aluno relacionado aparece em Planejamento, pode ser agendado, aparece no dia correto e a presença NES usa o ID do vínculo. Usar IDs propositalmente diferentes nos testes. C11–C15. T08/T09.

## A09 — P1 — Telas e relatórios usam apenas a primeira página

**Onde:** `AlunoController::index`, `NecessidadeController::index`, `TurmaController::index`; `ProducaoConsumoService::list`; módulos frontend `escolar.api.js`, `contagens.api.js`, `producao.api.js` e consumidores.

O frontend pede `limit=100/1000`, mas vários controllers ignoram `limit` e retornam 20 itens. Produção retorna 15; as funções de relatório não percorrem `links`/`meta`. Contagem geral já aceita data/range e NES já filtra data; essas correções existem, mas os clientes continuam pegando uma página, e a consulta NES usada no dashboard nem envia a data.

**Reprodução:** 23 alunos, `?limit=1000`, apenas 20 recebidos. Inspeção de consumo mostra listas/relatórios construídos diretamente desse array.

**Correção:** paginação validada e limitada no backend; funções distintas para página de gestão e obtenção completa de dados necessários ao relatório, percorrendo páginas de forma limitada e previsível. Filtrar datas no servidor antes de paginar. Relatório deve receber todo o período, não apenas o primeiro lote; não resolver com `get()` irrestrito em todos os endpoints.

**Aceite:** dados após os itens 15, 20, 100 e 1000 não desaparecem silenciosamente. Limites excessivos/inválidos recebem 422. C16–C19. T10/T11.

## A10 — P1 — Aprovação pode ser feita pela Nutri e recusa não funciona

**Onde:** `Autorizado::updateRule`, `AutorizadoService::update/approve`, `AutorizarUpdateRequest.php:28`, migration `2025_11_28_134703_create_autorizados_table.php:18`.

A atualização comum da Nutri aceita `status=confirmado`, contornando a revisão exclusiva da direção descrita em AGENTS. O enum possui `Recusado`, mas validação e banco só admitem `pendente/confirmado`. A documentação RN17 contradiz AGENTS sobre quem aprova.

**Reprodução:** `permissoes`: Nutri aprova pela rota comum (200); direção tenta recusar (422). A rota correta de aprovação usada pela tela integrada funciona; não é necessário trocá-la.

**Correção orientada por AGENTS:** Nutri cria/edita conteúdo; direção decide status. Acrescentar `recusado` por nova migração compatível com bancos existentes e validação pelo enum. Não editar somente a migração de criação. Definir transições e registrar ator/data da decisão, sem inventar autor para decisões antigas. Consolidar RN17. Detalhes em D01.

**Aceite:** Nutri não aprova via payload alternativo; direção confirma/recusa; resposta, persistência e UI concordam. P01–P04. T12.

## A11 — P2 — Diretoria tem telas gerenciais sem permissão no backend

**Onde:** `resources/js/App.jsx` rotas `/diretora/*`; `usePermissions.js`; `UserController::index/show/update`; `routes/api.php`.

AGENTS e README atribuem gerenciamento de usuários à direção. O frontend oferece a tela, mas `/api/users` retorna 403. A direção também consegue abrir páginas de produção e catálogos com botões de gestão que o backend recusa. O E2E "acessa gerenciamento de usuários" passa ao verificar o título, mesmo com a API negada.

**Reprodução:** `diretor_listar_usuarios=403`; leitura dos testes/telas. Contagens comuns aceitam todos os autenticados, enquanto NES restringe a Staff/Nutri e `usePermissions.canCount` também restringe.

**Correção:** consolidar matriz do documento 04. Conforme AGENTS, permitir gestão de usuários a Diretoria e preservar a administração já disponível à Nutri. Separar essa permissão de `NutriRole`, sem abrir produção/alunos indiscriminadamente. Tornar páginas não autorizadas inacessíveis ou em modo de leitura coerente. Contagem escrita apenas para Staff/Nutri.

**Aceite:** navegar, carregar dados e executar operações autorizadas, não só ver o título. Testar todas as rotas por perfil e os efeitos no banco. P05–P08. T13.

## A12 — P2 — Duplicidades geram 500 e limites não correspondem ao banco

**Onde:** `AlunoController::update`, `Aluno::updateRule`, `TurmaRequest`, `Turma::updateRule`, `CronogramaRequest`, requests/modelos de contagens e produção.

Update de RM não valida unicidade. Turma não valida a combinação única categoria+nome. Cronograma não valida dia único. Nome de turma no update não limita 45 caracteres. Contagens/pessoas aceitam valores acima de um inteiro de 32 bits; produção aceita valores acima de `decimal(8,2)`.

**Reprodução:** três duplicidades retornaram 500; nome de 46 caracteres foi aceito no SQLite; `2147483648` e `1000000` foram aceitos em campos que excedem os tipos SQL declarados. O efeito específico de excesso no MySQL não foi executado. A precisão decimal da migration é 8,2 por padrão do Blueprint instalado; o significado de precisão/escala está no [manual MySQL](https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html).

**Correção:** FormRequests separados ou regras que distinguem create/update; `Rule::unique(...)->ignore($model->id)` com escopo da categoria efetiva. Validar o valor resultante em PATCH, quando apenas nome ou categoria muda. Manter índices únicos e tratar somente violações conhecidas em corridas como erro de campo/conflito. Máximos coerentes: inteiros 2147483647, decimais 999999.99 e até 2 casas, salvo decisão de ampliar schema. Não mapear toda exceção SQL para 422.

**Aceite:** erro por campo 422; mesma identidade no próprio registro permitida; nome igual em outra categoria permitido; nenhuma mudança parcial. V01–V05. T14/T15.

## A13 — P2 — Novos vínculos aceitam entidades excluídas logicamente

**Onde:** regras `exists:...` em Aluno/Turma/Contagen e controllers `relationNecessidades`, `relationCronograma`.

`exists:tabela,id` consulta a tabela sem excluir `deleted_at`. A aplicação pode criar turma em categoria excluída, contar turma excluída e associar necessidade/dia excluídos. As relações Eloquent escondem esses pais, produzindo dados invisíveis/inconsistentes.

**Reprodução:** os quatro casos em `vinculos_excluidos` retornaram 200/201.

**Correção:** `Rule::exists(...)->whereNull('deleted_at')` para pais com soft delete. Para vínculo aluno+necessidade, validar que os dois pais estão ativos. Aplicar em create e update e coordenar checagem/gravação com a exclusão no serviço transacional. Não adicionar `deleted_at` a uma tabela que não o possui só para usar a regra. A documentação de [validação Laravel](https://laravel.com/docs/12.x/validation#rule-exists) explica o filtro adicional.

**Aceite:** novos vínculos inválidos recebem 422 e nenhuma linha é criada. Histórico não deve desaparecer como efeito da correção. V06–V08. T16.

## A14 — P2 — Desassociação trunca IDs e ignora itens do array

**Onde:** `NecessidadeController::disableAluno`, especialmente `is_numeric`, cast para inteiro e seleção do índice zero.

Um ID textual como `1.9` é aceito e convertido em `1`; um array com dois alunos remove somente o primeiro e devolve 204.

**Reprodução:** `remocao_decimal` removeu a relação e `remocao_array` deixou uma relação restante com resposta de sucesso.

**Correção compatível com o cliente:** aceitar um inteiro positivo ou um array com exatamente um inteiro positivo; normalizar de forma explícita. Rejeitar decimal, notação científica, array vazio/múltiplo, booleano, objeto e texto. O cliente atual usa array de um item. Manter 404 para vínculo inexistente e 409 para histórico que impede remoção. Levar a operação ao serviço de vínculos.

**Aceite:** payload inválido não remove ninguém; vínculo correto é removido atomicamente com seus agendamentos permitidos. V09–V10. T16.

## A15 — P2 — Chat congela com 20 mensagens e ignora edições

**Onde:** `resources/js/pages/Chat/ChatPage.jsx:72–75`; `ChatController::index`.

O estado só muda quando a quantidade de mensagens difere. A API pagina em 20; depois de chegar a 20, novas mensagens substituem itens na página sem alterar seu tamanho e a tela não atualiza. A mesma condição impede atualização de texto/visto. Não há mecanismo de carregar mensagens anteriores.

**Reprodução em Chromium:** o polling recebeu a mensagem nova em uma página de 20, mas ela não apareceu na tela (`browser.json/chat`).

**Correção:** atualizar pelo conteúdo/ID/`updated_at` ou simplesmente substituir o lote recebido; manter ordem determinística por data e ID. Para carregar anteriores, usar paginação com merge por ID, preservando a posição de rolagem. Cancelar polling/requisições no unmount e preservar o rascunho.

**Aceite:** mensagens 21/22 aparecem, edições aparecem com mesmo total, não há duplicação, histórico anterior é acessível. C20–C22. T17.

## A16 — P2 — Falha de armazenamento deixa arquivos órfãos e retorna 422

**Onde:** `CardapioController::store/update/destroy`, `FileController`, `FileService`.

O PDF é movido antes de salvar o registro. Se o banco falha, sobra arquivo sem registro; no update também pode sobrar o novo arquivo. Falhas internas são convertidas em 422, confundindo indisponibilidade com entrada inválida. A exclusão de arquivo ignora o retorno booleano.

**Reprodução:** falha simulada do banco deixou 1 arquivo e 0 registros, com resposta 422. O diagnóstico usou pasta própria.

**Correção:** serviço de cardápio com compensação explícita: gravar novo arquivo, persistir em transação, remover o novo se persistência falhar; remover o antigo somente após sucesso. Tratar falha de limpeza com log e política de retry. Exceções de validação continuam 422; erro interno recebe resposta 500 genérica. Usar disco configurável para permitir `Storage::fake` sem mudar os contratos de URL indevidamente.

**Aceite:** falhas injetadas não perdem o arquivo anterior e não produzem órfão silencioso; criação/update/delete válidos funcionam. F01–F04. T18.

## A17 — P1 — Bibliotecas PDF têm avisos conhecidos de segurança

**Onde:** `package.json`, `package-lock.json`; exportações em `PlanejamentoPage.jsx`, `ProducaoFilterPanel.jsx`, `ReportFilterPanel.jsx`.

`npm audit` sinalizou 3 pacotes com gravidade crítica: `jspdf`, `html2pdf.js` e `jspdf-autotable` (este recebe a gravidade de jsPDF). Instalados: jsPDF 3.0.4, html2pdf.js 0.12.1, autotable 5.0.8. Isso **não prova** que todos os vetores sejam exploráveis pelos fluxos atuais; por exemplo, inclusão de arquivo local de jsPDF envolve o uso da biblioteca no Node, enquanto aqui a exportação principal ocorre no navegador.

As correções publicadas incluem [jsPDF 4.2.1 para injeção de HTML](https://github.com/parallax/jsPDF/security/advisories/GHSA-wfv2-pwc8-crg5) e [html2pdf.js 0.14.0 para XSS](https://github.com/eKoopmans/html2pdf.js/security/advisories/GHSA-w8x4-x68c-m6fc). As versões foram confirmadas no registry na data desta análise. O `fixAvailable:false` do relatório não significa ausência de versão corrigida; não executar `npm audit fix --force` indiscriminadamente.

**Correção:** testar atualização coordenada para jsPDF >=4.2.1 e html2pdf.js >=0.14.0, verificando árvore final e compatibilidade do autotable. Regenerar lock, testar os três tipos de exportação, nomes com acentos, paginação e volumes maiores. Verificar novamente os avisos no dia da implementação.

**Aceite:** as dependências resolvidas deixam de incluir versões afetadas por esses avisos; PDFs continuam abrindo e contendo todas as linhas esperadas. F05–F07. T19.

## A18 — P1 — Pacote de implantação mistura código, banco e arquivos de execução

**Onde:** `deploy/terraform/main.tf:133`; `provision-vm.sh:51–56`, `:82–89`.

O pacote inclui os diretórios inteiros `database`, `public`, `storage` e `bootstrap`. Isso pode levar SQLite local, uploads, `public/hot`, cache de configuração e logs à VM e substituir os arquivos existentes na extração. `composer.lock` fica de fora. O provisionamento ainda gera uma nova `APP_KEY` toda vez e roda os seeders de exemplo.

**Evidência:** inspeção estática da lista de empacotamento e da extração sobre `/var/www/contador-v2`. Não foi executado deploy com dados reais.

**Correção:** pacote de código com lista explícita, incluindo `composer.lock`, excluindo dados mutáveis/segredos/cache e marcador de servidor Vite. Banco, uploads, `.env` e chave devem permanecer fora do diretório de releases, ou ser preservados explicitamente. Só gerar APP_KEY quando ausente. Não copiar SQLite aberto sem backup consistente. Resolver A04 junto ao bootstrap.

**Aceite:** inspeção do tar não contém dados locais; reprovisionamento de uma VM descartável preserva registros, arquivos e chave; dependências respeitam o lock. I01–I03. T20.

## A19 — P1 — Atualização por Terraform pode não atualizar código ou destruir a VM

**Onde:** `deploy/terraform/main.tf:158–193`; `up.ps1`.

O `null_resource` só considera variáveis e hash do script, não o conteúdo da aplicação. Alterar código e executar `up` pode deixar o código antigo na VM. Quando um trigger muda, o recurso é substituído; seu provisioner de destruição chama `unregistervm --delete`, apagando a VM e seu disco. Alterar memória/CPU não deveria apagar os dados escolares. Chamadas nativas PowerShell não verificam consistentemente `$LASTEXITCODE`, podendo anunciar sucesso depois de falha.

**Evidência:** estática. Não foi provocado descarte real de VM.

**Correção:** separar ciclo de vida da VM, configuração de hardware e atualização da aplicação. Nenhuma atualização normal pode chamar exclusão de disco. Versão/hash do pacote deve conduzir uma publicação de código, com backup/rollback e checagem de retorno em cada comando. A remoção definitiva deve ser uma operação separada e explicitamente solicitada. Preservar NAT conforme AGENTS.

**Aceite:** alteração de código publica nova versão; ajuste de memória preserva o disco; falha de build/cópia/SSH/saúde faz o comando terminar com erro. I04–I06. T21.

## A20 — P1 — A própria execução dos testes pode apagar dados de desenvolvimento

**Onde:** `tests/Feature/BusinessRules/CardapioAndStorageTest.php:20–26`; `package.json` script `test:e2e:prepare`; `playwright.config.js`.

O teardown chama `File::cleanDirectory(public_path('uploads/pdf'))`, fora de armazenamento isolado. O script E2E executa `migrate:fresh --seed` sem fixar ambiente/banco. A configuração Playwright pode reutilizar um servidor já aberto. Assim, comandos apresentados como testes podem limpar uploads ou o banco configurado pelo desenvolvedor. O banco SQLite em memória do PHPUnit não isola o filesystem.

**Correção:** primeira tarefa do plano. Configurar disco/pasta própria por execução e usar fakes nos testes de upload. No E2E, exigir um caminho de banco descartável, barrar bancos de uso normal, não reutilizar servidor arbitrário e preparar somente esse banco. O script deve falhar antes de apagar qualquer coisa se a configuração não for segura.

**Aceite:** arquivos sentinela e um banco não pertencente à suíte permanecem intactos; configuração errada causa recusa. Q01–Q03. T00.

## A21 — P2 — Dia operacional e regras de horário são inconsistentes

**Onde:** `config/app.php:68`; `ContagemService`, controllers de contagem; `ContagemPage.jsx:26`, `contagens.api.js:4`, `DashboardNutri.jsx:56`.

O backend usa UTC; as telas misturam data UTC (`toISOString`) e dia da semana do navegador. Às 22h de São Paulo já é o dia seguinte em UTC. Um registro da mesma data escolar pode ficar bloqueado, e o cronograma usar um dia diferente da contagem. A data da tela fica congelada pelo `useMemo` até desmontar o componente. RN07 fala em 07h30 e RN14 contém exceção para retificação da Nutri, enquanto AGENTS diz somente dia atual para todos.

**Reprodução:** instante equivalente a 07/09 22h em São Paulo foi gravado como 08/09; editar a contagem de 07/09 retornou 400.

**Correção:** manter instantes em UTC e definir explicitamente `SCHOOL_TIMEZONE=America/Sao_Paulo` para datas operacionais. Centralizar cálculo de dia, janela de edição e filtros NES por intervalo UTC correspondente ao dia escolar. Atualizar a tela na virada do dia. Não converter dados antigos cegamente: avaliar os horários de origem. Decisão D03 separa prazo operacional de bloqueio automático.

**Aceite:** fronteiras 23h59/00h UTC (20h59/21h em São Paulo) e 23h59/00h local, mudança de dia/semana e aba aberta durante a virada são coerentes. C23–C25. T22.

## A22 — P2 — Total geral inclui a categoria Outros, contrariando RN15

**Onde:** `DashboardNutri.jsx:107–114`; `ContagemPage.jsx:68–72`; relatórios que somam essas mesmas listas.

Os redutores somam todas as categorias. O teste backend chamado RN15 apenas verifica que ambas existem, sem verificar exclusão de "Outros" do total regular. A06 atualmente pode mascarar o problema com total zero; corrigir a data torna a soma errada visível.

**Evidência:** expressão de soma não contém regra de exclusão. RN15 determina segregação do total regular.

**Correção:** definir total regular, total Outros e total combinado com rótulos distintos. Aplicar a mesma função/regra em dashboard e relatórios. Preferir atributo explícito da categoria; para migração inicial, classificar a categoria existente "Outros" sem recategorizar histórico silenciosamente. Evitar lógica repetida por texto solto em várias telas.

**Aceite:** regular 28 e Outros 15 produzem regular 28, Outros 15, combinado 43. Não basta verificar presença dos dois grupos. C26–C27. T23.

## A23 — P1 — Fotos escolares públicas e excesso de dados pessoais no chat

**Onde:** `FileService::FileUploadImage`, `resources/js/config/apiConfig.js`; `deploy/terraform/scripts/nginx-menu.conf` bloco de estáticos; `ChatResource.php:25`, `ChatController::getChatMembers`, `UserResource.php:20–21`.

Fotos são gravadas sob `public/uploads` e servidas como arquivos estáticos, sem passar por `auth:sanctum`. O nome aleatório dificulta descoberta, mas quem tem a URL consegue acessá-la sem autenticação. O chat e a lista de membros expõem NIF/email de outros usuários mesmo quando consultar `/api/users/{id}` é proibido. Isso contradiz a restrição de dados pessoais prevista no próprio projeto.

**Evidência:** desenho de armazenamento/servidor; `campos_chat` confirmou NIF/email na resposta ao Staff. Não houve acesso a foto real na auditoria.

**Correção:** armazenar fotos em disco privado e servi-las por recurso autorizado do aluno, sem token na query string. O frontend pode buscar o arquivo com Bearer e criar/revogar object URLs. Migrar fotos existentes preservando referências; manter PDFs públicos somente conforme a regra específica de cardápios. Criar Resource de participante contendo apenas ID/nome e, se necessário, papel; dados completos continuam no próprio perfil/gestão autorizada.

**Aceite:** foto sem token recebe 401/403; usuário autorizado vê a imagem; caminho antigo público não continua expondo a foto migrada; chat não retorna NIF/email. S13–S15. T24.

## Observações adicionais, sem bloquear as correções prioritárias

- `Contagem extends Contagen` está invertido em relação ao modelo canônico definido em AGENTS. Corrigir em tarefa separada, incluindo factory e relações, sem renomear tabela nem quebrar a classe de compatibilidade.
- O bundle principal é grande; carregar módulos PDF sob demanda é uma melhoria de desempenho, depois de validar sua atualização. Não aumentar o limite de aviso para ocultar o tamanho.
- Self-demotion da última conta gestora, edição de categoria/turma com efeito em relatórios históricos e falta de auditoria da última edição de contagem precisam de testes/política específicos. Não remover ou fundir dados históricos automaticamente.
- Hashes de imagem base, troca da chave Vagrant inicial, HTTPS na rede escolar, backup restaurável e monitoramento de espaço merecem uma etapa operacional própria. Não são apresentados como incidentes já ocorridos.
