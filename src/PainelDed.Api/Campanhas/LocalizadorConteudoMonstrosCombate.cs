namespace PainelDed.Api.Campanhas;

// Mesma estratégia de LocalizadorConteudo/LocalizadorConteudoGuilda: sobe a árvore
// de diretórios a partir do ponto de partida até achar a pasta, robusto tanto
// rodando via `dotnet run` quanto nos testes de integração.
public static class LocalizadorConteudoMonstrosCombate
{
    public static string Localizar(string diretorioInicial)
    {
        var diretorio = new DirectoryInfo(diretorioInicial);

        while (diretorio is not null)
        {
            var candidato = Path.Combine(diretorio.FullName, "content", "monstros-combate");
            if (Directory.Exists(candidato))
            {
                return candidato;
            }

            diretorio = diretorio.Parent;
        }

        throw new DirectoryNotFoundException(
            $"Não foi possível localizar a pasta 'content/monstros-combate/' subindo a árvore de diretórios a partir de '{diretorioInicial}'.");
    }
}
