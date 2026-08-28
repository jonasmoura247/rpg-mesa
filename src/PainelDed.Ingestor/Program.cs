using System.Text.Json;
using PainelDed.Nucleo.Ingestao;

if (args.Length < 2)
{
    Console.Error.WriteLine("Uso: PainelDed.Ingestor <caminho-do-vault> <pasta-de-saida>");
    return 1;
}

var caminhoVault = args[0];
var pastaSaida = args[1];

var nomesDeSecao = new[] { "mundo", "glossario", "regras", "monstros" };
Directory.CreateDirectory(pastaSaida);

var opcoesJson = new JsonSerializerOptions
{
    WriteIndented = true,
};

var totalNotas = 0;

foreach (var nome in nomesDeSecao)
{
    List<string> arquivos;
    try
    {
        arquivos = ArquivosDaSecao(nome, caminhoVault);
    }
    catch (DirectoryNotFoundException erro)
    {
        Console.Error.WriteLine($"ERRO: {erro.Message}");
        return 1;
    }

    if (arquivos.Count == 0)
    {
        Console.Error.WriteLine($"ERRO: nenhuma nota encontrada na seção '{nome}'.");
        return 1;
    }

    var secaoConvertida = ConversorSecao.Converter(nome, caminhoVault, arquivos);
    var caminhoJson = Path.Combine(pastaSaida, $"{nome}.json");
    File.WriteAllText(caminhoJson, JsonSerializer.Serialize(secaoConvertida, opcoesJson));

    Console.WriteLine($"[{nome}] {secaoConvertida.Notas.Count} notas convertidas -> {caminhoJson}");
    totalNotas += secaoConvertida.Notas.Count;
}

Console.WriteLine($"Total: {totalNotas} notas convertidas em {nomesDeSecao.Length} seções.");
return 0;

List<string> ArquivosDaSecao(string nome, string vault)
{
    string ExigirPasta(string caminho)
    {
        if (!Directory.Exists(caminho))
        {
            throw new DirectoryNotFoundException($"pasta não encontrada para a seção '{nome}': {caminho}");
        }
        return caminho;
    }

    return nome switch
    {
        "mundo" => new[] { Path.Combine(vault, "Costa da Travessia.md") }
            .Concat(Directory.GetFiles(
                ExigirPasta(Path.Combine(vault, "Costa da Travessia")), "*.md", SearchOption.TopDirectoryOnly))
            .ToList(),
        "glossario" => Directory.GetFiles(
            ExigirPasta(Path.Combine(vault, "glossario")), "*.md", SearchOption.AllDirectories).ToList(),
        "regras" => Directory.GetFiles(
            ExigirPasta(Path.Combine(vault, "regras-do-jogo")), "*.md", SearchOption.AllDirectories).ToList(),
        "monstros" => Directory.GetFiles(
            ExigirPasta(Path.Combine(vault, "monstros")), "*.md", SearchOption.AllDirectories).ToList(),
        _ => throw new ArgumentException($"Seção desconhecida: {nome}"),
    };
}
