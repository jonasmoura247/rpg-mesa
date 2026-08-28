# Quadro de Quests + Campanhas + Histórico Persistido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduzir o conceito de Campanha como partição de dados mutáveis, persistir histórico de rolagens e quests da guilda em arquivos JSON por campanha, e construir o Quadro de Quests (CRUD + geração de rascunho a partir das tabelas do mundo).

**Architecture:** Todo o novo código fica em `src/PainelDed.Api/Campanhas/` (modelos, repositório baseado em arquivos JSON, serviços de negócio). O backend expõe endpoints REST sob `/api/campanhas`. O frontend ganha um seletor de campanha na barra lateral e uma nova tela (Quadro de Quests) acessível por um item de navegação fixo.

**Tech Stack:** .NET 8 (C#), ASP.NET Core Minimal API, xUnit, JavaScript vanilla (mesmo padrão de `app.js`/`rolador.js` do Plano 1: construção via DOM, nunca `innerHTML` com dado dinâmico).

---

## Pré-requisitos

- Plano 1 completo e funcionando (`dotnet test` passando 51/51 antes de começar).
- Diretório de trabalho: `C:\Users\Jonas\Desktop\Projetos\painel-ded`.

---

### Task 1: Modelos de campanha e estado

**Files:**
- Create: `src/PainelDed.Api/Campanhas/Modelos.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`

- [ ] **Step 1: Escrever o teste de round-trip de serialização**

`tests/PainelDed.Api.Testes/Campanhas/ModelosTestes.cs`:
```csharp
using System;
using System.Collections.Generic;
using System.Text.Json;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ModelosTestes
{
    private static readonly JsonSerializerOptions Opcoes = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public void EstadoCampanha_SerializaEDesserializaMantendoOsDados()
    {
        var original = new EstadoCampanha(
            new List<Quest>
            {
                new("q1", "Matar o Rei Goblin", "Descrição.", "50 PO", 450, "disponivel", 1, null),
            },
            new List<EntradaHistorico>
            {
                new("Condições: 4", DateTimeOffset.Parse("2026-08-28T20:00:00Z")),
            });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<EstadoCampanha>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Single(restaurado!.Quests);
        Assert.Equal("Matar o Rei Goblin", restaurado.Quests[0].Titulo);
        Assert.Equal("disponivel", restaurado.Quests[0].Status);
        Assert.Single(restaurado.HistoricoRolagens);
        Assert.Equal("Condições: 4", restaurado.HistoricoRolagens[0].Descricao);
    }

    [Fact]
    public void Campanha_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Campanha("a1b2c3", "Grupo da Terça", DateTimeOffset.Parse("2026-08-28T20:00:00Z"));

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Campanha>(json, Opcoes);

        Assert.Equal(original, restaurado);
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ModelosTestes`
Expected: FAIL — `The type or namespace name 'Campanhas' could not be found`

- [ ] **Step 3: Implementar os modelos**

`src/PainelDed.Api/Campanhas/Modelos.cs`:
```csharp
namespace PainelDed.Api.Campanhas;

public record Campanha(string Id, string Nome, DateTimeOffset CriadaEm);

public record Quest(
    string Id,
    string Titulo,
    string Descricao,
    string Recompensa,
    int XpSugerido,
    string Status,
    int Semana,
    string? Responsavel);

public record EntradaHistorico(string Descricao, DateTimeOffset Timestamp);

public record EstadoCampanha(List<Quest> Quests, List<EntradaHistorico> HistoricoRolagens);

public record NovaCampanhaRequisicao(string Nome);

public record NovaQuestRequisicao(
    string Titulo,
    string Descricao,
    string Recompensa,
    int XpSugerido,
    int Semana,
    string? Responsavel);

public record AtualizarQuestRequisicao(
    string Titulo,
    string Descricao,
    string Recompensa,
    int XpSugerido,
    string Status,
    int Semana,
    string? Responsavel);

public record NovaEntradaHistoricoRequisicao(string Descricao);

public record RascunhoQuest(string TituloSugerido, string DescricaoSugerida);
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ModelosTestes`
Expected: `Passed! - Failed: 0, Passed: 2`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: modelos de campanha, quest e histórico"
```

---

### Task 2: Localizador da pasta de dados

**Files:**
- Create: `src/PainelDed.Api/Campanhas/LocalizadorPastaDados.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/LocalizadorPastaDadosTestes.cs`

**Contexto:** assim como `content/` (Task 10 do Plano 1), a pasta `data/campanhas/` precisa ser localizada de forma robusta independente de quem hospeda o processo (`dotnet run` vs. `WebApplicationFactory` dos testes). Diferente de `LocalizadorConteudo` (que procura por arquivos já existentes), esta pasta pode não existir ainda na primeira execução — então o localizador usa `PainelDed.sln` como âncora da raiz do repositório (esse arquivo sempre existe) e cria `data/campanhas/` se não existir.

- [ ] **Step 1: Escrever os testes que falham**

`tests/PainelDed.Api.Testes/Campanhas/LocalizadorPastaDadosTestes.cs`:
```csharp
using System;
using System.IO;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class LocalizadorPastaDadosTestes : IDisposable
{
    private readonly string _raizTemporaria;

    public LocalizadorPastaDadosTestes()
    {
        _raizTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-dados-testes-" + Guid.NewGuid());
        Directory.CreateDirectory(_raizTemporaria);
    }

    public void Dispose()
    {
        Directory.Delete(_raizTemporaria, recursive: true);
    }

    [Fact]
    public void Localizar_ComSlnNoDiretorioInicial_CriaEDevolvePastaDeCampanhas()
    {
        File.WriteAllText(Path.Combine(_raizTemporaria, "PainelDed.sln"), "");

        var caminho = LocalizadorPastaDados.Localizar(_raizTemporaria);

        Assert.Equal(Path.Combine(_raizTemporaria, "data", "campanhas"), caminho);
        Assert.True(Directory.Exists(caminho));
    }

    [Fact]
    public void Localizar_ComSlnVariosNiveisAcima_SobeAArvoreAteEncontrar()
    {
        File.WriteAllText(Path.Combine(_raizTemporaria, "PainelDed.sln"), "");
        var diretorioProfundo = Path.Combine(_raizTemporaria, "tests", "PainelDed.Api.Testes", "bin", "Debug", "net8.0");
        Directory.CreateDirectory(diretorioProfundo);

        var caminho = LocalizadorPastaDados.Localizar(diretorioProfundo);

        Assert.Equal(Path.Combine(_raizTemporaria, "data", "campanhas"), caminho);
    }

    [Fact]
    public void Localizar_SemSlnEmNenhumNivel_LancaDirectoryNotFoundException()
    {
        var diretorioSemSln = Path.Combine(_raizTemporaria, "sem-sln");
        Directory.CreateDirectory(diretorioSemSln);

        Assert.Throws<DirectoryNotFoundException>(() => LocalizadorPastaDados.Localizar(diretorioSemSln));
    }

    [Fact]
    public void Localizar_ComDiretorioInicialInexistente_LancaDirectoryNotFoundException()
    {
        var caminhoInexistente = Path.Combine(_raizTemporaria, "nao-existe", "nem-este");

        Assert.Throws<DirectoryNotFoundException>(() => LocalizadorPastaDados.Localizar(caminhoInexistente));
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter LocalizadorPastaDadosTestes`
Expected: FAIL — `The type or namespace name 'LocalizadorPastaDados' could not be found`

- [ ] **Step 3: Implementar `LocalizadorPastaDados`**

`src/PainelDed.Api/Campanhas/LocalizadorPastaDados.cs`:
```csharp
namespace PainelDed.Api.Campanhas;

// Localiza (e cria, se necessário) a pasta data/campanhas/ na raiz do repositório,
// usando PainelDed.sln como âncora — diferente de LocalizadorConteudo, esta pasta
// pode não existir ainda na primeira execução, então não dá pra procurar por
// arquivos que já deveriam estar lá dentro.
public static class LocalizadorPastaDados
{
    public static string Localizar(string diretorioInicial)
    {
        var diretorio = new DirectoryInfo(diretorioInicial);

        while (diretorio is not null)
        {
            if (File.Exists(Path.Combine(diretorio.FullName, "PainelDed.sln")))
            {
                var pastaCampanhas = Path.Combine(diretorio.FullName, "data", "campanhas");
                Directory.CreateDirectory(pastaCampanhas);
                return pastaCampanhas;
            }

            diretorio = diretorio.Parent;
        }

        throw new DirectoryNotFoundException(
            $"Não foi possível localizar a raiz do repositório (PainelDed.sln) subindo a árvore de diretórios a partir de '{diretorioInicial}'.");
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Api.Testes --filter LocalizadorPastaDadosTestes`
Expected: `Passed! - Failed: 0, Passed: 4`

- [ ] **Step 5: Adicionar `data/` ao `.gitignore`** (dados de campanha são estado de jogo do usuário, não conteúdo de referência versionado)

Adicionar ao `.gitignore` na raiz:
```
data/
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: localizador da pasta de dados de campanhas"
```

---

### Task 3: Repositório de campanhas

**Files:**
- Create: `src/PainelDed.Api/Campanhas/RepositorioCampanhas.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/RepositorioCampanhasTestes.cs`

- [ ] **Step 1: Escrever os testes que falham**

`tests/PainelDed.Api.Testes/Campanhas/RepositorioCampanhasTestes.cs`:
```csharp
using System;
using System.IO;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class RepositorioCampanhasTestes : IDisposable
{
    private readonly string _pastaTemporaria;

    public RepositorioCampanhasTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-repo-campanhas-" + Guid.NewGuid());
    }

    public void Dispose()
    {
        if (Directory.Exists(_pastaTemporaria))
        {
            Directory.Delete(_pastaTemporaria, recursive: true);
        }
    }

    [Fact]
    public void Listar_SemCampanhas_RetornaListaVazia()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        Assert.Empty(repositorio.Listar());
    }

    [Fact]
    public void Criar_AdicionaNaListaEPersisteEstadoVazio()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        var campanha = repositorio.Criar("Grupo da Terça");

        Assert.Equal("Grupo da Terça", campanha.Nome);
        Assert.NotEmpty(campanha.Id);
        Assert.Single(repositorio.Listar());

        var estado = repositorio.CarregarEstado(campanha.Id);
        Assert.NotNull(estado);
        Assert.Empty(estado!.Quests);
        Assert.Empty(estado.HistoricoRolagens);
    }

    [Fact]
    public void Obter_ComIdExistente_RetornaCampanha()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);
        var criada = repositorio.Criar("Grupo A");

        var obtida = repositorio.Obter(criada.Id);

        Assert.NotNull(obtida);
        Assert.Equal("Grupo A", obtida!.Nome);
    }

    [Fact]
    public void Obter_ComIdInexistente_RetornaNulo()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        Assert.Null(repositorio.Obter("nao-existe"));
    }

    [Fact]
    public void CarregarEstado_ComCampanhaInexistente_RetornaNulo()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        Assert.Null(repositorio.CarregarEstado("nao-existe"));
    }

    [Fact]
    public void SalvarEstado_PersisteERecarregaComOsMesmosDados()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);
        var campanha = repositorio.Criar("Grupo B");

        var estado = new EstadoCampanha(
            new List<Quest> { new("q1", "Título", "Desc", "10 PO", 100, "disponivel", 1, null) },
            new List<EntradaHistorico> { new("Condições: 3", DateTimeOffset.UtcNow) });

        repositorio.SalvarEstado(campanha.Id, estado);
        var recarregado = repositorio.CarregarEstado(campanha.Id);

        Assert.NotNull(recarregado);
        Assert.Single(recarregado!.Quests);
        Assert.Equal("Título", recarregado.Quests[0].Titulo);
        Assert.Single(recarregado.HistoricoRolagens);
    }

    [Fact]
    public void Criar_ComDuasCampanhas_MantemAmbasNoIndice()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        repositorio.Criar("Grupo A");
        repositorio.Criar("Grupo B");

        Assert.Equal(2, repositorio.Listar().Count);
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter RepositorioCampanhasTestes`
Expected: FAIL — `The type or namespace name 'RepositorioCampanhas' could not be found`

- [ ] **Step 3: Implementar `RepositorioCampanhas`**

`src/PainelDed.Api/Campanhas/RepositorioCampanhas.cs`:
```csharp
using System.Text.Json;

namespace PainelDed.Api.Campanhas;

public class RepositorioCampanhas
{
    private static readonly JsonSerializerOptions Opcoes = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
    };

    private readonly string _pastaCampanhas;

    public RepositorioCampanhas(string pastaCampanhas)
    {
        _pastaCampanhas = pastaCampanhas;
        Directory.CreateDirectory(_pastaCampanhas);
    }

    private string CaminhoIndice => Path.Combine(_pastaCampanhas, "index.json");

    private string CaminhoEstado(string id) => Path.Combine(_pastaCampanhas, $"{id}.json");

    public List<Campanha> Listar()
    {
        if (!File.Exists(CaminhoIndice))
        {
            return new List<Campanha>();
        }

        var json = File.ReadAllText(CaminhoIndice);
        return JsonSerializer.Deserialize<List<Campanha>>(json, Opcoes) ?? new List<Campanha>();
    }

    public Campanha Criar(string nome)
    {
        var campanhas = Listar();
        var campanha = new Campanha(Guid.NewGuid().ToString("N")[..8], nome, DateTimeOffset.UtcNow);
        campanhas.Add(campanha);

        File.WriteAllText(CaminhoIndice, JsonSerializer.Serialize(campanhas, Opcoes));
        SalvarEstado(campanha.Id, new EstadoCampanha(new List<Quest>(), new List<EntradaHistorico>()));

        return campanha;
    }

    public Campanha? Obter(string id) => Listar().FirstOrDefault(c => c.Id == id);

    public EstadoCampanha? CarregarEstado(string id)
    {
        if (Obter(id) is null)
        {
            return null;
        }

        var caminho = CaminhoEstado(id);
        if (!File.Exists(caminho))
        {
            return new EstadoCampanha(new List<Quest>(), new List<EntradaHistorico>());
        }

        var json = File.ReadAllText(caminho);
        return JsonSerializer.Deserialize<EstadoCampanha>(json, Opcoes)
            ?? new EstadoCampanha(new List<Quest>(), new List<EntradaHistorico>());
    }

    public void SalvarEstado(string id, EstadoCampanha estado)
    {
        File.WriteAllText(CaminhoEstado(id), JsonSerializer.Serialize(estado, Opcoes));
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Api.Testes --filter RepositorioCampanhasTestes`
Expected: `Passed! - Failed: 0, Passed: 7`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: repositório de campanhas baseado em arquivos JSON"
```

---

### Task 4: Serviço de quests

**Files:**
- Create: `src/PainelDed.Api/Campanhas/ServicoQuests.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/ServicoQuestsTestes.cs`

- [ ] **Step 1: Escrever os testes que falham**

`tests/PainelDed.Api.Testes/Campanhas/ServicoQuestsTestes.cs`:
```csharp
using System;
using System.IO;
using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ServicoQuestsTestes : IDisposable
{
    private readonly string _pastaTemporaria;
    private readonly RepositorioCampanhas _repositorio;
    private readonly ServicoQuests _servico;
    private readonly string _campanhaId;

    public ServicoQuestsTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-servico-quests-" + Guid.NewGuid());
        _repositorio = new RepositorioCampanhas(_pastaTemporaria);
        _servico = new ServicoQuests(_repositorio);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
    }

    public void Dispose()
    {
        Directory.Delete(_pastaTemporaria, recursive: true);
    }

    private static NovaQuestRequisicao RequisicaoDeExemplo() =>
        new("Matar o Rei Goblin", "Ele está aterrorizando o lugarejo.", "50 PO", 450, 1, null);

    [Fact]
    public void Criar_ComCampanhaExistente_AdicionaQuestComStatusDisponivel()
    {
        var quest = _servico.Criar(_campanhaId, RequisicaoDeExemplo());

        Assert.NotNull(quest);
        Assert.Equal("disponivel", quest!.Status);
        Assert.NotEmpty(quest.Id);
        Assert.Single(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Criar_ComCampanhaInexistente_RetornaNulo()
    {
        var quest = _servico.Criar("nao-existe", RequisicaoDeExemplo());

        Assert.Null(quest);
    }

    [Fact]
    public void Atualizar_MudaCamposEStatus()
    {
        var criada = _servico.Criar(_campanhaId, RequisicaoDeExemplo())!;
        var requisicao = new AtualizarQuestRequisicao(
            "Matar o Rei Goblin", "Descrição atualizada.", "100 PO", 450, "andamento", 1, "Grupo do Kael");

        var atualizada = _servico.Atualizar(_campanhaId, criada.Id, requisicao);

        Assert.NotNull(atualizada);
        Assert.Equal("andamento", atualizada!.Status);
        Assert.Equal("100 PO", atualizada.Recompensa);
        Assert.Equal("Grupo do Kael", atualizada.Responsavel);
    }

    [Fact]
    public void Atualizar_ComQuestInexistente_RetornaNulo()
    {
        var requisicao = new AtualizarQuestRequisicao("T", "D", "R", 1, "disponivel", 1, null);

        var resultado = _servico.Atualizar(_campanhaId, "nao-existe", requisicao);

        Assert.Null(resultado);
    }

    [Fact]
    public void Remover_RemoveEPersiste()
    {
        var criada = _servico.Criar(_campanhaId, RequisicaoDeExemplo())!;

        var removida = _servico.Remover(_campanhaId, criada.Id);

        Assert.True(removida);
        Assert.Empty(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Remover_ComQuestInexistente_RetornaFalso()
    {
        Assert.False(_servico.Remover(_campanhaId, "nao-existe"));
    }

    [Fact]
    public void Listar_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Listar("nao-existe"));
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ServicoQuestsTestes`
Expected: FAIL — `The type or namespace name 'ServicoQuests' could not be found`

- [ ] **Step 3: Implementar `ServicoQuests`**

`src/PainelDed.Api/Campanhas/ServicoQuests.cs`:
```csharp
namespace PainelDed.Api.Campanhas;

public class ServicoQuests
{
    private readonly RepositorioCampanhas _repositorio;

    public ServicoQuests(RepositorioCampanhas repositorio)
    {
        _repositorio = repositorio;
    }

    public List<Quest>? Listar(string campanhaId) => _repositorio.CarregarEstado(campanhaId)?.Quests;

    public Quest? Criar(string campanhaId, NovaQuestRequisicao requisicao)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var quest = new Quest(
            Guid.NewGuid().ToString("N")[..8],
            requisicao.Titulo,
            requisicao.Descricao,
            requisicao.Recompensa,
            requisicao.XpSugerido,
            "disponivel",
            requisicao.Semana,
            requisicao.Responsavel);

        estado.Quests.Add(quest);
        _repositorio.SalvarEstado(campanhaId, estado);
        return quest;
    }

    public Quest? Atualizar(string campanhaId, string questId, AtualizarQuestRequisicao requisicao)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        var indice = estado?.Quests.FindIndex(q => q.Id == questId) ?? -1;
        if (estado is null || indice < 0)
        {
            return null;
        }

        var atualizada = estado.Quests[indice] with
        {
            Titulo = requisicao.Titulo,
            Descricao = requisicao.Descricao,
            Recompensa = requisicao.Recompensa,
            XpSugerido = requisicao.XpSugerido,
            Status = requisicao.Status,
            Semana = requisicao.Semana,
            Responsavel = requisicao.Responsavel,
        };

        estado.Quests[indice] = atualizada;
        _repositorio.SalvarEstado(campanhaId, estado);
        return atualizada;
    }

    public bool Remover(string campanhaId, string questId)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return false;
        }

        var removida = estado.Quests.RemoveAll(q => q.Id == questId) > 0;
        if (removida)
        {
            _repositorio.SalvarEstado(campanhaId, estado);
        }

        return removida;
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ServicoQuestsTestes`
Expected: `Passed! - Failed: 0, Passed: 7`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: serviço de quests (CRUD)"
```

---

### Task 5: Serviço de histórico de rolagens

**Files:**
- Create: `src/PainelDed.Api/Campanhas/ServicoHistorico.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/ServicoHistoricoTestes.cs`

- [ ] **Step 1: Escrever os testes que falham**

`tests/PainelDed.Api.Testes/Campanhas/ServicoHistoricoTestes.cs`:
```csharp
using System;
using System.IO;
using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ServicoHistoricoTestes : IDisposable
{
    private readonly string _pastaTemporaria;
    private readonly RepositorioCampanhas _repositorio;
    private readonly ServicoHistorico _servico;
    private readonly string _campanhaId;

    public ServicoHistoricoTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-servico-historico-" + Guid.NewGuid());
        _repositorio = new RepositorioCampanhas(_pastaTemporaria);
        _servico = new ServicoHistorico(_repositorio);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
    }

    public void Dispose()
    {
        Directory.Delete(_pastaTemporaria, recursive: true);
    }

    [Fact]
    public void Registrar_AdicionaNoTopoDaLista()
    {
        _servico.Registrar(_campanhaId, "Condições: 1");
        _servico.Registrar(_campanhaId, "Condições: 5");

        var historico = _servico.Listar(_campanhaId)!;

        Assert.Equal(2, historico.Count);
        Assert.Equal("Condições: 5", historico[0].Descricao);
        Assert.Equal("Condições: 1", historico[1].Descricao);
    }

    [Fact]
    public void Registrar_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Registrar("nao-existe", "Condições: 1"));
    }

    [Fact]
    public void Registrar_RespeitaLimiteDe200Entradas()
    {
        for (var i = 0; i < 200; i++)
        {
            _servico.Registrar(_campanhaId, $"Rolagem {i}");
        }

        _servico.Registrar(_campanhaId, "Rolagem mais recente");

        var historico = _servico.Listar(_campanhaId)!;

        Assert.Equal(200, historico.Count);
        Assert.Equal("Rolagem mais recente", historico[0].Descricao);
        Assert.DoesNotContain(historico, e => e.Descricao == "Rolagem 0");
    }

    [Fact]
    public void Limpar_EsvaziaLista()
    {
        _servico.Registrar(_campanhaId, "Condições: 1");

        var limpou = _servico.Limpar(_campanhaId);

        Assert.True(limpou);
        Assert.Empty(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Limpar_ComCampanhaInexistente_RetornaFalso()
    {
        Assert.False(_servico.Limpar("nao-existe"));
    }

    [Fact]
    public void Listar_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Listar("nao-existe"));
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ServicoHistoricoTestes`
Expected: FAIL — `The type or namespace name 'ServicoHistorico' could not be found`

- [ ] **Step 3: Implementar `ServicoHistorico`**

`src/PainelDed.Api/Campanhas/ServicoHistorico.cs`:
```csharp
namespace PainelDed.Api.Campanhas;

public class ServicoHistorico
{
    private const int LimiteDeEntradas = 200;

    private readonly RepositorioCampanhas _repositorio;

    public ServicoHistorico(RepositorioCampanhas repositorio)
    {
        _repositorio = repositorio;
    }

    public List<EntradaHistorico>? Listar(string campanhaId) =>
        _repositorio.CarregarEstado(campanhaId)?.HistoricoRolagens;

    public EntradaHistorico? Registrar(string campanhaId, string descricao)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var entrada = new EntradaHistorico(descricao, DateTimeOffset.UtcNow);
        estado.HistoricoRolagens.Insert(0, entrada);

        if (estado.HistoricoRolagens.Count > LimiteDeEntradas)
        {
            estado.HistoricoRolagens.RemoveRange(
                LimiteDeEntradas, estado.HistoricoRolagens.Count - LimiteDeEntradas);
        }

        _repositorio.SalvarEstado(campanhaId, estado);
        return entrada;
    }

    public bool Limpar(string campanhaId)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return false;
        }

        estado.HistoricoRolagens.Clear();
        _repositorio.SalvarEstado(campanhaId, estado);
        return true;
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ServicoHistoricoTestes`
Expected: `Passed! - Failed: 0, Passed: 6`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: serviço de histórico de rolagens (limite de 200 entradas)"
```

---

### Task 6: Gerador de rascunho de quest

**Files:**
- Create: `src/PainelDed.Api/Campanhas/ServicoGeradorIdeiaQuest.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/ServicoGeradorIdeiaQuestTestes.cs`

**Contexto:** sorteia aleatoriamente uma entre 4 notas fixas do mundo (Fortaleza, Ruínas, Assentamento, Encontros Aleatórios), rola **todas** as tabelas dessa nota (usando `ServicoRolagem`, já existente do Plano 1), e combina os resultados num rascunho de texto — o título da nota vira `TituloSugerido`, e cada linha `"Tabela: texto da entrada"` vira uma linha de `DescricaoSugerida`. O usuário edita esse rascunho antes de salvar como quest de verdade.

- [ ] **Step 1: Escrever os testes que falham**

`tests/PainelDed.Api.Testes/Campanhas/ServicoGeradorIdeiaQuestTestes.cs`:
```csharp
using System;
using System.Collections.Generic;
using PainelDed.Api.Campanhas;
using PainelDed.Api.Conteudo;
using PainelDed.Api.Rolagem;
using PainelDed.Api.Testes.Rolagem;
using PainelDed.Nucleo.Modelos;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ServicoGeradorIdeiaQuestTestes
{
    private static RepositorioConteudo CriarRepositorioComAsQuatroNotas()
    {
        var notas = new List<NotaConteudo>
        {
            new("Costa da Travessia/09-Fortaleza", "Fortaleza", "conteudo", new List<TabelaRolagem>
            {
                new("Tipo", "1d6", new List<EntradaTabela> { new(1, 6, "Forte de fronteira.", new()) }),
            }),
            new("Costa da Travessia/05-Ruinas", "Ruínas", "conteudo", new List<TabelaRolagem>
            {
                new("Tipo", "1d6", new List<EntradaTabela> { new(1, 6, "Antigo lugarejo destruído.", new()) }),
            }),
            new("Costa da Travessia/03-Assentamento", "Assentamento", "conteudo", new List<TabelaRolagem>
            {
                new("Tipo", "1d6", new List<EntradaTabela> { new(1, 6, "Lugarejo.", new()) }),
            }),
            new("Costa da Travessia/10-Encontros-Aleatorios", "Encontros Aleatórios", "conteudo", new List<TabelaRolagem>
            {
                new("Tipo", "1d6", new List<EntradaTabela> { new(1, 6, "Criaturas.", new()) }),
            }),
        };

        return new RepositorioConteudo(new[] { new SecaoConteudo("mundo", notas) });
    }

    [Fact]
    public void GerarRascunho_ComDadoFixoEm1_EscolheFortalezaERolaSuasTabelas()
    {
        var repositorio = CriarRepositorioComAsQuatroNotas();
        var servicoRolagem = new ServicoRolagem(repositorio, new DadoFixo(1));
        var servico = new ServicoGeradorIdeiaQuest(repositorio, servicoRolagem, new DadoFixo(1));

        var rascunho = servico.GerarRascunho();

        Assert.NotNull(rascunho);
        Assert.Equal("Fortaleza", rascunho!.TituloSugerido);
        Assert.Contains("Tipo: Forte de fronteira.", rascunho.DescricaoSugerida);
    }

    [Fact]
    public void GerarRascunho_ComDadoFixoEm4_EscolheEncontrosAleatorios()
    {
        var repositorio = CriarRepositorioComAsQuatroNotas();
        var servicoRolagem = new ServicoRolagem(repositorio, new DadoFixo(1));
        var servico = new ServicoGeradorIdeiaQuest(repositorio, servicoRolagem, new DadoFixo(4));

        var rascunho = servico.GerarRascunho();

        Assert.Equal("Encontros Aleatórios", rascunho!.TituloSugerido);
    }

    [Fact]
    public void GerarRascunho_ComSecaoMundoAusente_RetornaNulo()
    {
        var repositorioVazio = new RepositorioConteudo(Array.Empty<SecaoConteudo>());
        var servicoRolagem = new ServicoRolagem(repositorioVazio, new DadoFixo(1));
        var servico = new ServicoGeradorIdeiaQuest(repositorioVazio, servicoRolagem, new DadoFixo(1));

        Assert.Null(servico.GerarRascunho());
    }
}
```

> **Nota:** este teste reusa o test double `DadoFixo` já criado em `tests/PainelDed.Api.Testes/Rolagem/ServicoRolagemTestes.cs` (Task 9 do Plano 1) — ele é `public`, então pode ser referenciado de outro arquivo de teste no mesmo projeto sem duplicação.

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ServicoGeradorIdeiaQuestTestes`
Expected: FAIL — `The type or namespace name 'ServicoGeradorIdeiaQuest' could not be found`

- [ ] **Step 3: Implementar `ServicoGeradorIdeiaQuest`**

`src/PainelDed.Api/Campanhas/ServicoGeradorIdeiaQuest.cs`:
```csharp
using PainelDed.Api.Conteudo;
using PainelDed.Api.Rolagem;
using PainelDed.Nucleo.Rolagem;

namespace PainelDed.Api.Campanhas;

public class ServicoGeradorIdeiaQuest
{
    private static readonly string[] NotasCandidatas =
    {
        "Costa da Travessia/09-Fortaleza",
        "Costa da Travessia/05-Ruinas",
        "Costa da Travessia/03-Assentamento",
        "Costa da Travessia/10-Encontros-Aleatorios",
    };

    private readonly RepositorioConteudo _repositorioConteudo;
    private readonly ServicoRolagem _servicoRolagem;
    private readonly IDado _dado;

    public ServicoGeradorIdeiaQuest(RepositorioConteudo repositorioConteudo, ServicoRolagem servicoRolagem, IDado dado)
    {
        _repositorioConteudo = repositorioConteudo;
        _servicoRolagem = servicoRolagem;
        _dado = dado;
    }

    public RascunhoQuest? GerarRascunho()
    {
        var indiceEscolhido = _dado.Rolar($"1d{NotasCandidatas.Length}") - 1;
        var idNotaEscolhida = NotasCandidatas[indiceEscolhido];

        var nota = _repositorioConteudo.ObterNota("mundo", idNotaEscolhida);
        if (nota is null)
        {
            return null;
        }

        var linhas = new List<string>();
        foreach (var tabela in nota.Tabelas)
        {
            var resultado = _servicoRolagem.Rolar("mundo", idNotaEscolhida, tabela.Titulo);
            if (resultado is not null)
            {
                linhas.Add($"{tabela.Titulo}: {resultado.Entrada.Texto}");
            }
        }

        return new RascunhoQuest(nota.Titulo, string.Join("\n", linhas));
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ServicoGeradorIdeiaQuestTestes`
Expected: `Passed! - Failed: 0, Passed: 3`

- [ ] **Step 5: Rodar toda a suíte da API pra garantir que nada quebrou**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos os testes passam (18 do Plano 1 + 2 Modelos + 4 Localizador + 7 Repositório + 7 Quests + 6 Histórico + 3 Gerador = 47)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: gerador de rascunho de quest a partir das tabelas do mundo"
```

---

### Task 7: Endpoints de campanhas, quests e histórico

**Files:**
- Modify: `src/PainelDed.Api/Program.cs`
- Test: `tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs`

- [ ] **Step 1: Modificar `Program.cs`** — registrar os novos serviços no DI e mapear os endpoints

Adicionar, junto aos outros registros de DI (depois de `builder.Services.AddSingleton<ServicoRolagem>();`):
```csharp
var pastaCampanhas = LocalizadorPastaDados.Localizar(builder.Environment.ContentRootPath);
builder.Services.AddSingleton(new RepositorioCampanhas(pastaCampanhas));
builder.Services.AddSingleton<ServicoQuests>();
builder.Services.AddSingleton<ServicoHistorico>();
builder.Services.AddSingleton<ServicoGeradorIdeiaQuest>();
```

Adicionar `using PainelDed.Api.Campanhas;` no topo do arquivo.

Adicionar, depois dos endpoints de rolagem já existentes (antes de `app.Run();`):
```csharp
app.MapGet("/api/campanhas", (RepositorioCampanhas repositorio) =>
    Results.Ok(repositorio.Listar()));

app.MapPost("/api/campanhas", (NovaCampanhaRequisicao requisicao, RepositorioCampanhas repositorio) =>
{
    if (string.IsNullOrWhiteSpace(requisicao.Nome))
    {
        return Results.BadRequest("Nome da campanha é obrigatório.");
    }
    return Results.Ok(repositorio.Criar(requisicao.Nome.Trim()));
});

app.MapGet("/api/campanhas/{campanhaId}/quests", (string campanhaId, ServicoQuests servico) =>
{
    var quests = servico.Listar(campanhaId);
    return quests is null ? Results.NotFound() : Results.Ok(quests);
});

app.MapPost("/api/campanhas/{campanhaId}/quests", (string campanhaId, NovaQuestRequisicao requisicao, ServicoQuests servico) =>
{
    var quest = servico.Criar(campanhaId, requisicao);
    return quest is null ? Results.NotFound() : Results.Ok(quest);
});

app.MapPut("/api/campanhas/{campanhaId}/quests/{questId}", (string campanhaId, string questId, AtualizarQuestRequisicao requisicao, ServicoQuests servico) =>
{
    var quest = servico.Atualizar(campanhaId, questId, requisicao);
    return quest is null ? Results.NotFound() : Results.Ok(quest);
});

app.MapDelete("/api/campanhas/{campanhaId}/quests/{questId}", (string campanhaId, string questId, ServicoQuests servico) =>
    servico.Remover(campanhaId, questId) ? Results.NoContent() : Results.NotFound());

app.MapPost("/api/campanhas/{campanhaId}/quests/gerar-ideia", (string campanhaId, RepositorioCampanhas repositorioCampanhas, ServicoGeradorIdeiaQuest servico) =>
{
    if (repositorioCampanhas.Obter(campanhaId) is null)
    {
        return Results.NotFound();
    }
    var rascunho = servico.GerarRascunho();
    return rascunho is null ? Results.NotFound() : Results.Ok(rascunho);
});

app.MapGet("/api/campanhas/{campanhaId}/historico", (string campanhaId, ServicoHistorico servico) =>
{
    var historico = servico.Listar(campanhaId);
    return historico is null ? Results.NotFound() : Results.Ok(historico);
});

app.MapPost("/api/campanhas/{campanhaId}/historico", (string campanhaId, NovaEntradaHistoricoRequisicao requisicao, ServicoHistorico servico) =>
{
    var entrada = servico.Registrar(campanhaId, requisicao.Descricao);
    return entrada is null ? Results.NotFound() : Results.Ok(entrada);
});

app.MapDelete("/api/campanhas/{campanhaId}/historico", (string campanhaId, ServicoHistorico servico) =>
    servico.Limpar(campanhaId) ? Results.NoContent() : Results.NotFound());
```

- [ ] **Step 2: Escrever o teste de integração que falha**

`tests/PainelDed.Api.Testes/Campanhas/EndpointsCampanhasTestes.cs`:
```csharp
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class EndpointsCampanhasTestes : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _fabrica;

    public EndpointsCampanhasTestes(WebApplicationFactory<Program> fabrica)
    {
        _fabrica = fabrica;
    }

    private async Task<string> CriarCampanhaDeTesteAsync(HttpClient cliente)
    {
        var resposta = await cliente.PostAsJsonAsync("/api/campanhas", new NovaCampanhaRequisicao(
            $"Campanha de Teste {Guid.NewGuid():N}"));
        resposta.EnsureSuccessStatusCode();
        var campanha = await resposta.Content.ReadFromJsonAsync<Campanha>();
        return campanha!.Id;
    }

    [Fact]
    public async Task CriarCampanha_DepoisListar_ApareceNaLista()
    {
        var cliente = _fabrica.CreateClient();
        var id = await CriarCampanhaDeTesteAsync(cliente);

        var lista = await (await cliente.GetAsync("/api/campanhas")).Content.ReadFromJsonAsync<List<Campanha>>();

        Assert.Contains(lista!, c => c.Id == id);
    }

    [Fact]
    public async Task CicloDeVidaDeQuest_CriarAtualizarRemover()
    {
        var cliente = _fabrica.CreateClient();
        var campanhaId = await CriarCampanhaDeTesteAsync(cliente);

        var criarResposta = await cliente.PostAsJsonAsync(
            $"/api/campanhas/{campanhaId}/quests",
            new NovaQuestRequisicao("Matar o Rei Goblin", "Descrição.", "50 PO", 450, 1, null));
        criarResposta.EnsureSuccessStatusCode();
        var quest = await criarResposta.Content.ReadFromJsonAsync<Quest>();
        Assert.Equal("disponivel", quest!.Status);

        var atualizarResposta = await cliente.PutAsJsonAsync(
            $"/api/campanhas/{campanhaId}/quests/{quest.Id}",
            new AtualizarQuestRequisicao("Matar o Rei Goblin", "Descrição.", "50 PO", 450, "concluida", 1, "Grupo do Kael"));
        atualizarResposta.EnsureSuccessStatusCode();
        var atualizada = await atualizarResposta.Content.ReadFromJsonAsync<Quest>();
        Assert.Equal("concluida", atualizada!.Status);

        var removerResposta = await cliente.DeleteAsync($"/api/campanhas/{campanhaId}/quests/{quest.Id}");
        Assert.Equal(HttpStatusCode.NoContent, removerResposta.StatusCode);

        var listaFinal = await (await cliente.GetAsync($"/api/campanhas/{campanhaId}/quests"))
            .Content.ReadFromJsonAsync<List<Quest>>();
        Assert.Empty(listaFinal!);
    }

    [Fact]
    public async Task GerarIdeia_ComCampanhaExistente_RetornaRascunho()
    {
        var cliente = _fabrica.CreateClient();
        var campanhaId = await CriarCampanhaDeTesteAsync(cliente);

        var resposta = await cliente.PostAsync($"/api/campanhas/{campanhaId}/quests/gerar-ideia", null);

        resposta.EnsureSuccessStatusCode();
        var rascunho = await resposta.Content.ReadFromJsonAsync<RascunhoQuest>();
        Assert.NotNull(rascunho);
        Assert.NotEmpty(rascunho!.TituloSugerido);
    }

    [Fact]
    public async Task Historico_RegistrarListarLimpar()
    {
        var cliente = _fabrica.CreateClient();
        var campanhaId = await CriarCampanhaDeTesteAsync(cliente);

        await cliente.PostAsJsonAsync($"/api/campanhas/{campanhaId}/historico", new NovaEntradaHistoricoRequisicao("Condições: 4"));

        var listaResposta = await cliente.GetAsync($"/api/campanhas/{campanhaId}/historico");
        var lista = await listaResposta.Content.ReadFromJsonAsync<List<EntradaHistorico>>();
        Assert.Single(lista!);

        var limparResposta = await cliente.DeleteAsync($"/api/campanhas/{campanhaId}/historico");
        Assert.Equal(HttpStatusCode.NoContent, limparResposta.StatusCode);

        var listaFinal = await (await cliente.GetAsync($"/api/campanhas/{campanhaId}/historico"))
            .Content.ReadFromJsonAsync<List<EntradaHistorico>>();
        Assert.Empty(listaFinal!);
    }

    [Fact]
    public async Task Quests_ComCampanhaInexistente_Retorna404()
    {
        var cliente = _fabrica.CreateClient();

        var resposta = await cliente.GetAsync("/api/campanhas/nao-existe/quests");

        Assert.Equal(HttpStatusCode.NotFound, resposta.StatusCode);
    }
}
```

- [ ] **Step 3: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: todos passando (47 anteriores + 5 novos = 52)

> **Nota:** como os testes de integração usam campanhas de nome único (`Guid.NewGuid()`), rodar a suíte várias vezes vai acumular arquivos de campanha de teste em `data/campanhas/` (a pasta real do repositório, não uma temporária — `WebApplicationFactory` sobe a aplicação de verdade com o `RepositorioCampanhas` real). Isso é aceitável para este projeto (uso local, sem CI compartilhado), mas se incomodar, é possível limpar `data/campanhas/` manualmente entre execuções — não faz parte do escopo desta task automatizar essa limpeza.

- [ ] **Step 4: Rodar a API manualmente e testar com curl**

Run: `dotnet run --project src/PainelDed.Api`
```bash
curl -X POST http://localhost:5108/api/campanhas -H "Content-Type: application/json" -d "{\"nome\":\"Grupo da Terça\"}"
```
Expected: JSON com `id`, `nome`, `criadaEm`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: endpoints de campanhas, quests e histórico + testes de integração"
```

---

### Task 8: Frontend — seletor de campanha

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/index.html`
- Create: `src/PainelDed.Api/wwwroot/js/campanha.js`
- Modify: `src/PainelDed.Api/wwwroot/js/api.js`
- Modify: `src/PainelDed.Api/wwwroot/css/estilo.css`

- [ ] **Step 1: Adicionar métodos de campanha em `js/api.js`**

Adicionar ao objeto `Api` existente (mantendo os métodos já existentes intactos):
```javascript
  async listarCampanhas() {
    const resposta = await fetch('/api/campanhas');
    if (!resposta.ok) throw new Error('Falha ao listar campanhas');
    return resposta.json();
  },

  async criarCampanha(nome) {
    const resposta = await fetch('/api/campanhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    if (!resposta.ok) throw new Error('Falha ao criar campanha');
    return resposta.json();
  },
```

- [ ] **Step 2: Criar `js/campanha.js`**

```javascript
const Campanha = {
  chaveArmazenamento: 'painel-ded-campanha-ativa',
  ativa: null,

  async inicializar() {
    const campanhas = await Api.listarCampanhas();

    if (campanhas.length === 0) {
      const nome = window.prompt('Nenhuma campanha encontrada. Qual o nome da primeira campanha?', 'Minha Campanha');
      const novaCampanha = await Api.criarCampanha(nome && nome.trim() ? nome.trim() : 'Minha Campanha');
      campanhas.push(novaCampanha);
    }

    const idSalvo = this.obterIdSalvo();
    const campanhaValida = campanhas.find((c) => c.id === idSalvo) || campanhas[0];
    this.ativa = campanhaValida;

    this.renderizarSeletor(campanhas);
    this.salvarIdAtivo(campanhaValida.id);
  },

  obterIdSalvo() {
    try {
      return localStorage.getItem(this.chaveArmazenamento);
    } catch {
      return null;
    }
  },

  salvarIdAtivo(id) {
    try {
      localStorage.setItem(this.chaveArmazenamento, id);
    } catch {
      // localStorage indisponível — segue sem persistir a escolha
    }
  },

  renderizarSeletor(campanhas) {
    const seletor = document.getElementById('seletor-campanha');
    seletor.innerHTML = '';

    campanhas.forEach((campanha) => {
      const opcao = document.createElement('option');
      opcao.value = campanha.id;
      opcao.textContent = campanha.nome;
      opcao.selected = campanha.id === this.ativa.id;
      seletor.appendChild(opcao);
    });

    const opcaoNova = document.createElement('option');
    opcaoNova.value = '__nova__';
    opcaoNova.textContent = '+ Nova campanha…';
    seletor.appendChild(opcaoNova);

    seletor.addEventListener('change', async () => {
      if (seletor.value === '__nova__') {
        const nome = window.prompt('Nome da nova campanha:');
        if (!nome || !nome.trim()) {
          seletor.value = this.ativa.id;
          return;
        }
        const novaCampanha = await Api.criarCampanha(nome.trim());
        await this.trocarPara(novaCampanha);
        await this.inicializar();
        return;
      }

      const campanhaEscolhida = campanhas.find((c) => c.id === seletor.value);
      await this.trocarPara(campanhaEscolhida);
    });
  },

  async trocarPara(campanha) {
    this.ativa = campanha;
    this.salvarIdAtivo(campanha.id);
    document.dispatchEvent(new CustomEvent('campanha-trocada', { detail: campanha }));
  },
};
```

- [ ] **Step 3: Adicionar o seletor no `index.html`** (dentro de `.cabecalho-barra-lateral`, ou logo abaixo — decisão: logo abaixo do cabeçalho, acima do campo de busca)

Modificar a seção da barra lateral:
```html
    <nav class="barra-lateral">
      <div class="cabecalho-barra-lateral">
        <h1>Costa da Travessia</h1>
        <button id="botao-tema" class="botao-tema" title="Alternar modo claro/escuro">🌙</button>
      </div>
      <select id="seletor-campanha" class="seletor-campanha"></select>
      <button id="botao-quadro-quests" class="botao-navegacao-fixo" type="button">📋 Quadro de Quests</button>
      <input
        type="search"
        id="campo-busca"
        class="campo-busca"
        placeholder="Buscar nota…"
        autocomplete="off"
      />
```

E adicionar o script antes de `js/app.js`:
```html
  <script src="js/campanha.js"></script>
```

- [ ] **Step 4: Estilizar em `css/estilo.css`**

```css
.seletor-campanha {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--cor-borda);
  background: var(--cor-fundo);
  color: var(--cor-texto);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.6rem;
}

.botao-navegacao-fixo {
  width: 100%;
  text-align: left;
  padding: 0.55rem 0.7rem;
  border-radius: 8px;
  border: 1px solid var(--cor-borda);
  background: var(--cor-fundo);
  color: var(--cor-texto);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0.75rem;
}

.botao-navegacao-fixo:hover {
  border-color: var(--cor-destaque);
  color: var(--cor-destaque);
}
```

- [ ] **Step 5: Chamar `Campanha.inicializar()` antes de tudo o mais** — modificar o `document.addEventListener('DOMContentLoaded', ...)` no fim de `js/app.js`:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await Campanha.inicializar();
  carregarArvoreNavegacao();
});
```

- [ ] **Step 6: Testar manualmente**

Run: `dotnet run --project src/PainelDed.Api`. Abrir no navegador (limpar `data/campanhas/` antes, se quiser testar o fluxo "nenhuma campanha ainda"). Confirmar:
1. Primeira visita sem campanhas: pede nome, cria, aparece selecionada no dropdown.
2. Criar uma segunda campanha via "+ Nova campanha…": aparece no dropdown e fica selecionada.
3. Recarregar a página: mantém a campanha que estava selecionada (via localStorage).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: seletor de campanha na barra lateral"
```

---

### Task 9: Frontend — Quadro de Quests

**Files:**
- Create: `src/PainelDed.Api/wwwroot/js/quests.js`
- Modify: `src/PainelDed.Api/wwwroot/js/api.js`
- Modify: `src/PainelDed.Api/wwwroot/js/app.js`
- Modify: `src/PainelDed.Api/wwwroot/index.html`
- Modify: `src/PainelDed.Api/wwwroot/css/estilo.css`

- [ ] **Step 1: Adicionar métodos de quest em `js/api.js`**

```javascript
  async listarQuests(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests`);
    if (!resposta.ok) throw new Error('Falha ao listar quests');
    return resposta.json();
  },

  async criarQuest(campanhaId, dados) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error('Falha ao criar quest');
    return resposta.json();
  },

  async atualizarQuest(campanhaId, questId, dados) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests/${questId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error('Falha ao atualizar quest');
    return resposta.json();
  },

  async removerQuest(campanhaId, questId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests/${questId}`, { method: 'DELETE' });
    if (!resposta.ok) throw new Error('Falha ao remover quest');
  },

  async gerarIdeiaDeQuest(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests/gerar-ideia`, { method: 'POST' });
    if (!resposta.ok) throw new Error('Falha ao gerar ideia de quest');
    return resposta.json();
  },
```

- [ ] **Step 2: Criar `js/quests.js`**

```javascript
const STATUS_QUEST = [
  { valor: 'disponivel', rotulo: 'Disponível' },
  { valor: 'andamento', rotulo: 'Em Andamento' },
  { valor: 'concluida', rotulo: 'Concluída' },
  { valor: 'expirada', rotulo: 'Expirada' },
];

const Quests = {
  async exibir() {
    const principal = document.getElementById('conteudo-principal');
    principal.innerHTML = '';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'cabecalho-nota';
    const titulo = document.createElement('h2');
    titulo.textContent = '📋 Quadro de Quests';
    cabecalho.appendChild(titulo);

    const botaoNova = document.createElement('button');
    botaoNova.className = 'botao-rolar';
    botaoNova.style.marginLeft = 'auto';
    botaoNova.textContent = '+ Nova Quest';
    botaoNova.addEventListener('click', () => this.abrirFormulario());
    cabecalho.appendChild(botaoNova);

    principal.appendChild(cabecalho);

    const mural = document.createElement('div');
    mural.id = 'mural-quests';
    mural.className = 'mural-quests';
    principal.appendChild(mural);

    await this.recarregar();
  },

  async recarregar() {
    const mural = document.getElementById('mural-quests');
    if (!mural) return;
    mural.innerHTML = '';

    let quests;
    try {
      quests = await Api.listarQuests(Campanha.ativa.id);
    } catch (erro) {
      mural.innerHTML = '<p class="mensagem-erro">Falha ao carregar as quests.</p>';
      console.error(erro);
      return;
    }

    STATUS_QUEST.forEach((status) => {
      const coluna = document.createElement('div');
      coluna.className = 'coluna-quests';

      const tituloColuna = document.createElement('h3');
      tituloColuna.textContent = status.rotulo;
      coluna.appendChild(tituloColuna);

      quests
        .filter((quest) => quest.status === status.valor)
        .forEach((quest) => coluna.appendChild(this.criarCartao(quest)));

      mural.appendChild(coluna);
    });
  },

  criarCartao(quest) {
    const cartao = document.createElement('div');
    cartao.className = 'cartao-quest';

    const titulo = document.createElement('h4');
    titulo.textContent = quest.titulo;
    cartao.appendChild(titulo);

    const descricao = document.createElement('p');
    descricao.textContent = quest.descricao;
    cartao.appendChild(descricao);

    const detalhes = document.createElement('p');
    detalhes.className = 'detalhes-quest';
    detalhes.textContent = `Recompensa: ${quest.recompensa} · XP: ${quest.xpSugerido} · Semana ${quest.semana}`;
    cartao.appendChild(detalhes);

    if (quest.responsavel) {
      const responsavel = document.createElement('p');
      responsavel.className = 'detalhes-quest';
      responsavel.textContent = `Responsável: ${quest.responsavel}`;
      cartao.appendChild(responsavel);
    }

    const acoes = document.createElement('div');
    acoes.className = 'acoes-cartao-quest';

    const seletorStatus = document.createElement('select');
    STATUS_QUEST.forEach((status) => {
      const opcao = document.createElement('option');
      opcao.value = status.valor;
      opcao.textContent = status.rotulo;
      opcao.selected = status.valor === quest.status;
      seletorStatus.appendChild(opcao);
    });
    seletorStatus.addEventListener('change', async () => {
      await Api.atualizarQuest(Campanha.ativa.id, quest.id, { ...quest, status: seletorStatus.value });
      await this.recarregar();
    });
    acoes.appendChild(seletorStatus);

    const botaoEditar = document.createElement('button');
    botaoEditar.className = 'botao-secundario';
    botaoEditar.textContent = 'Editar';
    botaoEditar.addEventListener('click', () => this.abrirFormulario(quest));
    acoes.appendChild(botaoEditar);

    const botaoRemover = document.createElement('button');
    botaoRemover.className = 'botao-secundario';
    botaoRemover.textContent = 'Remover';
    botaoRemover.addEventListener('click', async () => {
      if (window.confirm(`Remover a quest "${quest.titulo}"?`)) {
        await Api.removerQuest(Campanha.ativa.id, quest.id);
        await this.recarregar();
      }
    });
    acoes.appendChild(botaoRemover);

    cartao.appendChild(acoes);
    return cartao;
  },

  abrirFormulario(questExistente) {
    const fundo = document.createElement('div');
    fundo.className = 'fundo-modal';

    const modal = document.createElement('div');
    modal.className = 'modal-formulario';

    const titulo = document.createElement('h3');
    titulo.textContent = questExistente ? 'Editar Quest' : 'Nova Quest';
    modal.appendChild(titulo);

    const campoTitulo = criarCampoTexto('Título', questExistente?.titulo || '');
    const campoDescricao = criarCampoTextarea('Descrição', questExistente?.descricao || '');
    const campoRecompensa = criarCampoTexto('Recompensa', questExistente?.recompensa || '');
    const campoXp = criarCampoTexto('XP sugerido', questExistente?.xpSugerido ?? '0');
    const campoSemana = criarCampoTexto('Semana', questExistente?.semana ?? '1');
    const campoResponsavel = criarCampoTexto('Responsável (opcional)', questExistente?.responsavel || '');

    [campoTitulo, campoDescricao, campoRecompensa, campoXp, campoSemana, campoResponsavel].forEach((campo) =>
      modal.appendChild(campo.container),
    );

    const botaoGerarIdeia = document.createElement('button');
    botaoGerarIdeia.className = 'botao-secundario';
    botaoGerarIdeia.type = 'button';
    botaoGerarIdeia.textContent = '🎲 Gerar ideia';
    botaoGerarIdeia.addEventListener('click', async () => {
      const rascunho = await Api.gerarIdeiaDeQuest(Campanha.ativa.id);
      campoTitulo.entrada.value = rascunho.tituloSugerido;
      campoDescricao.entrada.value = rascunho.descricaoSugerida;
    });
    modal.appendChild(botaoGerarIdeia);

    const acoes = document.createElement('div');
    acoes.className = 'acoes-modal';

    const botaoSalvar = document.createElement('button');
    botaoSalvar.className = 'botao-rolar';
    botaoSalvar.textContent = 'Salvar';
    botaoSalvar.addEventListener('click', async () => {
      const dados = {
        titulo: campoTitulo.entrada.value.trim(),
        descricao: campoDescricao.entrada.value.trim(),
        recompensa: campoRecompensa.entrada.value.trim(),
        xpSugerido: parseInt(campoXp.entrada.value, 10) || 0,
        semana: parseInt(campoSemana.entrada.value, 10) || 1,
        responsavel: campoResponsavel.entrada.value.trim() || null,
      };

      if (!dados.titulo) {
        window.alert('Título é obrigatório.');
        return;
      }

      if (questExistente) {
        await Api.atualizarQuest(Campanha.ativa.id, questExistente.id, { ...dados, status: questExistente.status });
      } else {
        await Api.criarQuest(Campanha.ativa.id, dados);
      }

      document.body.removeChild(fundo);
      await this.recarregar();
    });
    acoes.appendChild(botaoSalvar);

    const botaoCancelar = document.createElement('button');
    botaoCancelar.className = 'botao-secundario';
    botaoCancelar.textContent = 'Cancelar';
    botaoCancelar.addEventListener('click', () => document.body.removeChild(fundo));
    acoes.appendChild(botaoCancelar);

    modal.appendChild(acoes);
    fundo.appendChild(modal);
    document.body.appendChild(fundo);
  },
};

function criarCampoTexto(rotulo, valorInicial) {
  const container = document.createElement('label');
  container.className = 'campo-formulario';
  const textoRotulo = document.createElement('span');
  textoRotulo.textContent = rotulo;
  const entrada = document.createElement('input');
  entrada.type = 'text';
  entrada.value = valorInicial;
  container.appendChild(textoRotulo);
  container.appendChild(entrada);
  return { container, entrada };
}

function criarCampoTextarea(rotulo, valorInicial) {
  const container = document.createElement('label');
  container.className = 'campo-formulario';
  const textoRotulo = document.createElement('span');
  textoRotulo.textContent = rotulo;
  const entrada = document.createElement('textarea');
  entrada.rows = 4;
  entrada.value = valorInicial;
  container.appendChild(textoRotulo);
  container.appendChild(entrada);
  return { container, entrada };
}
```

- [ ] **Step 3: Ligar o botão "📋 Quadro de Quests" e reagir à troca de campanha** — adicionar em `js/app.js`, dentro do `DOMContentLoaded`:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await Campanha.inicializar();
  carregarArvoreNavegacao();

  document.getElementById('botao-quadro-quests').addEventListener('click', () => Quests.exibir());

  document.addEventListener('campanha-trocada', () => {
    const mural = document.getElementById('mural-quests');
    if (mural) {
      Quests.recarregar();
    }
  });
});
```

- [ ] **Step 4: Adicionar o script em `index.html`** (antes de `js/app.js`)

```html
  <script src="js/quests.js"></script>
```

- [ ] **Step 5: Estilizar em `css/estilo.css`**

```css
.mural-quests {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.coluna-quests {
  flex: 0 0 260px;
  background: var(--cor-fundo);
  border-radius: 10px;
  padding: 0.9rem;
}

.coluna-quests h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--cor-texto-suave);
  margin: 0 0 0.75rem;
}

.cartao-quest {
  background: var(--cor-fundo-elevado);
  border: 1px solid var(--cor-borda);
  border-radius: 10px;
  padding: 0.8rem;
  margin-bottom: 0.75rem;
  box-shadow: var(--sombra);
}

.cartao-quest h4 {
  margin: 0 0 0.4rem;
  font-size: 0.95rem;
}

.cartao-quest p {
  margin: 0 0 0.4rem;
  font-size: 0.85rem;
}

.detalhes-quest {
  color: var(--cor-texto-suave);
  font-size: 0.78rem !important;
}

.acoes-cartao-quest {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.acoes-cartao-quest select {
  border-radius: 6px;
  border: 1px solid var(--cor-borda);
  background: var(--cor-fundo);
  color: var(--cor-texto);
  font-size: 0.78rem;
}

.fundo-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-formulario {
  background: var(--cor-fundo-elevado);
  border-radius: 12px;
  padding: 1.5rem;
  width: 90%;
  max-width: 32rem;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--sombra);
}

.campo-formulario {
  display: block;
  margin-bottom: 0.9rem;
}

.campo-formulario span {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--cor-texto-suave);
  margin-bottom: 0.3rem;
}

.campo-formulario input,
.campo-formulario textarea {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--cor-borda);
  background: var(--cor-fundo);
  color: var(--cor-texto);
  font-family: inherit;
  font-size: 0.9rem;
}

.acoes-modal {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
```

- [ ] **Step 6: Testar manualmente**

Run: `dotnet run --project src/PainelDed.Api`. Confirmar:
1. Clicar "📋 Quadro de Quests" abre as 4 colunas vazias.
2. "+ Nova Quest" → preencher manualmente → salvar → aparece na coluna "Disponível".
3. "🎲 Gerar ideia" dentro do formulário preenche título/descrição com um rascunho coerente.
4. Mudar o status pelo seletor do cartão move a quest de coluna ao recarregar.
5. Editar e remover funcionam.
6. Trocar de campanha (seletor da Task 8) enquanto o quadro está aberto atualiza a lista pra quests da nova campanha.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: quadro de quests (CRUD + gerar ideia)"
```

---

### Task 10: Frontend — histórico persistido e botão de limpar

**Files:**
- Modify: `src/PainelDed.Api/wwwroot/js/rolador.js`
- Modify: `src/PainelDed.Api/wwwroot/js/api.js`
- Modify: `src/PainelDed.Api/wwwroot/index.html`
- Modify: `src/PainelDed.Api/wwwroot/css/estilo.css`

- [ ] **Step 1: Adicionar métodos de histórico em `js/api.js`**

```javascript
  async listarHistorico(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/historico`);
    if (!resposta.ok) throw new Error('Falha ao carregar histórico');
    return resposta.json();
  },

  async registrarHistorico(campanhaId, descricao) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/historico`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao }),
    });
    if (!resposta.ok) throw new Error('Falha ao registrar rolagem no histórico');
    return resposta.json();
  },

  async limparHistorico(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/historico`, { method: 'DELETE' });
    if (!resposta.ok) throw new Error('Falha ao limpar histórico');
  },
```

- [ ] **Step 2: Adicionar botão de limpar no `index.html`**

```html
      <div class="cabecalho-historico">
        <h2>Últimas Rolagens</h2>
        <button id="botao-limpar-historico" class="botao-limpar-historico" title="Limpar histórico">🗑️</button>
      </div>
      <ul id="historico-rolagens">
        <li class="historico-vazio">Nenhuma rolagem ainda.</li>
      </ul>
```

(substituindo o `<h2>Últimas Rolagens</h2>` isolado que existia antes)

- [ ] **Step 3: Reescrever a seção de histórico em `js/rolador.js`** — substituir `registrarHistorico` por versão que persiste via API, e carregar do backend ao trocar de campanha

```javascript
const Rolador = {
  async rolar(nomeSecao, idNota, tituloTabela, elementoResultado) {
    elementoResultado.textContent = '';
    const carregando = document.createElement('p');
    carregando.textContent = 'Rolando…';
    elementoResultado.appendChild(carregando);

    let resultado;
    try {
      resultado = await Api.rolarTabela(nomeSecao, idNota, tituloTabela);
    } catch (erro) {
      elementoResultado.textContent = '';
      const mensagem = document.createElement('p');
      mensagem.className = 'mensagem-erro';
      mensagem.textContent = 'Falha ao rolar esta tabela.';
      elementoResultado.appendChild(mensagem);
      console.error(erro);
      return;
    }

    this.exibirResultado(nomeSecao, resultado, elementoResultado);
    await this.registrarHistorico(`${tituloTabela}: ${resultado.valorRolado}`);
  },

  exibirResultado(nomeSecao, resultado, elementoResultado) {
    elementoResultado.textContent = '';

    const bloco = document.createElement('div');
    bloco.className = 'resultado-rolagem';

    const valor = document.createElement('span');
    valor.className = 'valor-rolado';
    valor.textContent = resultado.valorRolado;
    bloco.appendChild(valor);

    const texto = document.createElement('span');
    texto.className = 'texto-resultado';
    texto.textContent = resultado.entrada.texto;
    bloco.appendChild(texto);

    const containerLinks = document.createElement('div');
    containerLinks.className = 'links-resolvidos';
    bloco.appendChild(containerLinks);

    elementoResultado.appendChild(bloco);

    if (resultado.entrada.links) {
      resultado.entrada.links.forEach((link) => {
        this.expandirLink(nomeSecao, link, containerLinks);
      });
    }
  },

  async expandirLink(nomeSecaoOrigem, link, container) {
    const secoesParaTentar = ['mundo', 'glossario', 'regras', 'monstros'];
    for (const secao of secoesParaTentar) {
      try {
        const nota = await Api.obterNota(secao, link.alvo);

        const bloco = document.createElement('div');
        bloco.className = 'link-expandido';

        const titulo = document.createElement('strong');
        titulo.textContent = nota.titulo;
        bloco.appendChild(titulo);

        const paragrafo = document.createElement('p');
        paragrafo.textContent = resumo(nota.corpoMarkdown);
        bloco.appendChild(paragrafo);

        container.appendChild(bloco);
        return;
      } catch {
        continue;
      }
    }

    console.warn(`Link não resolvido em nenhuma seção: '${link.alvo}' (rótulo: '${link.rotulo}')`);
  },

  async registrarHistorico(descricao) {
    try {
      await Api.registrarHistorico(Campanha.ativa.id, descricao);
    } catch (erro) {
      console.error(erro);
    }
    await this.recarregarHistorico();
  },

  async recarregarHistorico() {
    const lista = document.getElementById('historico-rolagens');
    if (!lista) return;

    let historico;
    try {
      historico = await Api.listarHistorico(Campanha.ativa.id);
    } catch (erro) {
      console.error(erro);
      return;
    }

    lista.textContent = '';

    if (historico.length === 0) {
      const vazio = document.createElement('li');
      vazio.className = 'historico-vazio';
      vazio.textContent = 'Nenhuma rolagem ainda.';
      lista.appendChild(vazio);
      return;
    }

    historico.slice(0, 15).forEach((entrada) => {
      const linha = document.createElement('li');
      linha.textContent = entrada.descricao;
      lista.appendChild(linha);
    });
  },

  configurarBotaoLimpar() {
    document.getElementById('botao-limpar-historico').addEventListener('click', async () => {
      if (!window.confirm('Limpar todo o histórico de rolagens desta campanha?')) {
        return;
      }
      await Api.limparHistorico(Campanha.ativa.id);
      await this.recarregarHistorico();
    });
  },
};

function resumo(markdown) {
  const linhas = (markdown || '').split('\n').filter((linha) => linha.trim() && !linha.startsWith('#'));
  return (linhas[0] || '').slice(0, 200);
}
```

- [ ] **Step 4: Ligar a inicialização do histórico e reação à troca de campanha** — em `js/app.js`, dentro do `DOMContentLoaded`:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await Campanha.inicializar();
  carregarArvoreNavegacao();
  Rolador.configurarBotaoLimpar();
  await Rolador.recarregarHistorico();

  document.getElementById('botao-quadro-quests').addEventListener('click', () => Quests.exibir());

  document.addEventListener('campanha-trocada', () => {
    const mural = document.getElementById('mural-quests');
    if (mural) {
      Quests.recarregar();
    }
    Rolador.recarregarHistorico();
  });
});
```

- [ ] **Step 5: Estilizar o cabeçalho do histórico em `css/estilo.css`**

```css
.cabecalho-historico {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.cabecalho-historico h2 {
  margin: 0;
}

.botao-limpar-historico {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.7;
}

.botao-limpar-historico:hover {
  opacity: 1;
}
```

- [ ] **Step 6: Testar manualmente**

Run: `dotnet run --project src/PainelDed.Api`. Confirmar:
1. Rolar uma tabela — aparece no histórico da barra lateral.
2. Recarregar a página (F5) — o histórico permanece (persistido no backend, diferente do comportamento do Plano 1).
3. Clicar 🗑️, confirmar — histórico esvazia (e continua vazio após F5).
4. Trocar de campanha — histórico muda pro da outra campanha.

- [ ] **Step 7: Rodar a suíte completa uma última vez**

Run: `dotnet test`
Expected: todos os testes do backend continuam passando (o frontend não tem testes automatizados, validado manualmente).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: histórico de rolagens persistido por campanha + botão de limpar"
```

---

## Verificação de Cobertura do Spec

- Conceito de Campanha (criar, listar, selecionar) → Tasks 1, 3, 7, 8.
- Persistência de histórico por campanha → Tasks 1, 3, 5, 7, 10.
- CRUD de quests → Tasks 1, 3, 4, 7, 9.
- Atalho "Gerar ideia" (sorteio aleatório entre as 4 tabelas) → Task 6.
- Botão de limpar histórico → Task 10.
- Fora do escopo (editar/excluir campanha, personagens, side quests) → não tocado neste plano, conforme spec.
