namespace PainelDed.Api.Campanhas;

public class ServicoQuests
{
    private readonly RepositorioCampanhas _repositorio;

    public ServicoQuests(RepositorioCampanhas repositorio)
    {
        _repositorio = repositorio;
    }

    public List<Quest>? Listar(string campanhaId) => _repositorio.CarregarEstado(campanhaId)?.Quests;

    public Quest? Criar(string campanhaId, NovaQuestRequisicao requisicao)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var quest = new Quest(
            Guid.NewGuid().ToString("N")[..8],
            requisicao.Titulo,
            requisicao.Descricao,
            requisicao.Recompensa,
            requisicao.XpSugerido,
            "disponivel",
            requisicao.Semana,
            requisicao.Responsavel);

        estado.Quests.Add(quest);
        _repositorio.SalvarEstado(campanhaId, estado);
        return quest;
    }

    public Quest? Atualizar(string campanhaId, string questId, AtualizarQuestRequisicao requisicao)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        var indice = estado?.Quests.FindIndex(q => q.Id == questId) ?? -1;
        if (estado is null || indice < 0)
        {
            return null;
        }

        var atualizada = estado.Quests[indice] with
        {
            Titulo = requisicao.Titulo,
            Descricao = requisicao.Descricao,
            Recompensa = requisicao.Recompensa,
            XpSugerido = requisicao.XpSugerido,
            Status = requisicao.Status,
            Semana = requisicao.Semana,
            Responsavel = requisicao.Responsavel,
        };

        estado.Quests[indice] = atualizada;
        _repositorio.SalvarEstado(campanhaId, estado);
        return atualizada;
    }

    public bool Remover(string campanhaId, string questId)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return false;
        }

        var removida = estado.Quests.RemoveAll(q => q.Id == questId) > 0;
        if (removida)
        {
            _repositorio.SalvarEstado(campanhaId, estado);
        }

        return removida;
    }
}
