# Oficina de Código

Curso interativo de **JavaScript e TypeScript** do zero ao profissional: 56 lições com explicações em português,
exercícios corrigidos por testes automáticos e desafios de lógica. É um site estático, um único arquivo HTML, sem back-end.

- **JavaScript** (27 lições): fundamentos, fluxo, coleções, funções avançadas, resolução de problemas, classes, assíncrono, nível profissional, novidades do ES2026.
- **TypeScript** (16 lições): tipos básicos, modelagem, genéricos, utility types, tipos avançados, mini-projeto.
- **Desafios de lógica** (13 lições): do FizzBuzz ao nível sênior, com dificuldade de ★ a ★★★★★.

## Usar

```bash
npm install
npm run build      # gera dist/index.html
npm run serve      # abre em http://localhost:8080
```

Também dá para abrir `dist/index.html` direto no navegador (duplo clique).

Requisitos: Node 20 ou mais novo, só para gerar o site. Para usar, basta um navegador atual (Chrome, Edge, Firefox, Safari 16.4+).

O primeiro acesso a uma lição de TypeScript baixa o compilador (cerca de 9 MB) do jsDelivr; depois fica em cache do navegador.
As fontes vêm do Google Fonts. Sem internet o site abre com fontes padrão e as lições de TypeScript não verificam.

O progresso e o código de cada lição ficam no `localStorage` do navegador. Há backup/restauração por texto na tela inicial.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` roda a verificação, gera o site e publica a cada push na `main`.
Em **Settings → Pages**, escolha **Source: GitHub Actions**.

> GitHub Pages a partir de repositório **privado** exige plano pago (Pro, Team ou Enterprise). Em plano gratuito,
> use o site localmente (`npm run serve`) ou torne o repositório público.

## Estrutura

```
curriculum/   as lições, em arquivos de texto (edite aqui)
src/app.html  a interface (HTML, CSS e JS do site)
src/runner.js executor dos testes (roda num Web Worker)
src/tscheck.js verificação de tipos e transpilação do TypeScript
src/parse.mjs leitor dos arquivos de currículo
src/build.mjs gera dist/index.html
src/verify.mjs confere todas as lições (npm run verify)
tests/        servidor local e teste ponta a ponta no navegador
```

## Formato das lições

Cada arquivo `curriculum/*.txt` tem módulos e lições, com marcadores iniciados por `@@`:

```
@@module id-do-modulo | js | Título do módulo | Descrição curta     (trilha: js, ts ou desafios)

@@lesson id-da-licao | Título | 20 | 3                              (minutos | nível ★, só nos desafios)
@@body        explicação em markdown; blocos ```js run são exemplos editáveis e executáveis
@@task        enunciado do exercício
@@starter     código inicial do aluno
@@tests       testes: $t('nome', () => $eq(f(1), 2));  (também $ok, $lanca, $perto, $congelar, $esperar, $logs)
@@types       só no TS: "## nome do teste" seguido de código; use __Equal<A,B> e // @ts-expect-error
@@hints       dicas em ordem, uma por linha começando com "- "
@@solution    solução de referência
```

Uma lição sem `@@starter`, `@@tests` e `@@solution` é de leitura (tem o botão "Marcar como lida").
O `id` usa só letras minúsculas, números e hífen.

Depois de editar ou criar lições, rode `npm run verify`: ele executa a solução de referência de cada lição contra os
testes (precisa passar) e o código inicial (precisa falhar, para o exercício exigir algo).

## Professor Claude

Quando a página é aberta dentro do Claude (como artefato), cada lição ganha revisão de código, explicações alternativas
e perguntas ao vivo (a capacidade `sample`). Fora do Claude esses botões somem e fica "Copiar enunciado e código",
para colar numa conversa com o Claude.
