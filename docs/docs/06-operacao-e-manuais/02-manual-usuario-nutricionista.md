# Manual de Operação do Usuário: Nutrição Escolar

Este manual orienta a Nutricionista responsável pela gestão da merenda e alimentação escolar na operação diária do painel analítico do sistema **Menu Solutions**.

---

## 1. Visão Geral do Painel de Controle (Dashboard)

Ao efetuar login com perfil de Nutricionista (`nivel_user: 2`), a tela principal é carregada automaticamente com a visão consolidada em tempo real da unidade escolar:

```
+------------------------------------------------------------------------------------------------+
| MENU SOLUTIONS | Painel Nutricional                                     Usuária: Jaqueline (Nutri)|
+------------------------------------------------------------------------------------------------+
|  DATA: 28/11/2025 | STATUS DA REDE: Conectado (Sincronização Ativa)                              |
|                                                                                                |
|  [ TOTAL ALUNOS HOJE ]    [ FUNDAMENTAL 1 ]    [ FUNDAMENTAL 2 ]    [ ENSINO MÉDIO ]  [ OUTROS ] |
|         452 Alunos            182 Alunos           160 Alunos           110 Alunos     42 Alunos |
|                                                                                                |
|  --------------------------------------------------------------------------------------------  |
|  ALUNOS COM DIETA ESPECIAL PRESENTES HOJE (4 Identificados):                                   |
|  [ Foto ] Lucas Martins      | 3° Ano E.F  | Restrição: Intolerância Severa a Lactose          |
|  [ Foto ] Beatriz Silveira   | 7° Ano E.F  | Restrição: Doença Celíaca (Sem Glúten)            |
|  [ Foto ] Gabriel Souza      | 1° Ano E.M  | Restrição: Alergia a Ovo / Albumina               |
|  [ Foto ] Mariana Dias       | 5° Ano E.F  | Restrição: Diabetes Tipo 1 (Controle Glicêmico)   |
|                                                                                                |
|  --------------------------------------------------------------------------------------------  |
|  REFEIÇÕES AVULSAS (AUTORIZADOS): 1 Pendente | 2 Confirmados                                   |
|  [ APROVAR ] Prefeito e Assessor Institucional (Almoço às 12:00)                               |
+------------------------------------------------------------------------------------------------+
```

### Principais Recursos da Tela Inicial:
1. **Atualização Automática (AJAX Polling):** O dashboard busca dados atualizados no servidor silenciosamente a cada 60 segundos, refletindo o progresso da inspetora sala a sala.
2. **Segregação do Contraturno:** O card **"Outros"** (Robótica, TRI, Personaliza) permanece isolado para que o número do almoço principal não seja superestimado.

---

## 2. Acompanhamento de Alunos com Dietas Específicas

Para garantir o atendimento seguro de estudantes com laudos de intolerâncias ou patologias:
1. Acesse o menu lateral e clique em **"Alunos & Dietas"**.
2. O sistema exibe o catálogo de alunos com restrições cadastradas.
3. Na seção **"Presentes no Dia"**, o sistema destaca apenas os alunos cujas turmas foram aferidas como presentes na data de hoje.
4. Clique no card do estudante para visualizar:
   * Fotografia nítida do aluno (para reconhecimento visual rápido na fila do refeitório);
   * Nome completo e Registro de Matrícula (RM);
   * Turma e período letivo;
   * Laudo detalhado das restrições e alimentos proibidos.
5. Repasse a listagem individualizada de dietas para a cozinheira responsável pelo preparo dos pratos especiais.

---

## 3. Gestão de Autorizados (Refeições Avulsas)

1. Acesse **"Autorizados"** no menu.
2. Visualize as solicitações cadastradas pela direção ou recepção para refeições de convidados externos, estagiários ou autoridades municipais.
3. Para aprovar uma refeição, clique no botão verde **"Confirmar"**. O status mudará de `pendente` para `confirmado`, e a refeição será computada na previsão de produção da cozinha.

---

## 4. Lançamento de Produção, Consumo e Desperdício

Ao final do turno de almoço (por volta das 13h30):
1. Acesse **"Controle de Produção e Consumo"**.
2. Clique no botão **"Novo Registro de Pesagem"**.
3. Preencha os campos obrigatórios:
   * **Nome do Alimento:** Selecione ou digite o prato servido (ex.: *Arroz tipo 1*, *Feijão carioca*, *Filé de frango ao molho*).
   * **Quantidade Produzida:** Informe o peso bruto preparado em quilogramas (ex.: `35.00 kg`).
   * **Pessoas Atendidas:** Quantidade total de alunos e colaboradores que consumiram a refeição.
   * **Sobra Limpa:** Peso em quilogramas do alimento que permaneceu nas cubas térmicas da cozinha e pode ser reaproveitado conforme normas da ANVISA (ex.: `2.80 kg`).
   * **Desperdício / Resto-Ingesta:** Peso total em quilogramas dos restos alimentares deixados nos pratos das crianças e descartados no lixo orgânico (ex.: `1.40 kg`).
4. Clique em **"Salvar Registro"**. Esses dados alimentarão os gráficos históricos de consumo per capita e combate ao desperdício.

---

## 5. Publicação do Cardápio Semanal

1. Acesse **"Cardápio"** no menu.
2. Clique em **"Upload de Novo Cardápio"**.
3. Selecione o arquivo de imagem do cardápio semanal homologado pela sede do SESI (formatos `.png` ou `.jpg`).
4. Clique em **"Publicar"**. A nova versão estará imediatamente acessível para a Inspetora e disponível para consulta da comunidade escolar.

---

## 6. Emissão e Exportação de Relatórios

1. Acesse a aba **"Relatórios"**.
2. Selecione o intervalo desejado:
   * Diário (resumo do dia);
   * Semanal ou Mensal (análise de tendências de frequência).
3. Aplique os filtros opcionais por turma ou segmento educacional.
4. Escolha o formato de saída:
   * 📄 **PDF:** Relatório formatado com cabeçalho oficial da escola, ideal para assinatura e arquivo físico;
   * 📊 **Excel (XLSX) / CSV:** Planilha de dados brutos para análises estatísticas e auditorias na sede regional.
