async function carregarArvoreNavegacao() {
  const secoes = ['mundo', 'glossario', 'regras', 'monstros'];
  const container = document.getElementById('arvore-navegacao');
  container.innerHTML = '';

  for (const nomeSecao of secoes) {
    const grupo = document.createElement('div');
    grupo.className = 'grupo-secao';

    try {
      const secao = await Api.obterSecao(nomeSecao);

      const titulo = document.createElement('h3');
      titulo.textContent = secao.nome ?? nomeSecao;
      grupo.appendChild(titulo);

      const lista = document.createElement('ul');
      secao.notas.forEach((nota) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = nota.titulo;
        link.href = '#';
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
      const titulo = document.createElement('h3');
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
}

async function exibirNota(nomeSecao, idNota) {
  const principal = document.getElementById('conteudo-principal');
  principal.innerHTML = '<p>Carregando…</p>';

  let nota;
  try {
    nota = await Api.obterNota(nomeSecao, idNota);
  } catch (erro) {
    principal.innerHTML = '<p class="mensagem-erro">Falha ao carregar esta nota.</p>';
    console.error(erro);
    return;
  }

  principal.innerHTML = '';

  const cabecalho = document.createElement('h2');
  cabecalho.textContent = nota.titulo;
  principal.appendChild(cabecalho);

  if (nota.corpoMarkdown) {
    const corpo = document.createElement('div');
    corpo.className = 'corpo-nota';
    corpo.textContent = nota.corpoMarkdown;
    principal.appendChild(corpo);
  }

  if (!nota.tabelas || nota.tabelas.length === 0) {
    const semTabelas = document.createElement('p');
    semTabelas.textContent = 'Esta nota não tem tabelas roláveis.';
    principal.appendChild(semTabelas);
    return;
  }

  nota.tabelas.forEach((tabela) => {
    const bloco = document.createElement('section');
    bloco.className = 'bloco-tabela';

    const titulo = document.createElement('h3');

    const textoTitulo = document.createElement('span');
    textoTitulo.textContent = tabela.titulo;
    titulo.appendChild(textoTitulo);

    const dado = document.createElement('small');
    dado.textContent = `(${tabela.dado})`;
    titulo.appendChild(dado);

    const botao = document.createElement('button');
    botao.className = 'botao-rolar';
    botao.textContent = '🎲 Rolar';
    titulo.appendChild(botao);

    const resultadoContainer = document.createElement('div');
    resultadoContainer.className = 'resultado-rolagem-container';

    botao.addEventListener('click', () => {
      Rolador.rolar(nomeSecao, idNota, tabela.titulo, resultadoContainer);
    });

    bloco.appendChild(titulo);
    bloco.appendChild(resultadoContainer);
    principal.appendChild(bloco);
  });
}

document.addEventListener('DOMContentLoaded', carregarArvoreNavegacao);
