# Contratos e decisões para implementar sem adivinhação

Este documento distingue o contrato observado das alterações propostas. Ele orienta a implementação futura; não descreve funcionalidades já corrigidas. Raiz: `C:\Projetos\contador-v2`.

## 1. Regras de compatibilidade

- Preservar rotas legadas existentes, inclusive `controle_de_producao`, `contagens`, `contagem-nes` e `autorizados/update/{id}`. Não importar mudanças de rotas da API separada.
- Preservar campos de banco/HTTP como `qtd_contagem`, `turmas_id`, `alunos_has_necessidades_id`; os nomes curtos de DTO são internos ao frontend.
- Detalhe HTTP continua `{ "data": { ... } }`; lista paginada continua `{ "data": [], "links": {}, "meta": {} }`.
- Adaptadores frontend podem desembrulhar detalhes, desde que todos os consumidores da função sejam atualizados juntos. Não alterar `apiFetch` globalmente para desembrulhar toda resposta, pois vários consumidores precisam de paginação.
- Datas civis e timestamps são tipos diferentes. Não alterar todos os timestamps para texto sem hora.
- Rotas sem autenticação recebem 401 quando protegidas; perfil sem permissão recebe 403. Entrada inválida recebe 422, recurso inexistente 404 e conflito de estado 409. Há respostas legadas 400 para edição fora do dia; preservar até mudança coordenada/documentada dos consumidores e testes.

## 2. Datas

| Campo | Formato esperado após T05 | Semântica |
| --- | --- | --- |
| `data_contagem` | `2026-09-07` | Dia escolar da contagem |
| `data_nascimento` | `2015-03-12` ou `null` | Data civil, sem conversão de fuso |
| `data_alimento` | `2026-09-07` | Data civil da produção |
| `hora_contagem` | `HH:mm:ss` | Hora da contagem no fuso escolar, coerente com a data |
| `created_at`, `updated_at` | ISO 8601 com indicação de UTC | Instante real, não data civil |
| horário de presença NES | ISO 8601 com indicação de UTC | Converter para dia escolar antes de agrupar |

O diagnóstico recebeu `data_contagem: "2026-09-07T00:00:00.000000Z"`; após a correção a asserção deve exigir **igualdade exata** com `"2026-09-07"`. Um teste `startsWith` não detecta o defeito.

T22 deve fornecer metadados autenticados de calendário escolar, por endpoint aditivo como `GET /api/contexto-escolar`, com `data_atual`, `timezone` e `agora` (timestamp UTC). É uma proposta de endpoint novo, não uma rota atualmente existente. Não incluir versão do servidor, caminho, segredo ou outro diagnóstico nesse contrato. O cliente pode atualizar o dia entre consultas usando `Intl.DateTimeFormat` com o fuso recebido; revalidar ao retomar a aba e perto da virada.

Às `2026-09-08T01:00:00Z`, a data escolar de São Paulo é **2026-09-07**. A janela desse dia é `[2026-09-07T03:00:00Z, 2026-09-08T03:00:00Z)`. Para gerar o limite final, calcular o próximo início de dia no fuso e depois converter para UTC; não assumir que todo dia de todo fuso sempre tem 24 horas.

## 3. Identidade das relações

Um aluno tem várias necessidades. Cada par aluno+necessidade possui um ID próprio. Um agendamento é o vínculo desse par com um dia. Uma presença NES possui outro ID. Essas identidades não são intercambiáveis.

| Entidade sintética | ID de exemplo | Campo de referência |
| --- | --- | --- |
| Aluno Ana | 101 | `alunos_id` / `aluno.id` |
| Necessidade NES | 7 | `necessidades_id` |
| Relação Ana+NES | 501 | `alunos_has_necessidades_id` |
| Cronograma Segunda | 3 | `cronograma_id` |
| Agendamento da relação 501 na Segunda | 901 | `cronograma.alunos[].id` |
| Presença registrada da relação 501 | 1201 | `contagem-nes.data[].id` |

Criar também uma segunda relação da mesma Ana, por exemplo 502, com outra necessidade. As duas não podem ser deduplicadas apenas pelo ID 101.

### Detalhe de necessidade: extensão proposta

Resposta HTTP de `GET /api/necessidades/7`, mostrando somente campos relevantes:

```json
{
  "data": {
    "id": 7,
    "necessidade": "NES",
    "alunos": [
      {
        "id": 101,
        "nome": "Ana de Teste",
        "turmas_id": 12,
        "alunos_has_necessidades_id": 501,
        "pivot": { "id": 501 }
      }
    ]
  }
}
```

O campo explícito e o alias `pivot.id` são novos. Só incluí-los quando o aluno for serializado no contexto da relação carregada. Um aluno listado isoladamente não possui “um único vínculo” a ser inventado. Evitar usar qualquer pivot carregado sem conferir se corresponde à tabela aluno+necessidade.

`getNecessidadeComAlunos(7)` passa a devolver `resposta.data`, portanto consumidores usam `necessidade.alunos`. Seu teste de serviço recebe o envelope HTTP acima e confere o objeto retornado. Outros métodos paginados continuam devolvendo envelope.

### Cronograma: preservar HTTP, normalizar no serviço

Formato aninhado já observado:

```json
{
  "data": {
    "id": 3,
    "dia": "Segunda",
    "alunos": [
      {
        "id": 901,
        "alunos_has_necessidades_id": 501,
        "cronograma_id": 3,
        "aluno_has_necessidade": {
          "id": 501,
          "alunos_id": 101,
          "necessidades_id": 7,
          "aluno": { "id": 101, "nome": "Ana de Teste", "turmas_id": 12 },
          "necessidade": { "id": 7, "necessidade": "NES" }
        }
      }
    ]
  }
}
```

DTO interno sugerido para cada item de cronograma:

```json
{
  "agendamento_id": 901,
  "relacao_id": 501,
  "cronograma_id": 3,
  "aluno_id": 101,
  "necessidade_id": 7,
  "aluno": { "id": 101, "nome": "Ana de Teste", "turmas_id": 12 },
  "necessidade": { "id": 7, "necessidade": "NES" }
}
```

Usar números para IDs nos DTOs e converter valores de inputs na fronteira com validação. Não usar `String(undefined)` como ID válido. Relação obrigatória ausente deve produzir erro de dados visível/registrado e bloquear mutação daquele item; não criar vínculo com ID de aluno como fallback.

Operações existentes a preservar:

| Operação | Rota/payload |
| --- | --- |
| Associar necessidade | `POST /api/alunos/101/necessidades`, `{ "necessidades": [7] }` |
| Agendar a relação | `POST /api/alunos-necessidades/501/dias`, `{ "dias": [3] }` |
| Retirar dia | `DELETE /api/alunos-necessidades/501/dias`, `{ "dias": [3] }` |
| Retirar aluno da necessidade | `DELETE /api/necessidades/7/alunos`, `{ "alunos": [101] }` |
| Registrar presença legada | `POST /api/contagem-nes`, `{ "alunos_has_necessidades_id": 501 }` |
| Remover presença legada | `DELETE /api/contagem-nes/1201` |

No último caso o ID é da presença, não da relação. Retirar vínculo com histórico permanece proibido com 409.

## 4. Operação de contagem proposta em T06

Manter as rotas existentes e adicionar uma operação transacional usada pelo formulário novo:

`POST /api/contagens/operacao`, header `Idempotency-Key: <UUID gerado para esta confirmação>`.

```json
{
  "contagem_id": null,
  "turmas_id": 12,
  "qtd_contagem": 28,
  "presencas": [
    { "relacao_id": 501, "presenca_id": null, "presente": true },
    { "relacao_id": 502, "presenca_id": 1202, "presente": false }
  ]
}
```

- `contagem_id=null` cria; ID existente atualiza somente se pertencer à turma e ao dia escolar atual. Não permitir mover contagem histórica para outra turma por essa operação.
- `presencas` contém apenas as mudanças pretendidas no rascunho. Omitir uma relação preserva seu estado; não significa apagar sua presença. Impedir relações repetidas no array.
- Ao incluir presença nova, `presenca_id=null`; ao remover presença existente, exigir seu ID e conferir relação/dia. `presente=false` com ID nulo não cria nem remove nada. A presença deve pertencer à turma por meio do aluno.
- Antes de criar presença nova para a relação, conferir se já existe presença atual: se existir uma, reutilizá-la; se houver múltiplas históricas no mesmo dia, não apagar automaticamente — retornar conflito claro para revisão. Esse comportamento do fluxo novo evita duplicação por dois rascunhos abertos; as rotas legadas sem chave ainda exigem a decisão D04 para unicidade global.
- Validar e persistir sob transação, com bloqueio da turma/relação em ordem determinística. Falha NES reverte a contagem comum. Garantir o teste de concorrência no banco de produção, pois SQLite em memória não reproduz todos os bloqueios.
- Servidor atribui usuário, data e hora. Não aceitar esses campos como autoridade enviada pelo cliente.
- Resposta 201 na criação ou 200 na atualização, com `{ "data": { "contagem": { ... }, "presencas": [ ... ] } }`; replay devolve o mesmo status/corpo efetivo. Não gravar token, senha nem cabeçalho Authorization na tabela de idempotência.
- Chave ausente/inválida no endpoint novo: 422. Mesma chave com payload diferente: 409. Chaves diferentes são operações diferentes; não oferecem por si só detecção de edição concorrente.
- A tabela nova deve ter usuário, nome da operação, chave, hash de payload, status HTTP e resultado, timestamps e índice único da identidade. Definir retenção documentada, sem remoção antes da janela de retry suportada. Não criar limpeza destrutiva de histórico operacional para limpar idempotência.

Essa proposta resolve a gravação parcial do formulário. A necessidade de várias refeições/revisões é separada em D04.

## 5. Paginação e totais

Cada endpoint paginado deve aceitar `page` inteiro positivo e `limit` inteiro de 1 a 1000. Aumentar `limit` não substitui percorrer páginas. Manter defaults atuais explícitos, filtros no servidor e ordem com ID de desempate.

O helper de relatório usa `meta.current_page`, `meta.last_page` e contador de itens; chama a mesma rota com `page+1`, preservando filtros. Definir limites operacionais (proposta inicial: 100 páginas/100.000 itens) e exibir erro pedindo período menor quando excedidos. O resultado não pode ser apresentado como completo se uma página falhou ou se atingiu um teto.

Para contagens, selecionar a revisão efetiva de cada turma/dia usando data/hora/ID, conforme D04, e só então somar. Não somar duas revisões da mesma turma como dois grupos de alunos.

Campos de totais sugeridos: `total_regular`, `total_outros`, `total_combinado`. Com regular 28 e Outros 15: 28, 15 e 43. `inclui_total_regular` na categoria define a classificação; não comparar string de nome em vários componentes.

## 6. Matriz de permissões a implementar

Fonte principal: `AGENTS.md` da raiz e comportamentos expressamente preservados. “Próprio” significa identidade autenticada, nunca ID arbitrário do payload.

| Operação | Anônimo | Staff (1) | Nutri (2) | Diretoria (3) |
| --- | --- | --- | --- | --- |
| Login com senha válida | Sim | Sim | Sim | Sim |
| Cadastro público `/register` | Não (403) | Não (403) | Não (403) | Não (403) |
| Consultar/editar próprio perfil permitido | Não | Próprio | Próprio | Próprio |
| Trocar própria senha com senha atual | Não | Sim | Sim | Sim |
| Listar/criar/editar/excluir usuários | Não | Não | Sim | Sim |
| Alterar próprio perfil de acesso via edição comum | Não | Não | Não por esse fluxo | Não por esse fluxo |
| Ler alunos/catálogos/cronogramas | Não | Sim | Sim | Sim, leituras já existentes |
| Gerir alunos/catálogos/cronogramas | Não | Não | Sim | Não |
| Ler contagens/dashboard | Não | Sim | Sim | Sim |
| Gravar contagem comum/NES do dia | Não | Sim | Sim | Não |
| Gerir produção e consumo | Não | Não | Sim | Não |
| Ler produção pela rota operacional | Não | Não | Sim | Não, até D02 |
| Ler cardápios pela API autenticada | Não | Sim | Sim | Sim |
| Gerir cardápios | Não | Não | Sim | Não |
| Ler autorizações | Não | Sim, contrato atual | Sim | Sim |
| Criar/editar conteúdo pendente de autorização | Não | Não | Sim | Não |
| Confirmar/recusar autorização | Não | Não | Não | Sim |
| Ler/enviar chat e membros mínimos | Não | Sim | Sim | Sim |
| Editar/excluir mensagem | Não | Conforme autoria/regras existentes | Conforme autoria/regras existentes | Conforme autoria/regras existentes |
| Ler foto de aluno | Não | Se autorizado a ler o aluno | Idem | Idem |

Gestão de usuários deve respeitar a proibição existente de autoexclusão. Como proteção conservadora, não permitir autoalteração de nível; mudanças de perfil devem ser feitas por outro gestor. Bloquear remoção/rebaixamento da última conta com capacidade administrativa ativa. São critérios preventivos a validar em P07, não incidentes demonstrados pela auditoria. Não impedir que Staff edite seu nome legítimo como solução para XSS.

A política de cardápio público é independente da foto escolar. Não fechar o acesso público a PDF sem verificar a tela pública e os requisitos existentes.

## 7. Autorizações: estados e transições

Estados do enum: `pendente`, `confirmado`, `recusado`.

| Ator/ação | Estado inicial | Resultado proposto |
| --- | --- | --- |
| Nutri cria | — | Pendente; status decidido pelo servidor |
| Nutri altera conteúdo | Pendente | Continua pendente |
| Nutri envia `status` na rota comum | Qualquer | 422; sem alteração |
| Diretoria confirma | Pendente | Confirmado, ator e instante registrados |
| Diretoria recusa | Pendente | Recusado, ator e instante registrados |
| Diretoria repete a mesma decisão | Mesmo estado final | 200 idempotente, preserva ator/data originais |
| Alguém altera conteúdo decidido | Confirmado/recusado | 409; sem mudança silenciosa |
| Diretoria tenta trocar decisão final | Confirmado/recusado | 409 até haver fluxo de reabertura definido |

Campos novos sugeridos: `decidido_por` e `decidido_em`, ambos nullable para histórico. Fonte de ator é o usuário autenticado. A migração deve permitir `recusado` em instalações existentes; não basta mudar a enumeração PHP. O caminho de rollback não pode transformar recusa em confirmação: se a versão anterior não suporta recusas já existentes, documentar backup/restauração ou recusar rollback destrutivo.

## 8. Decisões de negócio e limites da autorização

As escolhas abaixo são orientação explícita deste plano. Não fingir que as contradições já foram respondidas pelo responsável da escola. O Luna pode aplicar os defaults indicados e continuar as demais tarefas; só a extensão indicada permanece pendente.

| ID | Conflito ou questão | Default para esta correção | Extensão que exige confirmação posterior |
| --- | --- | --- | --- |
| D01 | RN17 atribui revisão à Nutri; AGENTS atribui à Diretoria | Diretoria decide; Nutri gerencia conteúdo pendente. Consolidar documentação com essa precedência | Reabertura, alteração de decisão final e eventual delegação de aprovação |
| D02 | Diretoria tem telas que chamam APIs Nutri; AGENTS exige gestão de usuários | Habilitar gestão de usuários; preservar leituras já autorizadas; ocultar gestão operacional negada | Acesso adicional de leitura à produção e alterações em cadastros |
| D03 | RN07 fala 07h30; RN14 em docs admite retificação Nutri; AGENTS restringe ao dia atual | Usar dia escolar America/Sao_Paulo; edição só no dia atual; não acrescentar corte rígido de 07h30 | Bloqueio por horário, justificativa e auditoria de retificação histórica |
| D04 | Vários POSTs por turma/dia e sem modelo de refeição | Preservar histórico; selecionar última revisão por hora/ID; formulário atualiza a contagem escolhida; retries idempotentes | Índice único diário, refeições múltiplas, limpeza de duplicatas e política de conflito entre editores |
| D05 | Classificação “Outros” e alterações futuras de categoria | Backfill de categoria Outros existente para exclusão do total regular; sem reclassificar contagens | Mudança de categoria com efeito retroativo e versionamento histórico dessa classificação |
| D06 | Código trata NAE; seeder usa NAI em parte dos exemplos | Preservar códigos existentes e testar agendamentos com dados explícitos; registrar divergência | Equivalência NAE/NAI e participação automática sem cronograma; não renomear dados em massa |

Não adicionar índice único de negócio nem migração de limpeza com base em resposta ausente. Essas pendências não impedem corrigir autenticação, XSS, contratos, isolamento, transações, paginação e demais falhas confirmadas.

## 9. Migrações e preservação de dados

No integrado, a auditoria **não confirmou** o problema de upgrade observado na API separada. Não criar uma migração genérica de “consertar tudo”. Para alterações realmente propostas aqui:

1. Criar nova migração de idempotência, nova migração de status/ator/data de autorização e nova migração de classificação de categoria conforme a tarefa correspondente.
2. Testar instalação vazia e upgrade: migrar schema anterior, inserir fixtures reais do contrato antigo, executar novas migrações e conferir quantidade de linhas, IDs, valores, vínculos e timestamps preservados.
3. Testar no SQLite da suíte e no MySQL com versão compatível com a implantação. Se trocar constraint/enum exigir reconstrução de tabela, fazer mapeamento explícito e provar preservação; consultar a documentação da versão instalada.
4. Fotos exigem migração de arquivos com inventário e modo de simulação, não só SQL. Nenhuma foto pública deve ser removida antes de a cópia privada e sua referência terem sido verificadas.
5. Rodar migrações em produção não está autorizado por este plano de implementação local. Entregar o procedimento pronto e resultados do ensaio descartável.
