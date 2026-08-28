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
