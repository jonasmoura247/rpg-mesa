namespace PainelDed.Api.Campanhas;

public class ServicoHistorico
{
    private const int LimiteDeEntradas = 200;

    private readonly RepositorioCampanhas _repositorio;

    public ServicoHistorico(RepositorioCampanhas repositorio)
    {
        _repositorio = repositorio;
    }

    public List<EntradaHistorico>? Listar(string campanhaId) =>
        _repositorio.CarregarEstado(campanhaId)?.HistoricoRolagens;

    public EntradaHistorico? Registrar(string campanhaId, string descricao)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return null;
        }

        var entrada = new EntradaHistorico(descricao, DateTimeOffset.UtcNow);
        estado.HistoricoRolagens.Insert(0, entrada);

        if (estado.HistoricoRolagens.Count > LimiteDeEntradas)
        {
            estado.HistoricoRolagens.RemoveRange(
                LimiteDeEntradas, estado.HistoricoRolagens.Count - LimiteDeEntradas);
        }

        _repositorio.SalvarEstado(campanhaId, estado);
        return entrada;
    }

    public bool Limpar(string campanhaId)
    {
        var estado = _repositorio.CarregarEstado(campanhaId);
        if (estado is null)
        {
            return false;
        }

        estado.HistoricoRolagens.Clear();
        _repositorio.SalvarEstado(campanhaId, estado);
        return true;
    }
}
