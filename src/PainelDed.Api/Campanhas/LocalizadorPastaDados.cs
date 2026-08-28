namespace PainelDed.Api.Campanhas;

// Localiza (e cria, se necessário) a pasta data/campanhas/ na raiz do repositório,
// usando PainelDed.sln como âncora — diferente de LocalizadorConteudo, esta pasta
// pode não existir ainda na primeira execução, então não dá pra procurar por
// arquivos que já deveriam estar lá dentro.
public static class LocalizadorPastaDados
{
    public static string Localizar(string diretorioInicial)
    {
        var diretorio = new DirectoryInfo(diretorioInicial);

        while (diretorio is not null)
        {
            if (File.Exists(Path.Combine(diretorio.FullName, "PainelDed.sln")))
            {
                var pastaCampanhas = Path.Combine(diretorio.FullName, "data", "campanhas");
                Directory.CreateDirectory(pastaCampanhas);
                return pastaCampanhas;
            }

            diretorio = diretorio.Parent;
        }

        throw new DirectoryNotFoundException(
            $"Não foi possível localizar a raiz do repositório (PainelDed.sln) subindo a árvore de diretórios a partir de '{diretorioInicial}'.");
    }
}
