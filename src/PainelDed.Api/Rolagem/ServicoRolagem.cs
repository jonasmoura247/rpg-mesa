using PainelDed.Api.Conteudo;
using PainelDed.Nucleo.Modelos;
using PainelDed.Nucleo.Rolagem;

namespace PainelDed.Api.Rolagem;

public class ServicoRolagem
{
    private readonly RepositorioConteudo _repositorio;
    private readonly IDado _dado;

    public ServicoRolagem(RepositorioConteudo repositorio, IDado dado)
    {
        _repositorio = repositorio;
        _dado = dado;
    }

    public ResultadoRolagem? Rolar(string nomeSecao, string idNota, string tituloTabela)
    {
        var nota = _repositorio.ObterNota(nomeSecao, idNota);
        var tabela = nota?.Tabelas.FirstOrDefault(t => t.Titulo == tituloTabela);
        if (tabela is null)
        {
            return null;
        }

        var valor = _dado.Rolar(tabela.Dado);

        // Salvaguarda: se as faixas da tabela não cobrirem o valor rolado (conteúdo com
        // gap entre entradas, ou dado declarado maior que a maior faixa cadastrada),
        // usa a última entrada em vez de lançar. Não deveria disparar com conteúdo bem
        // formado — se disparar em produção, é sinal de faixa mal cadastrada no vault.
        var entrada = tabela.Entradas.FirstOrDefault(e => valor >= e.FaixaInicio && valor <= e.FaixaFim)
            ?? tabela.Entradas[^1];

        return new ResultadoRolagem(tabela.Titulo, tabela.Dado, valor, entrada);
    }
}
