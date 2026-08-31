using System.Linq;
using PainelDed.Nucleo.Rolagem;

namespace PainelDed.Api.Campanhas;

public class ServicoGeradorDesafiosGuilda
{
    private readonly RepositorioDesafiosGuilda _repositorio;
    private readonly IDado _dado;

    public ServicoGeradorDesafiosGuilda(RepositorioDesafiosGuilda repositorio, IDado dado)
    {
        _repositorio = repositorio;
        _dado = dado;
    }

    public List<RascunhoQuest> SortearTres()
    {
        var ordemDificuldades = new[] { "facil", "media", "dificil" };
        var resultado = new List<RascunhoQuest>();

        foreach (var dificuldade in ordemDificuldades)
        {
            var doDificuldade = _repositorio.Todos.Where(d => d.Dificuldade == dificuldade).ToList();
            if (doDificuldade.Count == 0)
            {
                continue;
            }

            // "1dN" exige N >= 2 (IDado.Rolar lança ArgumentException pra "1d1") — com só
            // 1 opção nessa dificuldade não há o que sortear, pega direto.
            var escolhido = doDificuldade.Count == 1
                ? doDificuldade[0]
                : doDificuldade[_dado.Rolar($"1d{doDificuldade.Count}") - 1];

            resultado.Add(GerarRascunho(escolhido));
        }

        return resultado;
    }

    private RascunhoQuest GerarRascunho(DesafioGuilda desafio)
    {
        var (xp, po) = desafio.Dificuldade switch
        {
            "facil" => (_dado.Rolar("1d6") * 10, _dado.Rolar("1d10") * 5),
            "media" => (_dado.Rolar("1d10") * 20, _dado.Rolar("1d10") * 15),
            "dificil" => (_dado.Rolar("1d10") * 40 + 100, _dado.Rolar("1d10") * 25 + 50),
            _ => throw new InvalidOperationException($"Dificuldade desconhecida: '{desafio.Dificuldade}' no desafio '{desafio.Titulo}'."),
        };

        return new RascunhoQuest(desafio.Titulo, desafio.Descricao, xp, $"{po} PO", desafio.Dificuldade);
    }
}
