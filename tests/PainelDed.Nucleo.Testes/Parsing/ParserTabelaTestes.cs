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

    // Trecho real baseado em 05-Ruinas.md do vault, reproduzindo duas variações que o
    // parser precisa tolerar: (1) colunas com espaçamento/alinhamento irregular nas
    // barras verticais e (2) um cabeçalho de tabela com texto extra depois do dado
    // (ex: "1d20 (apenas se rolar 20)").
    private const string MarkdownRealDoVault = """
        # Ruínas

        ## Tipo — 1d20

        | Roll  | Tipo                                                                                                  |
        | ----- | ----------------------------------------------------------------------------------------------------- |
        | 1     | Pequena construção em destroços                                                                       |
        | 2–3   | Grande construção em destroços                                                                        |
        | 13    | [[../glossario/estruturas/cemiterio\|Cemitério]] ou [[../glossario/estruturas/catacumba\|catacumbas]] |
        | 20    | **Role 1d20 na tabela de Construções Específicas**                                                    |

        ### Construções Específicas — 1d20 (apenas se rolar 20)

        | Roll | Construção |
        |------|------------|
        | 1–8 | [[../glossario/estruturas/labirinto\|Labirinto]] |
        | 9–10 | Refúgio ou abrigo |
        """;

    [Fact]
    public void ExtrairTabelas_ComCabecalhoDeTextoExtraAposDado_AindaReconheceATabela()
    {
        var tabelas = ParserTabela.ExtrairTabelas(MarkdownRealDoVault);

        Assert.Equal(2, tabelas.Count);
        Assert.Equal("Construções Específicas", tabelas[1].Titulo);
        Assert.Equal("1d20", tabelas[1].Dado);
        Assert.Equal(2, tabelas[1].Entradas.Count);
    }

    [Fact]
    public void ExtrairTabelas_ComColunasDeLarguraIrregular_ParseiaCorretamente()
    {
        var tabelas = ParserTabela.ExtrairTabelas(MarkdownRealDoVault);
        var entradaComDoisLinks = tabelas[0].Entradas[2];

        Assert.Equal(13, entradaComDoisLinks.FaixaInicio);
        Assert.Equal(13, entradaComDoisLinks.FaixaFim);
        Assert.Equal("Cemitério ou catacumbas", entradaComDoisLinks.Texto);
        Assert.Equal(2, entradaComDoisLinks.Links.Count);
        Assert.Equal("glossario/estruturas/cemiterio", entradaComDoisLinks.Links[0].Alvo);
        Assert.Equal("glossario/estruturas/catacumba", entradaComDoisLinks.Links[1].Alvo);
    }

    // Trecho real de 03-Assentamento.md: "Especificações I — Povo" tem 3 colunas
    // (Roll | Humanos | Povo Lagarto). Antes do fix, o parser juntava as colunas
    // extras com "|", produzindo texto ilegível tipo "Coletores de especiarias
    // raras. | —" quando a segunda coluna estava vazia/irrelevante.
    private const string MarkdownComTabelaDeTresColunas = """
        # Assentamento

        ## Especificações I — Povo — 1d6

        | Roll | Humanos | Povo Lagarto |
        |------|---------|--------------|
        | 1 | A maioria é composta por guerreiros tribais. | Líder xamã que prega a harmonia natural. |
        | 6 | Coletores de especiarias raras. | — |
        """;

    [Fact]
    public void ExtrairTabelas_ComMaisDeDuasColunas_UsaSoAPrimeiraColunaDeResultado()
    {
        var tabelas = ParserTabela.ExtrairTabelas(MarkdownComTabelaDeTresColunas);
        var entradas = tabelas[0].Entradas;

        Assert.Equal("A maioria é composta por guerreiros tribais.", entradas[0].Texto);
        Assert.Equal("Coletores de especiarias raras.", entradas[1].Texto);
        Assert.DoesNotContain("|", entradas[1].Texto);
        Assert.DoesNotContain("Povo Lagarto", entradas[1].Texto);
    }
}
