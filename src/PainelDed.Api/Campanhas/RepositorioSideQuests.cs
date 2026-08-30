using System.Text.Json;

namespace PainelDed.Api.Campanhas;

public class RepositorioSideQuests
{
    private readonly List<SideQuestCatalogo> _itens;

    private RepositorioSideQuests(List<SideQuestCatalogo> itens)
    {
        _itens = itens;
    }

    public IReadOnlyList<SideQuestCatalogo> Todos => _itens;

    public static RepositorioSideQuests CarregarDeArquivo(string caminhoArquivo)
    {
        var opcoes = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var json = File.ReadAllText(caminhoArquivo);
        var itens = JsonSerializer.Deserialize<List<SideQuestCatalogo>>(json, opcoes)
            ?? throw new InvalidOperationException($"Falha ao carregar side quests de {caminhoArquivo}");

        return new RepositorioSideQuests(itens);
    }
}
