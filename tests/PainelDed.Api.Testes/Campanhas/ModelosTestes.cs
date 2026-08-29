using System;
using System.Collections.Generic;
using System.Text.Json;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ModelosTestes
{
    private static readonly JsonSerializerOptions Opcoes = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public void EstadoCampanha_SerializaEDesserializaMantendoOsDados()
    {
        var original = new EstadoCampanha(
            new List<Quest>
            {
                new("q1", "Matar o Rei Goblin", "Descrição.", "50 PO", 450, "disponivel", 1, null),
            },
            new List<EntradaHistorico>
            {
                new("Condições: 4", DateTimeOffset.Parse("2026-08-28T20:00:00Z")),
            });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<EstadoCampanha>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Single(restaurado!.Quests);
        Assert.Equal("Matar o Rei Goblin", restaurado.Quests[0].Titulo);
        Assert.Equal("disponivel", restaurado.Quests[0].Status);
        Assert.Single(restaurado.HistoricoRolagens);
        Assert.Equal("Condições: 4", restaurado.HistoricoRolagens[0].Descricao);
    }

    [Fact]
    public void Campanha_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Campanha("a1b2c3", "Grupo da Terça", DateTimeOffset.Parse("2026-08-28T20:00:00Z"));

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Campanha>(json, Opcoes);

        Assert.Equal(original, restaurado);
    }

    [Fact]
    public void Personagem_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Personagem(
            "p1",
            "Kess Bramo",
            "Humano",
            "Ladino",
            1,
            new AtributosPersonagem(9, 16, 16, 14, 9, 13),
            11,
            13,
            new List<PericiaPersonagem> { new("Furtividade", "destreza", true, 5) });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal("Kess Bramo", restaurado!.Nome);
        Assert.Equal(16, restaurado.Atributos.Destreza);
        Assert.Single(restaurado.Pericias);
    }

    [Fact]
    public void EstadoCampanha_SemPersonagens_DesserializaComListaNula()
    {
        // Regressão: arquivos de campanha salvos antes desta feature não têm a
        // propriedade "Personagens" — o ServicoPersonagens trata esse null como
        // lista vazia (ver ServicoPersonagensTestes), mas a desserialização em si
        // precisa continuar funcionando sem lançar exceção.
        var json = "{\"Quests\":[],\"HistoricoRolagens\":[]}";

        var restaurado = JsonSerializer.Deserialize<EstadoCampanha>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Null(restaurado!.Personagens);
    }

    [Fact]
    public void Personagem_ComCamposDeCombate_SerializaEDesserializaMantendoOsDados()
    {
        var original = new Personagem(
            "p1",
            "Sael Marévalis",
            "Humano",
            "Druida",
            1,
            new AtributosPersonagem(9, 14, 16, 11, 16, 11),
            11,
            12,
            new List<PericiaPersonagem> { new("Natureza", "inteligencia", true, 2) },
            "",
            "",
            2,
            1,
            2,
            13,
            5,
            new List<TesteResistencia> { new("inteligencia", true, 2), new("sabedoria", true, 5) });

        var json = JsonSerializer.Serialize(original, Opcoes);
        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Equal(13, restaurado!.CdMagia);
        Assert.Equal(5, restaurado.BonusAtaqueMagico);
        Assert.Equal(2, restaurado.Iniciativa);
        Assert.Equal(2, restaurado.TestesResistencia!.Count);
    }

    [Fact]
    public void Personagem_SemCamposDeCombate_DesserializaComPadroes()
    {
        // Regressão: fichas exportadas pelo /creator antes desta feature (incluindo as
        // 3 fixtures de exemplo já existentes em docs/creator/exemplos/) não têm
        // iniciativa/CD/resistências no JSON — precisa continuar carregando sem quebrar.
        var json = "{\"Id\":\"p1\",\"Nome\":\"Teste\",\"Raca\":\"Humano\",\"Classe\":\"Guerreiro\",\"Nivel\":1," +
            "\"Atributos\":{\"Forca\":10,\"Destreza\":10,\"Constituicao\":10,\"Inteligencia\":10,\"Sabedoria\":10,\"Carisma\":10}," +
            "\"Pv\":10,\"Ca\":10,\"Pericias\":[]}";

        var restaurado = JsonSerializer.Deserialize<Personagem>(json, Opcoes);

        Assert.NotNull(restaurado);
        Assert.Null(restaurado!.Iniciativa);
        Assert.Null(restaurado.CdMagia);
        Assert.Null(restaurado.TestesResistencia);
    }
}
