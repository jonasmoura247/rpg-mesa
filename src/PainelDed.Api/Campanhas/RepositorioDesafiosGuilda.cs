using System.Text.Json;

namespace PainelDed.Api.Campanhas;

public class RepositorioDesafiosGuilda
{
    private readonly List<DesafioGuilda> _desafios;

    private RepositorioDesafiosGuilda(List<DesafioGuilda> desafios)
    {
        _desafios = desafios;
    }

    public IReadOnlyList<DesafioGuilda> Todos => _desafios;

    public static RepositorioDesafiosGuilda CarregarDeArquivo(string caminhoArquivo)
    {
        var opcoes = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var json = File.ReadAllText(caminhoArquivo);
        var desafios = JsonSerializer.Deserialize<List<DesafioGuilda>>(json, opcoes)
            ?? throw new InvalidOperationException($"Falha ao carregar desafios de guilda de {caminhoArquivo}");

        return new RepositorioDesafiosGuilda(desafios);
    }
}
