# Requisitos Funcionais (RF) do Sistema Menu Solutions

Este documento especifica os Requisitos Funcionais (RF) detalhados da plataforma **Menu Solutions**, mapeando os casos de uso, atores envolvidos, fluxos principais e critérios de aceite.

---

## 1. Matriz Consolidada de Requisitos Funcionais

| Código | Requisito Funcional | Ator Principal | Descrição Sucinta | Prioridade |
| :--- | :--- | :--- | :--- | :--- |
| **RF01** | **Autenticação Individualizada e Níveis de Acesso** | Inspetora, Nutricionista, Administrador | O sistema deve autenticar usuários mediante e-mail/usuário, senha e identificador NIF, aplicando controle de acesso baseado em papéis (RBAC). | Essencial |
| **RF02** | **Contagem de Alunos por Sala/Turma (Mobile)** | Inspetora | O sistema deve permitir que a Inspetora registre a contagem diária de alunos presentes para cada sala/turma através de uma interface intuitiva móvel com botões de incremento e decremento. | Essencial |
| **RF03** | **Edição e Correção de Contagem do Dia Corrente** | Inspetora | O sistema deve permitir retificar os números de uma sala contada na mesma data, alertando a Nutricionista sobre a alteração. | Importante |
| **RF04** | **Dashboard Analítico em Tempo Real** | Nutricionista | O sistema deve exibir na tela inicial da Nutricionista o totalizador consolidado de alunos presentes, discriminado por modalidade escolar, com atualização dinâmica via AJAX/Polling. | Essencial |
| **RF05** | **Gestão de Alunos com Necessidades e Dietas Especiais** | Nutricionista, Inspetora | O sistema deve manter o cadastro e a listagem visual dos alunos com laudos de restrições alimentares, incluindo nome, RM, foto, turma e patologia associada. | Essencial |
| **RF06** | **Contagem de Presença de Alunos em Dieta Restritiva** | Inspetora, Nutricionista | O sistema deve permitir confirmar quais alunos de dieta específica estão presentes na data para preparo do cardápio especial. | Essencial |
| **RF07** | **Módulo de Refeições Avulsas (Autorizados)** | Inspetora, Nutricionista, Gestor | O sistema deve permitir cadastrar solicitações de refeição para pessoas externas ou colaboradores, registrando título, justificativa e alternando entre status `pendente` e `confirmado`. | Importante |
| **RF08** | **Registro de Produção, Consumo e Desperdício** | Nutricionista | O sistema deve permitir lançar o nome do alimento, data, quantidade preparada (kg/unid), número de pessoas atendidas, sobra limpa e descarte/desperdício gerado. | Importante |
| **RF09** | **Publicação e Consulta de Cardápio Digital** | Nutricionista, Inspetora | O sistema deve disponibilizar funcionalidade para envio (upload de imagem/documento) e visualização do cardápio escolar semanal. | Importante |
| **RF10** | **Canal de Chat Operacional Integrado** | Inspetora, Nutricionista | O sistema deve prover troca direta de mensagens de texto entre a inspetoria e a nutrição, com histórico cronológico e indicador de mensagem lida/não lida (`visto`). | Desejável |
| **RF11** | **Gestão de Salas, Categorias e Turmas** | Administrador, Nutricionista | O sistema deve permitir criar, editar e desativar turmas, atribuindo-as às categorias escolares oficiais (Fundamental I, II, Médio, Outros). | Importante |
| **RF12** | **Exportação de Relatórios Multi-formato** | Nutricionista | O sistema deve gerar relatórios parametrizados por intervalo de datas, turma ou categoria, com download nos formatos PDF, CSV e Excel (XLSX). | Essencial |
| **RF13** | **Segregação Visual e Numérica de Contraturno** | Nutricionista, Inspetora | O sistema deve isolar grupos especiais (Robótica, TRI, Personaliza, Funcionários) do totalizador de merenda matinal primária. | Essencial |
| **RF14** | **Cronograma de Atividades e Permanência** | Inspetora, Nutricionista | O sistema deve exibir a escala semanal de permanência de alunos em contraturno vinculada a dias da semana específicos. | Desejável |
| **RF15** | **Recuperação e Troca Segura de Senha** | Todos os usuários | O sistema deve permitir reset de senha mediante token seguro e confirmação explícita de operação. | Importante |

---

## 2. Detalhamento dos Principais Casos de Uso

### Caso de Uso UC01: Registrar Contagem Diária de Alunos
* **Ator Principal:** Inspetora (Laís).
* **Pré-condições:** Inspetora autenticada no sistema; data letiva válida; limite de 07:30 não extrapolado.
* **Fluxo Principal:**
  1. A inspetora acessa o menu principal e clica em **"Nova Contagem"**.
  2. O sistema lista os cards das salas ativas organizadas por ordem escolar (1º Ano EF I até 3º Ano EM e grupos especiais).
  3. As salas que já receberam contagem no dia são identificadas visualmente com indicador de concluído.
  4. A inspetora seleciona uma sala pendente.
  5. A tela exibe o seletor com o valor numérico atual (padrão zero ou última contagem) e botões grandes de incremento `(+)` e decremento `(-)`.
  6. A inspetora digita diretamente o número ou utiliza os botões de ajuste.
  7. A inspetora clica em **"Salvar Contagem"**.
  8. O sistema valida que o número é um inteiro positivo $\ge 0$, persiste a contagem no banco de dados com a hora e o ID da usuária, emitindo mensagem de sucesso.
  9. O sistema retorna à listagem de salas para que a inspetora prossiga para a próxima classe.
* **Fluxo Alternativo (Correção):**
  * Caso a inspetora necessite corrigir uma contagem já enviada no mesmo dia, ela acessa **"Ver Contagens"**, seleciona a turma, aciona o botão **"Alterar"**, ajusta o quantitativo e reenvia.

---

### Caso de Uso UC02: Acompanhamento de Demanda e Alertas Nutricionais
* **Ator Principal:** Nutricionista (Jaqueline).
* **Pré-condições:** Nutricionista autenticada em estação de trabalho ou notebook.
* **Fluxo Principal:**
  1. A nutricionista acessa a tela principal do sistema.
  2. O sistema carrega o painel de monitoramento com os cards:
     * **Total Geral de Alunos Presentes no Dia**;
     * **Subtotais por Segmento:** Fundamental I (1º a 5º), Fundamental II (6º a 9º), Ensino Médio regular e Grupos Especiais/Funcionários;
     * **Alunos com Dietas Específicas Presentes** (com indicador de condição: celíaco, lactose, alérgico a glúten, etc.);
     * **Total de Autorizados Confirmados** para o almoço.
  3. A cada 60 segundos (ou via requisição assíncrona AJAX), o painel re-sincroniza silenciosamente os números sem recarregar toda a página, refletindo instantaneamente as salas que a inspetora acabou de registrar.
  4. Às 07:30, a nutricionista clica em **"Fechar Demanda da Cozinha"** ou emite o resumo em PDF para entrega às cozinheiras.

---

### Caso de Uso UC03: Lançamento de Pesagem de Sobras e Desperdício
* **Ator Principal:** Nutricionista.
* **Pré-condições:** Término do horário de almoço escolar.
* **Fluxo Principal:**
  1. A nutricionista acessa a seção **"Controle de Produção e Consumo"**.
  2. Seleciona a data do serviço alimentar.
  3. Adiciona os itens preparados no dia (ex.: *Arroz tipo 1*, *Feijão carioca*, *Frango em cubos*).
  4. Para cada item, preenche:
     * Quantidade total produzida (ex.: 45.00 kg);
     * Total de pessoas servidas (ex.: 320 alunos);
     * **Sobra Limpa** (comida de alta qualidade mantida em banho-maria não servida, em kg);
     * **Desperdício / Resto-Ingesta** (resíduos descartados das bandejas dos alunos, em kg).
  5. Clica em **"Gravar Registro"**.
  6. O sistema armazena os dados na tabela `controle_de_producao_e_consumo` e recalcula a média de consumo per capita real.
