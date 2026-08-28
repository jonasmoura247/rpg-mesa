# Criador de Ficha (`/creator`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a página standalone `docs/creator/index.html`, hospedável via GitHub Pages, onde os 3 jogadores montam a ficha de nível 1 (Point Buy, raça, classe, perícias do SRD 5e básico) e exportam um `character.json` para o mestre importar depois.

**Architecture:** Página HTML/CSS/JS puro (zero build step, zero dependência de backend), fluxo em 4 etapas dentro de uma única página (Atributos → Raça → Classe → Resumo/Exportar), estado em memória num objeto JS. Dados do SRD (raças, classes, perícias, custo de Point Buy) e as funções de cálculo (modificador, PV, CA, bônus de perícia) ficam em arquivos JS separados e puros — sem tocar no DOM — para serem testáveis via Node, sem exigir framework de teste.

**Tech Stack:** HTML5, CSS3 (variáveis CSS, mobile-first), JavaScript vanilla (ES2017+), Node.js só como executor dos testes das funções puras (`node js/arquivo.test.js`, usando o módulo `assert` embutido — sem `npm install`, sem `package.json`). Hospedagem: GitHub Pages a partir da pasta `docs/` do repositório `rpg-mesa` (remote já configurado e com push feito nesta sessão).

Esta é a primeira parte do spec `2026-08-28-ficha-personagem-criador-jogadores-design.md`. A importação no painel principal (`POST /api/personagens/importar`) e a aba "Jogadores" ficam para um plano seguinte.

---

## Convenções desta implementação

- Nomes de variáveis/funções em português, como no resto do projeto.
- Nenhum arquivo deste plano depende de build step: tudo roda abrindo `index.html` direto no navegador (ou via GitHub Pages).
- `calculo.js` e `dados.js` exportam via um padrão compatível com browser (`window.Calculo`, `window.DADOS`) e com Node (`module.exports`), para permitir os testes de linha de comando sem duplicar arquivos.

## File Structure

```
docs/creator/
  index.html          — esqueleto da página + as 4 etapas (progressivamente preenchido)
  css/estilo.css       — tema escuro "grimório moderno"
  js/dados.js           — perícias, tabela de Point Buy, raças, classes (dados puros do SRD)
  js/dados.test.js      — testes de integridade dos dados (Node)
  js/calculo.js         — funções puras de cálculo (modificador, PV, CA, bônus de perícia)
  js/calculo.test.js    — testes das funções de cálculo (Node)
  js/app.js             — estado da ficha, navegação entre etapas, renderização, exportação do JSON
```

---

### Task 1: Estrutura do projeto e esqueleto HTML

**Files:**
- Create: `docs/creator/index.html`
- Create: `docs/creator/css/estilo.css`
- Create: `docs/creator/js/app.js`

- [ ] **Step 1: Criar o esqueleto HTML**

`docs/creator/index.html`:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Criador de Ficha — Costa da Travessia</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/estilo.css">
</head>
<body>
  <header class="cabecalho">
    <h1>Criador de Ficha</h1>
    <p class="subtitulo">Costa da Travessia — Personagem de Nível 1</p>
  </header>

  <main class="container">
    <ol class="progresso" id="progresso">
      <li data-etapa="0">Atributos</li>
      <li data-etapa="1">Raça</li>
      <li data-etapa="2">Classe</li>
      <li data-etapa="3">Resumo</li>
    </ol>

    <section id="conteudo" class="conteudo"></section>

    <p id="mensagemErro" class="mensagem-erro" hidden></p>

    <nav class="navegacao">
      <button id="btnVoltar" type="button" class="botao botao-secundario">Voltar</button>
      <button id="btnAvancar" type="button" class="botao botao-primario">Avançar</button>
    </nav>
  </main>

  <script src="js/dados.js"></script>
  <script src="js/calculo.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar CSS mínimo temporário (será substituído na Task 14)**

`docs/creator/css/estilo.css`:
```css
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #14100c;
  color: #ece4d3;
}
```

- [ ] **Step 3: Criar `app.js` vazio (placeholder para não quebrar o carregamento)**

`docs/creator/js/app.js`:
```js
// Preenchido nas próximas tasks.
```

- [ ] **Step 4: Verificar manualmente**

Abra `docs/creator/index.html` direto no navegador (duplo clique ou `file://` no endereço). Confirme que a página carrega sem erro no console (F12 → Console) e mostra o cabeçalho "Criador de Ficha".

- [ ] **Step 5: Commit**

```bash
git add docs/creator/index.html docs/creator/css/estilo.css docs/creator/js/app.js
git commit -m "feat(creator): esqueleto da página do criador de ficha"
```

---

### Task 2: Dados SRD — perícias e tabela de Point Buy

**Files:**
- Create: `docs/creator/js/dados.js`
- Create: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Escrever o teste (falhando)**

`docs/creator/js/dados.test.js`:
```js
const assert = require('assert');
const DADOS = require('./dados.js');

assert.strictEqual(DADOS.PERICIAS.length, 18, 'devem existir 18 perícias do 5e');
assert.deepStrictEqual(
  DADOS.PERICIAS.find(p => p.nome === 'Furtividade'),
  { nome: 'Furtividade', atributo: 'destreza' }
);
assert.deepStrictEqual(
  DADOS.PERICIAS.find(p => p.nome === 'Atletismo'),
  { nome: 'Atletismo', atributo: 'forca' }
);

assert.strictEqual(DADOS.CUSTO_POINT_BUY[8], 0);
assert.strictEqual(DADOS.CUSTO_POINT_BUY[13], 5);
assert.strictEqual(DADOS.CUSTO_POINT_BUY[15], 9);
assert.strictEqual(DADOS.ORCAMENTO_PONTOS, 27);
assert.strictEqual(DADOS.ATRIBUTO_MINIMO, 8);
assert.strictEqual(DADOS.ATRIBUTO_MAXIMO, 15);

console.log('dados.test.js (perícias/point buy): OK');
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: erro `Cannot find module './dados.js'`

- [ ] **Step 3: Criar `dados.js` com perícias e Point Buy**

`docs/creator/js/dados.js`:
```js
(function (raiz) {
  const PERICIAS = [
    { nome: 'Atletismo', atributo: 'forca' },
    { nome: 'Acrobacia', atributo: 'destreza' },
    { nome: 'Furtividade', atributo: 'destreza' },
    { nome: 'Prestidigitacao', atributo: 'destreza' },
    { nome: 'Arcanismo', atributo: 'inteligencia' },
    { nome: 'Historia', atributo: 'inteligencia' },
    { nome: 'Investigacao', atributo: 'inteligencia' },
    { nome: 'Natureza', atributo: 'inteligencia' },
    { nome: 'Religiao', atributo: 'inteligencia' },
    { nome: 'Adestramento', atributo: 'sabedoria' },
    { nome: 'Intuicao', atributo: 'sabedoria' },
    { nome: 'Medicina', atributo: 'sabedoria' },
    { nome: 'Percepcao', atributo: 'sabedoria' },
    { nome: 'Sobrevivencia', atributo: 'sabedoria' },
    { nome: 'Atuacao', atributo: 'carisma' },
    { nome: 'Engano', atributo: 'carisma' },
    { nome: 'Intimidacao', atributo: 'carisma' },
    { nome: 'Persuasao', atributo: 'carisma' }
  ];

  const CUSTO_POINT_BUY = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const ORCAMENTO_PONTOS = 27;
  const ATRIBUTO_MINIMO = 8;
  const ATRIBUTO_MAXIMO = 15;

  const api = { PERICIAS, CUSTO_POINT_BUY, ORCAMENTO_PONTOS, ATRIBUTO_MINIMO, ATRIBUTO_MAXIMO };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.DADOS = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(creator): dados de perícias e tabela de Point Buy do SRD 5e"
```

---

### Task 3: Dados SRD — raças

**Files:**
- Modify: `docs/creator/js/dados.js`
- Modify: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Adicionar teste de raças (falhando)**

Adicione ao final de `docs/creator/js/dados.test.js`, antes do `console.log`:
```js
assert.strictEqual(DADOS.RACAS.length, 14, 'devem existir 14 opções de raça (9 raças + subraças)');
assert.deepStrictEqual(
  DADOS.RACAS.find(r => r.nome === 'Humano').bonus,
  { forca: 1, destreza: 1, constituicao: 1, inteligencia: 1, sabedoria: 1, carisma: 1 }
);
assert.deepStrictEqual(
  DADOS.RACAS.find(r => r.nome === 'Anão da Montanha').bonus,
  { constituicao: 2, forca: 2 }
);
const meioElfo = DADOS.RACAS.find(r => r.nome === 'Meio-Elfo');
assert.deepStrictEqual(meioElfo.bonus, { carisma: 2 });
assert.strictEqual(meioElfo.escolhaLivre, 2);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: `TypeError: Cannot read properties of undefined (reading 'length')` (RACAS ainda não existe)

- [ ] **Step 3: Adicionar `RACAS` em `dados.js`**

Em `docs/creator/js/dados.js`, dentro da IIFE, antes da linha `const api = ...`, adicione:
```js
  const RACAS = [
    { nome: 'Humano', bonus: { forca: 1, destreza: 1, constituicao: 1, inteligencia: 1, sabedoria: 1, carisma: 1 } },
    { nome: 'Anão da Colina', bonus: { constituicao: 2, sabedoria: 1 } },
    { nome: 'Anão da Montanha', bonus: { constituicao: 2, forca: 2 } },
    { nome: 'Elfo Alto', bonus: { destreza: 2, inteligencia: 1 } },
    { nome: 'Elfo da Floresta', bonus: { destreza: 2, sabedoria: 1 } },
    { nome: 'Elfo Negro (Drow)', bonus: { destreza: 2, carisma: 1 } },
    { nome: 'Halfling Pés Leves', bonus: { destreza: 2, carisma: 1 } },
    { nome: 'Halfling Robusto', bonus: { destreza: 2, constituicao: 1 } },
    { nome: 'Draconato', bonus: { forca: 2, carisma: 1 } },
    { nome: 'Gnomo da Floresta', bonus: { inteligencia: 2, destreza: 1 } },
    { nome: 'Gnomo das Rochas', bonus: { inteligencia: 2, constituicao: 1 } },
    { nome: 'Meio-Elfo', bonus: { carisma: 2 }, escolhaLivre: 2 },
    { nome: 'Meio-Orc', bonus: { forca: 2, constituicao: 1 } },
    { nome: 'Tiefling', bonus: { carisma: 2, inteligencia: 1 } }
  ];
```

E adicione `RACAS` ao objeto `api`:
```js
  const api = { PERICIAS, CUSTO_POINT_BUY, ORCAMENTO_PONTOS, ATRIBUTO_MINIMO, ATRIBUTO_MAXIMO, RACAS };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(creator): dados de raças do SRD 5e básico"
```

---

### Task 4: Dados SRD — classes

**Files:**
- Modify: `docs/creator/js/dados.js`
- Modify: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Adicionar teste de classes (falhando)**

Adicione ao final de `docs/creator/js/dados.test.js`, antes do `console.log`:
```js
assert.strictEqual(DADOS.CLASSES.length, 12, 'devem existir as 12 classes do 5e');
const guerreiro = DADOS.CLASSES.find(c => c.nome === 'Guerreiro');
assert.strictEqual(guerreiro.dadoDeVida, 10);
assert.strictEqual(guerreiro.escolhas, 2);
assert.ok(guerreiro.periciasElegiveis.includes('Atletismo'));

const ladino = DADOS.CLASSES.find(c => c.nome === 'Ladino');
assert.strictEqual(ladino.escolhas, 4);

const bardo = DADOS.CLASSES.find(c => c.nome === 'Bardo');
assert.strictEqual(bardo.todasPericias, true);
assert.strictEqual(bardo.escolhas, 3);

const barbaro = DADOS.CLASSES.find(c => c.nome === 'Bárbaro');
assert.strictEqual(barbaro.dadoDeVida, 12);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: `TypeError: Cannot read properties of undefined (reading 'length')` (CLASSES ainda não existe)

- [ ] **Step 3: Adicionar `CLASSES` em `dados.js`**

Em `docs/creator/js/dados.js`, dentro da IIFE, logo após o array `RACAS`, adicione:
```js
  const CLASSES = [
    { nome: 'Bárbaro', dadoDeVida: 12, escolhas: 2,
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intimidacao', 'Natureza', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Bardo', dadoDeVida: 8, escolhas: 3, todasPericias: true, periciasElegiveis: [] },
    { nome: 'Bruxo', dadoDeVida: 8, escolhas: 2,
      periciasElegiveis: ['Arcanismo', 'Engano', 'Historia', 'Intimidacao', 'Investigacao', 'Natureza', 'Religiao'] },
    { nome: 'Clérigo', dadoDeVida: 8, escolhas: 2,
      periciasElegiveis: ['Historia', 'Intuicao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Druida', dadoDeVida: 8, escolhas: 2,
      periciasElegiveis: ['Arcanismo', 'Adestramento', 'Intuicao', 'Medicina', 'Natureza', 'Percepcao', 'Religiao', 'Sobrevivencia'] },
    { nome: 'Feiticeiro', dadoDeVida: 6, escolhas: 2,
      periciasElegiveis: ['Arcanismo', 'Engano', 'Intuicao', 'Intimidacao', 'Persuasao', 'Religiao'] },
    { nome: 'Guerreiro', dadoDeVida: 10, escolhas: 2,
      periciasElegiveis: ['Acrobacia', 'Adestramento', 'Atletismo', 'Historia', 'Intuicao', 'Intimidacao', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Ladino', dadoDeVida: 8, escolhas: 4,
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Engano', 'Intuicao', 'Intimidacao', 'Investigacao', 'Percepcao', 'Persuasao', 'Prestidigitacao', 'Furtividade'] },
    { nome: 'Magista', dadoDeVida: 6, escolhas: 2,
      periciasElegiveis: ['Arcanismo', 'Historia', 'Intuicao', 'Investigacao', 'Medicina', 'Religiao'] },
    { nome: 'Monge', dadoDeVida: 8, escolhas: 2,
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Historia', 'Intuicao', 'Religiao', 'Furtividade'] },
    { nome: 'Paladino', dadoDeVida: 10, escolhas: 2,
      periciasElegiveis: ['Atletismo', 'Intuicao', 'Intimidacao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Patrulheiro', dadoDeVida: 8, escolhas: 3,
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intuicao', 'Investigacao', 'Natureza', 'Percepcao', 'Furtividade', 'Sobrevivencia'] }
  ];
```

E atualize o objeto `api`:
```js
  const api = { PERICIAS, CUSTO_POINT_BUY, ORCAMENTO_PONTOS, ATRIBUTO_MINIMO, ATRIBUTO_MAXIMO, RACAS, CLASSES };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(creator): dados de classes do SRD 5e básico"
```

---

### Task 5: `calculo.js` — modificador de atributo

**Files:**
- Create: `docs/creator/js/calculo.js`
- Create: `docs/creator/js/calculo.test.js`

- [ ] **Step 1: Escrever o teste (falhando)**

`docs/creator/js/calculo.test.js`:
```js
const assert = require('assert');
const Calculo = require('./calculo.js');

assert.strictEqual(Calculo.modificador(10), 0);
assert.strictEqual(Calculo.modificador(11), 0);
assert.strictEqual(Calculo.modificador(15), 2);
assert.strictEqual(Calculo.modificador(8), -1);
assert.strictEqual(Calculo.modificador(20), 5);

console.log('calculo.test.js: OK');
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/calculo.test.js`
Expected: erro `Cannot find module './calculo.js'`

- [ ] **Step 3: Criar `calculo.js` com `modificador`**

`docs/creator/js/calculo.js`:
```js
(function (raiz) {
  function modificador(valorAtributo) {
    return Math.floor((valorAtributo - 10) / 2);
  }

  const api = { modificador };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.Calculo = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/calculo.test.js`
Expected: `calculo.test.js: OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/calculo.js docs/creator/js/calculo.test.js
git commit -m "feat(creator): calculo de modificador de atributo"
```

---

### Task 6: `calculo.js` — custo e pontos restantes do Point Buy

**Files:**
- Modify: `docs/creator/js/calculo.js`
- Modify: `docs/creator/js/calculo.test.js`

- [ ] **Step 1: Adicionar teste (falhando)**

Adicione a `docs/creator/js/calculo.test.js`, antes do `console.log`:
```js
const tabelaCusto = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

assert.strictEqual(
  Calculo.custoTotalPointBuy({ forca: 15, destreza: 14, constituicao: 13, inteligencia: 12, sabedoria: 10, carisma: 8 }, tabelaCusto),
  27
);
assert.strictEqual(
  Calculo.custoTotalPointBuy({ forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 }, tabelaCusto),
  0
);

assert.strictEqual(
  Calculo.pontosRestantes({ forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 }, tabelaCusto, 27),
  27
);
assert.strictEqual(
  Calculo.pontosRestantes({ forca: 15, destreza: 14, constituicao: 13, inteligencia: 12, sabedoria: 10, carisma: 8 }, tabelaCusto, 27),
  0
);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/calculo.test.js`
Expected: `TypeError: Calculo.custoTotalPointBuy is not a function`

- [ ] **Step 3: Implementar `custoTotalPointBuy` e `pontosRestantes`**

Em `docs/creator/js/calculo.js`, adicione dentro da IIFE, após `modificador`:
```js
  function custoTotalPointBuy(atributos, tabelaCusto) {
    return Object.values(atributos).reduce((soma, valor) => soma + tabelaCusto[valor], 0);
  }

  function pontosRestantes(atributos, tabelaCusto, orcamento) {
    return orcamento - custoTotalPointBuy(atributos, tabelaCusto);
  }
```

E atualize `api`:
```js
  const api = { modificador, custoTotalPointBuy, pontosRestantes };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/calculo.test.js`
Expected: `calculo.test.js: OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/calculo.js docs/creator/js/calculo.test.js
git commit -m "feat(creator): calculo de custo e pontos restantes do Point Buy"
```

---

### Task 7: `calculo.js` — PV inicial e CA base

**Files:**
- Modify: `docs/creator/js/calculo.js`
- Modify: `docs/creator/js/calculo.test.js`

- [ ] **Step 1: Adicionar teste (falhando)**

Adicione a `docs/creator/js/calculo.test.js`, antes do `console.log`:
```js
assert.strictEqual(Calculo.pvInicial(10, 2), 12);
assert.strictEqual(Calculo.pvInicial(6, -1), 5);
assert.strictEqual(Calculo.caBase(3), 13);
assert.strictEqual(Calculo.caBase(-1), 9);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/calculo.test.js`
Expected: `TypeError: Calculo.pvInicial is not a function`

- [ ] **Step 3: Implementar `pvInicial` e `caBase`**

Em `docs/creator/js/calculo.js`, adicione dentro da IIFE, após `pontosRestantes`:
```js
  function pvInicial(dadoDeVida, modConstituicao) {
    return dadoDeVida + modConstituicao;
  }

  function caBase(modDestreza) {
    return 10 + modDestreza;
  }
```

E atualize `api`:
```js
  const api = { modificador, custoTotalPointBuy, pontosRestantes, pvInicial, caBase };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/calculo.test.js`
Expected: `calculo.test.js: OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/calculo.js docs/creator/js/calculo.test.js
git commit -m "feat(creator): calculo de PV inicial e CA base"
```

---

### Task 8: `calculo.js` — bônus de perícia

**Files:**
- Modify: `docs/creator/js/calculo.js`
- Modify: `docs/creator/js/calculo.test.js`

- [ ] **Step 1: Adicionar teste (falhando)**

Adicione a `docs/creator/js/calculo.test.js`, antes do `console.log`:
```js
assert.strictEqual(Calculo.bonusPericia(3, true, 2), 5);
assert.strictEqual(Calculo.bonusPericia(3, false, 2), 3);
assert.strictEqual(Calculo.bonusPericia(-1, true, 2), 1);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/calculo.test.js`
Expected: `TypeError: Calculo.bonusPericia is not a function`

- [ ] **Step 3: Implementar `bonusPericia`**

Em `docs/creator/js/calculo.js`, adicione dentro da IIFE, após `caBase`:
```js
  function bonusPericia(modAtributo, proficiente, bonusProficiencia) {
    return proficiente ? modAtributo + bonusProficiencia : modAtributo;
  }
```

E atualize `api`:
```js
  const api = { modificador, custoTotalPointBuy, pontosRestantes, pvInicial, caBase, bonusPericia };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/calculo.test.js`
Expected: `calculo.test.js: OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/calculo.js docs/creator/js/calculo.test.js
git commit -m "feat(creator): calculo de bonus final de pericia"
```

---

### Task 9: Motor de estado e navegação entre etapas

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Substituir o conteúdo de `app.js` pelo esqueleto de navegação**

`docs/creator/js/app.js` (substitui o placeholder da Task 1):
```js
const ficha = {
  nome: '',
  raca: null,
  bonusEscolhidoMeioElfo: [],
  classe: null,
  atributosBase: { forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 },
  periciasEscolhidas: []
};

let etapaAtual = 0;

const elementoConteudo = document.getElementById('conteudo');
const elementoErro = document.getElementById('mensagemErro');
const botaoVoltar = document.getElementById('btnVoltar');
const botaoAvancar = document.getElementById('btnAvancar');
const itensProgresso = document.querySelectorAll('#progresso li');

function mostrarErro(mensagem) {
  elementoErro.textContent = mensagem;
  elementoErro.hidden = false;
}

function limparErro() {
  elementoErro.hidden = true;
  elementoErro.textContent = '';
}

function atualizarProgresso() {
  itensProgresso.forEach(item => {
    const etapaDoItem = Number(item.dataset.etapa);
    item.classList.toggle('ativo', etapaDoItem === etapaAtual);
    item.classList.toggle('concluido', etapaDoItem < etapaAtual);
  });
}

function podeAvancar() {
  return true; // sobrescrito nas próximas tasks, uma etapa por vez
}

function renderEtapaAtual() {
  limparErro();
  if (etapaAtual === 0) elementoConteudo.innerHTML = '<p>Etapa de Atributos (em construção)</p>';
  if (etapaAtual === 1) elementoConteudo.innerHTML = '<p>Etapa de Raça (em construção)</p>';
  if (etapaAtual === 2) elementoConteudo.innerHTML = '<p>Etapa de Classe (em construção)</p>';
  if (etapaAtual === 3) elementoConteudo.innerHTML = '<p>Etapa de Resumo (em construção)</p>';

  botaoVoltar.disabled = etapaAtual === 0;
  botaoAvancar.textContent = etapaAtual === 3 ? 'Baixar minha ficha' : 'Avançar';
  atualizarProgresso();
}

botaoVoltar.addEventListener('click', () => {
  if (etapaAtual > 0) {
    etapaAtual -= 1;
    renderEtapaAtual();
  }
});

botaoAvancar.addEventListener('click', () => {
  if (!podeAvancar()) return;
  if (etapaAtual < 3) {
    etapaAtual += 1;
    renderEtapaAtual();
  }
});

renderEtapaAtual();
```

- [ ] **Step 2: Verificar manualmente**

Abra `docs/creator/index.html` no navegador. Clique em "Avançar" três vezes — o texto de "em construção" deve trocar a cada clique, o item ativo na lista de progresso deve mudar, e o botão deve virar "Baixar minha ficha" na última etapa. "Voltar" deve funcionar de volta até a etapa 0, onde fica desabilitado.

- [ ] **Step 3: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): motor de estado e navegacao entre etapas"
```

---

### Task 10: Etapa 1 — Atributos (Point Buy) e nome do personagem

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Substituir a etapa 0 do `renderEtapaAtual` e adicionar as funções de apoio**

Em `docs/creator/js/app.js`, substitua a linha:
```js
  if (etapaAtual === 0) elementoConteudo.innerHTML = '<p>Etapa de Atributos (em construção)</p>';
```
por:
```js
  if (etapaAtual === 0) renderEtapaAtributos();
```

E adicione, antes da função `renderEtapaAtual`, as funções da etapa de atributos:
```js
const NOMES_ATRIBUTOS = {
  forca: 'Força', destreza: 'Destreza', constituicao: 'Constituição',
  inteligencia: 'Inteligência', sabedoria: 'Sabedoria', carisma: 'Carisma'
};

function renderEtapaAtributos() {
  const pontosRestantes = Calculo.pontosRestantes(ficha.atributosBase, DADOS.CUSTO_POINT_BUY, DADOS.ORCAMENTO_PONTOS);

  const linhasAtributos = Object.keys(NOMES_ATRIBUTOS).map(chave => {
    const valor = ficha.atributosBase[chave];
    return `
      <div class="linha-atributo">
        <span class="nome-atributo">${NOMES_ATRIBUTOS[chave]}</span>
        <button type="button" class="botao-passo" data-atributo="${chave}" data-delta="-1" ${valor <= DADOS.ATRIBUTO_MINIMO ? 'disabled' : ''}>−</button>
        <span class="valor-atributo">${valor}</span>
        <button type="button" class="botao-passo" data-atributo="${chave}" data-delta="1" ${valor >= DADOS.ATRIBUTO_MAXIMO ? 'disabled' : ''}>+</button>
      </div>`;
  }).join('');

  elementoConteudo.innerHTML = `
    <label class="campo-nome">
      Nome do personagem
      <input type="text" id="campoNome" value="${ficha.nome}" placeholder="Ex: Kess Bramo">
    </label>
    <h2>Atributos — Point Buy</h2>
    <p class="pontos-restantes">Pontos restantes: <strong>${pontosRestantes}</strong></p>
    ${linhasAtributos}
  `;

  document.getElementById('campoNome').addEventListener('input', evento => {
    ficha.nome = evento.target.value;
  });

  document.querySelectorAll('.botao-passo').forEach(botao => {
    botao.addEventListener('click', () => {
      const atributo = botao.dataset.atributo;
      const delta = Number(botao.dataset.delta);
      const novoValor = ficha.atributosBase[atributo] + delta;
      if (novoValor < DADOS.ATRIBUTO_MINIMO || novoValor > DADOS.ATRIBUTO_MAXIMO) return;
      ficha.atributosBase[atributo] = novoValor;
      renderEtapaAtributos();
    });
  });
}
```

- [ ] **Step 2: Atualizar `podeAvancar` para validar a etapa 0**

Substitua a função `podeAvancar` por:
```js
function podeAvancar() {
  if (etapaAtual === 0) {
    if (!ficha.nome.trim()) {
      mostrarErro('Preencha o nome do personagem.');
      return false;
    }
    const restantes = Calculo.pontosRestantes(ficha.atributosBase, DADOS.CUSTO_POINT_BUY, DADOS.ORCAMENTO_PONTOS);
    if (restantes !== 0) {
      mostrarErro(`Distribua todos os pontos antes de continuar (faltam ${restantes} ponto(s)).`);
      return false;
    }
    return true;
  }
  return true; // demais etapas validadas nas próximas tasks
}
```

- [ ] **Step 3: Verificar manualmente**

Abra a página. Digite um nome. Use os botões +/- para chegar a 0 pontos restantes (ex: FOR 15, DES 14, CON 13, INT 12, SAB 10, CAR 8 = 27 pontos). Confirme que "Avançar" só funciona quando o nome está preenchido e os pontos restantes chegam a 0 — tentando avançar antes disso deve mostrar a mensagem de erro.

- [ ] **Step 4: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): etapa de atributos com point buy e nome do personagem"
```

---

### Task 11: Etapa 2 — Raça (com caso especial do Meio-Elfo)

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Substituir a etapa 1 do `renderEtapaAtual`**

Troque:
```js
  if (etapaAtual === 1) elementoConteudo.innerHTML = '<p>Etapa de Raça (em construção)</p>';
```
por:
```js
  if (etapaAtual === 1) renderEtapaRaca();
```

- [ ] **Step 2: Adicionar `renderEtapaRaca`**

Adicione, antes de `renderEtapaAtual`:
```js
function racaSelecionada() {
  return DADOS.RACAS.find(r => r.nome === ficha.raca) || null;
}

function textoBonus(bonus) {
  return Object.entries(bonus).map(([atributo, valor]) => `+${valor} ${NOMES_ATRIBUTOS[atributo]}`).join(', ');
}

function renderEtapaRaca() {
  const opcoes = DADOS.RACAS.map(raca =>
    `<option value="${raca.nome}" ${ficha.raca === raca.nome ? 'selected' : ''}>${raca.nome}</option>`
  ).join('');

  const raca = racaSelecionada();
  let blocoBonus = '';
  let blocoEscolhaLivre = '';

  if (raca) {
    blocoBonus = `<p class="bonus-raca">Bônus fixo: ${textoBonus(raca.bonus)}</p>`;

    if (raca.escolhaLivre) {
      const atributosDisponiveis = Object.keys(NOMES_ATRIBUTOS).filter(a => !(a in raca.bonus));
      const selects = Array.from({ length: raca.escolhaLivre }).map((_valor, indice) => {
        const opcoesAtributo = atributosDisponiveis.map(atributo =>
          `<option value="${atributo}" ${ficha.bonusEscolhidoMeioElfo[indice] === atributo ? 'selected' : ''}>${NOMES_ATRIBUTOS[atributo]}</option>`
        ).join('');
        return `
          <select class="escolha-livre" data-indice="${indice}">
            <option value="">+1 em qual atributo?</option>
            ${opcoesAtributo}
          </select>`;
      }).join('');
      blocoEscolhaLivre = `<div class="escolhas-livres"><p>Escolha ${raca.escolhaLivre} atributos diferentes para +1 cada:</p>${selects}</div>`;
    }
  }

  elementoConteudo.innerHTML = `
    <h2>Raça</h2>
    <select id="campoRaca">
      <option value="">Selecione uma raça</option>
      ${opcoes}
    </select>
    ${blocoBonus}
    ${blocoEscolhaLivre}
  `;

  document.getElementById('campoRaca').addEventListener('change', evento => {
    ficha.raca = evento.target.value || null;
    ficha.bonusEscolhidoMeioElfo = [];
    renderEtapaRaca();
  });

  document.querySelectorAll('.escolha-livre').forEach(select => {
    select.addEventListener('change', evento => {
      const indice = Number(evento.target.dataset.indice);
      ficha.bonusEscolhidoMeioElfo[indice] = evento.target.value || null;
    });
  });
}
```

- [ ] **Step 3: Validar a etapa 1 em `podeAvancar`**

Dentro de `podeAvancar`, antes do `return true;` final, adicione o bloco da etapa 1:
```js
  if (etapaAtual === 1) {
    const raca = racaSelecionada();
    if (!raca) {
      mostrarErro('Selecione uma raça.');
      return false;
    }
    if (raca.escolhaLivre) {
      const escolhas = ficha.bonusEscolhidoMeioElfo.filter(Boolean);
      const semDuplicados = new Set(escolhas).size === escolhas.length;
      if (escolhas.length !== raca.escolhaLivre || !semDuplicados) {
        mostrarErro(`Escolha ${raca.escolhaLivre} atributos diferentes para o bônus de +1.`);
        return false;
      }
    }
    return true;
  }
```

- [ ] **Step 4: Verificar manualmente**

Avance até a etapa Raça. Selecione "Humano" — deve mostrar o bônus fixo, sem seletor extra, e permitir avançar. Selecione "Meio-Elfo" — devem aparecer 2 selects de "+1 em qual atributo", sem Carisma na lista; tentar avançar sem preencher os dois (ou escolhendo o mesmo atributo duas vezes) deve mostrar erro.

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): etapa de raca com bonus racial e caso do meio-elfo"
```

---

### Task 12: Etapa 3 — Classe e seleção de perícias

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Substituir a etapa 2 do `renderEtapaAtual`**

Troque:
```js
  if (etapaAtual === 2) elementoConteudo.innerHTML = '<p>Etapa de Classe (em construção)</p>';
```
por:
```js
  if (etapaAtual === 2) renderEtapaClasse();
```

- [ ] **Step 2: Adicionar `renderEtapaClasse`**

Adicione, antes de `renderEtapaAtual`:
```js
function classeSelecionada() {
  return DADOS.CLASSES.find(c => c.nome === ficha.classe) || null;
}

function renderEtapaClasse() {
  const opcoes = DADOS.CLASSES.map(classe =>
    `<option value="${classe.nome}" ${ficha.classe === classe.nome ? 'selected' : ''}>${classe.nome}</option>`
  ).join('');

  const classe = classeSelecionada();
  let blocoPericias = '';

  if (classe) {
    const listaPericias = classe.todasPericias ? DADOS.PERICIAS.map(p => p.nome) : classe.periciasElegiveis;
    const itens = listaPericias.map(nomePericia => {
      const marcado = ficha.periciasEscolhidas.includes(nomePericia);
      return `
        <label class="item-pericia">
          <input type="checkbox" class="checkbox-pericia" value="${nomePericia}" ${marcado ? 'checked' : ''}>
          ${nomePericia}
        </label>`;
    }).join('');

    blocoPericias = `
      <p>Escolha exatamente ${classe.escolhas} perícia(s) — selecionadas: ${ficha.periciasEscolhidas.length}/${classe.escolhas}</p>
      <div class="lista-pericias">${itens}</div>
    `;
  }

  elementoConteudo.innerHTML = `
    <h2>Classe</h2>
    <select id="campoClasse">
      <option value="">Selecione uma classe</option>
      ${opcoes}
    </select>
    <p class="dado-vida">${classe ? `Dado de Vida: d${classe.dadoDeVida}` : ''}</p>
    ${blocoPericias}
  `;

  document.getElementById('campoClasse').addEventListener('change', evento => {
    ficha.classe = evento.target.value || null;
    ficha.periciasEscolhidas = [];
    renderEtapaClasse();
  });

  document.querySelectorAll('.checkbox-pericia').forEach(checkbox => {
    checkbox.addEventListener('change', evento => {
      const nomePericia = evento.target.value;
      const limite = classeSelecionada().escolhas;
      if (evento.target.checked) {
        if (ficha.periciasEscolhidas.length >= limite) {
          evento.target.checked = false;
          mostrarErro(`Você só pode escolher ${limite} perícia(s) para esta classe.`);
          return;
        }
        ficha.periciasEscolhidas.push(nomePericia);
      } else {
        ficha.periciasEscolhidas = ficha.periciasEscolhidas.filter(p => p !== nomePericia);
      }
      limparErro();
      renderEtapaClasse();
    });
  });
}
```

- [ ] **Step 3: Validar a etapa 2 em `podeAvancar`**

Dentro de `podeAvancar`, antes do `return true;` final, adicione o bloco da etapa 2:
```js
  if (etapaAtual === 2) {
    const classe = classeSelecionada();
    if (!classe) {
      mostrarErro('Selecione uma classe.');
      return false;
    }
    if (ficha.periciasEscolhidas.length !== classe.escolhas) {
      mostrarErro(`Escolha exatamente ${classe.escolhas} perícia(s).`);
      return false;
    }
    return true;
  }
```

- [ ] **Step 4: Verificar manualmente**

Avance até a etapa Classe. Selecione "Ladino" — deve aparecer o dado de vida (d8) e a lista de perícias elegíveis com limite de 4. Marque 4 perícias e confirme que uma 5ª fica bloqueada com mensagem de erro. Selecione "Bardo" — a lista deve mostrar as 18 perícias, limite 3.

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): etapa de classe com selecao de pericias"
```

---

### Task 13: Etapa 4 — Resumo e exportação do `character.json`

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Substituir a etapa 3 do `renderEtapaAtual`**

Troque:
```js
  if (etapaAtual === 3) elementoConteudo.innerHTML = '<p>Etapa de Resumo (em construção)</p>';
```
por:
```js
  if (etapaAtual === 3) renderEtapaResumo();
```

- [ ] **Step 2: Adicionar as funções de cálculo final, resumo e exportação**

Adicione, antes de `renderEtapaAtual`:
```js
function atributosFinais() {
  const raca = racaSelecionada();
  const resultado = { ...ficha.atributosBase };
  Object.entries(raca.bonus).forEach(([atributo, valor]) => {
    resultado[atributo] += valor;
  });
  ficha.bonusEscolhidoMeioElfo.filter(Boolean).forEach(atributo => {
    resultado[atributo] += 1;
  });
  return resultado;
}

function construirFichaFinal() {
  const atributos = atributosFinais();
  const classe = classeSelecionada();
  const modConstituicao = Calculo.modificador(atributos.constituicao);
  const modDestreza = Calculo.modificador(atributos.destreza);

  const pericias = ficha.periciasEscolhidas.map(nomePericia => {
    const pericia = DADOS.PERICIAS.find(p => p.nome === nomePericia);
    const modAtributo = Calculo.modificador(atributos[pericia.atributo]);
    return {
      nome: pericia.nome,
      atributo: pericia.atributo,
      proficiente: true,
      bonus: Calculo.bonusPericia(modAtributo, true, 2)
    };
  });

  return {
    nome: ficha.nome.trim(),
    raca: ficha.raca,
    classe: ficha.classe,
    nivel: 1,
    atributos,
    pv: Calculo.pvInicial(classe.dadoDeVida, modConstituicao),
    ca: Calculo.caBase(modDestreza),
    pericias
  };
}

function renderEtapaResumo() {
  const dadosFicha = construirFichaFinal();

  const linhasAtributos = Object.keys(NOMES_ATRIBUTOS).map(chave => {
    const valor = dadosFicha.atributos[chave];
    const mod = Calculo.modificador(valor);
    return `<li>${NOMES_ATRIBUTOS[chave]}: ${valor} (${mod >= 0 ? '+' : ''}${mod})</li>`;
  }).join('');

  const linhasPericias = dadosFicha.pericias.map(p =>
    `<li>${p.nome}: ${p.bonus >= 0 ? '+' : ''}${p.bonus}</li>`
  ).join('');

  elementoConteudo.innerHTML = `
    <h2>Resumo — ${dadosFicha.nome}</h2>
    <p>${dadosFicha.raca} · ${dadosFicha.classe} · Nível ${dadosFicha.nivel}</p>
    <div class="destaques">
      <span class="destaque">PV ${dadosFicha.pv}</span>
      <span class="destaque">CA ${dadosFicha.ca}</span>
    </div>
    <h3>Atributos</h3>
    <ul>${linhasAtributos}</ul>
    <h3>Perícias com proficiência</h3>
    <ul>${linhasPericias.length ? linhasPericias : '<li>Nenhuma</li>'}</ul>
  `;
}

function baixarFicha() {
  const dadosFicha = construirFichaFinal();
  const conteudo = JSON.stringify(dadosFicha, null, 2);
  const blob = new Blob([conteudo], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const nomeArquivo = `ficha-${dadosFicha.nome.toLowerCase().replace(/\s+/g, '-') || 'personagem'}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: Trocar o comportamento do botão "Avançar" na última etapa**

Substitua o listener de `botaoAvancar` por:
```js
botaoAvancar.addEventListener('click', () => {
  if (!podeAvancar()) return;
  if (etapaAtual < 3) {
    etapaAtual += 1;
    renderEtapaAtual();
  } else {
    baixarFicha();
  }
});
```

- [ ] **Step 4: Verificar manualmente o fluxo completo**

Preencha as 4 etapas do início ao fim com dados válidos (ex: Kess Bramo, Humana, Ladina, 4 perícias). Na etapa Resumo, confirme que PV, CA, atributos e perícias exibidos batem com as regras (ex: Humano dá +1 em tudo; Ladino tem d8 de dado de vida). Clique em "Baixar minha ficha" e confirme que um arquivo `ficha-kess-bramo.json` foi baixado com a estrutura esperada (abra o arquivo baixado e confira os campos).

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): etapa de resumo e exportacao do character.json"
```

---

### Task 14: Tema visual "grimório moderno" (escuro, mobile-first)

**Files:**
- Modify: `docs/creator/css/estilo.css`

- [ ] **Step 1: Substituir todo o conteúdo do CSS**

`docs/creator/css/estilo.css`:
```css
:root {
  --cor-fundo: #14100c;
  --cor-fundo-elevado: #1f1811;
  --cor-borda: #3a2e20;
  --cor-texto: #ece4d3;
  --cor-texto-fraco: #a89a82;
  --cor-destaque: #c9a24b;
  --cor-destaque-forte: #e0b95c;
  --cor-erro: #d16a5a;
  --fonte-titulo: 'Cinzel', Georgia, 'Times New Roman', serif;
  --fonte-corpo: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at top, #1c1610 0%, var(--cor-fundo) 60%);
  color: var(--cor-texto);
  font-family: var(--fonte-corpo);
  line-height: 1.5;
}

.cabecalho {
  text-align: center;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid var(--cor-borda);
}

.cabecalho h1 {
  font-family: var(--fonte-titulo);
  color: var(--cor-destaque-forte);
  letter-spacing: 0.03em;
  margin: 0;
  font-size: 1.6rem;
}

.subtitulo {
  color: var(--cor-texto-fraco);
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
}

.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 1rem 1rem 3rem;
}

.progresso {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
}

.progresso li {
  flex: 1 1 auto;
  text-align: center;
  padding: 0.5rem 0.25rem;
  border-radius: 0.4rem;
  background: var(--cor-fundo-elevado);
  border: 1px solid var(--cor-borda);
  color: var(--cor-texto-fraco);
  font-size: 0.8rem;
}

.progresso li.ativo {
  border-color: var(--cor-destaque);
  color: var(--cor-destaque-forte);
}

.progresso li.concluido {
  color: var(--cor-texto);
}

.conteudo {
  background: var(--cor-fundo-elevado);
  border: 1px solid var(--cor-borda);
  border-top: 2px solid var(--cor-destaque);
  border-radius: 0.6rem;
  padding: 1.25rem;
}

.conteudo h2 {
  font-family: var(--fonte-titulo);
  color: var(--cor-destaque-forte);
  margin-top: 0;
}

.conteudo h3 {
  color: var(--cor-destaque);
  font-size: 1rem;
  margin-bottom: 0.4rem;
}

.campo-nome, .conteudo label {
  display: block;
  color: var(--cor-texto-fraco);
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

input[type="text"], select {
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.6rem;
  background: var(--cor-fundo);
  border: 1px solid var(--cor-borda);
  border-radius: 0.4rem;
  color: var(--cor-texto);
  font-size: 1rem;
}

.linha-atributo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--cor-borda);
}

.nome-atributo {
  flex: 1;
}

.valor-atributo {
  min-width: 1.6rem;
  text-align: center;
  font-weight: bold;
}

.botao-passo {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 1px solid var(--cor-destaque);
  background: transparent;
  color: var(--cor-destaque-forte);
  font-size: 1.1rem;
  cursor: pointer;
}

.botao-passo:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pontos-restantes {
  color: var(--cor-destaque-forte);
}

.lista-pericias {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.4rem;
}

.item-pericia {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.destaques {
  display: flex;
  gap: 0.75rem;
  margin: 0.75rem 0 1.25rem;
}

.destaque {
  background: var(--cor-fundo);
  border: 1px solid var(--cor-destaque);
  color: var(--cor-destaque-forte);
  padding: 0.4rem 0.9rem;
  border-radius: 0.4rem;
  font-weight: bold;
}

.mensagem-erro {
  color: var(--cor-erro);
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
}

.navegacao {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.botao {
  flex: 1;
  padding: 0.85rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: var(--fonte-titulo);
  cursor: pointer;
  min-height: 44px;
}

.botao-primario {
  background: var(--cor-destaque);
  border: 1px solid var(--cor-destaque);
  color: #1a1409;
}

.botao-secundario {
  background: transparent;
  border: 1px solid var(--cor-borda);
  color: var(--cor-texto-fraco);
}

.botao-primario:hover, .botao-secundario:hover {
  filter: brightness(1.1);
}

.botao:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (min-width: 640px) {
  .cabecalho h1 {
    font-size: 2rem;
  }
}
```

- [ ] **Step 2: Verificar manualmente**

Abra a página no navegador (desktop) e, se possível, no celular (ou usando as ferramentas de dispositivo móvel do DevTools). Confirme: fundo escuro, títulos em serifa dourada, botões com boa área de toque, layout sem rolagem horizontal, indicador de progresso legível.

- [ ] **Step 3: Commit**

```bash
git add docs/creator/css/estilo.css
git commit -m "feat(creator): tema visual grimorio moderno, escuro e mobile-first"
```

---

### Task 15: Publicar via GitHub Pages

**Files:** nenhum arquivo novo — configuração no GitHub.

- [ ] **Step 1: Enviar tudo para o repositório**

```bash
git push origin main
```

- [ ] **Step 2: Ativar o GitHub Pages (ação manual no site do GitHub — não há CLI disponível nesta máquina)**

1. Abra `https://github.com/jonasmoura247/rpg-mesa/settings/pages`.
2. Em "Build and deployment" → "Source", escolha **Deploy from a branch**.
3. Em "Branch", escolha **main** e a pasta **/docs**. Salve.
4. Aguarde alguns minutos e confirme que a página fica disponível em `https://jonasmoura247.github.io/rpg-mesa/creator/`.

- [ ] **Step 3: Testar o link publicado no celular**

Abra o link acima no navegador de um iPhone e de um Android (ou peça para os jogadores testarem). Confirme que preenche, calcula e baixa o `character.json` normalmente — no iPhone, o download some para a pasta "Arquivos" (ou pergunta onde salvar, dependendo do Safari).

---

### Task 16: Teste manual completo e verificação final

**Files:** nenhum arquivo novo.

- [ ] **Step 1: Rodar todos os testes automatizados**

Run: `node docs/creator/js/dados.test.js && node docs/creator/js/calculo.test.js`
Expected:
```
dados.test.js (perícias/point buy): OK
calculo.test.js: OK
```

- [ ] **Step 2: Criar as 3 fichas dos personagens da história de abertura**

Usando o link publicado (ou `index.html` local), crie as fichas de **Kess Bramo** (Humana, Ladina), **Bran Ferronaz** (Anão da Montanha, Guerreiro) e **Sael Marévalis** (Humano, Clérigo), conforme descritos em `docs/superpowers/historias/2026-08-28-abertura-porto-mare-alta.md`. Baixe os 3 `character.json`.

- [ ] **Step 3: Guardar os 3 JSONs de exemplo no repositório para o próximo plano usar**

```bash
mkdir -p docs/creator/exemplos
```
Mova os 3 arquivos baixados para `docs/creator/exemplos/` (renomeie para `kess-bramo.json`, `bran-ferronaz.json`, `sael-marevalis.json`).

```bash
git add docs/creator/exemplos/
git commit -m "chore(creator): fichas de exemplo dos 3 personagens da abertura"
git push origin main
```

Esses 3 arquivos servem de fixture real para o próximo plano (importação no painel + aba Jogadores).
