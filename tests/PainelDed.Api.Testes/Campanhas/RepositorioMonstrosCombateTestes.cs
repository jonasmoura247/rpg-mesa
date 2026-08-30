using System.Linq;
using PainelDed.Api.Campanhas;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class RepositorioMonstrosCombateTestes
{
    [Fact]
    public void CarregarDePasta_ComDoisArquivos_ConcatenaOsMonstrosDosDois()
    {
        var pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-monstros-" + Guid.NewGuid());
        Directory.CreateDirectory(pastaTemporaria);
        try
        {
            File.WriteAllText(Path.Combine(pastaTemporaria, "cd-0.json"), """
            [
              {
                "nome": "Rato Gigante",
                "cd": "0",
                "ca": 10,
                "pv": 1,
                "dadoDeVida": "1d4-1",
                "deslocamento": "6 m",
                "atributos": { "forca": -2, "destreza": 1, "constituicao": -1, "inteligencia": -4, "sabedoria": -1, "carisma": -3 },
                "acoes": [
                  { "nome": "Mordida", "tipo": "ataque", "bonusAcerto": 2, "atributoResistencia": null, "cdResistencia": null, "dano": "1 perfurante" }
                ]
              }
            ]
            """);
            File.WriteAllText(Path.Combine(pastaTemporaria, "cd-1-4.json"), """
            [
              {
                "nome": "Goblin",
                "cd": "1/4",
                "ca": 15,
                "pv": 7,
                "dadoDeVida": "2d6",
                "deslocamento": "9 m",
                "atributos": { "forca": -1, "destreza": 2, "constituicao": 0, "inteligencia": 0, "sabedoria": -1, "carisma": -1 },
                "acoes": [
                  { "nome": "Cimitarra", "tipo": "ataque", "bonusAcerto": 4, "atributoResistencia": null, "cdResistencia": null, "dano": "1d6+2 cortante" }
                ]
              }
            ]
            """);

            var repositorio = RepositorioMonstrosCombate.CarregarDePasta(pastaTemporaria);

            Assert.Equal(2, repositorio.Todos.Count);
            Assert.Contains(repositorio.Todos, m => m.Nome == "Rato Gigante");
            Assert.Contains(repositorio.Todos, m => m.Nome == "Goblin");
        }
        finally
        {
            Directory.Delete(pastaTemporaria, recursive: true);
        }
    }

    [Fact]
    public void CarregarDePasta_ComAcaoDeResistencia_CarregaCdECdResistenciaCorretamente()
    {
        var pastaTemporaria = Path.Combine(Path.GetTempPath(), "painel-ded-monstros-" + Guid.NewGuid());
        Directory.CreateDirectory(pastaTemporaria);
        try
        {
            File.WriteAllText(Path.Combine(pastaTemporaria, "cd-2.json"), """
            [
              {
                "nome": "Exemplo Conjurador",
                "cd": "2",
                "ca": 12,
                "pv": 20,
                "dadoDeVida": "3d8+6",
                "deslocamento": "9 m",
                "atributos": { "forca": 0, "destreza": 0, "constituicao": 1, "inteligencia": 0, "sabedoria": 2, "carisma": 3 },
                "acoes": [
                  { "nome": "Toque Amedrontador", "tipo": "resistencia", "bonusAcerto": null, "atributoResistencia": "sabedoria", "cdResistencia": 12, "dano": null }
                ]
              }
            ]
            """);

            var repositorio = RepositorioMonstrosCombate.CarregarDePasta(pastaTemporaria);

            var monstro = repositorio.Todos.Single();
            var acao = monstro.Acoes.Single();
            Assert.Equal("resistencia", acao.Tipo);
            Assert.Equal("sabedoria", acao.AtributoResistencia);
            Assert.Equal(12, acao.CdResistencia);
            Assert.Null(acao.BonusAcerto);
        }
        finally
        {
            Directory.Delete(pastaTemporaria, recursive: true);
        }
    }
}
