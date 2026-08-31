using System.Collections.Generic;
using System.Linq;
using PainelDed.Api.Campanhas;
using PainelDed.Nucleo.Rolagem;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

// Retorna os valores da fila em ordem, um por chamada de Rolar. Permite testar
// sequências determinísticas de sorteio (índice + XP + PO), diferente de DadoFixo
// (que sempre retorna o mesmo valor e não serve pra testar "sem repetir índice").
public class DadoSequencia : IDado
{
    private readonly Queue<int> _valores;
    public DadoSequencia(params int[] valores) => _valores = new Queue<int>(valores);
    public int Rolar(string notacao) => _valores.Dequeue();
}

public class ServicoGeradorDesafiosGuildaTestes
{
    private static RepositorioDesafiosGuilda CriarRepositorioComCincoDesafios()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario, """
        [
          {"titulo":"Desafio 1","descricao":"desc 1","dificuldade":"facil"},
          {"titulo":"Desafio 2","descricao":"desc 2","dificuldade":"facil"},
          {"titulo":"Desafio 3","descricao":"desc 3","dificuldade":"media"},
          {"titulo":"Desafio 4","descricao":"desc 4","dificuldade":"media"},
          {"titulo":"Desafio 5","descricao":"desc 5","dificuldade":"dificil"}
        ]
        """);
        var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminhoTemporario);
        File.Delete(caminhoTemporario);
        return repositorio;
    }

    private static RepositorioDesafiosGuilda CriarRepositorioComUmDeCadaDificuldade()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario, """
        [
          {"titulo":"O Facil","descricao":"desc facil","dificuldade":"facil"},
          {"titulo":"O Media","descricao":"desc media","dificuldade":"media"},
          {"titulo":"O Dificil","descricao":"desc dificil","dificuldade":"dificil"}
        ]
        """);
        var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminhoTemporario);
        File.Delete(caminhoTemporario);
        return repositorio;
    }

    [Fact]
    public void SortearTres_ComUmDeCadaDificuldade_RetornaNaOrdemFacilMediaDificilSemRolarSelecao()
    {
        var repositorio = CriarRepositorioComUmDeCadaDificuldade();
        // Cada dificuldade tem só 1 opção -> não rola dado pra escolher índice, só
        // pra recompensa (XP, PO) de cada uma, na ordem fácil, média, difícil.
        var dado = new DadoSequencia(
            6, 10,   // facil: XP 1d6=6 -> 60 | PO 1d10=10 -> 50
            10, 10,  // media: XP 1d10=10 -> 200 | PO 1d10=10 -> 150
            10, 10); // dificil: XP 1d10=10*40+100 -> 500 | PO 1d10=10*25+50 -> 300
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        Assert.Equal(3, rascunhos.Count);

        Assert.Equal("O Facil", rascunhos[0].TituloSugerido);
        Assert.Equal(60, rascunhos[0].XpSugerido);
        Assert.Equal("50 PO", rascunhos[0].RecompensaSugerida);
        Assert.Equal("facil", rascunhos[0].Dificuldade);

        Assert.Equal("O Media", rascunhos[1].TituloSugerido);
        Assert.Equal(200, rascunhos[1].XpSugerido);
        Assert.Equal("150 PO", rascunhos[1].RecompensaSugerida);
        Assert.Equal("media", rascunhos[1].Dificuldade);

        Assert.Equal("O Dificil", rascunhos[2].TituloSugerido);
        Assert.Equal(500, rascunhos[2].XpSugerido);
        Assert.Equal("300 PO", rascunhos[2].RecompensaSugerida);
        Assert.Equal("dificil", rascunhos[2].Dificuldade);
    }

    [Fact]
    public void SortearTres_ComVariasOpcoesNaMesmaDificuldade_SorteiaDentroDoPoolDaquelaDificuldade()
    {
        var repositorio = CriarRepositorioComCincoDesafios(); // facil: 1,2 | media: 3,4 | dificil: 5
        var dado = new DadoSequencia(
            2, 3, 4,   // facil (pool 2): 1d2=2 -> Desafio 2; XP 1d6=3 -> 30; PO 1d10=4 -> 20
            1, 5, 6,   // media (pool 2): 1d2=1 -> Desafio 3; XP 1d10=5 -> 100; PO 1d10=6 -> 90
            2, 3);     // dificil (pool 1, sem seleção): Desafio 5; XP 1d10=2 -> 180; PO 1d10=3 -> 125
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        Assert.Equal(new[] { "Desafio 2", "Desafio 3", "Desafio 5" }, rascunhos.Select(r => r.TituloSugerido));
    }

    [Fact]
    public void SortearTres_ComDificuldadeAusenteNoBanco_PulaEssaDificuldadeERetornaAsOutras()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario, """
        [
          {"titulo":"So Facil","descricao":"desc","dificuldade":"facil"},
          {"titulo":"So Dificil","descricao":"desc","dificuldade":"dificil"}
        ]
        """);
        var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminhoTemporario);
        File.Delete(caminhoTemporario);

        // Sem "media" no banco -> pula essa dificuldade; só 2 rascunhos, 4 rolls (XP,PO x2).
        var dado = new DadoSequencia(6, 10, 10, 10);
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        Assert.Equal(2, rascunhos.Count);
        Assert.Equal("So Facil", rascunhos[0].TituloSugerido);
        Assert.Equal("So Dificil", rascunhos[1].TituloSugerido);
    }

    [Fact]
    public void SortearTres_ComBancoVazio_RetornaListaVazia()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario, "[]");
        var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminhoTemporario);
        File.Delete(caminhoTemporario);

        var dado = new DadoSequencia();
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        Assert.Empty(rascunhos);
    }
}
