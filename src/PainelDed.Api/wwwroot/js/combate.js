const NOME_ATRIBUTO_PARA_CHAVE = {
  'força': 'forca',
  'destreza': 'destreza',
  'constituição': 'constituicao',
  'inteligência': 'inteligencia',
  'sabedoria': 'sabedoria',
  'carisma': 'carisma',
};

const Combate = {
  estado: null,

  async exibir() {
    const principal = document.getElementById('conteudo-principal');
    principal.innerHTML = '';
    this.estado = null;

    const cabecalho = document.createElement('div');
    cabecalho.className = 'cabecalho-nota';
    const titulo = document.createElement('h2');
    titulo.textContent = '⚔️ Combate';
    cabecalho.appendChild(titulo);
    principal.appendChild(cabecalho);

    const area = document.createElement('div');
    area.id = 'area-combate';
    principal.appendChild(area);

    await this.renderizarSetup();
  },

  async renderizarSetup() {
    const area = document.getElementById('area-combate');
    area.innerHTML = '<p class="carregando">Carregando…</p>';

    let personagens;
    let monstros;
    try {
      [personagens, monstros] = await Promise.all([
        Api.listarPersonagens(Campanha.ativa.id),
        Api.listarMonstrosCombate(),
      ]);
    } catch (erro) {
      area.innerHTML = '<p class="mensagem-erro">Falha ao carregar personagens ou monstros.</p>';
      console.error(erro);
      return;
    }

    if (personagens.length === 0) {
      area.innerHTML = '<p class="lista-personagens-vazia">Importe um personagem na aba Jogadores antes de montar um combate.</p>';
      return;
    }

    area.innerHTML = '';

    const formulario = document.createElement('div');
    formulario.className = 'setup-combate';

    const seletorPersonagem = document.createElement('select');
    personagens.forEach((p) => {
      const opcao = document.createElement('option');
      opcao.value = p.id;
      opcao.textContent = `${p.nome} (${p.classe})`;
      seletorPersonagem.appendChild(opcao);
    });

    const seletorMonstro = document.createElement('select');
    monstros.forEach((m, indice) => {
      const opcao = document.createElement('option');
      opcao.value = indice;
      opcao.textContent = `${m.nome} (CD ${m.cd})`;
      seletorMonstro.appendChild(opcao);
    });

    const campoIniciativa = document.createElement('label');
    campoIniciativa.className = 'campo-iniciativa-combate';
    const checkboxIniciativa = document.createElement('input');
    checkboxIniciativa.type = 'checkbox';
    checkboxIniciativa.checked = true; // jogador começa por padrão
    campoIniciativa.appendChild(checkboxIniciativa);
    campoIniciativa.appendChild(document.createTextNode(' Jogador ataca primeiro (desmarque se o monstro começa)'));

    const botaoIniciar = document.createElement('button');
    botaoIniciar.className = 'botao-rolar';
    botaoIniciar.textContent = 'Iniciar combate';
    botaoIniciar.addEventListener('click', async () => {
      const personagemEscolhido = personagens.find((p) => p.id === seletorPersonagem.value);
      const monstroEscolhido = monstros[Number(seletorMonstro.value)];
      await this.iniciarCombate(personagemEscolhido, monstroEscolhido, checkboxIniciativa.checked);
    });

    formulario.appendChild(seletorPersonagem);
    formulario.appendChild(seletorMonstro);
    formulario.appendChild(campoIniciativa);
    formulario.appendChild(botaoIniciar);
    area.appendChild(formulario);
  },

  async iniciarCombate(personagem, monstro, jogadorComeca) {
    this.estado = {
      // atributos do jogador vêm da ficha como valores BRUTOS (ex: Sabedoria 13),
      // diferente do banco de monstros, que já guarda MODIFICADORES prontos — por
      // isso convertemos aqui uma vez, pra que o resto do código sempre trabalhe
      // com modificador em ambos os lados (this.modificadorAtributos faz a conversão).
      jogador: { nome: personagem.nome, ca: personagem.ca, pvMax: personagem.pv, pv: personagem.pv, ataques: this.acoesDoJogador(personagem), atributos: this.modificadorAtributos(personagem.atributos), cdMagia: personagem.cdMagia },
      monstro: { nome: monstro.nome, ca: monstro.ca, pvMax: monstro.pv, pv: monstro.pv, atributos: monstro.atributos, acoes: monstro.acoes },
      turnoDoJogador: jogadorComeca,
      log: [],
      terminado: false,
    };
    this.renderizarCombate();
  },

  modificadorAtributos(atributosBrutos) {
    // Reaproveita modificadorAtributo (global, definida em personagens.js) em vez de
    // reimplementar a fórmula de modificador de D&D aqui — evita duas fórmulas
    // divergirem se uma delas for corrigida sem a outra.
    const resultado = {};
    Object.entries(atributosBrutos).forEach(([chave, valor]) => {
      resultado[chave] = modificadorAtributo(valor);
    });
    return resultado;
  },

  acoesDoJogador(personagem) {
    const acoes = [
      { nome: 'Ataque corpo a corpo (Força)', tipo: 'ataque', bonusAcerto: personagem.bonusAtaqueForca, dano: null },
      { nome: 'Ataque à distância (Destreza)', tipo: 'ataque', bonusAcerto: personagem.bonusAtaqueDestreza, dano: null },
    ];
    (personagem.magiasConhecidas || [])
      .filter((m) => m.dano)
      .forEach((m) => {
        acoes.push({
          nome: `✨ ${m.nome}`,
          tipo: m.testeResistencia ? 'resistencia' : 'ataque',
          bonusAcerto: personagem.bonusAtaqueMagico,
          atributoResistencia: m.testeResistencia ? NOME_ATRIBUTO_PARA_CHAVE[m.testeResistencia.toLowerCase()] : null,
          cdMagia: personagem.cdMagia,
          dano: m.dano,
        });
      });
    return acoes;
  },

  renderizarCombate() {
    const area = document.getElementById('area-combate');
    area.innerHTML = '';

    const barras = document.createElement('div');
    barras.className = 'barras-combate';
    barras.appendChild(this.criarBarraVida('jogador', this.estado.jogador));
    barras.appendChild(this.criarBarraVida('monstro', this.estado.monstro));
    area.appendChild(barras);

    if (this.estado.terminado) {
      const vencedor = this.estado.jogador.pv > 0 ? this.estado.jogador.nome : this.estado.monstro.nome;
      const banner = document.createElement('div');
      banner.className = 'banner-fim-combate';
      banner.textContent = `🏆 ${vencedor} venceu!`;
      area.appendChild(banner);

      const botaoNovo = document.createElement('button');
      botaoNovo.className = 'botao-rolar';
      botaoNovo.textContent = 'Novo combate';
      botaoNovo.addEventListener('click', () => this.renderizarSetup());
      area.appendChild(botaoNovo);
      return;
    }

    area.appendChild(this.criarPainelAcao());

    const log = document.createElement('ul');
    log.className = 'log-combate';
    this.estado.log.forEach((linha) => {
      const item = document.createElement('li');
      item.textContent = linha;
      log.appendChild(item);
    });
    area.appendChild(log);
  },

  criarBarraVida(lado, combatente) {
    const container = document.createElement('div');
    container.className = `barra-vida barra-vida-${lado}`;

    const nome = document.createElement('strong');
    nome.textContent = combatente.nome;
    container.appendChild(nome);

    const detalhes = document.createElement('p');
    detalhes.className = 'detalhes-quest';
    detalhes.textContent = `CA ${combatente.ca}`;
    container.appendChild(detalhes);

    const trilho = document.createElement('div');
    trilho.className = 'trilho-vida';
    const preenchimento = document.createElement('div');
    preenchimento.className = 'preenchimento-vida';
    preenchimento.style.width = `${Math.max(0, (combatente.pv / combatente.pvMax) * 100)}%`;
    trilho.appendChild(preenchimento);
    container.appendChild(trilho);

    const texto = document.createElement('p');
    texto.className = 'detalhes-quest';
    texto.textContent = `${combatente.pv}/${combatente.pvMax} PV`;
    container.appendChild(texto);

    return container;
  },

  criarPainelAcao() {
    const painel = document.createElement('div');
    painel.className = 'painel-acao-combate';

    const atacante = this.estado.turnoDoJogador ? this.estado.jogador : this.estado.monstro;
    const alvo = this.estado.turnoDoJogador ? this.estado.monstro : this.estado.jogador;
    const acoesDisponiveis = this.estado.turnoDoJogador ? atacante.ataques : atacante.acoes;

    const tituloTurno = document.createElement('p');
    tituloTurno.textContent = `Turno de: ${atacante.nome}`;
    painel.appendChild(tituloTurno);

    const seletorAcao = document.createElement('select');
    acoesDisponiveis.forEach((acao, indice) => {
      const opcao = document.createElement('option');
      opcao.value = indice;
      opcao.textContent = acao.nome;
      seletorAcao.appendChild(opcao);
    });
    painel.appendChild(seletorAcao);

    const areaDinamica = document.createElement('div');
    areaDinamica.className = 'area-dinamica-acao';
    painel.appendChild(areaDinamica);

    const atualizarAreaDinamica = () => {
      const acao = acoesDisponiveis[Number(seletorAcao.value)];
      areaDinamica.innerHTML = '';
      if (acao.tipo === 'resistencia') {
        areaDinamica.appendChild(this.criarFluxoResistencia(acao, atacante, alvo));
      } else {
        areaDinamica.appendChild(this.criarFluxoAtaque(acao, atacante, alvo));
      }
    };
    seletorAcao.addEventListener('change', atualizarAreaDinamica);
    atualizarAreaDinamica();

    const botaoPassarTurno = document.createElement('button');
    botaoPassarTurno.className = 'botao-secundario';
    botaoPassarTurno.textContent = 'Passar turno';
    botaoPassarTurno.addEventListener('click', () => {
      this.estado.turnoDoJogador = !this.estado.turnoDoJogador;
      this.renderizarCombate();
    });
    painel.appendChild(botaoPassarTurno);

    return painel;
  },

  criarFluxoAtaque(acao, atacante, alvo) {
    const container = document.createElement('div');

    const bonus = acao.bonusAcerto ?? 0;
    const linhaAlvo = document.createElement('p');
    linhaAlvo.className = 'detalhes-quest';
    linhaAlvo.textContent = `Ataque +${bonus} vs CA de ${alvo.nome} (${alvo.ca})`;
    container.appendChild(linhaAlvo);

    const campoD20 = document.createElement('input');
    campoD20.type = 'number';
    campoD20.placeholder = 'd20 rolado';
    container.appendChild(campoD20);

    const resultado = document.createElement('p');
    container.appendChild(resultado);

    const campoDano = document.createElement('input');
    campoDano.type = 'number';
    campoDano.placeholder = 'dano rolado';
    campoDano.hidden = true;
    container.appendChild(campoDano);

    const botaoAplicar = document.createElement('button');
    botaoAplicar.className = 'botao-rolar';
    botaoAplicar.textContent = 'Aplicar';
    botaoAplicar.hidden = true;
    container.appendChild(botaoAplicar);

    campoD20.addEventListener('input', () => {
      const total = Number(campoD20.value) + bonus;
      const acertou = total >= alvo.ca;
      resultado.textContent = acertou ? `Acertou (total ${total})` : `Errou (total ${total})`;
      resultado.style.color = acertou ? 'var(--cor-sucesso, #5a5)' : 'var(--cor-erro, #c53)';
      campoDano.hidden = !acertou;
      botaoAplicar.hidden = !acertou;
    });

    botaoAplicar.addEventListener('click', () => {
      botaoAplicar.disabled = true; // evita aplicar o mesmo dano duas vezes num clique duplo
      const dano = Number(campoDano.value) || 0;
      this.aplicarDano(alvo, dano);
      this.estado.log.push(`${atacante.nome} acertou ${alvo.nome} com ${acao.nome} (${dano} dano)`);
      this.renderizarCombate();
    });

    return container;
  },

  criarFluxoResistencia(acao, atacante, alvo) {
    const container = document.createElement('div');

    const cd = acao.cdResistencia ?? acao.cdMagia ?? 10;
    const linha = document.createElement('p');
    linha.className = 'detalhes-quest';
    linha.textContent = `${alvo.nome} resiste: 1d20 + ${acao.atributoResistencia} vs CD ${cd}`;
    container.appendChild(linha);

    const modificadorAlvo = (alvo.atributos && alvo.atributos[acao.atributoResistencia]) || 0;

    const campoD20 = document.createElement('input');
    campoD20.type = 'number';
    campoD20.placeholder = 'd20 de resistência (só o dado)';
    container.appendChild(campoD20);

    const resultado = document.createElement('p');
    container.appendChild(resultado);

    const campoDano = document.createElement('input');
    campoDano.type = 'number';
    // Campo de dano fica visível independente de passar ou falhar: várias magias
    // (ex: Toque Trovejante) causam METADE do dano mesmo quando o alvo resiste
    // ("metade se passar no teste") — o mestre lê o texto da magia e digita o valor
    // certo (cheio, metade ou zero), o site só aplica o número informado, nunca
    // tenta adivinhar/recalcular a partir da string de dano.
    let passou = false;
    const temDano = Boolean(acao.dano);
    campoDano.hidden = !temDano;
    campoDano.placeholder = temDano ? `dano rolado (${acao.dano})` : 'sem dano';
    container.appendChild(campoDano);

    const botaoAplicar = document.createElement('button');
    botaoAplicar.className = 'botao-rolar';
    botaoAplicar.textContent = 'Registrar resultado';
    botaoAplicar.hidden = !temDano;
    container.appendChild(botaoAplicar);

    campoD20.addEventListener('input', () => {
      const total = Number(campoD20.value) + modificadorAlvo;
      passou = total >= cd;
      resultado.textContent = passou ? `Resistiu (total ${total})` : `Falhou (total ${total})`;
      resultado.style.color = passou ? 'var(--cor-sucesso, #5a5)' : 'var(--cor-erro, #c53)';
      botaoAplicar.hidden = false;
    });

    botaoAplicar.addEventListener('click', () => {
      botaoAplicar.disabled = true; // evita aplicar o mesmo dano duas vezes num clique duplo
      const dano = Number(campoDano.value) || 0;
      if (dano > 0) {
        this.aplicarDano(alvo, dano);
      }
      this.estado.log.push(`${alvo.nome} ${passou ? 'resistiu' : 'falhou'} contra ${acao.nome} de ${atacante.nome}${dano > 0 ? ` (${dano} dano)` : ''}`);
      this.renderizarCombate();
    });

    return container;
  },

  aplicarDano(combatente, dano) {
    combatente.pv = Math.max(0, combatente.pv - dano);
    if (combatente.pv === 0) {
      this.estado.terminado = true;
    }
  },
};
