const ficha = {
  nome: '',
  raca: null,
  bonusEscolhidoMeioElfo: [],
  classe: null,
  atributosBase: { forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, carisma: 8 },
  periciasEscolhidas: [],
  equipamento: { pacoteIndice: null, escolhasAtributo: {}, duasMaos: {} },
  magiasEscolhidas: [],
  historia: '',
  caracteristicasFisicas: ''
};

let etapaAtual = 0;

const elementoConteudo = document.getElementById('conteudo');
const elementoErro = document.getElementById('mensagemErro');
const botaoVoltar = document.getElementById('btnVoltar');
const botaoAvancar = document.getElementById('btnAvancar');
const elementoProgresso = document.getElementById('progresso');

const NOMES_ETAPAS = { raca: 'Raça', classe: 'Classe', atributos: 'Atributos', equipamento: 'Equipamento', magias: 'Magias', resumo: 'Resumo' };

function classeTemMagias() {
  const classe = classeSelecionada();
  return Boolean(classe && classe.magias);
}

function etapas() {
  const passos = ['raca', 'classe', 'atributos', 'equipamento'];
  if (classeTemMagias()) passos.push('magias');
  passos.push('resumo');
  return passos;
}

function renderizarListaProgresso() {
  elementoProgresso.innerHTML = etapas().map((passo, indice) =>
    `<li data-etapa="${indice}">${NOMES_ETAPAS[passo]}</li>`
  ).join('');
}

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
  document.querySelectorAll('#progresso li').forEach(item => {
    const etapaDoItem = Number(item.dataset.etapa);
    item.classList.toggle('ativo', etapaDoItem === etapaAtual);
    item.classList.toggle('concluido', etapaDoItem < etapaAtual);
  });
}

function podeAvancar() {
  const passo = etapas()[etapaAtual];
  if (passo === 'atributos') {
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
  if (passo === 'raca') {
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
  if (passo === 'classe') {
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
  if (passo === 'equipamento') {
    const pacote = pacoteEquipamentoSelecionado();
    if (!pacote) {
      mostrarErro('Escolha um pacote de equipamento.');
      return false;
    }
    const armasComFineza = pacote.armas.filter(nomeArma =>
      DADOS.ARMAS.find(a => a.nome === nomeArma).propriedades.includes('fineza')
    );
    const faltaEscolherAtributo = armasComFineza.some(nomeArma => !ficha.equipamento.escolhasAtributo[nomeArma]);
    if (faltaEscolherAtributo) {
      mostrarErro('Escolha Força ou Destreza para toda arma com Fineza.');
      return false;
    }
    return true;
  }
  if (passo === 'magias') {
    const { limiteCantrips, limiteNivel1, cantripsEscolhidos, nivel1Escolhidas } = infoEscolhaMagias();
    if (cantripsEscolhidos.length !== limiteCantrips || nivel1Escolhidas.length !== limiteNivel1) {
      mostrarErro(`Escolha exatamente ${limiteCantrips} cantrip(s) e ${limiteNivel1} magia(s) de 1º círculo.`);
      return false;
    }
    return true;
  }
  return true; // etapa resumo não exige validação de avanço
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
    const custoIncremento = valor < DADOS.ATRIBUTO_MAXIMO ? DADOS.CUSTO_POINT_BUY[valor + 1] - DADOS.CUSTO_POINT_BUY[valor] : Infinity;
    const semPontosParaIncrementar = custoIncremento > pontosRestantes;
    return `
      <div class="linha-atributo">
        <span class="nome-atributo">${NOMES_ATRIBUTOS[chave]}</span>
        <button type="button" class="botao-passo" data-atributo="${chave}" data-delta="-1" ${valor <= DADOS.ATRIBUTO_MINIMO ? 'disabled' : ''}>−</button>
        <span class="valor-atributo">${valor}</span>
        <button type="button" class="botao-passo" data-atributo="${chave}" data-delta="1" ${valor >= DADOS.ATRIBUTO_MAXIMO || semPontosParaIncrementar ? 'disabled' : ''}>+</button>
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
      if (delta > 0) {
        const restantesAtuais = Calculo.pontosRestantes(ficha.atributosBase, DADOS.CUSTO_POINT_BUY, DADOS.ORCAMENTO_PONTOS);
        const custoIncremento = DADOS.CUSTO_POINT_BUY[novoValor] - DADOS.CUSTO_POINT_BUY[ficha.atributosBase[atributo]];
        if (custoIncremento > restantesAtuais) return;
      }
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
      const pericia = DADOS.PERICIAS.find(p => p.nome === nomePericia);
      const descricao = pericia && pericia.descricao ? pericia.descricao : '';
      return `
        <label class="item-pericia" data-tooltip="${descricao.replace(/"/g, '&quot;')}">
          <input type="checkbox" class="checkbox-pericia" value="${nomePericia}" ${marcado ? 'checked' : ''}>
          ${nomePericia}
        </label>`;
    }).join('');

    blocoPericias = `
      <p>Escolha exatamente ${classe.escolhas} perícia(s) — selecionadas: ${ficha.periciasEscolhidas.length}/${classe.escolhas}</p>
      <div class="lista-pericias">${itens}</div>
    `;
  }

  const habilidadesTexto = classe
    ? classe.habilidades.map(h => `<li><strong>Nível ${h.nivel} — ${h.nome}:</strong> ${h.descricao}</li>`).join('')
    : '';

  elementoConteudo.innerHTML = `
    <h2>Classe</h2>
    <select id="campoClasse">
      <option value="">Selecione uma classe</option>
      ${opcoes}
    </select>
    ${classe ? `<p class="descricao-opcao">${classe.descricao}</p>` : ''}
    <p class="dado-vida">${classe ? `Dado de Vida: d${classe.dadoDeVida}` : ''}</p>
    ${classe ? `<h3>Habilidades (Níveis 1-5)</h3><ul>${habilidadesTexto}</ul>` : ''}
    ${blocoPericias}
  `;

  document.getElementById('campoClasse').addEventListener('change', evento => {
    ficha.classe = evento.target.value || null;
    ficha.periciasEscolhidas = [];
    ficha.equipamento = { pacoteIndice: null, escolhasAtributo: {}, duasMaos: {} };
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

function pacotesDaClasse() {
  const classe = classeSelecionada();
  return classe ? (DADOS.PACOTES_EQUIPAMENTO[classe.nome] || []) : [];
}

function pacoteEquipamentoSelecionado() {
  const pacotes = pacotesDaClasse();
  return ficha.equipamento.pacoteIndice !== null ? pacotes[ficha.equipamento.pacoteIndice] : null;
}

function renderEtapaEquipamento() {
  limparErro();
  const pacotes = pacotesDaClasse();
  const modDestreza = Calculo.modificador(atributosFinais().destreza);

  const cartoes = pacotes.map((pacote, indice) => {
    const armadura = pacote.armadura ? DADOS.ARMADURAS.find(a => a.nome === pacote.armadura) : null;
    const caPrevia = Calculo.caArmadura(armadura, pacote.escudo, modDestreza);
    const selecionado = ficha.equipamento.pacoteIndice === indice;
    return `
      <label class="pacote-equipamento ${selecionado ? 'selecionado' : ''}">
        <input type="radio" name="pacoteEquipamento" value="${indice}" ${selecionado ? 'checked' : ''}>
        <strong>${pacote.rotulo}</strong>
        <span class="detalhes-magia">${pacote.armas.join(' + ')}${pacote.escudo ? ' + Escudo' : ''}${armadura ? ` · ${armadura.nome}` : ' · Sem armadura'}</span>
        <span class="descricao-opcao">CA ${caPrevia}</span>
      </label>`;
  }).join('');

  const pacote = pacoteEquipamentoSelecionado();
  let blocoEscolhas = '';
  if (pacote) {
    const linhas = pacote.armas.map(nomeArma => {
      const arma = DADOS.ARMAS.find(a => a.nome === nomeArma);
      let linha = '';
      if (arma.propriedades.includes('fineza')) {
        const escolhida = ficha.equipamento.escolhasAtributo[nomeArma] || '';
        linha += `
          <label class="campo-nome">
            ${nomeArma} — usar Força ou Destreza?
            <select class="campoFinezaArma" data-arma="${nomeArma}">
              <option value="">Selecione</option>
              <option value="forca" ${escolhida === 'forca' ? 'selected' : ''}>Força</option>
              <option value="destreza" ${escolhida === 'destreza' ? 'selected' : ''}>Destreza</option>
            </select>
          </label>`;
      }
      if (arma.propriedades.includes('versatil') && !pacote.escudo) {
        const duasMaos = Boolean(ficha.equipamento.duasMaos[nomeArma]);
        linha += `
          <label class="item-pericia">
            <input type="checkbox" class="campoDuasMaosArma" data-arma="${nomeArma}" ${duasMaos ? 'checked' : ''}>
            Empunhar ${nomeArma} com duas mãos (dano ${arma.danoVersatil})
          </label>`;
      }
      return linha;
    }).join('');
    blocoEscolhas = linhas.trim() ? `<div class="escolhas-livres">${linhas}</div>` : '';
  }

  elementoConteudo.innerHTML = `
    <h2>Equipamento</h2>
    <p>Escolha um pacote de equipamento inicial:</p>
    <div class="grade-pacotes">${cartoes}</div>
    ${blocoEscolhas}
  `;

  document.querySelectorAll('input[name="pacoteEquipamento"]').forEach(radio => {
    radio.addEventListener('change', evento => {
      ficha.equipamento.pacoteIndice = Number(evento.target.value);
      ficha.equipamento.escolhasAtributo = {};
      ficha.equipamento.duasMaos = {};
      limparErro();
      renderEtapaEquipamento();
    });
  });

  document.querySelectorAll('.campoFinezaArma').forEach(select => {
    select.addEventListener('change', evento => {
      ficha.equipamento.escolhasAtributo[evento.target.dataset.arma] = evento.target.value || null;
      limparErro();
    });
  });

  document.querySelectorAll('.campoDuasMaosArma').forEach(checkbox => {
    checkbox.addEventListener('change', evento => {
      ficha.equipamento.duasMaos[evento.target.dataset.arma] = evento.target.checked;
    });
  });
}

function infoEscolhaMagias() {
  const classe = classeSelecionada();
  const infoMagias = classe.magias;
  const atributos = atributosFinais();
  const modConjuracao = Calculo.modificador(atributos[classe.atributoConjuracao]);

  const limiteCantrips = infoMagias.cantripsConhecidos;
  const limiteNivel1 = Calculo.quantidadeMagiasNivel1(infoMagias, modConjuracao);

  const cantripsDisponiveis = DADOS_MAGIAS.MAGIAS.filter(m => m.circulo === 0 && m.classes.includes(ficha.classe));
  const nivel1Disponiveis = DADOS_MAGIAS.MAGIAS.filter(m => m.circulo === 1 && m.classes.includes(ficha.classe));

  const cantripsEscolhidos = ficha.magiasEscolhidas.filter(nome => cantripsDisponiveis.some(m => m.nome === nome));
  const nivel1Escolhidas = ficha.magiasEscolhidas.filter(nome => nivel1Disponiveis.some(m => m.nome === nome));

  return { limiteCantrips, limiteNivel1, cantripsDisponiveis, nivel1Disponiveis, cantripsEscolhidos, nivel1Escolhidas };
}

function renderEtapaMagias() {
  limparErro();
  const { limiteCantrips, limiteNivel1, cantripsDisponiveis, nivel1Disponiveis, cantripsEscolhidos, nivel1Escolhidas } = infoEscolhaMagias();

  function renderizarLista(lista, escolhidas) {
    return lista.map(magia => {
      const marcado = escolhidas.includes(magia.nome) ? 'checked' : '';
      const detalhes = [magia.escola, magia.tempoConjuracao, magia.alcance, magia.duracao].join(' · ');
      return `
        <label class="opcao-magia">
          <input type="checkbox" class="checkbox-magia" data-magia="${magia.nome}" ${marcado}>
          <strong>${magia.nome}</strong>
          <span class="detalhes-magia">${detalhes}</span>
          <span class="descricao-opcao">${magia.descricao}</span>
        </label>
      `;
    }).join('');
  }

  elementoConteudo.innerHTML = `
    <h2>Magias</h2>
    <p class="dado-vida">Cantrips (${cantripsEscolhidos.length}/${limiteCantrips} escolhidos)</p>
    <div id="listaCantrips">${renderizarLista(cantripsDisponiveis, cantripsEscolhidos)}</div>
    <p class="dado-vida">Magias de 1º Círculo (${nivel1Escolhidas.length}/${limiteNivel1} escolhidas)</p>
    <div id="listaMagiasNivel1">${renderizarLista(nivel1Disponiveis, nivel1Escolhidas)}</div>
  `;

  function configurarCheckbox(container, disponiveis, limite) {
    container.querySelectorAll('.checkbox-magia').forEach(input => {
      input.addEventListener('change', () => {
        const nomeMagia = input.dataset.magia;
        const jaEscolhida = ficha.magiasEscolhidas.includes(nomeMagia);
        const escolhidasDesseGrupo = ficha.magiasEscolhidas.filter(nome => disponiveis.some(m => m.nome === nome));
        if (input.checked && !jaEscolhida) {
          if (escolhidasDesseGrupo.length >= limite) {
            input.checked = false;
            mostrarErro(`Você já escolheu o máximo de ${limite} para este grupo.`);
            return;
          }
          ficha.magiasEscolhidas.push(nomeMagia);
          limparErro();
        } else if (!input.checked && jaEscolhida) {
          ficha.magiasEscolhidas = ficha.magiasEscolhidas.filter(nome => nome !== nomeMagia);
          limparErro();
        }
        renderEtapaMagias();
      });
    });
  }

  configurarCheckbox(document.getElementById('listaCantrips'), cantripsDisponiveis, limiteCantrips);
  configurarCheckbox(document.getElementById('listaMagiasNivel1'), nivel1Disponiveis, limiteNivel1);
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

  const pacoteEquipamento = pacoteEquipamentoSelecionado();
  const armaduraEquipada = pacoteEquipamento && pacoteEquipamento.armadura
    ? DADOS.ARMADURAS.find(a => a.nome === pacoteEquipamento.armadura)
    : null;
  const temEscudo = Boolean(pacoteEquipamento && pacoteEquipamento.escudo);
  const ca = Calculo.caArmadura(armaduraEquipada, temEscudo, modDestreza);

  const armas = (pacoteEquipamento ? pacoteEquipamento.armas : []).map(nomeArma => {
    const arma = DADOS.ARMAS.find(a => a.nome === nomeArma);
    const usaDuasMaos = Boolean(ficha.equipamento.duasMaos[nomeArma]);
    const dano = usaDuasMaos && arma.danoVersatil ? arma.danoVersatil : arma.dano;
    const atributo = arma.propriedades.includes('fineza')
      ? ficha.equipamento.escolhasAtributo[nomeArma]
      : (arma.tipo === 'distancia' ? 'destreza' : 'forca');
    const modAtributo = Calculo.modificador(atributos[atributo]);
    return {
      nome: arma.nome,
      dano,
      tipoDano: arma.tipoDano,
      atributo,
      bonusAcerto: Calculo.bonusPericia(modAtributo, true, bonusProficiencia),
      modDano: modAtributo
    };
  });

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
    ca,
    pericias,
    armadura: armaduraEquipada ? armaduraEquipada.nome : null,
    escudo: temEscudo,
    armas,
    iniciativa,
    bonusAtaqueForca,
    bonusAtaqueDestreza,
    cdMagia,
    bonusAtaqueMagico,
    testesResistencia,
    tracosRaciais: raca.tracos,
    habilidadesClasse: classe.habilidades.filter(h => h.nivel <= 1),
    magiasConhecidas: ficha.magiasEscolhidas.map(nome => DADOS_MAGIAS.MAGIAS.find(m => m.nome === nome)),
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

  const blocoEquipamento = `
    <h3>Equipamento</h3>
    <p>${dadosFicha.armadura || 'Sem armadura'}${dadosFicha.escudo ? ' + Escudo' : ''}</p>
    <div class="lista-magias-resumo">
      ${dadosFicha.armas.map(arma => `
        <div class="opcao-magia">
          <strong>${arma.nome}</strong>
          <span class="detalhes-magia">${arma.dano} ${arma.tipoDano} · Ataque ${arma.bonusAcerto >= 0 ? '+' : ''}${arma.bonusAcerto} · Dano +${arma.modDano}</span>
        </div>
      `).join('')}
    </div>
  `;

  const blocoMagias = dadosFicha.magiasConhecidas.length ? `
    <h3>Magias</h3>
    <div class="lista-magias-resumo">
      ${dadosFicha.magiasConhecidas.map(magia => `
        <div class="opcao-magia">
          <strong>${magia.nome}</strong> ${magia.circulo === 0 ? '(Cantrip)' : `(1º Círculo)`}
          <span class="detalhes-magia">${[magia.escola, magia.tempoConjuracao, magia.alcance, magia.duracao].join(' · ')}</span>
          <span class="descricao-opcao">${magia.descricao}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

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
    ${blocoEquipamento}
    ${blocoMagias}
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
  renderizarListaProgresso();

  const passo = etapas()[etapaAtual];
  if (passo === 'atributos') renderEtapaAtributos();
  if (passo === 'raca') renderEtapaRaca();
  if (passo === 'classe') renderEtapaClasse();
  if (passo === 'equipamento') renderEtapaEquipamento();
  if (passo === 'magias') renderEtapaMagias();
  if (passo === 'resumo') renderEtapaResumo();

  const ultimaEtapa = etapas().length - 1;
  botaoVoltar.disabled = etapaAtual === 0;
  botaoAvancar.textContent = etapaAtual === ultimaEtapa ? 'Baixar minha ficha' : 'Avançar';
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
  const ultimaEtapa = etapas().length - 1;
  if (etapaAtual < ultimaEtapa) {
    etapaAtual += 1;
    renderEtapaAtual();
  } else {
    baixarFicha();
  }
});

renderEtapaAtual();
