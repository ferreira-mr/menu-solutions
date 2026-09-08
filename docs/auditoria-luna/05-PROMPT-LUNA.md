# Prompt para iniciar a implementação com o Luna

Copie o texto abaixo para uma tarefa do Luna aberta no projeto integrado. Esta auditoria não iniciou outra tarefa nem aplicou as correções.

---

Implemente as correções e os testes documentados em `C:\Projetos\contador-v2\docs\auditoria-luna`. Trabalhe exclusivamente no projeto integrado `C:\Projetos\contador-v2`; a API e o frontend em pastas separadas não são o alvo.

Leia primeiro `AGENTS.md`, depois os seguintes arquivos dessa pasta:

1. `README.md` — escopo, baseline e limites da auditoria.
2. `01-ACHADOS.md` — 23 achados, evidências e correções.
3. `02-PLANO-LUNA.md` — tarefas T00–T24 e sequência de execução.
4. `04-CONTRATOS-E-DECISOES.md` — contratos a preservar, contratos novos propostos e decisões de negócio.
5. `03-TESTES.md` — cenários, resultados esperados e critérios de aceite.
6. `CONTROLE-DE-EXECUCAO.md` — registro de progresso a manter atualizado.

O commit auditado foi `cc86bac09e9addc5f92c4d8b5925ee95f91c9c40`. Confira o estado atual e preserve alterações posteriores. Não presuma que todo achado continua presente; revalide antes de editar e registre o resultado. Os diagnósticos em `evidencias` mostram falhas antigas com dados sintéticos; não transforme esses resultados defeituosos em expectativas dos testes permanentes.

Comece por **T00**, que isola banco, uploads e servidor dos testes. O script E2E antigo chama `migrate:fresh` sem garantir um banco descartável, e o teste de cardápio limpa uma pasta pública compartilhada. Não os execute na configuração antiga. Não rode migrações destrutivas contra o `.env` normal. Crie ambiente descartável identificado e faça o runner recusar configurações inseguras antes de qualquer escrita destrutiva.

Execute uma tarefa de cada vez na ordem do plano. Para cada tarefa:

- Identifique os arquivos e contratos afetados.
- Escreva o teste que demonstra a falha; confirme que falha pela asserção correta.
- Implemente a correção mínima coerente com a arquitetura.
- Execute os testes da tarefa e dos consumidores afetados.
- Atualize o controle com arquivos, comandos, resultados, decisões e pendências. Só marque concluída após cumprir todos os critérios.

Não pare após descrever o plano: esta tarefa é de implementação. Continue pelas etapas autorizadas e deixe o código e os testes prontos para revisão. Se uma parte depender de ambiente indisponível ou decisão de negócio, registre exatamente a dependência e avance nas demais tarefas independentes; não invente a resposta.

Preserve rotas e campos legados, especialmente `/api/controle_de_producao`, `/api/autorizados/update/{id}` e `/api/alunos-necessidades/{relacao}/dias`. Não aplique correções da API separada às rotas que já estão corretas no integrado. Mantenha controllers pequenos, use serviços/FormRequests, enums existentes, hooks de autenticação/permissões e componentes novos em `resources/js/features`.

Não faça HTML cru com texto do usuário. Não considere resolvida uma falha de contrato apenas ajustando o mock para o formato desejado. Teste envelopes reais e IDs distintos de aluno, vínculo, agendamento e presença. Contagem só pode ser gravada ao confirmar, de forma atômica, com retry seguro. Não apague histórico para eliminar duplicatas nem imponha unicidade diária sem a decisão D04.

Siga os defaults documentados: direção decide autorizações, Staff/Nutri registram contagem, direção e Nutri gerenciam usuários, datas operacionais usam o fuso escolar, e Outros fica separado do total regular. Registre as divergências D01–D06. Não introduza corte rígido de 07h30, retificação histórica, novas refeições ou reclassificação retroativa por suposição.

Mudanças de schema precisam de migrações novas, testes de instalação vazia e upgrade com dados preservados. Teste os limites também no MySQL previsto para produção quando disponível. Na parte de implantação, prepare pacote separado de dados persistentes e atualização que preserve banco, uploads, chave e disco da VM. Ensaie somente em instalação descartável; publicar na escola ou destruir uma VM real não faz parte desta tarefa.

Ao fechar cada bloco do plano, rode backend, frontend, lint, build e E2E isolado. Para PDF, confira os arquivos gerados e a última linha dos dados; download sem conteúdo correto não é sucesso. Para permissões, confira leitura/gravação real e recarga; título de página não é sucesso. Para token revogado, use uma nova requisição Bearer.

Entregue ao final: achados resolvidos e pendentes, arquivos principais, migrações, testes novos e comandos/resultados, mudanças intencionais de contrato, decisões ainda abertas e procedimento de implantação/homologação. Não afirme teste aprovado quando ele não rodou. Não declare ausência de falhas apenas porque a suíte passou.

---

## Continuação em outra sessão

Se for necessário continuar em outra sessão do Luna, reutilize o prompt acima e acrescente: “Retome a primeira tarefa não concluída em CONTROLE-DE-EXECUCAO.md; confira o estado real do código e os últimos resultados antes de repetir trabalho. Preserve tarefas concluídas e alterações de terceiros.”
