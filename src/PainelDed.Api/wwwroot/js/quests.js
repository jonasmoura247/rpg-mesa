const STATUS_QUEST = [
  { valor: 'disponivel', rotulo: 'Disponível' },
  { valor: 'andamento', rotulo: 'Em Andamento' },
  { valor: 'concluida', rotulo: 'Concluída' },
  { valor: 'expirada', rotulo: 'Expirada' },
];

const Quests = {
  async exibir() {
    const principal = document.getElementById('conteudo-principal');
    principal.innerHTML = '';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'cabecalho-nota';
    const titulo = document.createElement('h2');
    titulo.textContent = '📋 Quadro de Quests';
    cabecalho.appendChild(titulo);

    const botaoNova = document.createElement('button');
    botaoNova.className = 'botao-rolar';
    botaoNova.style.marginLeft = 'auto';
    botaoNova.textContent = '+ Nova Quest';
    botaoNova.addEventListener('click', () => this.abrirFormulario());
    cabecalho.appendChild(botaoNova);

    const botaoSortearGuilda = document.createElement('button');
    botaoSortearGuilda.className = 'botao-rolar';
    botaoSortearGuilda.textContent = '🎲 Sortear Desafios da Guilda';
    botaoSortearGuilda.addEventListener('click', () => this.abrirSorteioDesafiosGuilda());
    cabecalho.appendChild(botaoSortearGuilda);

    principal.appendChild(cabecalho);

    const mural = document.createElement('div');
    mural.id = 'mural-quests';
    mural.className = 'mural-quests';
    principal.appendChild(mural);

    await this.recarregar();
  },

  async recarregar() {
    const mural = document.getElementById('mural-quests');
    if (!mural) return;
    mural.innerHTML = '';

    let quests;
    try {
      quests = await Api.listarQuests(Campanha.ativa.id);
    } catch (erro) {
      mural.innerHTML = '<p class="mensagem-erro">Falha ao carregar as quests.</p>';
      console.error(erro);
      return;
    }

    STATUS_QUEST.forEach((status) => {
      const coluna = document.createElement('div');
      coluna.className = 'coluna-quests';

      const tituloColuna = document.createElement('h3');
      tituloColuna.textContent = status.rotulo;
      coluna.appendChild(tituloColuna);

      quests
        .filter((quest) => quest.status === status.valor)
        .forEach((quest) => coluna.appendChild(this.criarCartao(quest)));

      coluna.addEventListener('dragover', (evento) => {
        evento.preventDefault();
        coluna.classList.add('coluna-destacada');
      });

      coluna.addEventListener('dragleave', () => {
        coluna.classList.remove('coluna-destacada');
      });

      coluna.addEventListener('drop', async (evento) => {
        evento.preventDefault();
        coluna.classList.remove('coluna-destacada');

        const questId = evento.dataTransfer.getData('text/plain');
        const quest = quests.find((q) => q.id === questId);
        if (!quest || quest.status === status.valor) {
          return;
        }

        try {
          await Api.atualizarQuest(Campanha.ativa.id, questId, { ...quest, status: status.valor });
        } catch (erro) {
          console.error(erro);
          window.alert('Falha ao mover a quest.');
          return;
        }

        await this.recarregar();
      });

      mural.appendChild(coluna);
    });
  },

  criarCartao(quest) {
    const cartao = document.createElement('div');
    cartao.className = 'cartao-quest';

    cartao.draggable = true;
    cartao.addEventListener('dragstart', (evento) => {
      evento.dataTransfer.setData('text/plain', quest.id);
      evento.dataTransfer.effectAllowed = 'move';
      cartao.classList.add('cartao-sendo-arrastado');
    });
    cartao.addEventListener('dragend', () => {
      cartao.classList.remove('cartao-sendo-arrastado');
    });

    const titulo = document.createElement('h4');
    titulo.textContent = quest.titulo;
    cartao.appendChild(titulo);

    const descricao = document.createElement('p');
    // Descrições geradas por "Gerar ideia" podem trazer **negrito**/*itálico*
    // cru do vault — renderiza como formatação de verdade em vez de mostrar
    // os asteriscos literalmente (mesma lógica usada no corpo das notas).
    Markdown.aplicarInline(descricao, quest.descricao);
    cartao.appendChild(descricao);

    const detalhes = document.createElement('p');
    detalhes.className = 'detalhes-quest';
    detalhes.textContent = `Recompensa: ${quest.recompensa} · XP: ${quest.xpSugerido} · Semana ${quest.semana}`;
    cartao.appendChild(detalhes);

    if (quest.responsavel) {
      const responsavel = document.createElement('p');
      responsavel.className = 'detalhes-quest';
      responsavel.textContent = `Responsável: ${quest.responsavel}`;
      cartao.appendChild(responsavel);
    }

    const acoes = document.createElement('div');
    acoes.className = 'acoes-cartao-quest';

    const seletorStatus = document.createElement('select');
    STATUS_QUEST.forEach((status) => {
      const opcao = document.createElement('option');
      opcao.value = status.valor;
      opcao.textContent = status.rotulo;
      opcao.selected = status.valor === quest.status;
      seletorStatus.appendChild(opcao);
    });
    seletorStatus.addEventListener('change', async () => {
      try {
        await Api.atualizarQuest(Campanha.ativa.id, quest.id, { ...quest, status: seletorStatus.value });
      } catch (erro) {
        console.error(erro);
        window.alert('Falha ao atualizar o status da quest.');
        seletorStatus.value = quest.status;
        return;
      }
      await this.recarregar();
    });
    acoes.appendChild(seletorStatus);

    const botaoEditar = document.createElement('button');
    botaoEditar.className = 'botao-secundario';
    botaoEditar.textContent = 'Editar';
    botaoEditar.addEventListener('click', () => this.abrirFormulario(quest));
    acoes.appendChild(botaoEditar);

    const botaoRemover = document.createElement('button');
    botaoRemover.className = 'botao-secundario';
    botaoRemover.textContent = 'Remover';
    botaoRemover.addEventListener('click', async () => {
      if (!window.confirm(`Remover a quest "${quest.titulo}"?`)) {
        return;
      }
      try {
        await Api.removerQuest(Campanha.ativa.id, quest.id);
      } catch (erro) {
        console.error(erro);
        window.alert('Falha ao remover a quest.');
        return;
      }
      await this.recarregar();
    });
    acoes.appendChild(botaoRemover);

    cartao.appendChild(acoes);
    return cartao;
  },

  abrirFormulario(questExistente) {
    const fundo = document.createElement('div');
    fundo.className = 'fundo-modal';

    const modal = document.createElement('div');
    modal.className = 'modal-formulario';

    const titulo = document.createElement('h3');
    titulo.textContent = questExistente ? 'Editar Quest' : 'Nova Quest';
    modal.appendChild(titulo);

    const campoTitulo = criarCampoTexto('Título', questExistente?.titulo || '');
    const campoDescricao = criarCampoTextarea('Descrição', questExistente?.descricao || '');
    const campoRecompensa = criarCampoTexto('Recompensa', questExistente?.recompensa || '');
    const campoXp = criarCampoTexto('XP sugerido', questExistente?.xpSugerido ?? '0');
    const campoSemana = criarCampoTexto('Semana', questExistente?.semana ?? '1');
    const campoResponsavel = criarCampoTexto('Responsável (opcional)', questExistente?.responsavel || '');

    [campoTitulo, campoDescricao, campoRecompensa, campoXp, campoSemana, campoResponsavel].forEach((campo) =>
      modal.appendChild(campo.container),
    );

    const botaoGerarIdeia = document.createElement('button');
    botaoGerarIdeia.className = 'botao-secundario';
    botaoGerarIdeia.type = 'button';
    botaoGerarIdeia.textContent = '🎲 Gerar ideia';
    botaoGerarIdeia.addEventListener('click', async () => {
      let rascunho;
      try {
        rascunho = await Api.gerarIdeiaDeQuest(Campanha.ativa.id);
      } catch (erro) {
        console.error(erro);
        window.alert('Falha ao gerar ideia de quest.');
        return;
      }
      campoTitulo.entrada.value = rascunho.tituloSugerido;
      campoDescricao.entrada.value = rascunho.descricaoSugerida;
      campoXp.entrada.value = rascunho.xpSugerido;
      campoRecompensa.entrada.value = rascunho.recompensaSugerida;
    });
    modal.appendChild(botaoGerarIdeia);

    const acoes = document.createElement('div');
    acoes.className = 'acoes-modal';

    const botaoSalvar = document.createElement('button');
    botaoSalvar.className = 'botao-rolar';
    botaoSalvar.textContent = 'Salvar';
    botaoSalvar.addEventListener('click', async () => {
      const dados = {
        titulo: campoTitulo.entrada.value.trim(),
        descricao: campoDescricao.entrada.value.trim(),
        recompensa: campoRecompensa.entrada.value.trim(),
        xpSugerido: parseInt(campoXp.entrada.value, 10) || 0,
        semana: parseInt(campoSemana.entrada.value, 10) || 1,
        responsavel: campoResponsavel.entrada.value.trim() || null,
      };

      if (!dados.titulo) {
        window.alert('Título é obrigatório.');
        return;
      }

      try {
        if (questExistente) {
          await Api.atualizarQuest(Campanha.ativa.id, questExistente.id, { ...dados, status: questExistente.status });
        } else {
          await Api.criarQuest(Campanha.ativa.id, dados);
        }
      } catch (erro) {
        console.error(erro);
        window.alert('Falha ao salvar a quest.');
        return;
      }

      document.body.removeChild(fundo);
      await this.recarregar();
    });
    acoes.appendChild(botaoSalvar);

    const botaoCancelar = document.createElement('button');
    botaoCancelar.className = 'botao-secundario';
    botaoCancelar.textContent = 'Cancelar';
    botaoCancelar.addEventListener('click', () => document.body.removeChild(fundo));
    acoes.appendChild(botaoCancelar);

    modal.appendChild(acoes);
    fundo.appendChild(modal);
    document.body.appendChild(fundo);
  },

  async abrirSorteioDesafiosGuilda() {
    let rascunhos;
    try {
      rascunhos = await Api.sortearDesafiosGuilda(Campanha.ativa.id);
    } catch (erro) {
      console.error(erro);
      window.alert('Falha ao sortear desafios da guilda.');
      return;
    }

    const fundo = document.createElement('div');
    fundo.className = 'fundo-modal';

    const modal = document.createElement('div');
    modal.className = 'modal-formulario modal-sorteio-guilda';

    const titulo = document.createElement('h3');
    titulo.textContent = '🎲 Desafios da Guilda';
    modal.appendChild(titulo);

    const grade = document.createElement('div');
    grade.className = 'grade-sorteio-guilda';
    modal.appendChild(grade);

    rascunhos.forEach((rascunho) => {
      const card = this.criarCardRascunhoGuilda(rascunho, () => {
        grade.removeChild(card);
        if (grade.children.length === 0) {
          document.body.removeChild(fundo);
        }
      });
      grade.appendChild(card);
    });

    const botaoFechar = document.createElement('button');
    botaoFechar.className = 'botao-secundario';
    botaoFechar.textContent = 'Fechar';
    botaoFechar.addEventListener('click', () => document.body.removeChild(fundo));
    modal.appendChild(botaoFechar);

    fundo.appendChild(modal);
    document.body.appendChild(fundo);
  },

  criarCardRascunhoGuilda(rascunho, aoRemover) {
    const card = document.createElement('div');
    card.className = 'card-rascunho-guilda';

    const campoTitulo = criarCampoTexto('Título', rascunho.tituloSugerido);
    const campoDescricao = criarCampoTextarea('Descrição', rascunho.descricaoSugerida);
    const campoXp = criarCampoTexto('XP sugerido', rascunho.xpSugerido);
    const campoRecompensa = criarCampoTexto('Recompensa', rascunho.recompensaSugerida);
    const campoSemana = criarCampoTexto('Semana', '1');

    [campoTitulo, campoDescricao, campoXp, campoRecompensa, campoSemana].forEach((campo) =>
      card.appendChild(campo.container),
    );

    const acoes = document.createElement('div');
    acoes.className = 'acoes-modal';

    const botaoSalvar = document.createElement('button');
    botaoSalvar.className = 'botao-rolar';
    botaoSalvar.textContent = 'Salvar';
    botaoSalvar.addEventListener('click', async () => {
      const dados = {
        titulo: campoTitulo.entrada.value.trim(),
        descricao: campoDescricao.entrada.value.trim(),
        recompensa: campoRecompensa.entrada.value.trim(),
        xpSugerido: parseInt(campoXp.entrada.value, 10) || 0,
        semana: parseInt(campoSemana.entrada.value, 10) || 1,
        responsavel: null,
      };

      if (!dados.titulo) {
        window.alert('Título é obrigatório.');
        return;
      }

      try {
        await Api.criarQuest(Campanha.ativa.id, dados);
      } catch (erro) {
        console.error(erro);
        window.alert('Falha ao salvar o desafio.');
        return;
      }

      aoRemover();
      await this.recarregar();
    });
    acoes.appendChild(botaoSalvar);

    const botaoDescartar = document.createElement('button');
    botaoDescartar.className = 'botao-secundario';
    botaoDescartar.textContent = 'Descartar';
    botaoDescartar.addEventListener('click', () => aoRemover());
    acoes.appendChild(botaoDescartar);

    card.appendChild(acoes);
    return card;
  },
};

function criarCampoTexto(rotulo, valorInicial) {
  const container = document.createElement('label');
  container.className = 'campo-formulario';
  const textoRotulo = document.createElement('span');
  textoRotulo.textContent = rotulo;
  const entrada = document.createElement('input');
  entrada.type = 'text';
  entrada.value = valorInicial;
  container.appendChild(textoRotulo);
  container.appendChild(entrada);
  return { container, entrada };
}

function criarCampoTextarea(rotulo, valorInicial) {
  const container = document.createElement('label');
  container.className = 'campo-formulario';
  const textoRotulo = document.createElement('span');
  textoRotulo.textContent = rotulo;
  const entrada = document.createElement('textarea');
  entrada.rows = 4;
  entrada.value = valorInicial;
  container.appendChild(textoRotulo);
  container.appendChild(entrada);
  return { container, entrada };
}
