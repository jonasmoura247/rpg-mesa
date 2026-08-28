namespace PainelDed.Api.Conteudo;

// Localiza a pasta content/ na raiz do repositório de forma robusta independente
// de onde o processo foi iniciado.
//
// Motivação: `ContentRootPath` varia conforme quem hospeda o app. Rodando via
// `dotnet run --project src/PainelDed.Api` a partir da raiz do repo, o ContentRootPath
// é `src/PainelDed.Api/`, então dois `..` bastariam. Mas o `WebApplicationFactory<Program>`
// usado nos testes de integração resolve o ContentRootPath a partir do diretório de saída
// do build do projeto de TESTES (`tests/PainelDed.Api.Testes/bin/Debug/net8.0/`), então um
// cálculo fixo de "sobe N pastas" quebra dependendo de quem hospeda.
//
// Em vez de fixar a quantidade de níveis, sobe a árvore de diretórios a partir do ponto de
// partida até achar uma pasta "content" contendo os JSONs esperados. Funciona igual nos dois
// cenários porque tanto `src/PainelDed.Api/` quanto `tests/PainelDed.Api.Testes/bin/Debug/net8.0/`
// são descendentes da raiz do repositório, onde `content/` está commitada.
public static class LocalizadorConteudo
{
    private static readonly string[] ArquivosEsperados =
    {
        "mundo.json", "glossario.json", "regras.json", "monstros.json"
    };

    public static string Localizar(string diretorioInicial)
    {
        var diretorio = new DirectoryInfo(diretorioInicial);

        while (diretorio is not null)
        {
            var candidato = Path.Combine(diretorio.FullName, "content");
            if (Directory.Exists(candidato) &&
                ArquivosEsperados.All(arquivo => File.Exists(Path.Combine(candidato, arquivo))))
            {
                return candidato;
            }

            diretorio = diretorio.Parent;
        }

        throw new DirectoryNotFoundException(
            $"Não foi possível localizar a pasta 'content/' (com {string.Join(", ", ArquivosEsperados)}) " +
            $"subindo a árvore de diretórios a partir de '{diretorioInicial}'.");
    }
}
