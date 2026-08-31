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

    [Fact]
    public async Task ImportarPersonagem_DepoisListarEObter_RetornaFichaCompleta()
    {
        var cliente = _fabrica.CreateClient();
        var campanhaId = await CriarCampanhaDeTesteAsync(cliente);

        var requisicao = new ImportarPersonagemRequisicao(
            "Kess Bramo",
            "Humano",
            "Ladino",
            1,
            new AtributosPersonagem(9, 16, 16, 14, 9, 13),
            11,
            13,
            new List<PericiaPersonagem> { new("Furtividade", "destreza", true, 5) });

        var importarResposta = await cliente.PostAsJsonAsync($"/api/campanhas/{campanhaId}/personagens/importar", requisicao);
        importarResposta.EnsureSuccessStatusCode();
        var personagem = await importarResposta.Content.ReadFromJsonAsync<Personagem>();
        Assert.Equal("Kess Bramo", personagem!.Nome);

        var listaResposta = await cliente.GetAsync($"/api/campanhas/{campanhaId}/personagens");
        var lista = await listaResposta.Content.ReadFromJsonAsync<List<Personagem>>();
        Assert.Single(lista!);

        var obterResposta = await cliente.GetAsync($"/api/campanhas/{campanhaId}/personagens/{personagem.Id}");
        obterResposta.EnsureSuccessStatusCode();
        var obtido = await obterResposta.Content.ReadFromJsonAsync<Personagem>();
        Assert.Equal(13, obtido!.Ca);
    }

    [Fact]
    public async Task ImportarPersonagemComArmas_DepoisObter_RetornaArmas()
    {
        var cliente = _fabrica.CreateClient();
        var campanhaId = await CriarCampanhaDeTesteAsync(cliente);

        var requisicao = new ImportarPersonagemRequisicao(
            "Vex, o Trovador",
            "Humano",
            "Guerreiro",
            1,
            new AtributosPersonagem(16, 12, 14, 8, 10, 8),
            12,
            16,
            new List<PericiaPersonagem>(),
            Armas: new List<ArmaPersonagem>
            {
                new("Espada Longa", "1d8", "corte", 5, 3),
            });

        var importarResposta = await cliente.PostAsJsonAsync($"/api/campanhas/{campanhaId}/personagens/importar", requisicao);
        importarResposta.EnsureSuccessStatusCode();
        var personagem = await importarResposta.Content.ReadFromJsonAsync<Personagem>();

        var obterResposta = await cliente.GetAsync($"/api/campanhas/{campanhaId}/personagens/{personagem!.Id}");
        obterResposta.EnsureSuccessStatusCode();
        var obtido = await obterResposta.Content.ReadFromJsonAsync<Personagem>();

        Assert.Single(obtido!.Armas!);
        Assert.Equal("Espada Longa", obtido.Armas[0].Nome);
        Assert.Equal(5, obtido.Armas[0].BonusAcerto);
    }

    [Fact]
    public async Task ListarDesafiosGuilda_RetornaCatalogoCompletoComDificuldade()
    {
        var cliente = _fabrica.CreateClient();

        var resposta = await cliente.GetAsync("/api/desafios-guilda");
        resposta.EnsureSuccessStatusCode();
        var desafios = await resposta.Content.ReadFromJsonAsync<List<DesafioGuilda>>();

        Assert.NotEmpty(desafios!);
        Assert.Contains(desafios!, d => d.Titulo == "Cabeça do Rei Goblin" && d.Dificuldade == "dificil");
        Assert.All(desafios!, d => Assert.False(string.IsNullOrWhiteSpace(d.Dificuldade)));
    }

    [Fact]
    public async Task ImportarPersonagem_SemNome_Retorna400()
    {
        var cliente = _fabrica.CreateClient();
        var campanhaId = await CriarCampanhaDeTesteAsync(cliente);

        var requisicao = new ImportarPersonagemRequisicao(
            "",
            "Humano",
            "Ladino",
            1,
            new AtributosPersonagem(8, 8, 8, 8, 8, 8),
            8,
            10,
            new List<PericiaPersonagem>());

        var resposta = await cliente.PostAsJsonAsync($"/api/campanhas/{campanhaId}/personagens/importar", requisicao);

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
    }

    [Fact]
    public async Task Personagens_ComCampanhaInexistente_Retorna404()
    {
        var cliente = _fabrica.CreateClient();

        var resposta = await cliente.GetAsync("/api/campanhas/nao-existe/personagens");

        Assert.Equal(HttpStatusCode.NotFound, resposta.StatusCode);
    }
}
