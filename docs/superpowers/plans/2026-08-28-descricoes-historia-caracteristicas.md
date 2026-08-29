# Descrições de Raça/Classe + História e Características Físicas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No `/creator`, mostrar uma frase de sabor sobre a raça/classe assim que o jogador seleciona, e adicionar dois campos de texto livre opcionais (História e Características Físicas, até 1000 caracteres cada) na etapa de Resumo, incluídos no `character.json` exportado.

**Architecture:** Extensão pontual do `/creator` já publicado (`docs/creator/`, plano `2026-08-28-criador-de-ficha.md`, já em produção). `dados.js` ganha um campo `descricao` em cada raça/classe. `app.js` exibe essa descrição ao selecionar, adiciona 2 campos ao estado `ficha`, renderiza 2 `<textarea>` na etapa de Resumo (usando o mesmo padrão seguro de setar `.value` via JS, já estabelecido pra `campoNome`, em vez de interpolar no `innerHTML`), e inclui os dois campos no JSON exportado.

**Tech Stack:** JavaScript vanilla (mesmo arquivo `docs/creator/js/app.js` e `docs/creator/js/dados.js` já existentes), CSS. Segue exatamente os padrões já em produção — nenhuma dependência nova.

Atualiza o spec `docs/superpowers/specs/2026-08-28-ficha-personagem-criador-jogadores-design.md` (já editado com a nova forma do `character.json`) e o plano ainda não executado `2026-08-28-importacao-personagem-aba-jogadores.md` (já editado pra receber `historia`/`caracteristicasFisicas` no backend). Este plano só cobre o lado do `/creator`.

---

## File Structure

```
docs/creator/js/dados.js        — adiciona `descricao` a cada entrada de RACAS e CLASSES
docs/creator/js/dados.test.js   — testa que toda raça/classe tem descricao não vazia
docs/creator/js/app.js          — exibe descricao ao selecionar raça/classe; estado + campos de
                                   história/características na etapa de Resumo; inclui no JSON exportado
docs/creator/css/estilo.css     — estilo da descrição, dos textareas e do contador de caracteres
docs/creator/exemplos/*.json    — regeneradas com história/características preenchidas
```

---

### Task 1: `descricao` em cada raça e classe (`dados.js`)

**Files:**
- Modify: `docs/creator/js/dados.js`
- Modify: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Adicionar teste (falhando)**

Adicione a `docs/creator/js/dados.test.js`, antes do `console.log(...)` final:
```js
assert.ok(
  DADOS.RACAS.every(r => typeof r.descricao === 'string' && r.descricao.length > 0),
  'toda raça deve ter descricao não vazia'
);
assert.ok(
  DADOS.CLASSES.every(c => typeof c.descricao === 'string' && c.descricao.length > 0),
  'toda classe deve ter descricao não vazia'
);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: `AssertionError [ERR_ASSERTION]: toda raça deve ter descricao não vazia`

- [ ] **Step 3: Substituir o array `RACAS` inteiro em `dados.js`**

Em `docs/creator/js/dados.js`, substitua o array `RACAS` inteiro por:
```js
  const RACAS = [
    { nome: 'Humano', bonus: { forca: 1, destreza: 1, constituicao: 1, inteligencia: 1, sabedoria: 1, carisma: 1 },
      descricao: 'Adaptáveis e ambiciosos, os humanos são a raça mais numerosa e versátil, com um pouco de talento em tudo.' },
    { nome: 'Anão da Colina', bonus: { constituicao: 2, sabedoria: 1 },
      descricao: 'Anões resistentes e perceptivos, com instintos aguçados forjados em sociedades subterrâneas antigas.' },
    { nome: 'Anão da Montanha', bonus: { constituicao: 2, forca: 2 },
      descricao: 'Anões fortes e habituados à armadura pesada, vindos de fortalezas talhadas na rocha.' },
    { nome: 'Elfo Alto', bonus: { destreza: 2, inteligencia: 1 },
      descricao: 'Elfos graciosos com afinidade natural pela magia arcana e memória precisa.' },
    { nome: 'Elfo da Floresta', bonus: { destreza: 2, sabedoria: 1 },
      descricao: 'Elfos ágeis e furtivos, criados entre as árvores, com sentidos aguçados para a natureza.' },
    { nome: 'Elfo Negro (Drow)', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Elfos de vida subterrânea, ágeis e carismáticos, acostumados à escuridão e à intriga.' },
    { nome: 'Halfling Pés Leves', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Pequenos e discretos, hábeis em passar despercebidos e fazer amizade com estranhos.' },
    { nome: 'Halfling Robusto', bonus: { destreza: 2, constituicao: 1 },
      descricao: 'Halflings resistentes, com constituição mais forte que a média da sua raça.' },
    { nome: 'Draconato', bonus: { forca: 2, carisma: 1 },
      descricao: 'Descendentes de dragões, orgulhosos e imponentes, com um sopro elemental herdado da linhagem.' },
    { nome: 'Gnomo da Floresta', bonus: { inteligencia: 2, destreza: 1 },
      descricao: 'Gnomos curiosos e ágeis, com talento natural para ilusões e comunicação com pequenos animais.' },
    { nome: 'Gnomo das Rochas', bonus: { inteligencia: 2, constituicao: 1 },
      descricao: 'Gnomos inventivos e resistentes, hábeis com mecanismos e engenhocas.' },
    { nome: 'Meio-Elfo', bonus: { carisma: 2 }, escolhaLivre: 2,
      descricao: 'Nascidos entre dois mundos, carismáticos e versáteis, sem se encaixar totalmente em nenhum dos dois.' },
    { nome: 'Meio-Orc', bonus: { forca: 2, constituicao: 1 },
      descricao: 'Fortes e implacáveis em combate, com resistência notável e ímpeto selvagem.' },
    { nome: 'Tiefling', bonus: { carisma: 2, inteligencia: 1 },
      descricao: 'Marcados por uma herança infernal distante, carismáticos e frequentemente incompreendidos.' }
  ];
```

- [ ] **Step 4: Substituir o array `CLASSES` inteiro em `dados.js`**

Substitua o array `CLASSES` inteiro por:
```js
  const CLASSES = [
    { nome: 'Bárbaro', dadoDeVida: 12, escolhas: 2,
      descricao: 'Guerreiro que canaliza fúria primitiva em combate, resistente e devastador corpo a corpo.',
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intimidacao', 'Natureza', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Bardo', dadoDeVida: 8, escolhas: 3, todasPericias: true, periciasElegiveis: [],
      descricao: 'Conjurador versátil que inspira aliados e desarma inimigos através de música, palavras e magia.' },
    { nome: 'Bruxo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador que obtém poder através de um pacto com uma entidade sobrenatural.',
      periciasElegiveis: ['Arcanismo', 'Engano', 'Historia', 'Intimidacao', 'Investigacao', 'Natureza', 'Religiao'] },
    { nome: 'Clérigo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador divino que cura, protege e combate em nome de uma divindade ou ideal.',
      periciasElegiveis: ['Historia', 'Intuicao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Druida', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador ligado à natureza, capaz de assumir formas animais e comandar os elementos.',
      periciasElegiveis: ['Arcanismo', 'Adestramento', 'Intuicao', 'Medicina', 'Natureza', 'Percepcao', 'Religiao', 'Sobrevivencia'] },
    { nome: 'Feiticeiro', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador cujo poder mágico vem de uma origem inata, no sangue ou na alma.',
      periciasElegiveis: ['Arcanismo', 'Engano', 'Intuicao', 'Intimidacao', 'Persuasao', 'Religiao'] },
    { nome: 'Guerreiro', dadoDeVida: 10, escolhas: 2,
      descricao: 'Combatente versátil e treinado, mestre em armas e táticas de batalha.',
      periciasElegiveis: ['Acrobacia', 'Adestramento', 'Atletismo', 'Historia', 'Intuicao', 'Intimidacao', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Ladino', dadoDeVida: 8, escolhas: 4,
      descricao: 'Especialista em furtividade, precisão e golpes certeiros contra alvos desprevenidos.',
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Engano', 'Intuicao', 'Intimidacao', 'Investigacao', 'Percepcao', 'Persuasao', 'Prestidigitacao', 'Furtividade'] },
    { nome: 'Magista', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador erudito que domina a magia arcana através de estudo e um grimório pessoal.',
      periciasElegiveis: ['Arcanismo', 'Historia', 'Intuicao', 'Investigacao', 'Medicina', 'Religiao'] },
    { nome: 'Monge', dadoDeVida: 8, escolhas: 2,
      descricao: 'Guerreiro disciplinado que canaliza energia interior em golpes rápidos e precisos.',
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Historia', 'Intuicao', 'Religiao', 'Furtividade'] },
    { nome: 'Paladino', dadoDeVida: 10, escolhas: 2,
      descricao: 'Guerreiro sagrado ligado por um juramento, combinando força marcial e magia divina.',
      periciasElegiveis: ['Atletismo', 'Intuicao', 'Intimidacao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Patrulheiro', dadoDeVida: 8, escolhas: 3,
      descricao: 'Caçador e explorador habilidoso, especialista em rastreamento, sobrevivência e combate à distância.',
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intuicao', 'Investigacao', 'Natureza', 'Percepcao', 'Furtividade', 'Sobrevivencia'] }
  ];
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 6: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(creator): descricao de sabor para cada raca e classe"
```

---

### Task 2: Exibir a descrição ao selecionar raça

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Incluir a descrição no bloco de bônus da etapa Raça**

Em `docs/creator/js/app.js`, na função `renderEtapaRaca`, troque:
```js
    blocoBonus = `<p class="bonus-raca">Bônus fixo: ${textoBonus(raca.bonus)}</p>`;
```
por:
```js
    blocoBonus = `
      <p class="descricao-opcao">${raca.descricao}</p>
      <p class="bonus-raca">Bônus fixo: ${textoBonus(raca.bonus)}</p>`;
```

- [ ] **Step 2: Verificar manualmente**

Real browser se possível (servidor local em `docs/creator` + Playwright, como nas tasks do plano anterior). Avance até a etapa Raça, selecione qualquer raça e confirme que a frase de descrição aparece acima do "Bônus fixo". Troque de raça e confirme que o texto atualiza. Se não puder rodar navegador, faça leitura cuidadosa do código e avise a limitação.

- [ ] **Step 3: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): exibe descricao da raca ao selecionar"
```

---

### Task 3: Exibir a descrição ao selecionar classe

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Incluir a descrição no template da etapa Classe**

Em `docs/creator/js/app.js`, na função `renderEtapaClasse`, troque:
```js
  elementoConteudo.innerHTML = `
    <h2>Classe</h2>
    <select id="campoClasse">
      <option value="">Selecione uma classe</option>
      ${opcoes}
    </select>
    <p class="dado-vida">${classe ? `Dado de Vida: d${classe.dadoDeVida}` : ''}</p>
    ${blocoPericias}
  `;
```
por:
```js
  elementoConteudo.innerHTML = `
    <h2>Classe</h2>
    <select id="campoClasse">
      <option value="">Selecione uma classe</option>
      ${opcoes}
    </select>
    ${classe ? `<p class="descricao-opcao">${classe.descricao}</p>` : ''}
    <p class="dado-vida">${classe ? `Dado de Vida: d${classe.dadoDeVida}` : ''}</p>
    ${blocoPericias}
  `;
```

- [ ] **Step 2: Verificar manualmente**

Real browser se possível. Avance até a etapa Classe, selecione qualquer classe e confirme que a descrição aparece acima do "Dado de Vida". Troque de classe e confirme que atualiza. Se não puder rodar navegador, faça leitura cuidadosa do código e avise a limitação.

- [ ] **Step 3: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): exibe descricao da classe ao selecionar"
```

---

### Task 4: Campos de História e Características Físicas na etapa de Resumo

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Adicionar os 2 campos ao estado `ficha`**

Em `docs/creator/js/app.js`, troque a declaração de `ficha`:
```js
const ficha = {
  nome: '',
  raca: null,
  bonusEscolhidoMeioElfo: [],
  classe: null,
  atributosBase: { forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 },
  periciasEscolhidas: []
};
```
por:
```js
const ficha = {
  nome: '',
  raca: null,
  bonusEscolhidoMeioElfo: [],
  classe: null,
  atributosBase: { forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 },
  periciasEscolhidas: [],
  historia: '',
  caracteristicasFisicas: ''
};
```

- [ ] **Step 2: Incluir os campos no `character.json` exportado**

Em `construirFichaFinal()`, troque o `return` final:
```js
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
```
por:
```js
  return {
    nome: ficha.nome.trim(),
    raca: ficha.raca,
    classe: ficha.classe,
    nivel: 1,
    atributos,
    pv: Calculo.pvInicial(classe.dadoDeVida, modConstituicao),
    ca: Calculo.caBase(modDestreza),
    pericias,
    historia: ficha.historia.trim(),
    caracteristicasFisicas: ficha.caracteristicasFisicas.trim()
  };
```

- [ ] **Step 3: Renderizar os 2 `<textarea>` na etapa de Resumo**

Em `renderEtapaResumo()`, troque:
```js
  elementoConteudo.innerHTML = `
    <h2>Resumo — ${escaparHtml(dadosFicha.nome)}</h2>
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
```
por:
```js
  elementoConteudo.innerHTML = `
    <h2>Resumo — ${escaparHtml(dadosFicha.nome)}</h2>
    <p>${dadosFicha.raca} · ${dadosFicha.classe} · Nível ${dadosFicha.nivel}</p>
    <div class="destaques">
      <span class="destaque">PV ${dadosFicha.pv}</span>
      <span class="destaque">CA ${dadosFicha.ca}</span>
    </div>
    <h3>Atributos</h3>
    <ul>${linhasAtributos}</ul>
    <h3>Perícias com proficiência</h3>
    <ul>${linhasPericias.length ? linhasPericias : '<li>Nenhuma</li>'}</ul>
    <div class="campo-texto-livre">
      <label for="campoHistoria">História (opcional)</label>
      <textarea id="campoHistoria" maxlength="1000" rows="4" placeholder="Uma breve história do personagem..."></textarea>
      <p class="contador-caracteres" id="contadorHistoria">0/1000</p>
    </div>
    <div class="campo-texto-livre">
      <label for="campoCaracteristicas">Características físicas (opcional)</label>
      <textarea id="campoCaracteristicas" maxlength="1000" rows="4" placeholder="Altura, aparência, marcas..."></textarea>
      <p class="contador-caracteres" id="contadorCaracteristicas">0/1000</p>
    </div>
  `;

  configurarCampoTextoLivre('campoHistoria', 'contadorHistoria', 'historia');
  configurarCampoTextoLivre('campoCaracteristicas', 'contadorCaracteristicas', 'caracteristicasFisicas');
```

Nota: os dois campos são setados via `.value` (função abaixo), não interpolados no `innerHTML` — mesmo padrão já usado pro `campoNome` (evita o problema de interpolar texto livre do usuário dentro de HTML, corrigido antes pro nome do personagem).

- [ ] **Step 4: Adicionar a função `configurarCampoTextoLivre`**

Adicione, logo após a função `renderEtapaResumo` (antes de `baixarFicha`):
```js
function configurarCampoTextoLivre(idCampo, idContador, chaveFicha) {
  const campo = document.getElementById(idCampo);
  const contador = document.getElementById(idContador);
  campo.value = ficha[chaveFicha];
  contador.textContent = `${campo.value.length}/1000`;
  campo.addEventListener('input', () => {
    ficha[chaveFicha] = campo.value;
    contador.textContent = `${campo.value.length}/1000`;
  });
}
```

- [ ] **Step 5: Verificar manualmente o fluxo completo**

Real browser se possível. Complete o assistente até o Resumo, digite um texto em "História" e outro em "Características físicas" (confirme que o contador de caracteres atualiza a cada tecla e trava em 1000). Volte pra etapa Classe e avance de novo pro Resumo — confirme que o texto digitado **não se perde** (o `.value` é reposto a partir de `ficha.historia`/`ficha.caracteristicasFisicas`). Clique em "Baixar minha ficha", abra o JSON baixado e confirme que `historia` e `caracteristicasFisicas` aparecem com o texto digitado. Repita deixando os campos vazios e confirme que o JSON traz `""` em ambos, sem quebrar nada. Se não puder rodar navegador, faça leitura cuidadosa do código e avise a limitação.

- [ ] **Step 6: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): campos de historia e caracteristicas fisicas no resumo"
```

---

### Task 5: CSS dos novos elementos

**Files:**
- Modify: `docs/creator/css/estilo.css`

- [ ] **Step 1: Adicionar as regras ao final do arquivo**

Em `docs/creator/css/estilo.css`, adicione ao final:
```css

.descricao-opcao {
  color: var(--cor-texto-fraco);
  font-size: 0.85rem;
  font-style: italic;
  margin: 0.4rem 0 0.75rem;
}

.campo-texto-livre {
  margin-top: 1.25rem;
}

.campo-texto-livre label {
  display: block;
  color: var(--cor-texto-fraco);
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
}

.campo-texto-livre textarea {
  width: 100%;
  padding: 0.6rem;
  background: var(--cor-fundo);
  border: 1px solid var(--cor-borda);
  border-radius: 0.4rem;
  color: var(--cor-texto);
  font-family: var(--fonte-corpo);
  font-size: 0.9rem;
  resize: vertical;
}

.contador-caracteres {
  text-align: right;
  color: var(--cor-texto-fraco);
  font-size: 0.75rem;
  margin: 0.25rem 0 0;
}
```

- [ ] **Step 2: Verificar manualmente**

Real browser se possível, numa largura estreita (~375px) e numa larga. Confirme: a frase de descrição de raça/classe fica legível e discreta (itálico, tom mais fraco); os textareas têm boa área de toque, respeitam o tema escuro (fundo/borda/texto coerentes com o resto do formulário) e não vazam da largura do card; o contador de caracteres fica alinhado à direita, discreto. Se não puder rodar navegador, faça leitura cuidadosa do CSS e avise a limitação.

- [ ] **Step 3: Commit**

```bash
git add docs/creator/css/estilo.css
git commit -m "feat(creator): estilo da descricao de raca/classe e dos campos de texto livre"
```

---

### Task 6: Teste manual completo + regenerar as fichas de exemplo

**Files:**
- Modify: `docs/creator/exemplos/kess-bramo.json`
- Modify: `docs/creator/exemplos/bran-ferronaz.json`
- Modify: `docs/creator/exemplos/sael-marevalis.json`

- [ ] **Step 1: Rodar os testes automatizados**

Run: `node docs/creator/js/dados.test.js && node docs/creator/js/calculo.test.js`
Expected:
```
dados.test.js (perícias/point buy): OK
calculo.test.js: OK
```

- [ ] **Step 2: Regerar as 3 fichas de exemplo com história e características preenchidas**

Usando um navegador real (Playwright ou similar) contra o `docs/creator/index.html` local, refaça as 3 fichas com os MESMOS atributos/raça/classe/perícias já usados no plano anterior (arquivos atuais em `docs/creator/exemplos/`, usados como referência de raça/classe/perícias/atributos — leia-os antes de começar), preenchendo desta vez também:

- **Kess Bramo** — História: adapte o parágrafo dela em `docs/superpowers/historias/2026-08-28-abertura-porto-mare-alta.md` (foge de dívida de jogo, chegou há poucos dias). Características físicas: livre, coerente com uma ladina.
- **Bran Ferronaz** — História: adapte o parágrafo dele na mesma historia.md (ex-soldado de legião dissolvida). Características físicas: livre, coerente com um anão guerreiro.
- **Sael Marévalis** — História: adapte o parágrafo dele na mesma historia.md (investiga desaparecimentos de pescadores). Características físicas: livre, coerente com um druida ligado ao mar.

Baixe os 3 `character.json` atualizados e substitua o conteúdo dos arquivos correspondentes em `docs/creator/exemplos/`.

- [ ] **Step 3: Conferir e commitar**

Confirme que os 3 arquivos são JSON válido e têm `historia`/`caracteristicasFisicas` não vazios, e que o resto dos dados (atributos, pv, ca, pericias) não mudou em relação à versão anterior.

```bash
git add docs/creator/exemplos/
git commit -m "chore(creator): regenera fichas de exemplo com historia e caracteristicas fisicas"
git push origin main
```
