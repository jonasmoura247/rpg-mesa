namespace PainelDed.Api.Campanhas;

public record Campanha(string Id, string Nome, DateTimeOffset CriadaEm);

public record Quest(
    string Id,
    string Titulo,
    string Descricao,
    string Recompensa,
    int XpSugerido,
    string Status,
    int Semana,
    string? Responsavel);

public record EntradaHistorico(string Descricao, DateTimeOffset Timestamp);

public record EstadoCampanha(List<Quest> Quests, List<EntradaHistorico> HistoricoRolagens);

public record NovaCampanhaRequisicao(string Nome);

public record NovaQuestRequisicao(
    string Titulo,
    string Descricao,
    string Recompensa,
    int XpSugerido,
    int Semana,
    string? Responsavel);

public record AtualizarQuestRequisicao(
    string Titulo,
    string Descricao,
    string Recompensa,
    int XpSugerido,
    string Status,
    int Semana,
    string? Responsavel);

public record NovaEntradaHistoricoRequisicao(string Descricao);

public record RascunhoQuest(string TituloSugerido, string DescricaoSugerida);
