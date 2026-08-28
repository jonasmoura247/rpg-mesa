using System.Text.Json;

namespace PainelDed.Api.Campanhas;

public class RepositorioCampanhas
{
    private static readonly JsonSerializerOptions Opcoes = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
    };

    private readonly string _pastaCampanhas;

    public RepositorioCampanhas(string pastaCampanhas)
    {
        _pastaCampanhas = pastaCampanhas;
        Directory.CreateDirectory(_pastaCampanhas);
    }

    private string CaminhoIndice => Path.Combine(_pastaCampanhas, "index.json");

    private string CaminhoEstado(string id) => Path.Combine(_pastaCampanhas, $"{id}.json");

    public List<Campanha> Listar()
    {
        if (!File.Exists(CaminhoIndice))
        {
            return new List<Campanha>();
        }

        var json = File.ReadAllText(CaminhoIndice);
        return JsonSerializer.Deserialize<List<Campanha>>(json, Opcoes) ?? new List<Campanha>();
    }

    public Campanha Criar(string nome)
    {
        var campanhas = Listar();
        var campanha = new Campanha(Guid.NewGuid().ToString("N")[..8], nome, DateTimeOffset.UtcNow);
        campanhas.Add(campanha);

        File.WriteAllText(CaminhoIndice, JsonSerializer.Serialize(campanhas, Opcoes));
        SalvarEstado(campanha.Id, new EstadoCampanha(new List<Quest>(), new List<EntradaHistorico>()));

        return campanha;
    }

    public Campanha? Obter(string id) => Listar().FirstOrDefault(c => c.Id == id);

    public EstadoCampanha? CarregarEstado(string id)
    {
        if (Obter(id) is null)
        {
            return null;
        }

        var caminho = CaminhoEstado(id);
        if (!File.Exists(caminho))
        {
            return new EstadoCampanha(new List<Quest>(), new List<EntradaHistorico>());
        }

        var json = File.ReadAllText(caminho);
        return JsonSerializer.Deserialize<EstadoCampanha>(json, Opcoes)
            ?? new EstadoCampanha(new List<Quest>(), new List<EntradaHistorico>());
    }

    public void SalvarEstado(string id, EstadoCampanha estado)
    {
        File.WriteAllText(CaminhoEstado(id), JsonSerializer.Serialize(estado, Opcoes));
    }
}
