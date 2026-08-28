using System;
using System.IO;
using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ServicoHistoricoTestes : IDisposable
{
    private readonly string _pastaTemporaria;
    private readonly RepositorioCampanhas _repositorio;
    private readonly ServicoHistorico _servico;
    private readonly string _campanhaId;

    public ServicoHistoricoTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-servico-historico-" + Guid.NewGuid());
        _repositorio = new RepositorioCampanhas(_pastaTemporaria);
        _servico = new ServicoHistorico(_repositorio);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
    }

    public void Dispose()
    {
        Directory.Delete(_pastaTemporaria, recursive: true);
    }

    [Fact]
    public void Registrar_AdicionaNoTopoDaLista()
    {
        _servico.Registrar(_campanhaId, "Condições: 1");
        _servico.Registrar(_campanhaId, "Condições: 5");

        var historico = _servico.Listar(_campanhaId)!;

        Assert.Equal(2, historico.Count);
        Assert.Equal("Condições: 5", historico[0].Descricao);
        Assert.Equal("Condições: 1", historico[1].Descricao);
    }

    [Fact]
    public void Registrar_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Registrar("nao-existe", "Condições: 1"));
    }

    [Fact]
    public void Registrar_RespeitaLimiteDe200Entradas()
    {
        for (var i = 0; i < 200; i++)
        {
            _servico.Registrar(_campanhaId, $"Rolagem {i}");
        }

        _servico.Registrar(_campanhaId, "Rolagem mais recente");

        var historico = _servico.Listar(_campanhaId)!;

        Assert.Equal(200, historico.Count);
        Assert.Equal("Rolagem mais recente", historico[0].Descricao);
        Assert.DoesNotContain(historico, e => e.Descricao == "Rolagem 0");
    }

    [Fact]
    public void Limpar_EsvaziaLista()
    {
        _servico.Registrar(_campanhaId, "Condições: 1");

        var limpou = _servico.Limpar(_campanhaId);

        Assert.True(limpou);
        Assert.Empty(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Limpar_ComCampanhaInexistente_RetornaFalso()
    {
        Assert.False(_servico.Limpar("nao-existe"));
    }

    [Fact]
    public void Listar_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Listar("nao-existe"));
    }
}
