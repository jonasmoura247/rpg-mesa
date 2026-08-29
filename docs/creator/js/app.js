const ficha = {
  nome: '',
  raca: null,
  bonusEscolhidoMeioElfo: [],
  classe: null,
  atributosBase: { forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 },
  periciasEscolhidas: [],
  historia: '',
  caracteristicasFisicas: ''
};

let etapaAtual = 0;

const elementoConteudo = document.getElementById('conteudo');
const elementoErro = document.getElementById('mensagemErro');
const botaoVoltar = document.getElementById('btnVoltar');
const botaoAvancar = document.getElementById('btnAvancar');
const itensProgresso = document.querySelectorAll('#progresso li');

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

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
  if (etapaAtual === 2) {
    const classe = classeSelecionada();
    if (!classe) {
      mostrarErro('Selecione uma classe.');
      return false;
    }
    if (ficha.periciasEscolhidas.length !== classe.escolhas) {
      mostrarErro(`Escolha exatamente ${classe.escolhas} perícia(s).`);
      return false;
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
    const tracosTexto = raca.tracos.map(t => `<li><strong>${t.nome}:</strong> ${t.descricao}</li>`).join('');
    blocoBonus = `
      <p class="descricao-opcao">${raca.descricao}</p>
      <p class="bonus-raca">Bônus fixo: ${textoBonus(raca.bonus)}</p>
      <h3>Traços Raciais</h3>
      <ul>${tracosTexto}</ul>`;

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
      limparErro();
    });
  });
}

function classeSelecionada() {
  return DADOS.CLASSES.find(c => c.nome === ficha.classe) || null;
}

function renderEtapaClasse() {
  limparErro();

  const opcoes = DADOS.CLASSES.map(classe =>
    `<option value="${classe.nome}" ${ficha.classe === classe.nome ? 'selected' : ''}>${classe.nome}</option>`
  ).join('');

  const classe = classeSelecionada();
  let blocoPericias = '';

  if (classe) {
    const listaPericias = classe.todasPericias ? DADOS.PERICIAS.map(p => p.nome) : classe.periciasElegiveis;
    const itens = listaPericias.map(nomePericia => {
      const marcado = ficha.periciasEscolhidas.includes(nomePericia);
      return `
        <label class="item-pericia">
          <input type="checkbox" class="checkbox-pericia" value="${nomePericia}" ${marcado ? 'checked' : ''}>
          ${nomePericia}
        </label>`;
    }).join('');

    blocoPericias = `
      <p>Escolha exatamente ${classe.escolhas} perícia(s) — selecionadas: ${ficha.periciasEscolhidas.length}/${classe.escolhas}</p>
      <div class="lista-pericias">${itens}</div>
    `;
  }

  elementoConteudo.innerHTML = `
    <h2>Classe</h2>
    <select id="campoClasse">
      <option value="">Selecione uma classe</option>
      ${opcoes}
    </select>
    ${classe ? `<p class="descricao-opcao">${classe.descricao}</p>` : ''}
    <p class="dado-vida">${classe ? `Dado de Vida: d${classe.dadoDeVida}` : ''}</p>
    ${blocoPericias}
  `;

  document.getElementById('campoClasse').addEventListener('change', evento => {
    ficha.classe = evento.target.value || null;
    ficha.periciasEscolhidas = [];
    renderEtapaClasse();
  });

  document.querySelectorAll('.checkbox-pericia').forEach(checkbox => {
    checkbox.addEventListener('change', evento => {
      const nomePericia = evento.target.value;
      const limite = classeSelecionada().escolhas;
      if (evento.target.checked) {
        if (ficha.periciasEscolhidas.length >= limite) {
          evento.target.checked = false;
          mostrarErro(`Você só pode escolher ${limite} perícia(s) para esta classe.`);
          return;
        }
        ficha.periciasEscolhidas.push(nomePericia);
      } else {
        ficha.periciasEscolhidas = ficha.periciasEscolhidas.filter(p => p !== nomePericia);
      }
      limparErro();
      renderEtapaClasse();
    });
  });
}

function atributosFinais() {
  const raca = racaSelecionada();
  const resultado = { ...ficha.atributosBase };
  Object.entries(raca.bonus).forEach(([atributo, valor]) => {
    resultado[atributo] += valor;
  });
  ficha.bonusEscolhidoMeioElfo.filter(Boolean).forEach(atributo => {
    resultado[atributo] += 1;
  });
  return resultado;
}

function construirFichaFinal() {
  const raca = racaSelecionada();
  const atributos = atributosFinais();
  const classe = classeSelecionada();
  const modConstituicao = Calculo.modificador(atributos.constituicao);
  const modDestreza = Calculo.modificador(atributos.destreza);

  const pericias = ficha.periciasEscolhidas.map(nomePericia => {
    const pericia = DADOS.PERICIAS.find(p => p.nome === nomePericia);
    const modAtributo = Calculo.modificador(atributos[pericia.atributo]);
    return {
      nome: pericia.nome,
      atributo: pericia.atributo,
      proficiente: true,
      bonus: Calculo.bonusPericia(modAtributo, true, 2)
    };
  });

  const bonusProficiencia = 2;
  const iniciativa = modDestreza;
  const bonusAtaqueForca = Calculo.bonusPericia(Calculo.modificador(atributos.forca), true, bonusProficiencia);
  const bonusAtaqueDestreza = Calculo.bonusPericia(modDestreza, true, bonusProficiencia);

  const temConjuracao = Boolean(classe.atributoConjuracao);
  const modConjuracao = temConjuracao ? Calculo.modificador(atributos[classe.atributoConjuracao]) : null;
  const cdMagia = temConjuracao ? Calculo.cdMagia(modConjuracao, bonusProficiencia) : null;
  const bonusAtaqueMagico = temConjuracao ? Calculo.bonusPericia(modConjuracao, true, bonusProficiencia) : null;

  const testesResistencia = Object.keys(NOMES_ATRIBUTOS).map(chave => {
    const mod = Calculo.modificador(atributos[chave]);
    const proficiente = classe.resistencias.includes(chave);
    return { atributo: chave, proficiente, bonus: Calculo.bonusPericia(mod, proficiente, bonusProficiencia) };
  });

  return {
    nome: ficha.nome.trim(),
    raca: ficha.raca,
    classe: ficha.classe,
    nivel: 1,
    atributos,
    pv: Calculo.pvInicial(classe.dadoDeVida, modConstituicao),
    ca: Calculo.caBase(modDestreza),
    pericias,
    iniciativa,
    bonusAtaqueForca,
    bonusAtaqueDestreza,
    cdMagia,
    bonusAtaqueMagico,
    testesResistencia,
    tracosRaciais: raca.tracos,
    historia: ficha.historia.trim(),
    caracteristicasFisicas: ficha.caracteristicasFisicas.trim()
  };
}

function renderEtapaResumo() {
  const dadosFicha = construirFichaFinal();

  const linhasAtributos = Object.keys(NOMES_ATRIBUTOS).map(chave => {
    const valor = dadosFicha.atributos[chave];
    const mod = Calculo.modificador(valor);
    return `<li>${NOMES_ATRIBUTOS[chave]}: ${valor} (${mod >= 0 ? '+' : ''}${mod})</li>`;
  }).join('');

  const linhasPericias = dadosFicha.pericias.map(p =>
    `<li>${p.nome}: ${p.bonus >= 0 ? '+' : ''}${p.bonus}</li>`
  ).join('');

  const destaquesCombate = [
    `<span class="destaque">Iniciativa ${dadosFicha.iniciativa >= 0 ? '+' : ''}${dadosFicha.iniciativa}</span>`,
    `<span class="destaque">Ataque For ${dadosFicha.bonusAtaqueForca >= 0 ? '+' : ''}${dadosFicha.bonusAtaqueForca}</span>`,
    `<span class="destaque">Ataque Des ${dadosFicha.bonusAtaqueDestreza >= 0 ? '+' : ''}${dadosFicha.bonusAtaqueDestreza}</span>`
  ];
  if (dadosFicha.cdMagia !== null) {
    destaquesCombate.push(`<span class="destaque">CD Magia ${dadosFicha.cdMagia}</span>`);
    destaquesCombate.push(`<span class="destaque">Ataque Mágico ${dadosFicha.bonusAtaqueMagico >= 0 ? '+' : ''}${dadosFicha.bonusAtaqueMagico}</span>`);
  }

  const linhasResistencia = dadosFicha.testesResistencia.map(t =>
    `<li>${NOMES_ATRIBUTOS[t.atributo]}${t.proficiente ? ' (proficiente)' : ''}: ${t.bonus >= 0 ? '+' : ''}${t.bonus}</li>`
  ).join('');

  elementoConteudo.innerHTML = `
    <h2>Resumo — ${escaparHtml(dadosFicha.nome)}</h2>
    <p>${dadosFicha.raca} · ${dadosFicha.classe} · Nível ${dadosFicha.nivel}</p>
    <div class="destaques">
      <span class="destaque">PV ${dadosFicha.pv}</span>
      <span class="destaque">CA ${dadosFicha.ca}</span>
    </div>
    <h3>Atributos</h3>
    <ul>${linhasAtributos}</ul>
    <h3>Perícias com proficiência</h3>
    <ul>${linhasPericias.length ? linhasPericias : '<li>Nenhuma</li>'}</ul>
    <h3>Combate</h3>
    <div class="destaques">${destaquesCombate.join('')}</div>
    <h3>Testes de Resistência</h3>
    <ul>${linhasResistencia}</ul>
    <div class="campo-texto-livre">
      <label for="campoHistoria">História (opcional)</label>
      <textarea id="campoHistoria" maxlength="1000" rows="4" placeholder="Uma breve história do personagem..."></textarea>
      <p class="contador-caracteres" id="contadorHistoria">0/1000</p>
    </div>
    <div class="campo-texto-livre">
      <label for="campoCaracteristicas">Características físicas (opcional)</label>
      <textarea id="campoCaracteristicas" maxlength="1000" rows="4" placeholder="Altura, aparência, marcas..."></textarea>
      <p class="contador-caracteres" id="contadorCaracteristicas">0/1000</p>
    </div>
  `;

  configurarCampoTextoLivre('campoHistoria', 'contadorHistoria', 'historia');
  configurarCampoTextoLivre('campoCaracteristicas', 'contadorCaracteristicas', 'caracteristicasFisicas');
}

function configurarCampoTextoLivre(idCampo, idContador, chaveFicha) {
  const campo = document.getElementById(idCampo);
  const contador = document.getElementById(idContador);
  campo.value = ficha[chaveFicha];
  contador.textContent = `${campo.value.length}/1000`;
  campo.addEventListener('input', () => {
    ficha[chaveFicha] = campo.value;
    contador.textContent = `${campo.value.length}/1000`;
  });
}

function baixarFicha() {
  const dadosFicha = construirFichaFinal();
  const conteudo = JSON.stringify(dadosFicha, null, 2);
  const blob = new Blob([conteudo], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const nomeArquivo = `ficha-${dadosFicha.nome.toLowerCase().replace(/\s+/g, '-') || 'personagem'}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function renderEtapaAtual() {
  limparErro();
  if (etapaAtual === 0) renderEtapaAtributos();
  if (etapaAtual === 1) renderEtapaRaca();
  if (etapaAtual === 2) renderEtapaClasse();
  if (etapaAtual === 3) renderEtapaResumo();

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
  } else {
    baixarFicha();
  }
});

renderEtapaAtual();
