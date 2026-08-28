using System.Text.Json;

namespace PainelDed.Api.Campanhas;

public class RepositorioCampanhas
{
    private static readonly JsonSerializerOptions Opcoes = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
    };

    // Protege a leitura-modificação-escrita de index.json em Criar contra duas requisições
    // HTTP concorrentes (ex: duplo clique em "nova campanha", duas abas abertas) — sem isso,
    // a segunda escrita pode sobrescrever o índice antes da primeira gravar, perdendo uma
    // campanha inteira silenciosamente. RepositorioCampanhas é registrado como singleton no
    // DI, então uma trava de instância cobre todas as requisições do processo.
    //
    // O padrão leia-modifique-escreva de CarregarEstado + SalvarEstado feito pelos serviços
    // (quests, histórico) não tem essa mesma proteção — duas escritas concorrentes no estado
    // da MESMA campanha ainda podem fazer uma perder a outra. Esse risco mais estreito já foi
    // avaliado e aceito no spec do projeto (uso local de um único mestre; a última escrita
    // vence é aceitável nesse contexto) — o corte de proteção aqui é deliberadamente só para
    // o índice de campanhas, que é uma perda de dados mais severa (some a campanha, não só
    // uma rolagem/quest isolada).
    private readonly object _bloqueio = new();

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
        lock (_bloqueio)
        {
            var campanhas = Listar();
            var campanha = new Campanha(Guid.NewGuid().ToString("N")[..8], nome, DateTimeOffset.UtcNow);
            campanhas.Add(campanha);

            File.WriteAllText(CaminhoIndice, JsonSerializer.Serialize(campanhas, Opcoes));
            SalvarEstado(campanha.Id, new EstadoCampanha(new List<Quest>(), new List<EntradaHistorico>()));

            return campanha;
        }
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
        lock (_bloqueio)
        {
            File.WriteAllText(CaminhoEstado(id), JsonSerializer.Serialize(estado, Opcoes));
        }
    }
}
