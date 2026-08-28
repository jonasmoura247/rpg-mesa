const Campanha = {
  chaveArmazenamento: 'painel-ded-campanha-ativa',
  ativa: null,

  async inicializar() {
    const campanhas = await Api.listarCampanhas();

    if (campanhas.length === 0) {
      const nome = window.prompt('Nenhuma campanha encontrada. Qual o nome da primeira campanha?', 'Minha Campanha');
      const novaCampanha = await Api.criarCampanha(nome && nome.trim() ? nome.trim() : 'Minha Campanha');
      campanhas.push(novaCampanha);
    }

    const idSalvo = this.obterIdSalvo();
    const campanhaValida = campanhas.find((c) => c.id === idSalvo) || campanhas[0];
    this.ativa = campanhaValida;

    this.renderizarSeletor(campanhas);
    this.salvarIdAtivo(campanhaValida.id);
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

  renderizarSeletor(campanhas) {
    const seletor = document.getElementById('seletor-campanha');
    seletor.innerHTML = '';

    campanhas.forEach((campanha) => {
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

    seletor.addEventListener('change', async () => {
      if (seletor.value === '__nova__') {
        const nome = window.prompt('Nome da nova campanha:');
        if (!nome || !nome.trim()) {
          seletor.value = this.ativa.id;
          return;
        }
        const novaCampanha = await Api.criarCampanha(nome.trim());
        await this.trocarPara(novaCampanha);
        await this.inicializar();
        return;
      }

      const campanhaEscolhida = campanhas.find((c) => c.id === seletor.value);
      await this.trocarPara(campanhaEscolhida);
    });
  },

  async trocarPara(campanha) {
    this.ativa = campanha;
    this.salvarIdAtivo(campanha.id);
    document.dispatchEvent(new CustomEvent('campanha-trocada', { detail: campanha }));
  },
};
