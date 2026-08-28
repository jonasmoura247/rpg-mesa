using System.Text;
using PainelDed.Nucleo.Modelos;
using PainelDed.Nucleo.Parsing;

namespace PainelDed.Nucleo.Ingestao;

public static class ConversorSecao
{
    public static SecaoConteudo Converter(string nomeSecao, string caminhoVault, IEnumerable<string> arquivosMarkdown)
    {
        var notas = arquivosMarkdown
            .OrderBy(caminho => caminho, StringComparer.OrdinalIgnoreCase)
            .Select(caminho => ConverterArquivo(caminhoVault, caminho))
            .ToList();

        return new SecaoConteudo(nomeSecao, notas);
    }

    private static NotaConteudo ConverterArquivo(string caminhoVault, string caminhoArquivo)
    {
        var markdown = File.ReadAllText(caminhoArquivo, Encoding.UTF8);
        var id = GerarId(caminhoVault, caminhoArquivo);
        var titulo = ExtrairTitulo(markdown, id);
        var tabelas = ParserTabela.ExtrairTabelas(markdown);
        return new NotaConteudo(id, titulo, markdown, tabelas);
    }

    private static string GerarId(string caminhoVault, string caminhoArquivo)
    {
        var relativo = Path.GetRelativePath(caminhoVault, caminhoArquivo);
        var semExtensao = relativo[..^3]; // remove ".md"
        return semExtensao.Replace('\\', '/');
    }

    private static string ExtrairTitulo(string markdown, string idPadrao)
    {
        foreach (var linha in markdown.Replace("\r\n", "\n").Split('\n'))
        {
            if (linha.StartsWith("# "))
            {
                return linha[2..].Trim();
            }
        }
        return idPadrao;
    }
}
