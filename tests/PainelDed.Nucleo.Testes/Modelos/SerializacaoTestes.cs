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
