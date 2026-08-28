using System.Text.RegularExpressions;
using PainelDed.Nucleo.Modelos;

namespace PainelDed.Nucleo.Parsing;

public static class ParserWikilink
{
    // O alvo para no '#' quando o link aponta pra uma seção específica de outra nota
    // (ex: [[../monstros/01-Humanoides#Goblin|goblin]]) — a âncora é descartada porque
    // a resolução de conteúdo (RepositorioConteudo) navega por nota inteira, não por seção.
    private static readonly Regex RegexLink = new(
        @"\[\[(?<alvo>[^\]|\\#]+)(?:#[^\]|\\]*)?(?:\\?\|(?<rotulo>[^\]]+))?\]\]",
        RegexOptions.Compiled);

    public static List<LinkReferencia> ExtrairLinks(string texto)
    {
        var links = new List<LinkReferencia>();
        foreach (Match match in RegexLink.Matches(texto))
        {
            var alvo = NormalizarAlvo(match.Groups["alvo"].Value.Trim());
            var rotulo = match.Groups["rotulo"].Success
                ? match.Groups["rotulo"].Value.Trim()
                : alvo;
            links.Add(new LinkReferencia(rotulo, alvo));
        }
        return links;
    }

    public static string LimparTexto(string texto)
    {
        return RegexLink.Replace(texto, match =>
            match.Groups["rotulo"].Success
                ? match.Groups["rotulo"].Value.Trim()
                : NormalizarAlvo(match.Groups["alvo"].Value.Trim()));
    }

    private static string NormalizarAlvo(string alvo)
    {
        var normalizado = alvo.Replace('\\', '/');
        while (normalizado.StartsWith("../"))
        {
            normalizado = normalizado[3..];
        }
        return normalizado.TrimStart('/');
    }
}
