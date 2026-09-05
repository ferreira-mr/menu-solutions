# Relatório Consolidado de Testes e Homologação (QA)

Este documento reúne o histórico integral de testes de bancada, testes de integração e testes de aceitação com usuários reais realizados pela equipe **Code Solutions** na Escola SESI CE-368 entre **Agosto e Outubro de 2025**, extraído do *Relatório de Testes Formal* da equipe.

---

## 1. Metodologia de Testes e Garantia da Qualidade

O ciclo de testes seguiu a abordagem iterativa do Scrum, combinando validações técnicas com sessões de testes de usabilidade presenciais com as operadoras do sistema (**Laís** e **Jaqueline**) e sob auditoria técnica dos orientadores (**Hermilo, Marcos, Enzo e Isabella**).

### Legenda de Prioridades:
* 🔴 **Urgente:** Falhas que bloqueiam a operação essencial ou geram distorção crítica de dados.
* 🟠 **Alta:** Inconsistências de layout, usabilidade ou segurança que comprometem a experiência.
* 🟡 **Média:** Melhorias de ergonomia, responsividade secundária ou refinamento estético.
* 🟢 **Baixa:** Ajustes cosméticos menores ou restrições de regras pontuais.

---

## 2. Registro Completo dos Casos de Teste Homologados

| Data | Título do Teste / Defeito | Descrição do Problema | Alteração / Solução Executada | Responsável | Avaliador de QA | Prioridade | Status |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **05/08** | Menu não fecha após seleção | Ao selecionar uma rota, o menu lateral permanecia aberto sobrepondo o conteúdo da página. | Implementada rotina JavaScript para fechar automaticamente o menu off-canvas após o clique. | André | Laís / Hermilo | 🟠 Alta | Finalizado ✅ |
| **05/08** | Exibição de dietas específicas | Alunos com dietas específicas não eram destacados com nome, turma e restrição conforme feedback da nutricionista. | Criado card dedicado no painel da nutricionista relacionando foto, nome civil, RM e laudo alimentar. | André / César | Jaqueline | 🟠 Alta | Finalizado ✅ |
| **05/08** | Armazenamento de senha em texto | Senhas sem hash criptográfico seguro e tela de login sem diferenciação de letras maiúsculas/minúsculas. | Implementada criptografia com algoritmo seguro (Bcrypt) e verificação case-sensitive estrita no login. | César | André / Hermilo | 🟠 Alta | Finalizado ✅ |
| **05/08** | Visibilidade do total de alunos | Apenas a nutricionista visualizava a somatória geral dos alunos presentes; a inspetora ficava sem feedback da sua contagem. | Disponibilizado card de totalizador consolidado na tela inicial do perfil da inspetora. | André | Hermilo | 🟠 Alta | Finalizado ✅ |
| **05/08** | Ajuste CSS para telas maiores | Quebra de proporções e desalinhamento dos cards ao abrir a aplicação em monitores Full HD (1920x1080). | Refatoração das regras de CSS Grid e Flexbox com media queries específicas para resoluções Desktop. | André | André | 🟠 Alta | Finalizado ✅ |
| **08/08** | Dependência de Bootstrap via CDN | Lentidão severa no carregamento da aplicação em salas com oscilação do sinal de internet externa. | Download dos assets do Bootstrap e CSS para o servidor local da sala, eliminando requisições remotas. | André / César | Laís / Hermilo | 🟡 Média | Finalizado ✅ |
| **08/08** | Distorção no somatório geral | A categoria "Outros" (atividades contraturno) estava somando indevidamente no total de merenda regular da manhã. | Exclusão da categoria "Outros" da somatória geral matinal, mantendo sua contagem em painel separado. | André | Jaqueline | 🟠 Alta | Finalizado ✅ |
| **08/08** | Bloqueio de retroatividade | Era possível editar contagens de dias anteriores, o que comprometia a auditoria contábil da merenda escolar. | Implementada validação no back-end bloqueando alteração de contagens com data diferente do dia corrente. | César | Hermilo / Marcos | 🟡 Média | Finalizado ✅ |
| **13/08** | Erro na atualização de contagem | Ao tentar corrigir um valor digitado errado no mesmo dia, o sistema não persistia a nova quantidade. | Correção da query `UPDATE` no banco de dados e ajuste do endpoint na API. | César | André | 🟠 Alta | Finalizado ✅ |
| **14/08** | Links do menu de navegação | Hiperlinks do menu lateral apontavam para URIs inválidas ou trocadas. | Reestruturação dos roteamentos de URLs e links de âncora do front-end. | André | Hermilo | 🔴 Urgente | Finalizado ✅ |
| **14/08** | Total diário na tela inicial | Caminho longo e confuso até a nutricionista visualizar a contagem do dia (passava pela tela de calendário). | Calendário reposicionado; criado card de destaque na página inicial com atualização em tempo real via AJAX. | André / César | Hermilo | 🔴 Urgente | Finalizado ✅ |
| **14/08** | Filtros de relatórios analíticos | Os relatórios eram emitidos apenas em bloco bruto, sem filtros por sala ou categoria escolar. | Criação de filtros parametrizados por turma, categoria e intervalo de datas com exportação formatada. | André / César | Hermilo | 🟠 Alta | Finalizado ✅ |
| **14/08** | Ordenação cronológica invertida | A listagem de contagens exibia os dados do mais antigo para o mais novo, dificultando ver os números do dia. | Alteração da ordenação das consultas SQL para `ORDER BY data_contagem DESC, hora_contagem DESC`. | André | Hermilo | 🟡 Média | Finalizado ✅ |
| **15/08** | Logotipo como link de Home | Clicar na logomarca no cabeçalho não redirecionava para a página inicial do sistema. | Adicionado link âncora sobre o elemento da logo apontando para o dashboard principal. | André | Enzo | 🟢 Baixa | Finalizado ✅ |
| **15/08** | Polling assíncrono (AJAX) | O painel da nutricionista exigia recarregamento manual (F5) para exibir os números que a inspetora lançava. | Implementado pooling assíncrono em AJAX recarregando dados silenciosamente a cada 60 segundos. | André | Hermilo | 🟠 Alta | Finalizado ✅ |
| **15/08** | Z-Index do menu nos relatórios | Na tela de relatórios, ao abrir o menu lateral, ele ficava oculto atrás das tabelas e cards. | Correção da propriedade CSS `z-index` do menu para camada superior fixa (`z-index: 1050`). | André | Enzo | 🟠 Alta | Finalizado ✅ |
| **15/08** | Responsividade do chat | O layout do chat ultrapassava a largura da tela em celulares pequenos, quebrando a barra de rolagem. | Aplicação de `max-width: 100%`, `overflow-x: hidden` e flexbox responsivo no container do chat. | André | Isabella | 🟠 Alta | Finalizado ✅ |
| **20/08** | Limite de contagens passadas | O histórico de contagens ficava pesado e lento por tentar listar centenas de dias de uma única vez. | Implementada paginação de dados e limite padrão para visualização dos últimos 30 dias. | César | Hermilo | 🟡 Média | Finalizado ✅ |
| **26/08** | Falha de exclusão de turmas | Ao tentar remover uma turma inativa, o sistema gerava erro de integridade referencial com contagens passadas. | Implementação de Soft Delete (`deleted_at`) para desativar a turma sem violar chaves estrangeiras. | André / César | Jaqueline | 🟠 Alta | Finalizado ✅ |
| **27/08** | Tela de cronograma cortada | O cronograma de contraturno ficava com elementos fora da área útil em telas menores. | Ajuste de responsividade com grid adaptável e container com rolagem horizontal suave. | André | Jaqueline | 🟠 Alta | Finalizado ✅ |
| **03/09** | Resolução de fotos de alunos | Erro 404 ao tentar exibir as fotografias dos estudantes na tela de dietas devido a caminho absoluto com IP local antigo. | Padronização dos caminhos relativos de storage e parametrização correta da variável de ambiente da API. | César | Hermilo | 🟠 Alta | Finalizado ✅ |
| **03/09** | Checkboxes de dietas desativados | Os checkboxes para marcar presença dos alunos com dieta especial estavam com atributo `disabled` por padrão. | Remoção da trava indevida, permitindo confirmação individual da presença de cada estudante alérgico. | André | Hermilo | 🟠 Alta | Finalizado ✅ |
| **03/09** | Relatório de dietas vazio | A geração de PDF de restrições alimentares não aplicava os filtros de turma e vinha em branco. | Reescrita da rotina de agregação no backend para cruzar `alunos`, `necessidades` e `contagem_nes`. | André | André | 🟡 Média | Finalizado ✅ |
| **19/09** | Dietas listando alunos ausentes | A tela de preparo listava todos os estudantes cadastrados com restrição, e não apenas os que estavam na escola no dia. | Reestruturação lógica da query para exibir apenas quem foi assinalado presente na data matinal. | César | Jaqueline | 🔴 Urgente | Finalizado ✅ |
| **17/10** | Scroll e rolagem no chat | A janela de mensagens não permitia rolagem interna quando a conversa acumulava mais de 10 mensagens. | Adicionado scroll interno independente (`overflow-y: auto`) na seção de mensagens do chat. | André | Dot.W / DD's | 🟡 Média | Finalizado ✅ |
| **17/10** | Sanitização contra injeção HTML | Usuários conseguiam colar códigos HTML e tags `<img>` no chat e no módulo de demandas. | Implementado filtro de sanitização (`strip_tags`) para converter qualquer entrada em texto puro seguro. | André | Coding the Future | 🟡 Média | Finalizado ✅ |
| **17/10** | Deslocamento de tela ao focar input | Ao tocar no input de contagem no mobile, o teclado virtual empurrava o layout de maneira brusca. | Ajustado comportamento de foco no CSS e meta viewport para evitar saltos visuais no smartphone. | André | Dot.W | 🟠 Alta | Finalizado ✅ |
| **17/10** | Botão Voltar inoperante | Na tela de administração (`gerenciar.php`), o botão de sair do menu não executava a ação. | Vinculação correta do gatilho JavaScript para chamada da rota de logout. | André | DD's | 🟡 Média | Finalizado ✅ |
| **17/10** | Confirmação ao resetar senha | Possibilidade de resetar a senha de um usuário com um clique acidental, sem modal de confirmação. | Inclusão de modal com alerta explícito e exigência de confirmação antes do reset de credenciais. | André | Dev the Blaze | 🟠 Alta | Finalizado ✅ |
| **17/10** | Campos ambíguos na pesagem | Campo de medida de alimento era texto livre, gerando entradas inconsistentes como "kilos", "KG", "pratos". | Substituição do input livre por um `<select>` padronizado com as unidades homologadas: `kg`, `g`, `unid`. | André | Dev the Blaze | 🟠 Alta | Finalizado ✅ |
| **17/10** | Cores inconsistentes em botões | Botões com a mesma ação de confirmação de saída apareciam verdes em uma tela e vermelhos em outra. | Padronização das classes de botões do Design System: Verde para confirmação, Vermelho para saída/cancelamento. | André | DD's | 🟡 Média | Finalizado ✅ |

---

## 3. Conclusão da Homologação
Com a resolução de **100% dos 31 apontamentos registrados**, o sistema Menu Solutions alcançou nível de maturidade e estabilidade operacional aprovado pelos stakeholders da Escola SESI CE-368 para uso em produção.
