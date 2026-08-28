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

    // Comparação exata (case-sensitive): idNota vem de rotas HTTP geradas a partir
    // dos próprios Ids indexados (ex: link da árvore de navegação no frontend), então
    // já chega no formato canônico.
    public NotaConteudo? ObterNota(string nomeSecao, string idNota) =>
        ObterSecao(nomeSecao)?.Notas.FirstOrDefault(n => n.Id == idNota);

    // Comparação case-insensitive: alvo vem de wikilinks escritos à mão no vault,
    // onde maiúsculas/minúsculas podem variar sem intenção.
    //
    // Nota: se duas notas em seções diferentes compartilharem o mesmo slug final
    // (ex: glossario/index, monstros/index e regras-do-jogo/index — caso real no vault),
    // o fallback por slug retorna a primeira encontrada na ordem de _secoes.Values,
    // não necessariamente a pretendida. Isso não afeta nenhum wikilink real hoje
    // (todos usam caminho completo, que bate no match exato antes de cair no fallback),
    // mas fica documentado como limitação conhecida.
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
