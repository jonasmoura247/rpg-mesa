using System;
using System.IO;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class LocalizadorPastaDadosTestes : IDisposable
{
    private readonly string _raizTemporaria;

    public LocalizadorPastaDadosTestes()
    {
        _raizTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-dados-testes-" + Guid.NewGuid());
        Directory.CreateDirectory(_raizTemporaria);
    }

    public void Dispose()
    {
        Directory.Delete(_raizTemporaria, recursive: true);
    }

    [Fact]
    public void Localizar_ComSlnNoDiretorioInicial_CriaEDevolvePastaDeCampanhas()
    {
        File.WriteAllText(Path.Combine(_raizTemporaria, "PainelDed.sln"), "");

        var caminho = LocalizadorPastaDados.Localizar(_raizTemporaria);

        Assert.Equal(Path.Combine(_raizTemporaria, "data", "campanhas"), caminho);
        Assert.True(Directory.Exists(caminho));
    }

    [Fact]
    public void Localizar_ComSlnVariosNiveisAcima_SobeAArvoreAteEncontrar()
    {
        File.WriteAllText(Path.Combine(_raizTemporaria, "PainelDed.sln"), "");
        var diretorioProfundo = Path.Combine(_raizTemporaria, "tests", "PainelDed.Api.Testes", "bin", "Debug", "net8.0");
        Directory.CreateDirectory(diretorioProfundo);

        var caminho = LocalizadorPastaDados.Localizar(diretorioProfundo);

        Assert.Equal(Path.Combine(_raizTemporaria, "data", "campanhas"), caminho);
    }

    [Fact]
    public void Localizar_SemSlnEmNenhumNivel_LancaDirectoryNotFoundException()
    {
        var diretorioSemSln = Path.Combine(_raizTemporaria, "sem-sln");
        Directory.CreateDirectory(diretorioSemSln);

        Assert.Throws<DirectoryNotFoundException>(() => LocalizadorPastaDados.Localizar(diretorioSemSln));
    }

    [Fact]
    public void Localizar_ComDiretorioInicialInexistente_LancaDirectoryNotFoundException()
    {
        var caminhoInexistente = Path.Combine(_raizTemporaria, "nao-existe", "nem-este");

        Assert.Throws<DirectoryNotFoundException>(() => LocalizadorPastaDados.Localizar(caminhoInexistente));
    }
}
