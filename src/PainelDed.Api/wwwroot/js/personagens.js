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

function criarSecaoFicha(icone, titulo) {
  const secao = document.createElement('div');
  secao.className = 'secao-ficha';
  const cabecalho = document.createElement('h4');
  cabecalho.textContent = `${icone} ${titulo}`;
  secao.appendChild(cabecalho);
  return secao;
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

    const xpLinha = document.createElement('p');
    xpLinha.className = 'chip-xp-cartao';
    xpLinha.textContent = `⭐ ${personagem.xp || 0} XP`;
    cartao.appendChild(xpLinha);

    return cartao;
  },

  criarBlocoXp(personagem) {
    const bloco = document.createElement('div');
    bloco.className = 'bloco-xp';

    const xpAtual = personagem.xp || 0;
    const baseNivel = Experiencia.xpNivelAtual(personagem.nivel);
    const proximoNivel = Experiencia.xpProximoNivel(personagem.nivel);

    const linhaTexto = document.createElement('p');
    linhaTexto.className = 'detalhes-quest';
    linhaTexto.textContent = proximoNivel === null
      ? `XP: ${xpAtual} (nível máximo)`
      : `XP: ${xpAtual}/${proximoNivel} (nível ${personagem.nivel})`;
    bloco.appendChild(linhaTexto);

    const trilho = document.createElement('div');
    trilho.className = 'trilho-xp';
    const preenchimento = document.createElement('div');
    preenchimento.className = 'preenchimento-xp';
    const progresso = proximoNivel === null
      ? 100
      : Math.min(100, Math.max(0, ((xpAtual - baseNivel) / (proximoNivel - baseNivel)) * 100));
    preenchimento.style.width = `${progresso}%`;
    trilho.appendChild(preenchimento);
    bloco.appendChild(trilho);

    if (proximoNivel !== null && xpAtual >= proximoNivel) {
      const aviso = document.createElement('p');
      aviso.className = 'aviso-nivel';
      aviso.textContent = '🎉 Pronto pra subir de nível!';
      bloco.appendChild(aviso);
    }

    const controleManual = document.createElement('div');
    controleManual.className = 'controle-xp-manual';
    const campoXp = document.createElement('input');
    campoXp.type = 'number';
    campoXp.placeholder = 'Quantidade de XP';
    const botaoAdicionar = document.createElement('button');
    botaoAdicionar.className = 'botao-secundario';
    botaoAdicionar.textContent = '+ Adicionar XP';
    botaoAdicionar.addEventListener('click', async () => {
      const quantidade = parseInt(campoXp.value, 10);
      if (!quantidade) return;
      botaoAdicionar.disabled = true;
      try {
        await Api.adicionarXp(Campanha.ativa.id, personagem.id, quantidade, 'manual (mestre)');
      } catch (erro) {
        console.error(erro);
        window.alert('Falha ao adicionar XP.');
        botaoAdicionar.disabled = false;
        return;
      }
      await this.exibirDetalhe(personagem.id);
      await this.recarregar();
    });
    controleManual.appendChild(campoXp);
    controleManual.appendChild(botaoAdicionar);
    bloco.appendChild(controleManual);

    return bloco;
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

    detalhe.appendChild(this.criarBlocoXp(personagem));

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

    const secaoPericias = criarSecaoFicha('🎯', 'Perícias');
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
    secaoPericias.appendChild(listaPericias);
    detalhe.appendChild(secaoPericias);

    if (personagem.testesResistencia && personagem.testesResistencia.length > 0) {
      const secaoCombate = criarSecaoFicha('🛡️', 'Combate');
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
      secaoCombate.appendChild(destaquesCombate);
      detalhe.appendChild(secaoCombate);

      const secaoResistencias = criarSecaoFicha('🎲', 'Testes de Resistência');
      const listaResistencias = document.createElement('ul');
      listaResistencias.className = 'lista-pericias-ficha';
      personagem.testesResistencia.forEach((teste) => {
        const item = document.createElement('li');
        const rotulo = NOMES_ATRIBUTOS_PERSONAGEM[teste.atributo] || teste.atributo;
        item.textContent = `${rotulo}${teste.proficiente ? ' (proficiente)' : ''}: ${formatarComSinal(teste.bonus)}`;
        listaResistencias.appendChild(item);
      });
      secaoResistencias.appendChild(listaResistencias);
      detalhe.appendChild(secaoResistencias);
    }

    if (personagem.tracosRaciais && personagem.tracosRaciais.length > 0) {
      const secaoTracos = criarSecaoFicha('🧬', 'Traços Raciais');
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
      secaoTracos.appendChild(listaTracos);
      detalhe.appendChild(secaoTracos);
    }

    if (personagem.habilidadesClasse && personagem.habilidadesClasse.length > 0) {
      const secaoHabilidades = criarSecaoFicha('⚔️', 'Habilidades de Classe');
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
      secaoHabilidades.appendChild(listaHabilidades);
      detalhe.appendChild(secaoHabilidades);
    }

    if (personagem.magiasConhecidas && personagem.magiasConhecidas.length > 0) {
      const secaoMagias = criarSecaoFicha('✨', 'Magias');

      const criarListaMagias = (subtituloTexto, magias, calcularSelo) => {
        if (magias.length === 0) return;
        const subtitulo = document.createElement('h5');
        subtitulo.textContent = subtituloTexto;
        secaoMagias.appendChild(subtitulo);

        const lista = document.createElement('ul');
        lista.className = 'lista-pericias-ficha';
        magias.forEach((magia) => {
          const item = document.createElement('li');
          const negrito = document.createElement('strong');
          negrito.textContent = `${magia.nome} `;
          item.appendChild(negrito);

          const badge = document.createElement('span');
          badge.className = 'etiqueta-dado';
          badge.textContent = calcularSelo(magia);
          item.appendChild(badge);

          const partesEfeito = [magia.escola, magia.alcance, magia.duracao];
          if (magia.dano) partesEfeito.push(magia.dano);
          if (magia.testeResistencia) partesEfeito.push(`Resistência: ${magia.testeResistencia}`);
          item.appendChild(document.createElement('br'));
          item.appendChild(document.createTextNode(partesEfeito.join(' · ')));

          lista.appendChild(item);
        });
        secaoMagias.appendChild(lista);
      };

      criarListaMagias('Cantrips', personagem.magiasConhecidas.filter((m) => m.circulo === 0), () => 'Uso ilimitado');
      criarListaMagias(
        'Magias de 1º Círculo',
        personagem.magiasConhecidas.filter((m) => m.circulo === 1),
        () => `${personagem.espacosMagia1 ?? '?'} usos — descanso longo`,
      );

      detalhe.appendChild(secaoMagias);
    }

    if (personagem.itens && personagem.itens.length > 0) {
      const secaoItens = criarSecaoFicha('🎒', 'Itens');
      const listaItens = document.createElement('ul');
      listaItens.className = 'lista-pericias-ficha';
      personagem.itens.forEach((nomeItem) => {
        const item = document.createElement('li');
        item.textContent = nomeItem;
        listaItens.appendChild(item);
      });
      secaoItens.appendChild(listaItens);
      detalhe.appendChild(secaoItens);
    }

    const secaoSideQuest = criarSecaoFicha('📜', 'Side Quest');
    const containerSideQuest = document.createElement('div');

    if (personagem.sideQuestAtual && personagem.sideQuestAtual.status === 'pendente') {
      const sq = personagem.sideQuestAtual;

      const linhaTitulo = document.createElement('p');
      const negrito = document.createElement('strong');
      negrito.textContent = `${sq.titulo} `;
      linhaTitulo.appendChild(negrito);
      linhaTitulo.appendChild(document.createTextNode(`(XP sugerido: ${sq.xpSugerido})`));
      containerSideQuest.appendChild(linhaTitulo);

      const descricao = document.createElement('p');
      descricao.className = 'texto-livre-ficha';
      descricao.textContent = sq.descricao;
      containerSideQuest.appendChild(descricao);

      const acoes = document.createElement('div');
      acoes.className = 'acoes-side-quest';

      const botaoConcluir = document.createElement('button');
      botaoConcluir.className = 'botao-rolar';
      botaoConcluir.textContent = '✅ Concluída';
      botaoConcluir.addEventListener('click', async () => {
        botaoConcluir.disabled = true;
        try {
          await Api.atualizarStatusSideQuest(Campanha.ativa.id, personagem.id, 'concluida');
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao atualizar a side quest.');
          return;
        }
        await this.exibirDetalhe(personagem.id);
        await this.recarregar();
      });
      acoes.appendChild(botaoConcluir);

      const botaoDescartar = document.createElement('button');
      botaoDescartar.className = 'botao-secundario';
      botaoDescartar.textContent = '❌ Descartar';
      botaoDescartar.addEventListener('click', async () => {
        botaoDescartar.disabled = true;
        try {
          await Api.atualizarStatusSideQuest(Campanha.ativa.id, personagem.id, 'descartada');
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao atualizar a side quest.');
          return;
        }
        await this.exibirDetalhe(personagem.id);
      });
      acoes.appendChild(botaoDescartar);

      containerSideQuest.appendChild(acoes);
    } else {
      const botaoSortear = document.createElement('button');
      botaoSortear.className = 'botao-rolar';
      botaoSortear.textContent = '🎲 Sortear Side Quest';
      botaoSortear.addEventListener('click', async () => {
        botaoSortear.disabled = true;
        try {
          await Api.sortearSideQuest(Campanha.ativa.id, personagem.id);
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao sortear side quest.');
          return;
        }
        await this.exibirDetalhe(personagem.id);
      });
      containerSideQuest.appendChild(botaoSortear);
    }

    secaoSideQuest.appendChild(containerSideQuest);
    detalhe.appendChild(secaoSideQuest);

    if (personagem.historia) {
      const secaoHistoria = criarSecaoFicha('📖', 'História');
      const textoHistoria = document.createElement('p');
      textoHistoria.className = 'texto-livre-ficha';
      textoHistoria.textContent = personagem.historia;
      secaoHistoria.appendChild(textoHistoria);
      detalhe.appendChild(secaoHistoria);
    }

    if (personagem.caracteristicasFisicas) {
      const secaoCaracteristicas = criarSecaoFicha('👤', 'Características Físicas');
      const textoCaracteristicas = document.createElement('p');
      textoCaracteristicas.className = 'texto-livre-ficha';
      textoCaracteristicas.textContent = personagem.caracteristicasFisicas;
      secaoCaracteristicas.appendChild(textoCaracteristicas);
      detalhe.appendChild(secaoCaracteristicas);
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
