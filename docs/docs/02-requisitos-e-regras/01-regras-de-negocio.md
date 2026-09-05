# Regras de Negócio (RN) do Sistema Menu Solutions

Este documento consolida e formaliza todas as Regras de Negócio que regem as operações da plataforma **Menu Solutions**, estabelecidas em conjunto com a gestão escolar, inspetoria e serviço de nutrição da Escola SESI CE-368.

---

## 1. Tabela de Regras de Negócio

| Código | Nome da Regra | Descrição Normativa | Entidades Relacionadas | Severidade |
| :--- | :--- | :--- | :--- | :--- |
| **RN01** | **Exclusividade da Inspetoria na Contagem** | A responsabilidade operacional pela contagem presencial dos alunos nas salas e turmas é de atribuição exclusiva dos usuários com perfil de Inspetor(a). | `users`, `contagens`, `turmas` | Crítica |
| **RN02** | **Tomada de Decisão Nutricional** | A Nutricionista utiliza os dados consolidados da contagem diária para definir o volume per capita de cocção dos alimentos do almoço, café da manhã e lanches. | `contagens`, `controle_de_producao_e_consumo` | Crítica |
| **RN03** | **Alinhamento da Produção da Cozinha** | A equipe de manipuladoras e cozinheiras da escola somente iniciará a finalização e porcionamento após a validação e autorização dos quantitativos pela Nutricionista. | `controle_de_producao_e_consumo` | Alta |
| **RN04** | **Definição e Publicação do Cardápio Semanal** | O cardápio semanal deve ser cadastrado/atualizado no sistema exclusivamente pela Nutricionista responsável, ficando visível para consulta da comunidade escolar. | `cardapio`, `users` | Alta |
| **RN05** | **Atualização Diária de Consumo e Sobras** | O controle de estoque e de produção alimentar deve ser atualizado diariamente com a pesagem da matéria-prima utilizada, sobras limpas e descartes de resto-ingesta. | `controle_de_producao_e_consumo` | Média |
| **RN06** | **Integridade e Restrição de Acesso ao Estoque** | Nenhum registro de estoque ou consumo poderá ser manipulado ou editado por usuários sem perfil e nível de permissão devidamente homologado. | `users`, `controle_de_producao_e_consumo` | Crítica |
| **RN07** | **Pontualidade no Repasse da Contagem** | A contagem matinal deve ser concluída e sincronizada até o limite regulamentar das **07:30 da manhã**, viabilizando o tempo mínimo de cocção das refeições. | `contagens` | Crítica |
| **RN08** | **Análise e Auditoria de Dados** | A Nutricionista detém autonomia analítica sobre relatórios históricos, médias semanais e desvios de frequência para tomada de decisões com a Direção Escolar. | `contagens`, `relatorios` | Alta |
| **RN09** | **Instruções de Manipulação e Porcionamento** | As fichas técnicas e instruções de preparo dos alimentos devem respeitar a proporção per capita multiplicada pelo número exato de alunos presentes. | `controle_de_producao_e_consumo` | Alta |
| **RN10** | **Comunicação Ativa e Contínua** | Havendo imprevistos (ex.: atrasos de turmas, passeios externos, falta de insumos), a comunicação imediata deve ocorrer por meio do canal de Chat interno. | `chat`, `users` | Média |
| **RN11** | **Conformidade Sanitária e Segurança dos Alimentos** | As práticas de armazenamento, manipulação e registro de temperatura e sobras devem respeitar as diretrizes da ANVISA e os manuais corporativos do SESI. | `controle_de_producao_e_consumo` | Crítica |
| **RN12** | **Privacidade e Proteção de Dados (LGPD)** | Informações pessoais de estudantes (fotos, nome civil, RM, diagnósticos médicos e restrições alimentares) são restritas e protegidas conforme a Lei nº 13.709/2018. | `alunos`, `necessidades`, `alunos_has_necessidades` | Crítica |
| **RN13** | **Ajuste em Eventos e Atividades Especiais** | Em dias de atividades extracurriculares, contraturno, olimpíadas do conhecimento ou feriados municipais, as salas participantes devem ser reajustadas no cronograma. | `cronogramas`, `turmas`, `contagens` | Alta |

---

## 2. Regras Operacionais Específicas de Sistema (V2)

### RN14 — Imutabilidade de Contagens Históricas
* Não é permitido à Inspetora alterar ou sobrescrever registros de contagem de datas anteriores à data corrente. Uma vez encerrado o dia letivo, o registro torna-se somente leitura para a Inspetoria, admitindo retificações apenas mediante login e justificativa da Nutricionista.

### RN15 — Segregação da Categoria "Outros" no Somatório do Almoço Regular
* As turmas e grupos categorizados como "Outros" (ex.: Robótica, Personaliza, TRI, Tópicos Avançados, Para Gabaritar) que realizam atividades no período vespertino/contraturno **não devem** ser somadas ao totalizador geral de alunos da refeição matinal padrão para evitar a produção errônea de comida além do necessário.

### RN16 — Rastreamento Individual de Dietas Restritivas
* Alunos cadastrados com necessidades especiais (celíacos, intolerantes a lactose, diabéticos, etc.) devem ser exibidos em lista destacada com fotografia e identificador claro de restrição. A contagem da presença desses alunos deve atualizar o módulo `contagem_nes` para evitar o preparo incorreto de dietas especiais.

### RN17 — Validação e Autorização de Refeições Avulsas (Módulo Autorizados)
* Visitantes, autoridades públicas, estagiários ou colaboradores externos que necessitem almoçar na escola devem ser lançados no sistema com título, descrição e status inicial `pendente`. A refeição só poderá ser servida quando o status for alterado para `confirmado` pela Nutricionista.
