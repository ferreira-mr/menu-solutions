# Registro das verificações da auditoria

Data: 07/09/2026. Raiz: `C:\Projetos\contador-v2`. Commit: `cc86bac09e9addc5f92c4d8b5925ee95f91c9c40`.

Este registro descreve a execução histórica antes das correções. **Não executar de novo a suíte antiga de backend/E2E sem o isolamento descrito em T00.** Não houve implementação das correções nem geração de suíte permanente nesta auditoria.

| Verificação executada | Resultado observado | Evidência |
| --- | --- | --- |
| `php artisan test` | 59 testes, 266 asserções, aprovados | `backend-saida-final.txt`, trecho final da saída original |
| `npm run test:front` com reporter JSON | 116 testes aprovados; 32 arquivos | `vitest.json` |
| `npm run lint` | Exit code 0 | Saída da execução; nenhum erro reportado |
| `npm run build` | Exit code 0; Vite 7.3.6 | `build.txt`; bundle principal 1.303,73 kB, gzip 378,28 kB; aviso de chunk >500 kB |
| Playwright Chromium, um worker e servidor isolado | 26 execuções aprovadas: 4 setup e 22 cenários | `playwright.json` |
| `php -l` nos fontes PHP selecionados | 138 arquivos sem erro | `sintaxe.txt` |
| `composer validate --no-check-publish` | Manifesto válido | Saída da execução |
| `composer audit --locked` | Sem avisos/abandonados retornados | `composer-audit.json` |
| `npm audit --json` | 3 pacotes sinalizados como críticos, incluindo efeito transitivo | `npm-audit.json`; saída não zero é resultado da auditoria, não erro de execução |
| `npm ls jspdf html2pdf.js jspdf-autotable` | jsPDF 3.0.4, html2pdf.js 0.12.1, autotable 5.0.8 | `dependencias-pdf.json` |
| Consulta ao registry npm | jsPDF 4.2.1; html2pdf.js 0.14.0; autotable 5.0.8 aceita jsPDF major 4 | Consulta na data da auditoria; revalidar ao implementar |
| Diagnóstico HTTP pelo kernel Laravel | Vários defeitos reproduzidos | `reproduzir.php` e `reproducao.json` |
| Diagnóstico Playwright com ações reais | Contagem zero/gravação no cancelamento/chat parado/XSS reproduzidos | `reproduzir-browser.mjs` e `browser.json` |

`numTotalTestSuites` do JSON Vitest inclui agrupamentos internos; para número de arquivos, usar a quantidade de `testResults`. A contagem de 26 do Playwright inclui as preparações, não 26 fluxos completos de negócio.

## Isolamento e limites

O diagnóstico PHP força SQLite `:memory:`, ambiente de teste, storage público próprio em `arquivos-diagnostico` e recusa cache de configuração. Ele redefine o ambiente em um caso específico para demonstrar o bypass local. O ensaio do seeder usa a configuração de produção sobre esse mesmo banco em memória; não representa provisionamento real em produção.

O diagnóstico de navegador e a baseline E2E usaram `127.0.0.1:8017` com SQLite, public/build, uploads e views próprios em `test-results/audit-runtime`. O servidor temporário foi criado apenas para esta auditoria. O script do navegador assume fixtures E2E e altera apenas dados sintéticos desse servidor; não o apontar para outro ambiente. Ele não é o runner seguro definitivo pedido em T00.

A baseline inicial de PHPUnit foi executada antes de identificar a limpeza de `public/uploads/pdf` em `CardapioAndStorageTest`. Não havia inventário anterior dos arquivos dessa pasta, portanto não é possível certificar seu conteúdo anterior ou afirmar que arquivos ignorados pelo Git foram preservados. A árvore de fontes versionados permaneceu sem alterações da aplicação; isso não prova preservação de dados ignorados.

MySQL não foi executado por ausência de `pdo_mysql`. Terraform não pôde ser iniciado por restrição local de acesso. Não houve instalação de VM, deploy, `apply`, destruição, mudança de rede ou teste dinâmico de Nginx. Os achados de implantação são conclusões da leitura dos scripts, com cenários de validação futura em I01–I06.

## Fontes externas primárias consultadas

- [Aviso jsPDF: HTML injection, corrigido em 4.2.1](https://github.com/parallax/jsPDF/security/advisories/GHSA-wfv2-pwc8-crg5).
- [Aviso jsPDF: acesso a arquivo local/path traversal](https://github.com/parallax/jsPDF/security/advisories/GHSA-f8cm-6447-x5h2), aplicabilidade diferente entre Node e navegador.
- [Aviso html2pdf.js: XSS, corrigido em 0.14.0](https://github.com/eKoopmans/html2pdf.js/security/advisories/GHSA-w8x4-x68c-m6fc).
- [Laravel: validação](https://laravel.com/docs/12.x/validation) e [migrações](https://laravel.com/docs/12.x/migrations).
- [MySQL: tipos de ponto fixo e precisão/escala](https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html).

As versões e avisos são um retrato da consulta, não garantia de atualização futura. A existência de dependência vulnerável não demonstra que todos os vetores sejam alcançáveis na aplicação; o relatório distingue essa limitação dos defeitos reproduzidos.
