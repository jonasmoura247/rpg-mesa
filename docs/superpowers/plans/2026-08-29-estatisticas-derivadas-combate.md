# Estatísticas Derivadas de Combate (Fase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calcular e exibir, tanto no `/creator` (etapa de Resumo) quanto na aba Jogadores do painel, as estatísticas de combate derivadas dos atributos: Iniciativa, bônus de ataque (Força/Destreza), CD de magia e bônus de ataque mágico (só pra classes conjuradoras), e os 6 testes de resistência com o bônus final (marcando quais a classe tem proficiência).

**Architecture:** Fase 1 de 3 combinadas com o usuário (Fase 2 = traços raciais/habilidades de classe por nível; Fase 3 = magias escolhíveis — ambas ficam para planos futuros). Segue o mesmo padrão já usado pro PV/CA: os valores são **calculados uma vez no `/creator` na hora da exportação** e vão dentro do `character.json`; o painel só armazena e exibe, não recalcula (mesmo princípio já documentado no spec: "o painel confia no JSON recebido"). Bônus de proficiência sempre `+2`, consistente com o resto do projeto (todo personagem hoje é nível 1).

**Tech Stack:** Mesmo par de stacks já usado nos planos anteriores — `docs/creator/` (HTML/CSS/JS vanilla, testes via Node) e `src/PainelDed.Api/` (C#/ASP.NET Minimal API + xUnit, frontend vanilla JS sem framework).

Nenhuma CSS nova é necessária — as classes reaproveitadas (`.destaques`/`.destaque` no creator, `.destaques-ficha`/`.destaque-ficha`/`.lista-pericias-ficha` no painel, `<h3>`/`<h4>` sem classe) já têm estilo definido dos planos anteriores.

---

## Regras (não são escolha de design — matemática do 5e)

- **Iniciativa** = modificador de Destreza
- **Bônus de ataque físico** = `+2` (proficiência) + modificador (mostra Força e Destreza, já que o app não rastreia arma equipada)
- **CD de magia** = `8 + 2 + modificador do atributo de conjuração da classe` (só se a classe conjura)
- **Bônus de ataque com magia** = `2 + modificador do atributo de conjuração`
- **Teste de resistência** = modificador do atributo `+2` se a classe é proficiente naquele teste (cada classe é proficiente em exatamente 2 dos 6)

Atributo de conjuração e as 2 resistências por classe (dados SRD 5e, a serem adicionados a `dados.js`):

| Classe | Atributo de Conjuração | Resistências |
|---|---|---|
| Bárbaro | — | Força, Constituição |
| Bardo | Carisma | Destreza, Carisma |
| Bruxo | Carisma | Sabedoria, Carisma |
| Clérigo | Sabedoria | Sabedoria, Carisma |
| Druida | Sabedoria | Inteligência, Sabedoria |
| Feiticeiro | Carisma | Constituição, Carisma |
| Guerreiro | — | Força, Constituição |
| Ladino | — | Destreza, Inteligência |
| Magista | Inteligência | Inteligência, Sabedoria |
| Monge | — | Força, Destreza |
| Paladino | Carisma | Sabedoria, Carisma |
| Patrulheiro | Sabedoria | Força, Destreza |

---

## File Structure

```
docs/creator/js/dados.js        — adiciona atributoConjuracao e resistencias a cada classe
docs/creator/js/dados.test.js   — testa os dados novos
docs/creator/js/calculo.js      — adiciona cdMagia()
docs/creator/js/calculo.test.js — testa cdMagia()
docs/creator/js/app.js          — calcula as estatísticas de combate e exibe na etapa Resumo

src/PainelDed.Api/Campanhas/Modelos.cs             — TesteResistencia + campos de combate em Personagem/ImportarPersonagemRequisicao
tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs — testes de serialização
src/PainelDed.Api/Campanhas/ServicoPersonagens.cs  — repassa os novos campos no Importar
tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs — teste de que os campos persistem
src/PainelDed.Api/wwwroot/js/personagens.js        — exibe as estatísticas de combate na ficha

docs/creator/exemplos/*.json — regeneradas com os novos campos
```

---

### Task 1: `dados.js` — atributo de conjuração e resistências por classe

**Files:**
- Modify: `docs/creator/js/dados.js`
- Modify: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Adicionar teste (falhando)**

Adicione a `docs/creator/js/dados.test.js`, antes do `console.log(...)` final:
```js
const magista = DADOS.CLASSES.find(c => c.nome === 'Magista');
assert.strictEqual(magista.atributoConjuracao, 'inteligencia');
assert.deepStrictEqual(magista.resistencias, ['inteligencia', 'sabedoria']);

const guerreiroCombate = DADOS.CLASSES.find(c => c.nome === 'Guerreiro');
assert.strictEqual(guerreiroCombate.atributoConjuracao, null);
assert.deepStrictEqual(guerreiroCombate.resistencias, ['forca', 'constituicao']);

assert.ok(
  DADOS.CLASSES.every(c => Array.isArray(c.resistencias) && c.resistencias.length === 2),
  'toda classe deve ter exatamente 2 resistências'
);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: `TypeError: Cannot read properties of undefined (reading 'atributoConjuracao')` ou `AssertionError` (magista.atributoConjuracao é `undefined`, não `'inteligencia'`)

- [ ] **Step 3: Substituir o array `CLASSES` inteiro em `dados.js`**

Em `docs/creator/js/dados.js`, substitua o array `CLASSES` inteiro por:
```js
  const CLASSES = [
    { nome: 'Bárbaro', dadoDeVida: 12, escolhas: 2,
      descricao: 'Guerreiro que canaliza fúria primitiva em combate, resistente e devastador corpo a corpo.',
      atributoConjuracao: null, resistencias: ['forca', 'constituicao'],
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intimidacao', 'Natureza', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Bardo', dadoDeVida: 8, escolhas: 3, todasPericias: true, periciasElegiveis: [],
      descricao: 'Conjurador versátil que inspira aliados e desarma inimigos através de música, palavras e magia.',
      atributoConjuracao: 'carisma', resistencias: ['destreza', 'carisma'] },
    { nome: 'Bruxo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador que obtém poder através de um pacto com uma entidade sobrenatural.',
      atributoConjuracao: 'carisma', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Arcanismo', 'Engano', 'Historia', 'Intimidacao', 'Investigacao', 'Natureza', 'Religiao'] },
    { nome: 'Clérigo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador divino que cura, protege e combate em nome de uma divindade ou ideal.',
      atributoConjuracao: 'sabedoria', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Historia', 'Intuicao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Druida', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador ligado à natureza, capaz de assumir formas animais e comandar os elementos.',
      atributoConjuracao: 'sabedoria', resistencias: ['inteligencia', 'sabedoria'],
      periciasElegiveis: ['Arcanismo', 'Adestramento', 'Intuicao', 'Medicina', 'Natureza', 'Percepcao', 'Religiao', 'Sobrevivencia'] },
    { nome: 'Feiticeiro', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador cujo poder mágico vem de uma origem inata, no sangue ou na alma.',
      atributoConjuracao: 'carisma', resistencias: ['constituicao', 'carisma'],
      periciasElegiveis: ['Arcanismo', 'Engano', 'Intuicao', 'Intimidacao', 'Persuasao', 'Religiao'] },
    { nome: 'Guerreiro', dadoDeVida: 10, escolhas: 2,
      descricao: 'Combatente versátil e treinado, mestre em armas e táticas de batalha.',
      atributoConjuracao: null, resistencias: ['forca', 'constituicao'],
      periciasElegiveis: ['Acrobacia', 'Adestramento', 'Atletismo', 'Historia', 'Intuicao', 'Intimidacao', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Ladino', dadoDeVida: 8, escolhas: 4,
      descricao: 'Especialista em furtividade, precisão e golpes certeiros contra alvos desprevenidos.',
      atributoConjuracao: null, resistencias: ['destreza', 'inteligencia'],
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Engano', 'Intuicao', 'Intimidacao', 'Investigacao', 'Percepcao', 'Persuasao', 'Prestidigitacao', 'Furtividade'] },
    { nome: 'Magista', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador erudito que domina a magia arcana através de estudo e um grimório pessoal.',
      atributoConjuracao: 'inteligencia', resistencias: ['inteligencia', 'sabedoria'],
      periciasElegiveis: ['Arcanismo', 'Historia', 'Intuicao', 'Investigacao', 'Medicina', 'Religiao'] },
    { nome: 'Monge', dadoDeVida: 8, escolhas: 2,
      descricao: 'Guerreiro disciplinado que canaliza energia interior em golpes rápidos e precisos.',
      atributoConjuracao: null, resistencias: ['forca', 'destreza'],
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Historia', 'Intuicao', 'Religiao', 'Furtividade'] },
    { nome: 'Paladino', dadoDeVida: 10, escolhas: 2,
      descricao: 'Guerreiro sagrado ligado por um juramento, combinando força marcial e magia divina.',
      atributoConjuracao: 'carisma', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Atletismo', 'Intuicao', 'Intimidacao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Patrulheiro', dadoDeVida: 8, escolhas: 3,
      descricao: 'Caçador e explorador habilidoso, especialista em rastreamento, sobrevivência e combate à distância.',
      atributoConjuracao: 'sabedoria', resistencias: ['forca', 'destreza'],
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intuicao', 'Investigacao', 'Natureza', 'Percepcao', 'Furtividade', 'Sobrevivencia'] }
  ];
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(creator): atributo de conjuracao e resistencias por classe"
```

---

### Task 2: `calculo.js` — `cdMagia`

**Files:**
- Modify: `docs/creator/js/calculo.js`
- Modify: `docs/creator/js/calculo.test.js`

- [ ] **Step 1: Adicionar teste (falhando)**

Adicione a `docs/creator/js/calculo.test.js`, antes do `console.log(...)` final:
```js
assert.strictEqual(Calculo.cdMagia(3, 2), 13);
assert.strictEqual(Calculo.cdMagia(-1, 2), 9);
assert.strictEqual(Calculo.cdMagia(0, 2), 10);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/calculo.test.js`
Expected: `TypeError: Calculo.cdMagia is not a function`

- [ ] **Step 3: Implementar `cdMagia`**

Em `docs/creator/js/calculo.js`, adicione dentro da IIFE, após `bonusPericia`:
```js
  function cdMagia(modAtributoConjuracao, bonusProficiencia) {
    return 8 + bonusProficiencia + modAtributoConjuracao;
  }
```

E atualize `api`:
```js
  const api = { modificador, custoTotalPointBuy, pontosRestantes, pvInicial, caBase, bonusPericia, cdMagia };
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/calculo.test.js`
Expected: `calculo.test.js: OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/calculo.js docs/creator/js/calculo.test.js
git commit -m "feat(creator): calculo de CD de magia"
```

---

### Task 3: `app.js` — calcular e exibir estatísticas de combate no Resumo

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Adicionar os cálculos em `construirFichaFinal`**

Em `docs/creator/js/app.js`, troque:
```js
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
    pericias,
    historia: ficha.historia.trim(),
    caracteristicasFisicas: ficha.caracteristicasFisicas.trim()
  };
```
por:
```js
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

  const bonusProficiencia = 2;
  const iniciativa = modDestreza;
  const bonusAtaqueForca = Calculo.bonusPericia(Calculo.modificador(atributos.forca), true, bonusProficiencia);
  const bonusAtaqueDestreza = Calculo.bonusPericia(modDestreza, true, bonusProficiencia);

  const temConjuracao = Boolean(classe.atributoConjuracao);
  const modConjuracao = temConjuracao ? Calculo.modificador(atributos[classe.atributoConjuracao]) : null;
  const cdMagia = temConjuracao ? Calculo.cdMagia(modConjuracao, bonusProficiencia) : null;
  const bonusAtaqueMagico = temConjuracao ? Calculo.bonusPericia(modConjuracao, true, bonusProficiencia) : null;

  const testesResistencia = Object.keys(NOMES_ATRIBUTOS).map(chave => {
    const mod = Calculo.modificador(atributos[chave]);
    const proficiente = classe.resistencias.includes(chave);
    return { atributo: chave, proficiente, bonus: Calculo.bonusPericia(mod, proficiente, bonusProficiencia) };
  });

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
    historia: ficha.historia.trim(),
    caracteristicasFisicas: ficha.caracteristicasFisicas.trim()
  };
```

- [ ] **Step 2: Exibir na etapa de Resumo**

Em `docs/creator/js/app.js`, na função `renderEtapaResumo`, troque:
```js
  const linhasPericias = dadosFicha.pericias.map(p =>
    `<li>${p.nome}: ${p.bonus >= 0 ? '+' : ''}${p.bonus}</li>`
  ).join('');

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
```
por:
```js
  const linhasPericias = dadosFicha.pericias.map(p =>
    `<li>${p.nome}: ${p.bonus >= 0 ? '+' : ''}${p.bonus}</li>`
  ).join('');

  const destaquesCombate = [
    `<span class="destaque">Iniciativa ${dadosFicha.iniciativa >= 0 ? '+' : ''}${dadosFicha.iniciativa}</span>`,
    `<span class="destaque">Ataque For ${dadosFicha.bonusAtaqueForca >= 0 ? '+' : ''}${dadosFicha.bonusAtaqueForca}</span>`,
    `<span class="destaque">Ataque Des ${dadosFicha.bonusAtaqueDestreza >= 0 ? '+' : ''}${dadosFicha.bonusAtaqueDestreza}</span>`
  ];
  if (dadosFicha.cdMagia !== null) {
    destaquesCombate.push(`<span class="destaque">CD Magia ${dadosFicha.cdMagia}</span>`);
    destaquesCombate.push(`<span class="destaque">Ataque Mágico ${dadosFicha.bonusAtaqueMagico >= 0 ? '+' : ''}${dadosFicha.bonusAtaqueMagico}</span>`);
  }

  const linhasResistencia = dadosFicha.testesResistencia.map(t =>
    `<li>${NOMES_ATRIBUTOS[t.atributo]}${t.proficiente ? ' (proficiente)' : ''}: ${t.bonus >= 0 ? '+' : ''}${t.bonus}</li>`
  ).join('');

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
    <h3>Combate</h3>
    <div class="destaques">${destaquesCombate.join('')}</div>
    <h3>Testes de Resistência</h3>
    <ul>${linhasResistencia}</ul>
    <div class="campo-texto-livre">
```

- [ ] **Step 3: Verificar manualmente**

Real browser se possível (servidor local em `docs/creator` + Playwright, mesma abordagem já usada nas tasks anteriores). Complete o assistente com uma classe conjuradora (ex: Magista) até o Resumo — confirme que aparecem os cartões "Iniciativa", "Ataque For", "Ataque Des", "CD Magia" e "Ataque Mágico", e a lista de Testes de Resistência com as 2 proficientes marcadas "(proficiente)". Refaça com uma classe não-conjuradora (ex: Guerreiro) — confirme que "CD Magia"/"Ataque Mágico" **não aparecem**, só os 3 primeiros. Confira o JSON baixado (via `construirFichaFinal()` no console, ou o download real) pra ver os campos `iniciativa`, `bonusAtaqueForca`, `bonusAtaqueDestreza`, `cdMagia`, `bonusAtaqueMagico`, `testesResistencia`. Se não puder rodar navegador, faça leitura cuidadosa do código e avise a limitação.

- [ ] **Step 4: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): calcula e exibe estatisticas de combate no resumo"
```

---

### Task 4: `Modelos.cs` — campos de combate em `Personagem`/`ImportarPersonagemRequisicao`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`

- [ ] **Step 1: Escrever os testes (falhando — erro de compilação)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`, dentro da classe, antes do `}` final:

```csharp

    [Fact]
    public void Personagem_ComCamposDeCombate_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Personagem(
            "p1",
            "Sael Marévalis",
            "Humano",
            "Druida",
            1,
            new AtributosPersonagem(9, 14, 16, 11, 16, 11),
            11,
            12,
            new List<PericiaPersonagem> { new("Natureza", "inteligencia", true, 2) },
            "",
            "",
            2,
            1,
            2,
            13,
            5,
            new List<TesteResistencia> { new("inteligencia", true, 2), new("sabedoria", true, 5) });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal(13, restaurado!.CdMagia);
        Assert.Equal(5, restaurado.BonusAtaqueMagico);
        Assert.Equal(2, restaurado.Iniciativa);
        Assert.Equal(2, restaurado.TestesResistencia!.Count);
    }

    [Fact]
    public void Personagem_SemCamposDeCombate_DesserializaComPadroes()
    {
        // Regressão: fichas exportadas pelo /creator antes desta feature (incluindo as
        // 3 fixtures de exemplo já existentes em docs/creator/exemplos/) não têm
        // iniciativa/CD/resistências no JSON — precisa continuar carregando sem quebrar.
        var json = "{\"Id\":\"p1\",\"Nome\":\"Teste\",\"Raca\":\"Humano\",\"Classe\":\"Guerreiro\",\"Nivel\":1," +
            "\"Atributos\":{\"Forca\":10,\"Destreza\":10,\"Constituicao\":10,\"Inteligencia\":10,\"Sabedoria\":10,\"Carisma\":10}," +
            "\"Pv\":10,\"Ca\":10,\"Pericias\":[]}";

        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal(0, restaurado!.Iniciativa);
        Assert.Null(restaurado.CdMagia);
        Assert.Null(restaurado.TestesResistencia);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: erro de build — `CS1729` (o construtor de `Personagem` não aceita 16 argumentos) e `CS0246` (`TesteResistencia` não encontrado).

- [ ] **Step 3: Adicionar `TesteResistencia` e expandir `Personagem`/`ImportarPersonagemRequisicao`**

Em `src/PainelDed.Api/Campanhas/Modelos.cs`, adicione ao final do arquivo:
```csharp

public record TesteResistencia(string Atributo, bool Proficiente, int Bonus);
```

E troque:
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
    string CaracteristicasFisicas = "");

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
    string CaracteristicasFisicas = "");
```
por:
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
    int Iniciativa = 0,
    int BonusAtaqueForca = 0,
    int BonusAtaqueDestreza = 0,
    int? CdMagia = null,
    int? BonusAtaqueMagico = null,
    List<TesteResistencia>? TestesResistencia = null);

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
    int Iniciativa = 0,
    int BonusAtaqueForca = 0,
    int BonusAtaqueDestreza = 0,
    int? CdMagia = null,
    int? BonusAtaqueMagico = null,
    List<TesteResistencia>? TestesResistencia = null);
```

Os defaults (`0`/`null`) garantem que fichas antigas (sem esses campos no JSON) continuem desserializando, e que qualquer chamada de construtor já existente no código/testes que não passe esses 6 argumentos extras continue compilando.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam, incluindo os 2 novos.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
git commit -m "feat(personagens): campos de combate (iniciativa, CD, resistencias) em Personagem"
```

---

### Task 5: `ServicoPersonagens` — repassar os campos de combate no `Importar`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`

**ATENÇÃO:** num plano anterior, o `Importar` já esqueceu de repassar 2 campos novos (`Historia`/`CaracteristicasFisicas`) da requisição pro `Personagem` construído — foi pego na revisão, mas não deve se repetir. Ao editar o `new Personagem(...)` abaixo, confira contra a ordem exata dos parâmetros em `Modelos.cs` (Task 4 deste mesmo plano) antes de commitar.

- [ ] **Step 1: Escrever o teste (falhando)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`, dentro da classe, antes do `}` final:

```csharp

    [Fact]
    public void Importar_ComCamposDeCombate_PersisteTodosOsValores()
    {
        var requisicao = RequisicaoDeExemplo() with
        {
            Iniciativa = 3,
            BonusAtaqueForca = -1,
            BonusAtaqueDestreza = 5,
            CdMagia = 13,
            BonusAtaqueMagico = 5,
            TestesResistencia = new List<TesteResistencia> { new("destreza", true, 5), new("inteligencia", true, 2) }
        };

        var personagem = _servico.Importar(_campanhaId, requisicao);

        Assert.NotNull(personagem);
        Assert.Equal(3, personagem!.Iniciativa);
        Assert.Equal(13, personagem.CdMagia);
        Assert.Equal(2, personagem.TestesResistencia!.Count);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ServicoPersonagensTestes"`
Expected: falha — os campos voltam com os valores padrão (`0`/`null`), não os valores da requisição, porque `Importar` ainda não os repassa.

- [ ] **Step 3: Atualizar `Importar`**

Em `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`, troque:
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
            requisicao.CaracteristicasFisicas);
```
por:
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
            requisicao.TestesResistencia);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/ServicoPersonagens.cs tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
git commit -m "feat(personagens): repassa campos de combate na importacao"
```

---

### Task 6: `personagens.js` — exibir estatísticas de combate na ficha

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/personagens.js`

- [ ] **Step 1: Adicionar o bloco de combate em `exibirDetalhe`**

Em `src/PainelDed.Api/wwwroot/js/personagens.js`, na função `exibirDetalhe`, troque:
```js
    detalhe.appendChild(listaPericias);

    if (personagem.historia) {
```
por:
```js
    detalhe.appendChild(listaPericias);

    if (personagem.testesResistencia && personagem.testesResistencia.length > 0) {
      const tituloCombate = document.createElement('h4');
      tituloCombate.textContent = 'Combate';
      detalhe.appendChild(tituloCombate);

      const destaquesCombate = document.createElement('div');
      destaquesCombate.className = 'destaques-ficha';
      const statsCombate = [
        ['Iniciativa', personagem.iniciativa],
        ['Ataque For', personagem.bonusAtaqueForca],
        ['Ataque Des', personagem.bonusAtaqueDestreza],
      ];
      if (personagem.cdMagia !== null && personagem.cdMagia !== undefined) {
        statsCombate.push(['CD Magia', personagem.cdMagia]);
        statsCombate.push(['Ataque Mágico', personagem.bonusAtaqueMagico]);
      }
      statsCombate.forEach(([rotulo, valor]) => {
        const destaque = document.createElement('span');
        destaque.className = 'destaque-ficha';
        destaque.textContent = rotulo === 'CD Magia' ? `${rotulo} ${valor}` : `${rotulo} ${formatarComSinal(valor)}`;
        destaquesCombate.appendChild(destaque);
      });
      detalhe.appendChild(destaquesCombate);

      const tituloResistencias = document.createElement('h4');
      tituloResistencias.textContent = 'Testes de Resistência';
      detalhe.appendChild(tituloResistencias);

      const listaResistencias = document.createElement('ul');
      listaResistencias.className = 'lista-pericias-ficha';
      personagem.testesResistencia.forEach((teste) => {
        const item = document.createElement('li');
        const rotulo = NOMES_ATRIBUTOS_PERSONAGEM[teste.atributo] || teste.atributo;
        item.textContent = `${rotulo}${teste.proficiente ? ' (proficiente)' : ''}: ${formatarComSinal(teste.bonus)}`;
        listaResistencias.appendChild(item);
      });
      detalhe.appendChild(listaResistencias);
    }

    if (personagem.historia) {
```

- [ ] **Step 2: Verificar sintaxe**

Run: `node --check src/PainelDed.Api/wwwroot/js/personagens.js`
Expected: nenhuma saída.

- [ ] **Step 3: Verificar manualmente**

Real browser se possível (backend real — `dotnet run --project src/PainelDed.Api` — + Playwright). Importe uma ficha gerada na Task 3 (ou uma das 3 fixtures, depois de regeneradas na Task 7) que tenha `testesResistencia` preenchido, abra a ficha na aba Jogadores e confirme que aparece "Combate" com os destaques certos e "Testes de Resistência" com as proficiências marcadas. Importe também uma ficha **antiga** (sem esses campos, ex: uma das fixtures atuais antes de regeneradas) e confirme que a seção "Combate" simplesmente não aparece, sem erro no console. Se não puder rodar navegador, faça leitura cuidadosa do código e avise a limitação.

- [ ] **Step 4: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/personagens.js
git commit -m "feat(personagens): exibe estatisticas de combate na ficha"
```

---

### Task 7: Regenerar fichas de exemplo + teste final end-to-end

**Files:**
- Modify: `docs/creator/exemplos/kess-bramo.json`
- Modify: `docs/creator/exemplos/bran-ferronaz.json`
- Modify: `docs/creator/exemplos/sael-marevalis.json`

- [ ] **Step 1: Rodar toda a suíte de testes**

Run: `node docs/creator/js/dados.test.js && node docs/creator/js/calculo.test.js && dotnet test`
Expected: tudo passa (as duas suítes JS do `/creator` + a suíte completa do backend).

- [ ] **Step 2: Regerar as 3 fichas de exemplo**

Usando um navegador real (Playwright) contra o `docs/creator/index.html` local, leia os 3 arquivos atuais em `docs/creator/exemplos/` pra saber nome/raça/classe/atributos/perícias/história/características de cada um, e refaça os 3 com os MESMOS valores mecânicos (raça, classe, atributos, perícias, história, características), agora capturando também os novos campos de combate que o `/creator` passa a gerar automaticamente. Salve os 3 JSONs atualizados nos mesmos arquivos.

- [ ] **Step 3: Subir o painel e importar as 3 fichas**

Run: `dotnet run --project src/PainelDed.Api` (deixe rodando)

Com um navegador real, crie uma campanha nova, importe as 3 fichas regeneradas via aba Jogadores, e confirme pra cada uma:
- A seção "Combate" aparece com Iniciativa, Ataque For, Ataque Des.
- Kess (Ladino) e Bran (Guerreiro) **não** mostram CD Magia/Ataque Mágico (não são conjuradores). Sael (Druida) **mostra** CD Magia e Ataque Mágico.
- "Testes de Resistência" lista os 6 atributos, com exatamente 2 marcados "(proficiente)" por personagem, batendo com a tabela da classe (ex: Sael/Druida deve ter Inteligência e Sabedoria proficientes).

Pare o servidor (`Ctrl+C`) ao terminar.

- [ ] **Step 4: Commit**

```bash
git add docs/creator/exemplos/
git commit -m "chore(creator): regenera fichas de exemplo com estatisticas de combate"
git push origin main
```
