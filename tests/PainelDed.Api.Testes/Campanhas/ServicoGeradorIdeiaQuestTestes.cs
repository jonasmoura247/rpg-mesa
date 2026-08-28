using System;
using System.Collections.Generic;
using PainelDed.Api.Campanhas;
using PainelDed.Api.Conteudo;
using PainelDed.Api.Rolagem;
using PainelDed.Api.Testes.Rolagem;
using PainelDed.Nucleo.Modelos;
using Xunit;

namespace PainelDed.Api.Testes.Campanhas;

public class ServicoGeradorIdeiaQuestTestes
{
    private static RepositorioConteudo CriarRepositorioComAsQuatroNotas()
    {
        var notas = new List<NotaConteudo>
        {
            new("Costa da Travessia/09-Fortaleza", "Fortaleza", "conteudo", new List<TabelaRolagem>
            {
                new("Tipo", "1d6", new List<EntradaTabela> { new(1, 6, "Forte de fronteira.", new()) }),
            }),
            new("Costa da Travessia/05-Ruinas", "Ruínas", "conteudo", new List<TabelaRolagem>
            {
                new("Tipo", "1d6", new List<EntradaTabela> { new(1, 6, "Antigo lugarejo destruído.", new()) }),
            }),
            new("Costa da Travessia/03-Assentamento", "Assentamento", "conteudo", new List<TabelaRolagem>
            {
                new("Tipo", "1d6", new List<EntradaTabela> { new(1, 6, "Lugarejo.", new()) }),
            }),
            new("Costa da Travessia/10-Encontros-Aleatorios", "Encontros Aleatórios", "conteudo", new List<TabelaRolagem>
            {
                new("Tipo", "1d6", new List<EntradaTabela> { new(1, 6, "Criaturas.", new()) }),
            }),
        };

        return new RepositorioConteudo(new[] { new SecaoConteudo("mundo", notas) });
    }

    [Fact]
    public void GerarRascunho_ComDadoFixoEm1_EscolheFortalezaERolaSuasTabelas()
    {
        var repositorio = CriarRepositorioComAsQuatroNotas();
        var servicoRolagem = new ServicoRolagem(repositorio, new DadoFixo(1));
        var servico = new ServicoGeradorIdeiaQuest(repositorio, servicoRolagem, new DadoFixo(1));

        var rascunho = servico.GerarRascunho();

        Assert.NotNull(rascunho);
        Assert.Equal("Fortaleza", rascunho!.TituloSugerido);
        Assert.Contains("Tipo: Forte de fronteira.", rascunho.DescricaoSugerida);
    }

    [Fact]
    public void GerarRascunho_ComDadoFixoEm4_EscolheEncontrosAleatorios()
    {
        var repositorio = CriarRepositorioComAsQuatroNotas();
        var servicoRolagem = new ServicoRolagem(repositorio, new DadoFixo(1));
        var servico = new ServicoGeradorIdeiaQuest(repositorio, servicoRolagem, new DadoFixo(4));

        var rascunho = servico.GerarRascunho();

        Assert.Equal("Encontros Aleatórios", rascunho!.TituloSugerido);
    }

    [Fact]
    public void GerarRascunho_ComSecaoMundoAusente_RetornaNulo()
    {
        var repositorioVazio = new RepositorioConteudo(Array.Empty<SecaoConteudo>());
        var servicoRolagem = new ServicoRolagem(repositorioVazio, new DadoFixo(1));
        var servico = new ServicoGeradorIdeiaQuest(repositorioVazio, servicoRolagem, new DadoFixo(1));

        Assert.Null(servico.GerarRascunho());
    }
}
