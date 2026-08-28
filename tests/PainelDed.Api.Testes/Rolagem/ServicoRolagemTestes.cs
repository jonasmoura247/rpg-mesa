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

    [Fact]
    public void Rolar_ComValorForaDeTodasAsFaixas_UsaUltimaEntradaComoSalvaguarda()
    {
        // Tabela com gap propositalmente mal configurado (faixas não cobrem 1d6 inteiro),
        // simulando conteúdo malformado no vault. O DadoFixo(6) rola um valor que não
        // bate em nenhuma faixa cadastrada (1-2 ou 3-4) — a salvaguarda deve devolver
        // a última entrada em vez de lançar exceção.
        var secaoComGap = new SecaoConteudo("mundo", new List<NotaConteudo>
        {
            new("mundo/tabela-com-gap", "Tabela com Gap", "conteudo", new List<TabelaRolagem>
            {
                new("Com Gap", "1d6", new List<EntradaTabela>
                {
                    new(1, 2, "Primeira.", new List<LinkReferencia>()),
                    new(3, 4, "Última cadastrada.", new List<LinkReferencia>()),
                }),
            }),
        });
        var repositorio = new RepositorioConteudo(new[] { secaoComGap });
        var servico = new ServicoRolagem(repositorio, new DadoFixo(6));

        var resultado = servico.Rolar("mundo", "mundo/tabela-com-gap", "Com Gap");

        Assert.NotNull(resultado);
        Assert.Equal(6, resultado!.ValorRolado);
        Assert.Equal("Última cadastrada.", resultado.Entrada.Texto);
    }
}
