# Termo de Abertura e Origem do Projeto Menu Solutions

---

## 1. Identificação do Projeto

* **Nome do Produto / Sistema:** Menu Solutions (anteriormente registrado como *Contador de Alunos* / *Score Solutions*).
* **Entidade Desenvolvedora:** Code Solutions — Squad de Desenvolvimento de Software (Projeto Integrador Técnico SESI/SENAI).
* **Instituição Cliente e Unidade Piloto:** Escola SESI — Centro Educacional CE 368.
  * **Endereço:** Rua José Gomes, 1341 — Regente Feijó, Estado de São Paulo, Brasil.
* **Período de Concepção e Execução:** Fevereiro de 2024 a Novembro de 2025.
* **Classificação:** Sistema Web Responsivo e Mobile-First para Gestão de Refeições, Contagem de Alunos e Controle Operacional Alimentar.

---

## 2. Contexto e Diagnóstico do Problema

Nas instituições de ensino da rede SESI-SP de período integral e parcial, a gestão da merenda e das refeições diárias (café da manhã, colação, almoço, lanche da tarde) é um dos pilares logísticos mais críticos da operação escolar. 

Antes da implementação da plataforma **Menu Solutions**, o processo na unidade de Regente Feijó (CE 368) era conduzido de maneira manual e analógica, acarretando gargalos severos:

```mermaid
journey
    title A Rotina Analógica Anterior vs O Gargalo das 07:30
    section Início do Turno (07:00 - 07:10)
      Chegada dos alunos nas salas: 5: Inspetora, Alunos
      Abertura das planilhas de papel: 3: Inspetora
    section A Caminhada das Pranchetas (07:10 - 07:40)
      Caminhada sala a sala com prancheta: 2: Inspetora
      Contagem manual cabeça a cabeça: 2: Inspetora
      Atrasos devido a interrupções: 1: Inspetora
    section O Gargalo Crítico na Cozinha (07:30)
      Início obrigatório da cocção: 2: Cozinha, Nutricionista
      Falta do número exato de alunos: 1: Nutricionista
      Estimativa por aproximação (erros): 1: Cozinha
    section Impacto Final (11:00 - 13:00)
      Sobra limpa excessiva ou falta de comida: 1: Alunos, Nutricionista
      Desperdício de recursos públicos: 1: Gestão Escolar
```

### Principais Ineficiências Diagnosticadas:

1. **Desperdício de Tempo e Mão de Obra Qualificada:**
   * A inspetora escolar (Laís) despendia entre 30 a 45 minutos todas as manhãs percorrendo os corredores da escola com prancheta física.
   * Estimativa anual: Mais de **30 horas de trabalho** consumidas exclusivamente no ato mecânico de caminhar e anotar números em folhas.
2. **Consumo Desnecessário de Recursos Materiais:**
   * Eram consumidas mais de **200 folhas de papel por ano letivo**, as quais, após o repasse para a cozinha, eram arquivadas de forma desestruturada ou descartadas, impossibilitando qualquer inteligência de dados ou auditoria histórica.
3. **O Gargalo Temporal das 07:30:**
   * Para atender às normas higiênico-sanitárias e ao cronograma das refeições, a equipe de cozinha e a nutricionista responsável (Jaqueline) necessitam saber a demanda exata de alunos presentes até as **07:30**. 
   * Atrasos na entrega da prancheta resultavam em estimativas arbitrárias no porcionamento do feijão, arroz e proteínas, gerando excesso de sobra limpa ou insuficiência de porções.
4. **Alunos com Dietas Específicas e Risco Alimentar:**
   * Alunos celíacos (intolerantes a glúten), diabéticos, intolerantes à lactose e alérgicos a ovo ou leguminosas eram controlados em anotações esparsas. Faltas desses alunos geravam preparo indevido de pratos especializados de alto custo, enquanto a presença não comunicada gerava atraso na produção individualizada.
5. **Dificuldade no Controle de Turmas Contraturno e Especiais:**
   * A presença de estudantes do Fundamental I e II, Ensino Médio, Novo Ensino Médio, além de modalidades como **Robótica, Personaliza, TRI, Tópicos Avançados (T.A.), Para Gabaritar (P.G.) e Práticas Investigativas**, bem como a inclusão de colaboradores da escola, gerava confusão na distinção entre quem comia apenas o lanche e quem consumia o almoço completo.
6. **Cardápio Físico Estático:**
   * O cardápio semanal era impresso e fixado em murais de vidro nos corredores. Quando ocorria falta de um ingrediente no fornecedor ou quebra de equipamento, a atualização não alcançava a comunidade escolar a tempo.

---

## 3. Justificativa e Objetivos

### 3.1. Objetivo Geral
Desenvolver, homologar e implantar uma solução digital web/mobile integrada (Menu Solutions) para automatizar a contagem presencial de alunos, digitalizar o cardápio escolar, monitorar dietas restritivas e fornecer métricas em tempo real para a gestão alimentar da Escola SESI CE-368, eliminando o uso de papel e mitigando o desperdício de alimentos.

### 3.2. Objetivos Específicos
* **Agilidade:** Reduzir o tempo de consolidação da presença de 40 minutos para menos de 5 minutos, garantindo números consolidados no dashboard da nutricionista antes das 07:30.
* **Sustentabilidade:** Extinguir o consumo anual de mais de 200 folhas de papel no controle de presença da merenda escolar.
* **Segurança Alimentar e Dietas:** Criar módulo específico de identificação visual (com foto, RM e turma) dos alunos com necessidades nutricionais especiais.
* **Controle de Autorizados:** Permitir o registro e a autorização de refeições avulsas para estagiários, visitantes institucionais e funcionários.
* **Métricas de Sustentabilidade:** Estruturar tabela de registro diário de alimentos preparados, pessoas atendidas, sobra limpa e desperdício de resto-ingesta em quilos.
* **Comunicação Direta:** Integrar um canal de chat seguro entre a inspetoria matinal e a sala da nutrição/cozinha.

---

## 4. Declaração do Escopo

### 4.1. Limites do Escopo (Inclusões)
* Interface responsiva para celulares voltada para a Inspetoria com navegação rápida entre salas e turmas.
* Dashboard analítico desktop para a Nutricionista com totalizadores em tempo real e gráficos de demanda.
* Gestão e upload de imagens do cardápio semanal.
* Cadastro e gestão de alunos com dietas especiais vinculados a fotos e condições clínicas.
* Módulo de aprovação de pessoas autorizadas avulsas para o almoço.
* Registro de pesagem de alimentos (produção, sobra limpa e descarte).
* Módulo de chat interno para comunicação operacional.
* Exportação de relatórios em formatos abertos e interoperáveis (PDF, CSV, Excel).
* Banco de dados relacional seguro com autenticação robusta (Bcrypt) e controle de perfis de acesso (RBAC).

### 4.2. Exclusões Explícitas (Fora de Escopo)
* Integração direta com a base de dados corporativa central da FIESP/SESI sem autorização e APIs oficiais liberadas.
* Reconhecimento facial automatizado por câmeras de segurança ou biometria digital em catracas (descartado por custos de hardware e complexidade técnica para orçamento zero).
* Criação de aplicativos nativos publicados nas lojas Google Play Store e Apple App Store (o sistema opera como Web App / PWA responsivo).
* Gestão financeira e pagamentos de cantina terceirizada.

---

## 5. Premissas e Restrições

### 5.1. Premissas
* A administração da Escola SESI CE-368 disponibilizará conexão Wi-Fi/rede local nas dependências de acesso dos inspetores e nutricionista.
* A inspetora continuará realizando a conferência presencial sala a sala, agora munida de smartphone ou tablet institucional.
* Os dados fornecidos pela escola a respeito de matrículas, turmas e laudos médicos de restrição alimentar são fidedignos e autorizados pelos responsáveis legais sob a LGPD.

### 5.2. Restrições
* **Orçamento Financeiro Zero:** O projeto deve ser construído integralmente com ferramentas open-source, linguagens gratuitas e sem custos com licenciamento de infraestrutura paga durante o ciclo letivo.
* **Conectividade:** O sistema depende da rede local ou conexão de dados; estratégias de cache e resiliência a falhas de rede devem ser contempladas.
* **Conformidade Legal:** Todo o tratamento de dados pessoais de menores de idade (nomes, fotos, RMs, diagnósticos de alergia) deve obedecer rigorosamente à Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
