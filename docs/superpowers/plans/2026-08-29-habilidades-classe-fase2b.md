# Habilidades de Classe por Nível (Fase 2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar as habilidades de classe (resumo mecânico) dos níveis 1 a 5 de cada uma das 12 classes, exibi-las **todas** (1-5, como prévia de progressão) na etapa Classe do `/creator`, e exportar/exibir **só as do nível atual do personagem** (hoje sempre nível 1) no `character.json` e na ficha da aba Jogadores.

**Architecture:** Fase 2b de uma iniciativa maior (Fase 1 = combate, Fase 2a = traços raciais, ambas já concluídas; Fase 3 = magias, depois). Diferente dos traços raciais (sempre nível 1), habilidades de classe **escalam por nível** — por isso os dados guardam o nível de cada habilidade, e a exibição/exportação filtra por `nivel <= personagem.nivel`. A prévia 1-5 na etapa Classe é só informativa (mostra o que o jogador vai ganhar), não afeta o que é exportado.

**Escopo:** só habilidades da classe base (sem subclasses) — quando uma habilidade normalmente "escolhe uma subclasse" (Arquétipo Marcial, Caminho Primitivo, etc.), a entrada aqui só registra que a escolha acontece nesse nível, sem listar as opções de subclasse (fora de escopo, igual já é o caso do resto do app). Só níveis 1-5 — 6-20 ficam para uma fase futura, sob demanda.

**Tech Stack:** Mesmo par de stacks dos planos anteriores. Nenhuma CSS nova é necessária (reaproveita `<h3>`/`<ul>` e `.lista-pericias-ficha`, já estilizados).

---

## File Structure

```
docs/creator/js/dados.js        — adiciona `habilidades` (array de {nome, nivel, descricao}) a cada classe
docs/creator/js/dados.test.js   — testa as habilidades
docs/creator/js/app.js          — exibe prévia 1-5 na etapa Classe; exporta só as do nível atual no character.json

src/PainelDed.Api/Campanhas/Modelos.cs             — HabilidadeClasse + campo HabilidadesClasse
tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
src/PainelDed.Api/Campanhas/ServicoPersonagens.cs  — repassa HabilidadesClasse no Importar
tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
src/PainelDed.Api/wwwroot/js/personagens.js        — exibe habilidades de classe na ficha

docs/creator/exemplos/*.json — regeneradas com habilidadesClasse
```

---

### Task 1: `dados.js` — habilidades de nível 1-5 de cada classe

**Files:**
- Modify: `docs/creator/js/dados.js`
- Modify: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Adicionar teste (falhando)**

Adicione a `docs/creator/js/dados.test.js`, antes do `console.log(...)` final:
```js
assert.ok(
  DADOS.CLASSES.every(c => Array.isArray(c.habilidades) && c.habilidades.length > 0),
  'toda classe deve ter pelo menos 1 habilidade'
);
assert.ok(
  DADOS.CLASSES.every(c => c.habilidades.every(h => h.nivel >= 1 && h.nivel <= 5)),
  'toda habilidade deve ser de nível entre 1 e 5'
);
const guerreiroHabilidades = DADOS.CLASSES.find(c => c.nome === 'Guerreiro');
assert.ok(guerreiroHabilidades.habilidades.some(h => h.nome === 'Ataque Extra' && h.nivel === 5));
const barbaroHabilidades = DADOS.CLASSES.find(c => c.nome === 'Bárbaro');
assert.ok(barbaroHabilidades.habilidades.some(h => h.nome === 'Fúria' && h.nivel === 1));
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: `TypeError: Cannot read properties of undefined (reading 'length')` (`c.habilidades` ainda não existe)

- [ ] **Step 3: Substituir o array `CLASSES` inteiro em `dados.js`**

Em `docs/creator/js/dados.js`, substitua o array `CLASSES` inteiro por:
```js
  const CLASSES = [
    { nome: 'Bárbaro', dadoDeVida: 12, escolhas: 2,
      descricao: 'Guerreiro que canaliza fúria primitiva em combate, resistente e devastador corpo a corpo.',
      atributoConjuracao: null, resistencias: ['forca', 'constituicao'],
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intimidacao', 'Natureza', 'Percepcao', 'Sobrevivencia'],
      habilidades: [
        { nome: 'Fúria', nivel: 1, descricao: 'Usos: 2 por descanso longo. Em fúria: +2 de dano corpo a corpo, resistência a dano de arma comum, não pode conjurar magias.' },
        { nome: 'Defesa sem Armadura', nivel: 1, descricao: 'CA = 10 + modificador de Destreza + modificador de Constituição quando sem armadura e sem escudo.' },
        { nome: 'Ataque Imprudente', nivel: 2, descricao: 'Pode trocar vantagem em ataques corpo a corpo por dar vantagem aos inimigos contra você até seu próximo turno.' },
        { nome: 'Sentido de Perigo', nivel: 2, descricao: 'Vantagem em testes de resistência de Destreza contra efeitos que você consegue ver.' },
        { nome: 'Caminho Primitivo', nivel: 3, descricao: 'Escolhe uma subclasse (Caminho do Bárbaro) que concede habilidades extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' },
        { nome: 'Movimento Rápido', nivel: 5, descricao: 'Deslocamento +3m enquanto não estiver usando armadura pesada.' }
      ] },
    { nome: 'Bardo', dadoDeVida: 8, escolhas: 3, todasPericias: true, periciasElegiveis: [],
      descricao: 'Conjurador versátil que inspira aliados e desarma inimigos através de música, palavras e magia.',
      atributoConjuracao: 'carisma', resistencias: ['destreza', 'carisma'],
      habilidades: [
        { nome: 'Conjuração', nivel: 1, descricao: 'Conjurador completo (Carisma); conhece um número limitado de magias, todas fixas (não precisa preparar).' },
        { nome: 'Inspiração de Bardo', nivel: 1, descricao: 'Ação bônus: concede 1d6 a um aliado para somar num teste, ataque ou resistência. Usos = modificador de Carisma, recarrega em descanso longo.' },
        { nome: 'Truque Mágico de Descanso', nivel: 2, descricao: 'Durante um descanso curto, aliados que gastarem Dados de Vida recuperam pontos de vida extras.' },
        { nome: 'Especialização', nivel: 2, descricao: 'Dobra o bônus de proficiência em duas perícias proficientes à escolha.' },
        { nome: 'Colégio de Bardo', nivel: 3, descricao: 'Escolhe uma subclasse que concede habilidades extras.' },
        { nome: 'Perícia Adicional', nivel: 3, descricao: 'Ganha proficiência em mais três perícias à escolha.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Inspiração de Bardo (d8)', nivel: 5, descricao: 'O dado de Inspiração de Bardo aumenta de 1d6 para 1d8.' },
        { nome: 'Fonte Inesgotável', nivel: 5, descricao: 'Recupera todos os usos de Inspiração de Bardo ao terminar um descanso curto.' }
      ] },
    { nome: 'Bruxo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador que obtém poder através de um pacto com uma entidade sobrenatural.',
      atributoConjuracao: 'carisma', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Arcanismo', 'Engano', 'Historia', 'Intimidacao', 'Investigacao', 'Natureza', 'Religiao'],
      habilidades: [
        { nome: 'Patrono Sobrenatural', nivel: 1, descricao: 'Escolhe a entidade que concede seu poder (subclasse), definindo magias e habilidades extras.' },
        { nome: 'Magia de Pacto', nivel: 1, descricao: 'Conjurador (Carisma) com poucos espaços de magia, mas que recarregam completamente num descanso curto.' },
        { nome: 'Invocações Místicas', nivel: 2, descricao: 'Aprende invocações que concedem benefícios mágicos variados.' },
        { nome: 'Ofício do Pacto', nivel: 3, descricao: 'Escolhe um pacto (arma, corrente, lâmina ou tomo) que concede um benefício especial.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' }
      ] },
    { nome: 'Clérigo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador divino que cura, protege e combate em nome de uma divindade ou ideal.',
      atributoConjuracao: 'sabedoria', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Historia', 'Intuicao', 'Medicina', 'Persuasao', 'Religiao'],
      habilidades: [
        { nome: 'Conjuração', nivel: 1, descricao: 'Conjurador completo (Sabedoria); prepara magias diariamente a partir de toda a lista de Clérigo.' },
        { nome: 'Domínio Divino', nivel: 1, descricao: 'Escolhe um domínio (Vida, Luz, Guerra, Natureza, Tempestade ou Morte) que concede magias e habilidades extras.' },
        { nome: 'Canalizar Divindade', nivel: 2, descricao: '1x por descanso curto ou longo, usa um efeito sobrenatural da sua divindade, incluindo Expulsar Mortos-Vivos.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Destruir Mortos-Vivos', nivel: 5, descricao: 'Ao expulsar mortos-vivos, criaturas com desafio baixo o suficiente são destruídas em vez de apenas expulsas.' }
      ] },
    { nome: 'Druida', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador ligado à natureza, capaz de assumir formas animais e comandar os elementos.',
      atributoConjuracao: 'sabedoria', resistencias: ['inteligencia', 'sabedoria'],
      periciasElegiveis: ['Arcanismo', 'Adestramento', 'Intuicao', 'Medicina', 'Natureza', 'Percepcao', 'Religiao', 'Sobrevivencia'],
      habilidades: [
        { nome: 'Druídico', nivel: 1, descricao: 'Conhece o idioma secreto dos druidas.' },
        { nome: 'Conjuração', nivel: 1, descricao: 'Conjurador completo (Sabedoria); prepara magias diariamente a partir de toda a lista de Druida.' },
        { nome: 'Forma Selvagem', nivel: 2, descricao: 'Pode se transformar em uma besta conhecida, um número de vezes por descanso curto/longo limitado pelo nível e pelo desafio da besta.' },
        { nome: 'Círculo Druídico', nivel: 2, descricao: 'Escolhe uma subclasse que concede magias e habilidades extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Forma Selvagem Melhorada', nivel: 4, descricao: 'Pode assumir formas de besta com desafio e restrições maiores.' }
      ] },
    { nome: 'Feiticeiro', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador cujo poder mágico vem de uma origem inata, no sangue ou na alma.',
      atributoConjuracao: 'carisma', resistencias: ['constituicao', 'carisma'],
      periciasElegiveis: ['Arcanismo', 'Engano', 'Intuicao', 'Intimidacao', 'Persuasao', 'Religiao'],
      habilidades: [
        { nome: 'Origem Mágica', nivel: 1, descricao: 'Escolhe a fonte do seu poder inato (subclasse), concedendo magias e habilidades extras.' },
        { nome: 'Conjuração', nivel: 1, descricao: 'Conjurador completo (Carisma); conhece um número limitado de magias.' },
        { nome: 'Fontes de Feitiçaria', nivel: 2, descricao: 'Ganha Pontos de Feitiçaria, um recurso flexível usado para criar espaços de magia ou alimentar a Metamagia.' },
        { nome: 'Metamagia', nivel: 3, descricao: 'Aprende opções para modificar suas magias (ex: conjurar mais rápido, afetar mais alvos) gastando Pontos de Feitiçaria.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' }
      ] },
    { nome: 'Guerreiro', dadoDeVida: 10, escolhas: 2,
      descricao: 'Combatente versátil e treinado, mestre em armas e táticas de batalha.',
      atributoConjuracao: null, resistencias: ['forca', 'constituicao'],
      periciasElegiveis: ['Acrobacia', 'Adestramento', 'Atletismo', 'Historia', 'Intuicao', 'Intimidacao', 'Percepcao', 'Sobrevivencia'],
      habilidades: [
        { nome: 'Estilo de Combate', nivel: 1, descricao: 'Escolhe uma especialização de combate (ex: Arquearia, Defesa, Duelo) que concede um bônus permanente.' },
        { nome: 'Segundo Fôlego', nivel: 1, descricao: 'Ação bônus: recupera 1d10 + nível em pontos de vida. 1x por descanso curto ou longo.' },
        { nome: 'Ação Surpreendente', nivel: 2, descricao: 'Ganha uma ação adicional no seu turno. 1x por descanso curto ou longo.' },
        { nome: 'Arquétipo Marcial', nivel: 3, descricao: 'Escolhe uma subclasse que concede habilidades extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' }
      ] },
    { nome: 'Ladino', dadoDeVida: 8, escolhas: 4,
      descricao: 'Especialista em furtividade, precisão e golpes certeiros contra alvos desprevenidos.',
      atributoConjuracao: null, resistencias: ['destreza', 'inteligencia'],
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Engano', 'Intuicao', 'Intimidacao', 'Investigacao', 'Percepcao', 'Persuasao', 'Prestidigitacao', 'Furtividade'],
      habilidades: [
        { nome: 'Especialização', nivel: 1, descricao: 'Dobra o bônus de proficiência em duas perícias proficientes à escolha.' },
        { nome: 'Ataque Furtivo', nivel: 1, descricao: '1d6 de dano extra (escala com o nível) quando tem vantagem no ataque ou um aliado está adjacente ao alvo.' },
        { nome: 'Argot de Ladrão', nivel: 1, descricao: 'Conhece uma linguagem secreta de sinais e códigos usada por criminosos.' },
        { nome: 'Ação Ardilosa', nivel: 2, descricao: 'Ação bônus: pode usar Disparada, Desengajar ou Esconder-se.' },
        { nome: 'Arquétipo de Ladrão', nivel: 3, descricao: 'Escolhe uma subclasse que concede habilidades extras.' },
        { nome: 'Esquiva Sobrenatural', nivel: 5, descricao: 'Quando atingido por um ataque que consegue ver, sofre metade do dano em vez de dano total.' }
      ] },
    { nome: 'Magista', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador erudito que domina a magia arcana através de estudo e um grimório pessoal.',
      atributoConjuracao: 'inteligencia', resistencias: ['inteligencia', 'sabedoria'],
      periciasElegiveis: ['Arcanismo', 'Historia', 'Intuicao', 'Investigacao', 'Medicina', 'Religiao'],
      habilidades: [
        { nome: 'Livro de Magias', nivel: 1, descricao: 'Conjurador completo (Inteligência); guarda magias conhecidas num grimório e prepara um número delas por dia.' },
        { nome: 'Recuperação Arcana', nivel: 1, descricao: '1x por dia, num descanso curto, recupera espaços de magia gastos (total igual à metade do nível, arredondado para cima).' },
        { nome: 'Tradição Arcana', nivel: 2, descricao: 'Escolhe uma escola de magia como subclasse, concedendo benefícios extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' }
      ] },
    { nome: 'Monge', dadoDeVida: 8, escolhas: 2,
      descricao: 'Guerreiro disciplinado que canaliza energia interior em golpes rápidos e precisos.',
      atributoConjuracao: null, resistencias: ['forca', 'destreza'],
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Historia', 'Intuicao', 'Religiao', 'Furtividade'],
      habilidades: [
        { nome: 'Defesa sem Armadura', nivel: 1, descricao: 'CA = 10 + modificador de Destreza + modificador de Sabedoria quando sem armadura e sem escudo.' },
        { nome: 'Artes Marciais', nivel: 1, descricao: 'Pode usar Destreza em vez de Força para ataques desarmados e armas de monge; o dano desarmado escala com o nível.' },
        { nome: 'Ki', nivel: 2, descricao: 'Ganha pontos de Ki para alimentar habilidades especiais (Rajada de Golpes, Defesa Paciente, Passo do Vento).' },
        { nome: 'Movimento sem Armadura', nivel: 2, descricao: 'Deslocamento aumenta quando está sem armadura e sem escudo.' },
        { nome: 'Tradição Monástica', nivel: 3, descricao: 'Escolhe uma subclasse que concede habilidades extras.' },
        { nome: 'Desvio de Projéteis', nivel: 3, descricao: 'Pode usar a reação para reduzir o dano de um ataque à distância, às vezes pegando o projétil e arremessando-o de volta.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Queda Lenta', nivel: 4, descricao: 'Pode usar a reação para reduzir o dano de queda.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' },
        { nome: 'Rajada de Golpes Aturdente', nivel: 5, descricao: 'Ao acertar um ataque corpo a corpo, pode gastar 1 ponto de Ki para forçar um teste de resistência de Constituição ou atordoar o alvo.' }
      ] },
    { nome: 'Paladino', dadoDeVida: 10, escolhas: 2,
      descricao: 'Guerreiro sagrado ligado por um juramento, combinando força marcial e magia divina.',
      atributoConjuracao: 'carisma', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Atletismo', 'Intuicao', 'Intimidacao', 'Medicina', 'Persuasao', 'Religiao'],
      habilidades: [
        { nome: 'Sentido Divino', nivel: 1, descricao: 'Detecta a presença de celestiais, corruptores ou mortos-vivos poderosos nas proximidades.' },
        { nome: 'Imposição de Mãos', nivel: 1, descricao: 'Reserva de cura (5 × nível) que pode usar tocando uma criatura para curar pontos de vida.' },
        { nome: 'Estilo de Combate', nivel: 2, descricao: 'Escolhe uma especialização de combate que concede um bônus permanente.' },
        { nome: 'Conjuração', nivel: 2, descricao: 'Conjurador (Carisma) com meia progressão de espaços de magia.' },
        { nome: 'Punição Divina', nivel: 2, descricao: 'Ao acertar um ataque corpo a corpo, pode gastar um espaço de magia para causar dano radiante extra.' },
        { nome: 'Juramento Sagrado', nivel: 3, descricao: 'Escolhe uma subclasse que concede magias e habilidades extras.' },
        { nome: 'Canalizar Divindade', nivel: 3, descricao: '1x por descanso curto ou longo, usa um efeito sobrenatural definido pelo Juramento.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' }
      ] },
    { nome: 'Patrulheiro', dadoDeVida: 8, escolhas: 3,
      descricao: 'Caçador e explorador habilidoso, especialista em rastreamento, sobrevivência e combate à distância.',
      atributoConjuracao: 'sabedoria', resistencias: ['forca', 'destreza'],
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intuicao', 'Investigacao', 'Natureza', 'Percepcao', 'Furtividade', 'Sobrevivencia'],
      habilidades: [
        { nome: 'Inimigo Favorito', nivel: 1, descricao: 'Vantagem em testes de Sabedoria (Sobrevivência) para rastrear um tipo de criatura escolhido, e em testes de Inteligência para lembrar informações sobre ele.' },
        { nome: 'Explorador Nato', nivel: 1, descricao: 'Escolhe um tipo de terreno favorito; ganha benefícios de viagem e +2 em Percepção e Sobrevivência nesse terreno.' },
        { nome: 'Estilo de Combate', nivel: 2, descricao: 'Escolhe uma especialização de combate que concede um bônus permanente.' },
        { nome: 'Conjuração', nivel: 2, descricao: 'Conjurador (Sabedoria) com meia progressão de espaços de magia.' },
        { nome: 'Arquétipo de Patrulheiro', nivel: 3, descricao: 'Escolhe uma subclasse que concede magias e habilidades extras.' },
        { nome: 'Melhoria de Atributo', nivel: 4, descricao: '+2 em um atributo, ou +1 em dois atributos, ou uma Façanha.' },
        { nome: 'Ataque Extra', nivel: 5, descricao: 'Pode atacar duas vezes ao usar a ação Atacar.' }
      ] }
  ];
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(creator): habilidades de nivel 1-5 de cada classe"
```

---

### Task 2: `app.js` — exibir prévia 1-5 na etapa Classe e exportar só as do nível atual

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Exibir a prévia de habilidades na etapa Classe**

Em `docs/creator/js/app.js`, na função `renderEtapaClasse`, troque:
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
por:
```js
  const habilidadesTexto = classe
    ? classe.habilidades.map(h => `<li><strong>Nível ${h.nivel} — ${h.nome}:</strong> ${h.descricao}</li>`).join('')
    : '';

  elementoConteudo.innerHTML = `
    <h2>Classe</h2>
    <select id="campoClasse">
      <option value="">Selecione uma classe</option>
      ${opcoes}
    </select>
    ${classe ? `<p class="descricao-opcao">${classe.descricao}</p>` : ''}
    <p class="dado-vida">${classe ? `Dado de Vida: d${classe.dadoDeVida}` : ''}</p>
    ${classe ? `<h3>Habilidades (Níveis 1-5)</h3><ul>${habilidadesTexto}</ul>` : ''}
    ${blocoPericias}
  `;
```

- [ ] **Step 2: Exportar só as habilidades do nível atual no `character.json`**

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
    pericias,
    iniciativa,
    bonusAtaqueForca,
    bonusAtaqueDestreza,
    cdMagia,
    bonusAtaqueMagico,
    testesResistencia,
    tracosRaciais: raca.tracos,
    historia: ficha.historia.trim(),
    caracteristicasFisicas: ficha.caracteristicasFisicas.trim()
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
    iniciativa,
    bonusAtaqueForca,
    bonusAtaqueDestreza,
    cdMagia,
    bonusAtaqueMagico,
    testesResistencia,
    tracosRaciais: raca.tracos,
    habilidadesClasse: classe.habilidades.filter(h => h.nivel <= 1),
    historia: ficha.historia.trim(),
    caracteristicasFisicas: ficha.caracteristicasFisicas.trim()
  };
```

- [ ] **Step 3: Verificar manualmente**

Real browser se possível (servidor local em `docs/creator` + Playwright, mesma abordagem das tasks anteriores). Avance até a etapa Classe, selecione "Guerreiro" — confirme que aparece "Habilidades (Níveis 1-5)" listando as 6 habilidades (Estilo de Combate/Segundo Fôlego nível 1, Ação Surpreendente nível 2, Arquétipo Marcial nível 3, Melhoria de Atributo nível 4, Ataque Extra nível 5). Complete o assistente e confira, via `construirFichaFinal()` no console ou o JSON baixado, que `habilidadesClasse` traz **só** as 2 habilidades de nível 1 (Estilo de Combate, Segundo Fôlego) — não as 6. Se não puder rodar navegador, faça leitura cuidadosa do código e avise a limitação.

- [ ] **Step 4: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): exibe previa de habilidades 1-5 e exporta as do nivel atual"
```

---

### Task 3: `Modelos.cs` — `HabilidadeClasse` e campo `HabilidadesClasse`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`

- [ ] **Step 1: Escrever o teste (falhando)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`, dentro da classe, antes do `}` final:

```csharp

    [Fact]
    public void Personagem_ComHabilidadesClasse_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Personagem(
            "p1",
            "Bran Ferronaz",
            "Anão da Montanha",
            "Guerreiro",
            1,
            new AtributosPersonagem(17, 12, 17, 8, 12, 9),
            13,
            11,
            new List<PericiaPersonagem>(),
            HabilidadesClasse: new List<HabilidadeClasse>
            {
                new("Estilo de Combate", 1, "Escolhe uma especialização de combate."),
                new("Segundo Fôlego", 1, "Cura 1d10 + nível."),
            });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal(2, restaurado!.HabilidadesClasse!.Count);
        Assert.Equal(1, restaurado.HabilidadesClasse[0].Nivel);
    }

    [Fact]
    public void Personagem_SemHabilidadesClasse_DesserializaComListaNula()
    {
        // Regressão: fichas exportadas antes desta feature (incluindo as 3 fixtures
        // de exemplo já existentes) não têm habilidadesClasse no JSON.
        var json = "{\"Id\":\"p1\",\"Nome\":\"Teste\",\"Raca\":\"Humano\",\"Classe\":\"Guerreiro\",\"Nivel\":1," +
            "\"Atributos\":{\"Forca\":10,\"Destreza\":10,\"Constituicao\":10,\"Inteligencia\":10,\"Sabedoria\":10,\"Carisma\":10}," +
            "\"Pv\":10,\"Ca\":10,\"Pericias\":[]}";

        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Null(restaurado!.HabilidadesClasse);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: erro de build — `CS0246` (`HabilidadeClasse` não encontrado) e `CS1739` (parâmetro nomeado `HabilidadesClasse` não existe em `Personagem`).

- [ ] **Step 3: Adicionar `HabilidadeClasse` e o campo `HabilidadesClasse`**

Em `src/PainelDed.Api/Campanhas/Modelos.cs`, adicione logo após `public record TracoPersonagem(string Nome, string Descricao);`:
```csharp

public record HabilidadeClasse(string Nome, int Nivel, string Descricao);
```

E em **ambos** `Personagem` e `ImportarPersonagemRequisicao`, troque a última linha (que hoje termina em `List<TracoPersonagem>? TracosRaciais = null);`) para adicionar mais um parâmetro final:
```csharp
    List<TracoPersonagem>? TracosRaciais = null,
    List<HabilidadeClasse>? HabilidadesClasse = null);
```
(mantenha todos os parâmetros anteriores exatamente como estão em ambos os records — só adicione esse último parâmetro em cada um.)

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
git commit -m "feat(personagens): campo HabilidadesClasse em Personagem"
```

---

### Task 4: `ServicoPersonagens` — repassar `HabilidadesClasse` no `Importar`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`

**ATENÇÃO:** esse `Importar` já esqueceu de repassar campos novos MAIS DE UMA VEZ neste projeto. Antes de considerar esta task pronta, leia `Modelos.cs` você mesmo e confira a ordem exata dos parâmetros de `Personagem`, um por um, contra a chamada `new Personagem(...)` que você está editando.

- [ ] **Step 1: Escrever o teste (falhando)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`, dentro da classe, antes do `}` final:

```csharp

    [Fact]
    public void Importar_ComHabilidadesClasse_PersisteAsHabilidades()
    {
        var requisicao = RequisicaoDeExemplo() with
        {
            HabilidadesClasse = new List<HabilidadeClasse>
            {
                new("Especialização", 1, "Dobra o bônus de proficiência em duas perícias."),
                new("Ataque Furtivo", 1, "1d6 de dano extra com vantagem."),
            }
        };

        var personagem = _servico.Importar(_campanhaId, requisicao);

        Assert.NotNull(personagem);
        Assert.Equal(2, personagem!.HabilidadesClasse!.Count);
        Assert.Equal("Especialização", personagem.HabilidadesClasse![0].Nome);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ServicoPersonagensTestes"`
Expected: falha — `personagem.HabilidadesClasse` vem `null`, porque `Importar` ainda não repassa esse campo.

- [ ] **Step 3: Atualizar `Importar`**

Em `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`, no `new Personagem(...)` dentro de `Importar`, adicione `requisicao.HabilidadesClasse` como último argumento (depois de `requisicao.TracosRaciais`).

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/ServicoPersonagens.cs tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
git commit -m "feat(personagens): repassa habilidades de classe na importacao"
```

---

### Task 5: `personagens.js` — exibir habilidades de classe na ficha

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/personagens.js`

- [ ] **Step 1: Adicionar o bloco de habilidades em `exibirDetalhe`**

Em `src/PainelDed.Api/wwwroot/js/personagens.js`, na função `exibirDetalhe`, troque:
```js
    if (personagem.historia) {
```
(a primeira e única ocorrência, logo após o bloco de Traços Raciais) por:
```js
    if (personagem.habilidadesClasse && personagem.habilidadesClasse.length > 0) {
      const tituloHabilidades = document.createElement('h4');
      tituloHabilidades.textContent = 'Habilidades de Classe';
      detalhe.appendChild(tituloHabilidades);

      const listaHabilidades = document.createElement('ul');
      listaHabilidades.className = 'lista-pericias-ficha';
      personagem.habilidadesClasse.forEach((habilidade) => {
        const item = document.createElement('li');
        const negrito = document.createElement('strong');
        negrito.textContent = `${habilidade.nome}: `;
        item.appendChild(negrito);
        item.appendChild(document.createTextNode(habilidade.descricao));
        listaHabilidades.appendChild(item);
      });
      detalhe.appendChild(listaHabilidades);
    }

    if (personagem.historia) {
```

- [ ] **Step 2: Verificar sintaxe**

Run: `node --check src/PainelDed.Api/wwwroot/js/personagens.js`
Expected: nenhuma saída.

- [ ] **Step 3: Verificar manualmente**

Real browser se possível (backend real — `dotnet run --project src/PainelDed.Api` — + Playwright). Importe uma ficha gerada na Task 2 deste plano (com `habilidadesClasse` preenchido) e confirme que "Habilidades de Classe" aparece na ficha, com nome em negrito e descrição normal — e que só mostra as habilidades de **nível 1** (ex: Guerreiro deve mostrar só Estilo de Combate e Segundo Fôlego, não as 6 da prévia). Importe também uma ficha antiga (sem esse campo) e confirme que a seção simplesmente não aparece, sem erro. Se não puder rodar navegador, faça leitura cuidadosa do código e avise a limitação.

- [ ] **Step 4: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/personagens.js
git commit -m "feat(personagens): exibe habilidades de classe na ficha"
```

---

### Task 6: Regenerar fichas de exemplo + teste final end-to-end

**Files:**
- Modify: `docs/creator/exemplos/kess-bramo.json`
- Modify: `docs/creator/exemplos/bran-ferronaz.json`
- Modify: `docs/creator/exemplos/sael-marevalis.json`

- [ ] **Step 1: Rodar toda a suíte de testes**

Run: `node docs/creator/js/dados.test.js && node docs/creator/js/calculo.test.js && dotnet test`
Expected: tudo passa.

- [ ] **Step 2: Regerar as 3 fichas de exemplo**

Usando um navegador real (Playwright) contra o `docs/creator/index.html` local, leia os 3 arquivos atuais em `docs/creator/exemplos/` e refaça os 3 com os MESMOS valores mecânicos (raça, classe, atributos, perícias, história, características, combate, testes de resistência, traços raciais — todos devem permanecer idênticos), capturando também `habilidadesClasse`. Salve os 3 JSONs atualizados.

- [ ] **Step 3: Subir o painel e importar as 3 fichas**

Run: `dotnet run --project src/PainelDed.Api`

Com um navegador real, crie uma campanha nova, importe as 3 fichas regeneradas via aba Jogadores, e confirme pra cada uma que "Habilidades de Classe" aparece com **só** as habilidades de nível 1:
- Kess (Ladino): Especialização, Ataque Furtivo, Argot de Ladrão.
- Bran (Guerreiro): Estilo de Combate, Segundo Fôlego.
- Sael (Druida): Druídico, Conjuração.

Confirme também que "Traços Raciais" (Fase 2a), "Combate"/"Testes de Resistência" (Fase 1) e "História"/"Características Físicas" continuam aparecendo normalmente (sem regressão). Pare o servidor ao terminar.

- [ ] **Step 4: Commit**

```bash
git add docs/creator/exemplos/
git commit -m "chore(creator): regenera fichas de exemplo com habilidades de classe"
git push origin main
```
