namespace PainelDed.Nucleo.Modelos;

public record NotaConteudo(string Id, string Titulo, string CorpoMarkdown, List<TabelaRolagem> Tabelas);
