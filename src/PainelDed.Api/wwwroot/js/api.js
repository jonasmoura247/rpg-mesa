const Api = {
  // idNota pode conter "/" (ex: "Costa da Travessia/01-Hexcrawl") e espaços/acentos —
  // cada segmento precisa ser codificado individualmente, preservando as barras.
  codificarIdNota(idNota) {
    return idNota.split('/').map(encodeURIComponent).join('/');
  },

  async obterSecao(nomeSecao) {
    const resposta = await fetch(`/api/conteudo/${encodeURIComponent(nomeSecao)}`);
    if (!resposta.ok) throw new Error(`Falha ao carregar seção ${nomeSecao}`);
    return resposta.json();
  },

  async obterNota(nomeSecao, idNota) {
    const resposta = await fetch(`/api/conteudo/${encodeURIComponent(nomeSecao)}/${this.codificarIdNota(idNota)}`);
    if (!resposta.ok) throw new Error(`Falha ao carregar nota ${idNota}`);
    return resposta.json();
  },

  async rolarTabela(nomeSecao, idNota, tituloTabela) {
    const url = `/api/rolar/${encodeURIComponent(nomeSecao)}/${this.codificarIdNota(idNota)}?tabela=${encodeURIComponent(tituloTabela)}`;
    const resposta = await fetch(url, { method: 'POST' });
    if (!resposta.ok) throw new Error('Falha ao rolar tabela');
    return resposta.json();
  },

  async listarCampanhas() {
    const resposta = await fetch('/api/campanhas');
    if (!resposta.ok) throw new Error('Falha ao listar campanhas');
    return resposta.json();
  },

  async criarCampanha(nome) {
    const resposta = await fetch('/api/campanhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    if (!resposta.ok) throw new Error('Falha ao criar campanha');
    return resposta.json();
  },

  async listarQuests(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests`);
    if (!resposta.ok) throw new Error('Falha ao listar quests');
    return resposta.json();
  },

  async criarQuest(campanhaId, dados) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error('Falha ao criar quest');
    return resposta.json();
  },

  async atualizarQuest(campanhaId, questId, dados) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests/${questId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error('Falha ao atualizar quest');
    return resposta.json();
  },

  async removerQuest(campanhaId, questId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests/${questId}`, { method: 'DELETE' });
    if (!resposta.ok) throw new Error('Falha ao remover quest');
  },

  async gerarIdeiaDeQuest(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests/gerar-ideia`, { method: 'POST' });
    if (!resposta.ok) throw new Error('Falha ao gerar ideia de quest');
    return resposta.json();
  },

  async sortearDesafiosGuilda(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/quests/sortear-desafios-guilda`, { method: 'POST' });
    if (!resposta.ok) throw new Error('Falha ao sortear desafios da guilda');
    return resposta.json();
  },

  async listarHistorico(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/historico`);
    if (!resposta.ok) throw new Error('Falha ao carregar histórico');
    return resposta.json();
  },

  async registrarHistorico(campanhaId, descricao) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/historico`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao }),
    });
    if (!resposta.ok) throw new Error('Falha ao registrar rolagem no histórico');
    return resposta.json();
  },

  async limparHistorico(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/historico`, { method: 'DELETE' });
    if (!resposta.ok) throw new Error('Falha ao limpar histórico');
  },

  async listarPersonagens(campanhaId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/personagens`);
    if (!resposta.ok) throw new Error('Falha ao listar personagens');
    return resposta.json();
  },

  async obterPersonagem(campanhaId, personagemId) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/personagens/${personagemId}`);
    if (!resposta.ok) throw new Error('Falha ao carregar personagem');
    return resposta.json();
  },

  async importarPersonagem(campanhaId, dados) {
    const resposta = await fetch(`/api/campanhas/${campanhaId}/personagens/importar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error('Falha ao importar personagem');
    return resposta.json();
  },
};
