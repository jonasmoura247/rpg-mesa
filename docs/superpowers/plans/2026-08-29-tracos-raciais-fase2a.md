# Traços Raciais (Fase 2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar os traços raciais (resumo mecânico) de cada uma das 14 raças, exibi-los no `/creator` na hora de selecionar a raça, e levá-los pro `character.json` exportado + ficha da aba Jogadores do painel.

**Architecture:** Fase 2a de uma iniciativa maior (Fase 1 = estatísticas de combate, já concluída; Fase 2b = habilidades de classe por nível 1-5, próximo plano; Fase 3 = magias, depois). Traços raciais não escalam por nível no 5e — são todos concedidos no nível 1 — então não há filtragem por nível aqui (diferente da Fase 2b). Mesmo padrão arquitetural das fases anteriores: calculado/montado uma vez no `/creator`, o painel só armazena e exibe.

**Tech Stack:** Mesmo par de stacks dos planos anteriores.

Nenhuma CSS nova é necessária no `/creator` (reaproveita `<h3>`/`<ul>` sem classe, já estilizados) nem no painel (reaproveita `.lista-pericias-ficha`).

**Decisão de escopo:** os traços aparecem na etapa Raça do `/creator` (ajuda na escolha) mas **não** são repetidos na etapa de Resumo (evita poluir a tela que já tem Atributos/Perícias/Combate/Resistências) — ficam disponíveis no JSON exportado e na ficha do painel como registro oficial.

---

## File Structure

```
docs/creator/js/dados.js        — adiciona `tracos` (array de {nome, descricao}) a cada raça
docs/creator/js/dados.test.js   — testa os traços
docs/creator/js/app.js          — exibe traços na etapa Raça; inclui no character.json exportado

src/PainelDed.Api/Campanhas/Modelos.cs             — TracoPersonagem + campo TracosRaciais
tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
src/PainelDed.Api/Campanhas/ServicoPersonagens.cs  — repassa TracosRaciais no Importar
tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
src/PainelDed.Api/wwwroot/js/personagens.js        — exibe traços raciais na ficha

docs/creator/exemplos/*.json — regeneradas com tracosRaciais
```

---

### Task 1: `dados.js` — traços de cada raça

**Files:**
- Modify: `docs/creator/js/dados.js`
- Modify: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Adicionar teste (falhando)**

Adicione a `docs/creator/js/dados.test.js`, antes do `console.log(...)` final:
```js
assert.ok(
  DADOS.RACAS.every(r => Array.isArray(r.tracos) && r.tracos.length > 0),
  'toda raça deve ter pelo menos 1 traço racial'
);
const humanoTracos = DADOS.RACAS.find(r => r.nome === 'Humano');
assert.strictEqual(humanoTracos.tracos.length, 1);
const anaoColinaTracos = DADOS.RACAS.find(r => r.nome === 'Anão da Colina');
assert.strictEqual(anaoColinaTracos.tracos.length, 4);
assert.ok(anaoColinaTracos.tracos.every(t => typeof t.nome === 'string' && typeof t.descricao === 'string' && t.nome && t.descricao));
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: `TypeError: Cannot read properties of undefined (reading 'length')` (`r.tracos` ainda não existe)

- [ ] **Step 3: Substituir o array `RACAS` inteiro em `dados.js`**

Em `docs/creator/js/dados.js`, substitua o array `RACAS` inteiro por:
```js
  const RACAS = [
    { nome: 'Humano', bonus: { forca: 1, destreza: 1, constituicao: 1, inteligencia: 1, sabedoria: 1, carisma: 1 },
      descricao: 'Adaptáveis e ambiciosos, os humanos são a raça mais numerosa e versátil, com um pouco de talento em tudo.',
      tracos: [
        { nome: 'Versátil', descricao: 'Fala, lê e escreve Comum e mais um idioma à escolha.' }
      ] },
    { nome: 'Anão da Colina', bonus: { constituicao: 2, sabedoria: 1 },
      descricao: 'Anões resistentes e perceptivos, com instintos aguçados forjados em sociedades subterrâneas antigas.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resiliência Anã', descricao: 'Vantagem em testes de resistência contra veneno, e resistência a dano de veneno.' },
        { nome: 'Treinamento de Combate Anão', descricao: 'Proficiência com machado de guerra, machadinha, martelo leve e malho.' },
        { nome: 'Perspicácia Anã', descricao: '+1 ponto de vida máximo para cada nível do personagem.' }
      ] },
    { nome: 'Anão da Montanha', bonus: { constituicao: 2, forca: 2 },
      descricao: 'Anões fortes e habituados à armadura pesada, vindos de fortalezas talhadas na rocha.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resiliência Anã', descricao: 'Vantagem em testes de resistência contra veneno, e resistência a dano de veneno.' },
        { nome: 'Treinamento de Combate Anão', descricao: 'Proficiência com machado de guerra, machadinha, martelo leve e malho.' },
        { nome: 'Treinamento com Armadura', descricao: 'Proficiência com armaduras leves e médias.' }
      ] },
    { nome: 'Elfo Alto', bonus: { destreza: 2, inteligencia: 1 },
      descricao: 'Elfos graciosos com afinidade natural pela magia arcana e memória precisa.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Sentidos Aguçados', descricao: 'Proficiência em Percepção.' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Transe', descricao: 'Não precisa dormir; medita profundamente por 4 horas ao dia para obter o mesmo benefício de um descanso longo.' },
        { nome: 'Truque Élfico', descricao: 'Conhece um truque (cantrip) de Magista à escolha.' }
      ] },
    { nome: 'Elfo da Floresta', bonus: { destreza: 2, sabedoria: 1 },
      descricao: 'Elfos ágeis e furtivos, criados entre as árvores, com sentidos aguçados para a natureza.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Sentidos Aguçados', descricao: 'Proficiência em Percepção.' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Transe', descricao: 'Não precisa dormir; medita profundamente por 4 horas ao dia para obter o mesmo benefício de um descanso longo.' },
        { nome: 'Passo Élfico', descricao: 'Deslocamento base de 10,5 metros.' },
        { nome: 'Máscara da Natureza', descricao: 'Pode tentar se esconder mesmo levemente obscurecido por folhagem, chuva forte, neve, névoa ou outro fenômeno natural.' }
      ] },
    { nome: 'Elfo Negro (Drow)', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Elfos de vida subterrânea, ágeis e carismáticos, acostumados à escuridão e à intriga.',
      tracos: [
        { nome: 'Visão no Escuro Superior', descricao: 'Enxerga no escuro até 36 metros.' },
        { nome: 'Sensibilidade à Luz do Sol', descricao: 'Desvantagem em testes de ataque e de Percepção baseados em visão sob luz solar direta.' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Magia Drow', descricao: 'Conhece o truque Luzes Dançantes; a partir do nível 3 pode lançar Névoa Feérica 1x/dia, e a partir do nível 5, Escuridão 1x/dia (Carisma como atributo de conjuração).' }
      ] },
    { nome: 'Halfling Pés Leves', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Pequenos e discretos, hábeis em passar despercebidos e fazer amizade com estranhos.',
      tracos: [
        { nome: 'Sortudo', descricao: 'Ao tirar 1 num d20 para um teste de ataque, de habilidade ou de resistência, pode rolar de novo e deve usar o novo resultado.' },
        { nome: 'Corajoso', descricao: 'Vantagem em testes de resistência contra ficar amedrontado.' },
        { nome: 'Agilidade Halfling', descricao: 'Pode se mover através do espaço de qualquer criatura de tamanho maior que o dele.' },
        { nome: 'Furtivo por Natureza', descricao: 'Pode tentar se esconder mesmo estando apenas atrás de uma criatura pelo menos um tamanho maior.' }
      ] },
    { nome: 'Halfling Robusto', bonus: { destreza: 2, constituicao: 1 },
      descricao: 'Halflings resistentes, com constituição mais forte que a média da sua raça.',
      tracos: [
        { nome: 'Sortudo', descricao: 'Ao tirar 1 num d20 para um teste de ataque, de habilidade ou de resistência, pode rolar de novo e deve usar o novo resultado.' },
        { nome: 'Corajoso', descricao: 'Vantagem em testes de resistência contra ficar amedrontado.' },
        { nome: 'Agilidade Halfling', descricao: 'Pode se mover através do espaço de qualquer criatura de tamanho maior que o dele.' },
        { nome: 'Resiliência Robusta', descricao: 'Vantagem em testes de resistência contra veneno, e resistência a dano de veneno.' }
      ] },
    { nome: 'Draconato', bonus: { forca: 2, carisma: 1 },
      descricao: 'Descendentes de dragões, orgulhosos e imponentes, com um sopro elemental herdado da linhagem.',
      tracos: [
        { nome: 'Ancestralidade Dracônica', descricao: 'Determina o tipo de dano da Arma de Sopro e a resistência a dano (ex: linhagem vermelha = fogo).' },
        { nome: 'Arma de Sopro', descricao: 'Como ação, expele energia destrutiva do tipo da ancestralidade (dano e área conforme o nível; teste de resistência de Constituição ou Destreza).' },
        { nome: 'Resistência a Dano', descricao: 'Resistência ao tipo de dano associado à ancestralidade dracônica.' }
      ] },
    { nome: 'Gnomo da Floresta', bonus: { inteligencia: 2, destreza: 1 },
      descricao: 'Gnomos curiosos e ágeis, com talento natural para ilusões e comunicação com pequenos animais.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Astúcia Gnômica', descricao: 'Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma contra magia.' },
        { nome: 'Ilusionista Natural', descricao: 'Conhece o truque Ilusão Menor (Inteligência como atributo de conjuração).' },
        { nome: 'Falar com Pequenos Animais', descricao: 'Consegue se comunicar de forma simples com bestas pequenas.' }
      ] },
    { nome: 'Gnomo das Rochas', bonus: { inteligencia: 2, constituicao: 1 },
      descricao: 'Gnomos inventivos e resistentes, hábeis com mecanismos e engenhocas.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Astúcia Gnômica', descricao: 'Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma contra magia.' },
        { nome: 'Conhecimento de Artífice', descricao: 'Soma o dobro do bônus de proficiência em testes de História relacionados a itens mágicos, mecanismos ou alquímicos, mesmo sem proficiência.' },
        { nome: 'Engenhoqueiro', descricao: 'Proficiência com ferramentas de ladrão e ferramentas de artesão (mecânico); pode construir pequenos autômatos.' }
      ] },
    { nome: 'Meio-Elfo', bonus: { carisma: 2 }, escolhaLivre: 2,
      descricao: 'Nascidos entre dois mundos, carismáticos e versáteis, sem se encaixar totalmente em nenhum dos dois.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Versatilidade de Perícia', descricao: 'Ganha proficiência em duas perícias à escolha, além das concedidas pela classe.' }
      ] },
    { nome: 'Meio-Orc', bonus: { forca: 2, constituicao: 1 },
      descricao: 'Fortes e implacáveis em combate, com resistência notável e ímpeto selvagem.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resiliente e Implacável', descricao: 'Quando reduzido a 0 pontos de vida sem morrer instantaneamente, pode optar por ficar com 1 ponto de vida (1x por descanso longo).' },
        { nome: 'Intimidação Ameaçadora', descricao: 'Proficiência em Intimidação.' },
        { nome: 'Ataques Selvagens', descricao: 'Ao acertar um ataque corpo a corpo com crítico, rola um dado de dano adicional.' }
      ] },
    { nome: 'Tiefling', bonus: { carisma: 2, inteligencia: 1 },
      descricao: 'Marcados por uma herança infernal distante, carismáticos e frequentemente incompreendidos.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resistência Infernal', descricao: 'Resistência a dano de fogo.' },
        { nome: 'Legado Infernal', descricao: 'Conhece o truque Taumaturgia; a partir do nível 3 pode lançar Repulsa de Aflição 1x/dia, e a partir do nível 5, Escuridão 1x/dia (Carisma como atributo de conjuração).' }
      ] }
  ];
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(creator): tracos raciais de cada raca"
```

---

### Task 2: `app.js` — exibir traços na etapa Raça e exportar no `character.json`

**Files:**
- Modify: `docs/creator/js/app.js`

- [ ] **Step 1: Exibir os traços na etapa Raça**

Em `docs/creator/js/app.js`, na função `renderEtapaRaca`, troque:
```js
  if (raca) {
    blocoBonus = `
      <p class="descricao-opcao">${raca.descricao}</p>
      <p class="bonus-raca">Bônus fixo: ${textoBonus(raca.bonus)}</p>`;
```
por:
```js
  if (raca) {
    const tracosTexto = raca.tracos.map(t => `<li><strong>${t.nome}:</strong> ${t.descricao}</li>`).join('');
    blocoBonus = `
      <p class="descricao-opcao">${raca.descricao}</p>
      <p class="bonus-raca">Bônus fixo: ${textoBonus(raca.bonus)}</p>
      <h3>Traços Raciais</h3>
      <ul>${tracosTexto}</ul>`;
```

- [ ] **Step 2: Incluir no `character.json` exportado**

Em `construirFichaFinal()`, troque a primeira linha da função:
```js
function construirFichaFinal() {
  const atributos = atributosFinais();
```
por:
```js
function construirFichaFinal() {
  const raca = racaSelecionada();
  const atributos = atributosFinais();
```

E troque o `return` final:
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
    historia: ficha.historia.trim(),
    caracteristicasFisicas: ficha.caracteristicasFisicas.trim()
  };
```

- [ ] **Step 3: Verificar manualmente**

Real browser se possível (servidor local em `docs/creator` + Playwright, mesma abordagem das tasks anteriores). Avance até a etapa Raça, selecione "Anão da Colina" — confirme que aparecem os 4 traços com nome em negrito e descrição. Troque pra "Humano" — confirme que aparece só 1 traço. Complete o assistente e confira, via `construirFichaFinal()` no console ou o JSON baixado, que `tracosRaciais` aparece com os traços certos da raça escolhida. Se não puder rodar navegador, faça leitura cuidadosa do código e avise a limitação.

- [ ] **Step 4: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(creator): exibe tracos raciais na etapa raca e exporta no json"
```

---

### Task 3: `Modelos.cs` — `TracoPersonagem` e campo `TracosRaciais`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`

- [ ] **Step 1: Escrever o teste (falhando)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`, dentro da classe, antes do `}` final:

```csharp

    [Fact]
    public void Personagem_ComTracosRaciais_SerializaEDesserializaMantendoOsDados()
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
            TracosRaciais: new List<TracoPersonagem>
            {
                new("Visão no Escuro", "Enxerga no escuro até 18m."),
                new("Resiliência Anã", "Vantagem contra veneno."),
            });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal(2, restaurado!.TracosRaciais!.Count);
        Assert.Equal("Visão no Escuro", restaurado.TracosRaciais[0].Nome);
    }

    [Fact]
    public void Personagem_SemTracosRaciais_DesserializaComListaNula()
    {
        // Regressão: fichas exportadas antes desta feature (incluindo as 3 fixtures
        // de exemplo já existentes) não têm tracosRaciais no JSON.
        var json = "{\"Id\":\"p1\",\"Nome\":\"Teste\",\"Raca\":\"Humano\",\"Classe\":\"Guerreiro\",\"Nivel\":1," +
            "\"Atributos\":{\"Forca\":10,\"Destreza\":10,\"Constituicao\":10,\"Inteligencia\":10,\"Sabedoria\":10,\"Carisma\":10}," +
            "\"Pv\":10,\"Ca\":10,\"Pericias\":[]}";

        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Null(restaurado!.TracosRaciais);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: erro de build — `CS0246` (`TracoPersonagem` não encontrado) e `CS1739`/`CS1729` (parâmetro nomeado `TracosRaciais` não existe em `Personagem`).

- [ ] **Step 3: Adicionar `TracoPersonagem` e o campo `TracosRaciais`**

Em `src/PainelDed.Api/Campanhas/Modelos.cs`, adicione logo após `public record TesteResistencia(string Atributo, bool Proficiente, int Bonus);`:
```csharp

public record TracoPersonagem(string Nome, string Descricao);
```

E adicione `List<TracoPersonagem>? TracosRaciais = null` como último parâmetro (depois de `TestesResistencia`) em **ambos** `Personagem` e `ImportarPersonagemRequisicao`. Ou seja, a última linha de cada record passa de:
```csharp
    List<TesteResistencia>? TestesResistencia = null);
```
para:
```csharp
    List<TesteResistencia>? TestesResistencia = null,
    List<TracoPersonagem>? TracosRaciais = null);
```
(troque essa linha final nos dois records — `Personagem` e `ImportarPersonagemRequisicao` — mantendo todos os parâmetros anteriores exatamente como estão.)

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
git commit -m "feat(personagens): campo TracosRaciais em Personagem"
```

---

### Task 4: `ServicoPersonagens` — repassar `TracosRaciais` no `Importar`

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`

**ATENÇÃO:** esse `Importar` já esqueceu de repassar campos novos duas vezes em planos anteriores deste mesmo projeto (uma vez pego na revisão de código, uma vez com o próprio autor da task conferindo antes de commitar). Ao editar o `new Personagem(...)`, leia `Modelos.cs` primeiro e confira a ordem exata dos parâmetros, um por um, antes de considerar a task pronta.

- [ ] **Step 1: Escrever o teste (falhando)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`, dentro da classe, antes do `}` final:

```csharp

    [Fact]
    public void Importar_ComTracosRaciais_PersisteOsTracos()
    {
        var requisicao = RequisicaoDeExemplo() with
        {
            TracosRaciais = new List<TracoPersonagem>
            {
                new("Versátil", "Fala, lê e escreve Comum e mais um idioma à escolha.")
            }
        };

        var personagem = _servico.Importar(_campanhaId, requisicao);

        Assert.NotNull(personagem);
        Assert.Single(personagem!.TracosRaciais!);
        Assert.Equal("Versátil", personagem.TracosRaciais![0].Nome);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ServicoPersonagensTestes"`
Expected: falha — `personagem.TracosRaciais` vem `null`, porque `Importar` ainda não repassa esse campo.

- [ ] **Step 3: Atualizar `Importar`**

Em `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`, no `new Personagem(...)` dentro de `Importar`, adicione `requisicao.TracosRaciais` como último argumento (depois de `requisicao.TestesResistencia`).

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/ServicoPersonagens.cs tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
git commit -m "feat(personagens): repassa tracos raciais na importacao"
```

---

### Task 5: `personagens.js` — exibir traços raciais na ficha

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/personagens.js`

- [ ] **Step 1: Adicionar o bloco de traços em `exibirDetalhe`**

Em `src/PainelDed.Api/wwwroot/js/personagens.js`, na função `exibirDetalhe`, troque:
```js
    if (personagem.historia) {
```
(a primeira ocorrência, logo após o bloco de Testes de Resistência da Fase 1) por:
```js
    if (personagem.tracosRaciais && personagem.tracosRaciais.length > 0) {
      const tituloTracos = document.createElement('h4');
      tituloTracos.textContent = 'Traços Raciais';
      detalhe.appendChild(tituloTracos);

      const listaTracos = document.createElement('ul');
      listaTracos.className = 'lista-pericias-ficha';
      personagem.tracosRaciais.forEach((traco) => {
        const item = document.createElement('li');
        const negrito = document.createElement('strong');
        negrito.textContent = `${traco.nome}: `;
        item.appendChild(negrito);
        item.appendChild(document.createTextNode(traco.descricao));
        listaTracos.appendChild(item);
      });
      detalhe.appendChild(listaTracos);
    }

    if (personagem.historia) {
```

- [ ] **Step 2: Verificar sintaxe**

Run: `node --check src/PainelDed.Api/wwwroot/js/personagens.js`
Expected: nenhuma saída.

- [ ] **Step 3: Verificar manualmente**

Real browser se possível (backend real — `dotnet run --project src/PainelDed.Api` — + Playwright). Importe uma ficha gerada na Task 2 (com `tracosRaciais` preenchido) e confirme que "Traços Raciais" aparece na ficha, com nome em negrito e descrição normal. Importe também uma ficha antiga (sem esse campo) e confirme que a seção simplesmente não aparece, sem erro. Se não puder rodar navegador, faça leitura cuidadosa do código e avise a limitação.

- [ ] **Step 4: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/personagens.js
git commit -m "feat(personagens): exibe tracos raciais na ficha"
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

Usando um navegador real (Playwright) contra o `docs/creator/index.html` local, leia os 3 arquivos atuais em `docs/creator/exemplos/` e refaça os 3 com os MESMOS valores mecânicos (raça, classe, atributos, perícias, história, características, e agora os campos de combate da Fase 1, que devem permanecer idênticos), capturando também `tracosRaciais`. Salve os 3 JSONs atualizados.

- [ ] **Step 3: Subir o painel e importar as 3 fichas**

Run: `dotnet run --project src/PainelDed.Api`

Com um navegador real, crie uma campanha nova, importe as 3 fichas regeneradas via aba Jogadores, e confirme pra cada uma que "Traços Raciais" aparece com os traços certos:
- Kess (Humana): 1 traço ("Versátil").
- Bran (Anão da Montanha): 4 traços (Visão no Escuro, Resiliência Anã, Treinamento de Combate Anão, Treinamento com Armadura).
- Sael (Humano): 1 traço ("Versátil").

Confirme também que a seção "Combate"/"Testes de Resistência" da Fase 1 continua aparecendo normalmente (sem regressão). Pare o servidor ao terminar.

- [ ] **Step 4: Commit**

```bash
git add docs/creator/exemplos/
git commit -m "chore(creator): regenera fichas de exemplo com tracos raciais"
git push origin main
```
