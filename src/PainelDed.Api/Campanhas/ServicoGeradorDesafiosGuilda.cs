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
        var desafios = _repositorio.Todos;
        var quantidade = Math.Min(3, desafios.Count);

        var indicesEscolhidos = new List<int>();
        while (indicesEscolhidos.Count < quantidade)
        {
            var indice = _dado.Rolar($"1d{desafios.Count}") - 1;
            if (!indicesEscolhidos.Contains(indice))
            {
                indicesEscolhidos.Add(indice);
            }
        }

        return indicesEscolhidos.Select(indice => GerarRascunho(desafios[indice])).ToList();
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

        return new RascunhoQuest(desafio.Titulo, desafio.Descricao, xp, $"{po} PO");
    }
}
