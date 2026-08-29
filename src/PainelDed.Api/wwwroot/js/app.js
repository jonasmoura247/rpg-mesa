const ICONE_SECAO = {
  mundo: '🗺️',
  glossario: '📚',
  regras: '⚔️',
  monstros: '👹',
};

async function carregarArvoreNavegacao() {
  const secoes = ['mundo', 'glossario', 'regras', 'monstros'];
  const container = document.getElementById('arvore-navegacao');
  container.innerHTML = '';

  for (const nomeSecao of secoes) {
    const grupo = document.createElement('details');
    grupo.className = 'grupo-secao';
    grupo.open = true;
    grupo.dataset.secao = nomeSecao;

    try {
      const secao = await Api.obterSecao(nomeSecao);

      const titulo = document.createElement('summary');
      const icone = document.createElement('span');
      icone.className = 'icone-secao';
      icone.textContent = ICONE_SECAO[nomeSecao] || '📄';
      titulo.appendChild(icone);
      titulo.appendChild(document.createTextNode(secao.nome ?? nomeSecao));

      const contagem = document.createElement('span');
      contagem.className = 'contagem-secao';
      contagem.textContent = secao.notas.length;
      titulo.appendChild(contagem);

      grupo.appendChild(titulo);

      const lista = document.createElement('ul');
      secao.notas.forEach((nota) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = nota.titulo;
        link.href = '#';
        link.dataset.textoBusca = nota.titulo.toLowerCase();
        link.addEventListener('click', (evento) => {
          evento.preventDefault();
          document.querySelectorAll('#arvore-navegacao a.ativo').forEach((a) => a.classList.remove('ativo'));
          link.classList.add('ativo');
          exibirNota(nomeSecao, nota.id);
        });
        item.appendChild(link);
        lista.appendChild(item);
      });

      grupo.appendChild(lista);
    } catch (erro) {
      const titulo = document.createElement('summary');
      titulo.textContent = nomeSecao;
      grupo.appendChild(titulo);

      const mensagem = document.createElement('p');
      mensagem.className = 'mensagem-erro';
      mensagem.textContent = 'Falha ao carregar esta seção.';
      grupo.appendChild(mensagem);

      console.error(erro);
    }

    container.appendChild(grupo);
  }

  configurarBusca();
  configurarExpandirRecolherTudo();
}

function configurarExpandirRecolherTudo() {
  document.getElementById('botao-expandir-tudo').addEventListener('click', () => {
    document.querySelectorAll('.grupo-secao').forEach((grupo) => {
      grupo.open = true;
    });
  });

  document.getElementById('botao-recolher-tudo').addEventListener('click', () => {
    document.querySelectorAll('.grupo-secao').forEach((grupo) => {
      grupo.open = false;
    });
  });
}

function configurarBusca() {
  const campoBusca = document.getElementById('campo-busca');
  campoBusca.addEventListener('input', () => {
    const termo = campoBusca.value.trim().toLowerCase();

    document.querySelectorAll('.grupo-secao').forEach((grupo) => {
      let algumVisivelNesseGrupo = false;

      grupo.querySelectorAll('li').forEach((item) => {
        const link = item.querySelector('a');
        const corresponde = !termo || link.dataset.textoBusca.includes(termo);
        item.hidden = !corresponde;
        if (corresponde) {
          algumVisivelNesseGrupo = true;
        }
      });

      grupo.hidden = !algumVisivelNesseGrupo;
      if (termo) {
        grupo.open = true;
      }
    });
  });
}

async function exibirNota(nomeSecao, idNota) {
  const principal = document.getElementById('conteudo-principal');
  principal.innerHTML = '<p class="carregando">Carregando…</p>';

  let nota;
  try {
    nota = await Api.obterNota(nomeSecao, idNota);
  } catch (erro) {
    principal.innerHTML = '<p class="mensagem-erro">Falha ao carregar esta nota.</p>';
    console.error(erro);
    return;
  }

  principal.innerHTML = '';

  const cabecalho = document.createElement('div');
  cabecalho.className = 'cabecalho-nota';

  const tituloIcone = document.createElement('span');
  tituloIcone.className = 'icone-secao';
  tituloIcone.textContent = ICONE_SECAO[nomeSecao] || '📄';
  cabecalho.appendChild(tituloIcone);

  const titulo = document.createElement('h2');
  titulo.textContent = nota.titulo;
  cabecalho.appendChild(titulo);

  principal.appendChild(cabecalho);

  if (nota.corpoMarkdown) {
    const corpo = document.createElement('div');
    corpo.className = 'corpo-nota';
    const titulosTabelasRolaveis = (nota.tabelas || []).map((tabela) => tabela.titulo);
    corpo.appendChild(Markdown.renderizar(nota.corpoMarkdown, titulosTabelasRolaveis));
    principal.appendChild(corpo);
  }

  if (!nota.tabelas || nota.tabelas.length === 0) {
    return;
  }

  const secaoTabelas = document.createElement('div');
  secaoTabelas.className = 'secao-tabelas-rolaveis';

  nota.tabelas.forEach((tabela) => {
    const bloco = document.createElement('section');
    bloco.className = 'bloco-tabela';

    const tituloTabela = document.createElement('h3');

    const textoTitulo = document.createElement('span');
    textoTitulo.textContent = tabela.titulo;
    tituloTabela.appendChild(textoTitulo);

    const dado = document.createElement('span');
    dado.className = 'etiqueta-dado';
    dado.textContent = tabela.dado;
    tituloTabela.appendChild(dado);

    const botao = document.createElement('button');
    botao.className = 'botao-rolar';
    botao.textContent = '🎲 Rolar';
    tituloTabela.appendChild(botao);

    const resultadoContainer = document.createElement('div');
    resultadoContainer.className = 'resultado-rolagem-container';

    botao.addEventListener('click', () => {
      Rolador.rolar(nomeSecao, idNota, tabela.titulo, resultadoContainer);
    });

    bloco.appendChild(tituloTabela);
    bloco.appendChild(resultadoContainer);
    secaoTabelas.appendChild(bloco);
  });

  principal.appendChild(secaoTabelas);
}

document.addEventListener('DOMContentLoaded', async () => {
  await Campanha.inicializar();
  carregarArvoreNavegacao();
  Rolador.configurarBotaoLimpar();
  await Rolador.recarregarHistorico();

  document.getElementById('botao-quadro-quests').addEventListener('click', () => Quests.exibir());
  document.getElementById('botao-jogadores').addEventListener('click', () => Personagens.exibir());

  document.addEventListener('campanha-trocada', () => {
    const mural = document.getElementById('mural-quests');
    if (mural) {
      Quests.recarregar();
    }
    const listaPersonagens = document.getElementById('lista-personagens');
    if (listaPersonagens) {
      Personagens.recarregar();
    }
    Rolador.recarregarHistorico();
  });
});
