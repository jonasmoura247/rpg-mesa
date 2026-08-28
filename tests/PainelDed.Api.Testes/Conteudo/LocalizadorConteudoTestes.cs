using PainelDed.Api.Conteudo;
using Xunit;

namespace PainelDed.Api.Testes.Conteudo;

public class LocalizadorConteudoTestes : IDisposable
{
    private readonly string _raizTemporaria;

    public LocalizadorConteudoTestes()
    {
        _raizTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-localizador-" + Guid.NewGuid());
        Directory.CreateDirectory(_raizTemporaria);
    }

    public void Dispose()
    {
        Directory.Delete(_raizTemporaria, recursive: true);
    }

    private void CriarPastaContentComArquivos(string pastaRaizContent)
    {
        var pastaContent = Path.Combine(pastaRaizContent, "content");
        Directory.CreateDirectory(pastaContent);
        foreach (var arquivo in new[] { "mundo.json", "glossario.json", "regras.json", "monstros.json" })
        {
            File.WriteAllText(Path.Combine(pastaContent, arquivo), "{}");
        }
    }

    [Fact]
    public void Localizar_ComContentNoDiretorioInicial_RetornaCaminhoDireto()
    {
        CriarPastaContentComArquivos(_raizTemporaria);

        var caminho = LocalizadorConteudo.Localizar(_raizTemporaria);

        Assert.Equal(Path.Combine(_raizTemporaria, "content"), caminho);
    }

    [Fact]
    public void Localizar_ComContentVariosNiveisAcima_SobeAArvoreAteEncontrar()
    {
        CriarPastaContentComArquivos(_raizTemporaria);
        var diretorioProfundo = Path.Combine(_raizTemporaria, "src", "PainelDed.Api", "bin", "Debug", "net8.0");
        Directory.CreateDirectory(diretorioProfundo);

        var caminho = LocalizadorConteudo.Localizar(diretorioProfundo);

        Assert.Equal(Path.Combine(_raizTemporaria, "content"), caminho);
    }

    [Fact]
    public void Localizar_ComPastaContentIncompleta_IgnoraEContinuaSubindo()
    {
        // Uma pasta "content" existe mas sem todos os 4 JSONs esperados (ex: pasta de outro
        // propósito) — não deve ser confundida com a pasta de conteúdo real, que está mais acima.
        var pastaContentIncompleta = Path.Combine(_raizTemporaria, "sub", "content");
        Directory.CreateDirectory(pastaContentIncompleta);
        File.WriteAllText(Path.Combine(pastaContentIncompleta, "mundo.json"), "{}");

        CriarPastaContentComArquivos(_raizTemporaria);

        var caminho = LocalizadorConteudo.Localizar(Path.Combine(_raizTemporaria, "sub"));

        Assert.Equal(Path.Combine(_raizTemporaria, "content"), caminho);
    }

    [Fact]
    public void Localizar_SemPastaContentEmNenhumNivel_LancaDirectoryNotFoundException()
    {
        var diretorioSemContent = Path.Combine(_raizTemporaria, "sem-content");
        Directory.CreateDirectory(diretorioSemContent);

        Assert.Throws<DirectoryNotFoundException>(() => LocalizadorConteudo.Localizar(diretorioSemContent));
    }
}
