const Rolador = {
  async rolar(nomeSecao, idNota, tituloTabela, elementoResultado) {
    elementoResultado.textContent = '';
    const carregando = document.createElement('p');
    carregando.textContent = 'Rolando…';
    elementoResultado.appendChild(carregando);

    let resultado;
    try {
      resultado = await Api.rolarTabela(nomeSecao, idNota, tituloTabela);
    } catch (erro) {
      elementoResultado.textContent = '';
      const mensagem = document.createElement('p');
      mensagem.className = 'mensagem-erro';
      mensagem.textContent = 'Falha ao rolar esta tabela.';
      elementoResultado.appendChild(mensagem);
      console.error(erro);
      return;
    }

    this.exibirResultado(nomeSecao, resultado, elementoResultado);
    this.registrarHistorico(`${tituloTabela}: ${resultado.valorRolado}`);
  },

  exibirResultado(nomeSecao, resultado, elementoResultado) {
    elementoResultado.textContent = '';

    const bloco = document.createElement('div');
    bloco.className = 'resultado-rolagem';

    const valor = document.createElement('span');
    valor.className = 'valor-rolado';
    valor.textContent = resultado.valorRolado;
    bloco.appendChild(valor);

    const texto = document.createElement('span');
    texto.className = 'texto-resultado';
    texto.textContent = resultado.entrada.texto;
    bloco.appendChild(texto);

    const containerLinks = document.createElement('div');
    containerLinks.className = 'links-resolvidos';
    bloco.appendChild(containerLinks);

    elementoResultado.appendChild(bloco);

    if (resultado.entrada.links) {
      resultado.entrada.links.forEach((link) => {
        this.expandirLink(nomeSecao, link, containerLinks);
      });
    }
  },

  async expandirLink(nomeSecaoOrigem, link, container) {
    const secoesParaTentar = ['mundo', 'glossario', 'regras', 'monstros'];
    for (const secao of secoesParaTentar) {
      try {
        const nota = await Api.obterNota(secao, link.alvo);

        const bloco = document.createElement('div');
        bloco.className = 'link-expandido';

        const titulo = document.createElement('strong');
        titulo.textContent = nota.titulo;
        bloco.appendChild(titulo);

        const paragrafo = document.createElement('p');
        paragrafo.textContent = resumo(nota.corpoMarkdown);
        bloco.appendChild(paragrafo);

        container.appendChild(bloco);
        return;
      } catch {
        continue;
      }
    }

    console.warn(`Link não resolvido em nenhuma seção: '${link.alvo}' (rótulo: '${link.rotulo}')`);
  },

  async registrarHistorico(descricao) {
    try {
      await Api.registrarHistorico(Campanha.ativa.id, descricao);
    } catch (erro) {
      console.error(erro);
    }
    await this.recarregarHistorico();
  },

  async recarregarHistorico() {
    const lista = document.getElementById('historico-rolagens');
    if (!lista) return;

    let historico;
    try {
      historico = await Api.listarHistorico(Campanha.ativa.id);
    } catch (erro) {
      console.error(erro);
      return;
    }

    lista.textContent = '';

    if (historico.length === 0) {
      const vazio = document.createElement('li');
      vazio.className = 'historico-vazio';
      vazio.textContent = 'Nenhuma rolagem ainda.';
      lista.appendChild(vazio);
      return;
    }

    historico.slice(0, 15).forEach((entrada) => {
      const linha = document.createElement('li');
      linha.textContent = entrada.descricao;
      lista.appendChild(linha);
    });
  },

  configurarBotaoLimpar() {
    document.getElementById('botao-limpar-historico').addEventListener('click', async () => {
      if (!window.confirm('Limpar todo o histórico de rolagens desta campanha?')) {
        return;
      }
      try {
        await Api.limparHistorico(Campanha.ativa.id);
      } catch (erro) {
        console.error(erro);
        window.alert('Falha ao limpar histórico.');
        return;
      }
      await this.recarregarHistorico();
    });
  },
};

// Heurística simples, não um parser de markdown: pega a primeira linha não-vazia
// que não seja um cabeçalho (#). Não trata citações (>), listas (-) nem tabelas (|) —
// se a nota linkada começar com um desses, a sintaxe crua aparece no resumo. Aceitável
// para um resumo rápido de "o que é isso", não para leitura formatada.
function resumo(markdown) {
  const linhas = (markdown || '').split('\n').filter((linha) => linha.trim() && !linha.startsWith('#'));
  return (linhas[0] || '').slice(0, 200);
}
