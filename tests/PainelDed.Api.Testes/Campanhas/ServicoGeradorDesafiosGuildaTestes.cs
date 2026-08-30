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

    [Fact]
    public void SortearTres_NuncaRepeteIndice_MesmoComRolagemDuplicada()
    {
        var repositorio = CriarRepositorioComCincoDesafios();
        // Seleção de índices (1-based, 1d5): 2, 2 (repetido, ignorado), 5, 1 -> escolhe [1,4,0] (0-based)
        // Depois, pra cada um dos 3 escolhidos (nessa ordem), rola XP e PO:
        //   Desafio 2 (facil):  XP 1d6=3 -> 30 | PO 1d10=4 -> 20
        //   Desafio 5 (dificil): XP 1d10=2 -> 180 | PO 1d10=3 -> 125
        //   Desafio 1 (facil):  XP 1d6=5 -> 50 | PO 1d10=6 -> 30
        var dado = new DadoSequencia(2, 2, 5, 1, /*Desafio2*/ 3, 4, /*Desafio5*/ 2, 3, /*Desafio1*/ 5, 6);
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        Assert.Equal(3, rascunhos.Count);
        var titulos = rascunhos.Select(r => r.TituloSugerido).ToList();
        Assert.Equal(new[] { "Desafio 2", "Desafio 5", "Desafio 1" }, titulos);
        Assert.Equal(3, titulos.Distinct().Count());
    }

    [Fact]
    public void SortearTres_DesafioFacil_CalculaXpEPoNaFaixaCorreta()
    {
        var repositorio = CriarRepositorioComCincoDesafios();
        // A seleção de índices acontece TODA ANTES do cálculo de XP/PO (o serviço
        // sorteia os 3 índices distintos primeiro, só depois rola recompensa pra
        // cada um, na ordem em que foram escolhidos) — por isso a sequência não
        // intercala índice/xp/po, e sim: [3 rolls de índice] + [2 rolls por item].
        // Índices 1,2,3 (1d5) -> escolhe Desafio1, Desafio2, Desafio3, nessa ordem.
        var dado = new DadoSequencia(
            1, 2, 3,       // seleção de índices: Desafio1 (0), Desafio2 (1), Desafio3 (2)
            6, 10,         // Desafio1 (facil): XP 1d6=6 -> 60 | PO 1d10=10 -> 50
            1, 1,          // Desafio2 (facil): XP 1d6=1 -> 10 | PO 1d10=1 -> 5
            1, 1);         // Desafio3 (media): valores não verificados nesse teste
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        var desafio1 = rascunhos[0];
        Assert.Equal(60, desafio1.XpSugerido); // 1d6=6 * 10
        Assert.Equal("50 PO", desafio1.RecompensaSugerida); // 1d10=10 * 5

        var desafio2 = rascunhos[1];
        Assert.Equal(10, desafio2.XpSugerido); // 1d6=1 * 10
        Assert.Equal("5 PO", desafio2.RecompensaSugerida); // 1d10=1 * 5
    }

    [Fact]
    public void SortearTres_DesafioMedio_CalculaXpEPoNaFaixaCorreta()
    {
        var repositorio = CriarRepositorioComCincoDesafios();
        // Índices 3,1,2 (1d5) -> escolhe Desafio3 (media) primeiro, depois Desafio1, Desafio2.
        var dado = new DadoSequencia(
            3, 1, 2,       // seleção de índices: Desafio3 (2), Desafio1 (0), Desafio2 (1)
            10, 10,        // Desafio3 (media): XP 1d10=10 -> 200 | PO 1d10=10 -> 150
            1, 1,          // Desafio1 (facil): valores não verificados
            1, 1);         // Desafio2 (facil): valores não verificados
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        var desafioMedio = rascunhos[0];
        Assert.Equal(200, desafioMedio.XpSugerido); // 1d10=10 * 20
        Assert.Equal("150 PO", desafioMedio.RecompensaSugerida); // 1d10=10 * 15
    }

    [Fact]
    public void SortearTres_DesafioDificil_CalculaXpEPoNaFaixaCorreta()
    {
        var repositorio = CriarRepositorioComCincoDesafios();
        // Índices 5,1,2 (1d5) -> escolhe Desafio5 (dificil) primeiro, depois Desafio1, Desafio2.
        var dado = new DadoSequencia(
            5, 1, 2,       // seleção de índices: Desafio5 (4), Desafio1 (0), Desafio2 (1)
            10, 10,        // Desafio5 (dificil): XP 1d10=10*40+100 -> 500 | PO 1d10=10*25+50 -> 300
            1, 1,          // Desafio1 (facil): valores não verificados
            1, 1);         // Desafio2 (facil): valores não verificados
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        var desafioDificil = rascunhos[0];
        Assert.Equal(500, desafioDificil.XpSugerido); // 1d10=10 * 40 + 100
        Assert.Equal("300 PO", desafioDificil.RecompensaSugerida); // 1d10=10 * 25 + 50
    }

    [Fact]
    public void SortearTres_ComBancoDeApenasDoisDesafios_RetornaSoDois()
    {
        var caminhoTemporario = Path.GetTempFileName();
        File.WriteAllText(caminhoTemporario, """
        [
          {"titulo":"Único 1","descricao":"desc","dificuldade":"facil"},
          {"titulo":"Único 2","descricao":"desc","dificuldade":"facil"}
        ]
        """);
        var repositorio = RepositorioDesafiosGuilda.CarregarDeArquivo(caminhoTemporario);
        File.Delete(caminhoTemporario);

        // Pool de 2 -> quantidade = min(3,2) = 2. Seleção de índices consome 2 rolls
        // (1,2 -> ambos distintos de primeira, sem precisar re-rolar), depois 2 rolls
        // de recompensa por item (4 no total) = 6 valores na fila.
        var dado = new DadoSequencia(1, 2, 1, 1, 1, 1);
        var servico = new ServicoGeradorDesafiosGuilda(repositorio, dado);

        var rascunhos = servico.SortearTres();

        Assert.Equal(2, rascunhos.Count);
    }
}
