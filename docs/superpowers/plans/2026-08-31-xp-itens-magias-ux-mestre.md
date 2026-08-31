# XP, Itens de Aventura, Uso de Magias e Redesign da Tela do Mestre — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rastrear XP do personagem (manual + automático via combate/side quest, com barra de progresso), mostrar um kit fixo de itens de aventura, exibir o uso de cada magia (ilimitado/espaços por descanso longo, com destaque visual pras cantrips) e reorganizar a ficha do jogador na tela do mestre em seções com ícone.

**Architecture:** Mesmo padrão das specs anteriores — dados estáticos em módulos JS puros testáveis (`dados.js`, novo `experiencia.js`), campos opcionais adicionados no final dos records C# (compatibilidade retroativa), novo endpoint seguindo o padrão REST já usado por side-quest. XP é estado do backend (não vem do creator); Itens/EspacosMagia1 vêm do creator como parte da ficha (igual `Armas`).

**Tech Stack:** JavaScript vanilla, Node `assert` para lógica pura, ASP.NET Core (C# records) + xUnit, Playwright (MCP) pra verificação manual.

**Referência:** Spec completa em
`docs/superpowers/specs/2026-08-31-xp-itens-magias-ux-mestre-design.md`.

---

## Task 1: Kit de itens de aventura (`dados.js`)

**Files:**
- Modify: `docs/creator/js/dados.js`
- Test: `docs/creator/js/dados.test.js`

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `docs/creator/js/dados.test.js`:

```js
assert.deepStrictEqual(DADOS.KIT_AVENTUREIRO, [
  'Corda de Cânhamo (15m)',
  'Kit de Curandeiro',
  'Rações de Viagem (3 dias)',
  'Tocha (2)',
]);
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node docs/creator/js/dados.test.js`
Expected: falha porque `DADOS.KIT_AVENTUREIRO` é `undefined`.

- [ ] **Step 3: Implementar**

Em `docs/creator/js/dados.js`, adicione logo depois de `PACOTES_EQUIPAMENTO`:

```js
const KIT_AVENTUREIRO = [
  'Corda de Cânhamo (15m)',
  'Kit de Curandeiro',
  'Rações de Viagem (3 dias)',
  'Tocha (2)',
];
```

Adicione `KIT_AVENTUREIRO` ao objeto `api` exportado no final do arquivo.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node docs/creator/js/dados.test.js`
Expected: `dados.test.js (perícias/point buy): OK`

- [ ] **Step 5: Commit**

```bash
git add docs/creator/js/dados.js docs/creator/js/dados.test.js
git commit -m "feat(itens): adiciona kit fixo de itens de aventura"
```

---

## Task 2: Ficha final exporta itens e espaços de magia (`app.js`)

**Files:**
- Modify: `docs/creator/js/app.js` (`construirFichaFinal`)

- [ ] **Step 1: Adicionar `espacosMagia1`**

Em `construirFichaFinal()`, logo depois da linha
`const bonusAtaqueMagico = temConjuracao ? Calculo.bonusPericia(modConjuracao, true, bonusProficiencia) : null;`,
adicione:

```js
  const espacosMagia1 = classe.magias ? Calculo.quantidadeMagiasNivel1(classe.magias, modConjuracao) : null;
```

- [ ] **Step 2: Incluir `itens` e `espacosMagia1` no retorno**

No objeto retornado, adicione `itens: DADOS.KIT_AVENTUREIRO.slice(),` logo depois de `armas,` e
`espacosMagia1,` logo depois de `bonusAtaqueMagico,`:

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
    itens: DADOS.KIT_AVENTUREIRO.slice(),
    iniciativa,
    bonusAtaqueForca,
    bonusAtaqueDestreza,
    cdMagia,
    bonusAtaqueMagico,
    espacosMagia1,
    testesResistencia,
    tracosRaciais: raca.tracos,
    habilidadesClasse: classe.habilidades.filter(h => h.nivel <= 1),
    magiasConhecidas: ficha.magiasEscolhidas.map(nome => DADOS_MAGIAS.MAGIAS.find(m => m.nome === nome)),
    historia: ficha.historia.trim(),
    caracteristicasFisicas: ficha.caracteristicasFisicas.trim()
  };
```

## Context

`DADOS.KIT_AVENTUREIRO` vem da Task 1. `Calculo.quantidadeMagiasNivel1` já existe (usada em
`infoEscolhaMagias`) — aqui é só reaproveitada fora da etapa Magias, pra ficar disponível na ficha final
mesmo depois que o usuário navega pra Resumo. `.slice()` em `KIT_AVENTUREIRO` evita que a ficha exportada
compartilhe a mesma referência de array da constante (mutação acidental em um lugar não vaza pro outro).

- [ ] **Step 3: Verificar sintaxe e testes não relacionados**

Run: `node --check docs/creator/js/app.js && node docs/creator/js/dados.test.js && node docs/creator/js/calculo.test.js && node docs/creator/js/magias.test.js`
Expected: sem erro de sintaxe, três `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/creator/js/app.js
git commit -m "feat(itens): ficha final exporta kit de itens e espacos de magia de 1o circulo"
```

---

## Task 3: Resumo mostra Itens e separa Cantrips/1º Círculo com selo de uso (`app.js` + `estilo.css`)

**Files:**
- Modify: `docs/creator/js/app.js` (`renderEtapaResumo`)
- Modify: `docs/creator/css/estilo.css`

- [ ] **Step 1: Substituir o bloco de magias do Resumo**

Em `renderEtapaResumo()`, troque o `blocoMagias` inteiro (que hoje mistura Cantrips e 1º Círculo numa lista
só, com sufixo de texto) por:

```js
  const renderizarMagiaResumo = (magia, selo) => `
    <div class="opcao-magia">
      <strong>${magia.nome}</strong>
      <span class="badge-uso-magia">${selo}</span>
      <span class="detalhes-magia">${[magia.escola, magia.tempoConjuracao, magia.alcance, magia.duracao].join(' · ')}</span>
      <span class="descricao-opcao">${magia.descricao}</span>
    </div>
  `;

  const cantripsResumo = dadosFicha.magiasConhecidas.filter(m => m.circulo === 0);
  const nivel1Resumo = dadosFicha.magiasConhecidas.filter(m => m.circulo === 1);

  const blocoMagias = dadosFicha.magiasConhecidas.length ? `
    <h3>Magias</h3>
    ${cantripsResumo.length ? `
      <h4>Cantrips</h4>
      <div class="lista-magias-resumo">${cantripsResumo.map(m => renderizarMagiaResumo(m, 'Uso ilimitado')).join('')}</div>
    ` : ''}
    ${nivel1Resumo.length ? `
      <h4>Magias de 1º Círculo</h4>
      <div class="lista-magias-resumo">${nivel1Resumo.map(m => renderizarMagiaResumo(m, `${dadosFicha.espacosMagia1} usos — descanso longo`)).join('')}</div>
    ` : ''}
  ` : '';
```

- [ ] **Step 2: Adicionar bloco de Itens**

Logo antes da linha `const blocoMagias = ...` (agora `const renderizarMagiaResumo = ...`), adicione:

```js
  const blocoItens = dadosFicha.itens.length ? `
    <h3>🎒 Itens</h3>
    <ul>${dadosFicha.itens.map(item => `<li>${item}</li>`).join('')}</ul>
  ` : '';
```

- [ ] **Step 3: Inserir no template final**

No template de `elementoConteudo.innerHTML`, adicione `${blocoItens}` logo depois de `${blocoEquipamento}`
e antes de `${blocoMagias}`:

```js
    ${blocoEquipamento}
    ${blocoItens}
    ${blocoMagias}
```

- [ ] **Step 4: CSS do selo e do subtítulo `h4`**

Em `docs/creator/css/estilo.css`, adicione (perto de `.opcao-magia`):

```css
.badge-uso-magia {
  display: inline-block;
  background: var(--cor-destaque);
  color: var(--cor-texto-sobre-destaque);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  margin-left: 0.4rem;
}

.conteudo h4 {
  color: var(--cor-texto-fraco);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0.9rem 0 0.4rem;
}
```

## Context

Isso resolve diretamente o pedido de "destacar mais as cantrips na tela de criação" — hoje elas apareciam
misturadas com as magias de 1º círculo numa lista só, diferenciadas apenas por um sufixo de texto
"(Cantrip)". Agora viram dois blocos com subtítulo (`<h4>Cantrips</h4>` / `<h4>Magias de 1º Círculo</h4>`)
e cada magia ganha um selo colorido (reaproveitando `--cor-destaque`/`--cor-texto-sobre-destaque`, as
mesmas cores já usadas nos cartões de pacote de equipamento selecionados — sem inventar cor nova).

- [ ] **Step 5: Verificar sintaxe e testes não relacionados**

Run: `node --check docs/creator/js/app.js && node docs/creator/js/dados.test.js && node docs/creator/js/calculo.test.js && node docs/creator/js/magias.test.js`

- [ ] **Step 6: Commit**

```bash
git add docs/creator/js/app.js docs/creator/css/estilo.css
git commit -m "feat(magias): separa cantrips e 1o circulo no resumo com selo de uso, mostra itens"
```

---

## Task 4: Verificação manual do criador (Playwright)

**Files:** nenhum (só verificação)

- [ ] **Step 1: Subir servidor local**

Run: `cd docs/creator && python -m http.server 8950` (background)

- [ ] **Step 2: Percorrer o fluxo com uma classe conjuradora**

Via Playwright, escolha uma classe com magias (ex: Magista), preencha o fluxo completo (Raça → Classe →
Atributos → Equipamento → Magias → Resumo), selecionando os cantrips e magias de 1º círculo exigidos.

- [ ] **Step 3: Conferir no Resumo**

Tire um screenshot e confirme:
- Existe um subtítulo "Cantrips" separado de "Magias de 1º Círculo" (não é mais uma lista única).
- Cada cantrip tem o selo "Uso ilimitado".
- Cada magia de 1º círculo tem o selo "N usos — descanso longo", onde N bate com o número de espaços que
  a classe tem no nível 1 (ex: Magista com modificador de Inteligência +1 deve ter mais que o mínimo de 1).
- Existe uma seção "🎒 Itens" com os 4 itens do kit fixo.

- [ ] **Step 4: Encerrar o servidor**

Run: `pkill -f "http.server 8950"`

- [ ] **Step 5: Reportar**

Sem commit — é só verificação. Se algo não bater, volte pra Task 2/3 antes de seguir.

---

## Task 5: Módulo puro de XP (`experiencia.js`) no painel

**Files:**
- Create: `src/PainelDed.Api/wwwroot/js/experiencia.js`
- Test: `src/PainelDed.Api/wwwroot/js/experiencia.test.js`

- [ ] **Step 1: Escrever o teste que falha**

Crie `src/PainelDed.Api/wwwroot/js/experiencia.test.js`:

```js
const assert = require('assert');
const Experiencia = require('./experiencia.js');

assert.strictEqual(Experiencia.xpPorCd('0'), 10);
assert.strictEqual(Experiencia.xpPorCd('1/8'), 25);
assert.strictEqual(Experiencia.xpPorCd('1/4'), 50);
assert.strictEqual(Experiencia.xpPorCd('1/2'), 100);
assert.strictEqual(Experiencia.xpPorCd('1'), 200);
assert.strictEqual(Experiencia.xpPorCd('2'), 450);
assert.strictEqual(Experiencia.xpPorCd('10'), 5900);
assert.strictEqual(Experiencia.xpPorCd('cd-desconhecido'), 0);

assert.strictEqual(Experiencia.xpNivelAtual(1), 0);
assert.strictEqual(Experiencia.xpNivelAtual(3), 900);
assert.strictEqual(Experiencia.xpNivelAtual(10), 64000);

assert.strictEqual(Experiencia.xpProximoNivel(1), 300);
assert.strictEqual(Experiencia.xpProximoNivel(9), 64000);
assert.strictEqual(Experiencia.xpProximoNivel(10), null);

console.log('experiencia.test.js: OK');
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node src/PainelDed.Api/wwwroot/js/experiencia.test.js`
Expected: `Error: Cannot find module './experiencia.js'`

- [ ] **Step 3: Implementar**

Crie `src/PainelDed.Api/wwwroot/js/experiencia.js` (mesmo padrão dual-export de `dado.js`):

```js
(function (raiz) {
  const XP_POR_CD = {
    '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450,
    '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
  };
  const XP_PARA_NIVEL = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000]; // índice = nível - 1

  function xpPorCd(cd) {
    return XP_POR_CD[cd] ?? 0;
  }

  function xpNivelAtual(nivel) {
    return XP_PARA_NIVEL[nivel - 1] ?? 0;
  }

  function xpProximoNivel(nivel) {
    return XP_PARA_NIVEL[nivel] ?? null;
  }

  const api = { xpPorCd, xpNivelAtual, xpProximoNivel };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.Experiencia = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node src/PainelDed.Api/wwwroot/js/experiencia.test.js`
Expected: `experiencia.test.js: OK`

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/experiencia.js src/PainelDed.Api/wwwroot/js/experiencia.test.js
git commit -m "feat(xp): adiciona modulo puro Experiencia (xp por CD e por nivel)"
```

---

## Task 6: Backend — campos de XP/Itens/Espaços de Magia (`Modelos.cs`)

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`

- [ ] **Step 1: Escrever os testes que falham**

Adicione a `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`, depois do último teste existente
(`Personagem_SemArmas_DesserializaComListaNula`):

```csharp
    [Fact]
    public void Personagem_ComXpItensEEspacosMagia_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Personagem(
            "p1",
            "Sael Marévalis",
            "Humano",
            "Magista",
            1,
            new AtributosPersonagem(9, 14, 16, 16, 11, 11),
            8,
            11,
            new List<PericiaPersonagem>(),
            Xp: 350,
            Itens: new List<string> { "Corda de Cânhamo (15m)", "Tocha (2)" },
            EspacosMagia1: 3);

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal(350, restaurado!.Xp);
        Assert.Equal(2, restaurado.Itens!.Count);
        Assert.Equal("Corda de Cânhamo (15m)", restaurado.Itens[0]);
        Assert.Equal(3, restaurado.EspacosMagia1);
    }

    [Fact]
    public void Personagem_SemXpItensEEspacosMagia_DesserializaComPadroes()
    {
        // Regressão: fichas exportadas antes desta feature não têm esses campos no JSON.
        var json = "{\"Id\":\"p1\",\"Nome\":\"Teste\",\"Raca\":\"Humano\",\"Classe\":\"Guerreiro\",\"Nivel\":1," +
            "\"Atributos\":{\"Forca\":10,\"Destreza\":10,\"Constituicao\":10,\"Inteligencia\":10,\"Sabedoria\":10,\"Carisma\":10}," +
            "\"Pv\":10,\"Ca\":10,\"Pericias\":[]}";

        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal(0, restaurado!.Xp);
        Assert.Null(restaurado.Itens);
        Assert.Null(restaurado.EspacosMagia1);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ModelosTestes"`
Expected: erro de compilação — `Xp`, `Itens`, `EspacosMagia1` não existem em `Personagem` ainda.

- [ ] **Step 3: Implementar os campos e o novo record**

Em `src/PainelDed.Api/Campanhas/Modelos.cs`:

1. Adicione `int Xp = 0, List<string>? Itens = null, int? EspacosMagia1 = null` como os três ÚLTIMOS
   parâmetros de `Personagem` (depois de `List<ArmaPersonagem>? Armas = null`):

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
    List<ArmaPersonagem>? Armas = null,
    int Xp = 0,
    List<string>? Itens = null,
    int? EspacosMagia1 = null);
```

2. Adicione `List<string>? Itens = null, int? EspacosMagia1 = null` (SEM `Xp` — XP não vem do creator, é
   estado do backend) como os dois últimos parâmetros de `ImportarPersonagemRequisicao`:

```csharp
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
    List<ArmaPersonagem>? Armas = null,
    List<string>? Itens = null,
    int? EspacosMagia1 = null);
```

3. Adicione, depois de `AtualizarStatusSideQuestRequisicao`:

```csharp
public record AdicionarXpRequisicao(int Quantidade, string Motivo = "");
```

## Context

`Xp` fica de fora de `ImportarPersonagemRequisicao` de propósito — é estado acumulado que só o backend
gerencia (via combate/side quest/manual), igual `SideQuestAtual` já é hoje. Se entrasse no import,
reimportar uma ficha existente (ex: depois de editar no creator) zeraria o XP ganho — o mesmo problema que
o teste de regressão de `SideQuestAtual` já documenta para aquele campo.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ModelosTestes"`

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
git commit -m "feat(xp): adiciona campos Xp, Itens e EspacosMagia1 em Personagem"
```

---

## Task 7: Backend — `ServicoPersonagens.AdicionarXp` + XP automático na side quest

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`

- [ ] **Step 1: Escrever os testes que falham**

`ServicoPersonagens` vai passar a depender de `ServicoHistorico` (pra registrar cada ganho de XP no
histórico da campanha). Isso muda o construtor — atualize o setup do teste ANTES de escrever os novos
testes, senão nada compila.

Em `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`, troque:

```csharp
        _dado = new DadoFixo(1);
        _servico = new ServicoPersonagens(_repositorio, _repositorioSideQuests, _dado);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
```

por:

```csharp
        _dado = new DadoFixo(1);
        _servicoHistorico = new ServicoHistorico(_repositorio);
        _servico = new ServicoPersonagens(_repositorio, _repositorioSideQuests, _dado, _servicoHistorico);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
```

E adicione o campo correspondente perto dos outros campos privados da classe:

```csharp
    private readonly ServicoHistorico _servicoHistorico;
```

Agora adicione os testes novos, no final da classe (antes do `}` de fechamento):

```csharp
    [Fact]
    public void AdicionarXp_ComPersonagemExistente_SomaAoXpEValida()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        var atualizado = _servico.AdicionarXp(_campanhaId, criado.Id, 100, "venceu um Rato");

        Assert.NotNull(atualizado);
        Assert.Equal(100, atualizado!.Xp);
    }

    [Fact]
    public void AdicionarXp_ChamadoDuasVezes_AcumulaOXp()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        _servico.AdicionarXp(_campanhaId, criado.Id, 100, "primeiro combate");
        var atualizado = _servico.AdicionarXp(_campanhaId, criado.Id, 50, "segundo combate");

        Assert.Equal(150, atualizado!.Xp);
    }

    [Fact]
    public void AdicionarXp_RegistraNoHistoricoDaCampanha()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        _servico.AdicionarXp(_campanhaId, criado.Id, 100, "venceu um Rato");

        var historico = _servicoHistorico.Listar(_campanhaId)!;
        Assert.Single(historico);
        Assert.Equal("Kess Bramo ganhou 100 XP (venceu um Rato)", historico[0].Descricao);
    }

    [Fact]
    public void AdicionarXp_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.AdicionarXp("nao-existe", "qualquer-id", 100, "motivo"));
    }

    [Fact]
    public void AdicionarXp_ComPersonagemInexistente_RetornaNulo()
    {
        Assert.Null(_servico.AdicionarXp(_campanhaId, "nao-existe", 100, "motivo"));
    }

    [Fact]
    public void AtualizarStatusSideQuest_ComStatusConcluida_SomaXpSugeridoAoPersonagem()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;
        _servico.SortearSideQuest(_campanhaId, criado.Id); // DadoFixo(1) -> XP sugerido = 5

        var atualizado = _servico.AtualizarStatusSideQuest(_campanhaId, criado.Id, "concluida");

        Assert.NotNull(atualizado);
        Assert.Equal(5, atualizado!.Xp);
        Assert.Equal("concluida", atualizado.SideQuestAtual!.Status);
    }

    [Fact]
    public void AtualizarStatusSideQuest_ComStatusDescartada_NaoSomaXp()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;
        _servico.SortearSideQuest(_campanhaId, criado.Id);

        var atualizado = _servico.AtualizarStatusSideQuest(_campanhaId, criado.Id, "descartada");

        Assert.Equal(0, atualizado!.Xp);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~ServicoPersonagensTestes"`
Expected: erro de compilação (`AdicionarXp` não existe, construtor com 4 argumentos não existe ainda).

- [ ] **Step 3: Implementar**

Em `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`, substitua o topo da classe (campos + construtor)
por:

```csharp
using PainelDed.Nucleo.Rolagem;

namespace PainelDed.Api.Campanhas;

public class ServicoPersonagens
{
    private readonly RepositorioCampanhas _repositorio;
    private readonly RepositorioSideQuests _repositorioSideQuests;
    private readonly IDado _dado;
    private readonly ServicoHistorico _servicoHistorico;

    public ServicoPersonagens(RepositorioCampanhas repositorio, RepositorioSideQuests repositorioSideQuests, IDado dado, ServicoHistorico servicoHistorico)
    {
        _repositorio = repositorio;
        _repositorioSideQuests = repositorioSideQuests;
        _dado = dado;
        _servicoHistorico = servicoHistorico;
    }
```

Na chamada ao construtor de `Personagem` dentro de `Importar`, troque o final (`existente?.SideQuestAtual,
Armas: requisicao.Armas);`) por:

```csharp
            existente?.SideQuestAtual,
            Armas: requisicao.Armas,
            Xp: existente?.Xp ?? 0,
            Itens: requisicao.Itens,
            EspacosMagia1: requisicao.EspacosMagia1);
```

Adicione dois métodos novos, depois de `AtualizarStatusSideQuest`:

```csharp
    public Personagem? AdicionarXp(string campanhaId, string personagemId, int quantidade, string motivo)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var personagens = estado.Personagens ?? new List<Personagem>();
        var existente = personagens.FirstOrDefault(p => p.Id == personagemId);
        if (existente is null)
        {
            return null;
        }

        var atualizado = existente with { Xp = existente.Xp + quantidade };
        personagens[personagens.IndexOf(existente)] = atualizado;
        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });

        var descricao = string.IsNullOrWhiteSpace(motivo)
            ? $"{atualizado.Nome} ganhou {quantidade} XP"
            : $"{atualizado.Nome} ganhou {quantidade} XP ({motivo})";
        _servicoHistorico.Registrar(campanhaId, descricao);

        return atualizado;
    }
```

E troque o corpo de `AtualizarStatusSideQuest` (a parte depois de salvar o estado) — de:

```csharp
        personagens[personagens.IndexOf(existente)] = atualizado;
        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });
        return atualizado;
    }
```

para:

```csharp
        personagens[personagens.IndexOf(existente)] = atualizado;
        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });

        if (novoStatus == "concluida")
        {
            return AdicionarXp(campanhaId, personagemId, existente.SideQuestAtual.XpSugerido, $"side quest: {existente.SideQuestAtual.Titulo}");
        }

        return atualizado;
    }
```

## Context

`AdicionarXp` é o método central — usado pelo endpoint HTTP (Task 8, chamada manual do mestre e chamada
automática do combate) E internamente por `AtualizarStatusSideQuest` quando a side quest é concluída. Ele
recarrega o estado do zero (`_repositorio.CarregarEstado`) em vez de reaproveitar `estado`/`personagens`
de fora, então é seguro chamá-lo depois de `AtualizarStatusSideQuest` já ter salvo a mudança de status —
ele vai ler o status já atualizado e só somar o XP em cima disso, sem sobrescrever nada.

- [ ] **Step 4: Rodar e confirmar que passa (suíte inteira)**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam — inclui os novos e confirma que o `ServicoHistorico` injetado não
quebrou nenhum teste existente que constrói `ServicoPersonagens` manualmente (só existe esse arquivo de
teste fazendo isso, conferido no Step 1).

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/ServicoPersonagens.cs tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
git commit -m "feat(xp): adiciona ServicoPersonagens.AdicionarXp e credita XP ao concluir side quest"
```

---

## Task 8: Endpoint HTTP de XP + wrapper no `api.js`

**Files:**
- Modify: `src/PainelDed.Api/Program.cs`
- Modify: `src/PainelDed.Api/wwwroot/js/api.js`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs`

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs`, depois do teste
`ImportarPersonagemComArmas_DepoisObter_RetornaArmas` (ou do último teste de personagem que existir):

```csharp
    [Fact]
    public async Task AdicionarXp_DepoisObter_RetornaXpAtualizado()
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
            new List<PericiaPersonagem>());
        var importarResposta = await cliente.PostAsJsonAsync($"/api/campanhas/{campanhaId}/personagens/importar", requisicao);
        var personagem = await importarResposta.Content.ReadFromJsonAsync<Personagem>();

        var xpResposta = await cliente.PostAsJsonAsync(
            $"/api/campanhas/{campanhaId}/personagens/{personagem!.Id}/xp/adicionar",
            new AdicionarXpRequisicao(200, "venceu um Goblin"));
        xpResposta.EnsureSuccessStatusCode();

        var obterResposta = await cliente.GetAsync($"/api/campanhas/{campanhaId}/personagens/{personagem.Id}");
        var obtido = await obterResposta.Content.ReadFromJsonAsync<Personagem>();

        Assert.Equal(200, obtido!.Xp);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~AdicionarXp_DepoisObter"`
Expected: 404 — a rota não existe ainda.

- [ ] **Step 3: Implementar o endpoint**

Em `src/PainelDed.Api/Program.cs`, adicione depois do bloco de `side-quest/status`:

```csharp
app.MapPost("/api/campanhas/{campanhaId}/personagens/{personagemId}/xp/adicionar", (string campanhaId, string personagemId, AdicionarXpRequisicao requisicao, ServicoPersonagens servico) =>
{
    var personagem = servico.AdicionarXp(campanhaId, personagemId, requisicao.Quantidade, requisicao.Motivo);
    return personagem is null ? Results.NotFound() : Results.Ok(personagem);
});
```

- [ ] **Step 4: Adicionar o wrapper no `api.js`**

Em `src/PainelDed.Api/wwwroot/js/api.js`, adicione depois de `atualizarStatusSideQuest`:

```js
  async adicionarXp(campanhaId, personagemId, quantidade, motivo) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/personagens/${personagemId}/xp/adicionar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade, motivo }),
    });
    if (!resposta.ok) throw new Error('Falha ao adicionar XP');
    return resposta.json();
  },
```

- [ ] **Step 5: Rodar e confirmar que passa (suíte inteira)**

Run: `dotnet test tests/PainelDed.Api.Testes` (backend) e `node --check src/PainelDed.Api/wwwroot/js/api.js` (sintaxe do JS).

- [ ] **Step 6: Commit**

```bash
git add src/PainelDed.Api/Program.cs src/PainelDed.Api/wwwroot/js/api.js tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs
git commit -m "feat(xp): adiciona endpoint POST xp/adicionar e wrapper Api.adicionarXp"
```

---

## Task 9: Carregar `experiencia.js` no painel (`index.html`)

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/index.html`

- [ ] **Step 1: Ler o bloco de scripts atual**

Confirme o estado atual (deve ter as versões que as specs anteriores deixaram: `personagens.js?v=3`,
`dado.js?v=1`, `combate.js?v=4`) antes de editar — a Task 10 e a Task 12 vão bumpar `combate.js` e
`personagens.js`, então essa ordem de tasks importa: faça esta Task 9 primeiro.

- [ ] **Step 2: Adicionar o script e preparar os bumps**

Troque:

```html
  <script src="js/personagens.js?v=3"></script>
  <script src="js/dado.js?v=1"></script>
  <script src="js/combate.js?v=4"></script>
```

por:

```html
  <script src="js/personagens.js?v=4"></script>
  <script src="js/dado.js?v=1"></script>
  <script src="js/experiencia.js?v=1"></script>
  <script src="js/combate.js?v=5"></script>
```

Isso já bumpa `personagens.js` (Task 12 vai reescrever o arquivo) e `combate.js` (Task 10 vai editar o
arquivo) de antemão — evita esquecer o cache-bust como aconteceu com `quests.js` antes. Também bump o
`api.js` (Task 8 já modificou esse arquivo) de `?v=3` para `?v=4`:

```html
  <script src="js/api.js?v=4"></script>
```

- [ ] **Step 3: Verificar**

Confira visualmente que o arquivo final tem, nessa ordem: `tema, api(v4), campanha, markdown, rolador,
quests(v4), personagens(v4), dado(v1), experiencia(v1), combate(v5), app`.

- [ ] **Step 4: Commit**

```bash
git add src/PainelDed.Api/wwwroot/index.html
git commit -m "feat(xp): carrega experiencia.js e bumpa cache de api/personagens/combate"
```

---

## Task 10: Combate concede XP automaticamente ao vencer (`combate.js`)

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/combate.js`

- [ ] **Step 1: Guardar `id` do jogador e `cd` do monstro no estado**

Em `iniciarCombate`, troque:

```js
      jogador: { nome: personagem.nome, ca: personagem.ca, pvMax: personagem.pv, pv: personagem.pv, ataques: this.acoesDoJogador(personagem), atributos: this.modificadorAtributos(personagem.atributos), cdMagia: personagem.cdMagia },
      monstro: { nome: monstro.nome, ca: monstro.ca, pvMax: monstro.pv, pv: monstro.pv, atributos: monstro.atributos, acoes: monstro.acoes },
      turnoDoJogador: jogadorComeca,
      log: [],
      terminado: false,
    };
```

por:

```js
      jogador: { id: personagem.id, nome: personagem.nome, ca: personagem.ca, pvMax: personagem.pv, pv: personagem.pv, ataques: this.acoesDoJogador(personagem), atributos: this.modificadorAtributos(personagem.atributos), cdMagia: personagem.cdMagia },
      monstro: { nome: monstro.nome, cd: monstro.cd, ca: monstro.ca, pvMax: monstro.pv, pv: monstro.pv, atributos: monstro.atributos, acoes: monstro.acoes },
      turnoDoJogador: jogadorComeca,
      log: [],
      terminado: false,
      xpConcedido: false,
      xpGanho: null,
    };
```

- [ ] **Step 2: Conceder XP quando o monstro morre**

Em `aplicarDano`, troque:

```js
  aplicarDano(combatente, dano) {
    combatente.pv = Math.max(0, combatente.pv - dano);
    if (combatente.pv === 0) {
      this.estado.terminado = true;
    }
  },
```

por:

```js
  aplicarDano(combatente, dano) {
    combatente.pv = Math.max(0, combatente.pv - dano);
    if (combatente.pv === 0) {
      this.estado.terminado = true;
      if (combatente === this.estado.monstro) {
        this.concederXpVitoria();
      }
    }
  },

  async concederXpVitoria() {
    if (this.estado.xpConcedido) return;
    this.estado.xpConcedido = true;
    const xp = Experiencia.xpPorCd(this.estado.monstro.cd);
    try {
      await Api.adicionarXp(Campanha.ativa.id, this.estado.jogador.id, xp, `venceu ${this.estado.monstro.nome}`);
      this.estado.xpGanho = xp;
    } catch (erro) {
      console.error(erro);
    }
    this.renderizarCombate();
  },
```

- [ ] **Step 3: Mostrar o XP ganho no banner de vitória**

Em `renderizarCombate`, dentro do bloco `if (this.estado.terminado) { ... }`, adicione depois de
`area.appendChild(banner);`:

```js
      if (this.estado.xpGanho) {
        const xpTexto = document.createElement('p');
        xpTexto.className = 'texto-xp-combate';
        xpTexto.textContent = `+${this.estado.xpGanho} XP para ${this.estado.jogador.nome}`;
        area.appendChild(xpTexto);
      }
```

## Context

`aplicarDano` é chamado tanto pelo fluxo de ataque normal quanto pelo fluxo de resistência (`criarFluxoAtaque`/`criarFluxoResistencia`) — colocando a checagem ali dentro, os dois caminhos concedem XP igual, sem duplicar lógica. `concederXpVitoria` é assíncrono mas não é `await`ado por `aplicarDano` (que não é `async`) — o primeiro `renderizarCombate()` (chamado pelo handler de clique logo depois de `aplicarDano` retornar) mostra o banner SEM o XP ainda; quando a chamada à API resolve, `concederXpVitoria` seta `xpGanho` e chama `renderizarCombate()` de novo, agora mostrando a linha de XP. O flag `xpConcedido` evita conceder XP duas vezes se o mestre re-renderizar o combate de algum jeito depois do fim.

- [ ] **Step 4: Verificar sintaxe**

Run: `node --check src/PainelDed.Api/wwwroot/js/combate.js`

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/combate.js
git commit -m "feat(xp): combate concede xp automaticamente ao derrotar o monstro"
```

---

## Task 11: CSS do painel — seções com borda, barra de XP, aviso de nível

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/css/estilo.css`

- [ ] **Step 1: Generalizar `.side-quest-ficha` para `.secao-ficha`**

Troque o bloco (linhas ~183-187):

```css
.side-quest-ficha {
  border: 1px solid var(--cor-borda);
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
}
```

por:

```css
.secao-ficha {
  border: 1px solid var(--cor-borda);
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  margin-top: 0.9rem;
}

.secao-ficha h4 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.5rem;
}

.secao-ficha h5 {
  margin: 0.6rem 0 0.3rem;
  color: var(--cor-texto-suave);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
```

(`.acoes-side-quest`, logo abaixo, fica como está — ainda é usada pelos botões da Side Quest.)

- [ ] **Step 2: Adicionar CSS de XP e itens visuais novos**

No mesmo arquivo, adicione perto de `.destaques-ficha`/`.destaque-ficha` (seção `.ficha-personagem`):

```css
.chip-xp-cartao {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: var(--cor-destaque);
  font-weight: 600;
}

.bloco-xp {
  margin-bottom: 1rem;
}

.trilho-xp {
  background: var(--cor-fundo);
  border-radius: 6px;
  height: 12px;
  overflow: hidden;
  margin: 0.3rem 0;
}

.preenchimento-xp {
  background: var(--cor-destaque);
  height: 100%;
}

.aviso-nivel {
  color: var(--cor-destaque);
  font-weight: 700;
  margin: 0.4rem 0;
}

.controle-xp-manual {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.controle-xp-manual input {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--cor-borda);
  background: var(--cor-fundo);
  color: var(--cor-texto);
}

.texto-xp-combate {
  text-align: center;
  color: var(--cor-destaque);
  font-weight: 700;
  margin: -0.5rem 0 1rem;
}
```

## Context

`.secao-ficha` generaliza o cartão com borda que a Side Quest já usava, pra Task 12 poder envolver todas
as outras seções (Perícias, Combate, Testes de Resistência, Traços, Habilidades, Magias, Itens, Side
Quest, História, Características) na mesma linguagem visual, sem inventar nada novo. `.etiqueta-dado`
(já existente no arquivo, usada nas tabelas roláveis) será reaproveitada pelo selo de uso de magia — não
precisa de classe nova pra isso.

- [ ] **Step 3: Commit**

```bash
git add src/PainelDed.Api/wwwroot/css/estilo.css
git commit -m "feat(ux-mestre): generaliza cartao com borda em .secao-ficha, adiciona css de barra de xp"
```

---

## Task 12: Redesign da ficha do jogador na tela do mestre (`personagens.js`)

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/personagens.js`

- [ ] **Step 1: Adicionar helper `criarSecaoFicha`**

No topo do arquivo, logo depois de `formatarComSinal`, adicione:

```js
function criarSecaoFicha(icone, titulo) {
  const secao = document.createElement('div');
  secao.className = 'secao-ficha';
  const cabecalho = document.createElement('h4');
  cabecalho.textContent = `${icone} ${titulo}`;
  secao.appendChild(cabecalho);
  return secao;
}
```

- [ ] **Step 2: Adicionar chip de XP no cartão da lista**

Em `criarCartaoLista`, adicione antes do `return cartao;`:

```js
    const xpLinha = document.createElement('p');
    xpLinha.className = 'chip-xp-cartao';
    xpLinha.textContent = `⭐ ${personagem.xp || 0} XP`;
    cartao.appendChild(xpLinha);
```

- [ ] **Step 3: Adicionar método `criarBlocoXp`**

Adicione como um novo método do objeto `Personagens`, antes de `exibirDetalhe`:

```js
  criarBlocoXp(personagem) {
    const bloco = document.createElement('div');
    bloco.className = 'bloco-xp';

    const xpAtual = personagem.xp || 0;
    const baseNivel = Experiencia.xpNivelAtual(personagem.nivel);
    const proximoNivel = Experiencia.xpProximoNivel(personagem.nivel);

    const linhaTexto = document.createElement('p');
    linhaTexto.className = 'detalhes-quest';
    linhaTexto.textContent = proximoNivel === null
      ? `XP: ${xpAtual} (nível máximo)`
      : `XP: ${xpAtual}/${proximoNivel} (nível ${personagem.nivel})`;
    bloco.appendChild(linhaTexto);

    const trilho = document.createElement('div');
    trilho.className = 'trilho-xp';
    const preenchimento = document.createElement('div');
    preenchimento.className = 'preenchimento-xp';
    const progresso = proximoNivel === null
      ? 100
      : Math.min(100, Math.max(0, ((xpAtual - baseNivel) / (proximoNivel - baseNivel)) * 100));
    preenchimento.style.width = `${progresso}%`;
    trilho.appendChild(preenchimento);
    bloco.appendChild(trilho);

    if (proximoNivel !== null && xpAtual >= proximoNivel) {
      const aviso = document.createElement('p');
      aviso.className = 'aviso-nivel';
      aviso.textContent = '🎉 Pronto pra subir de nível!';
      bloco.appendChild(aviso);
    }

    const controleManual = document.createElement('div');
    controleManual.className = 'controle-xp-manual';
    const campoXp = document.createElement('input');
    campoXp.type = 'number';
    campoXp.placeholder = 'Quantidade de XP';
    const botaoAdicionar = document.createElement('button');
    botaoAdicionar.className = 'botao-secundario';
    botaoAdicionar.textContent = '+ Adicionar XP';
    botaoAdicionar.addEventListener('click', async () => {
      const quantidade = parseInt(campoXp.value, 10);
      if (!quantidade) return;
      botaoAdicionar.disabled = true;
      try {
        await Api.adicionarXp(Campanha.ativa.id, personagem.id, quantidade, 'manual (mestre)');
      } catch (erro) {
        console.error(erro);
        window.alert('Falha ao adicionar XP.');
        botaoAdicionar.disabled = false;
        return;
      }
      await this.exibirDetalhe(personagem.id);
      await this.recarregar();
    });
    controleManual.appendChild(campoXp);
    controleManual.appendChild(botaoAdicionar);
    bloco.appendChild(controleManual);

    return bloco;
  },
```

- [ ] **Step 4: Reescrever `exibirDetalhe`**

Substitua o método `exibirDetalhe` inteiro por:

```js
  async exibirDetalhe(personagemId, cartaoSelecionado) {
    document.querySelectorAll('.cartao-personagem.selecionado').forEach((c) => c.classList.remove('selecionado'));
    if (cartaoSelecionado) {
      cartaoSelecionado.classList.add('selecionado');
    }

    const detalhe = document.getElementById('detalhe-personagem');
    detalhe.innerHTML = '<p class="carregando">Carregando…</p>';

    let personagem;
    try {
      personagem = await Api.obterPersonagem(Campanha.ativa.id, personagemId);
    } catch (erro) {
      detalhe.innerHTML = '<p class="mensagem-erro">Falha ao carregar a ficha.</p>';
      console.error(erro);
      return;
    }

    detalhe.innerHTML = '';

    const titulo = document.createElement('h3');
    titulo.textContent = personagem.nome;
    detalhe.appendChild(titulo);

    const subtitulo = document.createElement('p');
    subtitulo.className = 'detalhes-quest';
    subtitulo.textContent = `${personagem.raca} · ${personagem.classe} · Nível ${personagem.nivel}`;
    detalhe.appendChild(subtitulo);

    const destaques = document.createElement('div');
    destaques.className = 'destaques-ficha';
    [['PV', personagem.pv], ['CA', personagem.ca]].forEach(([rotulo, valor]) => {
      const destaque = document.createElement('span');
      destaque.className = 'destaque-ficha';
      destaque.textContent = `${rotulo} ${valor}`;
      destaques.appendChild(destaque);
    });
    detalhe.appendChild(destaques);

    detalhe.appendChild(this.criarBlocoXp(personagem));

    const grade = document.createElement('div');
    grade.className = 'grade-atributos-ficha';
    Object.entries(NOMES_ATRIBUTOS_PERSONAGEM).forEach(([chave, rotulo]) => {
      const valor = personagem.atributos[chave];
      const item = document.createElement('div');
      item.className = 'item-atributo-ficha';
      const nomeAtributo = document.createElement('span');
      nomeAtributo.textContent = rotulo;
      const valorAtributo = document.createElement('strong');
      valorAtributo.textContent = `${valor} (${formatarComSinal(modificadorAtributo(valor))})`;
      item.appendChild(nomeAtributo);
      item.appendChild(valorAtributo);
      grade.appendChild(item);
    });
    detalhe.appendChild(grade);

    const secaoPericias = criarSecaoFicha('🎯', 'Perícias');
    const listaPericias = document.createElement('ul');
    listaPericias.className = 'lista-pericias-ficha';
    if (personagem.pericias.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'Nenhuma perícia com proficiência.';
      listaPericias.appendChild(item);
    } else {
      personagem.pericias.forEach((pericia) => {
        const item = document.createElement('li');
        item.textContent = `${pericia.nome}: ${formatarComSinal(pericia.bonus)}`;
        listaPericias.appendChild(item);
      });
    }
    secaoPericias.appendChild(listaPericias);
    detalhe.appendChild(secaoPericias);

    if (personagem.testesResistencia && personagem.testesResistencia.length > 0) {
      const secaoCombate = criarSecaoFicha('🛡️', 'Combate');
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
      secaoCombate.appendChild(destaquesCombate);
      detalhe.appendChild(secaoCombate);

      const secaoResistencias = criarSecaoFicha('🎲', 'Testes de Resistência');
      const listaResistencias = document.createElement('ul');
      listaResistencias.className = 'lista-pericias-ficha';
      personagem.testesResistencia.forEach((teste) => {
        const item = document.createElement('li');
        const rotulo = NOMES_ATRIBUTOS_PERSONAGEM[teste.atributo] || teste.atributo;
        item.textContent = `${rotulo}${teste.proficiente ? ' (proficiente)' : ''}: ${formatarComSinal(teste.bonus)}`;
        listaResistencias.appendChild(item);
      });
      secaoResistencias.appendChild(listaResistencias);
      detalhe.appendChild(secaoResistencias);
    }

    if (personagem.tracosRaciais && personagem.tracosRaciais.length > 0) {
      const secaoTracos = criarSecaoFicha('🧬', 'Traços Raciais');
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
      secaoTracos.appendChild(listaTracos);
      detalhe.appendChild(secaoTracos);
    }

    if (personagem.habilidadesClasse && personagem.habilidadesClasse.length > 0) {
      const secaoHabilidades = criarSecaoFicha('⚔️', 'Habilidades de Classe');
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
      secaoHabilidades.appendChild(listaHabilidades);
      detalhe.appendChild(secaoHabilidades);
    }

    if (personagem.magiasConhecidas && personagem.magiasConhecidas.length > 0) {
      const secaoMagias = criarSecaoFicha('✨', 'Magias');

      const criarListaMagias = (subtituloTexto, magias, calcularSelo) => {
        if (magias.length === 0) return;
        const subtitulo = document.createElement('h5');
        subtitulo.textContent = subtituloTexto;
        secaoMagias.appendChild(subtitulo);

        const lista = document.createElement('ul');
        lista.className = 'lista-pericias-ficha';
        magias.forEach((magia) => {
          const item = document.createElement('li');
          const negrito = document.createElement('strong');
          negrito.textContent = `${magia.nome} `;
          item.appendChild(negrito);

          const badge = document.createElement('span');
          badge.className = 'etiqueta-dado';
          badge.textContent = calcularSelo(magia);
          item.appendChild(badge);

          const partesEfeito = [magia.escola, magia.alcance, magia.duracao];
          if (magia.dano) partesEfeito.push(magia.dano);
          if (magia.testeResistencia) partesEfeito.push(`Resistência: ${magia.testeResistencia}`);
          item.appendChild(document.createElement('br'));
          item.appendChild(document.createTextNode(partesEfeito.join(' · ')));

          lista.appendChild(item);
        });
        secaoMagias.appendChild(lista);
      };

      criarListaMagias('Cantrips', personagem.magiasConhecidas.filter((m) => m.circulo === 0), () => 'Uso ilimitado');
      criarListaMagias(
        'Magias de 1º Círculo',
        personagem.magiasConhecidas.filter((m) => m.circulo === 1),
        () => `${personagem.espacosMagia1 ?? '?'} usos — descanso longo`,
      );

      detalhe.appendChild(secaoMagias);
    }

    if (personagem.itens && personagem.itens.length > 0) {
      const secaoItens = criarSecaoFicha('🎒', 'Itens');
      const listaItens = document.createElement('ul');
      listaItens.className = 'lista-pericias-ficha';
      personagem.itens.forEach((nomeItem) => {
        const item = document.createElement('li');
        item.textContent = nomeItem;
        listaItens.appendChild(item);
      });
      secaoItens.appendChild(listaItens);
      detalhe.appendChild(secaoItens);
    }

    const secaoSideQuest = criarSecaoFicha('📜', 'Side Quest');
    const containerSideQuest = document.createElement('div');

    if (personagem.sideQuestAtual && personagem.sideQuestAtual.status === 'pendente') {
      const sq = personagem.sideQuestAtual;

      const linhaTitulo = document.createElement('p');
      const negrito = document.createElement('strong');
      negrito.textContent = `${sq.titulo} `;
      linhaTitulo.appendChild(negrito);
      linhaTitulo.appendChild(document.createTextNode(`(XP sugerido: ${sq.xpSugerido})`));
      containerSideQuest.appendChild(linhaTitulo);

      const descricao = document.createElement('p');
      descricao.className = 'texto-livre-ficha';
      descricao.textContent = sq.descricao;
      containerSideQuest.appendChild(descricao);

      const acoes = document.createElement('div');
      acoes.className = 'acoes-side-quest';

      const botaoConcluir = document.createElement('button');
      botaoConcluir.className = 'botao-rolar';
      botaoConcluir.textContent = '✅ Concluída';
      botaoConcluir.addEventListener('click', async () => {
        botaoConcluir.disabled = true;
        try {
          await Api.atualizarStatusSideQuest(Campanha.ativa.id, personagem.id, 'concluida');
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao atualizar a side quest.');
          return;
        }
        await this.exibirDetalhe(personagem.id);
        await this.recarregar();
      });
      acoes.appendChild(botaoConcluir);

      const botaoDescartar = document.createElement('button');
      botaoDescartar.className = 'botao-secundario';
      botaoDescartar.textContent = '❌ Descartar';
      botaoDescartar.addEventListener('click', async () => {
        botaoDescartar.disabled = true;
        try {
          await Api.atualizarStatusSideQuest(Campanha.ativa.id, personagem.id, 'descartada');
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao atualizar a side quest.');
          return;
        }
        await this.exibirDetalhe(personagem.id);
      });
      acoes.appendChild(botaoDescartar);

      containerSideQuest.appendChild(acoes);
    } else {
      const botaoSortear = document.createElement('button');
      botaoSortear.className = 'botao-rolar';
      botaoSortear.textContent = '🎲 Sortear Side Quest';
      botaoSortear.addEventListener('click', async () => {
        botaoSortear.disabled = true;
        try {
          await Api.sortearSideQuest(Campanha.ativa.id, personagem.id);
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao sortear side quest.');
          return;
        }
        await this.exibirDetalhe(personagem.id);
      });
      containerSideQuest.appendChild(botaoSortear);
    }

    secaoSideQuest.appendChild(containerSideQuest);
    detalhe.appendChild(secaoSideQuest);

    if (personagem.historia) {
      const secaoHistoria = criarSecaoFicha('📖', 'História');
      const textoHistoria = document.createElement('p');
      textoHistoria.className = 'texto-livre-ficha';
      textoHistoria.textContent = personagem.historia;
      secaoHistoria.appendChild(textoHistoria);
      detalhe.appendChild(secaoHistoria);
    }

    if (personagem.caracteristicasFisicas) {
      const secaoCaracteristicas = criarSecaoFicha('👤', 'Características Físicas');
      const textoCaracteristicas = document.createElement('p');
      textoCaracteristicas.className = 'texto-livre-ficha';
      textoCaracteristicas.textContent = personagem.caracteristicasFisicas;
      secaoCaracteristicas.appendChild(textoCaracteristicas);
      detalhe.appendChild(secaoCaracteristicas);
    }
  },
```

## Context

Essa reescrita preserva 100% do comportamento funcional que já existia (mesmos listeners, mesmas
chamadas de API, mesma lógica condicional) — só reorganiza a estrutura visual: cada seção antes solta
(um `<h4>` seguido de conteúdo direto em `detalhe`) agora vira um `criarSecaoFicha(...)` (cartão com
borda + ícone no título), e duas seções novas aparecem (barra de XP logo no topo, e Itens antes da Side
Quest). A única mudança de comportamento real é a chamada a `this.recarregar()` depois de concluir uma
side quest e depois de adicionar XP manual — pra o chip de XP no cartão da lista lateral ficar sincronizado
sem precisar trocar de personagem e voltar.

O botão "❌ Descartar" continua sem chamar `recarregar()` de propósito (descartar não muda XP nem
precisa atualizar o cartão da lista).

- [ ] **Step 2: Verificar sintaxe**

Run: `node --check src/PainelDed.Api/wwwroot/js/personagens.js`

- [ ] **Step 3: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/personagens.js
git commit -m "feat(ux-mestre): reorganiza ficha do jogador em secoes com icone, adiciona xp e itens"
```

---

## Task 13: Verificação manual end-to-end (Playwright)

**Files:** nenhum (só verificação)

- [ ] **Step 1: Subir a API numa porta isolada**

Run (background): `ASPNETCORE_URLS="http://localhost:5499" dotnet run --project src/PainelDed.Api --no-launch-profile`

⚠️ Antes de rodar, confirme que não há outro processo de build antigo já escutando nessa porta (como
aconteceu na spec anterior, com um processo Release de dias atrás na porta 5108) — use uma porta nova
dedicada a esta verificação.

- [ ] **Step 2: Criar campanha e personagem via API direta**

```bash
curl -s -X POST http://localhost:5499/api/campanhas -H "Content-Type: application/json" -d '{"nome":"Verificacao XP"}'
# guarde o id retornado como CAMPANHA_ID

curl -s -X POST http://localhost:5499/api/campanhas/CAMPANHA_ID/personagens/importar \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste XP",
    "raca": "Humano",
    "classe": "Guerreiro",
    "nivel": 1,
    "atributos": {"forca": 16, "destreza": 12, "constituicao": 14, "inteligencia": 8, "sabedoria": 10, "carisma": 8},
    "pv": 12,
    "ca": 17,
    "pericias": [],
    "armas": [{"nome": "Espada Longa", "dano": "1d8", "tipoDano": "corte", "bonusAcerto": 5, "modDano": 3}],
    "itens": ["Corda de Cânhamo (15m)", "Kit de Curandeiro", "Rações de Viagem (3 dias)", "Tocha (2)"]
  }'
```

Confirme que a resposta já vem com `"xp":0`, `"itens":[...]` preenchido.

- [ ] **Step 3: Verificar a ficha do mestre (visual)**

Via Playwright, abra `http://localhost:5499/`, selecione a campanha, vá em Jogadores, clique no
personagem. Tire um screenshot e confirme:
- Barra de XP aparece logo abaixo de PV/CA, mostrando "XP: 0/300 (nível 1)".
- Cartão na lista lateral mostra "⭐ 0 XP".
- Seção "🎒 Itens" lista os 4 itens.
- Seção "🛡️ Combate" e demais aparecem dentro de cartões com borda visível (não soltas na página).

- [ ] **Step 4: Testar XP manual**

Digite `50` no campo de XP e clique "+ Adicionar XP". Confirme que a barra e o texto atualizam pra
"XP: 50/300" e que o cartão na lista lateral também atualiza pra "⭐ 50 XP" sem precisar trocar de
personagem.

- [ ] **Step 5: Testar XP automático por combate**

Vá em Combate, monte um combate desse personagem contra um monstro CD 0 (ex: Rato), vença. Confirme que
o banner de vitória mostra "+10 XP para Teste XP" (CD 0 = 10 XP). Volte pra Jogadores e confirme que o
XP total agora é 60 (50 do manual + 10 do combate).

- [ ] **Step 6: Testar XP automático por side quest**

No personagem, sorteie uma side quest, clique "✅ Concluída". Confirme que o XP subiu pelo valor do
"XP sugerido" mostrado na side quest.

- [ ] **Step 7: Testar aviso de nível**

Continue adicionando XP manual até passar de 300. Confirme que aparece "🎉 Pronto pra subir de nível!" e
que a barra mostra progresso em relação ao próximo limiar (nível 3 = 900).

- [ ] **Step 8: Encerrar a API**

Pare o processo iniciado no Step 1.

- [ ] **Step 9: Reportar**

Sem commit — é só verificação. Se algo não bater, volte pra Task 7/10/12 e corrija antes de considerar a
feature pronta.

---

## Task 14: Suíte completa e publicação

**Files:** nenhum (verificação + deploy)

- [ ] **Step 1: Rodar toda a suíte de testes**

```bash
node docs/creator/js/dados.test.js
node docs/creator/js/calculo.test.js
node docs/creator/js/magias.test.js
node src/PainelDed.Api/wwwroot/js/dado.test.js
node src/PainelDed.Api/wwwroot/js/experiencia.test.js
dotnet test tests/PainelDed.Api.Testes
dotnet test tests/PainelDed.Nucleo.Testes
```

Expected: tudo `OK` / `Passed`, nenhuma falha.

- [ ] **Step 2: Push**

```bash
git push origin main
```

- [ ] **Step 3: Confirmar publicação do criador**

Aguarde alguns minutos e confirme em `https://jonasmoura247.github.io/rpg-mesa/creator/` que o Resumo
mostra Cantrips e Magias de 1º Círculo em blocos separados com selo, e a seção "🎒 Itens".

- [ ] **Step 4: Avisar sobre o painel do mestre**

O painel do mestre (`src/PainelDed.Api`) não tem deploy automático — é rodado localmente. Avise que é
preciso reiniciar o processo local (parar o antigo, rodar `dotnet run` de novo) pra ver XP, itens, selos
de magia e o redesign da ficha do jogador.
