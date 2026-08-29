# Importação de Personagem + Aba Jogadores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir importar o `character.json` gerado pelo `/creator` no painel principal (por campanha) e consultar a ficha completa de cada jogador numa nova aba "Jogadores" da barra lateral.

**Architecture:** Backend ASP.NET Minimal API expande o padrão já usado por Quests/Histórico (estado JSON por campanha em `data/campanhas/{id}.json`, via `RepositorioCampanhas`) com uma nova lista `Personagens` dentro do mesmo `EstadoCampanha`. Frontend adiciona `js/personagens.js` seguindo exatamente o padrão de `js/quests.js` (objeto com `exibir()`/`recarregar()`, renderização manual via `document.createElement`, sem framework).

**Tech Stack:** C# / ASP.NET Core Minimal API, xUnit (backend), JavaScript vanilla + CSS (frontend, sem testes automatizados — consistente com o resto do frontend do projeto, que também não tem).

Esta é a segunda parte do spec `docs/superpowers/specs/2026-08-28-ficha-personagem-criador-jogadores-design.md` (a primeira parte, o `/creator`, já está implementada — plano `2026-08-28-criador-de-ficha.md`). Os 3 arquivos em `docs/creator/exemplos/*.json` servem de fixture real pro teste manual final.

---

## File Structure

```
src/PainelDed.Api/Campanhas/
  Modelos.cs                    — adiciona AtributosPersonagem, PericiaPersonagem, Personagem,
                                   ImportarPersonagemRequisicao; adiciona Personagens a EstadoCampanha
  ServicoPersonagens.cs         — novo: Listar, Obter, Importar (cria ou substitui por nome)
src/PainelDed.Api/
  Program.cs                    — registra ServicoPersonagens + 3 endpoints

src/PainelDed.Api/wwwroot/
  index.html                    — botão "🧑‍🤝‍🧑 Jogadores" na barra lateral, novo script, bump ?v=3
  js/api.js                     — listarPersonagens, obterPersonagem, importarPersonagem
  js/personagens.js             — novo: aba Jogadores (lista, ficha detalhada, importar arquivo)
  js/app.js                     — wiring do botão + recarregar em campanha-trocada
  css/estilo.css                — estilos da aba Jogadores

tests/PainelDed.Api.Testes/Campanhas/
  ModelosTestes.cs               — testes de serialização de Personagem + EstadoCampanha sem Personagens
  ServicoPersonagensTestes.cs    — novo: testes do serviço
  EndpointsCampanhasTestes.cs    — testes de integração dos novos endpoints
```

---

### Task 1: Modelos de Personagem + testes de serialização

**Files:**
- Modify: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`

- [ ] **Step 1: Escrever os testes (falhando — erro de compilação, os tipos ainda não existem)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`, dentro da classe, antes do `}` final:

```csharp

    [Fact]
    public void Personagem_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Personagem(
            "p1",
            "Kess Bramo",
            "Humano",
            "Ladino",
            1,
            new AtributosPersonagem(9, 16, 16, 14, 9, 13),
            11,
            13,
            new List<PericiaPersonagem> { new("Furtividade", "destreza", true, 5) });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal("Kess Bramo", restaurado!.Nome);
        Assert.Equal(16, restaurado.Atributos.Destreza);
        Assert.Single(restaurado.Pericias);
    }

    [Fact]
    public void EstadoCampanha_SemPersonagens_DesserializaComListaNula()
    {
        // Regressão: arquivos de campanha salvos antes desta feature não têm a
        // propriedade "Personagens" — o ServicoPersonagens trata esse null como
        // lista vazia (ver ServicoPersonagensTestes), mas a desserialização em si
        // precisa continuar funcionando sem lançar exceção.
        var json = "{\"Quests\":[],\"HistoricoRolagens\":[]}";

        var restaurado = JsonSerializer.Deserialize<EstadoCampanha>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Null(restaurado!.Personagens);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha (erro de compilação)**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: erro de build — `CS0246: O nome de tipo ou espaço de nomes 'Personagem' não pôde ser encontrado` (ou similar para `AtributosPersonagem`/`PericiaPersonagem`).

- [ ] **Step 3: Adicionar os novos registros e expandir `EstadoCampanha`**

Em `src/PainelDed.Api/Campanhas/Modelos.cs`, adicione ao final do arquivo:

```csharp

public record AtributosPersonagem(
    int Forca,
    int Destreza,
    int Constituicao,
    int Inteligencia,
    int Sabedoria,
    int Carisma);

public record PericiaPersonagem(string Nome, string Atributo, bool Proficiente, int Bonus);

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
(`Historia`/`CaracteristicasFisicas` têm default `""` pelo mesmo motivo do `Personagens = null` em `EstadoCampanha` na Task 1: o `/creator` só passou a exportar esses dois campos numa atualização feita depois deste plano ser escrito — sem o default, fichas antigas sem essas chaves no JSON, ou chamadas de construtor já escritas nos testes abaixo sem esses 2 argumentos, deixariam de compilar/desserializar.)

E troque a linha existente:
```csharp
public record EstadoCampanha(List<Quest> Quests, List<EntradaHistorico> HistoricoRolagens);
```
por:
```csharp
public record EstadoCampanha(List<Quest> Quests, List<EntradaHistorico> HistoricoRolagens, List<Personagem>? Personagens = null);
```
(O valor padrão `= null` é essencial: sem ele, a chamada existente `new EstadoCampanha(quests, historico)` com 2 argumentos, usada em `RepositorioCampanhas.Criar` e nos testes já existentes, deixaria de compilar — e arquivos de campanha salvos antes desta feature, que não têm a chave `"Personagens"` no JSON, deixariam de desserializar.)

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam, incluindo os 2 novos e os já existentes em `ModelosTestes.cs`/`RepositorioCampanhasTestes.cs`/etc.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/Modelos.cs tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs
git commit -m "feat(personagens): modelos de Personagem e expande EstadoCampanha"
```

---

### Task 2: `ServicoPersonagens` (Listar, Obter, Importar)

**Files:**
- Create: `src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`
- Create: `tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`

- [ ] **Step 1: Escrever os testes (falhando)**

`tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs`:
```csharp
using System;
using System.Collections.Generic;
using System.IO;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ServicoPersonagensTestes : IDisposable
{
    private readonly string _pastaTemporaria;
    private readonly RepositorioCampanhas _repositorio;
    private readonly ServicoPersonagens _servico;
    private readonly string _campanhaId;

    public ServicoPersonagensTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-servico-personagens-" + Guid.NewGuid());
        _repositorio = new RepositorioCampanhas(_pastaTemporaria);
        _servico = new ServicoPersonagens(_repositorio);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
    }

    public void Dispose()
    {
        Directory.Delete(_pastaTemporaria, recursive: true);
    }

    private static ImportarPersonagemRequisicao RequisicaoDeExemplo(string nome = "Kess Bramo") => new(
        nome,
        "Humano",
        "Ladino",
        1,
        new AtributosPersonagem(9, 16, 16, 14, 9, 13),
        11,
        13,
        new List<PericiaPersonagem>
        {
            new("Furtividade", "destreza", true, 5),
            new("Investigacao", "inteligencia", true, 4),
        },
        "Foge de uma dívida de jogo em outra cidade.",
        "Baixa, cabelo raspado dos lados.");

    [Fact]
    public void Importar_ComCampanhaExistente_CriaPersonagemNovo()
    {
        var personagem = _servico.Importar(_campanhaId, RequisicaoDeExemplo());

        Assert.NotNull(personagem);
        Assert.NotEmpty(personagem!.Id);
        Assert.Equal("Kess Bramo", personagem.Nome);
        Assert.Equal("Baixa, cabelo raspado dos lados.", personagem.CaracteristicasFisicas);
        Assert.Single(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Importar_ComCampanhaInexistente_RetornaNulo()
    {
        var personagem = _servico.Importar("nao-existe", RequisicaoDeExemplo());

        Assert.Null(personagem);
    }

    [Fact]
    public void Importar_ComMesmoNomeDeExistente_SubstituiMantendoOMesmoId()
    {
        var original = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        var atualizado = _servico.Importar(_campanhaId, RequisicaoDeExemplo() with { Pv = 12 });

        Assert.NotNull(atualizado);
        Assert.Equal(original.Id, atualizado!.Id);
        Assert.Equal(12, atualizado.Pv);
        Assert.Single(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Importar_ComNomeDiferente_AdicionaSegundoPersonagem()
    {
        _servico.Importar(_campanhaId, RequisicaoDeExemplo("Kess Bramo"));
        _servico.Importar(_campanhaId, RequisicaoDeExemplo("Bran Ferronaz"));

        Assert.Equal(2, _servico.Listar(_campanhaId)!.Count);
    }

    [Fact]
    public void Obter_ComPersonagemExistente_RetornaFichaCompleta()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        var obtido = _servico.Obter(_campanhaId, criado.Id);

        Assert.NotNull(obtido);
        Assert.Equal("Kess Bramo", obtido!.Nome);
        Assert.Equal(2, obtido.Pericias.Count);
    }

    [Fact]
    public void Obter_ComPersonagemInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Obter(_campanhaId, "nao-existe"));
    }

    [Fact]
    public void Listar_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Listar("nao-existe"));
    }

    [Fact]
    public void Listar_ComCampanhaSemArquivoDeEstadoPersonagens_RetornaListaVazia()
    {
        // Simula um data/campanhas/{id}.json antigo, salvo antes desta feature existir,
        // sem a propriedade "Personagens" — precisa continuar carregando sem quebrar.
        var caminhoEstado = Path.Combine(_pastaTemporaria, $"{_campanhaId}.json");
        File.WriteAllText(caminhoEstado, "{\"Quests\":[],\"HistoricoRolagens\":[]}");

        var lista = _servico.Listar(_campanhaId);

        Assert.NotNull(lista);
        Assert.Empty(lista!);
    }
}
```

- [ ] **Step 2: Rodar e confirmar que falha (erro de compilação)**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: `CS0246: O nome de tipo ou espaço de nomes 'ServicoPersonagens' não pôde ser encontrado`.

- [ ] **Step 3: Implementar `ServicoPersonagens`**

`src/PainelDed.Api/Campanhas/ServicoPersonagens.cs`:
```csharp
namespace PainelDed.Api.Campanhas;

public class ServicoPersonagens
{
    private readonly RepositorioCampanhas _repositorio;

    public ServicoPersonagens(RepositorioCampanhas repositorio)
    {
        _repositorio = repositorio;
    }

    public List<Personagem>? Listar(string campanhaId)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        return estado is null ? null : estado.Personagens ?? new List<Personagem>();
    }

    public Personagem? Obter(string campanhaId, string personagemId) =>
        Listar(campanhaId)?.FirstOrDefault(p => p.Id == personagemId);

    public Personagem? Importar(string campanhaId, ImportarPersonagemRequisicao requisicao)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var personagens = estado.Personagens ?? new List<Personagem>();
        var existente = personagens.FirstOrDefault(p => p.Nome == requisicao.Nome);

        var personagem = new Personagem(
            existente?.Id ?? Guid.NewGuid().ToString("N")[..8],
            requisicao.Nome,
            requisicao.Raca,
            requisicao.Classe,
            requisicao.Nivel,
            requisicao.Atributos,
            requisicao.Pv,
            requisicao.Ca,
            requisicao.Pericias);

        if (existente is not null)
        {
            personagens[personagens.IndexOf(existente)] = personagem;
        }
        else
        {
            personagens.Add(personagem);
        }

        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });
        return personagem;
    }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam, incluindo os 7 novos.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Campanhas/ServicoPersonagens.cs tests/PainelDed.Api.Testes/Campanhas/ServicoPersonagensTestes.cs
git commit -m "feat(personagens): ServicoPersonagens com listar, obter e importar"
```

---

### Task 3: Endpoints de personagens

**Files:**
- Modify: `src/PainelDed.Api/Program.cs`
- Modify: `tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs`

- [ ] **Step 1: Escrever os testes (falhando — 404, pois os endpoints ainda não existem)**

Adicione ao final de `tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs`, dentro da classe, antes do `}` final:

```csharp

    [Fact]
    public async Task ImportarPersonagem_DepoisListarEObter_RetornaFichaCompleta()
    {
        var cliente = _fabrica.CreateClient();
        var campanhaId = await CriarCampanhaDeTesteAsync(cliente);

        var requisicao = new ImportarPersonagemRequisicao(
            "Kess Bramo",
            "Humano",
            "Ladino",
            1,
            new AtributosPersonagem(9, 16, 16, 14, 9, 13),
            11,
            13,
            new List<PericiaPersonagem> { new("Furtividade", "destreza", true, 5) });

        var importarResposta = await cliente.PostAsJsonAsync($"/api/campanhas/{campanhaId}/personagens/importar", requisicao);
        importarResposta.EnsureSuccessStatusCode();
        var personagem = await importarResposta.Content.ReadFromJsonAsync<Personagem>();
        Assert.Equal("Kess Bramo", personagem!.Nome);

        var listaResposta = await cliente.GetAsync($"/api/campanhas/{campanhaId}/personagens");
        var lista = await listaResposta.Content.ReadFromJsonAsync<List<Personagem>>();
        Assert.Single(lista!);

        var obterResposta = await cliente.GetAsync($"/api/campanhas/{campanhaId}/personagens/{personagem.Id}");
        obterResposta.EnsureSuccessStatusCode();
        var obtido = await obterResposta.Content.ReadFromJsonAsync<Personagem>();
        Assert.Equal(13, obtido!.Ca);
    }

    [Fact]
    public async Task ImportarPersonagem_SemNome_Retorna400()
    {
        var cliente = _fabrica.CreateClient();
        var campanhaId = await CriarCampanhaDeTesteAsync(cliente);

        var requisicao = new ImportarPersonagemRequisicao(
            "",
            "Humano",
            "Ladino",
            1,
            new AtributosPersonagem(8, 8, 8, 8, 8, 8),
            8,
            10,
            new List<PericiaPersonagem>());

        var resposta = await cliente.PostAsJsonAsync($"/api/campanhas/{campanhaId}/personagens/importar", requisicao);

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
    }

    [Fact]
    public async Task Personagens_ComCampanhaInexistente_Retorna404()
    {
        var cliente = _fabrica.CreateClient();

        var resposta = await cliente.GetAsync("/api/campanhas/nao-existe/personagens");

        Assert.Equal(HttpStatusCode.NotFound, resposta.StatusCode);
    }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter "FullyQualifiedName~EndpointsCampanhasTestes"`
Expected: os 3 novos testes falham (404 em rotas inexistentes / erro esperando 400 e recebendo 404).

- [ ] **Step 3: Registrar `ServicoPersonagens` no DI e adicionar os endpoints**

Em `src/PainelDed.Api/Program.cs`, logo após a linha `builder.Services.AddSingleton<ServicoGeradorIdeiaQuest>();`, adicione:
```csharp
builder.Services.AddSingleton<ServicoPersonagens>();
```

E, após o bloco dos endpoints de histórico (depois de `app.MapDelete("/api/campanhas/{campanhaId}/historico", ...)` e antes de `app.Run();`), adicione:
```csharp

app.MapGet("/api/campanhas/{campanhaId}/personagens", (string campanhaId, ServicoPersonagens servico) =>
{
    var personagens = servico.Listar(campanhaId);
    return personagens is null ? Results.NotFound() : Results.Ok(personagens);
});

app.MapGet("/api/campanhas/{campanhaId}/personagens/{personagemId}", (string campanhaId, string personagemId, ServicoPersonagens servico) =>
{
    var personagem = servico.Obter(campanhaId, personagemId);
    return personagem is null ? Results.NotFound() : Results.Ok(personagem);
});

app.MapPost("/api/campanhas/{campanhaId}/personagens/importar", (string campanhaId, ImportarPersonagemRequisicao requisicao, ServicoPersonagens servico) =>
{
    if (string.IsNullOrWhiteSpace(requisicao.Nome))
    {
        return Results.BadRequest("Nome do personagem é obrigatório.");
    }
    var personagem = servico.Importar(campanhaId, requisicao);
    return personagem is null ? Results.NotFound() : Results.Ok(personagem);
});
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/PainelDed.Api/Program.cs tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs
git commit -m "feat(personagens): endpoints de listar, obter e importar personagem"
```

---

### Task 4: `api.js` — chamadas de personagens

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/api.js`

- [ ] **Step 1: Adicionar os 3 métodos ao objeto `Api`**

Em `src/PainelDed.Api/wwwroot/js/api.js`, adicione, logo antes da linha final `};` do objeto `Api`:
```js

  async listarPersonagens(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/personagens`);
    if (!resposta.ok) throw new Error('Falha ao listar personagens');
    return resposta.json();
  },

  async obterPersonagem(campanhaId, personagemId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/personagens/${personagemId}`);
    if (!resposta.ok) throw new Error('Falha ao carregar personagem');
    return resposta.json();
  },

  async importarPersonagem(campanhaId, dados) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/personagens/importar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error('Falha ao importar personagem');
    return resposta.json();
  },
```

- [ ] **Step 2: Verificar que o backend continua rodando normalmente**

Run: `dotnet build`
Expected: build sem erros (esse arquivo é só frontend, mas confirma que nada mais quebrou no repo).

- [ ] **Step 3: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/api.js
git commit -m "feat(personagens): chamadas de api para listar, obter e importar personagem"
```

---

### Task 5: `personagens.js` — aba Jogadores (lista, ficha detalhada, importar)

**Files:**
- Create: `src/PainelDed.Api/wwwroot/js/personagens.js`

- [ ] **Step 1: Criar o arquivo completo**

`src/PainelDed.Api/wwwroot/js/personagens.js`:
```js
const NOMES_ATRIBUTOS_PERSONAGEM = {
  forca: 'Força', destreza: 'Destreza', constituicao: 'Constituição',
  inteligencia: 'Inteligência', sabedoria: 'Sabedoria', carisma: 'Carisma',
};

function modificadorAtributo(valor) {
  return Math.floor((valor - 10) / 2);
}

function formatarComSinal(numero) {
  return numero >= 0 ? `+${numero}` : `${numero}`;
}

const Personagens = {
  async exibir() {
    const principal = document.getElementById('conteudo-principal');
    principal.innerHTML = '';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'cabecalho-nota';
    const titulo = document.createElement('h2');
    titulo.textContent = '🧑‍🤝‍🧑 Jogadores';
    cabecalho.appendChild(titulo);

    const campoArquivo = document.createElement('input');
    campoArquivo.type = 'file';
    campoArquivo.accept = 'application/json';
    campoArquivo.hidden = true;
    campoArquivo.addEventListener('change', async () => {
      const arquivo = campoArquivo.files[0];
      campoArquivo.value = '';
      if (arquivo) {
        await this.importarArquivo(arquivo);
      }
    });
    cabecalho.appendChild(campoArquivo);

    const botaoImportar = document.createElement('button');
    botaoImportar.className = 'botao-rolar';
    botaoImportar.style.marginLeft = 'auto';
    botaoImportar.textContent = '+ Importar Ficha';
    botaoImportar.addEventListener('click', () => campoArquivo.click());
    cabecalho.appendChild(botaoImportar);

    principal.appendChild(cabecalho);

    const layout = document.createElement('div');
    layout.className = 'layout-jogadores';

    const lista = document.createElement('div');
    lista.id = 'lista-personagens';
    lista.className = 'lista-personagens';
    layout.appendChild(lista);

    const detalhe = document.createElement('div');
    detalhe.id = 'detalhe-personagem';
    detalhe.className = 'ficha-personagem';
    detalhe.innerHTML = '<p class="ficha-personagem-vazia">Selecione um personagem na lista.</p>';
    layout.appendChild(detalhe);

    principal.appendChild(layout);

    await this.recarregar();
  },

  async recarregar() {
    const lista = document.getElementById('lista-personagens');
    if (!lista) return;
    lista.innerHTML = '';

    let personagens;
    try {
      personagens = await Api.listarPersonagens(Campanha.ativa.id);
    } catch (erro) {
      lista.innerHTML = '<p class="mensagem-erro">Falha ao carregar os personagens.</p>';
      console.error(erro);
      return;
    }

    if (personagens.length === 0) {
      lista.innerHTML = '<p class="lista-personagens-vazia">Nenhum personagem importado ainda.</p>';
      return;
    }

    personagens.forEach((personagem) => lista.appendChild(this.criarCartaoLista(personagem)));
  },

  criarCartaoLista(personagem) {
    const cartao = document.createElement('button');
    cartao.type = 'button';
    cartao.className = 'cartao-personagem';
    cartao.addEventListener('click', () => this.exibirDetalhe(personagem.id, cartao));

    const nome = document.createElement('h4');
    nome.textContent = personagem.nome;
    cartao.appendChild(nome);

    const linha = document.createElement('p');
    linha.className = 'detalhes-quest';
    linha.textContent = `${personagem.raca} · ${personagem.classe} · Nível ${personagem.nivel}`;
    cartao.appendChild(linha);

    return cartao;
  },

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

    const tituloPericias = document.createElement('h4');
    tituloPericias.textContent = 'Perícias';
    detalhe.appendChild(tituloPericias);

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
    detalhe.appendChild(listaPericias);

    if (personagem.historia) {
      const tituloHistoria = document.createElement('h4');
      tituloHistoria.textContent = 'História';
      detalhe.appendChild(tituloHistoria);
      const textoHistoria = document.createElement('p');
      textoHistoria.className = 'texto-livre-ficha';
      textoHistoria.textContent = personagem.historia;
      detalhe.appendChild(textoHistoria);
    }

    if (personagem.caracteristicasFisicas) {
      const tituloCaracteristicas = document.createElement('h4');
      tituloCaracteristicas.textContent = 'Características Físicas';
      detalhe.appendChild(tituloCaracteristicas);
      const textoCaracteristicas = document.createElement('p');
      textoCaracteristicas.className = 'texto-livre-ficha';
      textoCaracteristicas.textContent = personagem.caracteristicasFisicas;
      detalhe.appendChild(textoCaracteristicas);
    }
  },

  async importarArquivo(arquivo) {
    let texto;
    try {
      texto = await arquivo.text();
    } catch (erro) {
      window.alert('Falha ao ler o arquivo.');
      console.error(erro);
      return;
    }

    let dados;
    try {
      dados = JSON.parse(texto);
    } catch (erro) {
      window.alert('Arquivo inválido: não é um JSON válido.');
      return;
    }

    if (!dados.nome) {
      window.alert('Arquivo inválido: ficha sem nome de personagem.');
      return;
    }

    try {
      await Api.importarPersonagem(Campanha.ativa.id, dados);
    } catch (erro) {
      window.alert('Falha ao importar a ficha.');
      console.error(erro);
      return;
    }

    await this.recarregar();
  },
};
```

- [ ] **Step 2: Verificar que não há erro de sintaxe**

Run: `node --check src/PainelDed.Api/wwwroot/js/personagens.js`
Expected: nenhuma saída (sucesso silencioso — `node --check` só imprime em caso de erro).

- [ ] **Step 3: Commit**

```bash
git add src/PainelDed.Api/wwwroot/js/personagens.js
git commit -m "feat(personagens): aba Jogadores com lista, ficha detalhada e importacao"
```

---

### Task 6: Integração — botão na barra lateral, script tag, wiring

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/index.html`
- Modify: `src/PainelDed.Api/wwwroot/js/app.js`

- [ ] **Step 1: Adicionar o botão "Jogadores" e o novo script em `index.html`**

Em `src/PainelDed.Api/wwwroot/index.html`, troque:
```html
      <button id="botao-quadro-quests" class="botao-navegacao-fixo" type="button">📋 Quadro de Quests</button>
```
por:
```html
      <button id="botao-quadro-quests" class="botao-navegacao-fixo" type="button">📋 Quadro de Quests</button>
      <button id="botao-jogadores" class="botao-navegacao-fixo" type="button">🧑‍🤝‍🧑 Jogadores</button>
```

E troque o bloco de scripts no final do `<body>`:
```html
  <script src="js/tema.js?v=2"></script>
  <script src="js/api.js?v=2"></script>
  <script src="js/campanha.js?v=2"></script>
  <script src="js/markdown.js?v=2"></script>
  <script src="js/rolador.js?v=2"></script>
  <script src="js/quests.js?v=2"></script>
  <script src="js/app.js?v=2"></script>
```
por:
```html
  <script src="js/tema.js?v=3"></script>
  <script src="js/api.js?v=3"></script>
  <script src="js/campanha.js?v=3"></script>
  <script src="js/markdown.js?v=3"></script>
  <script src="js/rolador.js?v=3"></script>
  <script src="js/quests.js?v=3"></script>
  <script src="js/personagens.js?v=3"></script>
  <script src="js/app.js?v=3"></script>
```

- [ ] **Step 2: Ligar o botão e o evento de troca de campanha em `app.js`**

Em `src/PainelDed.Api/wwwroot/js/app.js`, troque:
```js
  document.getElementById('botao-quadro-quests').addEventListener('click', () => Quests.exibir());

  document.addEventListener('campanha-trocada', () => {
    const mural = document.getElementById('mural-quests');
    if (mural) {
      Quests.recarregar();
    }
    Rolador.recarregarHistorico();
  });
```
por:
```js
  document.getElementById('botao-quadro-quests').addEventListener('click', () => Quests.exibir());
  document.getElementById('botao-jogadores').addEventListener('click', () => Personagens.exibir());

  document.addEventListener('campanha-trocada', () => {
    const mural = document.getElementById('mural-quests');
    if (mural) {
      Quests.recarregar();
    }
    const listaPersonagens = document.getElementById('lista-personagens');
    if (listaPersonagens) {
      Personagens.recarregar();
    }
    Rolador.recarregarHistorico();
  });
```

- [ ] **Step 3: Verificar manualmente**

Real browser se possível (servidor local do painel — `dotnet run --project src/PainelDed.Api` — + Playwright ou similar). Abra o painel, clique em "🧑‍🤝‍🧑 Jogadores" na barra lateral: deve trocar o conteúdo principal pra tela "Nenhum personagem importado ainda." com um botão "+ Importar Ficha". Confirme que clicar em "📋 Quadro de Quests" ainda funciona normalmente (sem regressão). Se não puder rodar o backend/navegador, faça uma leitura cuidadosa do código e avise essa limitação.

- [ ] **Step 4: Commit**

```bash
git add src/PainelDed.Api/wwwroot/index.html src/PainelDed.Api/wwwroot/js/app.js
git commit -m "feat(personagens): liga botao Jogadores na barra lateral"
```

---

### Task 7: CSS da aba Jogadores

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/css/estilo.css`

- [ ] **Step 1: Adicionar as regras ao final do arquivo**

Em `src/PainelDed.Api/wwwroot/css/estilo.css`, adicione ao final:
```css

.layout-jogadores {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.25rem;
  align-items: start;
}

.lista-personagens {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.lista-personagens-vazia {
  color: var(--cor-texto-suave);
}

.cartao-personagem {
  text-align: left;
  background: var(--cor-fundo-elevado);
  border: 1px solid var(--cor-borda);
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  cursor: pointer;
  box-shadow: var(--sombra);
}

.cartao-personagem h4 {
  margin: 0 0 0.3rem;
  font-size: 0.95rem;
}

.cartao-personagem.selecionado {
  border-color: var(--cor-destaque);
}

.ficha-personagem {
  background: var(--cor-fundo-elevado);
  border: 1px solid var(--cor-borda);
  border-radius: 10px;
  padding: 1rem 1.2rem;
}

.ficha-personagem-vazia {
  color: var(--cor-texto-suave);
}

.destaques-ficha {
  display: flex;
  gap: 0.6rem;
  margin: 0.6rem 0 1rem;
}

.destaque-ficha {
  background: var(--cor-fundo);
  border: 1px solid var(--cor-destaque);
  color: var(--cor-destaque);
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  font-weight: 700;
}

.grade-atributos-ficha {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.item-atributo-ficha {
  display: flex;
  justify-content: space-between;
  background: var(--cor-fundo);
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
}

.lista-pericias-ficha {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.35rem;
  font-size: 0.85rem;
}

.texto-livre-ficha {
  white-space: pre-line;
  font-size: 0.88rem;
  color: var(--cor-texto);
}

@media (max-width: 720px) {
  .layout-jogadores {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Verificar manualmente**

Real browser se possível. Importe uma ficha (pode usar o passo manual da Task 8 adiantado, ou um POST direto via `curl`/ferramenta de API pra ter algo pra visualizar) e confirme visualmente: cartões na lista com boa legibilidade, cartão selecionado com borda destacada, ficha detalhada com PV/CA em destaque, grade de atributos legível, lista de perícias organizada, sem quebra de layout em tela estreita (redimensione pra ~375px). Se não puder rodar visualmente, faça uma leitura cuidadosa do CSS conferindo que todas as classes usadas em `personagens.js` têm regra correspondente aqui, e avise essa limitação.

- [ ] **Step 3: Commit**

```bash
git add src/PainelDed.Api/wwwroot/css/estilo.css
git commit -m "feat(personagens): estilos da aba Jogadores"
```

---

### Task 8: Teste manual end-to-end com as fichas de exemplo

**Files:** nenhum arquivo novo.

- [ ] **Step 1: Rodar a suíte de testes completa**

Run: `dotnet test`
Expected: todos os testes passam (backend completo, incluindo os novos de Personagens).

- [ ] **Step 2: Subir o painel localmente**

Run: `dotnet run --project src/PainelDed.Api` (deixe rodando; anote a URL, normalmente `http://localhost:5000` ou similar informada no console)

- [ ] **Step 3: Importar as 3 fichas de exemplo via UI**

Com um navegador real (Playwright ou similar) ou manualmente: abra o painel, garanta que existe uma campanha ativa (crie uma se for a primeira vez), clique em "🧑‍🤝‍🧑 Jogadores" → "+ Importar Ficha", e selecione, um de cada vez, `docs/creator/exemplos/kess-bramo.json`, `docs/creator/exemplos/bran-ferronaz.json`, `docs/creator/exemplos/sael-marevalis.json`.

Confirme:
- Os 3 aparecem na lista à esquerda (nome, raça/classe, nível).
- Clicar em cada um mostra a ficha detalhada à direita: PV/CA em destaque, os 6 atributos com modificador, e as perícias com o bônus correto (ex: Kess deve mostrar Furtividade com um bônus alto, coerente com o `character.json` gerado no plano anterior).
- Reimportar o mesmo arquivo (ex: `kess-bramo.json` de novo) **não** duplica o cartão — a lista continua com 3 personagens, não 4.
- Trocar de campanha (se houver mais de uma) e voltar mostra a lista vazia/diferente, confirmando isolamento por campanha.

- [ ] **Step 4: Encerrar o servidor local**

Pare o processo do `dotnet run` (Ctrl+C ou finalize o processo em background).

Nenhum commit nesta task — é só verificação do que já foi commitado nas tasks anteriores.
