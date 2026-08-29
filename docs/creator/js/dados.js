(function (raiz) {
  const PERICIAS = [
    { nome: 'Atletismo', atributo: 'forca' },
    { nome: 'Acrobacia', atributo: 'destreza' },
    { nome: 'Furtividade', atributo: 'destreza' },
    { nome: 'Prestidigitacao', atributo: 'destreza' },
    { nome: 'Arcanismo', atributo: 'inteligencia' },
    { nome: 'Historia', atributo: 'inteligencia' },
    { nome: 'Investigacao', atributo: 'inteligencia' },
    { nome: 'Natureza', atributo: 'inteligencia' },
    { nome: 'Religiao', atributo: 'inteligencia' },
    { nome: 'Adestramento', atributo: 'sabedoria' },
    { nome: 'Intuicao', atributo: 'sabedoria' },
    { nome: 'Medicina', atributo: 'sabedoria' },
    { nome: 'Percepcao', atributo: 'sabedoria' },
    { nome: 'Sobrevivencia', atributo: 'sabedoria' },
    { nome: 'Atuacao', atributo: 'carisma' },
    { nome: 'Engano', atributo: 'carisma' },
    { nome: 'Intimidacao', atributo: 'carisma' },
    { nome: 'Persuasao', atributo: 'carisma' }
  ];

  const CUSTO_POINT_BUY = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const ORCAMENTO_PONTOS = 27;
  const ATRIBUTO_MINIMO = 8;
  const ATRIBUTO_MAXIMO = 15;

  const RACAS = [
    { nome: 'Humano', bonus: { forca: 1, destreza: 1, constituicao: 1, inteligencia: 1, sabedoria: 1, carisma: 1 },
      descricao: 'Adaptáveis e ambiciosos, os humanos são a raça mais numerosa e versátil, com um pouco de talento em tudo.',
      tracos: [
        { nome: 'Versátil', descricao: 'Fala, lê e escreve Comum e mais um idioma à escolha.' }
      ] },
    { nome: 'Anão da Colina', bonus: { constituicao: 2, sabedoria: 1 },
      descricao: 'Anões resistentes e perceptivos, com instintos aguçados forjados em sociedades subterrâneas antigas.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resiliência Anã', descricao: 'Vantagem em testes de resistência contra veneno, e resistência a dano de veneno.' },
        { nome: 'Treinamento de Combate Anão', descricao: 'Proficiência com machado de guerra, machadinha, martelo leve e malho.' },
        { nome: 'Perspicácia Anã', descricao: '+1 ponto de vida máximo para cada nível do personagem.' },
        { nome: 'Proficiência com Ferramentas', descricao: 'Proficiência com um tipo de ferramenta de artesão à escolha: ferreiro, cervejeiro ou pedreiro.' },
        { nome: 'Afinidade com a Pedra', descricao: 'Soma o dobro do bônus de proficiência em testes de História relacionados à origem de trabalhos em pedra, mesmo sem proficiência.' }
      ] },
    { nome: 'Anão da Montanha', bonus: { constituicao: 2, forca: 2 },
      descricao: 'Anões fortes e habituados à armadura pesada, vindos de fortalezas talhadas na rocha.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resiliência Anã', descricao: 'Vantagem em testes de resistência contra veneno, e resistência a dano de veneno.' },
        { nome: 'Treinamento de Combate Anão', descricao: 'Proficiência com machado de guerra, machadinha, martelo leve e malho.' },
        { nome: 'Treinamento com Armadura', descricao: 'Proficiência com armaduras leves e médias.' },
        { nome: 'Proficiência com Ferramentas', descricao: 'Proficiência com um tipo de ferramenta de artesão à escolha: ferreiro, cervejeiro ou pedreiro.' },
        { nome: 'Afinidade com a Pedra', descricao: 'Soma o dobro do bônus de proficiência em testes de História relacionados à origem de trabalhos em pedra, mesmo sem proficiência.' }
      ] },
    { nome: 'Elfo Alto', bonus: { destreza: 2, inteligencia: 1 },
      descricao: 'Elfos graciosos com afinidade natural pela magia arcana e memória precisa.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Sentidos Aguçados', descricao: 'Proficiência em Percepção.' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Transe', descricao: 'Não precisa dormir; medita profundamente por 4 horas ao dia para obter o mesmo benefício de um descanso longo.' },
        { nome: 'Truque Élfico', descricao: 'Conhece um truque (cantrip) de Magista à escolha.' },
        { nome: 'Treinamento com Armas Élficas', descricao: 'Proficiência com espada longa, espada curta, arco curto e arco longo.' }
      ] },
    { nome: 'Elfo da Floresta', bonus: { destreza: 2, sabedoria: 1 },
      descricao: 'Elfos ágeis e furtivos, criados entre as árvores, com sentidos aguçados para a natureza.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Sentidos Aguçados', descricao: 'Proficiência em Percepção.' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Transe', descricao: 'Não precisa dormir; medita profundamente por 4 horas ao dia para obter o mesmo benefício de um descanso longo.' },
        { nome: 'Passo Élfico', descricao: 'Deslocamento base de 10,5 metros.' },
        { nome: 'Máscara da Natureza', descricao: 'Pode tentar se esconder mesmo levemente obscurecido por folhagem, chuva forte, neve, névoa ou outro fenômeno natural.' },
        { nome: 'Treinamento com Armas Élficas', descricao: 'Proficiência com espada longa, espada curta, arco curto e arco longo.' }
      ] },
    { nome: 'Elfo Negro (Drow)', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Elfos de vida subterrânea, ágeis e carismáticos, acostumados à escuridão e à intriga.',
      tracos: [
        { nome: 'Visão no Escuro Superior', descricao: 'Enxerga no escuro até 36 metros.' },
        { nome: 'Sensibilidade à Luz do Sol', descricao: 'Desvantagem em testes de ataque e de Percepção baseados em visão sob luz solar direta.' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Magia Drow', descricao: 'Conhece o truque Luzes Dançantes; a partir do nível 3 pode lançar Fogo Feérico 1x/dia, e a partir do nível 5, Escuridão 1x/dia (Carisma como atributo de conjuração).' },
        { nome: 'Treinamento com Armas Drow', descricao: 'Proficiência com rapieira, espada curta e besta de mão.' }
      ] },
    { nome: 'Halfling Pés Leves', bonus: { destreza: 2, carisma: 1 },
      descricao: 'Pequenos e discretos, hábeis em passar despercebidos e fazer amizade com estranhos.',
      tracos: [
        { nome: 'Sortudo', descricao: 'Ao tirar 1 num d20 para um teste de ataque, de habilidade ou de resistência, pode rolar de novo e deve usar o novo resultado.' },
        { nome: 'Corajoso', descricao: 'Vantagem em testes de resistência contra ficar amedrontado.' },
        { nome: 'Agilidade Halfling', descricao: 'Pode se mover através do espaço de qualquer criatura de tamanho maior que o dele.' },
        { nome: 'Furtivo por Natureza', descricao: 'Pode tentar se esconder mesmo estando apenas atrás de uma criatura pelo menos um tamanho maior.' }
      ] },
    { nome: 'Halfling Robusto', bonus: { destreza: 2, constituicao: 1 },
      descricao: 'Halflings resistentes, com constituição mais forte que a média da sua raça.',
      tracos: [
        { nome: 'Sortudo', descricao: 'Ao tirar 1 num d20 para um teste de ataque, de habilidade ou de resistência, pode rolar de novo e deve usar o novo resultado.' },
        { nome: 'Corajoso', descricao: 'Vantagem em testes de resistência contra ficar amedrontado.' },
        { nome: 'Agilidade Halfling', descricao: 'Pode se mover através do espaço de qualquer criatura de tamanho maior que o dele.' },
        { nome: 'Resiliência Robusta', descricao: 'Vantagem em testes de resistência contra veneno, e resistência a dano de veneno.' }
      ] },
    { nome: 'Draconato', bonus: { forca: 2, carisma: 1 },
      descricao: 'Descendentes de dragões, orgulhosos e imponentes, com um sopro elemental herdado da linhagem.',
      tracos: [
        { nome: 'Ancestralidade Dracônica', descricao: 'Determina o tipo de dano da Arma de Sopro e a resistência a dano (ex: linhagem vermelha = fogo).' },
        { nome: 'Arma de Sopro', descricao: 'Como ação, expele energia destrutiva do tipo da ancestralidade (dano e área conforme o nível; teste de resistência de Constituição ou Destreza).' },
        { nome: 'Resistência a Dano', descricao: 'Resistência ao tipo de dano associado à ancestralidade dracônica.' }
      ] },
    { nome: 'Gnomo da Floresta', bonus: { inteligencia: 2, destreza: 1 },
      descricao: 'Gnomos curiosos e ágeis, com talento natural para ilusões e comunicação com pequenos animais.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Astúcia Gnômica', descricao: 'Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma contra magia.' },
        { nome: 'Ilusionista Natural', descricao: 'Conhece o truque Ilusão Menor (Inteligência como atributo de conjuração).' },
        { nome: 'Falar com Pequenos Animais', descricao: 'Consegue se comunicar de forma simples com bestas pequenas.' }
      ] },
    { nome: 'Gnomo das Rochas', bonus: { inteligencia: 2, constituicao: 1 },
      descricao: 'Gnomos inventivos e resistentes, hábeis com mecanismos e engenhocas.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Astúcia Gnômica', descricao: 'Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma contra magia.' },
        { nome: 'Conhecimento de Artífice', descricao: 'Soma o dobro do bônus de proficiência em testes de História relacionados a itens mágicos, mecanismos ou alquímicos, mesmo sem proficiência.' },
        { nome: 'Engenhoqueiro', descricao: 'Proficiência com ferramentas de ladrão e ferramentas de artesão (mecânico); pode construir pequenos autômatos.' }
      ] },
    { nome: 'Meio-Elfo', bonus: { carisma: 2 }, escolhaLivre: 2,
      descricao: 'Nascidos entre dois mundos, carismáticos e versáteis, sem se encaixar totalmente em nenhum dos dois.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Ancestral Feérico', descricao: 'Vantagem em testes de resistência contra ser enfeitiçado, e magia não pode colocá-lo para dormir.' },
        { nome: 'Versatilidade de Perícia', descricao: 'Ganha proficiência em duas perícias à escolha, além das concedidas pela classe.' }
      ] },
    { nome: 'Meio-Orc', bonus: { forca: 2, constituicao: 1 },
      descricao: 'Fortes e implacáveis em combate, com resistência notável e ímpeto selvagem.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resiliente e Implacável', descricao: 'Quando reduzido a 0 pontos de vida sem morrer instantaneamente, pode optar por ficar com 1 ponto de vida (1x por descanso longo).' },
        { nome: 'Intimidação Ameaçadora', descricao: 'Proficiência em Intimidação.' },
        { nome: 'Ataques Selvagens', descricao: 'Ao acertar um ataque corpo a corpo com crítico, rola um dado de dano adicional.' }
      ] },
    { nome: 'Tiefling', bonus: { carisma: 2, inteligencia: 1 },
      descricao: 'Marcados por uma herança infernal distante, carismáticos e frequentemente incompreendidos.',
      tracos: [
        { nome: 'Visão no Escuro', descricao: 'Enxerga no escuro até 18m como se fosse penumbra, e na penumbra como luz plena (sem cor).' },
        { nome: 'Resistência Infernal', descricao: 'Resistência a dano de fogo.' },
        { nome: 'Legado Infernal', descricao: 'Conhece o truque Taumaturgia; a partir do nível 3 pode lançar Repreensão Infernal 1x/dia, e a partir do nível 5, Escuridão 1x/dia (Carisma como atributo de conjuração).' }
      ] }
  ];

  const CLASSES = [
    { nome: 'Bárbaro', dadoDeVida: 12, escolhas: 2,
      descricao: 'Guerreiro que canaliza fúria primitiva em combate, resistente e devastador corpo a corpo.',
      atributoConjuracao: null, resistencias: ['forca', 'constituicao'],
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intimidacao', 'Natureza', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Bardo', dadoDeVida: 8, escolhas: 3, todasPericias: true, periciasElegiveis: [],
      descricao: 'Conjurador versátil que inspira aliados e desarma inimigos através de música, palavras e magia.',
      atributoConjuracao: 'carisma', resistencias: ['destreza', 'carisma'] },
    { nome: 'Bruxo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador que obtém poder através de um pacto com uma entidade sobrenatural.',
      atributoConjuracao: 'carisma', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Arcanismo', 'Engano', 'Historia', 'Intimidacao', 'Investigacao', 'Natureza', 'Religiao'] },
    { nome: 'Clérigo', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador divino que cura, protege e combate em nome de uma divindade ou ideal.',
      atributoConjuracao: 'sabedoria', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Historia', 'Intuicao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Druida', dadoDeVida: 8, escolhas: 2,
      descricao: 'Conjurador ligado à natureza, capaz de assumir formas animais e comandar os elementos.',
      atributoConjuracao: 'sabedoria', resistencias: ['inteligencia', 'sabedoria'],
      periciasElegiveis: ['Arcanismo', 'Adestramento', 'Intuicao', 'Medicina', 'Natureza', 'Percepcao', 'Religiao', 'Sobrevivencia'] },
    { nome: 'Feiticeiro', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador cujo poder mágico vem de uma origem inata, no sangue ou na alma.',
      atributoConjuracao: 'carisma', resistencias: ['constituicao', 'carisma'],
      periciasElegiveis: ['Arcanismo', 'Engano', 'Intuicao', 'Intimidacao', 'Persuasao', 'Religiao'] },
    { nome: 'Guerreiro', dadoDeVida: 10, escolhas: 2,
      descricao: 'Combatente versátil e treinado, mestre em armas e táticas de batalha.',
      atributoConjuracao: null, resistencias: ['forca', 'constituicao'],
      periciasElegiveis: ['Acrobacia', 'Adestramento', 'Atletismo', 'Historia', 'Intuicao', 'Intimidacao', 'Percepcao', 'Sobrevivencia'] },
    { nome: 'Ladino', dadoDeVida: 8, escolhas: 4,
      descricao: 'Especialista em furtividade, precisão e golpes certeiros contra alvos desprevenidos.',
      atributoConjuracao: null, resistencias: ['destreza', 'inteligencia'],
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Engano', 'Intuicao', 'Intimidacao', 'Investigacao', 'Percepcao', 'Persuasao', 'Prestidigitacao', 'Furtividade'] },
    { nome: 'Magista', dadoDeVida: 6, escolhas: 2,
      descricao: 'Conjurador erudito que domina a magia arcana através de estudo e um grimório pessoal.',
      atributoConjuracao: 'inteligencia', resistencias: ['inteligencia', 'sabedoria'],
      periciasElegiveis: ['Arcanismo', 'Historia', 'Intuicao', 'Investigacao', 'Medicina', 'Religiao'] },
    { nome: 'Monge', dadoDeVida: 8, escolhas: 2,
      descricao: 'Guerreiro disciplinado que canaliza energia interior em golpes rápidos e precisos.',
      atributoConjuracao: null, resistencias: ['forca', 'destreza'],
      periciasElegiveis: ['Acrobacia', 'Atletismo', 'Historia', 'Intuicao', 'Religiao', 'Furtividade'] },
    { nome: 'Paladino', dadoDeVida: 10, escolhas: 2,
      descricao: 'Guerreiro sagrado ligado por um juramento, combinando força marcial e magia divina.',
      atributoConjuracao: 'carisma', resistencias: ['sabedoria', 'carisma'],
      periciasElegiveis: ['Atletismo', 'Intuicao', 'Intimidacao', 'Medicina', 'Persuasao', 'Religiao'] },
    { nome: 'Patrulheiro', dadoDeVida: 8, escolhas: 3,
      descricao: 'Caçador e explorador habilidoso, especialista em rastreamento, sobrevivência e combate à distância.',
      atributoConjuracao: 'sabedoria', resistencias: ['forca', 'destreza'],
      periciasElegiveis: ['Adestramento', 'Atletismo', 'Intuicao', 'Investigacao', 'Natureza', 'Percepcao', 'Furtividade', 'Sobrevivencia'] }
  ];

  const api = { PERICIAS, CUSTO_POINT_BUY, ORCAMENTO_PONTOS, ATRIBUTO_MINIMO, ATRIBUTO_MAXIMO, RACAS, CLASSES };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    raiz.DADOS = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
