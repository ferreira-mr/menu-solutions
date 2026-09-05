# Matriz de Rastreabilidade de Requisitos e Qualidade

Este documento correlaciona os Requisitos de Negócio e de Sistema da plataforma **Menu Solutions** com suas respectivas regras de negócio, tabelas de banco de dados, endpoints da API e casos de teste executados.

---

## 1. Matriz Bidirecional de Rastreabilidade

| Requisito | Regra de Negócio | Tabela(s) Relacionada(s) | Endpoint / Componente | Casos de Teste Associados | Status de Homologação |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **RF01** (Login & RBAC) | RN01, RN06 | `users`, `personal_access_tokens` | `POST /api/login`, Middleware Sanctum | Armazenamento de senha em texto (05/08), Resetar senha (17/10) | Homologado ✅ |
| **RF02** (Contagem Mobile) | RN01, RN07 | `contagens`, `turmas` | `POST /api/contagens`, View Inspetora | Erro na atualização de contagem (13/08), Deslocamento de tela (17/10) | Homologado ✅ |
| **RF03** (Edição no Dia) | RN07, RN14 | `contagens` | `PUT /api/contagens/{id}` | Bloqueio de retroatividade (08/08), Limite de contagens passadas (20/08) | Homologado ✅ |
| **RF04** (Dashboard em Tempo Real) | RN02, RN08 | `contagens`, `turmas` | `GET /api/contagens/hoje`, Polling AJAX | Polling assíncrono (15/08), Total diário na tela inicial (14/08) | Homologado ✅ |
| **RF05** (Alunos com Dietas) | RN12, RN16 | `alunos`, `necessidades`, `alunos_has_necessidades` | `GET /api/alunos/dietas-especificas` | Exibição de dietas específicas (05/08), Resolução de fotos (03/09) | Homologado ✅ |
| **RF06** (Presença em Dieta) | RN02, RN16 | `contagem_nes` | `POST /api/contagem-nes` | Checkboxes de dietas desativados (03/09), Dietas listando ausentes (19/09) | Homologado ✅ |
| **RF07** (Autorizados Avulsos) | RN03, RN17 | `autorizados` | `GET /api/autorizados`, `PATCH /status` | Sanitização no módulo de demandas (17/10) | Homologado ✅ |
| **RF08** (Pesagem & Desperdício) | RN05, RN09, RN11 | `controle_de_producao_e_consumo`| `POST /api/producao-consumo` | Confusão no adicionar alimento / medida (17/10) | Homologado ✅ |
| **RF09** (Cardápio Digital) | RN04 | `cardapio` | `GET /api/cardapio/atual`, `POST /upload`| Tela do cardápio cortada (27/08) | Homologado ✅ |
| **RF10** (Chat Integrado) | RN10 | `chat`, `users` | `GET/POST /api/chat/mensagens` | Sanitização contra injeção HTML (17/10), Scroll do chat (17/10) | Homologado ✅ |
| **RF11** (Gestão de Turmas) | RN01, RN13 | `turmas`, `categorias` | `Resource /api/turmas` | Falha de exclusão de turmas / Soft Delete (26/08) | Homologado ✅ |
| **RF12** (Exportação PDF/Excel) | RN08 | `contagens`, `turmas` | `GET /api/relatorios/exportar` | Relatórios por turma/categoria (14/08), Z-index menu relatórios (15/08) | Homologado ✅ |
| **RF13** (Isolamento Contraturno) | RN15 | `turmas`, `categorias` | Filtro `categorias_id != 'Outros'` | Distorção no somatório geral da categoria Outros (08/08) | Homologado ✅ |
| **RNF03** (Criptografia Bcrypt) | RN06 | `users` | Hash::make() no Laravel | Validação de senhas case-sensitive e hash seguro (05/08) | Homologado ✅ |
| **RNF08** (Bootstrap Local) | — | Assets CSS/JS locais | Servidor local Intranet SESI | Baixar Bootstrap localmente no servidor da sala (08/08) | Homologado ✅ |

---

## 2. Cobertura dos Requisitos

* **Total de Requisitos Funcionais Analisados:** 15 RFs
* **Cobertura por Casos de Teste Documentados:** 100%
* **Índice de Resolução de Não-Conformidades:** 100% (todos os 31 bugs e melhorias listados no relatório formal foram corrigidos e finalizados ✅).
