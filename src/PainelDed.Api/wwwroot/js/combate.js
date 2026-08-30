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

    const botaoIniciar = document.createElement('button');
    botaoIniciar.className = 'botao-rolar';
    botaoIniciar.textContent = 'Iniciar combate';
    botaoIniciar.addEventListener('click', async () => {
      const personagemEscolhido = personagens.find((p) => p.id === seletorPersonagem.value);
      const monstroEscolhido = monstros[Number(seletorMonstro.value)];
      await this.iniciarCombate(personagemEscolhido, monstroEscolhido);
    });

    formulario.appendChild(seletorPersonagem);
    formulario.appendChild(seletorMonstro);
    formulario.appendChild(botaoIniciar);
    area.appendChild(formulario);
  },

  async iniciarCombate(personagem, monstro) {
    this.estado = {
      // atributos do jogador vêm da ficha como valores BRUTOS (ex: Sabedoria 13),
      // diferente do banco de monstros, que já guarda MODIFICADORES prontos — por
      // isso convertemos aqui uma vez, pra que o resto do código sempre trabalhe
      // com modificador em ambos os lados (this.modificadorAtributos faz a conversão).
      jogador: { nome: personagem.nome, ca: personagem.ca, pvMax: personagem.pv, pv: personagem.pv, ataques: this.acoesDoJogador(personagem), atributos: this.modificadorAtributos(personagem.atributos), cdMagia: personagem.cdMagia },
      monstro: { nome: monstro.nome, ca: monstro.ca, pvMax: monstro.pv, pv: monstro.pv, atributos: monstro.atributos, acoes: monstro.acoes },
      turnoDoJogador: true,
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
    // Implementado na Task 10 (painel de ação) e Task 11 (passar turno/log/fim).
    const area = document.getElementById('area-combate');
    area.innerHTML = '<p class="carregando">Combate iniciado — painel de ação vem na próxima task.</p>';
  },
};
