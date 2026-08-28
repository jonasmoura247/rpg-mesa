// Renderizador de Markdown mínimo, específico para as notas da Costa da Travessia.
// Não é um parser completo de Markdown — cobre só o que aparece nas notas reais do
// vault: cabeçalhos, citações, listas, tabelas, negrito/itálico e wikilinks (limpos
// para texto simples, já que a navegação real acontece pela árvore lateral).
//
// Constrói nós DOM diretamente (nunca innerHTML com conteúdo dinâmico), seguindo o
// mesmo padrão de segurança usado em app.js e rolador.js.
const Markdown = {
  // Pula o primeiro H1 (já exibido como título da página) e qualquer tabela cujo
  // cabeçalho bata com um título em `titulosTabelasRolaveis` — essas já aparecem
  // como cards de rolagem interativos logo abaixo, mostrar de novo como texto cru
  // seria redundante.
  renderizar(markdown, titulosTabelasRolaveis) {
    const fragmento = document.createDocumentFragment();
    const linhas = (markdown || '').replace(/\r\n/g, '\n').split('\n');
    const titulosParaPular = new Set(titulosTabelasRolaveis || []);

    let primeiroH1Pulado = false;
    let i = 0;

    while (i < linhas.length) {
      const linha = linhas[i];

      if (!linha.trim()) {
        i++;
        continue;
      }

      const matchH1 = linha.match(/^#\s+(.+)$/);
      if (matchH1 && !primeiroH1Pulado) {
        primeiroH1Pulado = true;
        i++;
        continue;
      }

      const matchCabecalhoComDado = linha.match(/^#{1,6}\s+(.+?)\s*[—-]\s*\d+d\d+\b/);
      if (matchCabecalhoComDado && titulosParaPular.has(matchCabecalhoComDado[1].trim())) {
        i++;
        while (i < linhas.length && !/^#{1,6}\s/.test(linhas[i]) && linhas[i].trim() !== '---') {
          i++;
        }
        continue;
      }

      const matchCabecalho = linha.match(/^(#{1,6})\s+(.+)$/);
      if (matchCabecalho) {
        const nivel = Math.min(matchCabecalho[1].length + 1, 6);
        const elemento = document.createElement(`h${nivel}`);
        aplicarInline(elemento, matchCabecalho[2]);
        fragmento.appendChild(elemento);
        i++;
        continue;
      }

      if (linha.trim() === '---') {
        fragmento.appendChild(document.createElement('hr'));
        i++;
        continue;
      }

      if (linha.trim().startsWith('>')) {
        const bloco = document.createElement('blockquote');
        while (i < linhas.length && linhas[i].trim().startsWith('>')) {
          const paragrafo = document.createElement('p');
          aplicarInline(paragrafo, linhas[i].trim().replace(/^>\s?/, ''));
          bloco.appendChild(paragrafo);
          i++;
        }
        fragmento.appendChild(bloco);
        continue;
      }

      if (/^\s*[-*]\s+/.test(linha)) {
        const lista = document.createElement('ul');
        while (i < linhas.length && /^\s*[-*]\s+/.test(linhas[i])) {
          const item = document.createElement('li');
          aplicarInline(item, linhas[i].replace(/^\s*[-*]\s+/, ''));
          lista.appendChild(item);
          i++;
        }
        fragmento.appendChild(lista);
        continue;
      }

      if (/^\s*\d+\.\s+/.test(linha)) {
        const lista = document.createElement('ol');
        while (i < linhas.length && /^\s*\d+\.\s+/.test(linhas[i])) {
          const item = document.createElement('li');
          aplicarInline(item, linhas[i].replace(/^\s*\d+\.\s+/, ''));
          lista.appendChild(item);
          i++;
        }
        fragmento.appendChild(lista);
        continue;
      }

      if (/^\|.+\|\s*$/.test(linha)) {
        const linhasTabela = [];
        while (i < linhas.length && /^\|.+\|\s*$/.test(linhas[i])) {
          linhasTabela.push(linhas[i]);
          i++;
        }
        fragmento.appendChild(construirTabela(linhasTabela));
        continue;
      }

      const linhasParagrafo = [linha];
      i++;
      while (
        i < linhas.length &&
        linhas[i].trim() &&
        !/^#{1,6}\s/.test(linhas[i]) &&
        linhas[i].trim() !== '---' &&
        !linhas[i].trim().startsWith('>') &&
        !/^\s*[-*]\s+/.test(linhas[i]) &&
        !/^\s*\d+\.\s+/.test(linhas[i]) &&
        !/^\|.+\|\s*$/.test(linhas[i])
      ) {
        linhasParagrafo.push(linhas[i]);
        i++;
      }
      const paragrafo = document.createElement('p');
      aplicarInline(paragrafo, linhasParagrafo.join(' '));
      fragmento.appendChild(paragrafo);
    }

    return fragmento;
  },
};

function construirTabela(linhasTabela) {
  const tabela = document.createElement('table');
  tabela.className = 'tabela-markdown';
  const linhasDeDados = linhasTabela.filter((linha) => !/^\|[\s:|-]+\|\s*$/.test(linha));

  // Mesmo truque de escape do backend (ParserTabela): wikilinks em células usam '\|'
  // pra não quebrar a separação de colunas.
  const marcador = String.fromCharCode(1);

  linhasDeDados.forEach((linha, indice) => {
    const linhaEscapada = linha.replace(/\\\|/g, marcador);
    const celulasTexto = linhaEscapada
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((celula) => celula.split(marcador).join('|'));

    const linhaElemento = document.createElement('tr');
    celulasTexto.forEach((celula) => {
      const celulaElemento = document.createElement(indice === 0 ? 'th' : 'td');
      aplicarInline(celulaElemento, celula.trim());
      linhaElemento.appendChild(celulaElemento);
    });
    tabela.appendChild(linhaElemento);
  });

  return tabela;
}

// Aplica formatação inline básica (negrito, itálico, wikilinks limpos) a um elemento,
// sempre construindo nós de texto/elemento — nunca innerHTML.
function aplicarInline(elemento, texto) {
  const textoLimpo = texto.replace(
    /\[\[([^\]|\\#]+)(?:#[^\]|\\]*)?(?:\\?\|([^\]]+))?\]\]/g,
    (_, alvo, rotulo) => rotulo || alvo,
  );

  const partes = textoLimpo.split(/(\*\*.+?\*\*|__.+?__|\*.+?\*|_.+?_)/);

  partes.forEach((parte) => {
    if (!parte) {
      return;
    }
    if (/^\*\*.+\*\*$/.test(parte) || /^__.+__$/.test(parte)) {
      const forte = document.createElement('strong');
      forte.textContent = parte.slice(2, -2);
      elemento.appendChild(forte);
    } else if (/^\*.+\*$/.test(parte) || /^_.+_$/.test(parte)) {
      const enfase = document.createElement('em');
      enfase.textContent = parte.slice(1, -1);
      elemento.appendChild(enfase);
    } else {
      elemento.appendChild(document.createTextNode(parte));
    }
  });
}
