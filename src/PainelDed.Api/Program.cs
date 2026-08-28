using Microsoft.AspNetCore.Mvc;
using PainelDed.Api.Conteudo;
using PainelDed.Api.Rolagem;
using PainelDed.Nucleo.Rolagem;

var builder = WebApplication.CreateBuilder(args);

var pastaConteudo = LocalizadorConteudo.Localizar(builder.Environment.ContentRootPath);

builder.Services.AddSingleton(RepositorioConteudo.CarregarDePasta(pastaConteudo));
builder.Services.AddSingleton<IDado>(new Dado());
builder.Services.AddSingleton<ServicoRolagem>();

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

app.Run();

public partial class Program { }
