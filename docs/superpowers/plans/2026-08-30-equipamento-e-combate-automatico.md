# Equipamento inicial + dano automático no Combate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma etapa de Equipamento (arma + armadura, pacotes por classe fiéis ao 5e) no criador
de ficha, e usar essa informação para o Combate do painel do mestre rolar o dano da arma
automaticamente — o mestre digita só o d20 de acerto.

**Architecture:** Duas aplicações JS separadas, sem build step (scripts carregados via `<script>` tags,
lógica pura testável com `node arquivo.test.js` + `assert`). No criador (`docs/creator`): novas tabelas de
dados em `dados.js`, nova função de CA em `calculo.js`, nova etapa em `app.js`. No painel
(`src/PainelDed.Api/wwwroot`): novo módulo puro de dados (`dado.js`) e mudanças em `combate.js`. No
backend (.NET): novo record `ArmaPersonagem` passado ponta a ponta sem transformação, mesmo padrão já
usado para `MagiasConhecidas`.

**Tech Stack:** JavaScript vanilla (sem framework, sem bundler), Node.js `assert` para testes de lógica
pura, ASP.NET Core (C# records) + xUnit para o backend, Playwright (MCP) para verificação manual de UI.

**Referência:** Spec completa em
`docs/superpowers/specs/2026-08-30-equipamento-e-combate-automatico-design.md`.

---

## Task 1: Tabelas de armas e armaduras (`dados.js`)

**Files:**
- Modify: `docs/creator/js/dados.js`
- Test: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Escrever os testes que falham**

Adicione ao final de `docs/creator/js/dados.test.js` (antes da linha `console.log('dados.test.js...`):

```js
assert.strictEqual(DADOS.ARMAS.length, 16, 'devem existir 16 armas (5 simples corpo a corpo + 6 marciais + 5 à distância)');
const adaga = DADOS.ARMAS.find(a => a.nome === 'Adaga');
assert.strictEqual(adaga.dano, '1d4');
assert.strictEqual(adaga.tipoDano, 'perfuração');
assert.ok(adaga.propriedades.includes('fineza'));
assert.ok(adaga.propriedades.includes('leve'));

const espadaLonga = DADOS.ARMAS.find(a => a.nome === 'Espada Longa');
assert.strictEqual(espadaLonga.dano, '1d8');
assert.ok(espadaLonga.propriedades.includes('versatil'));
assert.strictEqual(espadaLonga.danoVersatil, '1d10');

const arcoLongo = DADOS.ARMAS.find(a => a.nome === 'Arco Longo');
assert.strictEqual(arcoLongo.tipo, 'distancia');
assert.strictEqual(arcoLongo.categoria, 'marcial');

assert.strictEqual(DADOS.ARMADURAS.length, 10, 'devem existir 10 armaduras (3 leves + 4 médias + 3 pesadas)');
const couro = DADOS.ARMADURAS.find(a => a.nome === 'Couro');
assert.strictEqual(couro.categoria, 'leve');
assert.strictEqual(couro.ca, 11);
assert.strictEqual(couro.limiteDex, null);

const cotaDeMalha = DADOS.ARMADURAS.find(a => a.nome === 'Cota de Malha');
assert.strictEqual(cotaDeMalha.categoria, 'media');
assert.strictEqual(cotaDeMalha.limiteDex, 2);

const placas = DADOS.ARMADURAS.find(a => a.nome === 'Armadura de Placas');
assert.strictEqual(placas.categoria, 'pesada');
assert.strictEqual(placas.ca, 18);
assert.strictEqual(placas.limiteDex, 0);
assert.strictEqual(placas.forMinima, 15);

assert.strictEqual(DADOS.ESCUDO.bonusCa, 2);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: `AssertionError` (ou `TypeError: Cannot read properties of undefined`) porque `DADOS.ARMAS` ainda
não existe.

- [ ] **Step 3: Implementar as tabelas**

Em `docs/creator/js/dados.js`, dentro da mesma IIFE onde `PERICIAS` e as outras tabelas são definidas e
exportadas (`raiz.DADOS = api` no final do arquivo), adicione:

```js
const ARMAS = [
  { nome: 'Clava', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d4', tipoDano: 'concussão', propriedades: ['leve'] },
  { nome: 'Adaga', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d4', tipoDano: 'perfuração', propriedades: ['fineza', 'leve', 'arremesso'] },
  { nome: 'Machadinha', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d6', tipoDano: 'corte', propriedades: ['leve', 'arremesso'] },
  { nome: 'Lança', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d6', tipoDano: 'perfuração', propriedades: ['arremesso', 'versatil'], danoVersatil: '1d8' },
  { nome: 'Cajado', categoria: 'simples', tipo: 'corpoACorpo', dano: '1d6', tipoDano: 'concussão', propriedades: ['versatil'], danoVersatil: '1d8' },
  { nome: 'Espada Longa', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d8', tipoDano: 'corte', propriedades: ['versatil'], danoVersatil: '1d10' },
  { nome: 'Machado de Guerra', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d8', tipoDano: 'corte', propriedades: ['versatil'], danoVersatil: '1d10' },
  { nome: 'Rapieira', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d8', tipoDano: 'perfuração', propriedades: ['fineza'] },
  { nome: 'Alabarda', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d10', tipoDano: 'corte', propriedades: ['alcance', 'pesada', 'duasMaos'] },
  { nome: 'Espada Grande', categoria: 'marcial', tipo: 'corpoACorpo', dano: '2d6', tipoDano: 'corte', propriedades: ['pesada', 'duasMaos'] },
  { nome: 'Maça Estrela', categoria: 'marcial', tipo: 'corpoACorpo', dano: '1d8', tipoDano: 'concussão', propriedades: [] },
  { nome: 'Arco Curto', categoria: 'simples', tipo: 'distancia', dano: '1d6', tipoDano: 'perfuração', propriedades: [], alcance: '24/96m' },
  { nome: 'Arco Longo', categoria: 'marcial', tipo: 'distancia', dano: '1d8', tipoDano: 'perfuração', propriedades: [], alcance: '45/180m' },
  { nome: 'Besta Leve', categoria: 'simples', tipo: 'distancia', dano: '1d8', tipoDano: 'perfuração', propriedades: ['carga'], alcance: '24/96m' },
  { nome: 'Besta Pesada', categoria: 'marcial', tipo: 'distancia', dano: '1d10', tipoDano: 'perfuração', propriedades: ['carga', 'pesada'], alcance: '30/120m' },
  { nome: 'Funda', categoria: 'simples', tipo: 'distancia', dano: '1d4', tipoDano: 'concussão', propriedades: [], alcance: '30/120m' },
];

const ARMADURAS = [
  { nome: 'Acolchoada', categoria: 'leve', ca: 11, limiteDex: null },
  { nome: 'Couro', categoria: 'leve', ca: 11, limiteDex: null },
  { nome: 'Couro Batido', categoria: 'leve', ca: 12, limiteDex: null },
  { nome: 'Cota de Malha', categoria: 'media', ca: 13, limiteDex: 2 },
  { nome: 'Escamas', categoria: 'media', ca: 14, limiteDex: 2 },
  { nome: 'Couraça', categoria: 'media', ca: 14, limiteDex: 2 },
  { nome: 'Meia-placa', categoria: 'media', ca: 15, limiteDex: 2 },
  { nome: 'Cota de Anéis', categoria: 'pesada', ca: 14, limiteDex: 0 },
  { nome: 'Camisão de Malha', categoria: 'pesada', ca: 16, limiteDex: 0, forMinima: 13 },
  { nome: 'Armadura de Placas', categoria: 'pesada', ca: 18, limiteDex: 0, forMinima: 15 },
];

const ESCUDO = { nome: 'Escudo', bonusCa: 2 };
```

E adicione `ARMAS`, `ARMADURAS`, `ESCUDO` ao objeto `api` exportado (procure a linha `const api = {
PERICIAS, ... }` perto do final do arquivo e inclua as três novas chaves).

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(equipamento): adiciona tabelas de armas e armaduras em dados.js"
```

---

## Task 2: Pacotes de equipamento por classe (`dados.js`)

**Files:**
- Modify: `docs/creator/js/dados.js`
- Test: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Escrever os testes que falham**

Adicione a `docs/creator/js/dados.test.js`:

```js
const NOMES_12_CLASSES = ['Bárbaro', 'Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Guerreiro', 'Ladino', 'Magista', 'Monge', 'Paladino', 'Patrulheiro'];
NOMES_12_CLASSES.forEach(nome => {
  const pacotes = DADOS.PACOTES_EQUIPAMENTO[nome];
  assert.ok(Array.isArray(pacotes) && pacotes.length === 2, `${nome} deve ter exatamente 2 pacotes de equipamento`);
  pacotes.forEach(pacote => {
    assert.ok(typeof pacote.rotulo === 'string' && pacote.rotulo.length > 0, `pacote de ${nome} deve ter rótulo`);
    assert.ok(Array.isArray(pacote.armas) && pacote.armas.length > 0, `pacote de ${nome} deve ter ao menos 1 arma`);
    pacote.armas.forEach(nomeArma => {
      assert.ok(DADOS.ARMAS.some(a => a.nome === nomeArma), `arma '${nomeArma}' do pacote de ${nome} deve existir em DADOS.ARMAS`);
    });
    if (pacote.armadura) {
      assert.ok(DADOS.ARMADURAS.some(a => a.nome === pacote.armadura), `armadura '${pacote.armadura}' do pacote de ${nome} deve existir em DADOS.ARMADURAS`);
    }
    assert.strictEqual(typeof pacote.escudo, 'boolean', `pacote de ${nome} deve ter escudo (true/false)`);
  });
});

const pacotesGuerreiro = DADOS.PACOTES_EQUIPAMENTO.Guerreiro;
assert.deepStrictEqual(pacotesGuerreiro[0].armas, ['Espada Longa']);
assert.strictEqual(pacotesGuerreiro[0].escudo, true);
assert.strictEqual(pacotesGuerreiro[0].armadura, 'Cota de Malha');
assert.deepStrictEqual(pacotesGuerreiro[1].armas, ['Arco Longo']);
assert.strictEqual(pacotesGuerreiro[1].escudo, false);

const pacotesMagista = DADOS.PACOTES_EQUIPAMENTO.Magista;
assert.strictEqual(pacotesMagista[0].armadura, null);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: falha porque `DADOS.PACOTES_EQUIPAMENTO` é `undefined`.

- [ ] **Step 3: Implementar os pacotes**

Adicione em `docs/creator/js/dados.js`, logo depois de `ESCUDO`:

```js
const PACOTES_EQUIPAMENTO = {
  'Bárbaro': [
    { rotulo: 'Arma pesada', armas: ['Espada Grande'], escudo: false, armadura: null },
    { rotulo: 'Arma e escudo', armas: ['Machado de Guerra'], escudo: true, armadura: null },
  ],
  'Bardo': [
    { rotulo: 'Duelista', armas: ['Rapieira'], escudo: false, armadura: 'Couro' },
    { rotulo: 'Espadachim', armas: ['Espada Longa'], escudo: false, armadura: 'Couro' },
  ],
  'Bruxo': [
    { rotulo: 'À distância', armas: ['Besta Leve'], escudo: false, armadura: 'Couro' },
    { rotulo: 'Duas adagas', armas: ['Adaga', 'Adaga'], escudo: false, armadura: 'Couro' },
  ],
  'Clérigo': [
    { rotulo: 'Guerreiro sagrado', armas: ['Maça Estrela'], escudo: true, armadura: 'Escamas' },
    { rotulo: 'À distância', armas: ['Besta Leve'], escudo: false, armadura: 'Couro' },
  ],
  'Druida': [
    { rotulo: 'Cajado e escudo', armas: ['Cajado'], escudo: true, armadura: 'Couro' },
    { rotulo: 'Machadinha', armas: ['Machadinha'], escudo: false, armadura: 'Couro' },
  ],
  'Feiticeiro': [
    { rotulo: 'À distância', armas: ['Besta Leve'], escudo: false, armadura: null },
    { rotulo: 'Duas adagas', armas: ['Adaga', 'Adaga'], escudo: false, armadura: null },
  ],
  'Guerreiro': [
    { rotulo: 'Guerreiro corpo a corpo', armas: ['Espada Longa'], escudo: true, armadura: 'Cota de Malha' },
    { rotulo: 'Guerreiro à distância', armas: ['Arco Longo'], escudo: false, armadura: 'Couro Batido' },
  ],
  'Ladino': [
    { rotulo: 'Duelista', armas: ['Rapieira'], escudo: false, armadura: 'Couro' },
    { rotulo: 'Duas adagas', armas: ['Adaga', 'Adaga'], escudo: false, armadura: 'Couro' },
  ],
  'Magista': [
    { rotulo: 'Cajado', armas: ['Cajado'], escudo: false, armadura: null },
    { rotulo: 'Adaga', armas: ['Adaga'], escudo: false, armadura: null },
  ],
  'Monge': [
    { rotulo: 'Adaga', armas: ['Adaga'], escudo: false, armadura: null },
    { rotulo: 'Clava', armas: ['Clava'], escudo: false, armadura: null },
  ],
  'Paladino': [
    { rotulo: 'Espada e escudo', armas: ['Espada Longa'], escudo: true, armadura: 'Cota de Malha' },
    { rotulo: 'Alabarda', armas: ['Alabarda'], escudo: false, armadura: 'Cota de Malha' },
  ],
  'Patrulheiro': [
    { rotulo: 'Arqueiro', armas: ['Arco Longo'], escudo: false, armadura: 'Couro Batido' },
    { rotulo: 'Duas adagas', armas: ['Adaga', 'Adaga'], escudo: false, armadura: 'Couro Batido' },
  ],
};
```

Adicione `PACOTES_EQUIPAMENTO` ao objeto `api` exportado.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(equipamento): adiciona pacotes de equipamento por classe"
```

---

## Task 3: Cálculo de CA com armadura (`calculo.js`)

**Files:**
- Modify: `docs/creator/js/calculo.js`
- Test: `docs/creator/js/calculo.test.js`

- [ ] **Step 1: Escrever os testes que falham**

Adicione a `docs/creator/js/calculo.test.js` (antes de `console.log('calculo.test.js: OK')`):

```js
assert.strictEqual(Calculo.caArmadura(null, false, 3), 13, 'sem armadura, sem escudo: 10 + DES');
assert.strictEqual(Calculo.caArmadura(null, true, 3), 15, 'sem armadura, com escudo: 10 + DES + 2');

const couro = { nome: 'Couro', categoria: 'leve', ca: 11, limiteDex: null };
assert.strictEqual(Calculo.caArmadura(couro, false, 3), 14, 'armadura leve soma DES inteiro');
assert.strictEqual(Calculo.caArmadura(couro, false, -2), 9, 'armadura leve com DES negativo');

const cotaDeMalha = { nome: 'Cota de Malha', categoria: 'media', ca: 13, limiteDex: 2 };
assert.strictEqual(Calculo.caArmadura(cotaDeMalha, false, 4), 15, 'armadura média limita DES em +2 mesmo com mod maior');
assert.strictEqual(Calculo.caArmadura(cotaDeMalha, false, 1), 14, 'armadura média usa DES cheio quando menor que o limite');
assert.strictEqual(Calculo.caArmadura(cotaDeMalha, true, 4), 17, 'armadura média com escudo soma +2 extra');

const placas = { nome: 'Armadura de Placas', categoria: 'pesada', ca: 18, limiteDex: 0, forMinima: 15 };
assert.strictEqual(Calculo.caArmadura(placas, false, 4), 18, 'armadura pesada ignora DES completamente');
assert.strictEqual(Calculo.caArmadura(placas, true, 4), 20, 'armadura pesada com escudo soma +2');
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/calculo.test.js`
Expected: `TypeError: Calculo.caArmadura is not a function`

- [ ] **Step 3: Implementar `caArmadura`**

Em `docs/creator/js/calculo.js`, adicione a função (perto de `caBase`, que continua existindo sem uso —
nenhum outro arquivo mais vai chamá-la depois da Task 7, mas não precisa removê-la agora):

```js
function caArmadura(armadura, temEscudo, modDestreza) {
  const bonusEscudo = temEscudo ? 2 : 0;
  if (!armadura) {
    return 10 + modDestreza + bonusEscudo;
  }
  const dexAplicavel = armadura.limiteDex === null ? modDestreza : Math.min(modDestreza, armadura.limiteDex);
  return armadura.ca + dexAplicavel + bonusEscudo;
}
```

E adicione `caArmadura` ao objeto `api` no final do arquivo (`const api = { modificador, ..., caBase,
caArmadura, ... }`).

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/calculo.test.js`
Expected: `calculo.test.js: OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/calculo.js docs/creator/js/calculo.test.js
git commit -m "feat(equipamento): adiciona Calculo.caArmadura considerando armadura e escudo"
```

---

## Task 4: Reordenar etapas do criador (`app.js`)

**Files:**
- Modify: `docs/creator/js/app.js:1-33`

- [ ] **Step 1: Adicionar estado de equipamento à ficha**

Em `app.js`, no objeto `ficha` (linhas 1-11), adicione o campo `equipamento` depois de
`periciasEscolhidas`:

```js
const ficha = {
  nome: '',
  raca: null,
  bonusEscolhidoMeioElfo: [],
  classe: null,
  atributosBase: { forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 },
  periciasEscolhidas: [],
  equipamento: { pacoteIndice: null, escolhasAtributo: {}, duasMaos: {} },
  magiasEscolhidas: [],
  historia: '',
  caracteristicasFisicas: ''
};
```

- [ ] **Step 2: Reordenar `etapas()` e `NOMES_ETAPAS`**

Substitua as linhas 21-33 (de `const NOMES_ETAPAS = ...` até o fechamento de `etapas()`):

```js
const NOMES_ETAPAS = { raca: 'Raça', classe: 'Classe', atributos: 'Atributos', equipamento: 'Equipamento', magias: 'Magias', resumo: 'Resumo' };

function classeTemMagias() {
  const classe = classeSelecionada();
  return Boolean(classe && classe.magias);
}

function etapas() {
  const passos = ['raca', 'classe', 'atributos', 'equipamento'];
  if (classeTemMagias()) passos.push('magias');
  passos.push('resumo');
  return passos;
}
```

- [ ] **Step 3: Verificar que os testes de lógica pura continuam passando**

Run: `node docs/creator/js/dados.test.js && node docs/creator/js/calculo.test.js && node docs/creator/js/magias.test.js`
Expected: as três linhas `OK` (esses testes não dependem de `app.js`, então continuam intactos — essa
verificação é só uma garantia de que nada quebrou sem querer nos arquivos que eles importam).

- [ ] **Step 4: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(criador-ficha): reordena etapas para Raca/Classe/Atributos/Equipamento"
```

---

## Task 5: Renderizar a etapa Equipamento (`app.js` + `estilo.css`)

**Files:**
- Modify: `docs/creator/js/app.js`
- Modify: `docs/creator/css/estilo.css`

- [ ] **Step 1: Adicionar funções auxiliares e `renderEtapaEquipamento`**

Em `app.js`, logo depois da função `renderEtapaClasse` (que termina com o `});` da linha que fecha
`document.querySelectorAll('.checkbox-pericia')...`), adicione:

```js
function pacotesDaClasse() {
  const classe = classeSelecionada();
  return classe ? (DADOS.PACOTES_EQUIPAMENTO[classe.nome] || []) : [];
}

function pacoteEquipamentoSelecionado() {
  const pacotes = pacotesDaClasse();
  return ficha.equipamento.pacoteIndice !== null ? pacotes[ficha.equipamento.pacoteIndice] : null;
}

function renderEtapaEquipamento() {
  limparErro();
  const pacotes = pacotesDaClasse();
  const modDestreza = Calculo.modificador(atributosFinais().destreza);

  const cartoes = pacotes.map((pacote, indice) => {
    const armadura = pacote.armadura ? DADOS.ARMADURAS.find(a => a.nome === pacote.armadura) : null;
    const caPrevia = Calculo.caArmadura(armadura, pacote.escudo, modDestreza);
    const selecionado = ficha.equipamento.pacoteIndice === indice;
    return `
      <label class="pacote-equipamento ${selecionado ? 'selecionado' : ''}">
        <input type="radio" name="pacoteEquipamento" value="${indice}" ${selecionado ? 'checked' : ''}>
        <strong>${pacote.rotulo}</strong>
        <span class="detalhes-magia">${pacote.armas.join(' + ')}${pacote.escudo ? ' + Escudo' : ''}${armadura ? ` · ${armadura.nome}` : ' · Sem armadura'}</span>
        <span class="descricao-opcao">CA ${caPrevia}</span>
      </label>`;
  }).join('');

  const pacote = pacoteEquipamentoSelecionado();
  let blocoEscolhas = '';
  if (pacote) {
    const linhas = pacote.armas.map(nomeArma => {
      const arma = DADOS.ARMAS.find(a => a.nome === nomeArma);
      let linha = '';
      if (arma.propriedades.includes('fineza')) {
        const escolhida = ficha.equipamento.escolhasAtributo[nomeArma] || '';
        linha += `
          <label class="campo-nome">
            ${nomeArma} — usar Força ou Destreza?
            <select class="campoFinezaArma" data-arma="${nomeArma}">
              <option value="">Selecione</option>
              <option value="forca" ${escolhida === 'forca' ? 'selected' : ''}>Força</option>
              <option value="destreza" ${escolhida === 'destreza' ? 'selected' : ''}>Destreza</option>
            </select>
          </label>`;
      }
      if (arma.propriedades.includes('versatil') && !pacote.escudo) {
        const duasMaos = Boolean(ficha.equipamento.duasMaos[nomeArma]);
        linha += `
          <label class="item-pericia">
            <input type="checkbox" class="campoDuasMaosArma" data-arma="${nomeArma}" ${duasMaos ? 'checked' : ''}>
            Empunhar ${nomeArma} com duas mãos (dano ${arma.danoVersatil})
          </label>`;
      }
      return linha;
    }).join('');
    blocoEscolhas = linhas.trim() ? `<div class="escolhas-livres">${linhas}</div>` : '';
  }

  elementoConteudo.innerHTML = `
    <h2>Equipamento</h2>
    <p>Escolha um pacote de equipamento inicial:</p>
    <div class="grade-pacotes">${cartoes}</div>
    ${blocoEscolhas}
  `;

  document.querySelectorAll('input[name="pacoteEquipamento"]').forEach(radio => {
    radio.addEventListener('change', evento => {
      ficha.equipamento.pacoteIndice = Number(evento.target.value);
      ficha.equipamento.escolhasAtributo = {};
      ficha.equipamento.duasMaos = {};
      limparErro();
      renderEtapaEquipamento();
    });
  });

  document.querySelectorAll('.campoFinezaArma').forEach(select => {
    select.addEventListener('change', evento => {
      ficha.equipamento.escolhasAtributo[evento.target.dataset.arma] = evento.target.value || null;
      limparErro();
    });
  });

  document.querySelectorAll('.campoDuasMaosArma').forEach(checkbox => {
    checkbox.addEventListener('change', evento => {
      ficha.equipamento.duasMaos[evento.target.dataset.arma] = evento.target.checked;
    });
  });
}
```

- [ ] **Step 2: Resetar equipamento quando a classe muda**

Em `renderEtapaClasse`, ache o listener `document.getElementById('campoClasse').addEventListener('change',
...)` e adicione a linha de reset:

```js
  document.getElementById('campoClasse').addEventListener('change', evento => {
    ficha.classe = evento.target.value || null;
    ficha.periciasEscolhidas = [];
    ficha.equipamento = { pacoteIndice: null, escolhasAtributo: {}, duasMaos: {} };
    renderEtapaClasse();
  });
```

- [ ] **Step 3: Registrar a etapa em `renderEtapaAtual`**

Em `renderEtapaAtual`, adicione a chamada depois de `if (passo === 'atributos') renderEtapaAtributos();`:

```js
  if (passo === 'equipamento') renderEtapaEquipamento();
```

- [ ] **Step 4: Estilizar os cartões de pacote**

Em `docs/creator/css/estilo.css`, adicione (perto de `.opcao-magia`, que tem visual parecido):

```css
.grade-pacotes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.6rem;
  margin: 0.8rem 0;
}

.pacote-equipamento {
  display: block;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  cursor: pointer;
}

.pacote-equipamento.selecionado {
  border-color: var(--cor-destaque);
  background: var(--cor-fundo-destaque);
}

.pacote-equipamento input[type="radio"] {
  margin-right: 0.4rem;
}
```

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/app.js docs/creator/css/estilo.css
git commit -m "feat(equipamento): renderiza etapa Equipamento com pacotes por classe"
```

---

## Task 6: Validar avanço da etapa Equipamento (`app.js`)

**Files:**
- Modify: `docs/creator/js/app.js` (função `podeAvancar`)

- [ ] **Step 1: Adicionar a validação**

Em `podeAvancar()`, adicione um novo bloco `if (passo === 'equipamento') { ... }` logo antes do
`if (passo === 'magias')` existente:

```js
  if (passo === 'equipamento') {
    const pacote = pacoteEquipamentoSelecionado();
    if (!pacote) {
      mostrarErro('Escolha um pacote de equipamento.');
      return false;
    }
    const armasComFineza = pacote.armas.filter(nomeArma =>
      DADOS.ARMAS.find(a => a.nome === nomeArma).propriedades.includes('fineza')
    );
    const faltaEscolherAtributo = armasComFineza.some(nomeArma => !ficha.equipamento.escolhasAtributo[nomeArma]);
    if (faltaEscolherAtributo) {
      mostrarErro('Escolha Força ou Destreza para toda arma com Fineza.');
      return false;
    }
    return true;
  }
```

- [ ] **Step 2: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(equipamento): valida escolha de pacote e fineza antes de avancar"
```

---

## Task 7: Ficha final usa CA e armas do equipamento (`app.js`)

**Files:**
- Modify: `docs/creator/js/app.js` (função `construirFichaFinal`)

- [ ] **Step 1: Calcular CA, armadura e armas**

Em `construirFichaFinal()`, substitua a linha `const bonusProficiencia = 2;` em diante, adicionando o
bloco de equipamento logo antes do `return`:

```js
  const bonusProficiencia = 2;
  const iniciativa = modDestreza;
  const bonusAtaqueForca = Calculo.bonusPericia(Calculo.modificador(atributos.forca), true, bonusProficiencia);
  const bonusAtaqueDestreza = Calculo.bonusPericia(modDestreza, true, bonusProficiencia);

  const pacoteEquipamento = pacoteEquipamentoSelecionado();
  const armaduraEquipada = pacoteEquipamento && pacoteEquipamento.armadura
    ? DADOS.ARMADURAS.find(a => a.nome === pacoteEquipamento.armadura)
    : null;
  const temEscudo = Boolean(pacoteEquipamento && pacoteEquipamento.escudo);
  const ca = Calculo.caArmadura(armaduraEquipada, temEscudo, modDestreza);

  const armas = (pacoteEquipamento ? pacoteEquipamento.armas : []).map(nomeArma => {
    const arma = DADOS.ARMAS.find(a => a.nome === nomeArma);
    const usaDuasMaos = Boolean(ficha.equipamento.duasMaos[nomeArma]);
    const dano = usaDuasMaos && arma.danoVersatil ? arma.danoVersatil : arma.dano;
    const atributo = arma.propriedades.includes('fineza')
      ? ficha.equipamento.escolhasAtributo[nomeArma]
      : (arma.tipo === 'distancia' ? 'destreza' : 'forca');
    const modAtributo = Calculo.modificador(atributos[atributo]);
    return {
      nome: arma.nome,
      dano,
      tipoDano: arma.tipoDano,
      atributo,
      bonusAcerto: Calculo.bonusPericia(modAtributo, true, bonusProficiencia),
      modDano: modAtributo
    };
  });
```

- [ ] **Step 2: Usar a nova CA e incluir armadura/armas no retorno**

No objeto retornado por `construirFichaFinal`, troque `ca: Calculo.caBase(modDestreza),` por `ca,` e
adicione `armadura` e `armas` (logo depois de `pericias,`):

```js
  return {
    nome: ficha.nome.trim(),
    raca: ficha.raca,
    classe: ficha.classe,
    nivel: 1,
    atributos,
    pv: Calculo.pvInicial(classe.dadoDeVida, modConstituicao),
    ca,
    pericias,
    armadura: armaduraEquipada ? armaduraEquipada.nome : null,
    escudo: temEscudo,
    armas,
    iniciativa,
    bonusAtaqueForca,
    bonusAtaqueDestreza,
    cdMagia,
    bonusAtaqueMagico,
    testesResistencia,
    tracosRaciais: raca.tracos,
    habilidadesClasse: classe.habilidades.filter(h => h.nivel <= 1),
    magiasConhecidas: ficha.magiasEscolhidas.map(nome => DADOS_MAGIAS.MAGIAS.find(m => m.nome === nome)),
    historia: ficha.historia.trim(),
    caracteristicasFisicas: ficha.caracteristicasFisicas.trim()
  };
```

- [ ] **Step 3: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(equipamento): ficha final calcula CA e armas a partir do equipamento escolhido"
```

---

## Task 8: Mostrar Equipamento no Resumo (`app.js`)

**Files:**
- Modify: `docs/creator/js/app.js` (função `renderEtapaResumo`)

- [ ] **Step 1: Adicionar o bloco de equipamento**

Em `renderEtapaResumo()`, logo antes da linha `const blocoMagias = ...`, adicione:

```js
  const blocoEquipamento = `
    <h3>Equipamento</h3>
    <p>${dadosFicha.armadura || 'Sem armadura'}${dadosFicha.escudo ? ' + Escudo' : ''}</p>
    <div class="lista-magias-resumo">
      ${dadosFicha.armas.map(arma => `
        <div class="opcao-magia">
          <strong>${arma.nome}</strong>
          <span class="detalhes-magia">${arma.dano} ${arma.tipoDano} · Ataque ${arma.bonusAcerto >= 0 ? '+' : ''}${arma.bonusAcerto} · Dano +${arma.modDano}</span>
        </div>
      `).join('')}
    </div>
  `;
```

- [ ] **Step 2: Inserir no HTML final**

No template de `elementoConteudo.innerHTML`, adicione `${blocoEquipamento}` logo depois de
`<ul>${linhasResistencia}</ul>` e antes de `${blocoMagias}`:

```js
    <h3>Testes de Resistência</h3>
    <ul>${linhasResistencia}</ul>
    ${blocoEquipamento}
    ${blocoMagias}
```

- [ ] **Step 3: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(equipamento): mostra armadura e armas equipadas no Resumo"
```

---

## Task 9: Verificação manual do criador (Playwright)

**Files:** nenhum (só verificação)

- [ ] **Step 1: Subir servidor local**

Run: `cd docs/creator && python -m http.server 8940` (rodar em background / terminal separado)

- [ ] **Step 2: Navegar e preencher um personagem completo via Playwright**

Use as ferramentas MCP do Playwright (`browser_navigate` para `http://localhost:8940/index.html`,
`browser_evaluate` para preencher nome/atributos como nas sessões anteriores) percorrendo a nova ordem:
Raça → Classe (escolha **Guerreiro**) → Atributos → Equipamento → Resumo.

Na etapa Equipamento:
- Confirme que aparecem 2 cartões ("Guerreiro corpo a corpo" e "Guerreiro à distância") com CA prevista.
- Selecione o pacote "Guerreiro corpo a corpo" (Espada Longa + Escudo + Cota de Malha). Como esse pacote
  tem `escudo: true`, o toggle de "duas mãos" **não** deve aparecer (Espada Longa é versátil, mas não dá
  pra empunhar 2 mãos com escudo).
- Clique Avançar sem problema (Espada Longa não tem Fineza, não há seletor de atributo pra preencher).

Na etapa Resumo, tire um screenshot (`browser_take_screenshot`, `fullPage: true`) e confirme visualmente:
- CA calculada bate com `13 (Cota de Malha) + min(mod DES, 2) + 2 (escudo)`.
- Seção "Equipamento" lista "Cota de Malha + Escudo" e "Espada Longa — 1d8 corte · Ataque +X · Dano +Y".

- [ ] **Step 3: Repetir com uma arma de Fineza e versátil sem escudo**

Refaça o fluxo escolhendo **Ladino** → pacote "Duelista" (Rapieira, sem escudo). Confirme que:
- Aparece o seletor "Rapieira — usar Força ou Destreza?" (Rapieira tem `fineza`).
- Tentar avançar sem escolher trava com a mensagem "Escolha Força ou Destreza para toda arma com Fineza."
- Depois de escolher Destreza, avança normalmente e o Resumo mostra o `bonusAcerto`/`modDano` calculados
  com o modificador de Destreza.

Refaça novamente escolhendo **Guerreiro** → pacote "Guerreiro à distância" — não tem escudo mas também
não tem arma versátil (Arco Longo), então nenhum toggle extra deve aparecer. Depois escolha **Bardo** →
pacote "Espadachim" (Espada Longa, sem escudo — essa arma tem `versatil` com `danoVersatil: '1d10'`) e
confirme que o toggle "Empunhar Espada Longa com duas mãos (dano 1d10)" aparece; marque-o e confirme no
Resumo que a arma mostra dano `1d10` em vez de `1d8`.

- [ ] **Step 4: Encerrar o servidor local**

Run: `pkill -f "http.server 8940"`

- [ ] **Step 5: Reportar**

Sem commit nesta task — é só verificação. Se algo não bater com o esperado, volte pra Task 5/6/7 e corrija
antes de seguir pra Task 10.

---

## Task 10: Módulo puro de dados (`dado.js`) no painel

**Files:**
- Create: `src/PainelDed.Api/wwwroot/js/dado.js`
- Test: `src/PainelDed.Api/wwwroot/js/dado.test.js`

- [ ] **Step 1: Escrever o teste que falha**

Crie `src/PainelDed.Api/wwwroot/js/dado.test.js`:

```js
const assert = require('assert');
const Dado = require('./dado.js');

assert.deepStrictEqual(Dado.parseFormula('1d8'), { quantidade: 1, lados: 8 });
assert.deepStrictEqual(Dado.parseFormula('2d6'), { quantidade: 2, lados: 6 });
assert.throws(() => Dado.parseFormula('xyz'), /Fórmula de dano inválida/);

for (let i = 0; i < 200; i++) {
  const valor = Dado.rolar(1, 8);
  assert.ok(valor >= 1 && valor <= 8, `1d8 fora do intervalo: ${valor}`);
}
for (let i = 0; i < 200; i++) {
  const valor = Dado.rolar(2, 6);
  assert.ok(valor >= 2 && valor <= 12, `2d6 fora do intervalo: ${valor}`);
}

for (let i = 0; i < 200; i++) {
  const resultado = Dado.rolarDano('1d8', 3, false);
  assert.strictEqual(resultado.quantidadeDados, 1);
  assert.ok(resultado.dadosRolados >= 1 && resultado.dadosRolados <= 8);
  assert.strictEqual(resultado.total, resultado.dadosRolados + 3);
}

for (let i = 0; i < 200; i++) {
  const resultado = Dado.rolarDano('1d8', 3, true);
  assert.strictEqual(resultado.quantidadeDados, 2, 'crítico deve dobrar a quantidade de dados, não o modificador');
  assert.ok(resultado.dadosRolados >= 2 && resultado.dadosRolados <= 16);
  assert.strictEqual(resultado.total, resultado.dadosRolados + 3);
}

console.log('dado.test.js: OK');
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node src/PainelDed.Api/wwwroot/js/dado.test.js`
Expected: `Error: Cannot find module './dado.js'`

- [ ] **Step 3: Implementar `dado.js`**

Crie `src/PainelDed.Api/wwwroot/js/dado.js` (mesmo padrão dual-export de `docs/creator/js/calculo.js`):

```js
(function (raiz) {
  function parseFormula(formula) {
    const bruta = String(formula).trim();
    const match = /^(\d+)d(\d+)$/.exec(bruta);
    if (!match) {
      throw new Error(`Fórmula de dano inválida: ${formula}`);
    }
    return { quantidade: Number(match[1]), lados: Number(match[2]) };
  }

  function rolar(quantidade, lados) {
    let total = 0;
    for (let i = 0; i < quantidade; i++) {
      total += 1 + Math.floor(Math.random() * lados);
    }
    return total;
  }

  function rolarDano(formula, modDano, critico) {
    const { quantidade, lados } = parseFormula(formula);
    const quantidadeDados = critico ? quantidade * 2 : quantidade;
    const dadosRolados = rolar(quantidadeDados, lados);
    return { total: dadosRolados + modDano, dadosRolados, quantidadeDados, lados, modDano };
  }

  const api = { parseFormula, rolar, rolarDano };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.Dado = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node src/PainelDed.Api/wwwroot/js/dado.test.js`
Expected: `dado.test.js: OK`

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/dado.js src/PainelDed.Api/wwwroot/js/dado.test.js
git commit -m "feat(combate): adiciona modulo puro Dado para rolar dano automaticamente"
```

---

## Task 11: Backend — record `ArmaPersonagem` (`Modelos.cs`)

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`

- [ ] **Step 1: Escrever os testes que falham**

Adicione a `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`, depois do teste
`Personagem_SemMagiasConhecidas_DesserializaComListaNula`:

```csharp
    [Fact]
    public void Personagem_ComArmas_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Personagem(
            "p1",
            "Kess Bramo",
            "Humano",
            "Guerreiro",
            1,
            new AtributosPersonagem(16, 12, 14, 8, 10, 8),
            12,
            16,
            new List<PericiaPersonagem>(),
            Armas: new List<ArmaPersonagem>
            {
                new("Espada Longa", "1d8", "corte", 5, 3),
            });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Single(restaurado!.Armas!);
        Assert.Equal("Espada Longa", restaurado.Armas[0].Nome);
        Assert.Equal("1d8", restaurado.Armas[0].Dano);
        Assert.Equal("corte", restaurado.Armas[0].TipoDano);
        Assert.Equal(5, restaurado.Armas[0].BonusAcerto);
        Assert.Equal(3, restaurado.Armas[0].ModDano);
    }

    [Fact]
    public void Personagem_SemArmas_DesserializaComListaNula()
    {
        // Regressão: fichas exportadas antes desta feature não têm armas no JSON.
        var json = "{\"Id\":\"p1\",\"Nome\":\"Teste\",\"Raca\":\"Humano\",\"Classe\":\"Guerreiro\",\"Nivel\":1," +
            "\"Atributos\":{\"Forca\":10,\"Destreza\":10,\"Constituicao\":10,\"Inteligencia\":10,\"Sabedoria\":10,\"Carisma\":10}," +
            "\"Pv\":10,\"Ca\":10,\"Pericias\":[]}";

        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Null(restaurado!.Armas);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ModelosTestes"`
Expected: erro de compilação — `ArmaPersonagem` e `Personagem.Armas` não existem ainda.

- [ ] **Step 3: Implementar o record e o campo**

Em `src/PainelDed.Api/Campanhas/Modelos.cs`, adicione depois de `MagiaPersonagem`:

```csharp
public record ArmaPersonagem(string Nome, string Dano, string TipoDano, int BonusAcerto, int ModDano);
```

Adicione `List<ArmaPersonagem>? Armas = null` como **último** parâmetro (depois de `SideQuestAtual`) do
record `Personagem`, e como **último** parâmetro (depois de `MagiasConhecidas`) do record
`ImportarPersonagemRequisicao`:

```csharp
public record Personagem(
    string Id,
    string Nome,
    string Raca,
    string Classe,
    int Nivel,
    AtributosPersonagem Atributos,
    int Pv,
    int Ca,
    List<PericiaPersonagem> Pericias,
    string Historia = "",
    string CaracteristicasFisicas = "",
    int? Iniciativa = null,
    int? BonusAtaqueForca = null,
    int? BonusAtaqueDestreza = null,
    int? CdMagia = null,
    int? BonusAtaqueMagico = null,
    List<TesteResistencia>? TestesResistencia = null,
    List<TracoPersonagem>? TracosRaciais = null,
    List<HabilidadeClasse>? HabilidadesClasse = null,
    List<MagiaPersonagem>? MagiasConhecidas = null,
    SideQuestPersonagem? SideQuestAtual = null,
    List<ArmaPersonagem>? Armas = null);

public record ImportarPersonagemRequisicao(
    string Nome,
    string Raca,
    string Classe,
    int Nivel,
    AtributosPersonagem Atributos,
    int Pv,
    int Ca,
    List<PericiaPersonagem> Pericias,
    string Historia = "",
    string CaracteristicasFisicas = "",
    int? Iniciativa = null,
    int? BonusAtaqueForca = null,
    int? BonusAtaqueDestreza = null,
    int? CdMagia = null,
    int? BonusAtaqueMagico = null,
    List<TesteResistencia>? TestesResistencia = null,
    List<TracoPersonagem>? TracosRaciais = null,
    List<HabilidadeClasse>? HabilidadesClasse = null,
    List<MagiaPersonagem>? MagiasConhecidas = null,
    List<ArmaPersonagem>? Armas = null);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ModelosTestes"`
Expected: todos os testes passam, incluindo os dois novos.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
git commit -m "feat(combate): adiciona ArmaPersonagem e campo Armas em Personagem"
```

---

## Task 12: Backend — passthrough no import (`ServicoPersonagens.cs`)

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs:38-59`
- Test: `tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs`

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs`, depois do teste
`ImportarPersonagem_DepoisListarEObter_RetornaFichaCompleta`:

```csharp
    [Fact]
    public async Task ImportarPersonagemComArmas_DepoisObter_RetornaArmas()
    {
        var cliente = _fabrica.CreateClient();
        var campanhaId = await CriarCampanhaDeTesteAsync(cliente);

        var requisicao = new ImportarPersonagemRequisicao(
            "Vex, o Trovador",
            "Humano",
            "Guerreiro",
            1,
            new AtributosPersonagem(16, 12, 14, 8, 10, 8),
            12,
            16,
            new List<PericiaPersonagem>(),
            Armas: new List<ArmaPersonagem>
            {
                new("Espada Longa", "1d8", "corte", 5, 3),
            });

        var importarResposta = await cliente.PostAsJsonAsync($"/api/campanhas/{campanhaId}/personagens/importar", requisicao);
        importarResposta.EnsureSuccessStatusCode();
        var personagem = await importarResposta.Content.ReadFromJsonAsync<Personagem>();

        var obterResposta = await cliente.GetAsync($"/api/campanhas/{campanhaId}/personagens/{personagem!.Id}");
        obterResposta.EnsureSuccessStatusCode();
        var obtido = await obterResposta.Content.ReadFromJsonAsync<Personagem>();

        Assert.Single(obtido!.Armas!);
        Assert.Equal("Espada Longa", obtido.Armas[0].Nome);
        Assert.Equal(5, obtido.Armas[0].BonusAcerto);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ImportarPersonagemComArmas"`
Expected: `Assert.Single` falha porque `obtido.Armas` vem `null` — a requisição não está propagando o campo.

- [ ] **Step 3: Propagar `Armas` no import**

Em `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`, no método `Importar`, troque o fechamento da
chamada ao construtor de `Personagem` (linha `existente?.SideQuestAtual);`) por:

```csharp
        var personagem = new Personagem(
            existente?.Id ?? Guid.NewGuid().ToString("N")[..8],
            requisicao.Nome,
            requisicao.Raca,
            requisicao.Classe,
            requisicao.Nivel,
            requisicao.Atributos,
            requisicao.Pv,
            requisicao.Ca,
            requisicao.Pericias,
            requisicao.Historia,
            requisicao.CaracteristicasFisicas,
            requisicao.Iniciativa,
            requisicao.BonusAtaqueForca,
            requisicao.BonusAtaqueDestreza,
            requisicao.CdMagia,
            requisicao.BonusAtaqueMagico,
            requisicao.TestesResistencia,
            requisicao.TracosRaciais,
            requisicao.HabilidadesClasse,
            requisicao.MagiasConhecidas,
            existente?.SideQuestAtual,
            Armas: requisicao.Armas);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes do projeto passam (não só o novo — rode a suíte inteira pra garantir que nada
quebrou com a mudança de assinatura posicional).

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/ServicoPersonagens.cs tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs
git commit -m "feat(combate): propaga Armas da requisicao de importacao ate o personagem salvo"
```

---

## Task 13: Combate usa as armas do personagem (`combate.js`)

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/combate.js:125-143`

- [ ] **Step 1: Reescrever `acoesDoJogador`**

Substitua o método `acoesDoJogador` inteiro por:

```js
  acoesDoJogador(personagem) {
    const temArmas = Array.isArray(personagem.armas) && personagem.armas.length > 0;
    const acoesArmas = temArmas
      ? personagem.armas.map((arma) => ({
          nome: arma.nome,
          tipo: 'ataque',
          bonusAcerto: arma.bonusAcerto,
          danoDados: arma.dano,
          modDano: arma.modDano,
          tipoDano: arma.tipoDano,
          dano: null,
        }))
      : [
          { nome: 'Ataque corpo a corpo (Força)', tipo: 'ataque', bonusAcerto: personagem.bonusAtaqueForca, dano: null },
          { nome: 'Ataque à distância (Destreza)', tipo: 'ataque', bonusAcerto: personagem.bonusAtaqueDestreza, dano: null },
        ];

    const acoes = [...acoesArmas];
    (personagem.magiasConhecidas || [])
      .filter((m) => m.dano)
      .forEach((m) => {
        acoes.push({
          nome: `✨ ${m.nome}`,
          tipo: m.testeResistencia ? 'resistencia' : 'ataque',
          bonusAcerto: personagem.bonusAtaqueMagico,
          atributoResistencia: m.testeResistencia ? NOME_ATRIBUTO_PARA_CHAVE[m.testeResistencia.toLowerCase()] : null,
          cdMagia: personagem.cdMagia,
          dano: m.dano,
        });
      });
    return acoes;
  },
```

Fichas antigas importadas antes dessa feature não têm `personagem.armas` (fica `undefined`), então
`temArmas` é `false` e o fallback genérico de Força/Destreza continua funcionando — sem quebrar nada
já importado.

- [ ] **Step 2: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/combate.js
git commit -m "feat(combate): acoes do jogador usam as armas equipadas, com fallback generico"
```

---

## Task 14: Dano automático no fluxo de ataque (`combate.js` + `index.html`)

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/combate.js:260-307`
- Modify: `src/PainelDed.Api/wwwroot/index.html:62-70`

- [ ] **Step 1: Carregar `dado.js` antes de `combate.js`**

Em `src/PainelDed.Api/wwwroot/index.html`, adicione a linha do novo script antes de `combate.js` e bump a
versão de `combate.js` pra invalidar cache:

```html
<script src="js/personagens.js?v=3"></script>
<script src="js/dado.js?v=1"></script>
<script src="js/combate.js?v=4"></script>
<script src="js/app.js?v=3"></script>
```

- [ ] **Step 2: Reescrever `criarFluxoAtaque` com rolagem automática**

Substitua o método `criarFluxoAtaque` inteiro por:

```js
  criarFluxoAtaque(acao, atacante, alvo) {
    const container = document.createElement('div');

    const bonus = acao.bonusAcerto ?? 0;
    const linhaAlvo = document.createElement('p');
    linhaAlvo.className = 'detalhes-quest';
    linhaAlvo.textContent = `Ataque +${bonus} vs CA de ${alvo.nome} (${alvo.ca})`;
    container.appendChild(linhaAlvo);

    const campoD20 = document.createElement('input');
    campoD20.type = 'number';
    campoD20.placeholder = 'd20 rolado';
    container.appendChild(campoD20);

    const resultado = document.createElement('p');
    container.appendChild(resultado);

    const detalheDano = document.createElement('p');
    detalheDano.className = 'detalhes-quest';
    detalheDano.hidden = true;
    container.appendChild(detalheDano);

    const campoDano = document.createElement('input');
    campoDano.type = 'number';
    campoDano.placeholder = 'dano rolado';
    campoDano.hidden = true;
    container.appendChild(campoDano);

    const botaoRolarDeNovo = document.createElement('button');
    botaoRolarDeNovo.type = 'button';
    botaoRolarDeNovo.className = 'botao-secundario';
    botaoRolarDeNovo.textContent = '🎲 Rolar de novo';
    botaoRolarDeNovo.hidden = true;
    container.appendChild(botaoRolarDeNovo);

    const botaoAplicar = document.createElement('button');
    botaoAplicar.className = 'botao-rolar';
    botaoAplicar.textContent = 'Aplicar';
    botaoAplicar.hidden = true;
    container.appendChild(botaoAplicar);

    function rolarDanoAutomatico(critico) {
      const resultadoDano = Dado.rolarDano(acao.danoDados, acao.modDano, critico);
      campoDano.value = resultadoDano.total;
      detalheDano.hidden = false;
      const nota = critico ? ' (crítico, dados dobrados)' : '';
      detalheDano.textContent =
        `Dano: rolou ${resultadoDano.dadosRolados} em ${resultadoDano.quantidadeDados}d${resultadoDano.lados}${nota} ` +
        `+ ${resultadoDano.modDano} = ${resultadoDano.total} ${acao.tipoDano || ''}`.trim();
    }

    campoD20.addEventListener('input', () => {
      const valorD20 = Number(campoD20.value);
      const total = valorD20 + bonus;
      const acertou = total >= alvo.ca;
      resultado.textContent = acertou ? `Acertou (total ${total})` : `Errou (total ${total})`;
      resultado.style.color = acertou ? 'var(--cor-sucesso, #5a5)' : 'var(--cor-erro, #c53)';
      campoDano.hidden = !acertou;
      botaoAplicar.hidden = !acertou;
      botaoRolarDeNovo.hidden = !(acertou && acao.danoDados);
      if (acertou && acao.danoDados) {
        rolarDanoAutomatico(valorD20 === 20);
      } else {
        detalheDano.hidden = true;
      }
    });

    botaoRolarDeNovo.addEventListener('click', () => {
      rolarDanoAutomatico(Number(campoD20.value) === 20);
    });

    botaoAplicar.addEventListener('click', () => {
      botaoAplicar.disabled = true; // evita aplicar o mesmo dano duas vezes num clique duplo
      const dano = Number(campoDano.value) || 0;
      this.aplicarDano(alvo, dano);
      this.estado.log.push(`${atacante.nome} acertou ${alvo.nome} com ${acao.nome} (${dano} dano)`);
      this.renderizarCombate();
    });

    return container;
  },
```

Ataques de magia/monstro (`acao.danoDados` indefinido) continuam exatamente como antes: `campoDano` fica
vazio e editável manualmente, `botaoRolarDeNovo` nunca aparece.

- [ ] **Step 3: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/combate.js src/PainelDed.Api/wwwroot/index.html
git commit -m "feat(combate): rola dano de arma automaticamente ao acertar, com critico e re-rolagem"
```

---

## Task 15: Verificação manual do Combate (Playwright)

**Files:** nenhum (só verificação)

- [ ] **Step 1: Rodar a API localmente**

Run (background): `dotnet run --project src/PainelDed.Api`
Aguarde o log indicar a porta (normalmente `http://localhost:5000` ou similar — confira o output).

- [ ] **Step 2: Criar campanha e importar um personagem com armas**

Via Playwright: navegue até a URL local, crie uma campanha de teste, vá na aba Jogadores, use
`browser_file_upload` para importar um JSON de ficha gerado na Task 9 (ou construa um manualmente com
`armas: [{ "nome": "Espada Longa", "dano": "1d8", "tipoDano": "corte", "atributo": "forca",
"bonusAcerto": 5, "modDano": 3 }]`, `pv: 20`, `ca: 16`).

- [ ] **Step 3: Rodar um combate contra qualquer monstro de CD baixa**

Vá na aba Combate, monte o combate (personagem vs. um monstro qualquer da lista), passe o turno pro
jogador se necessário, e:
- Confirme que a ação de ataque disponível se chama "Espada Longa" (não mais "Ataque corpo a corpo
  (Força)").
- Digite um d20 que garanta acerto (ex: 15) — confirme que o campo de dano é preenchido sozinho e o texto
  de detalhe aparece (algo como "Dano: rolou 5 em 1d8 + 3 = 8 corte").
- Clique "🎲 Rolar de novo" e confirme que o valor muda (dentro do range 1d8+3 = 4 a 11).
- Digite `20` no campo do d20 (crítico) e confirme que o detalhe menciona "(crítico, dados dobrados)" e
  que a rolagem usa `2d8` (`quantidadeDados: 2` refletido no texto), não `1d8` dobrado apenas no total.
- Clique Aplicar e confirme que o PV do monstro cai pelo valor mostrado.

- [ ] **Step 4: Confirmar fallback com ficha antiga**

Importe (ou reaproveite) uma ficha JSON exportada **antes** dessa feature (sem campo `armas` — ex.:
`vex-o-trovador.json` se ele não tiver o campo, ou qualquer uma das fixtures em `docs/creator/js/*.json`).
Monte um combate com ela e confirme que as duas ações genéricas "Ataque corpo a corpo (Força)" / "Ataque à
distância (Destreza)" ainda aparecem, com o fluxo manual de digitar o dano funcionando como antes (sem
"🎲 Rolar de novo").

- [ ] **Step 5: Encerrar a API**

Run: pare o processo `dotnet run` iniciado no Step 1.

- [ ] **Step 6: Reportar**

Sem commit — é só verificação. Se algo não bater, volte pra Task 13/14 e corrija antes de considerar a
feature pronta.

---

## Task 16: Publicar no GitHub Pages e push do backend

**Files:** nenhum (deploy/push)

- [ ] **Step 1: Rodar toda a suíte de testes uma última vez**

Run:
```bash
node docs/creator/js/dados.test.js
node docs/creator/js/calculo.test.js
node docs/creator/js/magias.test.js
node src/PainelDed.Api/wwwroot/js/dado.test.js
dotnet test tests/PainelDed.Api.Testes
dotnet test tests/PainelDed.Nucleo.Testes
```
Expected: tudo `OK` / `Passed`.

- [ ] **Step 2: Push**

```bash
git push origin main
```

- [ ] **Step 3: Confirmar publicação do criador**

Aguarde alguns minutos e confirme em `https://jonasmoura247.github.io/rpg-mesa/creator/` que a nova etapa
Equipamento aparece na ordem certa (Raça, Classe, Atributos, Equipamento, [Magias], Resumo).
