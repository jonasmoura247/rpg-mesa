const Campanha = {
  chaveArmazenamento: 'painel-ded-campanha-ativa',
  ativa: null,
  todas: [],
  listenerDeTrocaRegistrado: false,

  async inicializar() {
    let campanhas;
    try {
      campanhas = await Api.listarCampanhas();
    } catch (erro) {
      console.error(erro);
      this.exibirErroFatal('Falha ao carregar campanhas. Recarregue a página.');
      return;
    }

    if (campanhas.length === 0) {
      const nome = window.prompt('Nenhuma campanha encontrada. Qual o nome da primeira campanha?', 'Minha Campanha');
      try {
        const novaCampanha = await Api.criarCampanha(nome && nome.trim() ? nome.trim() : 'Minha Campanha');
        campanhas.push(novaCampanha);
      } catch (erro) {
        console.error(erro);
        this.exibirErroFatal('Falha ao criar a primeira campanha. Recarregue a página.');
        return;
      }
    }

    this.todas = campanhas;
    const idSalvo = this.obterIdSalvo();
    const campanhaValida = campanhas.find((c) => c.id === idSalvo) || campanhas[0];
    this.ativa = campanhaValida;

    this.renderizarSeletor();
    this.registrarListenerDeTroca();
    this.salvarIdAtivo(campanhaValida.id);
  },

  exibirErroFatal(mensagem) {
    const principal = document.getElementById('conteudo-principal');
    if (principal) {
      principal.textContent = '';
      const paragrafo = document.createElement('p');
      paragrafo.className = 'mensagem-erro';
      paragrafo.textContent = mensagem;
      principal.appendChild(paragrafo);
    }
  },

  obterIdSalvo() {
    try {
      return localStorage.getItem(this.chaveArmazenamento);
    } catch {
      return null;
    }
  },

  salvarIdAtivo(id) {
    try {
      localStorage.setItem(this.chaveArmazenamento, id);
    } catch {
      // localStorage indisponível — segue sem persistir a escolha
    }
  },

  renderizarSeletor() {
    const seletor = document.getElementById('seletor-campanha');
    seletor.innerHTML = '';

    this.todas.forEach((campanha) => {
      const opcao = document.createElement('option');
      opcao.value = campanha.id;
      opcao.textContent = campanha.nome;
      opcao.selected = campanha.id === this.ativa.id;
      seletor.appendChild(opcao);
    });

    const opcaoNova = document.createElement('option');
    opcaoNova.value = '__nova__';
    opcaoNova.textContent = '+ Nova campanha…';
    seletor.appendChild(opcaoNova);
  },

  // Registrado uma única vez (guardado por `listenerDeTrocaRegistrado`) — o
  // `<select>` é reconstruído (innerHTML = '') a cada renderizarSeletor(), mas
  // isso só remove os <option> filhos, não os listeners do próprio elemento.
  // Sem essa guarda, cada nova campanha criada acumularia mais um listener de
  // 'change' no mesmo <select>, disparando prompts/criações duplicadas.
  registrarListenerDeTroca() {
    if (this.listenerDeTrocaRegistrado) {
      return;
    }
    this.listenerDeTrocaRegistrado = true;

    const seletor = document.getElementById('seletor-campanha');
    seletor.addEventListener('change', async () => {
      if (seletor.value === '__nova__') {
        const nome = window.prompt('Nome da nova campanha:');
        if (!nome || !nome.trim()) {
          seletor.value = this.ativa.id;
          return;
        }

        let novaCampanha;
        try {
          novaCampanha = await Api.criarCampanha(nome.trim());
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao criar a campanha.');
          seletor.value = this.ativa.id;
          return;
        }

        this.todas.push(novaCampanha);
        await this.trocarPara(novaCampanha);
        this.renderizarSeletor();
        return;
      }

      const campanhaEscolhida = this.todas.find((c) => c.id === seletor.value);
      await this.trocarPara(campanhaEscolhida);
    });
  },

  async trocarPara(campanha) {
    this.ativa = campanha;
    this.salvarIdAtivo(campanha.id);
    // Consumido pelo Quadro de Quests e pelo histórico de rolagens (Tasks 9/10) —
    // nesta task ainda não há nenhum listener registrado, é esperado.
    document.dispatchEvent(new CustomEvent('campanha-trocada', { detail: campanha }));
  },
};
