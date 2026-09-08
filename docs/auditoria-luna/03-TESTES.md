# Especificação dos testes de regressão

Os casos abaixo são requisitos para os testes que o Luna implementará. **Não são testes já existentes nem resultados aprovados.** A baseline e os diagnósticos antigos estão em `evidencias/`; os diagnósticos registram o comportamento defeituoso e não devem virar expectativas de sucesso da aplicação.

## Preparação comum

Começar por T00. Backend usa SQLite em memória e armazenamento isolado; E2E usa banco, pasta pública, servidor e sessão exclusivos. Nunca executar o antigo `test:e2e:prepare` sobre `.env` normal. Rodar migrações/seed somente após conferir a conexão efetiva, não apenas a variável declarada.

Fixtures: três usuários com roles 1/2/3, senhas sintéticas diferentes, duas categorias regulares e Outros, turmas em categorias diferentes, datas fixadas pelo relógio do teste. Usar IDs de aluno 101, necessidade 7, relação 501, cronograma 3, agendamento 901 e presença 1201 quando isso facilitar a leitura; a condição obrigatória é que sejam distintos. Criar segunda necessidade para o mesmo aluno. Cada teste deve preparar apenas os dados necessários e restaurar relógio, mocks e estado global no teardown.

Para testar tokens, usar login/`createToken` real, header Bearer e uma requisição nova sem identidade persistida no guard. Para testar UI, usar o envelope real capturado ou fixture validada por teste de contrato da API. Mock de rede é adequado para timeout, erro de página e falha de gravação; pelo menos um fluxo completo de cada contrato crítico deve usar API real no E2E.

Sugestões de arquivos novos são pontos de partida. Pode ampliar um teste existente equivalente, evitando duplicação de suítes. Nomes de casos devem expressar a ação e o resultado, e incluir o ID desta matriz em comentário ou descrição para rastreabilidade.

## Q — Isolamento, antes das demais execuções

Arquivo sugerido: `tests/Feature/Testing/IsolationTest.php` e testes do runner em `scripts/testing/`. Q02/Q03 devem exercitar a entrada pública do runner em subprocesso, não apenas testar a própria função de guarda isolada.

| ID | Preparação e ação | Asserção obrigatória |
| --- | --- | --- |
| Q01 | Criar sentinela sintética em public/uploads/pdf normal e outra fora da pasta temporária da suíte; executar os testes de cardápio no ambiente isolado | Conteúdo/hash das sentinelas inalterados; limpeza restrita à pasta criada pelo teste; nenhum arquivo normal enumerado para exclusão |
| Q02 | Invocar preparação E2E sem DB explícito, com DB normal, caminho que escapa da pasta de teste e config cache que aponta ao DB normal | Runner termina com erro antes de qualquer migrate/seed; sentinela no DB normal intacta. Caso permitido cria e usa somente SQLite próprio |
| Q03 | Ocupar porta com servidor alheio, falhar seed/build e simular saída do runner | Não reutiliza servidor alheio, não prossegue após falha e encerra somente o filho criado por ele. Um E2E válido completa com banco/arquivos separados |

As sentinelas não devem substituir arquivos existentes: criar nomes exclusivos e remover só os arquivos criados pelo teste. Não é aceitável provar a guarda destruindo um banco real e restaurando depois.

## S — Autenticação, execução de conteúdo e privacidade

Backend: ampliar `tests/Feature/Api/AuthenticationTest.php`; sugeridos `UserSessionSecurityTest.php`, `SeederSafetyTest.php`, `StudentPhotoAuthorizationTest.php`. Frontend: testes das páginas afetadas. Navegador: `tests/e2e/security-regressions.spec.js`, com biblioteca de modal real.

| ID | Preparação e ação | Resultado esperado |
| --- | --- | --- |
| S01 | Usuário com hash válido; tentar senha errada e cada senha fixa removida, em aplicações inicializadas como local/testing/production, sempre DB isolado | 401 em todos; nenhum token criado. Alterar o ambiente real da aplicação, não só `config(app.env)` se o código usa `isLocal()` |
| S02 | Login correto por cada perfil; acessar `/api/user`, fazer logout e repetir acesso com o token | Login e consulta funcionam; logout invalida token; NIF inexistente não revela se a conta existe por mensagem distinta |
| S03 | POST anônimo `/api/register`, inclusive payload com `nivel_user=2/3`; depois criação administrativa válida | Cadastro público 403 sem nova conta/token; gestão autenticada cria a conta com perfil permitido; Staff não cria |
| S04 | Staff altera seu nome para texto contendo aspas e marcador `<img ... onerror>` que apenas define variável local; Nutri abre modal Editar | Marcador não executa; nome literal visível; edição e salvamento legítimos funcionam. Usar payload sintético, sem exfiltração ou acesso a tokens |
| S05 | Nome de aluno/necessidade/categoria, descrição e campos dos demais modais contêm `<`, `>`, aspas, acentos e eventos HTML | Nenhum handler/elemento executável é criado; texto não some nem é mutilado. Cobrir `DetailsPanel` e pelo menos uma exportação de PDF com texto adversarial |
| S06 | Valor de imagem/URL adversarial e erro de formulário; abrir/fechar/reabrir modal | Sem esquema executável nem HTML cru; imagem inválida usa fallback; listeners não acumulam e formulário continua editável |
| S07 | Executar seeder padrão duas vezes sobre DB sintético marcado como ambiente de produção; conta já existente com senha própria e fatos operacionais sentinela | Não cria usuários E2E, não redefine senha, não insere fatos de exemplo; sentinelas intactas; catálogo não duplica |
| S08 | Invocar E2eSeeder fora de testing e em testing com DB não identificado como descartável; executar depois via runner permitido | Casos inválidos falham antes da escrita; caso permitido prepara os perfis E2E e autenticação continua funcional |
| S09 | Executar bootstrap inicial duas vezes; incluir dia padrão soft-deleted e identidade administrativa já existente | Sem colisão 500 nem alteração silenciosa de senha; política de dia excluído explícita; saída/log não contém senha |
| S10 | Emitir token antigo para Staff; Nutri altera sua senha; fazer nova requisição Bearer e novo login | Reset 200, token antigo 401, senha antiga inválida, nova senha válida; tokens de outro usuário preservados |
| S11 | Alterar perfil e excluir/desativar conta por gestor autorizado; testar erro durante revogação | Tokens afetados revogados; falha reverte alteração e revogação conjuntamente. Não inventar campo de desativação se só existe exclusão |
| S12 | Editar apenas nome; realizar reset próprio com senha atual correta e incorreta | Edição de nome mantém sessão; reset próprio revoga; senha atual errada não altera hash nem tokens |
| S13 | Foto sintética privada; GET sem token, com perfil autorizado, caminho com traversal/ID inexistente | Sem token 401; autorizado recebe bytes corretos; traversal não lê arquivo; desconhecido 404. Não passar token em query |
| S14 | Migrar duas fotos sintéticas e uma referência quebrada em modo de simulação e execução; repetir; recarregar tela | Inventário/erros explícitos; cópias verificadas por hash; referências válidas preservadas; antigo endereço público não serve foto migrada; rerun não perde arquivo; object URLs revogadas na UI |
| S15 | Staff lê chat e membros de outro usuário, seu próprio perfil e tenta perfil alheio | Chat/membros contêm somente campos mínimos; não contêm NIF/email/hash/token; próprio perfil mantém campos legítimos; consulta alheia negada conforme matriz |

## C — Contratos e fluxos funcionais

Backend: ampliar `ContagemBusinessRulesTest.php`, `ContagemNesBusinessRulesTest.php`, `ChatContractTest.php`; sugeridos `ResourceContractsTest.php`, `PaginationContractsTest.php`, `ContagemOperationTest.php`, `SchoolCalendarTest.php`.

Frontend: ampliar testes de serviços/MSW, ContagemPage, DashboardNutri, Planejamento, Cronograma, Chat e relatórios. E2E: ampliar os arquivos de fluxo existentes para verificar efeitos após recarga, não apenas títulos.

| ID | Preparação e ação | Resultado esperado |
| --- | --- | --- |
| C01 | Serializar contagem com data 2026-09-07, tanto detalhe/lista como dashboard | Igualdade exata `data_contagem === "2026-09-07"`; quantidade numérica e mesmos IDs em todos os contratos |
| C02 | Abrir ContagemPage com contagem real de 12, uma única turma; recarregar | Total 12 e turma com 12; não oferece criação indevida; não depende de mock com data inventada |
| C03 | Editar aluno com nascimento conhecido e outro com null; salvar sem alterar data | Input date mostra valor correto; persistência mantém data/null; created_at continua timestamp ISO |
| C04 | Criar produção com data conhecida, reabrir edição, filtrar e exportar período | Data correta no formulário/relatório; nenhum deslocamento por fuso; último dia do filtro incluído |
| C05 | Sem contagem, abrir modal, mudar quantidade e NES, fechar por botão, Esc e cancelamento | Zero POST/PUT/DELETE de dados; banco idêntico antes/depois. Repetir com contagem existente: mesma quantidade/presenças |
| C06 | Criar com 28 e duas seleções NES válidas; salvar e recarregar; reabrir e editar para 29 | Uma contagem efetiva e presenças corretas; edição usa ID existente; formulário reabre com 29 e estado confirmado |
| C07 | Servidor devolve 422/500 ou rede falha ao salvar; depois retry bem-sucedido | Modal mostra erro, mantém rascunho, não anuncia sucesso nem mostra total fictício; retry segue contrato de idempotência |
| C08 | Duplo clique e duas requisições com mesma chave/payload; também mesma chave com payload alterado | Um efeito persistido e mesma resposta no replay; conflito 409 no payload divergente; chaves de usuários distintos não colidem |
| C09 | Operação com quantidade válida e segunda presença inválida; injetar falha de DB após primeira escrita; ensaiar dois rascunhos concorrentes | Nenhuma gravação parcial; retry recupera; nova presença não se duplica no fluxo novo. Teste de concorrência também em MySQL real descartável |
| C10 | Duas revisões da mesma turma/data/hora com quantidades 10 e 20 e IDs crescentes | Dashboard e seleção da UI escolhem 20; total não soma 30; outra turma continua somada normalmente; nenhum histórico é apagado |
| C11 | GET necessidade carregando aluno+necessidade; GET aluno sem pivot | Detalhe mantém envelope; identificador 501 e alias pivot aparecem só no contexto correto; não inventa relação em aluno isolado |
| C12 | Serviço frontend recebe envelope HTTP de C11 | `getNecessidadeComAlunos` retorna objeto com alunos; demais funções de lista preservam meta/links; falha de rede propagada |
| C13 | Cronograma com aluno 101/relação 501/agendamento 901/dia 3; normalizar | DTO contém cada ID correto; ausência de relação obrigatória impede mutação e informa problema; não usa fallback para aluno.id |
| C14 | Nutri associa aluno a necessidade, agenda para um dia, muda dia e recarrega | Planejamento e Cronograma exibem aluno correto no dia certo; POST/DELETE usam relação 501; sem agendamento duplicado |
| C15 | Mesmo aluno com duas necessidades; marcar/remover uma presença no fluxo confirmado | Somente vínculo escolhido é afetado; dashboard/planejamento/contagem concordam; retirar vínculo com histórico retorna 409 |
| C16 | 23 alunos e listas equivalentes; `limit=10&page=3`; limites 0, -1, 1.5, texto, 1001; page inválida | Página final contém 3, meta.total=23; inválidos 422; ordem estável sem itens perdidos/duplicados |
| C17 | 35 produções/contagens em datas dentro e fora do período; filtro `data`, alias `date` e intervalo; início após fim | Filtra antes de paginar, totais/meta correspondem ao filtro; intervalo invertido 422; cobertura conserva filtros já corretos no integrado |
| C18 | Helper recebe >1000 registros em várias páginas, página vazia final, ID repetido e erro na página intermediária | Coleta todos uma única vez em sucesso; detecta ciclo/teto; erro intermediário impede relatório parcial apresentado como completo; cancelamento interrompe novas chamadas |
| C19 | Tela/relatório com itens após posições 15, 20, 100 e 1000; NES de ontem e hoje | Última linha e totais corretos no período; NES de outro dia não aparece; gestão permite alcançar registros posteriores e estados vazios/erro são claros |
| C20 | Chat com 20, 21 e 22 mensagens; polling retorna lotes do mesmo tamanho | Mensagens novas aparecem e ordenam por instante/ID; sem repetição; E2E espera conteúdo, não usa pausa fixa como única sincronização |
| C21 | Editar texto/estado de mensagem sem mudar total; entregar resposta antiga depois da nova | UI reflete versão recente; resposta atrasada não regride conteúdo; rascunho preservado |
| C22 | Carregar anteriores, receber nova mensagem, desmontar e remontar chat | Histórico anterior acessível e sem duplicatas; rolagem razoavelmente preservada; timer/requisição cancelados no unmount |
| C23 | Fixar relógio em 07/09 20:59 e 21:00 locais e 07/09 23:59 e 08/09 00:00 locais | Data escolar não muda à meia-noite UTC; muda à meia-noite local; edição comum e NES usam a mesma janela; normalizar status legado conforme documento 04 |
| C24 | NES exatamente antes/no início/no fim da janela local convertida a UTC; contar por dia e semana | Inclusão no início e exclusão no fim, sem sobreposição entre dias; cronograma usa dia da semana escolar, mesmo navegador em outro fuso |
| C25 | Manter aba aberta na virada de domingo para segunda; voltar após suspensão; simular escola configurada com fuso diferente | Atualiza data, cronograma e contagens sem logout; não conserva useMemo do dia anterior; calcula próximo início de dia no fuso configurado |
| C26 | Contagem efetiva regular 28, Outros 15, mais revisão antiga regular 10 | Regular 28, Outros 15, combinado 43; revisão antiga não duplica; backend/seletores e UI compartilham regra |
| C27 | Gerar dashboard/PDF e aplicar migração de categoria sobre base antiga com histórico | Mesmos totais/rótulos na tela e PDF; backfill só classifica Outros; IDs, contagens e demais categorias preservados |

C18 pode usar resposta sintética paginada para volume sem custo alto de navegador; C19 deve incluir um fluxo real paginado e validar o último item. C09 não pode ser declarado teste concorrente se executou apenas chamadas sequenciais em memória.

## P — Permissões e autorizações

Arquivos existentes: `AuthorizationMatrixTest.php`, `AutorizadosBusinessRulesTest.php`; E2E `diretora-autorizados.spec.js` e gestão de usuários.

| ID | Preparação e ação | Resultado esperado |
| --- | --- | --- |
| P01 | Nutri cria/edita autorização pendente; injeta `status=confirmado/recusado` na rota comum e criação | Criação server-side pendente; tentativa de decisão indevida rejeitada, sem atualização do status. Definir rejeição explícita para campo status no create também |
| P02 | Diretoria confirma uma pendente e recusa outra pela rota legada de revisão; repetir mesma decisão | Estados corretos no DB/Resource/UI; ator autenticado e instante; replay não altera auditoria original |
| P03 | Staff/Nutri chamam revisão; diretoria tenta alterar decisão final; Nutri edita conteúdo já decidido | Perfis indevidos 403; transição/edição inválida 409; nenhuma mudança no banco |
| P04 | Base com schema anterior e pendentes/confirmadas; executar migração nova e criar recusada; simular rollback suportado | Dados antigos preservados; recusa persiste em SQLite e MySQL; autor histórico null; rollback não converte nem descarta decisão silenciosamente |
| P05 | Cada perfil e anônimo chamam index/show/create/update/delete de usuários; testar próprio perfil separado | Matriz do documento 04 cumprida; diretoria realmente carrega e gerencia dados; Staff não eleva perfil via payload |
| P06 | Cada perfil acessa rotas de produção, alunos, catálogos, contagem comum/NES e revisão, inclusive por chamada direta | API nega ações indevidas com 403; UI não oferece ações negadas; role inválida nunca ganha permissões por fallback |
| P07 | Gestor tenta autoexclusão, autoalteração de nível e remover/rebaixar último gestor; outro gestor altera Staff validamente | Operações de bloqueio administrativo rejeitadas sem perda de acesso; operação válida funciona; revogação segue S11 |
| P08 | E2E Diretoria abre gestão de usuários, cria usuário sintético, edita campo permitido e recarrega; Staff tenta rota proibida | Conteúdo e persistência confirmados; não basta título da página; Staff vê acesso negado e não obtém dados pela API |

## V — Validação e integridade referencial

Sugeridos: `tests/Feature/Api/ValidationBoundariesTest.php`, `RelationIntegrityTest.php`. Verificar status **e ausência de escrita parcial**.

| ID | Preparação e ação | Resultado esperado |
| --- | --- | --- |
| V01 | Alunos A/B com RMs diferentes; editar B para RM de A, editar A mantendo seu RM | Primeiro 422 no campo rm e B intacto; segundo permitido; índice continua presente |
| V02 | Turmas com nomes iguais em categorias diferentes; criar duplicata na mesma; PATCH só nome e só categoria | Duplicata 422; próprio nome permitido; escopo composto usa estado final, sem 500 |
| V03 | Cronograma com dia existente, criar repetido e editar mantendo o próprio; simular violação única concorrente conhecida e falha de conexão | Validação/restrição conhecida produz erro controlado; falha interna continua 500 genérico, sem mascarar como campo inválido |
| V04 | Nomes de turma com 45 e 46 caracteres; quantidades 0, 2147483647, 2147483648, negativo, decimal | Fronteiras válidas aceitas no create/update; excessos/formato inválido 422; verificar também no MySQL |
| V05 | Campos decimal(8,2) com 999999.99, 1000000, 0.001, negativo e texto; quantidades/pessoas coerentes | Maior válido persiste sem alteração; inválidos 422; sem truncamento/arredondamento silencioso ou erro SQL exposto |
| V06 | Categoria/turma/necessidade/dia soft-deleted; tentar novos vínculos e updates | 422 antes da gravação; pais ativos continuam aceitos; histórico anterior consultável conforme contrato |
| V07 | Relação aluno+necessidade cujo aluno ou necessidade foi excluído; tentar agendamento/presença | 422 e nenhuma linha; validar ambos os pais, não só existência da relação |
| V08 | Relação com histórico; tentar remoção; ensaiar exclusão concorrente com criação de vínculo | 409 com histórico, sem remover agendamentos; concorrência não deixa vínculo ativo invisível; documentar teste no motor real |
| V09 | DELETE relação com inteiro, array unitário e payloads `"1.9"`, `"1e2"`, vazio, dois IDs, booleano, objeto, zero, negativo | Só inteiro positivo/array unitário de inteiro aceitos; formatos inválidos 422 antes de cast, nenhum aluno removido indevidamente |
| V10 | Vínculo sem histórico com agendamentos, vínculo inexistente e vínculo com histórico | Remoção válida 204 e dependentes removidos atomicamente; ausente 404; histórico 409; falha no meio reverte tudo |

## F — Arquivos e exportações

Ampliar `CardapioAndStorageTest.php` depois de T00. E2E sugerido `tests/e2e/pdf-export.spec.js`. Bibliotecas de parsing de PDF usadas nos testes devem ser dependências explícitas de desenvolvimento ou ferramenta de QA disponível, nunca presunção oculta.

| ID | Preparação e ação | Resultado esperado |
| --- | --- | --- |
| F01 | Criar cardápio PDF válido; injetar falha de DB após upload | Sucesso associa arquivo certo; falha não deixa registro parcial nem novo arquivo órfão silencioso; 500 genérico |
| F02 | Substituir PDF existente; falhar antes do commit e depois na remoção do antigo | Antes do commit, registro/arquivo antigo preservados e novo compensado; depois, novo válido e falha de limpeza registrada para retry |
| F03 | Excluir cardápio; simular `delete=false` e exceção de disco; executar retry | Estado não anuncia limpeza inexistente; falha rastreável/reexecutável; retry não remove arquivo de outro cardápio |
| F04 | Enviar arquivo inválido, arquivo excessivo e falha de escrita; repetir operação permitida | Validação 422 sem resíduo; falha interna 500; fluxo normal de exibir/baixar cardápio continua funcionando |
| F05 | Instalar pelo lock limpo após atualização; inspecionar `npm ls` e `npm audit --json` | Nenhuma versão afetada pelos avisos A17 na árvore; avisos novos analisados e registrados; não mascarar resultado com flags |
| F06 | Exportar planejamento, contagem geral e produção com acentos, nomes extensos e múltiplas páginas | PDF abre, não está vazio, inclui cabeçalho/última linha/totais corretos; não basta verificar extensão ou evento de download |
| F07 | Exportar dataset paginado >limite inicial, vazio e texto adversarial; inspecionar páginas renderizadas | Todas as linhas devidas presentes, cabeçalhos legíveis sem corte crítico; vazio tratado; conteúdo textual não executa scripts. Guardar PDF sintético e evidência visual da homologação |

## I — Implantação e preservação de estado

Criar testes de empacotamento e scripts que usem diretório/VM descartáveis explicitamente identificados. Testes estáticos de strings são auxiliares, não substitutos do ensaio de atualização.

| ID | Preparação e ação | Resultado esperado |
| --- | --- | --- |
| I01 | Montar workspace sintético com código, locks e sentinelas em .env, SQLite, uploads, hot, cache, logs; gerar tar e listar entradas | Inclui código/build necessário/locks; nenhum dado mutável, segredo, marcador hot ou cache local; pacote reprodutível para a mesma entrada |
| I02 | Instalar release A em VM descartável; inserir aluno, contagem, PDF/foto e registrar fingerprint da APP_KEY; publicar B e repetir provisionamento | IDs, dados, arquivos/hashes e fingerprint preservados; nova versão de código ativa; nenhuma conta E2E criada; não imprimir APP_KEY |
| I03 | Fazer backup consistente de SQLite e arquivos sintéticos; provocar falha controlada de release e restaurar em outra instalação descartável | Banco íntegro, referências/arquivos acessíveis, retorno de versão suportado; saúde valida conteúdo real; procedimento de rollback de schema explicitado |
| I04 | Alterar apenas código e depois apenas memória/CPU; inspecionar plano e aplicar na VM de teste | Código atualizado no primeiro caso; disco e dados preservados no segundo; caminho normal nunca executa unregistervm --delete |
| I05 | Simular códigos de saída não zero em build/tar/transferência/SSH/migração/saúde, uma etapa por caso | Runner sai com erro imediatamente, não publica sucesso e não avança etapa dependente; release anterior disponível quando rollback é seguro |
| I06 | Inspecionar Terraform e Nginx; ensaiar encaminhamentos NAT na VM descartável, navegador público e acesso SSH local | NAT preservado, serviço HTTP acessível conforme guia, SSH limitado ao encaminhamento definido; nenhuma rede bridge adicionada; validate/fmt documentados com resultado real |

Na auditoria, Terraform não pôde ser iniciado e o PHP não tinha `pdo_mysql`. A implementação não pode transformar essa indisponibilidade em teste aprovado. Se permanecer, entregar códigos/testes e procedimento de homologação com status pendente.

## Critério de regressão completa

1. Todos os casos relacionados às correções implementadas têm teste permanente ou, para ensaio operacional, evidência reproduzível e status explícito.
2. Suites originais continuam aprovadas, com mudanças intencionais documentadas para cadastro público, papéis, status e serialização. Não exigir contagem numérica fixa de testes; novas parametrizações podem alterá-la.
3. O fluxo escolar completo funciona: login → cadastro autorizado de aluno → associação → cronograma → contagem confirmada → dashboard → PDF → recarga. Cancelar contagem e falha de rede são parte do fluxo, não exceções omitidas.
4. Fluxo da direção: autenticação → dados de usuários → alteração autorizada → revisão pendente → confirmar/recusar → persistência após recarga.
5. Migrações testadas com dados anteriores; atualização de release preserva dados e arquivos em ensaio descartável. Pendências de ambiente/decisões aparecem no relatório final.
6. Guardar resultados sem tokens reais, senhas reais ou dados escolares. As evidências históricas desta auditoria permanecem como baseline; resultados após correção ficam em pasta nova por execução.
