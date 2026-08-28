using System.Text.Json;
using PainelDed.Nucleo.Modelos;

namespace PainelDed.Api.Conteudo;

public class RepositorioConteudo
{
    private readonly Dictionary<string, SecaoConteudo> _secoes;

    public RepositorioConteudo(IEnumerable<SecaoConteudo> secoes)
    {
        _secoes = secoes.ToDictionary(secao => secao.Nome);
    }

    public static RepositorioConteudo CarregarDePasta(string pastaConteudo)
    {
        var opcoes = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var secoes = new List<SecaoConteudo>();

        foreach (var arquivo in Directory.GetFiles(pastaConteudo, "*.json"))
        {
            var json = File.ReadAllText(arquivo);
            var secao = JsonSerializer.Deserialize<SecaoConteudo>(json, opcoes)
                ?? throw new InvalidOperationException($"Falha ao carregar conteúdo de {arquivo}");
            secoes.Add(secao);
        }

        return new RepositorioConteudo(secoes);
    }

    public SecaoConteudo? ObterSecao(string nome) =>
        _secoes.TryGetValue(nome, out var secao) ? secao : null;

    public NotaConteudo? ObterNota(string nomeSecao, string idNota) =>
        ObterSecao(nomeSecao)?.Notas.FirstOrDefault(n => n.Id == idNota);

    public NotaConteudo? ResolverLink(string alvo)
    {
        var slug = alvo.Split('/').Last();
        foreach (var secao in _secoes.Values)
        {
            var nota = secao.Notas.FirstOrDefault(n => n.Id.Equals(alvo, StringComparison.OrdinalIgnoreCase))
                ?? secao.Notas.FirstOrDefault(n => n.Id.EndsWith("/" + slug, StringComparison.OrdinalIgnoreCase));
            if (nota is not null)
            {
                return nota;
            }
        }
        return null;
    }
}
