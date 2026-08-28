using System;
using System.IO;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class RepositorioCampanhasTestes : IDisposable
{
    private readonly string _pastaTemporaria;

    public RepositorioCampanhasTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-repo-campanhas-" + Guid.NewGuid());
    }

    public void Dispose()
    {
        if (Directory.Exists(_pastaTemporaria))
        {
            Directory.Delete(_pastaTemporaria, recursive: true);
        }
    }

    [Fact]
    public void Listar_SemCampanhas_RetornaListaVazia()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        Assert.Empty(repositorio.Listar());
    }

    [Fact]
    public void Criar_AdicionaNaListaEPersisteEstadoVazio()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        var campanha = repositorio.Criar("Grupo da Terça");

        Assert.Equal("Grupo da Terça", campanha.Nome);
        Assert.NotEmpty(campanha.Id);
        Assert.Single(repositorio.Listar());

        var estado = repositorio.CarregarEstado(campanha.Id);
        Assert.NotNull(estado);
        Assert.Empty(estado!.Quests);
        Assert.Empty(estado.HistoricoRolagens);
    }

    [Fact]
    public void Obter_ComIdExistente_RetornaCampanha()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);
        var criada = repositorio.Criar("Grupo A");

        var obtida = repositorio.Obter(criada.Id);

        Assert.NotNull(obtida);
        Assert.Equal("Grupo A", obtida!.Nome);
    }

    [Fact]
    public void Obter_ComIdInexistente_RetornaNulo()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        Assert.Null(repositorio.Obter("nao-existe"));
    }

    [Fact]
    public void CarregarEstado_ComCampanhaInexistente_RetornaNulo()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        Assert.Null(repositorio.CarregarEstado("nao-existe"));
    }

    [Fact]
    public void SalvarEstado_PersisteERecarregaComOsMesmosDados()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);
        var campanha = repositorio.Criar("Grupo B");

        var estado = new EstadoCampanha(
            new List<Quest> { new("q1", "Título", "Desc", "10 PO", 100, "disponivel", 1, null) },
            new List<EntradaHistorico> { new("Condições: 3", DateTimeOffset.UtcNow) });

        repositorio.SalvarEstado(campanha.Id, estado);
        var recarregado = repositorio.CarregarEstado(campanha.Id);

        Assert.NotNull(recarregado);
        Assert.Single(recarregado!.Quests);
        Assert.Equal("Título", recarregado.Quests[0].Titulo);
        Assert.Single(recarregado.HistoricoRolagens);
    }

    [Fact]
    public void Criar_ComDuasCampanhas_MantemAmbasNoIndice()
    {
        var repositorio = new RepositorioCampanhas(_pastaTemporaria);

        repositorio.Criar("Grupo A");
        repositorio.Criar("Grupo B");

        Assert.Equal(2, repositorio.Listar().Count);
    }
}
