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
  if (etapaAtual === 0) {
    if (!ficha.nome.trim()) {
      mostrarErro('Preencha o nome do personagem.');
      return false;
    }
    const restantes = Calculo.pontosRestantes(ficha.atributosBase, DADOS.CUSTO_POINT_BUY, DADOS.ORCAMENTO_PONTOS);
    if (restantes !== 0) {
      mostrarErro(`Distribua todos os pontos antes de continuar (faltam ${restantes} ponto(s)).`);
      return false;
    }
    return true;
  }
  return true; // demais etapas validadas nas próximas tasks
}

const NOMES_ATRIBUTOS = {
  forca: 'Força', destreza: 'Destreza', constituicao: 'Constituição',
  inteligencia: 'Inteligência', sabedoria: 'Sabedoria', carisma: 'Carisma'
};

function renderEtapaAtributos() {
  const pontosRestantes = Calculo.pontosRestantes(ficha.atributosBase, DADOS.CUSTO_POINT_BUY, DADOS.ORCAMENTO_PONTOS);

  const linhasAtributos = Object.keys(NOMES_ATRIBUTOS).map(chave => {
    const valor = ficha.atributosBase[chave];
    return `
      <div class="linha-atributo">
        <span class="nome-atributo">${NOMES_ATRIBUTOS[chave]}</span>
        <button type="button" class="botao-passo" data-atributo="${chave}" data-delta="-1" ${valor <= DADOS.ATRIBUTO_MINIMO ? 'disabled' : ''}>−</button>
        <span class="valor-atributo">${valor}</span>
        <button type="button" class="botao-passo" data-atributo="${chave}" data-delta="1" ${valor >= DADOS.ATRIBUTO_MAXIMO ? 'disabled' : ''}>+</button>
      </div>`;
  }).join('');

  elementoConteudo.innerHTML = `
    <label class="campo-nome">
      Nome do personagem
      <input type="text" id="campoNome" value="${ficha.nome}" placeholder="Ex: Kess Bramo">
    </label>
    <h2>Atributos — Point Buy</h2>
    <p class="pontos-restantes">Pontos restantes: <strong>${pontosRestantes}</strong></p>
    ${linhasAtributos}
  `;

  document.getElementById('campoNome').addEventListener('input', evento => {
    ficha.nome = evento.target.value;
  });

  document.querySelectorAll('.botao-passo').forEach(botao => {
    botao.addEventListener('click', () => {
      const atributo = botao.dataset.atributo;
      const delta = Number(botao.dataset.delta);
      const novoValor = ficha.atributosBase[atributo] + delta;
      if (novoValor < DADOS.ATRIBUTO_MINIMO || novoValor > DADOS.ATRIBUTO_MAXIMO) return;
      ficha.atributosBase[atributo] = novoValor;
      renderEtapaAtributos();
    });
  });
}

function renderEtapaAtual() {
  limparErro();
  if (etapaAtual === 0) renderEtapaAtributos();
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
