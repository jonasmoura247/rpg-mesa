namespace PainelDed.Api.Campanhas;

public class ServicoPersonagens
{
    private readonly RepositorioCampanhas _repositorio;

    public ServicoPersonagens(RepositorioCampanhas repositorio)
    {
        _repositorio = repositorio;
    }

    public List<Personagem>? Listar(string campanhaId)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        return estado is null ? null : estado.Personagens ?? new List<Personagem>();
    }

    public Personagem? Obter(string campanhaId, string personagemId) =>
        Listar(campanhaId)?.FirstOrDefault(p => p.Id == personagemId);

    public Personagem? Importar(string campanhaId, ImportarPersonagemRequisicao requisicao)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var personagens = estado.Personagens ?? new List<Personagem>();
        var existente = personagens.FirstOrDefault(p => p.Nome == requisicao.Nome);

        var personagem = new Personagem(
            existente?.Id ?? Guid.NewGuid().ToString("N")[..8],
            requisicao.Nome,
            requisicao.Raca,
            requisicao.Classe,
            requisicao.Nivel,
            requisicao.Atributos,
            requisicao.Pv,
            requisicao.Ca,
            requisicao.Pericias,
            requisicao.Historia,
            requisicao.CaracteristicasFisicas);

        if (existente is not null)
        {
            personagens[personagens.IndexOf(existente)] = personagem;
        }
        else
        {
            personagens.Add(personagem);
        }

        _repositorio.SalvarEstado(campanhaId, estado with { Personagens = personagens });
        return personagem;
    }
}
