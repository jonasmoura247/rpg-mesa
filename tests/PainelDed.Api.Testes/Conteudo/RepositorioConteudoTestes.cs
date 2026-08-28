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
