using Microsoft.AspNetCore.Mvc;
using PainelDed.Api.Campanhas;
using PainelDed.Api.Conteudo;
using PainelDed.Api.Rolagem;
using PainelDed.Nucleo.Rolagem;

var builder = WebApplication.CreateBuilder(args);

var pastaConteudo = LocalizadorConteudo.Localizar(builder.Environment.ContentRootPath);

builder.Services.AddSingleton(RepositorioConteudo.CarregarDePasta(pastaConteudo));
builder.Services.AddSingleton<IDado>(new Dado());
builder.Services.AddSingleton<ServicoRolagem>();

var pastaCampanhas = LocalizadorPastaDados.Localizar(builder.Environment.ContentRootPath);
builder.Services.AddSingleton(new RepositorioCampanhas(pastaCampanhas));
builder.Services.AddSingleton<ServicoQuests>();
builder.Services.AddSingleton<ServicoHistorico>();
builder.Services.AddSingleton<ServicoGeradorIdeiaQuest>();

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

app.MapPost("/api/rolar/{secao}/{*idNota}", (string secao, string idNota, [FromQuery] string tabela, ServicoRolagem servico) =>
{
    var resultado = servico.Rolar(secao, idNota, tabela);
    return resultado is null ? Results.NotFound() : Results.Ok(resultado);
});

app.MapGet("/api/campanhas", (RepositorioCampanhas repositorio) =>
    Results.Ok(repositorio.Listar()));

app.MapPost("/api/campanhas", (NovaCampanhaRequisicao requisicao, RepositorioCampanhas repositorio) =>
{
    if (string.IsNullOrWhiteSpace(requisicao.Nome))
    {
        return Results.BadRequest("Nome da campanha é obrigatório.");
    }
    return Results.Ok(repositorio.Criar(requisicao.Nome.Trim()));
});

app.MapGet("/api/campanhas/{campanhaId}/quests", (string campanhaId, ServicoQuests servico) =>
{
    var quests = servico.Listar(campanhaId);
    return quests is null ? Results.NotFound() : Results.Ok(quests);
});

app.MapPost("/api/campanhas/{campanhaId}/quests", (string campanhaId, NovaQuestRequisicao requisicao, ServicoQuests servico) =>
{
    var quest = servico.Criar(campanhaId, requisicao);
    return quest is null ? Results.NotFound() : Results.Ok(quest);
});

app.MapPut("/api/campanhas/{campanhaId}/quests/{questId}", (string campanhaId, string questId, AtualizarQuestRequisicao requisicao, ServicoQuests servico) =>
{
    var quest = servico.Atualizar(campanhaId, questId, requisicao);
    return quest is null ? Results.NotFound() : Results.Ok(quest);
});

app.MapDelete("/api/campanhas/{campanhaId}/quests/{questId}", (string campanhaId, string questId, ServicoQuests servico) =>
    servico.Remover(campanhaId, questId) ? Results.NoContent() : Results.NotFound());

app.MapPost("/api/campanhas/{campanhaId}/quests/gerar-ideia", (string campanhaId, RepositorioCampanhas repositorioCampanhas, ServicoGeradorIdeiaQuest servico) =>
{
    if (repositorioCampanhas.Obter(campanhaId) is null)
    {
        return Results.NotFound();
    }
    var rascunho = servico.GerarRascunho();
    return rascunho is null ? Results.NotFound() : Results.Ok(rascunho);
});

app.MapGet("/api/campanhas/{campanhaId}/historico", (string campanhaId, ServicoHistorico servico) =>
{
    var historico = servico.Listar(campanhaId);
    return historico is null ? Results.NotFound() : Results.Ok(historico);
});

app.MapPost("/api/campanhas/{campanhaId}/historico", (string campanhaId, NovaEntradaHistoricoRequisicao requisicao, ServicoHistorico servico) =>
{
    var entrada = servico.Registrar(campanhaId, requisicao.Descricao);
    return entrada is null ? Results.NotFound() : Results.Ok(entrada);
});

app.MapDelete("/api/campanhas/{campanhaId}/historico", (string campanhaId, ServicoHistorico servico) =>
    servico.Limpar(campanhaId) ? Results.NoContent() : Results.NotFound());

app.Run();

public partial class Program { }
