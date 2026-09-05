# Especificação dos Endpoints da API REST (V2)

Este documento especifica os contratos de interface e endpoints HTTP da API RESTful do **Menu Solutions**, desenvolvida sobre o framework **Laravel** e hospedada no repositório [`cesaraugustooo/cont_api_v2.git`](https://github.com/cesaraugustooo/cont_api_v2.git).

---

## 1. Padrões de Comunicação e Segurança

* **Formato de Troca de Dados:** JSON (`application/json; charset=utf-8`).
* **Autenticação:** Tokens Bearer emitidos pelo **Laravel Sanctum**.
  * Header mandatório para rotas protegidas: `Authorization: Bearer <SEU_TOKEN_AQUI>`.
* **Tratamento de Códigos HTTP Padrão:**
  * `200 OK`: Requisição processada com sucesso.
  * `201 Created`: Novo recurso criado com sucesso.
  * `400 Bad Request`: Parâmetros inválidos ou malformados.
  * `401 Unauthorized`: Ausência de token válido ou expirado.
  * `403 Forbidden`: Usuário não possui o nível de acesso (`nivel_user`) exigido para a operação.
  * `404 Not Found`: Recurso não localizado.
  * `422 Unprocessable Entity`: Falha na validação de campos obrigatórios.
  * `500 Internal Server Error`: Falha inesperada no servidor.

---

## 2. Catálogo de Endpoints da API

### 2.1. Módulo de Autenticação (`/api/auth`)

#### `POST /api/login`
* **Descrição:** Autentica o usuário (Inspetora ou Nutricionista) e emite um token Sanctum.
* **Corpo da Requisição (Payload):**
  ```json
  {
    "email": "inspetora@sesisp.org.br",
    "password": "SenhaSegura123!"
  }
  ```
* **Resposta de Sucesso (200 OK):**
  ```json
  {
    "status": "success",
    "token": "1|qX9Zp7kLmN4...sanctum_token...",
    "user": {
      "id": 1,
      "name": "Laís",
      "email": "inspetora@sesisp.org.br",
      "nivel_user": "1",
      "nif": "368001"
    }
  }
  ```

#### `POST /api/logout`
* **Descrição:** Revoga o token atual do usuário autenticado.
* **Headers:** `Authorization: Bearer <token>`
* **Resposta de Sucesso (200 OK):**
  ```json
  {
    "message": "Sessão encerrada com sucesso."
  }
  ```

---

### 2.2. Módulo de Contagens (`/api/contagens`)

#### `GET /api/contagens/hoje`
* **Descrição:** Retorna todas as contagens registradas na data corrente, separadas por turma.
* **Resposta de Sucesso (200 OK):**
  ```json
  {
    "data": "2025-11-28",
    "total_geral": 452,
    "contagens": [
      {
        "id": 104,
        "turma_id": 1,
        "nome_turma": "1° Ano E.F",
        "categoria": "Fundamental 1",
        "qtd_contagem": 32,
        "hora_contagem": "07:18:00",
        "registrado_por": "Laís"
      },
      {
        "id": 105,
        "turma_id": 2,
        "nome_turma": "2° Ano E.F",
        "categoria": "Fundamental 1",
        "qtd_contagem": 29,
        "hora_contagem": "07:22:00",
        "registrado_por": "Laís"
      }
    ]
  }
  ```

#### `POST /api/contagens`
* **Descrição:** Registra a contagem de uma sala específica realizada pela Inspetora.
* **Headers:** `Authorization: Bearer <token>`
* **Corpo da Requisição:**
  ```json
  {
    "turmas_id": 3,
    "qtd_contagem": 30,
    "data_contagem": "2025-11-28",
    "hora_contagem": "07:25:00"
  }
  ```
* **Resposta de Sucesso (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Contagem registrada com sucesso.",
    "id": 106
  }
  ```

#### `PUT /api/contagens/{id}`
* **Descrição:** Permite que a Inspetora altere a contagem de uma sala no mesmo dia letivo.
* **Regra:** Bloqueado se a `data_contagem` for anterior ao dia atual (RN14).

---

### 2.3. Módulo de Alunos e Dietas Restritivas (`/api/alunos` e `/api/necessidades`)

#### `GET /api/alunos/dietas-especificas`
* **Descrição:** Lista todos os alunos cadastrados com restrições alimentares ativas, incluindo fotografia e detalhes clínicos.
* **Resposta de Sucesso (200 OK):**
  ```json
  [
    {
      "id": 8,
      "nome": "Lucas Martins",
      "rm": "20241033",
      "turma": "3° Ano E.F",
      "foto_url": "https://api.escola.sesisp.org.br/storage/alunos/1759330206.png",
      "necessidades": [
        {
          "id": 1,
          "necessidade": "Intolerância Severa a Lactose"
        }
      ],
      "presente_hoje": true
    }
  ]
  ```

#### `POST /api/contagem-nes`
* **Descrição:** Marca a presença de um aluno específico de dieta no dia corrente.
* **Payload:**
  ```json
  {
    "alunos_has_necessidades_id": 14
  }
  ```

---

### 2.4. Módulo de Refeições Avulsas (`/api/autorizados`)

#### `GET /api/autorizados`
* **Descrição:** Lista pessoas externas ou colaboradores autorizados a almoçar na escola no dia.
* **Resposta:**
  ```json
  [
    {
      "id": 7,
      "titulo": "Prefeito Municipal e Assessor",
      "conteudo": "Almoço institucional para 2 pessoas",
      "status": "confirmado",
      "created_at": "2025-12-05 16:24:50"
    }
  ]
  ```

#### `PATCH /api/autorizados/{id}/status`
* **Descrição:** Atualiza o status de liberação da refeição (`pendente` $\to$ `confirmado`).
* **Permissão:** Exclusivo Nutricionista (`nivel_user: 2`).

---

### 2.5. Módulo de Produção, Consumo e Desperdício (`/api/producao-consumo`)

#### `POST /api/producao-consumo`
* **Descrição:** Grava as métricas de pesagem de alimentos preparados, pessoas atendidas e sobras.
* **Payload:**
  ```json
  {
    "nome_alimento": "Feijão Carioca Cozido",
    "data_alimento": "2025-11-28",
    "quantidade_alimento": 28.50,
    "medida_alimento": "kg",
    "pessoas_alimento": 315,
    "sobra_limpa_alimento": 3.20,
    "desperdicio_alimento": 1.10
  }
  ```

---

### 2.6. Módulo de Chat Interno (`/api/chat`)

#### `GET /api/chat/mensagens`
* **Descrição:** Retorna as últimas mensagens trocadas entre os operadores com ordenação cronológica.
* **Filtros opcionais:** `limit=50`, `since_id=120`.

#### `POST /api/chat/mensagens`
* **Descrição:** Envia nova mensagem no chat operacional.
* **Payload:**
  ```json
  {
    "mensagem_chat": "Turma do 7° Ano atrasou 10 minutos para subir à sala."
  }
  ```
* **Regra de Sanitização:** Tags HTML ou scripts são automaticamente removidos pelo middleware do backend antes da persistência.
