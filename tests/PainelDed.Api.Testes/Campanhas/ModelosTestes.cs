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
}
