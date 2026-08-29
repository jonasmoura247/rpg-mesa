# Magias (Fase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um catálogo curado de cantrips e magias de 1º círculo, uma nova etapa do `/creator` onde o jogador escolhe quais magias seu personagem conhece/prepara (respeitando o limite real de cada classe conjuradora no nível 1), e exibir essas magias na ficha da aba Jogadores do painel.

**Architecture:** Segue exatamente o padrão das fases anteriores (spec completo em `docs/superpowers/specs/2026-08-29-magias-fase3-design.md`): o `/creator` calcula tudo uma vez na exportação; backend/painel só armazenam e exibem. Só as 6 classes conjuradoras de nível 1 (Bardo, Bruxo, Clérigo, Druida, Feiticeiro, Magista) ganham a nova etapa — Paladino e Patrulheiro não conjuram no nível 1 (regra oficial), as demais classes não são conjuradoras.

**Tech Stack:** Mesmo par de stacks das fases anteriores.

---

## File Structure

```
docs/creator/js/magias.js        — NOVO: catálogo de magias (cantrips + 1º círculo curados)
docs/creator/js/magias.test.js   — NOVO: testes do catálogo
docs/creator/js/dados.js         — adiciona campo `magias` às 6 classes conjuradoras
docs/creator/js/dados.test.js    — testa o campo `magias`
docs/creator/js/calculo.js       — adiciona `quantidadeMagiasNivel1`
docs/creator/js/calculo.test.js  — testa `quantidadeMagiasNivel1`
docs/creator/js/app.js           — nova etapa Magias (condicional) + exportação `magiasConhecidas`
docs/creator/index.html          — inclui `<script src="js/magias.js">` antes de `app.js`

src/PainelDed.Api/Campanhas/Modelos.cs             — MagiaPersonagem + campo MagiasConhecidas
tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
src/PainelDed.Api/Campanhas/ServicoPersonagens.cs  — repassa MagiasConhecidas no Importar
tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
src/PainelDed.Api/wwwroot/js/personagens.js        — exibe Magias na ficha

docs/creator/exemplos/*.json — regeneradas com magiasConhecidas
```

---

### Task 1: `magias.js` — catálogo de magias (cantrips + 1º círculo)

**Files:**
- Create: `docs/creator/js/magias.js`
- Create: `docs/creator/js/magias.test.js`

- [ ] **Step 1: Criar `docs/creator/js/magias.js`**

```js
(function (global) {
  const MAGIAS = [
    // ===== CANTRIPS (círculo 0) =====
    { nome: 'Golpe Verbal', circulo: 0, escola: 'Encantamento', classes: ['Bardo'],
      tempoConjuracao: '1 ação', alcance: '18 metros', duracao: 'Instantânea', componentes: 'V',
      descricao: 'Insulto mágico contra uma criatura que você consiga ver. O alvo faz um teste de resistência de Sabedoria.',
      dano: '1d4 de dano psíquico', testeResistencia: 'Sabedoria' },
    { nome: 'Mãos Mágicas', circulo: 0, escola: 'Conjuração', classes: ['Bardo', 'Bruxo', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: '9 metros', duracao: '1 minuto', componentes: 'V, S',
      descricao: 'Cria uma mão espectral flutuante que pode manipular objetos leves, abrir portas destrancadas ou guardar/pegar itens.',
      dano: null, testeResistencia: null },
    { nome: 'Prestidigitação', circulo: 0, escola: 'Transmutação', classes: ['Bardo', 'Bruxo', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: '3 metros', duracao: 'Até 1 hora', componentes: 'V, S',
      descricao: 'Cria um pequeno efeito mágico sensorial: uma faísca, um cheiro, limpar ou sujar um objeto pequeno, acender ou apagar uma vela.',
      dano: null, testeResistencia: null },
    { nome: 'Luz', circulo: 0, escola: 'Evocação', classes: ['Bardo', 'Clérigo', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: 'Toque', duracao: '1 hora', componentes: 'V, M',
      descricao: 'Um objeto tocado passa a emitir luz forte num raio de 6 metros e luz fraca por mais 6 metros.',
      dano: null, testeResistencia: null },
    { nome: 'Ilusão Menor', circulo: 0, escola: 'Ilusão', classes: ['Bardo', 'Bruxo', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: '9 metros', duracao: '1 minuto', componentes: 'S, M',
      descricao: 'Cria um som ou uma imagem ilusória silenciosa do tamanho de um cubo de 1,5 metro, que não se move.',
      dano: null, testeResistencia: null },
    { nome: 'Reparo', circulo: 0, escola: 'Transmutação', classes: ['Bardo', 'Clérigo', 'Druida', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 minuto', alcance: 'Toque', duracao: 'Instantânea', componentes: 'V, S, M',
      descricao: 'Repara uma única quebra ou rasgo em um objeto tocado (não afeta criaturas ou objetos mágicos/construídos).',
      dano: null, testeResistencia: null },
    { nome: 'Toque Gélido', circulo: 0, escola: 'Necromancia', classes: ['Bruxo', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: '36 metros', duracao: '1 rodada', componentes: 'V, S',
      descricao: 'Uma mão espectral ataca o alvo à distância (ataque de magia). Enquanto durar, o alvo não recupera pontos de vida.',
      dano: '1d8 de dano necrótico', testeResistencia: null },
    { nome: 'Chama Sagrada', circulo: 0, escola: 'Evocação', classes: ['Clérigo'],
      tempoConjuracao: '1 ação', alcance: '18 metros', duracao: 'Instantânea', componentes: 'V, S',
      descricao: 'Fogo divino desce sobre uma criatura que você consegue ver. O alvo não ganha benefício de cobertura para este teste.',
      dano: '1d8 de dano radiante', testeResistencia: 'Destreza' },
    { nome: 'Orientação', circulo: 0, escola: 'Adivinhação', classes: ['Clérigo', 'Druida'],
      tempoConjuracao: '1 ação', alcance: 'Toque', duracao: 'Concentração, até 1 minuto', componentes: 'V, S',
      descricao: 'Toca uma criatura disposta; ela pode somar 1d4 a um teste de habilidade à sua escolha antes do fim da magia.',
      dano: null, testeResistencia: null },
    { nome: 'Taumaturgia', circulo: 0, escola: 'Transmutação', classes: ['Clérigo'],
      tempoConjuracao: '1 ação', alcance: '9 metros', duracao: 'Até 1 minuto', componentes: 'V',
      descricao: 'Cria um entre vários efeitos sobrenaturais menores: voz ampliada, portas se abrem ou fecham sozinhas, luzes tremulam.',
      dano: null, testeResistencia: null },
    { nome: 'Chicote de Espinhos', circulo: 0, escola: 'Transmutação', classes: ['Druida'],
      tempoConjuracao: '1 ação', alcance: '9 metros', duracao: 'Instantânea', componentes: 'V, S, M',
      descricao: 'Um chicote de espinhos golpeia o alvo (ataque de magia) e pode puxar a criatura atingida até 3 metros mais perto de você.',
      dano: '1d6 de dano perfurante', testeResistencia: null },
    { nome: 'Produzir Chama', circulo: 0, escola: 'Conjuração', classes: ['Druida'],
      tempoConjuracao: '1 ação', alcance: 'Pessoal', duracao: '10 minutos', componentes: 'V, S',
      descricao: 'Uma chama aparece na sua mão, iluminando como uma tocha, e pode ser arremessada contra um alvo (ataque de magia).',
      dano: '1d8 de dano de fogo', testeResistencia: null },
    { nome: 'Raio de Fogo', circulo: 0, escola: 'Evocação', classes: ['Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: '36 metros', duracao: 'Instantânea', componentes: 'V, S',
      descricao: 'Um raio de fogo dispara em direção a uma criatura ou objeto ao alcance (ataque de magia).',
      dano: '1d10 de dano de fogo', testeResistencia: null },
    { nome: 'Raio Congelante', circulo: 0, escola: 'Evocação', classes: ['Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: '18 metros', duracao: 'Instantânea', componentes: 'V, S',
      descricao: 'Um raio de luz azul-branca ataca o alvo (ataque de magia). O deslocamento do alvo é reduzido em 3 metros até o início do seu próximo turno.',
      dano: '1d8 de dano de frio', testeResistencia: null },
    { nome: 'Choque Arcano', circulo: 0, escola: 'Evocação', classes: ['Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: 'Toque', duracao: 'Instantânea', componentes: 'V, S',
      descricao: 'Um golpe elétrico atinge o alvo (ataque de magia, com vantagem se o alvo estiver usando armadura metálica). O alvo não pode usar reações até o início do seu próximo turno.',
      dano: '1d8 de dano elétrico', testeResistencia: null },

    // ===== MAGIAS DE 1º CÍRCULO (círculo 1) =====
    { nome: 'Detectar Magia', circulo: 1, escola: 'Adivinhação', classes: ['Bardo', 'Clérigo', 'Druida', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação (ritual)', alcance: 'Pessoal', duracao: 'Concentração, até 10 minutos', componentes: 'V, S',
      descricao: 'Você sente a presença de magia num raio de 9 metros ao seu redor.',
      dano: null, testeResistencia: null },
    { nome: 'Identificar', circulo: 1, escola: 'Adivinhação', classes: ['Bardo', 'Magista'],
      tempoConjuracao: '1 minuto (ritual)', alcance: 'Toque', duracao: 'Instantânea', componentes: 'V, S, M',
      descricao: 'Revela as propriedades mágicas de um objeto ou criatura tocada.',
      dano: null, testeResistencia: null },
    { nome: 'Encantar Pessoa', circulo: 1, escola: 'Encantamento', classes: ['Bardo', 'Bruxo', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: '9 metros', duracao: '1 hora', componentes: 'V, S',
      descricao: 'Tenta enfeitiçar um humanoide que você consegue ver, fazendo-o te ver como um amigo confiável.',
      dano: null, testeResistencia: 'Sabedoria' },
    { nome: 'Compreender Idiomas', circulo: 1, escola: 'Adivinhação', classes: ['Bardo', 'Bruxo', 'Magista'],
      tempoConjuracao: '1 ação (ritual)', alcance: 'Pessoal', duracao: '1 hora', componentes: 'V, S, M',
      descricao: 'Você compreende o significado literal de qualquer língua falada ou escrita que ouvir ou ler enquanto durar a magia.',
      dano: null, testeResistencia: null },
    { nome: 'Servo Invisível', circulo: 1, escola: 'Conjuração', classes: ['Bardo', 'Bruxo', 'Magista'],
      tempoConjuracao: '1 ação (ritual)', alcance: '18 metros', duracao: '1 hora', componentes: 'V, S, M',
      descricao: 'Cria uma força invisível servil que pode carregar, limpar, buscar objetos e realizar tarefas simples sob seu comando.',
      dano: null, testeResistencia: null },
    { nome: 'Sono', circulo: 1, escola: 'Encantamento', classes: ['Bardo', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: '27 metros', duracao: '1 minuto', componentes: 'V, S, M',
      descricao: 'Faz criaturas num raio de 6 metros adormecerem, começando pela de menor PV atual, até um total de 5d8 pontos de vida cobertos.',
      dano: null, testeResistencia: null },
    { nome: 'Cura de Ferimentos', circulo: 1, escola: 'Evocação', classes: ['Bardo', 'Clérigo', 'Druida'],
      tempoConjuracao: '1 ação', alcance: 'Toque', duracao: 'Instantânea', componentes: 'V, S',
      descricao: 'Uma criatura tocada recupera 1d8 + o modificador do seu atributo de conjuração em pontos de vida.',
      dano: null, testeResistencia: null },
    { nome: 'Palavra de Cura', circulo: 1, escola: 'Evocação', classes: ['Bardo', 'Clérigo'],
      tempoConjuracao: '1 ação bônus', alcance: '18 metros', duracao: 'Instantânea', componentes: 'V',
      descricao: 'Uma criatura à distância que você consegue ver recupera 1d4 + o modificador do seu atributo de conjuração em pontos de vida.',
      dano: null, testeResistencia: null },
    { nome: 'Repreensão Infernal', circulo: 1, escola: 'Evocação', classes: ['Bruxo'],
      tempoConjuracao: '1 reação', alcance: '18 metros', duracao: 'Instantânea', componentes: 'V, S',
      descricao: 'Conjurada como reação ao sofrer dano de uma criatura a até 18 metros; chamas infernais cercam o alvo.',
      dano: '2d10 de dano de fogo (metade se passar no teste)', testeResistencia: 'Destreza' },
    { nome: 'Retirada Rápida', circulo: 1, escola: 'Transmutação', classes: ['Bruxo', 'Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação bônus', alcance: 'Pessoal', duracao: 'Concentração, até 10 minutos', componentes: 'V, S',
      descricao: 'Seu deslocamento aumenta em 9 metros; a cada turno enquanto durar você pode usar uma ação bônus para Disparada.',
      dano: null, testeResistencia: null },
    { nome: 'Marca das Bruxas', circulo: 1, escola: 'Evocação', classes: ['Bruxo'],
      tempoConjuracao: '1 ação', alcance: '9 metros', duracao: 'Concentração, até 1 minuto', componentes: 'V, S, M',
      descricao: 'Um filete de energia elétrica atinge o alvo (ataque de magia). Enquanto mantiver a concentração no mesmo alvo, pode causar dano adicional em cada um dos seus turnos.',
      dano: '1d12 de dano elétrico ao acertar, mais 1d12 por turno mantendo a concentração', testeResistencia: null },
    { nome: 'Bênção', circulo: 1, escola: 'Encantamento', classes: ['Clérigo'],
      tempoConjuracao: '1 ação', alcance: '9 metros', duracao: 'Concentração, até 1 minuto', componentes: 'V, S, M',
      descricao: 'Até três criaturas à sua escolha somam 1d4 a testes de ataque e testes de resistência enquanto durar a magia.',
      dano: null, testeResistencia: null },
    { nome: 'Comando', circulo: 1, escola: 'Encantamento', classes: ['Clérigo'],
      tempoConjuracao: '1 ação', alcance: '18 metros', duracao: '1 rodada', componentes: 'V',
      descricao: 'Uma criatura que você consegue ver deve obedecer uma única palavra de comando simples no seu próximo turno.',
      dano: null, testeResistencia: 'Sabedoria' },
    { nome: 'Escudo da Fé', circulo: 1, escola: 'Abjuração', classes: ['Clérigo'],
      tempoConjuracao: '1 ação bônus', alcance: '18 metros', duracao: 'Concentração, até 10 minutos', componentes: 'V, S, M',
      descricao: 'Um campo protetor circunda uma criatura escolhida, concedendo +2 na Classe de Armadura enquanto durar.',
      dano: null, testeResistencia: null },
    { nome: 'Proteção contra o Bem e o Mal', circulo: 1, escola: 'Abjuração', classes: ['Clérigo'],
      tempoConjuracao: '1 ação', alcance: 'Toque', duracao: 'Concentração, até 10 minutos', componentes: 'V, S, M',
      descricao: 'Protege uma criatura tocada contra certos tipos de criaturas (aberrações, corruptores, elementais, fadas, mortos-vivos): impede que sejam encantadas, amedrontadas ou possuídas por elas.',
      dano: null, testeResistencia: null },
    { nome: 'Santuário', circulo: 1, escola: 'Abjuração', classes: ['Clérigo'],
      tempoConjuracao: '1 ação bônus', alcance: '9 metros', duracao: '1 minuto', componentes: 'V, S, M',
      descricao: 'Protege uma criatura escolhida; qualquer criatura hostil deve fazer um teste de resistência antes de atacá-la diretamente, ou deve escolher outro alvo.',
      dano: null, testeResistencia: 'Sabedoria' },
    { nome: 'Amizade com Animais', circulo: 1, escola: 'Encantamento', classes: ['Druida'],
      tempoConjuracao: '1 ação', alcance: '9 metros', duracao: '24 horas', componentes: 'V, S, M',
      descricao: 'Convence uma besta de que você não é uma ameaça; se ela falhar, fica amistosa em relação a você pela duração.',
      dano: null, testeResistencia: 'Sabedoria' },
    { nome: 'Névoa Obscurecente', circulo: 1, escola: 'Conjuração', classes: ['Druida'],
      tempoConjuracao: '1 ação', alcance: '36 metros', duracao: 'Concentração, até 1 hora', componentes: 'V, S, M',
      descricao: 'Cria uma esfera de névoa num raio de 6 metros que obscurece totalmente a visão de quem está dentro dela.',
      dano: null, testeResistencia: null },
    { nome: 'Enredar', circulo: 1, escola: 'Conjuração', classes: ['Druida'],
      tempoConjuracao: '1 ação', alcance: '27 metros', duracao: 'Concentração, até 1 minuto', componentes: 'V, S',
      descricao: 'Plantas rasteiras e vinhas brotam numa área de 6 metros; criaturas na área ficam agarradas se falharem no teste, e impedidas enquanto agarradas.',
      dano: null, testeResistencia: 'Força' },
    { nome: 'Falar com Animais', circulo: 1, escola: 'Adivinhação', classes: ['Druida'],
      tempoConjuracao: '1 ação (ritual)', alcance: 'Pessoal', duracao: '10 minutos', componentes: 'V, S',
      descricao: 'Você ganha a capacidade de compreender e se comunicar verbalmente com bestas enquanto durar a magia.',
      dano: null, testeResistencia: null },
    { nome: 'Toque Trovejante', circulo: 1, escola: 'Evocação', classes: ['Druida'],
      tempoConjuracao: '1 ação', alcance: 'Pessoal (cubo de 4,5 metros)', duracao: 'Instantânea', componentes: 'V, S',
      descricao: 'Uma onda de força trovejante se expande a partir de você, empurrando criaturas afetadas 3 metros para longe.',
      dano: '2d8 de dano de trovão (metade se passar no teste)', testeResistencia: 'Constituição' },
    { nome: 'Proteção contra Venenos', circulo: 1, escola: 'Abjuração', classes: ['Druida'],
      tempoConjuracao: '1 ação', alcance: 'Toque', duracao: '1 hora', componentes: 'V, S, M',
      descricao: 'Neutraliza qualquer veneno em uma criatura tocada e concede vantagem em testes de resistência contra veneno enquanto durar.',
      dano: null, testeResistencia: null },
    { nome: 'Mísseis Mágicos', circulo: 1, escola: 'Evocação', classes: ['Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: '36 metros', duracao: 'Instantânea', componentes: 'V, S',
      descricao: 'Cria três dardos de energia mágica que acertam automaticamente, sem precisar de teste de ataque.',
      dano: '1d4+1 de dano de força por dardo (3 dardos)', testeResistencia: null },
    { nome: 'Escudo Arcano', circulo: 1, escola: 'Abjuração', classes: ['Feiticeiro', 'Magista'],
      tempoConjuracao: '1 reação', alcance: 'Pessoal', duracao: '1 rodada', componentes: 'V, S',
      descricao: 'Conjurada como reação a ser atingido por um ataque; concede +5 na Classe de Armadura até o início do seu próximo turno, inclusive contra o ataque que a desencadeou.',
      dano: null, testeResistencia: null },
    { nome: 'Queda Suave', circulo: 1, escola: 'Transmutação', classes: ['Feiticeiro', 'Magista'],
      tempoConjuracao: '1 reação', alcance: '18 metros', duracao: '1 minuto', componentes: 'V, M',
      descricao: 'A velocidade de queda de até cinco criaturas que estejam caindo é bastante reduzida, evitando dano de queda.',
      dano: null, testeResistencia: null },
    { nome: 'Mãos em Chamas', circulo: 1, escola: 'Evocação', classes: ['Feiticeiro', 'Magista'],
      tempoConjuracao: '1 ação', alcance: 'Pessoal (cone de 4,5 metros)', duracao: 'Instantânea', componentes: 'V, S',
      descricao: 'Um lampejo de fogo se espalha num cone a partir das suas mãos estendidas.',
      dano: '3d6 de dano de fogo (metade se passar no teste)', testeResistencia: 'Destreza' }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MAGIAS };
  } else {
    global.DADOS_MAGIAS = { MAGIAS };
  }
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 2: Criar `docs/creator/js/magias.test.js`**

```js
const assert = require('assert');
const { MAGIAS } = require('./magias.js');

const CLASSES_CONJURADORAS = ['Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Magista'];

assert.ok(Array.isArray(MAGIAS) && MAGIAS.length > 0, 'MAGIAS deve ser um array não vazio');

assert.ok(
  MAGIAS.every(m => m.circulo === 0 || m.circulo === 1),
  'toda magia deve ser círculo 0 (cantrip) ou 1'
);

assert.ok(
  MAGIAS.every(m => Array.isArray(m.classes) && m.classes.length > 0),
  'toda magia deve ter ao menos 1 classe'
);

assert.ok(
  MAGIAS.every(m => m.classes.every(c => CLASSES_CONJURADORAS.includes(c))),
  'toda classe listada numa magia deve ser uma das 6 classes conjuradoras de nível 1'
);

assert.ok(
  MAGIAS.every(m => typeof m.nome === 'string' && m.nome.length > 0),
  'toda magia deve ter nome'
);

CLASSES_CONJURADORAS.forEach(classe => {
  const cantrips = MAGIAS.filter(m => m.circulo === 0 && m.classes.includes(classe));
  const nivel1 = MAGIAS.filter(m => m.circulo === 1 && m.classes.includes(classe));
  assert.ok(cantrips.length >= 2, `${classe} deve ter ao menos 2 cantrips no catálogo`);
  assert.ok(nivel1.length >= 2, `${classe} deve ter ao menos 2 magias de 1º círculo no catálogo`);
});

const misseisMagicos = MAGIAS.find(m => m.nome === 'Mísseis Mágicos');
assert.ok(misseisMagicos && !misseisMagicos.classes.includes('Bruxo'), 'Mísseis Mágicos não deve estar disponível para Bruxo (não é da lista de magias do Bruxo)');

const repreensaoInfernal = MAGIAS.find(m => m.nome === 'Repreensão Infernal');
assert.ok(repreensaoInfernal && repreensaoInfernal.classes.length === 1 && repreensaoInfernal.classes[0] === 'Bruxo', 'Repreensão Infernal deve ser exclusiva do Bruxo no catálogo');

console.log('magias.test.js: OK');
```

- [ ] **Step 3: Rodar o teste**

Run: `node docs/creator/js/magias.test.js`
Expected: `magias.test.js: OK`

- [ ] **Step 4: Incluir o script no `index.html`**

Em `docs/creator/index.html`, adicione `<script src="js/magias.js"></script>` imediatamente antes da tag `<script src="js/dados.js">` (ou logo após, na mesma ordem relativa — o importante é que `magias.js` carregue antes de `app.js`, que vai usá-lo). Leia o arquivo primeiro para ver a ordem exata das tags `<script>` existentes.

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/magias.js docs/creator/js/magias.test.js docs/creator/index.html
git commit -m "feat(creator): catalogo de magias (cantrips e 1o circulo)"
```

---

### Task 2: `dados.js` + `calculo.js` — campo `magias` por classe e cálculo de quantidade

**Files:**
- Modify: `docs/creator/js/dados.js`
- Modify: `docs/creator/js/dados.test.js`
- Modify: `docs/creator/js/calculo.js`
- Modify: `docs/creator/js/calculo.test.js`

- [ ] **Step 1: Adicionar teste (falhando) em `dados.test.js`**

Adicione a `docs/creator/js/dados.test.js`, antes do `console.log(...)` final:
```js
const CLASSES_CONJURADORAS_NIVEL1 = ['Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Magista'];
DADOS.CLASSES.forEach(c => {
  if (CLASSES_CONJURADORAS_NIVEL1.includes(c.nome)) {
    assert.ok(c.magias, `${c.nome} deve ter o campo magias (é conjuradora de nível 1)`);
    assert.ok(c.magias.cantripsConhecidos >= 1, `${c.nome}.magias.cantripsConhecidos deve ser >= 1`);
    assert.ok(c.magias.tipo === 'fixo' || c.magias.tipo === 'preparado', `${c.nome}.magias.tipo deve ser 'fixo' ou 'preparado'`);
    if (c.magias.tipo === 'fixo') {
      assert.ok(c.magias.magiasConhecidasFixo >= 1, `${c.nome}.magias.magiasConhecidasFixo deve ser >= 1 quando tipo é fixo`);
    }
  } else {
    assert.ok(!c.magias, `${c.nome} não deve ter o campo magias (não conjura no nível 1)`);
  }
});
const bardo = DADOS.CLASSES.find(c => c.nome === 'Bardo');
assert.strictEqual(bardo.magias.cantripsConhecidos, 2);
assert.strictEqual(bardo.magias.tipo, 'fixo');
assert.strictEqual(bardo.magias.magiasConhecidasFixo, 4);
const clerigo = DADOS.CLASSES.find(c => c.nome === 'Clérigo');
assert.strictEqual(clerigo.magias.tipo, 'preparado');
const paladino = DADOS.CLASSES.find(c => c.nome === 'Paladino');
assert.ok(!paladino.magias, 'Paladino não conjura no nível 1, não deve ter magias');
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: falha no primeiro assert (`c.magias` é `undefined` para o Bardo).

- [ ] **Step 3: Adicionar o campo `magias` às 6 classes conjuradoras em `dados.js`**

No array `CLASSES` de `docs/creator/js/dados.js`, adicione a propriedade `magias` a estas 6 classes (mantendo todas as outras propriedades já existentes intactas — só adicione, não reescreva o objeto inteiro):

Bardo: `magias: { cantripsConhecidos: 2, tipo: 'fixo', magiasConhecidasFixo: 4 },`
Bruxo: `magias: { cantripsConhecidos: 2, tipo: 'fixo', magiasConhecidasFixo: 2 },`
Clérigo: `magias: { cantripsConhecidos: 3, tipo: 'preparado' },`
Druida: `magias: { cantripsConhecidos: 2, tipo: 'preparado' },`
Feiticeiro: `magias: { cantripsConhecidos: 4, tipo: 'fixo', magiasConhecidasFixo: 2 },`
Magista: `magias: { cantripsConhecidos: 3, tipo: 'preparado' },`

Guerreiro, Ladino, Monge, Bárbaro, Paladino e Patrulheiro NÃO recebem esse campo.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Adicionar teste (falhando) em `calculo.test.js`**

Adicione a `docs/creator/js/calculo.test.js`, antes do `console.log(...)` final:
```js
assert.strictEqual(Calculo.quantidadeMagiasNivel1({ tipo: 'fixo', magiasConhecidasFixo: 4 }, 3), 4);
assert.strictEqual(Calculo.quantidadeMagiasNivel1({ tipo: 'preparado' }, 3), 4);
assert.strictEqual(Calculo.quantidadeMagiasNivel1({ tipo: 'preparado' }, -1), 1);
assert.strictEqual(Calculo.quantidadeMagiasNivel1({ tipo: 'preparado' }, 0), 1);
```

- [ ] **Step 6: Rodar e confirmar que falha**

Run: `node docs/creator/js/calculo.test.js`
Expected: `TypeError: Calculo.quantidadeMagiasNivel1 is not a function`

- [ ] **Step 7: Implementar `quantidadeMagiasNivel1` em `calculo.js`**

Adicione a função em `docs/creator/js/calculo.js`:
```js
function quantidadeMagiasNivel1(infoMagiasClasse, modAtributoConjuracao) {
  if (infoMagiasClasse.tipo === 'fixo') {
    return infoMagiasClasse.magiasConhecidasFixo;
  }
  return Math.max(1, modAtributoConjuracao + 1);
}
```
E adicione `quantidadeMagiasNivel1` ao objeto exportado (tanto no branch `module.exports` quanto no `window.Calculo`, seguindo o padrão já usado pelas outras funções do arquivo).

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `node docs/creator/js/calculo.test.js`
Expected: `calculo.test.js: OK`

- [ ] **Step 9: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js docs/creator/js/calculo.js docs/creator/js/calculo.test.js
git commit -m "feat(creator): campo magias por classe e calculo de quantidade nivel 1"
```

---

### Task 3: `app.js` — nova etapa Magias (condicional) + exportação

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Adicionar `magiasEscolhidas` ao estado `ficha`**

Localize a declaração do objeto `ficha` em `docs/creator/js/app.js` e adicione o campo `magiasEscolhidas: []` (mantendo todos os campos já existentes: `nome`, `raca`, `bonusEscolhidoMeioElfo`, `classe`, `atributosBase`, `periciasEscolhidas`, `historia`, `caracteristicasFisicas`).

- [ ] **Step 2: Tornar a lista de etapas dinâmica em função da classe**

Leia a estrutura atual de controle de etapas em `app.js` (a função que decide qual etapa renderizar, provavelmente uma variável `etapaAtual` numérica e uma função `renderEtapaAtual()`/`avancar()`/`voltar()` com um `switch` ou array de nomes de etapa). A etapa Magias só deve aparecer quando a classe escolhida tiver `magias` definido em `dados.js` — ou seja, quando `DADOS.CLASSES.find(c => c.nome === ficha.classe).magias` existir.

Implemente isso da forma mais consistente com o padrão já existente no arquivo: se as etapas são controladas por um array de identificadores (ex: `['nome', 'atributos', 'raca', 'classe', 'pericias', 'resumo']`), calcule esse array dinamicamente inserindo `'magias'` entre `'pericias'` e `'resumo'` somente quando a classe atual for conjuradora; se forem números fixos com um `switch`, adicione a lógica de pular a etapa Magias (avançar direto de Perícias pra Resumo) quando a classe não for conjuradora, e o inverso ao voltar do Resumo. Preserve o comportamento de `podeAvancar()`/validação já existente para todas as etapas anteriores.

- [ ] **Step 3: Implementar `renderEtapaMagias()`**

Adicione uma nova função seguindo o padrão visual/estrutural de `renderEtapaPericias()` (reaproveitando a mesma técnica de checkbox-com-limite):

```js
function renderEtapaMagias() {
  limparErro();
  const elementoConteudo = document.getElementById('conteudo-etapa');
  const classe = DADOS.CLASSES.find(c => c.nome === ficha.classe);
  const infoMagias = classe.magias;

  const atributoConjuracao = classe.atributoConjuracao;
  const atributosFinais = calcularAtributosFinais(); // reaproveita a função já usada em construirFichaFinal
  const modConjuracao = Calculo.modificador(atributosFinais[atributoConjuracao]);

  const limiteCantrips = infoMagias.cantripsConhecidos;
  const limiteNivel1 = Calculo.quantidadeMagiasNivel1(infoMagias, modConjuracao);

  const cantripsDisponiveis = DADOS_MAGIAS.MAGIAS.filter(m => m.circulo === 0 && m.classes.includes(ficha.classe));
  const nivel1Disponiveis = DADOS_MAGIAS.MAGIAS.filter(m => m.circulo === 1 && m.classes.includes(ficha.classe));

  const cantripsEscolhidos = ficha.magiasEscolhidas.filter(nome => cantripsDisponiveis.some(m => m.nome === nome));
  const nivel1Escolhidas = ficha.magiasEscolhidas.filter(nome => nivel1Disponiveis.some(m => m.nome === nome));

  function renderizarLista(lista, escolhidas, limite) {
    return lista.map(magia => {
      const marcado = escolhidas.includes(magia.nome) ? 'checked' : '';
      const detalhes = [magia.escola, magia.tempoConjuracao, magia.alcance, magia.duracao].join(' · ');
      return `
        <label class="opcao-magia">
          <input type="checkbox" data-magia="${magia.nome}" ${marcado}>
          <strong>${magia.nome}</strong>
          <span class="detalhes-magia">${detalhes}</span>
          <span class="descricao-opcao">${magia.descricao}</span>
        </label>
      `;
    }).join('');
  }

  elementoConteudo.innerHTML = `
    <h2>Magias</h2>
    <p class="dado-vida">Cantrips (${cantripsEscolhidos.length}/${limiteCantrips} escolhidos)</p>
    <div id="listaCantrips">${renderizarLista(cantripsDisponiveis, cantripsEscolhidos, limiteCantrips)}</div>
    <p class="dado-vida">Magias de 1º Círculo (${nivel1Escolhidas.length}/${limiteNivel1} escolhidas)</p>
    <div id="listaMagiasNivel1">${renderizarLista(nivel1Disponiveis, nivel1Escolhidas, limiteNivel1)}</div>
  `;

  function configurarCheckbox(container, disponiveis, limite) {
    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', () => {
        const nomeMagia = input.dataset.magia;
        const jaEscolhida = ficha.magiasEscolhidas.includes(nomeMagia);
        const escolhidasDesseGrupo = ficha.magiasEscolhidas.filter(nome => disponiveis.some(m => m.nome === nome));
        if (input.checked && !jaEscolhida) {
          if (escolhidasDesseGrupo.length >= limite) {
            input.checked = false;
            mostrarErro(`Você já escolheu o máximo de ${limite} para este grupo.`);
            return;
          }
          ficha.magiasEscolhidas.push(nomeMagia);
          limparErro();
        } else if (!input.checked && jaEscolhida) {
          ficha.magiasEscolhidas = ficha.magiasEscolhidas.filter(nome => nome !== nomeMagia);
          limparErro();
        }
        renderEtapaMagias();
      });
    });
  }

  configurarCheckbox(document.getElementById('listaCantrips'), cantripsDisponiveis, limiteCantrips);
  configurarCheckbox(document.getElementById('listaMagiasNivel1'), nivel1Disponiveis, limiteNivel1);
}
```

Se o arquivo já tiver uma função equivalente a `calcularAtributosFinais()` (usada para computar os atributos finais com bônus racial já somado, antes do resumo), reaproveite-a exatamente. Se essa lógica hoje está inline dentro de `construirFichaFinal()` sem ser uma função separada, extraia-a para uma função `calcularAtributosFinais()` reutilizável por ambas (`construirFichaFinal` e `renderEtapaMagias`), preservando o comportamento exato já usado em `construirFichaFinal()` (incluindo o bônus de raça e a escolha livre do Meio-Elfo).

- [ ] **Step 4: Bloquear avanço da etapa Magias até atingir os limites**

Na função `podeAvancar()` (ou equivalente), adicione a condição: quando a etapa atual for Magias, só permite avançar se `cantripsEscolhidos.length === limiteCantrips && nivel1Escolhidas.length === limiteNivel1` (mesmo padrão de validação já usado na etapa Perícias, que provavelmente já exige atingir um número exato de perícias escolhidas).

- [ ] **Step 5: Exportar `magiasConhecidas` em `construirFichaFinal()`**

Em `construirFichaFinal()`, adicione, logo após `habilidadesClasse: classe.habilidades.filter(h => h.nivel <= 1),`:
```js
    magiasConhecidas: ficha.magiasEscolhidas.map(nome => DADOS_MAGIAS.MAGIAS.find(m => m.nome === nome)),
```
Para classes não-conjuradoras, `ficha.magiasEscolhidas` permanece `[]` (nunca populado, já que a etapa Magias é pulada), então essa expressão naturalmente resulta em `[]` — não `undefined` — mantendo a chave sempre presente no JSON exportado, como especificado no design.

- [ ] **Step 6: Verificar manualmente**

Use um servidor local (`python -m http.server` em `docs/creator`) e Playwright:
1. Crie um personagem com classe **Guerreiro** (não-conjuradora): confirme que a etapa Magias NUNCA aparece entre Perícias e Resumo, e que o JSON final tem `magiasConhecidas: []`.
2. Crie um personagem com classe **Bardo**: confirme que a etapa Magias aparece, mostra "Cantrips (0/2 escolhidos)" e "Magias de 1º Círculo (0/4 escolhidas)", que marcar checkboxes incrementa o contador e trava no limite (tentar marcar um 3º cantrip deve mostrar erro e não marcar), e que "Avançar" só funciona depois de completar os dois limites exatos. Confirme no JSON final que `magiasConhecidas` tem exatamente 2 cantrips + 4 magias de 1º círculo, com os objetos completos (nome/escola/dano/etc.).
3. Crie um personagem com classe **Clérigo** com Sabedoria alta o suficiente pra ter `limiteNivel1` diferente de 4 (ex: Sabedoria 16, mod +3, limite = 4): confirme que o contador reflete esse cálculo corretamente.

Se não conseguir rodar o navegador, avise explicitamente e faça a verificação por leitura cuidadosa do código.

- [ ] **Step 7: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): etapa de selecao de magias e exportacao no character.json"
```

---

### Task 4: `Modelos.cs` — `MagiaPersonagem` e campo `MagiasConhecidas`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`

- [ ] **Step 1: Escrever o teste (falhando)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`, dentro da classe, antes do `}` final:

```csharp

    [Fact]
    public void Personagem_ComMagiasConhecidas_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Personagem(
            "p1",
            "Sael Marévalis",
            "Humano",
            "Druida",
            1,
            new AtributosPersonagem(10, 12, 14, 10, 16, 8),
            9,
            11,
            new List<PericiaPersonagem>(),
            MagiasConhecidas: new List<MagiaPersonagem>
            {
                new("Orientação", 0, "Adivinhação", "1 ação", "Toque", "Concentração, até 1 minuto", "V, S",
                    "Toca uma criatura disposta; ela pode somar 1d4 a um teste de habilidade à sua escolha.", null, null),
                new("Cura de Ferimentos", 1, "Evocação", "1 ação", "Toque", "Instantânea", "V, S",
                    "Uma criatura tocada recupera 1d8 + modificador de conjuração em pontos de vida.", null, null),
            });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal(2, restaurado!.MagiasConhecidas!.Count);
        Assert.Equal(1, restaurado.MagiasConhecidas[1].Circulo);
    }

    [Fact]
    public void Personagem_SemMagiasConhecidas_DesserializaComListaNula()
    {
        var json = "{\"Id\":\"p1\",\"Nome\":\"Teste\",\"Raca\":\"Humano\",\"Classe\":\"Guerreiro\",\"Nivel\":1," +
            "\"Atributos\":{\"Forca\":10,\"Destreza\":10,\"Constituicao\":10,\"Inteligencia\":10,\"Sabedoria\":10,\"Carisma\":10}," +
            "\"Pv\":10,\"Ca\":10,\"Pericias\":[]}";

        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Null(restaurado!.MagiasConhecidas);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: erro de build (`CS0246` para `MagiaPersonagem`, parâmetro nomeado inexistente para `MagiasConhecidas`).

- [ ] **Step 3: Adicionar `MagiaPersonagem` e o campo `MagiasConhecidas`**

Leia `src/PainelDed.Api/Campanhas/Modelos.cs` primeiro para confirmar a estrutura atual exata. Adicione logo após `public record HabilidadeClasse(string Nome, int Nivel, string Descricao);`:
```csharp

public record MagiaPersonagem(
    string Nome, int Circulo, string Escola, string TempoConjuracao,
    string Alcance, string Duracao, string Componentes, string Descricao,
    string? Dano = null, string? TesteResistencia = null);
```

E em AMBOS `Personagem` e `ImportarPersonagemRequisicao`, adicione `List<MagiaPersonagem>? MagiasConhecidas = null` como o ÚLTIMO parâmetro (depois do já existente `List<HabilidadeClasse>? HabilidadesClasse = null`), preservando todos os parâmetros anteriores exatamente como estão.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
git commit -m "feat(personagens): campo MagiasConhecidas em Personagem"
```

---

### Task 5: `ServicoPersonagens` — repassar `MagiasConhecidas` no `Importar`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`

**ATENÇÃO:** este método já esqueceu de repassar campos novos MAIS DE UMA VEZ neste projeto. Antes de considerar esta task pronta, leia `Modelos.cs` você mesmo e confira a ordem EXATA de TODOS os parâmetros de `Personagem`, um por um, contra a chamada `new Personagem(...)` que você está editando — incluindo os que já existiam antes desta task.

- [ ] **Step 1: Escrever o teste (falhando)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`, dentro da classe, antes do `}` final (use o mesmo helper `RequisicaoDeExemplo()` já usado pelos testes vizinhos — confira o nome exato lendo o arquivo primeiro):

```csharp

    [Fact]
    public void Importar_ComMagiasConhecidas_PersisteAsMagias()
    {
        var requisicao = RequisicaoDeExemplo() with
        {
            MagiasConhecidas = new List<MagiaPersonagem>
            {
                new("Luz", 0, "Evocação", "1 ação", "Toque", "1 hora", "V, M", "Um objeto tocado emite luz."),
                new("Detectar Magia", 1, "Adivinhação", "1 ação", "Pessoal", "Concentração, até 10 minutos", "V, S", "Sente presença de magia."),
            }
        };

        var personagem = _servico.Importar(_campanhaId, requisicao);

        Assert.NotNull(personagem);
        Assert.Equal(2, personagem!.MagiasConhecidas!.Count);
        Assert.Equal("Luz", personagem.MagiasConhecidas![0].Nome);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ServicoPersonagensTestes"`
Expected: falha — `personagem.MagiasConhecidas` vem `null`.

- [ ] **Step 3: Atualizar `Importar`**

Em `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`, no `new Personagem(...)` dentro de `Importar`, adicione `requisicao.MagiasConhecidas` como último argumento (depois de `requisicao.HabilidadesClasse`).

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/ServicoPersonagens.cs tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
git commit -m "feat(personagens): repassa magias conhecidas na importacao"
```

---

### Task 6: `personagens.js` — exibir Magias na ficha

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/personagens.js`

- [ ] **Step 1: Adicionar o bloco de Magias em `exibirDetalhe`**

Em `src/PainelDed.Api/wwwroot/js/personagens.js`, na função `exibirDetalhe`, adicione o bloco a seguir imediatamente antes de `if (personagem.historia) {` (logo após o bloco de Habilidades de Classe):

```js
    if (personagem.magiasConhecidas && personagem.magiasConhecidas.length > 0) {
      const cantrips = personagem.magiasConhecidas.filter((m) => m.circulo === 0);
      const magiasNivel1 = personagem.magiasConhecidas.filter((m) => m.circulo === 1);

      function criarListaMagias(titulo, magias) {
        if (magias.length === 0) return;
        const tituloEl = document.createElement('h4');
        tituloEl.textContent = titulo;
        detalhe.appendChild(tituloEl);

        const lista = document.createElement('ul');
        lista.className = 'lista-pericias-ficha';
        magias.forEach((magia) => {
          const item = document.createElement('li');
          const negrito = document.createElement('strong');
          negrito.textContent = `${magia.nome}: `;
          item.appendChild(negrito);
          const detalhesPartes = [magia.escola, magia.tempoConjuracao, magia.alcance, magia.duracao];
          let textoDetalhes = `${detalhesPartes.join(' · ')}. ${magia.descricao}`;
          if (magia.dano) {
            textoDetalhes += ` (${magia.dano})`;
          }
          if (magia.testeResistencia) {
            textoDetalhes += ` Teste de resistência: ${magia.testeResistencia}.`;
          }
          item.appendChild(document.createTextNode(textoDetalhes));
          lista.appendChild(item);
        });
        detalhe.appendChild(lista);
      }

      criarListaMagias('Cantrips', cantrips);
      criarListaMagias('Magias de 1º Círculo', magiasNivel1);
    }

```

Todos os valores (`magia.nome`, `magia.escola`, etc.) devem continuar sendo inseridos via `textContent`/`createTextNode`, nunca `innerHTML` — mesma justificativa dos blocos anteriores (dados vêm de um JSON importado, potencialmente editado pelo usuário).

- [ ] **Step 2: Verificar sintaxe**

Run: `node --check src/PainelDed.Api/wwwroot/js/personagens.js`
Expected: nenhuma saída.

- [ ] **Step 3: Verificar manualmente**

Com backend real (`dotnet run --project src/PainelDed.Api`) e Playwright: importe uma ficha de teste (pode ser criada manualmente com 1-2 entradas em `magiasConhecidas`, um cantrip e uma magia de 1º círculo) e confirme que a ficha mostra "Cantrips" e "Magias de 1º Círculo" como seções separadas, cada uma só aparecendo se tiver pelo menos 1 item. Importe também uma ficha sem `magiasConhecidas` (ex: um Guerreiro) e confirme que nenhuma das duas seções aparece, sem erro. Pare o servidor ao terminar.

- [ ] **Step 4: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/personagens.js
git commit -m "feat(personagens): exibe magias conhecidas na ficha"
```

---

### Task 7: Regenerar fichas de exemplo + teste final end-to-end

**Files:**
- Modify: `docs/creator/exemplos/kess-bramo.json` (Ladina — não-conjuradora, deve ganhar `magiasConhecidas: []`)
- Modify: `docs/creator/exemplos/bran-ferronaz.json` (Guerreiro — não-conjuradora, deve ganhar `magiasConhecidas: []`)
- Modify: `docs/creator/exemplos/sael-marevalis.json` (Druida — conjuradora, deve ganhar `magiasConhecidas` preenchido)

- [ ] **Step 1: Rodar toda a suíte de testes**

Run: `node docs/creator/js/dados.test.js && node docs/creator/js/calculo.test.js && node docs/creator/js/magias.test.js && dotnet test`
Expected: tudo passa.

- [ ] **Step 2: Regerar as 3 fichas de exemplo**

Usando um navegador real (Playwright) contra o `docs/creator/index.html` local, leia os 3 arquivos atuais em `docs/creator/exemplos/` e refaça os 3 com os MESMOS valores mecânicos de sempre (raça, classe, atributos, perícias, história, características, combate, testes de resistência, traços raciais, habilidades de classe — todos byte-idênticos aos atuais). Para Kess Bramo (Ladina) e Bran Ferronaz (Guerreiro), a etapa Magias não deve aparecer (não são conjuradores) — o `magiasConhecidas` final deve ser `[]`. Para Sael Marévalis (Druida), complete a etapa Magias escolhendo cantrips e magias de 1º círculo até atingir o limite exigido (Sabedoria 16 → mod +3 → limite de magias de 1º círculo = 4; confirme o valor real de Sabedoria de Sael no JSON atual e ajuste o limite esperado de acordo). Salve os 3 JSONs atualizados, sobrescrevendo os arquivos em `docs/creator/exemplos/`.

- [ ] **Step 3: Subir o painel e importar as 3 fichas**

Run: `dotnet run --project src/PainelDed.Api`

Com um navegador real, crie uma campanha nova, importe as 3 fichas regeneradas via aba Jogadores, e confirme:
- Kess e Bran: nenhuma seção "Cantrips"/"Magias de 1º Círculo" aparece (magiasConhecidas vazio).
- Sael: as seções "Cantrips" e "Magias de 1º Círculo" aparecem com o conteúdo esperado.

Confirme também que "Habilidades de Classe" (Fase 2b), "Traços Raciais" (Fase 2a), "Combate"/"Testes de Resistência" (Fase 1) e "História"/"Características Físicas" continuam aparecendo normalmente para os 3 personagens — sem regressão. Pare o servidor ao terminar.

- [ ] **Step 4: Commit e push**

```bash
git add docs/creator/exemplos/
git commit -m "chore(creator): regenera fichas de exemplo com magias conhecidas"
git push origin main
```
