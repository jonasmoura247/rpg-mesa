using PainelDed.Api.Conteudo;
using PainelDed.Api.Rolagem;
using PainelDed.Nucleo.Rolagem;

namespace PainelDed.Api.Campanhas;

public class ServicoGeradorIdeiaQuest
{
    private static readonly string[] NotasCandidatas =
    {
        "Costa da Travessia/09-Fortaleza",
        "Costa da Travessia/05-Ruinas",
        "Costa da Travessia/03-Assentamento",
        "Costa da Travessia/10-Encontros-Aleatorios",
    };

    private readonly RepositorioConteudo _repositorioConteudo;
    private readonly ServicoRolagem _servicoRolagem;
    private readonly IDado _dado;

    public ServicoGeradorIdeiaQuest(RepositorioConteudo repositorioConteudo, ServicoRolagem servicoRolagem, IDado dado)
    {
        _repositorioConteudo = repositorioConteudo;
        _servicoRolagem = servicoRolagem;
        _dado = dado;
    }

    public RascunhoQuest? GerarRascunho()
    {
        var indiceEscolhido = _dado.Rolar($"1d{NotasCandidatas.Length}") - 1;
        var idNotaEscolhida = NotasCandidatas[indiceEscolhido];

        var nota = _repositorioConteudo.ObterNota("mundo", idNotaEscolhida);
        if (nota is null)
        {
            return null;
        }

        var linhas = new List<string>();
        foreach (var tabela in nota.Tabelas)
        {
            var resultado = _servicoRolagem.Rolar("mundo", idNotaEscolhida, tabela.Titulo);
            if (resultado is not null)
            {
                linhas.Add($"{tabela.Titulo}: {resultado.Entrada.Texto}");
            }
        }

        return new RascunhoQuest(nota.Titulo, string.Join("\n", linhas));
    }
}
