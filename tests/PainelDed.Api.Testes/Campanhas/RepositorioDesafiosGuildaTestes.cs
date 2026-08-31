using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class RepositorioDesafiosGuildaTestes
{
    [Fact]
    public void CarregarDeArquivo_ComBancoReal_CarregaDesafiosComDificuldadeValida()
    {
        var caminho = LocalizadorConteudoGuilda.Localizar(AppContext.BaseDirectory);

        var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminho);

        // Não fixa um total exato: o banco (content/guilda/desafios-guilda.json) é
        // conteúdo editorial que cresce com o tempo, não um contrato de código.
        Assert.True(repositorio.Todos.Count >= 100, $"esperava pelo menos 100 desafios, achou {repositorio.Todos.Count}");
        Assert.All(repositorio.Todos, d => Assert.Contains(d.Dificuldade, new[] { "facil", "media", "dificil" }));
        Assert.All(repositorio.Todos, d => Assert.False(string.IsNullOrWhiteSpace(d.Titulo)));
    }

    [Fact]
    public void CarregarDeArquivo_ComArquivoDeTeste_CarregaOsItensNaOrdem()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario,
            "[{\"titulo\":\"A\",\"descricao\":\"desc A\",\"dificuldade\":\"facil\"}," +
            "{\"titulo\":\"B\",\"descricao\":\"desc B\",\"dificuldade\":\"dificil\"}]");

        try
        {
            var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminhoTemporario);

            Assert.Equal(2, repositorio.Todos.Count);
            Assert.Equal("A", repositorio.Todos[0].Titulo);
            Assert.Equal("dificil", repositorio.Todos[1].Dificuldade);
        }
        finally
        {
            File.Delete(caminhoTemporario);
        }
    }
}
