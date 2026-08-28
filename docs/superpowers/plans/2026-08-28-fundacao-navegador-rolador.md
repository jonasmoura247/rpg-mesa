# Fundação + Navegador/Rolador de Conteúdo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a fundação do projeto `painel-ded` (solução .NET + frontend estático) e o primeiro subsistema funcional: ingestão das 63 notas do vault "Costa da Travessia" em JSON estruturado, servidas por uma API local em C#, navegáveis e roláveis (com resolução de wikilinks) numa interface web simples.

**Architecture:** Uma biblioteca compartilhada (`PainelDed.Nucleo`) contém os modelos de dados e os parsers de Markdown (tabelas + wikilinks), usados tanto por um conversor CLI (`PainelDed.Ingestor`, roda uma vez para gerar `content/*.json` a partir do vault) quanto pela API (`PainelDed.Api`, ASP.NET Core Minimal API, que carrega esses JSONs em memória e expõe endpoints de leitura e rolagem). O frontend é HTML/CSS/JS puro servido como arquivos estáticos pela própria API (pasta `wwwroot`), eliminando a necessidade de um segundo servidor.

**Tech Stack:** .NET 8 (C#), ASP.NET Core Minimal API, xUnit, HTML/CSS/JavaScript vanilla.

---

## Pré-requisitos

- .NET SDK 8.0+ instalado (`dotnet --version` deve mostrar 8.x ou superior).
- O vault "Costa da Travessia" já existe em `C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia`.
- Repositório git já inicializado em `C:\Users\Jonas\Desktop\Projetos\painel-ded` com o spec commitado.

Todos os comandos abaixo assumem diretório de trabalho `C:\Users\Jonas\Desktop\Projetos\painel-ded` (chamado de `<raiz>` daqui em diante).

---

### Task 1: Estrutura da solução .NET

**Files:**
- Create: `<raiz>/PainelDed.sln`
- Create: `<raiz>/src/PainelDed.Nucleo/PainelDed.Nucleo.csproj`
- Create: `<raiz>/src/PainelDed.Ingestor/PainelDed.Ingestor.csproj`
- Create: `<raiz>/src/PainelDed.Api/PainelDed.Api.csproj`
- Create: `<raiz>/tests/PainelDed.Nucleo.Testes/PainelDed.Nucleo.Testes.csproj`
- Create: `<raiz>/tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj`
- Create: `<raiz>/.gitignore`

- [ ] **Step 1: Criar a solução e os projetos**

```bash
dotnet new sln -n PainelDed
dotnet new classlib -o src/PainelDed.Nucleo -n PainelDed.Nucleo
dotnet new console -o src/PainelDed.Ingestor -n PainelDed.Ingestor
dotnet new web -o src/PainelDed.Api -n PainelDed.Api
dotnet new xunit -o tests/PainelDed.Nucleo.Testes -n PainelDed.Nucleo.Testes
dotnet new xunit -o tests/PainelDed.Api.Testes -n PainelDed.Api.Testes
```

- [ ] **Step 2: Remover arquivos de exemplo gerados automaticamente**

```bash
rm src/PainelDed.Nucleo/Class1.cs
rm tests/PainelDed.Nucleo.Testes/UnitTest1.cs
rm tests/PainelDed.Api.Testes/UnitTest1.cs
```

- [ ] **Step 3: Registrar os projetos na solução e as referências entre eles**

```bash
dotnet sln add src/PainelDed.Nucleo/PainelDed.Nucleo.csproj
dotnet sln add src/PainelDed.Ingestor/PainelDed.Ingestor.csproj
dotnet sln add src/PainelDed.Api/PainelDed.Api.csproj
dotnet sln add tests/PainelDed.Nucleo.Testes/PainelDed.Nucleo.Testes.csproj
dotnet sln add tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj

dotnet add src/PainelDed.Ingestor/PainelDed.Ingestor.csproj reference src/PainelDed.Nucleo/PainelDed.Nucleo.csproj
dotnet add src/PainelDed.Api/PainelDed.Api.csproj reference src/PainelDed.Nucleo/PainelDed.Nucleo.csproj
dotnet add tests/PainelDed.Nucleo.Testes/PainelDed.Nucleo.Testes.csproj reference src/PainelDed.Nucleo/PainelDed.Nucleo.csproj
dotnet add tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj reference src/PainelDed.Api/PainelDed.Api.csproj
dotnet add tests/PainelDed.Api.Testes/PainelDed.Api.Testes.csproj package Microsoft.AspNetCore.Mvc.Testing
```

- [ ] **Step 4: Criar `.gitignore`**

```
bin/
obj/
*.user
```

- [ ] **Step 5: Verificar que tudo compila**

Run: `dotnet build`
Expected: `Build succeeded. 0 Warning(s) 0 Error(s)` (avisos de nulabilidade são aceitáveis nesta etapa).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: estrutura inicial da solução .NET"
```

---

### Task 2: Modelos de conteúdo

**Files:**
- Create: `src/PainelDed.Nucleo/Modelos/LinkReferencia.cs`
- Create: `src/PainelDed.Nucleo/Modelos/EntradaTabela.cs`
- Create: `src/PainelDed.Nucleo/Modelos/TabelaRolagem.cs`
- Create: `src/PainelDed.Nucleo/Modelos/NotaConteudo.cs`
- Create: `src/PainelDed.Nucleo/Modelos/SecaoConteudo.cs`
- Create: `src/PainelDed.Nucleo/Modelos/ResultadoRolagem.cs`
- Test: `tests/PainelDed.Nucleo.Testes/Modelos/SerializacaoTestes.cs`

- [ ] **Step 1: Criar os records de modelo**

`src/PainelDed.Nucleo/Modelos/LinkReferencia.cs`:
```csharp
namespace PainelDed.Nucleo.Modelos;

public record LinkReferencia(string Rotulo, string Alvo);
```

`src/PainelDed.Nucleo/Modelos/EntradaTabela.cs`:
```csharp
namespace PainelDed.Nucleo.Modelos;

public record EntradaTabela(int FaixaInicio, int FaixaFim, string Texto, List<LinkReferencia> Links);
```

`src/PainelDed.Nucleo/Modelos/TabelaRolagem.cs`:
```csharp
namespace PainelDed.Nucleo.Modelos;

public record TabelaRolagem(string Titulo, string Dado, List<EntradaTabela> Entradas);
```

`src/PainelDed.Nucleo/Modelos/NotaConteudo.cs`:
```csharp
namespace PainelDed.Nucleo.Modelos;

public record NotaConteudo(string Id, string Titulo, string CorpoMarkdown, List<TabelaRolagem> Tabelas);
```

`src/PainelDed.Nucleo/Modelos/SecaoConteudo.cs`:
```csharp
namespace PainelDed.Nucleo.Modelos;

public record SecaoConteudo(string Nome, List<NotaConteudo> Notas);
```

`src/PainelDed.Nucleo/Modelos/ResultadoRolagem.cs`:
```csharp
namespace PainelDed.Nucleo.Modelos;

public record ResultadoRolagem(string TabelaTitulo, string Dado, int ValorRolado, EntradaTabela Entrada);
```

- [ ] **Step 2: Escrever teste de round-trip de serialização (falha primeiro por não compilar sem o using certo — ajuste trivial)**

`tests/PainelDed.Nucleo.Testes/Modelos/SerializacaoTestes.cs`:
```csharp
using System.Text.Json;
using PainelDed.Nucleo.Modelos;
using Xunit;

namespace PainelDed.Nucleo.Testes.Modelos;

public class SerializacaoTestes
{
    private static readonly JsonSerializerOptions Opcoes = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public void SecaoConteudo_SerializaEDesserializaMantendoOsDados()
    {
        var original = new SecaoConteudo("mundo", new List<NotaConteudo>
        {
            new("mundo/01-hexcrawl", "Hexcrawl", "# Hexcrawl\ntexto", new List<TabelaRolagem>
            {
                new("Descrição do Hexágono", "1d6", new List<EntradaTabela>
                {
                    new(1, 2, "Vegetação encontra seu fim...", new List<LinkReferencia>
                    {
                        new("restinga", "glossario/paisagens/restinga"),
                    }),
                }),
            }),
        });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<SecaoConteudo>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal(original.Nome, restaurado!.Nome);
        Assert.Single(restaurado.Notas);
        Assert.Equal("Hexcrawl", restaurado.Notas[0].Titulo);
        Assert.Single(restaurado.Notas[0].Tabelas);
        Assert.Equal("1d6", restaurado.Notas[0].Tabelas[0].Dado);
        Assert.Equal(2, restaurado.Notas[0].Tabelas[0].Entradas[0].FaixaFim);
        Assert.Equal("restinga", restaurado.Notas[0].Tabelas[0].Entradas[0].Links[0].Rotulo);
    }
}
```

- [ ] **Step 3: Rodar o teste**

Run: `dotnet test tests/PainelDed.Nucleo.Testes`
Expected: `Passed! - Failed: 0, Passed: 1`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: modelos de conteúdo (Nucleo)"
```

---

### Task 3: Dado (rolador de dados)

**Files:**
- Create: `src/PainelDed.Nucleo/Rolagem/IDado.cs`
- Create: `src/PainelDed.Nucleo/Rolagem/Dado.cs`
- Test: `tests/PainelDed.Nucleo.Testes/Rolagem/DadoTestes.cs`

- [ ] **Step 1: Escrever os testes que falham**

`tests/PainelDed.Nucleo.Testes/Rolagem/DadoTestes.cs`:
```csharp
using System;
using PainelDed.Nucleo.Rolagem;
using Xunit;

namespace PainelDed.Nucleo.Testes.Rolagem;

public class DadoTestes
{
    [Theory]
    [InlineData("1d20", 1, 20)]
    [InlineData("1d6", 1, 6)]
    [InlineData("2d6", 2, 12)]
    [InlineData("1d100", 1, 100)]
    public void Rolar_ComNotacaoValida_RetornaValorDentroDaFaixa(string notacao, int minimo, int maximo)
    {
        var dado = new Dado(new Random(42));
        for (var i = 0; i < 200; i++)
        {
            var resultado = dado.Rolar(notacao);
            Assert.InRange(resultado, minimo, maximo);
        }
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("d20")]
    [InlineData("1d")]
    [InlineData("0d20")]
    [InlineData("1d1")]
    public void Rolar_ComNotacaoInvalida_LancaArgumentException(string notacaoInvalida)
    {
        var dado = new Dado(new Random(1));
        Assert.Throws<ArgumentException>(() => dado.Rolar(notacaoInvalida));
    }

    [Fact]
    public void ParsearNotacao_ComNotacaoValida_RetornaQuantidadeELados()
    {
        var (quantidade, lados) = Dado.ParsearNotacao("2d6");
        Assert.Equal(2, quantidade);
        Assert.Equal(6, lados);
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Nucleo.Testes --filter DadoTestes`
Expected: FAIL — `error CS0246: The type or namespace name 'Dado' could not be found`

- [ ] **Step 3: Implementar `IDado` e `Dado`**

`src/PainelDed.Nucleo/Rolagem/IDado.cs`:
```csharp
namespace PainelDed.Nucleo.Rolagem;

public interface IDado
{
    int Rolar(string notacao);
}
```

`src/PainelDed.Nucleo/Rolagem/Dado.cs`:
```csharp
using System.Text.RegularExpressions;

namespace PainelDed.Nucleo.Rolagem;

public class Dado : IDado
{
    private static readonly Regex RegexNotacao = new(@"^(?<quantidade>\d+)d(?<lados>\d+)$", RegexOptions.Compiled);
    private readonly Random _aleatorio;

    public Dado(Random? aleatorio = null)
    {
        _aleatorio = aleatorio ?? new Random();
    }

    public int Rolar(string notacao)
    {
        var (quantidade, lados) = ParsearNotacao(notacao);
        var total = 0;
        for (var i = 0; i < quantidade; i++)
        {
            total += _aleatorio.Next(1, lados + 1);
        }
        return total;
    }

    public static (int Quantidade, int Lados) ParsearNotacao(string notacao)
    {
        var match = RegexNotacao.Match(notacao.Trim().ToLowerInvariant());
        if (!match.Success)
        {
            throw new ArgumentException($"Notação de dado inválida: '{notacao}'. Formato esperado: 'NdM', ex: '1d20'.");
        }

        var quantidade = int.Parse(match.Groups["quantidade"].Value);
        var lados = int.Parse(match.Groups["lados"].Value);

        if (quantidade < 1)
        {
            throw new ArgumentException($"Quantidade de dados deve ser ao menos 1 em '{notacao}'.");
        }

        if (lados < 2)
        {
            throw new ArgumentException($"Número de lados deve ser ao menos 2 em '{notacao}'.");
        }

        return (quantidade, lados);
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Nucleo.Testes --filter DadoTestes`
Expected: `Passed! - Failed: 0, Passed: 8`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: rolador de dados (Dado/IDado)"
```

---

### Task 4: Parser de wikilinks

**Files:**
- Create: `src/PainelDed.Nucleo/Parsing/ParserWikilink.cs`
- Test: `tests/PainelDed.Nucleo.Testes/Parsing/ParserWikilinkTestes.cs`

- [ ] **Step 1: Escrever os testes que falham**

`tests/PainelDed.Nucleo.Testes/Parsing/ParserWikilinkTestes.cs`:
```csharp
using PainelDed.Nucleo.Parsing;
using Xunit;

namespace PainelDed.Nucleo.Testes.Parsing;

public class ParserWikilinkTestes
{
    [Fact]
    public void ExtrairLinks_ComLinkERotulo_RetornaAlvoNormalizadoERotulo()
    {
        var texto = "preenchida pela [[../glossario/paisagens/restinga\\|restinga]] e vegetação rasteira.";

        var links = ParserWikilink.ExtrairLinks(texto);

        Assert.Single(links);
        Assert.Equal("restinga", links[0].Rotulo);
        Assert.Equal("glossario/paisagens/restinga", links[0].Alvo);
    }

    [Fact]
    public void ExtrairLinks_SemRotulo_UsaAlvoComoRotulo()
    {
        var texto = "Ver [[Costa da Travessia]] para mais detalhes.";

        var links = ParserWikilink.ExtrairLinks(texto);

        Assert.Single(links);
        Assert.Equal("Costa da Travessia", links[0].Rotulo);
        Assert.Equal("Costa da Travessia", links[0].Alvo);
    }

    [Fact]
    public void ExtrairLinks_ComMultiplosLinks_RetornaTodos()
    {
        var texto = "[[a\\|A]] e [[b\\|B]]";

        var links = ParserWikilink.ExtrairLinks(texto);

        Assert.Equal(2, links.Count);
    }

    [Fact]
    public void LimparTexto_RemoveColchetesEMantemRotulo()
    {
        var texto = "role na [[../Costa da Travessia/05-Ruinas\\|Ruínas]] agora";

        var limpo = ParserWikilink.LimparTexto(texto);

        Assert.Equal("role na Ruínas agora", limpo);
    }

    [Fact]
    public void ExtrairLinks_SemLinks_RetornaListaVazia()
    {
        var links = ParserWikilink.ExtrairLinks("texto sem links nenhum");

        Assert.Empty(links);
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Nucleo.Testes --filter ParserWikilinkTestes`
Expected: FAIL — `The type or namespace name 'ParserWikilink' could not be found`

- [ ] **Step 3: Implementar `ParserWikilink`**

`src/PainelDed.Nucleo/Parsing/ParserWikilink.cs`:
```csharp
using System.Text.RegularExpressions;
using PainelDed.Nucleo.Modelos;

namespace PainelDed.Nucleo.Parsing;

public static class ParserWikilink
{
    private static readonly Regex RegexLink = new(
        @"\[\[(?<alvo>[^\]|\\]+)(?:\\?\|(?<rotulo>[^\]]+))?\]\]",
        RegexOptions.Compiled);

    public static List<LinkReferencia> ExtrairLinks(string texto)
    {
        var links = new List<LinkReferencia>();
        foreach (Match match in RegexLink.Matches(texto))
        {
            var alvo = NormalizarAlvo(match.Groups["alvo"].Value.Trim());
            var rotulo = match.Groups["rotulo"].Success
                ? match.Groups["rotulo"].Value.Trim()
                : alvo;
            links.Add(new LinkReferencia(rotulo, alvo));
        }
        return links;
    }

    public static string LimparTexto(string texto)
    {
        return RegexLink.Replace(texto, match =>
            match.Groups["rotulo"].Success
                ? match.Groups["rotulo"].Value.Trim()
                : NormalizarAlvo(match.Groups["alvo"].Value.Trim()));
    }

    private static string NormalizarAlvo(string alvo)
    {
        var normalizado = alvo.Replace('\\', '/');
        while (normalizado.StartsWith("../"))
        {
            normalizado = normalizado[3..];
        }
        return normalizado.TrimStart('/');
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Nucleo.Testes --filter ParserWikilinkTestes`
Expected: `Passed! - Failed: 0, Passed: 5`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: parser de wikilinks"
```

---

### Task 5: Parser de tabelas Markdown

**Files:**
- Create: `src/PainelDed.Nucleo/Parsing/ParserTabela.cs`
- Test: `tests/PainelDed.Nucleo.Testes/Parsing/ParserTabelaTestes.cs`

- [ ] **Step 1: Escrever os testes que falham**

`tests/PainelDed.Nucleo.Testes/Parsing/ParserTabelaTestes.cs`:
```csharp
using PainelDed.Nucleo.Parsing;
using Xunit;

namespace PainelDed.Nucleo.Testes.Parsing;

public class ParserTabelaTestes
{
    private const string MarkdownComUmaTabela = """
        # Hexcrawl

        Texto de introdução.

        ## Descrição do Hexágono — 1d6

        | Roll | Resultado |
        |------|-----------|
        | 1–2 | A vegetação encontra seu fim. |
        | 3–4 | A colina rochosa avança. |
        | 5 | Igual a 3–4. |
        | 6 | O terreno rochoso dá lugar. |

        ---

        ## Condições — 1d6

        | Roll | Resultado |
        |------|-----------|
        | 1 | Ventos fortes balançam a vegetação. |
        | 2 | Descida preenchida pela [[../glossario/paisagens/restinga\|restinga]]. |
        """;

    [Fact]
    public void ExtrairTabelas_ComDuasTabelas_RetornaAmbasComTitulosEDados()
    {
        var tabelas = ParserTabela.ExtrairTabelas(MarkdownComUmaTabela);

        Assert.Equal(2, tabelas.Count);
        Assert.Equal("Descrição do Hexágono", tabelas[0].Titulo);
        Assert.Equal("1d6", tabelas[0].Dado);
        Assert.Equal("Condições", tabelas[1].Titulo);
    }

    [Fact]
    public void ExtrairTabelas_ComFaixaDupla_ParseiaInicioEFim()
    {
        var tabelas = ParserTabela.ExtrairTabelas(MarkdownComUmaTabela);
        var primeiraEntrada = tabelas[0].Entradas[0];

        Assert.Equal(1, primeiraEntrada.FaixaInicio);
        Assert.Equal(2, primeiraEntrada.FaixaFim);
        Assert.Equal("A vegetação encontra seu fim.", primeiraEntrada.Texto);
    }

    [Fact]
    public void ExtrairTabelas_ComFaixaUnica_UsaMesmoValorParaInicioEFim()
    {
        var tabelas = ParserTabela.ExtrairTabelas(MarkdownComUmaTabela);
        var entradaUnica = tabelas[0].Entradas[2];

        Assert.Equal(5, entradaUnica.FaixaInicio);
        Assert.Equal(5, entradaUnica.FaixaFim);
    }

    [Fact]
    public void ExtrairTabelas_ComWikilinkNaCelula_ExtraiLinkELimpaTexto()
    {
        var tabelas = ParserTabela.ExtrairTabelas(MarkdownComUmaTabela);
        var entradaComLink = tabelas[1].Entradas[1];

        Assert.Single(entradaComLink.Links);
        Assert.Equal("restinga", entradaComLink.Links[0].Rotulo);
        Assert.Equal("glossario/paisagens/restinga", entradaComLink.Links[0].Alvo);
        Assert.Equal("Descida preenchida pela restinga.", entradaComLink.Texto);
    }

    [Fact]
    public void ExtrairTabelas_SemTabelasNoMarkdown_RetornaListaVazia()
    {
        var tabelas = ParserTabela.ExtrairTabelas("# Título\n\nSó texto, sem tabela nenhuma.");

        Assert.Empty(tabelas);
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Nucleo.Testes --filter ParserTabelaTestes`
Expected: FAIL — `The type or namespace name 'ParserTabela' could not be found`

- [ ] **Step 3: Implementar `ParserTabela`**

`src/PainelDed.Nucleo/Parsing/ParserTabela.cs`:
```csharp
using System.Text.RegularExpressions;
using PainelDed.Nucleo.Modelos;

namespace PainelDed.Nucleo.Parsing;

public static class ParserTabela
{
    private static readonly Regex RegexCabecalhoComDado = new(
        @"^#{1,6}\s+(?<titulo>.+?)\s*[—-]\s*(?<dado>\d+d\d+)\s*$", RegexOptions.Compiled);
    private static readonly Regex RegexLinhaTabela = new(@"^\|(?<celulas>.+)\|\s*$", RegexOptions.Compiled);
    private static readonly Regex RegexSeparadorTabela = new(@"^\|[\s:|-]+\|\s*$", RegexOptions.Compiled);
    private static readonly Regex RegexFaixa = new(
        @"^(?<inicio>\d+)(?:\s*[–-]\s*(?<fim>\d+))?$", RegexOptions.Compiled);

    public static List<TabelaRolagem> ExtrairTabelas(string markdown)
    {
        var linhas = markdown.Replace("\r\n", "\n").Split('\n');
        var tabelas = new List<TabelaRolagem>();

        for (var i = 0; i < linhas.Length; i++)
        {
            var matchCabecalho = RegexCabecalhoComDado.Match(linhas[i].Trim());
            if (!matchCabecalho.Success)
            {
                continue;
            }

            var titulo = matchCabecalho.Groups["titulo"].Value.Trim();
            var dado = matchCabecalho.Groups["dado"].Value.Trim();

            var indice = i + 1;
            while (indice < linhas.Length
                   && !RegexLinhaTabela.IsMatch(linhas[indice])
                   && !linhas[indice].TrimStart().StartsWith('#'))
            {
                indice++;
            }

            if (indice >= linhas.Length || !RegexLinhaTabela.IsMatch(linhas[indice]))
            {
                continue; // seção seguinte começou antes de achar uma tabela
            }

            indice++; // pula a linha de separador |---|---|
            var entradas = new List<EntradaTabela>();

            while (indice < linhas.Length && RegexLinhaTabela.IsMatch(linhas[indice]))
            {
                if (!RegexSeparadorTabela.IsMatch(linhas[indice]))
                {
                    var entrada = ParsearLinha(linhas[indice]);
                    if (entrada is not null)
                    {
                        entradas.Add(entrada);
                    }
                }
                indice++;
            }

            if (entradas.Count > 0)
            {
                tabelas.Add(new TabelaRolagem(titulo, dado, entradas));
            }
        }

        return tabelas;
    }

    private static EntradaTabela? ParsearLinha(string linha)
    {
        const string marcadorPipeEscapado = "\u0001";
        var linhaEscapada = linha.Replace("\\|", marcadorPipeEscapado);
        var celulas = linhaEscapada.Trim().Trim('|').Split('|');
        if (celulas.Length < 2)
        {
            return null;
        }

        var faixaTexto = celulas[0].Trim();
        var textoResultado = string.Join("|", celulas[1..]).Trim().Replace(marcadorPipeEscapado, "|");

        var matchFaixa = RegexFaixa.Match(faixaTexto);
        if (!matchFaixa.Success)
        {
            return null;
        }

        var inicio = int.Parse(matchFaixa.Groups["inicio"].Value);
        var fim = matchFaixa.Groups["fim"].Success ? int.Parse(matchFaixa.Groups["fim"].Value) : inicio;

        var links = ParserWikilink.ExtrairLinks(textoResultado);
        var textoLimpo = ParserWikilink.LimparTexto(textoResultado);

        return new EntradaTabela(inicio, fim, textoLimpo, links);
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Nucleo.Testes --filter ParserTabelaTestes`
Expected: `Passed! - Failed: 0, Passed: 5`

- [ ] **Step 5: Rodar toda a suíte do Nucleo pra garantir que nada quebrou**

Run: `dotnet test tests/PainelDed.Nucleo.Testes`
Expected: `Passed! - Failed: 0, Passed: 19` (8 Dado + 5 Wikilink + 5 Tabela + 1 Serialização)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: parser de tabelas markdown"
```

---

### Task 6: Conversor de seção (Markdown → modelo)

**Files:**
- Create: `src/PainelDed.Nucleo/Ingestao/ConversorSecao.cs`
- Test: `tests/PainelDed.Nucleo.Testes/Ingestao/ConversorSecaoTestes.cs`

- [ ] **Step 1: Escrever o teste que falha (usa arquivos temporários reais em disco)**

`tests/PainelDed.Nucleo.Testes/Ingestao/ConversorSecaoTestes.cs`:
```csharp
using System.IO;
using PainelDed.Nucleo.Ingestao;
using Xunit;

namespace PainelDed.Nucleo.Testes.Ingestao;

public class ConversorSecaoTestes : IDisposable
{
    private readonly string _pastaTemporaria;

    public ConversorSecaoTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-testes-" + Guid.NewGuid());
        Directory.CreateDirectory(_pastaTemporaria);
    }

    public void Dispose()
    {
        Directory.Delete(_pastaTemporaria, recursive: true);
    }

    [Fact]
    public void Converter_ComArquivosMarkdown_GeraNotasComIdTituloETabelas()
    {
        var caminhoArquivo = Path.Combine(_pastaTemporaria, "01-Hexcrawl.md");
        File.WriteAllText(caminhoArquivo, """
            # Hexcrawl

            ## Condições — 1d6

            | Roll | Resultado |
            |------|-----------|
            | 1 | Ventos fortes. |
            """);

        var secao = ConversorSecao.Converter("mundo", _pastaTemporaria, new[] { caminhoArquivo });

        Assert.Equal("mundo", secao.Nome);
        Assert.Single(secao.Notas);
        Assert.Equal("01-Hexcrawl", secao.Notas[0].Id);
        Assert.Equal("Hexcrawl", secao.Notas[0].Titulo);
        Assert.Single(secao.Notas[0].Tabelas);
    }

    [Fact]
    public void Converter_ComSubpastas_GeraIdComBarrasNormalizadas()
    {
        var pastaAninhada = Path.Combine(_pastaTemporaria, "glossario", "paisagens");
        Directory.CreateDirectory(pastaAninhada);
        var caminhoArquivo = Path.Combine(pastaAninhada, "restinga.md");
        File.WriteAllText(caminhoArquivo, "# Restinga\n\nTexto sem tabela.");

        var secao = ConversorSecao.Converter("glossario", _pastaTemporaria, new[] { caminhoArquivo });

        Assert.Equal("glossario/paisagens/restinga", secao.Notas[0].Id);
    }

    [Fact]
    public void Converter_SemTituloH1_UsaIdComoTitulo()
    {
        var caminhoArquivo = Path.Combine(_pastaTemporaria, "sem-titulo.md");
        File.WriteAllText(caminhoArquivo, "Texto sem cabeçalho H1.");

        var secao = ConversorSecao.Converter("mundo", _pastaTemporaria, new[] { caminhoArquivo });

        Assert.Equal("sem-titulo", secao.Notas[0].Titulo);
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Nucleo.Testes --filter ConversorSecaoTestes`
Expected: FAIL — `The type or namespace name 'ConversorSecao' could not be found`

- [ ] **Step 3: Implementar `ConversorSecao`**

`src/PainelDed.Nucleo/Ingestao/ConversorSecao.cs`:
```csharp
using System.Text;
using PainelDed.Nucleo.Modelos;
using PainelDed.Nucleo.Parsing;

namespace PainelDed.Nucleo.Ingestao;

public static class ConversorSecao
{
    public static SecaoConteudo Converter(string nomeSecao, string caminhoVault, IEnumerable<string> arquivosMarkdown)
    {
        var notas = arquivosMarkdown
            .OrderBy(caminho => caminho, StringComparer.OrdinalIgnoreCase)
            .Select(caminho => ConverterArquivo(caminhoVault, caminho))
            .ToList();

        return new SecaoConteudo(nomeSecao, notas);
    }

    private static NotaConteudo ConverterArquivo(string caminhoVault, string caminhoArquivo)
    {
        var markdown = File.ReadAllText(caminhoArquivo, Encoding.UTF8);
        var id = GerarId(caminhoVault, caminhoArquivo);
        var titulo = ExtrairTitulo(markdown, id);
        var tabelas = ParserTabela.ExtrairTabelas(markdown);
        return new NotaConteudo(id, titulo, markdown, tabelas);
    }

    private static string GerarId(string caminhoVault, string caminhoArquivo)
    {
        var relativo = Path.GetRelativePath(caminhoVault, caminhoArquivo);
        var semExtensao = relativo[..^3]; // remove ".md"
        return semExtensao.Replace('\\', '/');
    }

    private static string ExtrairTitulo(string markdown, string idPadrao)
    {
        foreach (var linha in markdown.Replace("\r\n", "\n").Split('\n'))
        {
            if (linha.StartsWith("# "))
            {
                return linha[2..].Trim();
            }
        }
        return idPadrao;
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Nucleo.Testes --filter ConversorSecaoTestes`
Expected: `Passed! - Failed: 0, Passed: 3`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: conversor de seção (markdown para modelo)"
```

---

### Task 7: CLI de ingestão e primeira execução real contra o vault

**Files:**
- Modify: `src/PainelDed.Ingestor/Program.cs`

- [ ] **Step 1: Escrever o `Program.cs` do ingestor**

`src/PainelDed.Ingestor/Program.cs`:
```csharp
using System.Text.Json;
using PainelDed.Nucleo.Ingestao;

if (args.Length < 2)
{
    Console.Error.WriteLine("Uso: PainelDed.Ingestor <caminho-do-vault> <pasta-de-saida>");
    return 1;
}

var caminhoVault = args[0];
var pastaSaida = args[1];

var nomesDeSecao = new[] { "mundo", "glossario", "regras", "monstros" };
Directory.CreateDirectory(pastaSaida);

var opcoesJson = new JsonSerializerOptions
{
    WriteIndented = true,
};

var totalNotas = 0;

foreach (var nome in nomesDeSecao)
{
    List<string> arquivos;
    try
    {
        arquivos = ArquivosDaSecao(nome, caminhoVault);
    }
    catch (DirectoryNotFoundException erro)
    {
        Console.Error.WriteLine($"ERRO: {erro.Message}");
        return 1;
    }

    if (arquivos.Count == 0)
    {
        Console.Error.WriteLine($"ERRO: nenhuma nota encontrada na seção '{nome}'.");
        return 1;
    }

    var secaoConvertida = ConversorSecao.Converter(nome, caminhoVault, arquivos);
    var caminhoJson = Path.Combine(pastaSaida, $"{nome}.json");
    File.WriteAllText(caminhoJson, JsonSerializer.Serialize(secaoConvertida, opcoesJson));

    Console.WriteLine($"[{nome}] {secaoConvertida.Notas.Count} notas convertidas -> {caminhoJson}");
    totalNotas += secaoConvertida.Notas.Count;
}

Console.WriteLine($"Total: {totalNotas} notas convertidas em {nomesDeSecao.Length} seções.");
return 0;

List<string> ArquivosDaSecao(string nome, string vault)
{
    string ExigirPasta(string caminho)
    {
        if (!Directory.Exists(caminho))
        {
            throw new DirectoryNotFoundException($"pasta não encontrada para a seção '{nome}': {caminho}");
        }
        return caminho;
    }

    return nome switch
    {
        "mundo" => new[] { Path.Combine(vault, "Costa da Travessia.md") }
            .Concat(Directory.GetFiles(
                ExigirPasta(Path.Combine(vault, "Costa da Travessia")), "*.md", SearchOption.TopDirectoryOnly))
            .ToList(),
        "glossario" => Directory.GetFiles(
            ExigirPasta(Path.Combine(vault, "glossario")), "*.md", SearchOption.AllDirectories).ToList(),
        "regras" => Directory.GetFiles(
            ExigirPasta(Path.Combine(vault, "regras-do-jogo")), "*.md", SearchOption.AllDirectories).ToList(),
        "monstros" => Directory.GetFiles(
            ExigirPasta(Path.Combine(vault, "monstros")), "*.md", SearchOption.AllDirectories).ToList(),
        _ => throw new ArgumentException($"Seção desconhecida: {nome}"),
    };
}
```

- [ ] **Step 2: Rodar contra o vault real e conferir a saída**

Run:
```bash
dotnet run --project src/PainelDed.Ingestor -- "C:\Users\Jonas\Desktop\Documentos\Anotacoes\Costa da Travessia" "C:\Users\Jonas\Desktop\Projetos\painel-ded\content"
```
Expected (contagens exatas podem variar ligeiramente se o vault mudou, mas todas as 4 seções devem aparecer com contagem > 0 e sem nenhuma linha `ERRO:`):
```
[mundo] 17 notas convertidas -> ...\content\mundo.json
[glossario] 28 notas convertidas -> ...\content\glossario.json
[regras] 11 notas convertidas -> ...\content\regras.json
[monstros] 9 notas convertidas -> ...\content\monstros.json
Total: 65 notas convertidas em 4 seções.
```

- [ ] **Step 3: Inspecionar visualmente um dos JSONs gerados pra validar que tabelas e links saíram corretos**

Run: `head -c 2000 content/mundo.json` (ou abrir o arquivo no editor)
Expected: JSON válido, com pelo menos uma nota tendo `tabelas` não vazio e alguma entrada com `links` preenchido (ex: a nota do Hexcrawl referenciando `glossario/paisagens/restinga`).

- [ ] **Step 4: Commit (inclui os JSONs gerados, versionados conforme o spec)**

```bash
git add -A
git commit -m "feat: CLI de ingestão + primeira geração de content/*.json"
```

---

### Task 8: Repositório de conteúdo (API)

**Files:**
- Create: `src/PainelDed.Api/Conteudo/RepositorioConteudo.cs`
- Test: `tests/PainelDed.Api.Testes/Conteudo/RepositorioConteudoTestes.cs`

- [ ] **Step 1: Escrever o teste que falha**

`tests/PainelDed.Api.Testes/Conteudo/RepositorioConteudoTestes.cs`:
```csharp
using PainelDed.Api.Conteudo;
using PainelDed.Nucleo.Modelos;
using Xunit;

namespace PainelDed.Api.Testes.Conteudo;

public class RepositorioConteudoTestes
{
    private static RepositorioConteudo CriarRepositorioDeExemplo()
    {
        var secaoMundo = new SecaoConteudo("mundo", new List<NotaConteudo>
        {
            new("Costa da Travessia/01-Hexcrawl", "Hexcrawl", "conteudo", new List<TabelaRolagem>
            {
                new("Condições", "1d6", new List<EntradaTabela>
                {
                    new(1, 1, "Ventos fortes.", new List<LinkReferencia>()),
                }),
            }),
        });

        var secaoGlossario = new SecaoConteudo("glossario", new List<NotaConteudo>
        {
            new("glossario/paisagens/restinga", "Restinga", "conteudo", new List<TabelaRolagem>()),
        });

        return new RepositorioConteudo(new[] { secaoMundo, secaoGlossario });
    }

    [Fact]
    public void ObterSecao_ComNomeExistente_RetornaSecao()
    {
        var repositorio = CriarRepositorioDeExemplo();

        var secao = repositorio.ObterSecao("mundo");

        Assert.NotNull(secao);
        Assert.Single(secao!.Notas);
    }

    [Fact]
    public void ObterSecao_ComNomeInexistente_RetornaNulo()
    {
        var repositorio = CriarRepositorioDeExemplo();

        Assert.Null(repositorio.ObterSecao("inexistente"));
    }

    [Fact]
    public void ObterNota_ComIdExistente_RetornaNota()
    {
        var repositorio = CriarRepositorioDeExemplo();

        var nota = repositorio.ObterNota("mundo", "Costa da Travessia/01-Hexcrawl");

        Assert.NotNull(nota);
        Assert.Equal("Hexcrawl", nota!.Titulo);
    }

    [Fact]
    public void ResolverLink_ComAlvoParcial_EncontraNotaPorSlugFinal()
    {
        var repositorio = CriarRepositorioDeExemplo();

        var nota = repositorio.ResolverLink("glossario/paisagens/restinga");

        Assert.NotNull(nota);
        Assert.Equal("Restinga", nota!.Titulo);
    }

    [Fact]
    public void ResolverLink_ComAlvoInexistente_RetornaNulo()
    {
        var repositorio = CriarRepositorioDeExemplo();

        Assert.Null(repositorio.ResolverLink("nao/existe"));
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter RepositorioConteudoTestes`
Expected: FAIL — `The type or namespace name 'RepositorioConteudo' could not be found`

- [ ] **Step 3: Implementar `RepositorioConteudo`**

`src/PainelDed.Api/Conteudo/RepositorioConteudo.cs`:
```csharp
using System.Text.Json;
using PainelDed.Nucleo.Modelos;

namespace PainelDed.Api.Conteudo;

public class RepositorioConteudo
{
    private readonly Dictionary<string, SecaoConteudo> _secoes;

    public RepositorioConteudo(IEnumerable<SecaoConteudo> secoes)
    {
        _secoes = secoes.ToDictionary(secao => secao.Nome);
    }

    public static RepositorioConteudo CarregarDePasta(string pastaConteudo)
    {
        var opcoes = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var secoes = new List<SecaoConteudo>();

        foreach (var arquivo in Directory.GetFiles(pastaConteudo, "*.json"))
        {
            var json = File.ReadAllText(arquivo);
            var secao = JsonSerializer.Deserialize<SecaoConteudo>(json, opcoes)
                ?? throw new InvalidOperationException($"Falha ao carregar conteúdo de {arquivo}");
            secoes.Add(secao);
        }

        return new RepositorioConteudo(secoes);
    }

    public SecaoConteudo? ObterSecao(string nome) =>
        _secoes.TryGetValue(nome, out var secao) ? secao : null;

    public NotaConteudo? ObterNota(string nomeSecao, string idNota) =>
        ObterSecao(nomeSecao)?.Notas.FirstOrDefault(n => n.Id == idNota);

    public NotaConteudo? ResolverLink(string alvo)
    {
        var slug = alvo.Split('/').Last();
        foreach (var secao in _secoes.Values)
        {
            var nota = secao.Notas.FirstOrDefault(n => n.Id.Equals(alvo, StringComparison.OrdinalIgnoreCase))
                ?? secao.Notas.FirstOrDefault(n => n.Id.EndsWith("/" + slug, StringComparison.OrdinalIgnoreCase));
            if (nota is not null)
            {
                return nota;
            }
        }
        return null;
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Api.Testes --filter RepositorioConteudoTestes`
Expected: `Passed! - Failed: 0, Passed: 5`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: repositório de conteúdo (API)"
```

---

### Task 9: Serviço de rolagem

**Files:**
- Create: `src/PainelDed.Api/Rolagem/ServicoRolagem.cs`
- Test: `tests/PainelDed.Api.Testes/Rolagem/ServicoRolagemTestes.cs`

- [ ] **Step 1: Escrever o teste que falha (usa um `IDado` falso e determinístico)**

`tests/PainelDed.Api.Testes/Rolagem/ServicoRolagemTestes.cs`:
```csharp
using PainelDed.Api.Conteudo;
using PainelDed.Api.Rolagem;
using PainelDed.Nucleo.Modelos;
using PainelDed.Nucleo.Rolagem;
using Xunit;

namespace PainelDed.Api.Testes.Rolagem;

public class DadoFixo : IDado
{
    private readonly int _valor;
    public DadoFixo(int valor) => _valor = valor;
    public int Rolar(string notacao) => _valor;
}

public class ServicoRolagemTestes
{
    private static RepositorioConteudo CriarRepositorioDeExemplo()
    {
        var secao = new SecaoConteudo("mundo", new List<NotaConteudo>
        {
            new("Costa da Travessia/01-Hexcrawl", "Hexcrawl", "conteudo", new List<TabelaRolagem>
            {
                new("Condições", "1d6", new List<EntradaTabela>
                {
                    new(1, 2, "Resultado baixo.", new List<LinkReferencia>()),
                    new(3, 6, "Resultado alto.", new List<LinkReferencia>()),
                }),
            }),
        });

        return new RepositorioConteudo(new[] { secao });
    }

    [Fact]
    public void Rolar_ComValorNaPrimeiraFaixa_RetornaEntradaCorreta()
    {
        var servico = new ServicoRolagem(CriarRepositorioDeExemplo(), new DadoFixo(2));

        var resultado = servico.Rolar("mundo", "Costa da Travessia/01-Hexcrawl", "Condições");

        Assert.NotNull(resultado);
        Assert.Equal(2, resultado!.ValorRolado);
        Assert.Equal("Resultado baixo.", resultado.Entrada.Texto);
    }

    [Fact]
    public void Rolar_ComValorNaSegundaFaixa_RetornaEntradaCorreta()
    {
        var servico = new ServicoRolagem(CriarRepositorioDeExemplo(), new DadoFixo(5));

        var resultado = servico.Rolar("mundo", "Costa da Travessia/01-Hexcrawl", "Condições");

        Assert.Equal("Resultado alto.", resultado!.Entrada.Texto);
    }

    [Fact]
    public void Rolar_ComNotaInexistente_RetornaNulo()
    {
        var servico = new ServicoRolagem(CriarRepositorioDeExemplo(), new DadoFixo(1));

        var resultado = servico.Rolar("mundo", "nao-existe", "Condições");

        Assert.Null(resultado);
    }

    [Fact]
    public void Rolar_ComTabelaInexistente_RetornaNulo()
    {
        var servico = new ServicoRolagem(CriarRepositorioDeExemplo(), new DadoFixo(1));

        var resultado = servico.Rolar("mundo", "Costa da Travessia/01-Hexcrawl", "Tabela Errada");

        Assert.Null(resultado);
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ServicoRolagemTestes`
Expected: FAIL — `The type or namespace name 'ServicoRolagem' could not be found`

- [ ] **Step 3: Implementar `ServicoRolagem`**

`src/PainelDed.Api/Rolagem/ServicoRolagem.cs`:
```csharp
using PainelDed.Api.Conteudo;
using PainelDed.Nucleo.Modelos;
using PainelDed.Nucleo.Rolagem;

namespace PainelDed.Api.Rolagem;

public class ServicoRolagem
{
    private readonly RepositorioConteudo _repositorio;
    private readonly IDado _dado;

    public ServicoRolagem(RepositorioConteudo repositorio, IDado dado)
    {
        _repositorio = repositorio;
        _dado = dado;
    }

    public ResultadoRolagem? Rolar(string nomeSecao, string idNota, string tituloTabela)
    {
        var nota = _repositorio.ObterNota(nomeSecao, idNota);
        var tabela = nota?.Tabelas.FirstOrDefault(t => t.Titulo == tituloTabela);
        if (tabela is null)
        {
            return null;
        }

        var valor = _dado.Rolar(tabela.Dado);
        var entrada = tabela.Entradas.FirstOrDefault(e => valor >= e.FaixaInicio && valor <= e.FaixaFim)
            ?? tabela.Entradas[^1];

        return new ResultadoRolagem(tabela.Titulo, tabela.Dado, valor, entrada);
    }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `dotnet test tests/PainelDed.Api.Testes --filter ServicoRolagemTestes`
Expected: `Passed! - Failed: 0, Passed: 4`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: serviço de rolagem"
```

---

### Task 10: Endpoints da API e teste de integração

**Files:**
- Modify: `src/PainelDed.Api/Program.cs`
- Test: `tests/PainelDed.Api.Testes/EndpointsTestes.cs`

- [ ] **Step 1: Escrever `Program.cs`**

`src/PainelDed.Api/Program.cs`:
```csharp
using PainelDed.Api.Conteudo;
using PainelDed.Api.Rolagem;
using PainelDed.Nucleo.Rolagem;

var builder = WebApplication.CreateBuilder(args);

var pastaConteudo = Path.GetFullPath(
    Path.Combine(builder.Environment.ContentRootPath, "..", "..", "content"));

builder.Services.AddSingleton(RepositorioConteudo.CarregarDePasta(pastaConteudo));
builder.Services.AddSingleton<IDado>(new Dado());
builder.Services.AddSingleton<ServicoRolagem>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/conteudo/{secao}", (string secao, RepositorioConteudo repositorio) =>
{
    var secaoConteudo = repositorio.ObterSecao(secao);
    return secaoConteudo is null ? Results.NotFound() : Results.Ok(secaoConteudo);
});

app.MapGet("/api/conteudo/{secao}/{*idNota}", (string secao, string idNota, RepositorioConteudo repositorio) =>
{
    var nota = repositorio.ObterNota(secao, idNota);
    return nota is null ? Results.NotFound() : Results.Ok(nota);
});

app.MapPost("/api/rolar/{secao}/{*idNota}", (string secao, string idNota, string tabela, ServicoRolagem servico) =>
{
    var resultado = servico.Rolar(secao, idNota, tabela);
    return resultado is null ? Results.NotFound() : Results.Ok(resultado);
});

app.Run();

public partial class Program { }
```

- [ ] **Step 2: Escrever o teste de integração que falha**

`tests/PainelDed.Api.Testes/EndpointsTestes.cs`:
```csharp
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using PainelDed.Nucleo.Modelos;
using Xunit;

namespace PainelDed.Api.Testes;

public class EndpointsTestes : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _fabrica;

    public EndpointsTestes(WebApplicationFactory<Program> fabrica)
    {
        _fabrica = fabrica;
    }

    [Fact]
    public async Task ObterSecao_Mundo_RetornaOkComNotas()
    {
        var cliente = _fabrica.CreateClient();

        var resposta = await cliente.GetAsync("/api/conteudo/mundo");

        resposta.EnsureSuccessStatusCode();
        var secao = await resposta.Content.ReadFromJsonAsync<SecaoConteudo>();
        Assert.NotNull(secao);
        Assert.NotEmpty(secao!.Notas);
    }

    [Fact]
    public async Task ObterSecao_Inexistente_Retorna404()
    {
        var cliente = _fabrica.CreateClient();

        var resposta = await cliente.GetAsync("/api/conteudo/naoexiste");

        Assert.Equal(HttpStatusCode.NotFound, resposta.StatusCode);
    }

    [Fact]
    public async Task RolarTabela_Existente_RetornaResultadoValido()
    {
        var cliente = _fabrica.CreateClient();
        var secao = await (await cliente.GetAsync("/api/conteudo/mundo")).Content.ReadFromJsonAsync<SecaoConteudo>();
        var notaComTabela = secao!.Notas.First(n => n.Tabelas.Count > 0);
        var tabela = notaComTabela.Tabelas[0];

        var resposta = await cliente.PostAsync(
            $"/api/rolar/mundo/{notaComTabela.Id}?tabela={Uri.EscapeDataString(tabela.Titulo)}", null);

        resposta.EnsureSuccessStatusCode();
        var resultado = await resposta.Content.ReadFromJsonAsync<ResultadoRolagem>();
        Assert.NotNull(resultado);
        Assert.InRange(resultado!.ValorRolado, 1, 100);
    }
}
```

> **Nota:** este teste depende dos arquivos gerados em `content/` pela Task 7. Se ainda não existirem no ambiente de teste, rode a Task 7 primeiro.

- [ ] **Step 3: Rodar e confirmar sucesso** (não deve falhar, já que `Program.cs` e o conteúdo já existem das tasks anteriores — se falhar, revise o caminho relativo de `pastaConteudo` em `Program.cs`)

Run: `dotnet test tests/PainelDed.Api.Testes`
Expected: `Passed! - Failed: 0, Passed: 8` (5 do RepositorioConteudo + 3 destes novos, assumindo Task 9 rodada antes — ajuste a contagem esperada somando os testes das tasks 8, 9 e 10)

- [ ] **Step 4: Rodar a API manualmente pra conferir que sobe sem erro**

Run: `dotnet run --project src/PainelDed.Api`
Expected: console mostra `Now listening on: http://localhost:5xxx` sem exceções.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: endpoints da API + testes de integração"
```

---

### Task 11: Frontend — esqueleto e navegação

**Files:**
- Create: `src/PainelDed.Api/wwwroot/index.html`
- Create: `src/PainelDed.Api/wwwroot/css/estilo.css`
- Create: `src/PainelDed.Api/wwwroot/js/tema.js`
- Create: `src/PainelDed.Api/wwwroot/js/api.js`
- Create: `src/PainelDed.Api/wwwroot/js/app.js`

- [ ] **Step 1: Criar `index.html`**

`src/PainelDed.Api/wwwroot/index.html`:
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Painel D&D — Costa da Travessia</title>
  <link rel="stylesheet" href="css/estilo.css" />
</head>
<body>
  <div class="layout">
    <nav class="barra-lateral">
      <div class="cabecalho-barra-lateral">
        <h1>Costa da Travessia</h1>
        <button id="botao-tema" class="botao-tema" title="Alternar modo claro/escuro">🌙</button>
      </div>
      <div id="arvore-navegacao"></div>
      <h2>Últimas Rolagens</h2>
      <ul id="historico-rolagens"></ul>
    </nav>
    <main id="conteudo-principal" class="conteudo-principal">
      <p>Selecione uma nota na barra lateral.</p>
    </main>
  </div>
  <script src="js/tema.js"></script>
  <script src="js/api.js"></script>
  <script src="js/rolador.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar `css/estilo.css`**

`src/PainelDed.Api/wwwroot/css/estilo.css`:
```css
:root {
  color-scheme: light;
  --cor-fundo: #f5f5f2;
  --cor-texto: #1b1b1f;
  --cor-destaque: #b5651d;
  --cor-painel: #ffffff;
  --cor-borda: #dcdcd6;
  --cor-resultado-fundo: #ececea;
  --cor-historico-texto: #55555c;
}

html[data-tema="escuro"] {
  color-scheme: dark;
  --cor-fundo: #1b1b1f;
  --cor-texto: #f0f0f0;
  --cor-destaque: #e0a458;
  --cor-painel: #26262c;
  --cor-borda: #3a3a42;
  --cor-resultado-fundo: #33333c;
  --cor-historico-texto: #b8b8c0;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: var(--cor-fundo);
  color: var(--cor-texto);
  font-size: 18px;
}

.layout {
  display: flex;
  height: 100vh;
}

.barra-lateral {
  width: 320px;
  background: var(--cor-painel);
  padding: 1rem;
  overflow-y: auto;
  border-right: 1px solid var(--cor-borda);
}

.cabecalho-barra-lateral {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.barra-lateral h1 {
  font-size: 1.2rem;
  margin: 0;
}

.botao-tema {
  background: transparent;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  font-size: 1.1rem;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  color: var(--cor-texto);
}

.botao-tema:hover {
  border-color: var(--cor-destaque);
}

.grupo-secao h3 {
  text-transform: uppercase;
  font-size: 0.85rem;
  color: var(--cor-destaque);
  margin: 1rem 0 0.3rem;
}

.grupo-secao ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.grupo-secao li a {
  color: var(--cor-texto);
  text-decoration: none;
  display: block;
  padding: 0.25rem 0;
}

.grupo-secao li a:hover {
  color: var(--cor-destaque);
}

.conteudo-principal {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.bloco-tabela {
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  background: var(--cor-painel);
  border-radius: 8px;
  border: 1px solid var(--cor-borda);
}

.bloco-tabela h3 {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.botao-rolar {
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  background: var(--cor-destaque);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.botao-rolar:hover {
  filter: brightness(1.1);
}

.resultado-rolagem {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--cor-resultado-fundo);
  border-radius: 6px;
  font-size: 1.3rem;
}

.valor-rolado {
  font-weight: bold;
  color: var(--cor-destaque);
  margin-right: 1rem;
  font-size: 1.6rem;
}

#historico-rolagens {
  list-style: none;
  padding-left: 0;
  font-size: 0.9rem;
  color: var(--cor-historico-texto);
}
```

- [ ] **Step 3: Criar `js/tema.js` (alternância claro/escuro com persistência)**

`src/PainelDed.Api/wwwroot/js/tema.js`:
```javascript
const Tema = {
  chaveArmazenamento: 'painel-ded-tema',

  inicializar() {
    const temaSalvo = this.obterTemaSalvo();
    const temaInicial = temaSalvo ?? (this.prefereTemaEscuro() ? 'escuro' : 'claro');
    this.aplicar(temaInicial);

    const botao = document.getElementById('botao-tema');
    botao.addEventListener('click', () => this.alternar());
  },

  obterTemaSalvo() {
    try {
      return localStorage.getItem(this.chaveArmazenamento);
    } catch {
      return null;
    }
  },

  prefereTemaEscuro() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  aplicar(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    const botao = document.getElementById('botao-tema');
    if (botao) {
      botao.textContent = tema === 'escuro' ? '☀️' : '🌙';
    }
    try {
      localStorage.setItem(this.chaveArmazenamento, tema);
    } catch {
      // localStorage indisponível (ex: navegação privada) — segue sem persistir
    }
  },

  alternar() {
    const atual = document.documentElement.getAttribute('data-tema');
    this.aplicar(atual === 'escuro' ? 'claro' : 'escuro');
  },
};

document.addEventListener('DOMContentLoaded', () => Tema.inicializar());
```

- [ ] **Step 4: Criar `js/api.js`**

`src/PainelDed.Api/wwwroot/js/api.js`:
```javascript
const Api = {
  async obterSecao(nomeSecao) {
    const resposta = await fetch(`/api/conteudo/${nomeSecao}`);
    if (!resposta.ok) throw new Error(`Falha ao carregar seção ${nomeSecao}`);
    return resposta.json();
  },

  async obterNota(nomeSecao, idNota) {
    const resposta = await fetch(`/api/conteudo/${nomeSecao}/${idNota}`);
    if (!resposta.ok) throw new Error(`Falha ao carregar nota ${idNota}`);
    return resposta.json();
  },

  async rolarTabela(nomeSecao, idNota, tituloTabela) {
    const url = `/api/rolar/${nomeSecao}/${idNota}?tabela=${encodeURIComponent(tituloTabela)}`;
    const resposta = await fetch(url, { method: 'POST' });
    if (!resposta.ok) throw new Error('Falha ao rolar tabela');
    return resposta.json();
  },
};
```

- [ ] **Step 5: Criar `js/app.js`**

`src/PainelDed.Api/wwwroot/js/app.js`:
```javascript
async function carregarArvoreNavegacao() {
  const secoes = ['mundo', 'glossario', 'regras', 'monstros'];
  const container = document.getElementById('arvore-navegacao');
  container.innerHTML = '';

  for (const nomeSecao of secoes) {
    const secao = await Api.obterSecao(nomeSecao);
    const grupo = document.createElement('div');
    grupo.className = 'grupo-secao';
    grupo.innerHTML = `<h3>${nomeSecao}</h3>`;

    const lista = document.createElement('ul');
    secao.notas.forEach((nota) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.textContent = nota.titulo;
      link.href = '#';
      link.addEventListener('click', (evento) => {
        evento.preventDefault();
        exibirNota(nomeSecao, nota.id);
      });
      item.appendChild(link);
      lista.appendChild(item);
    });

    grupo.appendChild(lista);
    container.appendChild(grupo);
  }
}

async function exibirNota(nomeSecao, idNota) {
  const nota = await Api.obterNota(nomeSecao, idNota);
  const principal = document.getElementById('conteudo-principal');
  principal.innerHTML = `<h2>${nota.titulo}</h2>`;

  if (nota.tabelas.length === 0) {
    principal.innerHTML += '<p>Esta nota não tem tabelas roláveis.</p>';
    return;
  }

  nota.tabelas.forEach((tabela) => {
    const bloco = document.createElement('section');
    bloco.className = 'bloco-tabela';
    bloco.innerHTML = `
      <h3>${tabela.titulo} <small>(${tabela.dado})</small>
        <button class="botao-rolar">🎲 Rolar</button>
      </h3>
      <div class="resultado-rolagem-container"></div>
    `;

    const botao = bloco.querySelector('.botao-rolar');
    const resultadoContainer = bloco.querySelector('.resultado-rolagem-container');
    botao.addEventListener('click', () => {
      Rolador.rolar(nomeSecao, idNota, tabela.titulo, resultadoContainer);
    });

    principal.appendChild(bloco);
  });
}

document.addEventListener('DOMContentLoaded', carregarArvoreNavegacao);
```

- [ ] **Step 6: Testar manualmente a alternância de tema**

Run: `dotnet run --project src/PainelDed.Api`, abrir a URL no navegador.
Expected:
1. O painel abre respeitando o tema do sistema operacional (claro ou escuro).
2. Clicar no botão 🌙/☀️ no topo da barra lateral alterna entre os dois temas instantaneamente.
3. Recarregar a página (F5) mantém o tema escolhido (persistido via `localStorage`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: esqueleto do frontend + navegação + alternância de tema"
```

---

### Task 12: Frontend — rolador e resolução inline de links

**Files:**
- Create: `src/PainelDed.Api/wwwroot/js/rolador.js`

- [ ] **Step 1: Criar `js/rolador.js`**

`src/PainelDed.Api/wwwroot/js/rolador.js`:
```javascript
const Rolador = {
  historico: [],

  async rolar(nomeSecao, idNota, tituloTabela, elementoResultado) {
    const resultado = await Api.rolarTabela(nomeSecao, idNota, tituloTabela);
    this.exibirResultado(nomeSecao, resultado, elementoResultado);
    this.registrarHistorico(tituloTabela, resultado.valorRolado);
  },

  exibirResultado(nomeSecao, resultado, elementoResultado) {
    elementoResultado.innerHTML = `
      <div class="resultado-rolagem">
        <span class="valor-rolado">${resultado.valorRolado}</span>
        <span class="texto-resultado">${resultado.entrada.texto}</span>
        <div class="links-resolvidos"></div>
      </div>
    `;

    const containerLinks = elementoResultado.querySelector('.links-resolvidos');
    resultado.entrada.links.forEach((link) => {
      this.expandirLink(nomeSecao, link, containerLinks);
    });
  },

  async expandirLink(nomeSecaoOrigem, link, container) {
    const secoesParaTentar = ['mundo', 'glossario', 'regras', 'monstros'];
    for (const secao of secoesParaTentar) {
      try {
        const nota = await Api.obterNota(secao, link.alvo);
        const bloco = document.createElement('div');
        bloco.className = 'link-expandido';
        bloco.innerHTML = `<strong>${nota.titulo}</strong><p>${resumo(nota.corpoMarkdown)}</p>`;
        container.appendChild(bloco);
        return;
      } catch {
        continue;
      }
    }
  },

  registrarHistorico(tituloTabela, valor) {
    this.historico.unshift(`${tituloTabela}: ${valor}`);
    this.historico = this.historico.slice(0, 10);
    const lista = document.getElementById('historico-rolagens');
    lista.innerHTML = this.historico.map((item) => `<li>${item}</li>`).join('');
  },
};

function resumo(markdown) {
  const linhas = markdown.split('\n').filter((linha) => linha.trim() && !linha.startsWith('#'));
  return (linhas[0] || '').slice(0, 200);
}
```

- [ ] **Step 2: Rodar a API e testar manualmente no navegador**

Run: `dotnet run --project src/PainelDed.Api`
Abrir `http://localhost:5xxx` (porta mostrada no console) no navegador. Passos manuais:
1. Clicar em uma nota da seção "mundo" que tenha tabelas (ex: `01-Hexcrawl`).
2. Clicar em "🎲 Rolar" numa tabela.
3. Confirmar que aparece um número, o texto do resultado, e — se a entrada tiver link — um bloco expandido com o título e resumo da nota linkada.
4. Confirmar que o histórico na lateral atualiza.

Expected: fluxo completo funciona sem erros no console do navegador (F12).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: rolador com resolução inline de links"
```

---

### Task 13: README e verificação final

**Files:**
- Create: `README.md`

- [ ] **Step 1: Escrever o README**

`README.md`:
```markdown
# Painel D&D — Costa da Travessia

Painel local de apoio para mestrar a campanha "Costa da Travessia" (D&D 5e), com navegação e rolagem do conteúdo do mundo.

## Requisitos

- .NET SDK 8.0+

## Como gerar/atualizar o conteúdo (rodar sempre que as notas do vault mudarem)

```bash
dotnet run --project src/PainelDed.Ingestor -- "<caminho-do-vault>" "content"
```

## Como rodar o painel

```bash
dotnet run --project src/PainelDed.Api
```

Abra a URL mostrada no console (ex: `http://localhost:5000`).

## Como rodar os testes

```bash
dotnet test
```

## Estrutura

- `src/PainelDed.Nucleo` — modelos e parsers de Markdown (compartilhado).
- `src/PainelDed.Ingestor` — CLI que converte o vault em `content/*.json`.
- `src/PainelDed.Api` — API + frontend estático (`wwwroot/`).
- `content/` — conteúdo do mundo já convertido (versionado).
- `docs/superpowers/specs` e `docs/superpowers/plans` — histórico de design e planos.
```

- [ ] **Step 2: Rodar a suíte completa de testes uma última vez**

Run: `dotnet test`
Expected: todos os testes passam (`Failed: 0`), soma de todas as tasks anteriores.

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "docs: README com instruções de uso"
```

---

## Verificação de Cobertura do Spec

- Ingestão das 63+ notas → Tasks 6, 7.
- Navegação em árvore → Task 11.
- Roladores inline com link resolvido → Tasks 9, 10, 12.
- Modo claro/escuro com persistência → Task 11.
- Stack C# + JS local → Tasks 1–13 (ASP.NET Minimal API + JS puro).
- Fora do escopo (livros brutos, quests, personagens) → não tocado neste plano, conforme spec.
