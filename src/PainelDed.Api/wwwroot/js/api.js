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
};
