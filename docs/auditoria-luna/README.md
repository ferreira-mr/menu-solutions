# Auditoria do Contador V2 e passagem para o Luna

Data: **07/09/2026**. Projeto confirmado pelo solicitante: **`C:\Projetos\contador-v2`**.
Commit analisado: `cc86bac09e9addc5f92c4d8b5925ee95f91c9c40`. A árvore de código estava limpa no início.

## Parecer

**O projeto ainda tem falhas relevantes de segurança, funcionamento e implantação. Não deve ser considerado validado apenas porque os testes existentes passam.**

Foram catalogados **23 achados**, com evidências, prioridades e ações, organizados em **25 tarefas e 76 cenários de teste especificados para o Luna**. Os casos mais importantes incluem autenticação com senhas fixas em ambiente local, cadastro público com acesso a dados escolares, execução de JavaScript a partir do nome de um usuário, contagens que aparecem zeradas e gravação de contagem ao fechar um formulário sem salvar. O processo de implantação também pode substituir dados persistentes e remover a VM ao alterar parâmetros.

Esta entrega prepara a implementação. **Não foram aplicadas correções ao código da aplicação nem criada a suíte definitiva de regressão.** Os scripts em `evidencias/` são diagnósticos reproduzíveis; o Luna deve transformar os cenários em testes permanentes com as expectativas corrigidas.

## Ordem de leitura

1. [Achados, evidências e correções](01-ACHADOS.md).
2. [Plano de ação em tarefas pequenas](02-PLANO-LUNA.md).
3. [Especificação dos testes e critérios de aceite](03-TESTES.md).
4. [Contratos e decisões de negócio](04-CONTRATOS-E-DECISOES.md).
5. [Prompt pronto para iniciar o Luna](05-PROMPT-LUNA.md).

O Luna deve começar por **T00**, executar uma tarefa de cada vez e registrar o resultado em [CONTROLE-DE-EXECUCAO.md](CONTROLE-DE-EXECUCAO.md).

## O que foi verificado

| Verificação | Resultado observado |
| --- | --- |
| Backend, `php artisan test` | **59 testes passaram; 266 asserções** |
| Frontend, Vitest | **116 testes passaram**, em 32 arquivos |
| ESLint, `npm run lint` | Passou |
| Compilação Vite, `npm run build` | Passou; pacote principal de JavaScript com aproximadamente **1,30 MB** antes de gzip |
| Playwright / Chromium | **26 execuções passaram**, sendo 4 preparações de sessão e 22 cenários |
| Sintaxe PHP | **138 arquivos**, sem erros de sintaxe |
| Validação Composer | `composer.json` válido |
| Auditoria das dependências PHP | Nenhum aviso de segurança retornado para o lock consultado |
| Auditoria npm | **3 pacotes sinalizados como críticos**, incluindo propagação da gravidade por dependência |
| Diagnósticos adicionais via HTTP e navegador | Reproduziram falhas não capturadas pelas suítes acima |

Ambiente: Windows, PHP 8.4.25, Laravel 12.69.1, Sanctum 4.3.3, Vite 7.3.6. A identificação de Laravel 11 no README/AGENTS está desatualizada em relação ao código instalado.

## Evidências

- [Resultados dos diagnósticos da API](evidencias/reproducao.json).
- [Resultados no navegador real](evidencias/browser.json): total zero, gravação sem salvar, chat e execução de JavaScript.
- [Vitest](evidencias/vitest.json), [Playwright](evidencias/playwright.json), [sintaxe](evidencias/sintaxe.txt).
- [Trecho final da saída do backend](evidencias/backend-saida-final.txt) e [compilação](evidencias/build.txt).
- [Auditoria npm](evidencias/npm-audit.json), [auditoria Composer](evidencias/composer-audit.json), [árvore das bibliotecas PDF](evidencias/dependencias-pdf.json).
- [Diagnóstico PHP](evidencias/reproduzir.php) e [diagnóstico de navegador](evidencias/reproduzir-browser.mjs).
- [Registro das verificações, isolamento e fontes consultadas](evidencias/VERIFICACOES.md).

Os registros dos diagnósticos são sintéticos. Não são dados reais de estudantes. Os diagnósticos PHP usam SQLite `:memory:`. O navegador usou um servidor temporário em `127.0.0.1:8017`, um SQLite separado e uploads separados em `test-results/audit-runtime/`.

## Limites da conclusão

- A implantação foi revisada pelo código; **não foi executado `up`, `terraform apply`, destruição de VM ou provisionamento de escola**. O executável Terraform local não pôde ser iniciado por restrição de acesso; não há validação dinâmica de Terraform/Nginx neste parecer.
- Não houve execução em MySQL: o PHP disponível não possui `pdo_mysql`. Os limites de tipos e migrações precisam de validação adicional no motor escolhido para produção.
- Os testes iniciais de backend foram executados antes da identificação do `cleanDirectory` em `CardapioAndStorageTest`. Essa suíte limpa a pasta compartilhada `public/uploads/pdf`; não havia inventário anterior para certificar seu conteúdo. A falha de isolamento está registrada em A20. Os diagnósticos posteriores e o navegador usaram armazenamento separado.
- Os testes verdes não medem a cobertura de todos os fluxos: parte dos testes de frontend usa respostas simuladas diferentes da API, e muitos E2E verificam títulos/URLs sem concluir uma operação.
- As regras de negócio existentes se contradizem em alguns pontos. As decisões e a orientação para o Luna estão explícitas no documento 04.
- A análise inicial da API separada não integra este parecer. Somente achados validados no projeto integrado foram incorporados. Arquivos preliminares permaneceram em `cont_api_v2/docs/auditoria-2026-09-07/` após bloqueio automático da limpeza; não devem orientar a implementação deste projeto.

## Critério de entrega das correções

Cada achado resolvido precisa de teste que falhava pelo motivo correto antes da correção, resultado esperado depois e comprovação de que o fluxo continua funcionando após recarregar a página ou fazer nova requisição. As suítes existentes devem permanecer verdes, exceto expectativas que formalizavam um erro e forem substituídas com justificativa explícita. Nenhuma quantidade de testes, isoladamente, garante ausência de novas falhas.
