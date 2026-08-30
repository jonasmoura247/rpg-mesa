namespace PainelDed.Api.Campanhas;

// Mesma estratégia de LocalizadorConteudo: sobe a árvore de diretórios a partir do
// ponto de partida até achar o arquivo, robusto tanto rodando via `dotnet run` quanto
// nos testes de integração (ContentRootPath varia conforme quem hospeda).
public static class LocalizadorConteudoGuilda
{
    public static string Localizar(string diretorioInicial)
    {
        var diretorio = new DirectoryInfo(diretorioInicial);

        while (diretorio is not null)
        {
            var candidato = Path.Combine(diretorio.FullName, "content", "guilda", "desafios-guilda.json");
            if (File.Exists(candidato))
            {
                return candidato;
            }

            diretorio = diretorio.Parent;
        }

        throw new FileNotFoundException(
            $"Não foi possível localizar 'content/guilda/desafios-guilda.json' subindo a árvore de diretórios a partir de '{diretorioInicial}'.");
    }
}
