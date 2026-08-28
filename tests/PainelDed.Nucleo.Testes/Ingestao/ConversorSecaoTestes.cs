using System.IO;
using PainelDed.Nucleo.Ingestao;
using Xunit;

namespace PainelDed.Nucleo.Testes.Ingestao;

public class ConversorSecaoTestes : IDisposable
{
    private readonly string _pastaTemporaria;

    public ConversorSecaoTestes()
    {
        _pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-testes-" + Guid.NewGuid());
        Directory.CreateDirectory(_pastaTemporaria);
    }

    public void Dispose()
    {
        Directory.Delete(_pastaTemporaria, recursive: true);
    }

    [Fact]
    public void Converter_ComArquivosMarkdown_GeraNotasComIdTituloETabelas()
    {
        var caminhoArquivo = Path.Combine(_pastaTemporaria, "01-Hexcrawl.md");
        File.WriteAllText(caminhoArquivo, """
            # Hexcrawl

            ## Condições — 1d6

            | Roll | Resultado |
            |------|-----------|
            | 1 | Ventos fortes. |
            """);

        var secao = ConversorSecao.Converter("mundo", _pastaTemporaria, new[] { caminhoArquivo });

        Assert.Equal("mundo", secao.Nome);
        Assert.Single(secao.Notas);
        Assert.Equal("01-Hexcrawl", secao.Notas[0].Id);
        Assert.Equal("Hexcrawl", secao.Notas[0].Titulo);
        Assert.Single(secao.Notas[0].Tabelas);
    }

    [Fact]
    public void Converter_ComSubpastas_GeraIdComBarrasNormalizadas()
    {
        var pastaAninhada = Path.Combine(_pastaTemporaria, "glossario", "paisagens");
        Directory.CreateDirectory(pastaAninhada);
        var caminhoArquivo = Path.Combine(pastaAninhada, "restinga.md");
        File.WriteAllText(caminhoArquivo, "# Restinga\n\nTexto sem tabela.");

        var secao = ConversorSecao.Converter("glossario", _pastaTemporaria, new[] { caminhoArquivo });

        Assert.Equal("glossario/paisagens/restinga", secao.Notas[0].Id);
    }

    [Fact]
    public void Converter_SemTituloH1_UsaIdComoTitulo()
    {
        var caminhoArquivo = Path.Combine(_pastaTemporaria, "sem-titulo.md");
        File.WriteAllText(caminhoArquivo, "Texto sem cabeçalho H1.");

        var secao = ConversorSecao.Converter("mundo", _pastaTemporaria, new[] { caminhoArquivo });

        Assert.Equal("sem-titulo", secao.Notas[0].Titulo);
    }

    [Fact]
    public void Converter_ComArquivoVazioOuSoWhitespace_UsaIdComoTituloENaoLancaExcecao()
    {
        var caminhoVazio = Path.Combine(_pastaTemporaria, "vazio.md");
        var caminhoWhitespace = Path.Combine(_pastaTemporaria, "so-whitespace.md");
        File.WriteAllText(caminhoVazio, "");
        File.WriteAllText(caminhoWhitespace, "   \n\t  \n");

        var secao = ConversorSecao.Converter("mundo", _pastaTemporaria, new[] { caminhoVazio, caminhoWhitespace });

        Assert.Equal(2, secao.Notas.Count);
        Assert.Equal("so-whitespace", secao.Notas[0].Titulo);
        Assert.Empty(secao.Notas[0].Tabelas);
        Assert.Equal("vazio", secao.Notas[1].Titulo);
        Assert.Empty(secao.Notas[1].Tabelas);
    }
}
