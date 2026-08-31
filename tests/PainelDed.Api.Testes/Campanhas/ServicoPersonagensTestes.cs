using System;
using System.Collections.Generic;
using System.IO;
using PainelDed.Api.Campanhas;
using PainelDed.Api.Testes.Rolagem;
using PainelDed.Nucleo.Rolagem;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ServicoPersonagensTestes : IDisposable
{
    private readonly string _pastaTemporaria;
    private readonly RepositorioCampanhas _repositorio;
    private readonly RepositorioSideQuests _repositorioSideQuests;
    private readonly IDado _dado;
    private readonly ServicoHistorico _servicoHistorico;
    private readonly ServicoPersonagens _servico;
    private readonly string _campanhaId;

    public ServicoPersonagensTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-servico-personagens-" + Guid.NewGuid());
        _repositorio = new RepositorioCampanhas(_pastaTemporaria);

        var arquivoSideQuests = Path.Combine(_pastaTemporaria, "side-quests.json");
        Directory.CreateDirectory(_pastaTemporaria);
        File.WriteAllText(arquivoSideQuests,
            "[{\"titulo\":\"Pescar um peixe\",\"descricao\":\"Pesque um peixe fresco.\"}," +
            "{\"titulo\":\"Enviar uma carta\",\"descricao\":\"Envie uma carta a alguem.\"}]");
        _repositorioSideQuests = RepositorioSideQuests.CarregarDeArquivo(arquivoSideQuests);

        _dado = new DadoFixo(1);
        _servicoHistorico = new ServicoHistorico(_repositorio);
        _servico = new ServicoPersonagens(_repositorio, _repositorioSideQuests, _dado, _servicoHistorico);
        _campanhaId = _repositorio.Criar("Campanha de Teste").Id;
    }

    public void Dispose()
    {
        Directory.Delete(_pastaTemporaria, recursive: true);
    }

    private static ImportarPersonagemRequisicao RequisicaoDeExemplo(string nome = "Kess Bramo") => new(
        nome,
        "Humano",
        "Ladino",
        1,
        new AtributosPersonagem(9, 16, 16, 14, 9, 13),
        11,
        13,
        new List<PericiaPersonagem>
        {
            new("Furtividade", "destreza", true, 5),
            new("Investigacao", "inteligencia", true, 4),
        },
        "Foge de uma dívida de jogo em outra cidade.",
        "Baixa, cabelo raspado dos lados.");

    [Fact]
    public void Importar_ComCampanhaExistente_CriaPersonagemNovo()
    {
        var personagem = _servico.Importar(_campanhaId, RequisicaoDeExemplo());

        Assert.NotNull(personagem);
        Assert.NotEmpty(personagem!.Id);
        Assert.Equal("Kess Bramo", personagem.Nome);
        Assert.Equal("Baixa, cabelo raspado dos lados.", personagem.CaracteristicasFisicas);
        Assert.Single(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Importar_ComCampanhaInexistente_RetornaNulo()
    {
        var personagem = _servico.Importar("nao-existe", RequisicaoDeExemplo());

        Assert.Null(personagem);
    }

    [Fact]
    public void Importar_ComMesmoNomeDeExistente_SubstituiMantendoOMesmoId()
    {
        var original = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        var atualizado = _servico.Importar(_campanhaId, RequisicaoDeExemplo() with { Pv = 12 });

        Assert.NotNull(atualizado);
        Assert.Equal(original.Id, atualizado!.Id);
        Assert.Equal(12, atualizado.Pv);
        Assert.Single(_servico.Listar(_campanhaId)!);
    }

    [Fact]
    public void Importar_ComNomeDiferente_AdicionaSegundoPersonagem()
    {
        _servico.Importar(_campanhaId, RequisicaoDeExemplo("Kess Bramo"));
        _servico.Importar(_campanhaId, RequisicaoDeExemplo("Bran Ferronaz"));

        Assert.Equal(2, _servico.Listar(_campanhaId)!.Count);
    }

    [Fact]
    public void Obter_ComPersonagemExistente_RetornaFichaCompleta()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        var obtido = _servico.Obter(_campanhaId, criado.Id);

        Assert.NotNull(obtido);
        Assert.Equal("Kess Bramo", obtido!.Nome);
        Assert.Equal(2, obtido.Pericias.Count);
    }

    [Fact]
    public void Obter_ComPersonagemInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Obter(_campanhaId, "nao-existe"));
    }

    [Fact]
    public void Listar_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.Listar("nao-existe"));
    }

    [Fact]
    public void Listar_ComCampanhaSemArquivoDeEstadoPersonagens_RetornaListaVazia()
    {
        // Simula um data/campanhas/{id}.json antigo, salvo antes desta feature existir,
        // sem a propriedade "Personagens" — precisa continuar carregando sem quebrar.
        var caminhoEstado = Path.Combine(_pastaTemporaria, $"{_campanhaId}.json");
        File.WriteAllText(caminhoEstado, "{\"Quests\":[],\"HistoricoRolagens\":[]}");

        var lista = _servico.Listar(_campanhaId);

        Assert.NotNull(lista);
        Assert.Empty(lista!);
    }

    [Fact]
    public void Importar_ComCamposDeCombate_PersisteTodosOsValores()
    {
        var requisicao = RequisicaoDeExemplo() with
        {
            Iniciativa = 3,
            BonusAtaqueForca = -1,
            BonusAtaqueDestreza = 5,
            CdMagia = 13,
            BonusAtaqueMagico = 5,
            TestesResistencia = new List<TesteResistencia> { new("destreza", true, 5), new("inteligencia", true, 2) }
        };

        var personagem = _servico.Importar(_campanhaId, requisicao);

        Assert.NotNull(personagem);
        Assert.Equal(3, personagem!.Iniciativa);
        Assert.Equal(13, personagem.CdMagia);
        Assert.Equal(2, personagem.TestesResistencia!.Count);
    }

    [Fact]
    public void Importar_ComTracosRaciais_PersisteOsTracos()
    {
        var requisicao = RequisicaoDeExemplo() with
        {
            TracosRaciais = new List<TracoPersonagem>
            {
                new("Versátil", "Fala, lê e escreve Comum e mais um idioma à escolha.")
            }
        };

        var personagem = _servico.Importar(_campanhaId, requisicao);

        Assert.NotNull(personagem);
        Assert.Single(personagem!.TracosRaciais!);
        Assert.Equal("Versátil", personagem.TracosRaciais![0].Nome);
    }

    [Fact]
    public void Importar_ComHabilidadesClasse_PersisteAsHabilidades()
    {
        var requisicao = RequisicaoDeExemplo() with
        {
            HabilidadesClasse = new List<HabilidadeClasse>
            {
                new("Especialização", 1, "Dobra o bônus de proficiência em duas perícias."),
                new("Ataque Furtivo", 1, "1d6 de dano extra com vantagem."),
            }
        };

        var personagem = _servico.Importar(_campanhaId, requisicao);

        Assert.NotNull(personagem);
        Assert.Equal(2, personagem!.HabilidadesClasse!.Count);
        Assert.Equal("Especialização", personagem.HabilidadesClasse![0].Nome);
    }

    [Fact]
    public void Importar_ComMagiasConhecidas_PersisteAsMagias()
    {
        var requisicao = RequisicaoDeExemplo() with
        {
            MagiasConhecidas = new List<MagiaPersonagem>
            {
                new("Orientação", 0, "Adivinhação", "1 ação", "Toque", "Concentração, até 1 minuto", "V, S",
                    "Toca uma criatura disposta; ela pode somar 1d4 a um teste de habilidade."),
                new("Cura de Ferimentos", 1, "Evocação", "1 ação", "Toque", "Instantânea", "V, S",
                    "Uma criatura tocada recupera pontos de vida."),
            }
        };

        var personagem = _servico.Importar(_campanhaId, requisicao);

        Assert.NotNull(personagem);
        Assert.Equal(2, personagem!.MagiasConhecidas!.Count);
        Assert.Equal("Orientação", personagem.MagiasConhecidas![0].Nome);
    }

    [Fact]
    public void Importar_ComPersonagemExistenteQueTemSideQuestAtiva_PreservaASideQuest()
    {
        // Regressão: ImportarPersonagemRequisicao não tem campo de side quest (o creator
        // nunca produz isso, é gerenciado só pelo backend) — Importar precisa preservar
        // a side quest do personagem existente ao reconstruir a ficha, senão reimportar
        // (ex: depois de editar a ficha no creator) apaga silenciosamente a side quest ativa.
        var original = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        var estado = _repositorio.CarregarEstado(_campanhaId)!;
        var personagens = estado.Personagens!;
        var comSideQuest = original with
        {
            SideQuestAtual = new SideQuestPersonagem("Pescar um peixe", "Pesque um peixe fresco.", 10, "pendente")
        };
        personagens[personagens.IndexOf(personagens.Find(p => p.Id == original.Id)!)] = comSideQuest;
        _repositorio.SalvarEstado(_campanhaId, estado with { Personagens = personagens });

        var reimportado = _servico.Importar(_campanhaId, RequisicaoDeExemplo() with { Pv = 12 });

        Assert.NotNull(reimportado);
        Assert.NotNull(reimportado!.SideQuestAtual);
        Assert.Equal("Pescar um peixe", reimportado.SideQuestAtual!.Titulo);
        Assert.Equal("pendente", reimportado.SideQuestAtual.Status);
        Assert.Equal(12, reimportado.Pv);
    }

    [Fact]
    public void SortearSideQuest_ComPersonagemExistente_AtribuiItemDoCatalogoComStatusPendente()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        var atualizado = _servico.SortearSideQuest(_campanhaId, criado.Id);

        Assert.NotNull(atualizado);
        Assert.NotNull(atualizado!.SideQuestAtual);
        Assert.Equal("Pescar um peixe", atualizado.SideQuestAtual!.Titulo); // DadoFixo(1) -> índice 0
        Assert.Equal("Pesque um peixe fresco.", atualizado.SideQuestAtual.Descricao);
        Assert.Equal("pendente", atualizado.SideQuestAtual.Status);
        Assert.Equal(5, atualizado.SideQuestAtual.XpSugerido); // DadoFixo(1) -> 1d6=1 * 5
    }

    [Fact]
    public void SortearSideQuest_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.SortearSideQuest("nao-existe", "qualquer-id"));
    }

    [Fact]
    public void SortearSideQuest_ComPersonagemInexistente_RetornaNulo()
    {
        Assert.Null(_servico.SortearSideQuest(_campanhaId, "nao-existe"));
    }

    [Fact]
    public void AtualizarStatusSideQuest_ComSideQuestPendente_MudaSoOStatus()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;
        _servico.SortearSideQuest(_campanhaId, criado.Id);

        var atualizado = _servico.AtualizarStatusSideQuest(_campanhaId, criado.Id, "concluida");

        Assert.NotNull(atualizado);
        Assert.Equal("concluida", atualizado!.SideQuestAtual!.Status);
        Assert.Equal("Pescar um peixe", atualizado.SideQuestAtual.Titulo); // título/descrição/XP preservados
    }

    [Fact]
    public void AtualizarStatusSideQuest_SemSideQuestAtiva_RetornaNulo()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        Assert.Null(_servico.AtualizarStatusSideQuest(_campanhaId, criado.Id, "concluida"));
    }

    [Fact]
    public void AtualizarStatusSideQuest_ComPersonagemInexistente_RetornaNulo()
    {
        Assert.Null(_servico.AtualizarStatusSideQuest(_campanhaId, "nao-existe", "concluida"));
    }

    [Fact]
    public void AdicionarXp_ComPersonagemExistente_SomaAoXpEValida()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        var atualizado = _servico.AdicionarXp(_campanhaId, criado.Id, 100, "venceu um Rato");

        Assert.NotNull(atualizado);
        Assert.Equal(100, atualizado!.Xp);
    }

    [Fact]
    public void AdicionarXp_ChamadoDuasVezes_AcumulaOXp()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        _servico.AdicionarXp(_campanhaId, criado.Id, 100, "primeiro combate");
        var atualizado = _servico.AdicionarXp(_campanhaId, criado.Id, 50, "segundo combate");

        Assert.Equal(150, atualizado!.Xp);
    }

    [Fact]
    public void AdicionarXp_RegistraNoHistoricoDaCampanha()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;

        _servico.AdicionarXp(_campanhaId, criado.Id, 100, "venceu um Rato");

        var historico = _servicoHistorico.Listar(_campanhaId)!;
        Assert.Single(historico);
        Assert.Equal("Kess Bramo ganhou 100 XP (venceu um Rato)", historico[0].Descricao);
    }

    [Fact]
    public void AdicionarXp_ComCampanhaInexistente_RetornaNulo()
    {
        Assert.Null(_servico.AdicionarXp("nao-existe", "qualquer-id", 100, "motivo"));
    }

    [Fact]
    public void AdicionarXp_ComPersonagemInexistente_RetornaNulo()
    {
        Assert.Null(_servico.AdicionarXp(_campanhaId, "nao-existe", 100, "motivo"));
    }

    [Fact]
    public void AtualizarStatusSideQuest_ComStatusConcluida_SomaXpSugeridoAoPersonagem()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;
        _servico.SortearSideQuest(_campanhaId, criado.Id); // DadoFixo(1) -> XP sugerido = 5

        var atualizado = _servico.AtualizarStatusSideQuest(_campanhaId, criado.Id, "concluida");

        Assert.NotNull(atualizado);
        Assert.Equal(5, atualizado!.Xp);
        Assert.Equal("concluida", atualizado.SideQuestAtual!.Status);
    }

    [Fact]
    public void AtualizarStatusSideQuest_ComStatusDescartada_NaoSomaXp()
    {
        var criado = _servico.Importar(_campanhaId, RequisicaoDeExemplo())!;
        _servico.SortearSideQuest(_campanhaId, criado.Id);

        var atualizado = _servico.AtualizarStatusSideQuest(_campanhaId, criado.Id, "descartada");

        Assert.Equal(0, atualizado!.Xp);
    }
}
