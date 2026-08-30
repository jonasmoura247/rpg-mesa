const NOMES_ATRIBUTOS_PERSONAGEM = {
  forca: 'Força', destreza: 'Destreza', constituicao: 'Constituição',
  inteligencia: 'Inteligência', sabedoria: 'Sabedoria', carisma: 'Carisma',
};

function modificadorAtributo(valor) {
  return Math.floor((valor - 10) / 2);
}

function formatarComSinal(numero) {
  return numero >= 0 ? `+${numero}` : `${numero}`;
}

const Personagens = {
  async exibir() {
    const principal = document.getElementById('conteudo-principal');
    principal.innerHTML = '';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'cabecalho-nota';
    const titulo = document.createElement('h2');
    titulo.textContent = '🧑‍🤝‍🧑 Jogadores';
    cabecalho.appendChild(titulo);

    const campoArquivo = document.createElement('input');
    campoArquivo.type = 'file';
    campoArquivo.accept = 'application/json';
    campoArquivo.hidden = true;
    campoArquivo.addEventListener('change', async () => {
      const arquivo = campoArquivo.files[0];
      campoArquivo.value = '';
      if (arquivo) {
        await this.importarArquivo(arquivo);
      }
    });
    cabecalho.appendChild(campoArquivo);

    const botaoImportar = document.createElement('button');
    botaoImportar.className = 'botao-rolar';
    botaoImportar.style.marginLeft = 'auto';
    botaoImportar.textContent = '+ Importar Ficha';
    botaoImportar.addEventListener('click', () => campoArquivo.click());
    cabecalho.appendChild(botaoImportar);

    principal.appendChild(cabecalho);

    const layout = document.createElement('div');
    layout.className = 'layout-jogadores';

    const lista = document.createElement('div');
    lista.id = 'lista-personagens';
    lista.className = 'lista-personagens';
    layout.appendChild(lista);

    const detalhe = document.createElement('div');
    detalhe.id = 'detalhe-personagem';
    detalhe.className = 'ficha-personagem';
    detalhe.innerHTML = '<p class="ficha-personagem-vazia">Selecione um personagem na lista.</p>';
    layout.appendChild(detalhe);

    principal.appendChild(layout);

    await this.recarregar();
  },

  async recarregar() {
    const lista = document.getElementById('lista-personagens');
    if (!lista) return;
    lista.innerHTML = '';

    let personagens;
    try {
      personagens = await Api.listarPersonagens(Campanha.ativa.id);
    } catch (erro) {
      lista.innerHTML = '<p class="mensagem-erro">Falha ao carregar os personagens.</p>';
      console.error(erro);
      return;
    }

    if (personagens.length === 0) {
      lista.innerHTML = '<p class="lista-personagens-vazia">Nenhum personagem importado ainda.</p>';
      return;
    }

    personagens.forEach((personagem) => lista.appendChild(this.criarCartaoLista(personagem)));
  },

  criarCartaoLista(personagem) {
    const cartao = document.createElement('button');
    cartao.type = 'button';
    cartao.className = 'cartao-personagem';
    cartao.addEventListener('click', () => this.exibirDetalhe(personagem.id, cartao));

    const nome = document.createElement('h4');
    nome.textContent = personagem.nome;
    cartao.appendChild(nome);

    const linha = document.createElement('p');
    linha.className = 'detalhes-quest';
    linha.textContent = `${personagem.raca} · ${personagem.classe} · Nível ${personagem.nivel}`;
    cartao.appendChild(linha);

    return cartao;
  },

  async exibirDetalhe(personagemId, cartaoSelecionado) {
    document.querySelectorAll('.cartao-personagem.selecionado').forEach((c) => c.classList.remove('selecionado'));
    if (cartaoSelecionado) {
      cartaoSelecionado.classList.add('selecionado');
    }

    const detalhe = document.getElementById('detalhe-personagem');
    detalhe.innerHTML = '<p class="carregando">Carregando…</p>';

    let personagem;
    try {
      personagem = await Api.obterPersonagem(Campanha.ativa.id, personagemId);
    } catch (erro) {
      detalhe.innerHTML = '<p class="mensagem-erro">Falha ao carregar a ficha.</p>';
      console.error(erro);
      return;
    }

    detalhe.innerHTML = '';

    const titulo = document.createElement('h3');
    titulo.textContent = personagem.nome;
    detalhe.appendChild(titulo);

    const subtitulo = document.createElement('p');
    subtitulo.className = 'detalhes-quest';
    subtitulo.textContent = `${personagem.raca} · ${personagem.classe} · Nível ${personagem.nivel}`;
    detalhe.appendChild(subtitulo);

    const destaques = document.createElement('div');
    destaques.className = 'destaques-ficha';
    [['PV', personagem.pv], ['CA', personagem.ca]].forEach(([rotulo, valor]) => {
      const destaque = document.createElement('span');
      destaque.className = 'destaque-ficha';
      destaque.textContent = `${rotulo} ${valor}`;
      destaques.appendChild(destaque);
    });
    detalhe.appendChild(destaques);

    const grade = document.createElement('div');
    grade.className = 'grade-atributos-ficha';
    Object.entries(NOMES_ATRIBUTOS_PERSONAGEM).forEach(([chave, rotulo]) => {
      const valor = personagem.atributos[chave];
      const item = document.createElement('div');
      item.className = 'item-atributo-ficha';
      const nomeAtributo = document.createElement('span');
      nomeAtributo.textContent = rotulo;
      const valorAtributo = document.createElement('strong');
      valorAtributo.textContent = `${valor} (${formatarComSinal(modificadorAtributo(valor))})`;
      item.appendChild(nomeAtributo);
      item.appendChild(valorAtributo);
      grade.appendChild(item);
    });
    detalhe.appendChild(grade);

    const tituloPericias = document.createElement('h4');
    tituloPericias.textContent = 'Perícias';
    detalhe.appendChild(tituloPericias);

    const listaPericias = document.createElement('ul');
    listaPericias.className = 'lista-pericias-ficha';
    if (personagem.pericias.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'Nenhuma perícia com proficiência.';
      listaPericias.appendChild(item);
    } else {
      personagem.pericias.forEach((pericia) => {
        const item = document.createElement('li');
        item.textContent = `${pericia.nome}: ${formatarComSinal(pericia.bonus)}`;
        listaPericias.appendChild(item);
      });
    }
    detalhe.appendChild(listaPericias);

    if (personagem.testesResistencia && personagem.testesResistencia.length > 0) {
      const tituloCombate = document.createElement('h4');
      tituloCombate.textContent = 'Combate';
      detalhe.appendChild(tituloCombate);

      const destaquesCombate = document.createElement('div');
      destaquesCombate.className = 'destaques-ficha';
      const statsCombate = [
        ['Iniciativa', personagem.iniciativa],
        ['Ataque For', personagem.bonusAtaqueForca],
        ['Ataque Des', personagem.bonusAtaqueDestreza],
      ];
      if (personagem.cdMagia !== null && personagem.cdMagia !== undefined) {
        statsCombate.push(['CD Magia', personagem.cdMagia]);
        statsCombate.push(['Ataque Mágico', personagem.bonusAtaqueMagico]);
      }
      statsCombate.forEach(([rotulo, valor]) => {
        const destaque = document.createElement('span');
        destaque.className = 'destaque-ficha';
        destaque.textContent = rotulo === 'CD Magia' ? `${rotulo} ${valor}` : `${rotulo} ${formatarComSinal(valor)}`;
        destaquesCombate.appendChild(destaque);
      });
      detalhe.appendChild(destaquesCombate);

      const tituloResistencias = document.createElement('h4');
      tituloResistencias.textContent = 'Testes de Resistência';
      detalhe.appendChild(tituloResistencias);

      const listaResistencias = document.createElement('ul');
      listaResistencias.className = 'lista-pericias-ficha';
      personagem.testesResistencia.forEach((teste) => {
        const item = document.createElement('li');
        const rotulo = NOMES_ATRIBUTOS_PERSONAGEM[teste.atributo] || teste.atributo;
        item.textContent = `${rotulo}${teste.proficiente ? ' (proficiente)' : ''}: ${formatarComSinal(teste.bonus)}`;
        listaResistencias.appendChild(item);
      });
      detalhe.appendChild(listaResistencias);
    }

    if (personagem.tracosRaciais && personagem.tracosRaciais.length > 0) {
      const tituloTracos = document.createElement('h4');
      tituloTracos.textContent = 'Traços Raciais';
      detalhe.appendChild(tituloTracos);

      const listaTracos = document.createElement('ul');
      listaTracos.className = 'lista-pericias-ficha';
      personagem.tracosRaciais.forEach((traco) => {
        const item = document.createElement('li');
        const negrito = document.createElement('strong');
        negrito.textContent = `${traco.nome}: `;
        item.appendChild(negrito);
        item.appendChild(document.createTextNode(traco.descricao));
        listaTracos.appendChild(item);
      });
      detalhe.appendChild(listaTracos);
    }

    if (personagem.habilidadesClasse && personagem.habilidadesClasse.length > 0) {
      const tituloHabilidades = document.createElement('h4');
      tituloHabilidades.textContent = 'Habilidades de Classe';
      detalhe.appendChild(tituloHabilidades);

      const listaHabilidades = document.createElement('ul');
      listaHabilidades.className = 'lista-pericias-ficha';
      personagem.habilidadesClasse.forEach((habilidade) => {
        const item = document.createElement('li');
        const negrito = document.createElement('strong');
        negrito.textContent = `${habilidade.nome}: `;
        item.appendChild(negrito);
        item.appendChild(document.createTextNode(habilidade.descricao));
        listaHabilidades.appendChild(item);
      });
      detalhe.appendChild(listaHabilidades);
    }

    if (personagem.magiasConhecidas && personagem.magiasConhecidas.length > 0) {
      const tituloMagias = document.createElement('h4');
      tituloMagias.textContent = 'Magias';
      detalhe.appendChild(tituloMagias);

      const criarListaMagias = (titulo, magias) => {
        if (magias.length === 0) return;
        const subtitulo = document.createElement('h5');
        subtitulo.textContent = titulo;
        detalhe.appendChild(subtitulo);

        const lista = document.createElement('ul');
        lista.className = 'lista-pericias-ficha';
        magias.forEach((magia) => {
          const item = document.createElement('li');
          const negrito = document.createElement('strong');
          negrito.textContent = `${magia.nome}: `;
          item.appendChild(negrito);

          const partesEfeito = [magia.escola, magia.alcance, magia.duracao];
          if (magia.dano) partesEfeito.push(magia.dano);
          if (magia.testeResistencia) partesEfeito.push(`Resistência: ${magia.testeResistencia}`);
          item.appendChild(document.createTextNode(partesEfeito.join(' · ')));

          lista.appendChild(item);
        });
        detalhe.appendChild(lista);
      };

      criarListaMagias('Cantrips', personagem.magiasConhecidas.filter((m) => m.circulo === 0));
      criarListaMagias('Magias de 1º Círculo', personagem.magiasConhecidas.filter((m) => m.circulo === 1));
    }

    if (personagem.historia) {
      const tituloHistoria = document.createElement('h4');
      tituloHistoria.textContent = 'História';
      detalhe.appendChild(tituloHistoria);
      const textoHistoria = document.createElement('p');
      textoHistoria.className = 'texto-livre-ficha';
      textoHistoria.textContent = personagem.historia;
      detalhe.appendChild(textoHistoria);
    }

    if (personagem.caracteristicasFisicas) {
      const tituloCaracteristicas = document.createElement('h4');
      tituloCaracteristicas.textContent = 'Características Físicas';
      detalhe.appendChild(tituloCaracteristicas);
      const textoCaracteristicas = document.createElement('p');
      textoCaracteristicas.className = 'texto-livre-ficha';
      textoCaracteristicas.textContent = personagem.caracteristicasFisicas;
      detalhe.appendChild(textoCaracteristicas);
    }
  },

  async importarArquivo(arquivo) {
    let texto;
    try {
      texto = await arquivo.text();
    } catch (erro) {
      window.alert('Falha ao ler o arquivo.');
      console.error(erro);
      return;
    }

    let dados;
    try {
      dados = JSON.parse(texto);
    } catch (erro) {
      window.alert('Arquivo inválido: não é um JSON válido.');
      return;
    }

    if (!dados.nome) {
      window.alert('Arquivo inválido: ficha sem nome de personagem.');
      return;
    }

    try {
      await Api.importarPersonagem(Campanha.ativa.id, dados);
    } catch (erro) {
      window.alert('Falha ao importar a ficha.');
      console.error(erro);
      return;
    }

    await this.recarregar();
  },
};
