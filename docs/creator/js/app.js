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
  if (etapaAtual === 1) {
    const raca = racaSelecionada();
    if (!raca) {
      mostrarErro('Selecione uma raça.');
      return false;
    }
    if (raca.escolhaLivre) {
      const escolhas = ficha.bonusEscolhidoMeioElfo.filter(Boolean);
      const semDuplicados = new Set(escolhas).size === escolhas.length;
      if (escolhas.length !== raca.escolhaLivre || !semDuplicados) {
        mostrarErro(`Escolha ${raca.escolhaLivre} atributos diferentes para o bônus de +1.`);
        return false;
      }
    }
    return true;
  }
  return true; // etapas seguintes validadas nas próximas tasks
}

const NOMES_ATRIBUTOS = {
  forca: 'Força', destreza: 'Destreza', constituicao: 'Constituição',
  inteligencia: 'Inteligência', sabedoria: 'Sabedoria', carisma: 'Carisma'
};

function renderEtapaAtributos() {
  limparErro();
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
      <input type="text" id="campoNome" placeholder="Ex: Kess Bramo">
    </label>
    <h2>Atributos — Point Buy</h2>
    <p class="pontos-restantes">Pontos restantes: <strong>${pontosRestantes}</strong></p>
    ${linhasAtributos}
  `;

  const campoNome = document.getElementById('campoNome');
  campoNome.value = ficha.nome;
  campoNome.addEventListener('input', evento => {
    ficha.nome = evento.target.value;
    limparErro();
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

function racaSelecionada() {
  return DADOS.RACAS.find(r => r.nome === ficha.raca) || null;
}

function textoBonus(bonus) {
  return Object.entries(bonus).map(([atributo, valor]) => `+${valor} ${NOMES_ATRIBUTOS[atributo]}`).join(', ');
}

function renderEtapaRaca() {
  limparErro();

  const opcoes = DADOS.RACAS.map(raca =>
    `<option value="${raca.nome}" ${ficha.raca === raca.nome ? 'selected' : ''}>${raca.nome}</option>`
  ).join('');

  const raca = racaSelecionada();
  let blocoBonus = '';
  let blocoEscolhaLivre = '';

  if (raca) {
    blocoBonus = `<p class="bonus-raca">Bônus fixo: ${textoBonus(raca.bonus)}</p>`;

    if (raca.escolhaLivre) {
      const atributosDisponiveis = Object.keys(NOMES_ATRIBUTOS).filter(a => !(a in raca.bonus));
      const selects = Array.from({ length: raca.escolhaLivre }).map((_valor, indice) => {
        const opcoesAtributo = atributosDisponiveis.map(atributo =>
          `<option value="${atributo}" ${ficha.bonusEscolhidoMeioElfo[indice] === atributo ? 'selected' : ''}>${NOMES_ATRIBUTOS[atributo]}</option>`
        ).join('');
        return `
          <select class="escolha-livre" data-indice="${indice}">
            <option value="">+1 em qual atributo?</option>
            ${opcoesAtributo}
          </select>`;
      }).join('');
      blocoEscolhaLivre = `<div class="escolhas-livres"><p>Escolha ${raca.escolhaLivre} atributos diferentes para +1 cada:</p>${selects}</div>`;
    }
  }

  elementoConteudo.innerHTML = `
    <h2>Raça</h2>
    <select id="campoRaca">
      <option value="">Selecione uma raça</option>
      ${opcoes}
    </select>
    ${blocoBonus}
    ${blocoEscolhaLivre}
  `;

  document.getElementById('campoRaca').addEventListener('change', evento => {
    ficha.raca = evento.target.value || null;
    ficha.bonusEscolhidoMeioElfo = [];
    renderEtapaRaca();
  });

  document.querySelectorAll('.escolha-livre').forEach(select => {
    select.addEventListener('change', evento => {
      const indice = Number(evento.target.dataset.indice);
      ficha.bonusEscolhidoMeioElfo[indice] = evento.target.value || null;
    });
  });
}

function renderEtapaAtual() {
  limparErro();
  if (etapaAtual === 0) renderEtapaAtributos();
  if (etapaAtual === 1) renderEtapaRaca();
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
