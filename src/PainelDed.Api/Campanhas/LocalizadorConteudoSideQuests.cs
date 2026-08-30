namespace PainelDed.Api.Campanhas;

// Mesma estratégia de LocalizadorConteudoGuilda: sobe a árvore de diretórios a partir
// do ponto de partida até achar o arquivo, robusto tanto rodando via `dotnet run`
// quanto nos testes de integração (ContentRootPath varia conforme quem hospeda).
public static class LocalizadorConteudoSideQuests
{
    public static string Localizar(string diretorioInicial)
    {
        var diretorio = new DirectoryInfo(diretorioInicial);

        while (diretorio is not null)
        {
            var candidato = Path.Combine(diretorio.FullName, "content", "side-quests", "catalogo.json");
            if (File.Exists(candidato))
            {
                return candidato;
            }

            diretorio = diretorio.Parent;
        }

        throw new FileNotFoundException(
            $"Não foi possível localizar 'content/side-quests/catalogo.json' subindo a árvore de diretórios a partir de '{diretorioInicial}'.");
    }
}
