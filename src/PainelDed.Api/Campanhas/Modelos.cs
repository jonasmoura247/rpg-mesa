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

public record DesafioGuilda(string Titulo, string Descricao, string Dificuldade);

public record AtributosPersonagem(
    int Forca,
    int Destreza,
    int Constituicao,
    int Inteligencia,
    int Sabedoria,
    int Carisma);

public record PericiaPersonagem(string Nome, string Atributo, bool Proficiente, int Bonus);

public record TesteResistencia(string Atributo, bool Proficiente, int Bonus);

public record TracoPersonagem(string Nome, string Descricao);

public record HabilidadeClasse(string Nome, int Nivel, string Descricao);

public record MagiaPersonagem(
    string Nome,
    int Circulo,
    string Escola,
    string TempoConjuracao,
    string Alcance,
    string Duracao,
    string Componentes,
    string Descricao,
    string? Dano = null,
    string? TesteResistencia = null);

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
    string CaracteristicasFisicas = "",
    int? Iniciativa = null,
    int? BonusAtaqueForca = null,
    int? BonusAtaqueDestreza = null,
    int? CdMagia = null,
    int? BonusAtaqueMagico = null,
    List<TesteResistencia>? TestesResistencia = null,
    List<TracoPersonagem>? TracosRaciais = null,
    List<HabilidadeClasse>? HabilidadesClasse = null,
    List<MagiaPersonagem>? MagiasConhecidas = null);

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
    string CaracteristicasFisicas = "",
    int? Iniciativa = null,
    int? BonusAtaqueForca = null,
    int? BonusAtaqueDestreza = null,
    int? CdMagia = null,
    int? BonusAtaqueMagico = null,
    List<TesteResistencia>? TestesResistencia = null,
    List<TracoPersonagem>? TracosRaciais = null,
    List<HabilidadeClasse>? HabilidadesClasse = null,
    List<MagiaPersonagem>? MagiasConhecidas = null);
