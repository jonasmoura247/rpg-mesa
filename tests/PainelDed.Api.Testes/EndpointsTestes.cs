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
