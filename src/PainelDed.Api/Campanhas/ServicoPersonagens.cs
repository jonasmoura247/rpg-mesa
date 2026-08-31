using PainelDed.Nucleo.Rolagem;

namespace PainelDed.Api.Campanhas;

public class ServicoPersonagens
{
    private readonly RepositorioCampanhas _repositorio;
    private readonly RepositorioSideQuests _repositorioSideQuests;
    private readonly IDado _dado;
    private readonly ServicoHistorico _servicoHistorico;

    public ServicoPersonagens(RepositorioCampanhas repositorio, RepositorioSideQuests repositorioSideQuests, IDado dado, ServicoHistorico servicoHistorico)
    {
        _repositorio = repositorio;
        _repositorioSideQuests = repositorioSideQuests;
        _dado = dado;
        _servicoHistorico = servicoHistorico;
    }

    public List<Personagem>? Listar(string campanhaId)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        return estado is null ? null : estado.Personagens ?? new List<Personagem>();
    }

    public Personagem? Obter(string campanhaId, string personagemId) =>
        Listar(campanhaId)?.FirstOrDefault(p => p.Id == personagemId);

    public Personagem? Importar(string campanhaId, ImportarPersonagemRequisicao requisicao)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var personagens = estado.Personagens ?? new List<Personagem>();
        var existente = personagens.FirstOrDefault(p => p.Nome == requisicao.Nome);

        var personagem = new Personagem(
            existente?.Id ?? Guid.NewGuid().ToString("N")[..8],
            requisicao.Nome,
            requisicao.Raca,
            requisicao.Classe,
            requisicao.Nivel,
            requisicao.Atributos,
            requisicao.Pv,
            requisicao.Ca,
            requisicao.Pericias,
            requisicao.Historia,
            requisicao.CaracteristicasFisicas,
            requisicao.Iniciativa,
            requisicao.BonusAtaqueForca,
            requisicao.BonusAtaqueDestreza,
            requisicao.CdMagia,
            requisicao.BonusAtaqueMagico,
            requisicao.TestesResistencia,
            requisicao.TracosRaciais,
            requisicao.HabilidadesClasse,
            requisicao.MagiasConhecidas,
            existente?.SideQuestAtual,
            Armas: requisicao.Armas,
            Xp: existente?.Xp ?? 0,
            Itens: requisicao.Itens,
            EspacosMagia1: requisicao.EspacosMagia1);

        if (existente is not null)
        {
            personagens[personagens.IndexOf(existente)] = personagem;
        }
        else
        {
            personagens.Add(personagem);
        }

        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });
        return personagem;
    }

    public Personagem? SortearSideQuest(string campanhaId, string personagemId)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var personagens = estado.Personagens ?? new List<Personagem>();
        var existente = personagens.FirstOrDefault(p => p.Id == personagemId);
        if (existente is null)
        {
            return null;
        }

        var itens = _repositorioSideQuests.Todos;
        var escolhido = itens[_dado.Rolar($"1d{itens.Count}") - 1];
        var xp = _dado.Rolar("1d6") * 5;

        var atualizado = existente with
        {
            SideQuestAtual = new SideQuestPersonagem(escolhido.Titulo, escolhido.Descricao, xp, "pendente")
        };

        personagens[personagens.IndexOf(existente)] = atualizado;
        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });
        return atualizado;
    }

    public Personagem? AtualizarStatusSideQuest(string campanhaId, string personagemId, string novoStatus)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var personagens = estado.Personagens ?? new List<Personagem>();
        var existente = personagens.FirstOrDefault(p => p.Id == personagemId);
        if (existente is null || existente.SideQuestAtual is null)
        {
            return null;
        }

        var atualizado = existente with
        {
            SideQuestAtual = existente.SideQuestAtual with { Status = novoStatus }
        };

        personagens[personagens.IndexOf(existente)] = atualizado;
        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });

        if (novoStatus == "concluida")
        {
            return AdicionarXp(campanhaId, personagemId, existente.SideQuestAtual.XpSugerido, $"side quest: {existente.SideQuestAtual.Titulo}");
        }

        return atualizado;
    }

    public Personagem? AdicionarXp(string campanhaId, string personagemId, int quantidade, string motivo)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var personagens = estado.Personagens ?? new List<Personagem>();
        var existente = personagens.FirstOrDefault(p => p.Id == personagemId);
        if (existente is null)
        {
            return null;
        }

        var atualizado = existente with { Xp = existente.Xp + quantidade };
        personagens[personagens.IndexOf(existente)] = atualizado;
        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });

        var descricao = string.IsNullOrWhiteSpace(motivo)
            ? $"{atualizado.Nome} ganhou {quantidade} XP"
            : $"{atualizado.Nome} ganhou {quantidade} XP ({motivo})";
        _servicoHistorico.Registrar(campanhaId, descricao);

        return atualizado;
    }
}
