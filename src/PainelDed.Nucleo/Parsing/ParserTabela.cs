using System.Text.RegularExpressions;
using PainelDed.Nucleo.Modelos;

namespace PainelDed.Nucleo.Parsing;

public static class ParserTabela
{
    private static readonly string MarcadorPipeEscapado = char.ConvertFromUtf32(0x0001);

    // O dado pode ter texto extra depois (ex: "1d20 (apenas se rolar 20)"), então
    // não ancoramos o fim da linha logo após o padrão NdM.
    private static readonly Regex RegexCabecalhoComDado = new(
        @"^#{1,6}\s+(?<titulo>.+?)\s*[—-]\s*(?<dado>\d+d\d+)\b.*$", RegexOptions.Compiled);
    private static readonly Regex RegexLinhaTabela = new(@"^\|(?<celulas>.+)\|\s*$", RegexOptions.Compiled);
    private static readonly Regex RegexSeparadorTabela = new(@"^\|[\s:|-]+\|\s*$", RegexOptions.Compiled);
    private static readonly Regex RegexFaixa = new(
        @"^(?<inicio>\d+)(?:\s*[–-]\s*(?<fim>\d+))?$", RegexOptions.Compiled);

    public static List<TabelaRolagem> ExtrairTabelas(string markdown)
    {
        var linhas = markdown.Replace("\r\n", "\n").Split('\n');
        var tabelas = new List<TabelaRolagem>();

        for (var i = 0; i < linhas.Length; i++)
        {
            var matchCabecalho = RegexCabecalhoComDado.Match(linhas[i].Trim());
            if (!matchCabecalho.Success)
            {
                continue;
            }

            var titulo = matchCabecalho.Groups["titulo"].Value.Trim();
            var dado = matchCabecalho.Groups["dado"].Value.Trim();

            var indice = i + 1;
            while (indice < linhas.Length
                   && !RegexLinhaTabela.IsMatch(linhas[indice])
                   && !linhas[indice].TrimStart().StartsWith('#'))
            {
                indice++;
            }

            if (indice >= linhas.Length || !RegexLinhaTabela.IsMatch(linhas[indice]))
            {
                continue; // seção seguinte começou antes de achar uma tabela
            }

            indice++; // pula a linha de separador |---|---|
            var entradas = new List<EntradaTabela>();

            while (indice < linhas.Length && RegexLinhaTabela.IsMatch(linhas[indice]))
            {
                if (!RegexSeparadorTabela.IsMatch(linhas[indice]))
                {
                    var entrada = ParsearLinha(linhas[indice]);
                    if (entrada is not null)
                    {
                        entradas.Add(entrada);
                    }
                }
                indice++;
            }

            if (entradas.Count > 0)
            {
                tabelas.Add(new TabelaRolagem(titulo, dado, entradas));
            }
        }

        return tabelas;
    }

    private static EntradaTabela? ParsearLinha(string linha)
    {
        // Wikilinks dentro de células usam '\|' pra não quebrar a separação de colunas
        // markdown; trocamos por um marcador temporário antes do Split e restauramos depois.
        var linhaEscapada = linha.Replace("\\|", MarcadorPipeEscapado);
        var celulas = linhaEscapada.Trim().Trim('|').Split('|');
        if (celulas.Length < 2)
        {
            return null;
        }

        var faixaTexto = celulas[0].Trim();
        // Algumas tabelas do vault têm mais de 2 colunas (ex: "Especificações I — Povo"
        // em 03-Assentamento.md, com colunas "Humanos" e "Povo Lagarto" lado a lado).
        // Usamos só a primeira coluna de resultado — juntar todas com "|" produzia um
        // texto ilegível tipo "Coletores de especiarias raras. | —" quando a segunda
        // coluna estava vazia/irrelevante pra faixa rolada.
        var textoResultado = celulas[1].Trim().Replace(MarcadorPipeEscapado, "|");

        var matchFaixa = RegexFaixa.Match(faixaTexto);
        if (!matchFaixa.Success)
        {
            return null;
        }

        var inicio = int.Parse(matchFaixa.Groups["inicio"].Value);
        var fim = matchFaixa.Groups["fim"].Success ? int.Parse(matchFaixa.Groups["fim"].Value) : inicio;

        var links = ParserWikilink.ExtrairLinks(textoResultado);
        var textoLimpo = ParserWikilink.LimparTexto(textoResultado);

        return new EntradaTabela(inicio, fim, textoLimpo, links);
    }
}
