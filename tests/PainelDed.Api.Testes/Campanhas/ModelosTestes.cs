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
}
