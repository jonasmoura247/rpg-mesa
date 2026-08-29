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

public record EstadoCampanha(List<Quest> Quests, List<EntradaHistorico> HistoricoRolagens, List<Personagem>? Personagens = null);

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

public record RascunhoQuest(string TituloSugerido, string DescricaoSugerida, int XpSugerido, string RecompensaSugerida);

public record AtributosPersonagem(
    int Forca,
    int Destreza,
    int Constituicao,
    int Inteligencia,
    int Sabedoria,
    int Carisma);

public record PericiaPersonagem(string Nome, string Atributo, bool Proficiente, int Bonus);

public record Personagem(
    string Id,
    string Nome,
    string Raca,
    string Classe,
    int Nivel,
    AtributosPersonagem Atributos,
    int Pv,
    int Ca,
    List<PericiaPersonagem> Pericias,
    string Historia = "",
    string CaracteristicasFisicas = "");

public record ImportarPersonagemRequisicao(
    string Nome,
    string Raca,
    string Classe,
    int Nivel,
    AtributosPersonagem Atributos,
    int Pv,
    int Ca,
    List<PericiaPersonagem> Pericias,
    string Historia = "",
    string CaracteristicasFisicas = "");
