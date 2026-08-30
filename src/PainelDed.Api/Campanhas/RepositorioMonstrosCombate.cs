using System.Text.Json;

namespace PainelDed.Api.Campanhas;

public class RepositorioMonstrosCombate
{
    private readonly List<MonstroCombate> _monstros;

    private RepositorioMonstrosCombate(List<MonstroCombate> monstros)
    {
        _monstros = monstros;
    }

    public IReadOnlyList<MonstroCombate> Todos => _monstros;

    public static RepositorioMonstrosCombate CarregarDePasta(string pasta)
    {
        var opcoes = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var monstros = new List<MonstroCombate>();

        foreach (var arquivo in Directory.GetFiles(pasta, "*.json"))
        {
            var json = File.ReadAllText(arquivo);
            var doArquivo = JsonSerializer.Deserialize<List<MonstroCombate>>(json, opcoes)
                ?? throw new InvalidOperationException($"Falha ao carregar monstros de {arquivo}");
            monstros.AddRange(doArquivo);
        }

        return new RepositorioMonstrosCombate(monstros);
    }
}
