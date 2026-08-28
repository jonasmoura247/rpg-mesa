using System;
using System.IO;
using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ServicoQuestsTestes : IDisposable
{
    private readonly string _pastaTemporaria;
    private readonly RepositorioCampanhas _repositorio;
    private readonly ServicoQuests _servico;
    private readonly string _campanhaId;

    public ServicoQuestsTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-servico-quests-" + Guid.NewGuid());
        _repositorio = new RepositorioCampanhas(_pastaTemporaria);
        _servico = new ServicoQuests(_repositorio);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
    }

    public void Dispose()
    {
        Directory.Delete(_pastaTemporaria, recursive: true);
    }

    private static NovaQuestRequisicao RequisicaoDeExemplo() =>
        new("Matar o Rei Goblin", "Ele está aterrorizando o lugarejo.", "50 PO", 450, 1, null);

    [Fact]
    public void Criar_ComCampanhaExistente_AdicionaQuestComStatusDisponivel()
    {
        var quest = _servico.Criar(_campanhaId, RequisicaoDeExemplo());

        Assert.NotNull(quest);
        Assert.Equal("disponivel", quest!.Status);
        Assert.NotEmpty(quest.Id);
        Assert.Single(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Criar_ComCampanhaInexistente_RetornaNulo()
    {
        var quest = _servico.Criar("nao-existe", RequisicaoDeExemplo());

        Assert.Null(quest);
    }

    [Fact]
    public void Atualizar_MudaCamposEStatus()
    {
        var criada = _servico.Criar(_campanhaId, RequisicaoDeExemplo())!;
        var requisicao = new AtualizarQuestRequisicao(
            "Matar o Rei Goblin", "Descrição atualizada.", "100 PO", 450, "andamento", 1, "Grupo do Kael");

        var atualizada = _servico.Atualizar(_campanhaId, criada.Id, requisicao);

        Assert.NotNull(atualizada);
        Assert.Equal("andamento", atualizada!.Status);
        Assert.Equal("100 PO", atualizada.Recompensa);
        Assert.Equal("Grupo do Kael", atualizada.Responsavel);
    }

    [Fact]
    public void Atualizar_ComQuestInexistente_RetornaNulo()
    {
        var requisicao = new AtualizarQuestRequisicao("T", "D", "R", 1, "disponivel", 1, null);

        var resultado = _servico.Atualizar(_campanhaId, "nao-existe", requisicao);

        Assert.Null(resultado);
    }

    [Fact]
    public void Remover_RemoveEPersiste()
    {
        var criada = _servico.Criar(_campanhaId, RequisicaoDeExemplo())!;

        var removida = _servico.Remover(_campanhaId, criada.Id);

        Assert.True(removida);
        Assert.Empty(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Remover_ComQuestInexistente_RetornaFalso()
    {
        Assert.False(_servico.Remover(_campanhaId, "nao-existe"));
    }

    [Fact]
    public void Listar_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Listar("nao-existe"));
    }
}
