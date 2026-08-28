using PainelDed.Api.Conteudo;
using PainelDed.Api.Rolagem;
using PainelDed.Nucleo.Rolagem;

namespace PainelDed.Api.Campanhas;

public class ServicoGeradorIdeiaQuest
{
    // Ids fixos do vault (Plano 1) — se essas notas forem renomeadas/movidas e o
    // ingestor reexecutado, ObterNota passa a retornar null e GerarRascunho falha
    // silenciosamente (sem log/mensagem). Aceitável para o volume/estabilidade
    // atual do conteúdo, mas é a primeira coisa a checar se "Gerar ideia" parar
    // de funcionar depois de uma reorganização do vault.
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

        // Rola TODAS as tabelas da nota escolhida (não só uma) pra dar um rascunho
        // mais rico — o mestre edita/apaga o que não servir antes de salvar. Pode
        // gerar rascunhos longos em notas com muitas tabelas; é intencional.
        var linhas = new List<string>();
        foreach (var tabela in nota.Tabelas)
        {
            var resultado = _servicoRolagem.Rolar("mundo", idNotaEscolhida, tabela.Titulo);
            if (resultado is not null)
            {
                linhas.Add($"{tabela.Titulo}: {resultado.Entrada.Texto}");
            }
        }

        var xpSugerido = _dado.Rolar("1d10") * 50;
        var recompensaSugerida = $"{_dado.Rolar("1d20") * 10} PO";

        return new RascunhoQuest(nota.Titulo, string.Join("\n", linhas), xpSugerido, recompensaSugerida);
    }
}
