const ficha = {
  nome: '',
  raca: null,
  bonusEscolhidoMeioElfo: [],
  classe: null,
  atributosBase: { forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 },
  periciasEscolhidas: []
};

let etapaAtual = 0;

const elementoConteudo = document.getElementById('conteudo');
const elementoErro = document.getElementById('mensagemErro');
const botaoVoltar = document.getElementById('btnVoltar');
const botaoAvancar = document.getElementById('btnAvancar');
const itensProgresso = document.querySelectorAll('#progresso li');

function mostrarErro(mensagem) {
  elementoErro.textContent = mensagem;
  elementoErro.hidden = false;
}

function limparErro() {
  elementoErro.hidden = true;
  elementoErro.textContent = '';
}

function atualizarProgresso() {
  itensProgresso.forEach(item => {
    const etapaDoItem = Number(item.dataset.etapa);
    item.classList.toggle('ativo', etapaDoItem === etapaAtual);
    item.classList.toggle('concluido', etapaDoItem < etapaAtual);
  });
}

function podeAvancar() {
  return true; // sobrescrito nas próximas tasks, uma etapa por vez
}

function renderEtapaAtual() {
  limparErro();
  if (etapaAtual === 0) elementoConteudo.innerHTML = '<p>Etapa de Atributos (em construção)</p>';
  if (etapaAtual === 1) elementoConteudo.innerHTML = '<p>Etapa de Raça (em construção)</p>';
  if (etapaAtual === 2) elementoConteudo.innerHTML = '<p>Etapa de Classe (em construção)</p>';
  if (etapaAtual === 3) elementoConteudo.innerHTML = '<p>Etapa de Resumo (em construção)</p>';

  botaoVoltar.disabled = etapaAtual === 0;
  botaoAvancar.textContent = etapaAtual === 3 ? 'Baixar minha ficha' : 'Avançar';
  atualizarProgresso();
}

botaoVoltar.addEventListener('click', () => {
  if (etapaAtual > 0) {
    etapaAtual -= 1;
    renderEtapaAtual();
  }
});

botaoAvancar.addEventListener('click', () => {
  if (!podeAvancar()) return;
  if (etapaAtual < 3) {
    etapaAtual += 1;
    renderEtapaAtual();
  }
});

renderEtapaAtual();
