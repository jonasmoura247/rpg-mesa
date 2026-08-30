using System;
using System.Collections.Generic;
using System.IO;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ServicoPersonagensTestes : IDisposable
{
    private readonly string _pastaTemporaria;
    private readonly RepositorioCampanhas _repositorio;
    private readonly ServicoPersonagens _servico;
    private readonly string _campanhaId;

    public ServicoPersonagensTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-servico-personagens-" + Guid.NewGuid());
        _repositorio = new RepositorioCampanhas(_pastaTemporaria);
        _servico = new ServicoPersonagens(_repositorio);
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
}
