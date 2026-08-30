using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class RepositorioSideQuestsTestes
{
    [Fact]
    public void CarregarDeArquivo_ComBancoReal_Carrega100ItensComTituloEDescricao()
    {
        var caminho = LocalizadorConteudoSideQuests.Localizar(AppContext.BaseDirectory);

        var repositorio = RepositorioSideQuests.CarregarDeArquivo(caminho);

        Assert.Equal(100, repositorio.Todos.Count);
        Assert.All(repositorio.Todos, s => Assert.False(string.IsNullOrWhiteSpace(s.Titulo)));
        Assert.All(repositorio.Todos, s => Assert.False(string.IsNullOrWhiteSpace(s.Descricao)));
    }

    [Fact]
    public void CarregarDeArquivo_ComArquivoDeTeste_CarregaOsItensNaOrdem()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario,
            "[{\"titulo\":\"A\",\"descricao\":\"desc A\"},{\"titulo\":\"B\",\"descricao\":\"desc B\"}]");

        try
        {
            var repositorio = RepositorioSideQuests.CarregarDeArquivo(caminhoTemporario);

            Assert.Equal(2, repositorio.Todos.Count);
            Assert.Equal("A", repositorio.Todos[0].Titulo);
            Assert.Equal("desc B", repositorio.Todos[1].Descricao);
        }
        finally
        {
            File.Delete(caminhoTemporario);
        }
    }
}
