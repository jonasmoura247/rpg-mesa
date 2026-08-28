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
