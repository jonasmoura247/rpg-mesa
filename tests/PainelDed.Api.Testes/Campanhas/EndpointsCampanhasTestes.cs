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
